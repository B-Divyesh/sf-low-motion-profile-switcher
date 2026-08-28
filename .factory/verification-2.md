# Independent verification 2 — FAIL

Date: 2026-08-28

Work order: low-motion-profile-switcher-verify-2

Candidate: a84d85820da69c4c9c50be15b2b101f4c3ceed36

Live URL: <https://low-motion-profile-switcher.sociobot.in>

Artifact: Chromium Manifest V3 extension plus static distribution site

## Verdict

**FAIL.** The primary live “Download for Chromium” link returns HTTP 404, so a
visitor cannot obtain the product. The mandatory claims and demo acceptance
gates also fail: .factory/claims.json is absent, the first screen does not name
the motion-sensitive user in plain words, and there is no one-click “Try it
with sample data” demo.

The extension built from the candidate works correctly in a fresh Chromium
profile, including the previously repaired autoplay race. Repository checks,
accessibility scans, offline reload, and performance budgets pass. Those facts
do not override the explicit release blockers above.

No product code was changed. Testing ran from a clean local clone detached at
the exact candidate. The pre-existing graphify-out changes in the primary
checkout were not touched or staged.

## Mandatory gates run first

### Claims gate — FAIL

.factory/claims.json does not exist at the candidate commit. There were
therefore no declared claim commands to run. The claims contract explicitly
makes a missing manifest release-blocking.

The landing page and README contain many claim-like statements without a
manifest entry or tagged claim test, including:

- profiles remain local and no browsing information is uploaded;
- no accounts, analytics, remote rules, cookies, or tracking scripts;
- Gentle, Balanced, and Still have specific motion behavior;
- autoplay and loops are paused while status/progress remain visible;
- settings are remembered by hostname;
- a temporary exception lasts ten minutes and restores the profile;
- changes are reversible;
- the site works offline after its first load;
- the extension supports Chromium-family browsers.

Some behavior has ordinary unit or consumer coverage, but none is registered
as the required one-test-per-claim acceptance suite.

### Cold first-read and demo gate — FAIL

Cold first-screen reading:

- What it does: a browser extension settles distracting loops and autoplay
  while keeping progress, status, and focus feedback visible.
- For whom: the screen does not plainly say. A motion-sensitive user can only
  be inferred from the product name and motion language.
- What to click first: “Download for Chromium.”

There is no visible “Try it with sample data” action. /demo and /demo/ return
HTTP 404; /?demo=1 renders the ordinary landing page. There is no persistent
demo banner, reset/start-real controls, separate demo storage namespace, or
.factory/demo.md. This fails the mandatory first-screen and sandbox contract.

.factory/copy-audit.md is also absent, so the required plain-language copy
audit was not delivered.

## Clean install, checks, tests, and build

Environment: Node v22.23.2, npm 10.9.8, Playwright 1.58.2.

| Command | Result |
| --- | --- |
| npm ci | PASS; 213 packages installed, 214 audited |
| npm audit --audit-level=low | PASS; 0 vulnerabilities |
| npm run check | PASS; TypeScript no-emit check |
| npm test | PASS; 10/10 Vitest tests and packaged-extension consumer check |
| npm run test:extension | PASS; loaded-extension policy, exception, popup axe, and target checks |
| npm run build | PASS; exact production build produced extension, ZIP, and site |
| npm run test:e2e | PASS; 16/16 desktop and 390 px Playwright tests |

No lint script is configured.

The built extension is 89.81 kB unpacked and 79,920 bytes zipped. The package
verifier extracted the ZIP, found no difference from the unpacked build, and
loaded that extracted package in a clean Chromium consumer.

## Product exercise

### Normal and boundary behavior — PASS locally

Fresh packaged-extension checks observed:

- Gentle: decorative animation 160 ms, one iteration; transition 120 ms.
- Balanced: decorative animation 1 ms, one iteration; transition 80 ms.
- Still: decorative animation and transition disabled.
- role=status and native progress animation remained active in every profile.
- A password input retained its value unchanged.
- A stored profile applied before navigation, and the real-media fixture
  paused both parser-created and dynamically inserted autoplay/loop media.
- Media inside a status region and ordinary user-started media remained
  available.
- Temporary exception and disable restored only extension-paused media.
- A short 250 ms expiry boundary automatically re-applied the policy.
- 127.0.0.1 settings did not apply to localhost, proving hostname isolation.
- The real popup stored a ten-minute exception with 599,993 ms remaining at
  observation time.

### Keyboard and recovery — PASS locally

- Tab first reaches “Skip to controls” with a 3 px visible lime outline.
- Space disables and enables the site profile.
- Arrow keys change the radio profile and update the live announcement.
- Enter starts the temporary exception.
- Protected browser-page input shows “This page can’t be adjusted” and tells
  the user to open a regular website.
- An induced storage write failure shows and announces “Could not save. Try
  reopening the extension.”

## Deployment identity and install failure

The deployed site is substantially the candidate, but the deployment is
incomplete. Seventeen fetched public files were byte-identical to the clean
build, including all HTML routes, service worker, JS, CSS, fonts, images,
robots.txt, sitemap.xml, favicon, and online check.

Representative SHA-256 identities:

- index.html: 15c105bd1995862c75e174ef33509602ee3de587f9a6fcd5342b5a6762a63306
- privacy/index.html: 9442880306c08bff2be2201c049ef112dfc4f702bfc03ece17b52efe5e8e302
- terms/index.html: 0977de8ddaabf2a2f05ba31556a022aeeeda85efb489cb83ec1b52efe5e8e302
- 404.html: 20fc87d57e358ed6caf9eab4cf906b63ff8a3a388e4f1eb3d65d6d0297485472
- sw.js: bcd099ccd4ca15e2e317a55640be3d958877f4227325ef4876f65719779db42f

