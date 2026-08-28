# Verification handoff — Low Motion Profile Switcher

Date: 2026-08-28

Work order: low-motion-profile-switcher-verify-2

Candidate: a84d85820da69c4c9c50be15b2b101f4c3ceed36

Live URL: <https://low-motion-profile-switcher.sociobot.in>

Detailed report: .factory/verification-2.md

## Result

**FAIL. Do not release this candidate.**

The candidate extension works from a clean local build, but the live primary
download returns HTTP 404. The mandatory acceptance contract also fails because
.factory/claims.json is missing and there is no one-click sample-data demo.
The first screen explains the function but does not plainly name the
motion-sensitive user.

## Release blockers

1. Both live download actions target
   /downloads/low-motion-profile-switcher-chrome.zip, which returns HTTP 404.
2. .factory/claims.json is absent. No required claim test can be selected or
   run, while the landing page and README make multiple functional, privacy,
   offline, and compatibility claims.
3. No “Try it with sample data” action or isolated demo exists. /demo and
   /demo/ return 404, /?demo=1 is the normal landing page, and
   .factory/demo.md is absent.
4. The first screen does not state in plain words that the product is for
   motion-sensitive computer users.
5. .factory/copy-audit.md is absent.

## Important additional defects

- npm run build creates the downloadable ZIP, but npm run build:site deletes
  dist/site/downloads because the site build empties dist/site. npm run
  test:e2e invokes build:site and still passes because it checks only the
  download attribute, not the response or archive. This reproduces a likely
  path to the current incomplete deployment.
- Important popup copy is 10–13 px, below .factory/design.md’s stated 14 px
  popup minimum.
- Canonical, Twitter card, and apple-touch metadata are absent. The Open Graph
  image is 1280×853 rather than 1200×630, and the footer has no build ID.

## What passed

- Clean npm ci: 213 packages installed; 0 vulnerabilities.
- npm run check: pass.
- npm test: 10/10 unit tests plus packaged-extension consumer checks pass.
- npm run test:extension: pass.
- npm run build: pass; it creates the unpacked extension, 79,920-byte ZIP, and
  static site.
- npm run test:e2e: 16/16 desktop and 390 px tests pass.
- The packaged extension applies Gentle, Balanced, and Still correctly,
  preserves explicit status/progress motion, pauses initial and dynamic
  autoplay, preserves password input, isolates host settings, supports
  keyboard operation, and recovers clearly from protected pages/save errors.
- Live axe: zero violations on home, privacy, terms, and 404 at desktop and
  390 px. No overflow, missing landmarks, missing alt text, or application
  errors were found.
- Reduced motion, visible focus, 44 px targets, service-worker update, and
  controlled offline reload pass.
- Live privacy checks found only same-origin requests and no cookies or web
  storage. Source has no analytics, sign-in, billing, unlock, or remote API.
- Security headers, HTTPS redirect, immutable hashed-asset/font caching,
  service-worker no-cache, and AVIF MIME pass.
- Fresh live Lighthouse: 100 performance / 100 accessibility / 100 best
  practices / 100 SEO; FCP 967 ms, LCP 1,222 ms, TBT 0 ms, CLS 0; 83,992 bytes.
- All fetched deployment files except the absent ZIP are byte-identical to the
  candidate build.

## How to reproduce

From a clean checkout at the candidate:

    npm ci
    npm run check
    npm test
    npm run test:extension
    npm run build
    npm run test:e2e
    npm audit --audit-level=low

Download failure:

    curl -i https://low-motion-profile-switcher.sociobot.in/downloads/low-motion-profile-switcher-chrome.zip

Artifact-loss sequence:

    npm run build
    test -f dist/site/downloads/low-motion-profile-switcher-chrome.zip
    npm run build:site
    test -f dist/site/downloads/low-motion-profile-switcher-chrome.zip

The first test succeeds; the second fails.

## Required next steps

Create the claims manifest and tagged claim tests, add the documented isolated
sample demo and plain first-screen audience copy, restore the copy audit, make
the download survive every documented QA/build sequence, and add an E2E test
that actually downloads and validates the archive. Redeploy only the verified
final dist and confirm the live ZIP returns 200 and loads in clean Chromium.
Then address popup text sizing and required metadata and repeat the complete
verification matrix.
