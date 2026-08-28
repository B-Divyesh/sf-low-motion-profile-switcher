# Handoff — Low Motion Profile Switcher v1

Date: 2026-08-28  
Work order: `low-motion-profile-switcher-build-1`  
Artifact: WXT + TypeScript Manifest V3 extension and Vite static site

## What was built

- A real per-hostname motion policy with three settings:
  - **Gentle:** caps motion at 160 ms, transitions at 120 ms, and animation at
    one pass.
  - **Balanced:** settles animations to one effective frame and allows an 80 ms
    state-change cue.
  - **Still:** disables CSS animations and transitions.
- All profiles explicitly exclude ARIA status, progressbar, and live regions,
  plus native `progress` and `meter` elements and their descendants. Focus and
  cursor feedback are untouched.
- Autoplaying or looping audio/video is paused on initial load and when inserted
  later. Only media paused by the extension is marked and offered restoration.
- A one-click ten-minute motion exception can be ended early and automatically
  expires back to the selected profile.
- A keyboard-accessible, 370 px extension popup with enabled, loading,
  temporary, unavailable/protected-page, and storage-error states.
- Local-only settings through `chrome.storage.local`; no telemetry, remote
  configuration, accounts, or sensitive-input inspection.
- Responsive luminous-glass product site, static original hero artwork,
  privacy/terms pages, offline status, service-worker shell cache, sitemap,
  robots policy, and caching/security headers.
- Chromium extension package linked at
  `dist/site/downloads/low-motion-profile-switcher-chrome.zip`.

## Build outputs

Exact clean build command:

```sh
npm install
npm run build
```

Outputs:

- Static deployment root: `dist/site/` (`index.html` is at that root)
- Unpacked extension: `dist/extension/chrome-mv3/`
- Extension zip: `dist/packages/low-motion-profile-switcher-chrome.zip`
- Site download copy: `dist/site/downloads/low-motion-profile-switcher-chrome.zip`

Final package sizes:

- Extension zip: 80 KB
- Extension runtime JavaScript: 10.3 KB total
- Site initial JavaScript: 0.96 KB (0.51 KB gzip)
- Site CSS: 17.0 KB (4.56 KB gzip)
- Self-hosted fonts: 63.0 KB total
- Mobile hero: 11.3 KB AVIF / 21.9 KB WebP

## Verification

All checks ran successfully on 2026-08-28:

```sh
npm run check
npm test
npm run test:e2e
npm run build
npm audit
```

- TypeScript strict check: pass.
- Vitest: 7/7 unit tests pass.
- Loaded Chromium extension test: pass. It verifies a real MV3 content script
  stops decorative animation, preserves animation inside a status region,
  removes its policy for an active exception, and reports no serious/critical
  axe findings in the popup.
- Playwright: 10/10 tests pass across desktop Chromium and 390×844 mobile.
  Tests cover `/`, `/privacy/`, and `/terms/`, one-H1/landmark structure,
  console errors, axe, responsive overflow, offline status, downloads, and
  reduced motion.
- `npm audit`: 0 vulnerabilities.
- Clean build: pass; required static and extension artifacts present.

Lighthouse 12.8.2 mobile against the production build:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Largest Contentful Paint | 1.5 s |
| Cumulative Layout Shift | 0 |
| Total Blocking Time | 0 ms |

INP is not produced without user interaction in a lab navigation; 0 ms TBT and
the absence of main-thread tasks provide the lab proxy. The site was also
visually reviewed at 1440 px and 390 px.

## Artwork and licensing

The hero illustration is original AI-generated work produced with the factory
Azure OpenAI image deployment. The first crushed-black candidate was rejected;
the accepted source, exact prompt, and model provenance are in `assets/src/` and
`.factory/design.md`. Responsive AVIF/WebP derivatives are in
`site/public/assets/`. Interface marks and icons are hand-authored. Font notices
are in `THIRD_PARTY_NOTICES.md`.

## Known boundaries and next steps

- Browser-protected pages (`chrome://`, extension pages, and browser stores)
  cannot be modified and show a clear unavailable state.
- CSS animation, CSS transitions, and autoplay/looping media are covered.
  Pixel motion rendered inside canvas/WebGL, animated GIF/image files, and some
  security-isolated frames cannot be selectively frozen without destructive
  page replacement. This is disclosed in the README and terms.
- Preserved feedback is identified through explicit semantic HTML. Sites that
  omit status/progress semantics may have those custom animations settled; the
  temporary exception provides immediate recovery.
- The zip is unsigned. Factory/store publishing is the next distribution step;
  no DNS, infrastructure, billing, or store configuration was changed here.
- A useful post-launch follow-up is an opt-in local “was anything important
  lost?” counter to measure the brief's two-week success criterion without
  telemetry. It is intentionally not part of v1.
