import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const siteRoot = resolve('dist/site');

function startDisposableSite(): Promise<{ close: () => Promise<void>; url: string }> {
  const types: Record<string, string> = {
    '.avif': 'image/avif', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
    '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.woff2': 'font/woff2',
  };
  const server = createServer((request, response) => {
    try {
      const pathname = new URL(request.url ?? '/', 'http://fixture.local').pathname;
      let file = resolve(siteRoot, `.${pathname}`);
      if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
      if (!file.startsWith(`${siteRoot}/`)) throw new Error('Invalid path');
      response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
      response.end(readFileSync(file));
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not found');
    }
  });
  return new Promise((resolveReady) => server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Could not start disposable site');
    resolveReady({
      url: `http://127.0.0.1:${address.port}`,
      close: () => new Promise((resolveClosed) => {
        server.close(() => resolveClosed());
        server.closeAllConnections();
      }),
    });
  }));
}

for (const path of ['/', '/privacy/', '/terms/', '/404.html']) {
  test(`${path} has semantic structure and no serious accessibility violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Low Motion|Privacy|Terms/);
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('landing page remains within a 390px viewport and exposes the download', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('link', { name: /Download for Chromium/i })).toHaveAttribute('download', '');
});

test('visible interactive targets and descriptive copy meet the supplied size baseline', async ({ page }) => {
  await page.goto('/');
  const undersizedTargets = await page.locator('a, button, input, select, textarea').evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
    })
    .map((element) => {
      const box = element.getBoundingClientRect();
      return { text: element.textContent?.trim(), width: box.width, height: box.height };
    })
    .filter(({ width, height }) => width < 44 || height < 44));
  expect(undersizedTargets).toEqual([]);

  const copySelectors = ['.proof-strip strong', '.proof-strip span', '.steps p', '.profile-list article > p', '.profile-list li', '.privacy-callout p:last-child', '.site-footer > div > p'];
  const undersizedCopy = await page.locator(copySelectors.join(',')).evaluateAll((elements) => elements
    .map((element) => ({ text: element.textContent?.trim(), size: Number.parseFloat(getComputedStyle(element).fontSize) }))
    .filter(({ size }) => size < 16));
  expect(undersizedCopy).toEqual([]);
});

test('offline state is announced and reduced motion is honored', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByRole('status')).toContainText('offline');
  const behavior = await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior);
  expect(behavior).toBe('auto');
  await context.setOffline(false);
});

test('the production service worker updates and serves a controlled offline reload', async ({ page }) => {
  const fixture = await startDisposableSite();
  try {
    await page.goto(fixture.url);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.reload();
    expect(await page.evaluate(() => caches.keys())).toContain('low-motion-site-v3');
    await fixture.close();

    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('offline');
  } finally {
    await fixture.close();
  }
});
