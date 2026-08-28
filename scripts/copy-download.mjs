import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const downloads = resolve('dist/site/downloads');
mkdirSync(downloads, { recursive: true });
copyFileSync(resolve('dist/packages/low-motion-profile-switcher-chrome.zip'), resolve(downloads, 'low-motion-profile-switcher-chrome.zip'));
