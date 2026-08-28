import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist/extension',
  manifest: {
    name: 'Low Motion Profile Switcher',
    short_name: 'Low Motion',
    description: 'Per-site motion comfort profiles that keep useful status feedback visible.',
    version: '1.0.0',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
    homepage_url: 'https://low-motion-profile-switcher.sociobot.in',
    action: {
      default_title: 'Choose a low-motion profile',
    },
    icons: {
      16: 'icons/16.png',
      32: 'icons/32.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
  },
});
