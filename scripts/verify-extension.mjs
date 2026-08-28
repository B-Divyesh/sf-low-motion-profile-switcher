import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const extensionPath = resolve('dist/extension/chrome-mv3');
const profilePath = mkdtempSync(join(tmpdir(), 'low-motion-extension-'));
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html lang="en"><head><title>Motion fixture</title>
    <style>@keyframes pulse { to { transform: translateX(20px); } } .moving { animation: pulse 2s infinite; }</style>
    </head><body><main><h1>Motion fixture</h1><div id="noise" class="moving">Decoration</div>
    <div role="status"><span id="signal" class="moving">Saving</span></div></main></body></html>`);
});

await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not start fixture server');
const fixtureUrl = `http://127.0.0.1:${address.port}/`;

let context;
try {
  context = await chromium.launchPersistentContext(profilePath, {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let workers = context.serviceWorkers();
  if (!workers.length) workers = [await context.waitForEvent('serviceworker', { timeout: 10_000 })];
  const worker = workers[0];
  const extensionId = new URL(worker.url()).hostname;

  await worker.evaluate(async () => {
    await chrome.storage.local.set({ lowMotionSites: { '127.0.0.1': { enabled: true, profile: 'still' } } });
  });

  const page = await context.newPage();
  await page.goto(fixtureUrl);
  await page.waitForSelector('#low-motion-profile-switcher-policy', { state: 'attached' });
  const styles = await page.evaluate(() => ({
    noise: getComputedStyle(document.querySelector('#noise')).animationName,
    signal: getComputedStyle(document.querySelector('#signal')).animationName,
  }));
  if (styles.noise !== 'none') throw new Error(`Still profile did not stop decoration: ${styles.noise}`);
  if (styles.signal === 'none') throw new Error('Still profile hid preserved status feedback');

  await worker.evaluate(async () => {
    await chrome.storage.local.set({ lowMotionSites: { '127.0.0.1': { enabled: true, profile: 'still', allowUntil: Date.now() + 600_000 } } });
  });
  await page.waitForFunction(() => !document.querySelector('#low-motion-profile-switcher-policy'));

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const results = await new AxeBuilder({ page: popup }).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  if (serious.length) throw new Error(`Popup accessibility violations: ${serious.map((item) => item.id).join(', ')}`);
  console.log('Extension end-to-end policy, exception, and popup accessibility checks passed.');
} finally {
  await context?.close();
  server.close();
  rmSync(profilePath, { recursive: true, force: true });
}
