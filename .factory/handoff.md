# Verification handoff — FAIL

Date: 2026-08-28

Work order: `low-motion-profile-switcher-verify-1`

Tested candidate: `0b8f71dc3b919388e3fe753320614af7ad06485b`

Tested deployment: <https://low-motion-profile-switcher.sociobot.in>

## Result

**FAIL.** The live deployment is present and matches the candidate, all supplied
local gates pass, and the CSS profile/exception flows work. The extension does
not reliably pause autoplay/looping media when the profile is already active,
which is a core acceptance requirement.

## Blocking evidence

A real looping WAV fixture was tested in the packaged Chromium extension with
the per-host Balanced setting stored before navigation:

- 5/5 parser-created autoplay loads continued playing after one second
  (`paused=false`, approximately `0.94 s` elapsed, no extension marker).
- Dynamically inserted autoplay media also continued playing and unmarked.
- When the profile was enabled after playback had begun, the same media paused
  and was marked, confirming a timing race.

`pauseAutoplayMedia()` skips media while it is initially paused, while the
MutationObserver only reacts to insertion and never retries on `play`. See the
full evidence and severity list in `.factory/verification.md`.

## Verification summary

- Clean detached checkout at the candidate SHA; `npm ci` succeeded.
- `npm run check`: pass.
- `npm test`: pass (7 unit tests plus packaged-extension verifier).
- `npm run build`: pass; exact `dist/` outputs produced.
- `npm run test:e2e`: pass, 10/10.
- `npm audit --audit-level=low`: pass, 0 vulnerabilities.
- Live HTML/legal/SW files are byte-identical to the build. The live ZIP differs
  only in ZIP timestamps; extracted contents match recursively.
- Live axe: zero violations on `/`, `/privacy/`, and `/terms/` at 1440 px and
  390 px; no console/page errors or overflow.
- Keyboard, visible focus, reduced motion, per-host persistence, temporary
  exception start/end/expiry, protected-page state, error state, and sensitive
  input preservation were exercised.
- Privacy passes: no third-party runtime requests, cookies, web storage,
  analytics, telemetry, account, or remote product API.
- Service-worker update and controlled offline reload pass.
- Lighthouse mobile: 100/100/100/100; LCP 1,211 ms, TBT 53 ms, CLS 0.
- Static/serverless product: API rate limiting, Entra sign-in, backend
  concurrency, and library/CLI consumer checks are not applicable.

## Other defects

- **Medium:** live hashed assets/fonts receive 30-second caching rather than
  the authored one-year immutable policy.
- **Medium:** several site/popup controls are smaller than 44×44 px, and
  substantial descriptive copy is below the supplied 16 px baseline.
- **Low:** AVIF has `application/octet-stream`; live response policy omits the
  authored Permissions-Policy and weakens Referrer-Policy; no CSP is present.
- **Low:** unknown routes return the home page with HTTP 200.

## How to re-verify

```sh
npm ci
npm run check
npm test
npm run build
npm run test:e2e
npm audit --audit-level=low
```

Then use a loaded-extension fixture containing valid initial and dynamically
inserted autoplay/loop media. Store the site profile before navigation; verify
non-status media never starts, status media remains available, and disabling or
the temporary exception resumes only media paused by the extension.

## Repository state

Only verification documentation was changed. Product code and the unrelated
pre-existing `graphify-out/` directory were not modified.
