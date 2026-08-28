import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
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

for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
  test(`${path} has semantic structure and no serious accessibility violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Low Motion|Demo|Privacy|Terms/);
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('landing page remains within a 390px viewport and downloads an installable archive @claim:extension-download', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const downloadLink = page.getByRole('link', { name: /Download for Chromium/i });
  await expect(downloadLink).toHaveAttribute('download', '');
  const downloadPromise = page.waitForEvent('download');
  await downloadLink.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('low-motion-profile-switcher-chrome.zip');
  const temporaryPath = mkdtempSync(resolve(tmpdir(), 'low-motion-download-'));
  const archivePath = resolve(temporaryPath, download.suggestedFilename());
  try {
    await download.saveAs(archivePath);
    expect(readFileSync(archivePath).subarray(0, 2).toString()).toBe('PK');
    expect(execFileSync('unzip', ['-t', archivePath], { encoding: 'utf8' })).toContain('testing: manifest.json');
  } finally {
    rmSync(temporaryPath, { recursive: true, force: true });
  }
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

test('offline state is announced after the first visit and reduced motion is honored @claim:offline-after-first-visit', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByRole('status')).toContainText('offline');
  const behavior = await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior);
  expect(behavior).toBe('auto');
  await context.setOffline(false);
});

test('demo uses a separate storage namespace and reset removes only sample state @claim:demo-sandbox', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('.demo-banner')).toContainText('Demo — sample data, nothing is saved');
  await page.getByRole('radio', { name: /Gentle/i }).click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['demo:low-motion-profile-switcher']);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await expect(page.locator('#demo-state')).toContainText('Demo reset');
});

test('demo profile controls settle decoration and preserve sample order status @claim:demo-profiles', async ({ page }) => {
  await page.goto('/demo/');
  const noise = page.locator('.demo-noise');
  const status = page.locator('.sample-status i');
  await page.getByRole('radio', { name: /Still/i }).click();
  await expect(page.locator('#demo-state')).toContainText('Still is active');
  expect(await noise.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  expect(await status.evaluate((element) => getComputedStyle(element).animationName)).toBe('demo-status');
});

test('demo temporary exception restores decorative motion without changing its saved profile @claim:demo-exception', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('radio', { name: /Still/i }).click();
  await page.getByRole('button', { name: 'Allow motion for 10 minutes' }).click();
  await expect(page.locator('#demo-state')).toContainText('Motion is allowed temporarily');
  expect(await page.locator('.demo-noise').evaluate((element) => getComputedStyle(element).animationName)).toBe('demo-drift');
  await page.getByRole('button', { name: 'End temporary exception' }).click();
  await expect(page.locator('#demo-state')).toContainText('Still is active');
});

test('demo makes only same-origin requests and never uses a real-data key @claim:demo-local-first', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await page.getByRole('radio', { name: /Gentle/i }).click();
  const origin = new URL(page.url()).origin;
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).every((key) => key.startsWith('demo:')))).toBe(true);
});

test('demo controls work with keyboard and expose a visible focus indicator', async ({ page }) => {
  await page.goto('/demo/');
  const gentle = page.getByRole('radio', { name: /Gentle/i });
  await gentle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /Balanced/i })).toBeFocused();
  await expect(page.locator('#demo-state')).toContainText('Balanced is active');
  const outline = await page.getByRole('radio', { name: /Balanced/i }).evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(Number.parseFloat(outline)).toBeGreaterThanOrEqual(3);
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