However, the live path
/downloads/low-motion-profile-switcher-chrome.zip returns HTTP 404 with the
1,470-byte custom not-found page. Both landing-page download actions point to
that URL. The live ZIP therefore cannot be compared or installed.

The repository reproduces a likely artifact-loss path:

1. npm run build creates dist/site/downloads/low-motion-profile-switcher-chrome.zip.
2. npm run build:site removes that file because Vite uses emptyOutDir for
   dist/site.
3. npm run test:e2e invokes build:site but only checks the link’s download
   attribute, not a successful response or download.
4. The E2E suite passes while dist/site/downloads is absent.

This also means the README’s documented sequence (build, then test:e2e) leaves
an incomplete deployment directory.

## Live accessibility, responsive behavior, and motion

- Factory /opt/fleet/lib/verify-url.sh: PASS; HTTP 200, title, lang, H1, main,
  image alt, and console checks passed. It recorded 2,674 ms until network idle.
- Fresh axe scans on home, privacy, terms, and an unknown route at 1440×1000
  and 390×844 found zero violations at any impact level.
- Home, privacy, and terms had no console or page errors. The unknown-route
  navigation emitted only Chromium’s expected failed-main-resource 404 log.
- Every tested route had one H1, one main landmark, no horizontal overflow,
  and a route-appropriate title.
- The first keyboard focus is the visible skip link with a 3 px solid focus
  indicator. Measured interactive targets were at least 44×44 CSS px.
- prefers-reduced-motion produced auto scrolling, zero document animations,
  and no non-zero CSS animation or transition durations.
- Desktop and full 390 px screenshots were visually inspected: hierarchy,
  image rendering, wrapping, and spacing are coherent with no overlap or
  clipping.

One visual-system violation remains in the popup. Visible supporting text is
10–13 px (profile summaries 10 px, exception detail 11 px, state/labels 13 px,
footer 10 px), below .factory/design.md’s own “never below 14 px” popup rule
and the supplied legibility baseline.

## Privacy, security, routes, and PWA

- The live first load made eight requests, all same-origin. It set no cookies,
  localStorage, or sessionStorage values.
- Source and built-package inspection found no analytics, telemetry, sign-in,
  billing, unlock, or remote product endpoints. Extension state uses only
  chrome.storage.local. No third-party fonts or runtime scripts are loaded.
- CSP is self-only and blocks objects, framing, and form submission. HSTS,
  no-referrer, nosniff, and Permissions-Policy are present. HTTP redirects to
  HTTPS.
- Hashed JS/CSS and fonts return one-year immutable caching; sw.js is no-cache;
  online-check.txt is no-store; AVIF has image/avif MIME.
- Every discovered link and anchor passed except the extension download.
  Unknown routes return the custom page with HTTP 404.
- Service-worker update succeeds. /sw.js is activated and controls the page,
  cache low-motion-site-v3 exists, and a controlled offline reload retains the
  main page and displays the offline status without page errors.
- Sign-in/Entra checks are not applicable because there is no sign-in.
- API burst/rate-limit checks are not applicable because the product has no
  server-side, billing, unlock, or other API endpoint.
- Library/CLI/backend concurrency checks are not applicable to this browser
  extension.

## Performance and budgets

Fresh live Lighthouse 12.8.2 run at 2026-08-28T09:50:25Z:

| Measure | Result |
| --- | ---: |
| Performance / accessibility / best practices / SEO | 100 / 100 / 100 / 100 |
| FCP | 967 ms |
| LCP | 1,222 ms |
| TBT | 0 ms |
| CLS | 0 |
| Total transfer | 83,992 bytes in 8 requests |

INP is not available from a navigation-only lab run. TBT is comfortably below
the supplied interaction proxy budget.

Built static budgets pass: initial JS 1,200 B, CSS 17,368 B, fonts 62,964 B,
and mobile AVIF hero 11,281 B. All are below the supplied limits.

## Defects by severity

### Critical

1. **The live extension download is missing.** The product’s primary and final
   actions return HTTP 404. A visitor cannot install or use the product from
   the deployed site. The build:site/E2E artifact-loss path above reproduces a
   likely cause, and the E2E assertion does not detect it.

### High — release blocking

1. **The required claims manifest is missing.** No .factory/claims.json exists,
   so none of the numerous landing/README claims is registered or executable
   through the mandated claim gate.
2. **The mandatory demo and first-read contract fail.** The first screen does
   not plainly identify motion-sensitive users and offers no one-click sample
   demo. Demo routes, isolation/banner/reset behavior, and .factory/demo.md are
   absent.
3. **The required copy audit is missing.** .factory/copy-audit.md was not
   delivered.

### Medium

1. **Popup text violates the product’s own legibility rule.** Important labels
   and supporting text render at 10–13 px despite the visual thesis specifying
   at least 14 px in the popup.
2. **Required metadata is incomplete.** The pages have no canonical link,
   Twitter card metadata, or apple-touch icon. The Open Graph image is
   1280×853 rather than the required 1200×630 share image, and the footer does
   not expose a build identifier.

## Required retest

Add the claims manifest and tagged tests, implement the isolated one-click demo
and its documentation, make the first-screen audience explicit, and restore a
deployable ZIP. Add an E2E assertion that performs the download and validates
the archive after the E2E site build. Then deploy from a verified final dist,
confirm the live ZIP returns 200 and loads in clean Chromium, and repeat all
claim, extension, accessibility, privacy, PWA, header, parity, and performance
checks.
