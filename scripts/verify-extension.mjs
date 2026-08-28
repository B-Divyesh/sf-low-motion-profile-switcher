import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const extensionPath = resolve(process.env.EXTENSION_PATH ?? 'dist/extension/chrome-mv3');
const profilePath = mkdtempSync(join(tmpdir(), 'low-motion-extension-'));
const wav = (() => {
  const sampleRate = 8_000;
  const sampleCount = sampleRate * 2;
  const buffer = Buffer.alloc(44 + sampleCount, 128);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + sampleCount, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(sampleCount, 40);
  return buffer;
})();

const server = createServer((request, response) => {
  if (request.url === '/tone.wav') {
    setTimeout(() => {
      response.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': wav.length });
      response.end(wav);
    }, 150);
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html lang="en"><head><title>Motion fixture</title>
    <style>@keyframes pulse { to { transform: translateX(20px); } } .moving { animation: pulse 2s infinite; }</style>
    </head><body><main><h1>Motion fixture</h1><div id="noise" class="moving">Decoration</div>
    <div role="status"><span id="signal" class="moving">Saving</span><audio id="status-media" autoplay loop src="/tone.wav"></audio></div>
    <audio id="parser-media" autoplay loop src="/tone.wav"></audio>
    <audio id="manual-media" src="/tone.wav"></audio></main>
    <script>setTimeout(() => {
      const media = document.createElement('audio');
      media.id = 'dynamic-media';
      media.autoplay = true;
      media.loop = true;
      media.src = '/tone.wav';
      document.body.append(media);
    }, 250);</script></body></html>`);
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
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
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

  await page.waitForSelector('#dynamic-media', { state: 'attached' });
  await page.waitForTimeout(700);
  const activeMedia = await page.evaluate(() => Object.fromEntries(
    ['parser-media', 'dynamic-media', 'status-media'].map((id) => {
      const media = document.querySelector(`#${id}`);
      return [id, {
        paused: media.paused,
        marked: media.hasAttribute('data-low-motion-paused'),
        currentTime: media.currentTime,
      }];
    }),
  ));
  for (const id of ['parser-media', 'dynamic-media']) {
    if (!activeMedia[id].paused || !activeMedia[id].marked) {
      throw new Error(`Remembered profile did not pause ${id}: ${JSON.stringify(activeMedia[id])}`);
    }
  }
  if (activeMedia['status-media'].paused || activeMedia['status-media'].marked) {
    throw new Error(`Preserved status media was paused: ${JSON.stringify(activeMedia['status-media'])}`);
  }

  await page.evaluate(() => document.querySelector('#manual-media').play());
  await page.waitForTimeout(150);
  if (await page.locator('#manual-media').evaluate((media) => media.paused)) {
    throw new Error('Ordinary media without autoplay or loop was paused');
  }

  await worker.evaluate(async () => {
    await chrome.storage.local.set({ lowMotionSites: { '127.0.0.1': { enabled: true, profile: 'still', allowUntil: Date.now() + 600_000 } } });
  });
  await page.waitForFunction(() => !document.querySelector('#low-motion-profile-switcher-policy'));
  await page.waitForFunction(() => ['parser-media', 'dynamic-media'].every((id) => {
    const media = document.querySelector(`#${id}`);
    return !media.paused && !media.hasAttribute('data-low-motion-paused');
  }));

  await worker.evaluate(async () => {
    await chrome.storage.local.set({ lowMotionSites: { '127.0.0.1': { enabled: true, profile: 'still', allowUntil: Date.now() + 250 } } });
  });
  await page.waitForFunction(() => document.querySelector('#low-motion-profile-switcher-policy'), null, { timeout: 2_000 });
  await page.waitForFunction(() => ['parser-media', 'dynamic-media'].every((id) => {
    const media = document.querySelector(`#${id}`);
    return media.paused && media.hasAttribute('data-low-motion-paused');
  }));

  await worker.evaluate(async () => {
    await chrome.storage.local.set({ lowMotionSites: { '127.0.0.1': { enabled: false, profile: 'still' } } });
  });
  await page.waitForFunction(() => !document.querySelector('#low-motion-profile-switcher-policy'));
  await page.waitForFunction(() => ['parser-media', 'dynamic-media'].every((id) => {
    const media = document.querySelector(`#${id}`);
    return !media.paused && !media.hasAttribute('data-low-motion-paused');
  }));

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const results = await new AxeBuilder({ page: popup }).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  if (serious.length) throw new Error(`Popup accessibility violations: ${serious.map((item) => item.id).join(', ')}`);
  const undersizedPopupTargets = await popup.locator('a, button, label.switch, .profiles label').evaluateAll((elements) => elements
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
  if (undersizedPopupTargets.length) throw new Error(`Popup targets below 44px: ${JSON.stringify(undersizedPopupTargets)}`);
  console.log('Extension end-to-end policy, exception, and popup accessibility checks passed.');
} finally {
  await context?.close();
  server.close();
  rmSync(profilePath, { recursive: true, force: true });
}
