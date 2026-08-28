import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('assets/src/signal-landscape-v2.png');
const output = resolve('site/public/assets');
mkdirSync(output, { recursive: true });

await sharp(source)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(output, 'social-preview.png'));

await sharp(source)
  .resize(180, 180, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(output, 'apple-touch-icon.png'));
