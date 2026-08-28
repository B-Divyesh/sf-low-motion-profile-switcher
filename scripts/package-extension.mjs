import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const extensionDir = resolve('dist/extension/chrome-mv3');
const packageDir = resolve('dist/packages');
const output = resolve(packageDir, 'low-motion-profile-switcher-chrome.zip');
mkdirSync(packageDir, { recursive: true });
rmSync(output, { force: true });
execFileSync('zip', ['-q', '-r', output, '.'], { cwd: extensionDir });
