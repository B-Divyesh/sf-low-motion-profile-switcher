import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const packagePath = resolve('dist/packages/low-motion-profile-switcher-chrome.zip');
const buildPath = resolve('dist/extension/chrome-mv3');
const temporaryPath = mkdtempSync(join(tmpdir(), 'low-motion-package-'));

try {
  execFileSync('unzip', ['-q', packagePath, '-d', temporaryPath]);
  execFileSync('diff', ['-qr', buildPath, temporaryPath], { stdio: 'inherit' });
  execFileSync(process.execPath, ['scripts/verify-extension.mjs'], {
    env: { ...process.env, EXTENSION_PATH: temporaryPath },
    stdio: 'inherit',
  });
  console.log('Packaged extension matches the build and passes the loaded-consumer checks.');
} finally {
  rmSync(temporaryPath, { recursive: true, force: true });
}
