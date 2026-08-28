# Low Motion Profile Switcher

Low Motion is a free, open-source Chromium extension for motion-sensitive web
users. It applies a remembered comfort profile to each site you choose, pauses
decorative autoplay and looping media, and keeps explicit progress, live status,
focus, and state feedback available.

Live site: <https://low-motion-profile-switcher.sociobot.in>

## What it does

- **Gentle** shortens transitions and runs animations once.
- **Balanced** settles animation loops while keeping a brief state-change cue.
- **Still** disables CSS animation and transitions except in explicit status,
  progress, live-region, `progress`, and `meter` elements.
- Pauses autoplaying or looping video/audio, including media inserted later.
- Restores media that it paused when you turn a profile off.
- Allows a one-click, ten-minute motion exception, then resumes automatically.
- Stores profile choices locally by hostname. There are no accounts, analytics,
  remote rules, or browsing-history uploads.

Low Motion is a comfort utility, not a medical device or anti-seizure
certification. Canvas animation, animated image files, protected browser pages,
and media in security-isolated contexts may remain unaffected.

## Run locally

Requires Node.js 20+ and `zip`.

```sh
npm install
npm run dev          # WXT extension development mode
npm run dev:site     # landing site at the printed local URL
```

To load the extension during development, open `chrome://extensions`, enable
Developer mode, choose **Load unpacked**, and select the WXT output directory
shown in the terminal.

## Test and build

```sh
npm run check
npm test
npm run build
npm run test:e2e
```

`npm run build` is the reproducible factory build command. It produces:

- `dist/extension/chrome-mv3/` — unpacked MV3 extension
- `dist/packages/low-motion-profile-switcher-chrome.zip` — installable package
- `dist/site/` — static deployment root, including `index.html`, `/privacy/`,
  `/terms/`, and the packaged extension at `/downloads/`

The Playwright suite uses Chromium 1.58.2 and checks the landing, privacy, and
terms pages at desktop and 390 px mobile widths, including axe accessibility,
console errors, semantic structure, offline messaging, and reduced motion.

## Architecture and privacy

WXT builds a Manifest V3 content script and popup in TypeScript. A small Vite
site explains and distributes the extension. The content script injects only a
style policy and pauses qualifying media; it never inspects or changes form
values. Site settings use `chrome.storage.local`. All fonts and assets ship with
the product, and there are no third-party runtime requests.

See [the researched brief](.factory/brief.json), [visual system](.factory/design.md),
[privacy policy](site/privacy/index.html), and [terms](site/terms/index.html).

## License

MIT © 2026 Sociobot (Param Factory). Generated illustration provenance is
recorded in `.factory/design.md` and `assets/src/`.
