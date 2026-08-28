# Repair handoff — Low Motion Profile Switcher

Date: 2026-08-28

Work order: `low-motion-profile-switcher-repair-1`

Verifier report: `90d571e2c862c7aeb53822b32d61cdc87901e783`

Tested candidate: `0b8f71dc3b919388e3fe753320614af7ad06485b`

Artifact: WXT + TypeScript Manifest V3 extension and Vite static site

## Result

**PASS.** Every defect recorded in `.factory/verification.md` was reproduced or
confirmed against the candidate, repaired at its root cause, and given exact
regression coverage. The original browser-extension artifact and static
deployment class are unchanged.

## Repairs

- Fixed the release-blocking autoplay race. An active content policy now
  captures `play` and `playing` events, retries enforcement when delayed media
  actually starts, and can apply directly to the event's media element.
  Enforcement listeners are removed before marked media is restored, so
  disable and temporary-exception flows remain reversible.
- Expanded the packaged-extension consumer test to use delayed valid WAV media
  and cover parser-created autoplay, dynamically inserted autoplay, preserved
  status media, ordinary user-started media, exception start, exception expiry,
  disable, and restoration of only extension-marked media.
- Added ZIP consumer verification: extract the built package, recursively
  compare it with the unpacked extension, then load the extracted package in
  Chromium and run the extension checks against it.
- Raised the verifier-identified site and popup targets to at least 44×44 CSS
  px and raised substantial site copy to the supplied 16 px baseline. Browser
  regressions measure the resulting geometry at desktop and 390 px.
- Added Azure Static Web Apps response configuration for one-year immutable
  hashed-asset/font caching, one-hour download caching, AVIF MIME, CSP,
  Permissions-Policy, no-referrer, and nosniff.
- Removed SPA fallback behavior and added an accessible product-specific 404
  page that is returned with HTTP 404.
- Upgraded the service worker to cache v3, precache full shell dependencies,
  replace old caches, update immediately, use network-first navigation, and
  provide a working, announced offline shell. The regression shuts down a real
  fixture server before reloading rather than only dispatching an event.
- Made `build:site` clear stale site assets while preserving the extension and
  package outputs. Browser projects run serially to avoid an intermittent
  preinstalled-Chromium parallel-process crash in this worker image.

## Regression coverage

- `tests/unit/motion-policy.test.ts`: delayed-start media enforcement.
- `scripts/verify-extension.mjs`: real initial/dynamic autoplay and reversible
  lifecycle, preserved/manual media, popup axe, and popup target sizing.
- `scripts/verify-package.mjs`: extracted-package identity and loaded consumer.
- `tests/unit/site-policy.test.ts`: exact cache, security, MIME, and 404 config.
- `tests/e2e/site.spec.ts`: desktop and 390 px semantics, axe, target/copy size,
  404, reduced motion, update, and controlled offline reload.

## Clean local verification

Run from `/work/repo`:

```sh
npm ci
npm run check
npm test
npm run build
npm run test:e2e
npm audit --audit-level=low
```

Results:

- Clean install: 213 packages installed; 214 audited; 0 vulnerabilities.
- Strict TypeScript check: pass. No separate lint tool is configured.
- Vitest: 10/10 tests in 3 files pass.
- Packaged extension: extracted tree exactly matches the unpacked build; loaded
  Chromium media/policy/exception/accessibility/target checks pass.
- Playwright 1.58.2: 16/16 desktop and 390×844 tests pass.
- Production build: pass; `dist/extension/chrome-mv3`, extension ZIP, and
  `dist/site` produced.
- Site JS: 1,200 B; CSS: 17,368 B; fonts: 62,964 B; mobile AVIF: 11,281 B;
  extension ZIP: 79,920 B. All are within the supplied budgets.
- Local Lighthouse 12.8.2: 100 performance / 100 accessibility / 100 best
  practices / 100 SEO; LCP 1,515 ms, TBT 0 ms, CLS 0.

## Deployment and live verification

Deployed with:

```sh
/opt/fleet/lib/deploy-static.sh low-motion-profile-switcher dist/site
```

Final Azure deployment ID: `73d9ac6b-0726-492e-a610-1540d4f8281c`

Live URL: <https://low-motion-profile-switcher.sociobot.in>

- Factory `verify-url.sh`: pass; HTTP 200, title/lang/main/alt checks pass, no
  page or console errors.
- Live Lighthouse 12.8.2: 100/100/100/100; FCP 889 ms, LCP 1,268 ms, TBT 0 ms,
  CLS 0, total transfer 83,667 B.
- Live axe: zero violations on home, privacy, terms, and 404 at 1440×1000 and
  390×844; one H1/main, no overflow, no missing alt text.
- Keyboard: skip link is first and has a visible 3 px focus outline. Reduced
  motion yields auto scrolling and zero non-zero transitions.
- Privacy: every observed request is same-origin; 0 cookies, 0 localStorage,
  0 sessionStorage, no analytics, telemetry, accounts, or remote product API.
- Service worker: `/sw.js` active; `low-motion-site-v3` cache present; controlled
  offline reload passes locally against a server that is actually stopped.
- Response policy: hashed JS/CSS and fonts return
  `max-age=31536000, immutable`; ZIP returns `max-age=3600`; AVIF returns
  `image/avif`; CSP, Permissions-Policy, no-referrer, and nosniff are present.
  An unknown live route returns the custom page with HTTP 404.
- Live HTML, legal pages, 404, service worker, and ZIP are byte-identical to the
  final build. Final SHA-256 identities:
  - index: `15c105bd1995862c75e174ef33509602ee3de587f9a6fcd5342b5a6762a63306`
  - privacy: `9442880306c08bff2be2201c049ef112dfc4f702bfc03ece17b52ccf19f199e7`
  - terms: `0977de8ddaabf2a2f05ba31556a022aeeeda85efb489cb83ec1b52efe5e8e302`
  - 404: `20fc87d57e358ed6caf9eab4cf906b63ff8a3a388e4f1eb3d65d6d0297485472`
  - service worker: `bcd099ccd4ca15e2e317a55640be3d958877f4227325ef4876f65719779db42f`
  - extension ZIP: `c251bf19279c4b5909a8ff71814029c8e8e521528f963354a0e4608740127062`

## Known boundaries

No release-blocking product gaps remain. Existing disclosed platform boundaries
still apply: protected browser pages, canvas/WebGL, animated image files, and
some security-isolated frames cannot be selectively frozen. The package remains
unsigned until browser-store publishing.

The pre-existing modified tracked files under `graphify-out/` were not part of
the repair and are intentionally excluded from the repair commit.
