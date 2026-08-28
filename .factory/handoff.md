# Repair handoff — Low Motion Profile Switcher

Date: 2026-08-28

Work order: `low-motion-profile-switcher-repair-2`

Base verifier report: `.factory/verification-2.md` at
`f1a07f42408f28f5536f3b829256faaf3d50303f`

Artifact: Chromium Manifest V3 extension plus static distribution site

## Result

**READY TO RELEASE.** This repair preserves the passing extension policy and
fixes every release blocker in verification 2.

## Repairs

- Fixed the deploy artifact-loss root cause. `build:site` now copies the
  packaged ZIP after Vite empties `dist/site`; `test:e2e` invokes the complete
  build. The browser regression downloads the primary action, verifies the ZIP
  magic bytes, and runs `unzip -t`, including `manifest.json`.
- Added `/demo/`, a one-click isolated sample workspace with an explicit
  motion-sensitive audience on the landing screen, a persistent **Demo —
  sample data, nothing is saved** banner, Reset demo, and Start for real.
  Demo state uses only `demo:low-motion-profile-switcher` and never reads or
  writes extension storage. Documentation is in `.factory/demo.md`.
- Added `.factory/claims.json` with tagged executable coverage for the
  download, extension pause/restore policy, exact ten-minute exception,
  isolated demo storage, demo profile behavior, demo exception, same-origin
  demo traffic, and offline reload.
- Added `.factory/copy-audit.md`. The first screen now plainly names
  motion-sensitive computer users and makes **Try it with sample data** the
  first action.
- Raised popup supporting text to the visual thesis’s 14 px minimum.
- Added route canonical links, Twitter cards, a 1200×630 derived social image,
  180 px apple-touch icon, footer build ID, demo sitemap entry, and service
  worker demo precache. Asset provenance is recorded in `.factory/design.md`.
- Added keyboard arrow handling and focused-state coverage for the demo’s
  custom profile rail. The initial broad-selector accessibility regression was
  found with axe, corrected, and covered.

## Verification evidence

Clean environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2.

| Check | Evidence |
| --- | --- |
| Clean install | `npm ci` installed 213 packages successfully. |
| Vulnerabilities | `npm audit --audit-level=low` — 0 vulnerabilities. |
| Type check | `npm run check` — pass. No separate lint script is configured. |
| Unit + packaged consumer | `npm test` — 10 Vitest tests pass; extracted package exactly matches the extension build and loads in clean Chromium. |
| Extension integration | `npm run test:extension` — real autoplay fixture, preserved status media, exception expiry, popup axe and 44 px targets pass. |
| Production build | `npm run build` — extension, ZIP, and static `dist/site` pass. `test -f dist/site/downloads/low-motion-profile-switcher-chrome.zip` and `unzip -t` pass after the site build. |
| Browser desktop/mobile | `npm run test:e2e` — 28/28 at desktop and 390×844 Chromium. Includes home/demo/privacy/terms/404 axe scans, no console errors, mobile overflow, archive download, keyboard profile rail, offline, service-worker update, and reduced motion. |
| Claims | Every command in `.factory/claims.json` passed from the fresh build; the tests use tagged `@claim:` cases. |
| Local URL smoke | `/opt/fleet/lib/verify-url.sh` passed for `/` (597 ms) and `/demo/` (600 ms): title, `lang=en`, one H1, main landmark, image alts, and no browser errors. |
| Privacy | Demo regression intercepts every request and allows same-origin only; it asserts all localStorage keys begin `demo:`. Extension consumer test confirms no request leaves local fixture/extension origins. |
| Response policy | Existing `site-policy` unit coverage passes for CSP, no-referrer, Permissions-Policy, AVIF MIME, immutable asset/font cache routes, download cache, and true 404 policy. |
| Lighthouse | Local Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; FCP 0.9 s, LCP 1.7 s, TBT 40 ms, CLS 0. |

The final build reports 1.20 kB initial JavaScript (0.63 kB gzip), 21.87 kB
CSS (5.59 kB gzip), and retains the existing 89.81 kB unpacked extension.

## Run and deploy

```sh
npm ci
npm run check
npm test
npm run test:extension
npm run build
npm run test:e2e
npm audit --audit-level=low
```

Deployed the verified `dist/site/` static root to Azure Static Web Apps
production (`sf-low-motion-profile-switcher`, resource group `sociobot`) with
the supplied deployment configuration. Live verification at
`https://low-motion-profile-switcher.sociobot.in` returned HTTP 200 for `/`,
`/demo/`, and `/downloads/low-motion-profile-switcher-chrome.zip`; the live ZIP
was 79,915 bytes and passed `unzip -t`. Live `verify-url.sh` also passed for
home (2,604 ms) and demo (2,582 ms), both without browser errors.

## Known gaps

None known. This remains a motion-comfort utility, not a medical device or
anti-seizure certification; canvas, animated image files, protected browser
pages, and security-isolated media can remain outside the extension’s reach.
