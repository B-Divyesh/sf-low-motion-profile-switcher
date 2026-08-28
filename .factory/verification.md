# Independent verification — FAIL

Date: 2026-08-28

Work order: `low-motion-profile-switcher-verify-1`

Candidate: `0b8f71dc3b919388e3fe753320614af7ad06485b`

Live URL: <https://low-motion-profile-switcher.sociobot.in>

Artifact: Chromium Manifest V3 extension plus static distribution site

## Verdict

**FAIL.** The candidate builds, its CSS motion profiles and temporary exception
work, the live site matches the candidate, and the supplied quality gates pass.
However, a remembered active profile does not reliably pause parser-created or
dynamically inserted autoplay/looping media. This is a high-severity failure in
the brief's smallest useful product and is reproducible on the packaged
extension.

No product code was changed during verification. Testing was performed from a
clean detached worktree at the candidate commit. The pre-existing untracked
`graphify-out/` directory in the primary checkout was not touched.

## Candidate and deployment identity

- Detached checkout resolved to the exact requested SHA.
- Live `/`, `/privacy/`, `/terms/`, and `/sw.js` were byte-identical to the
  clean production build:
  - `/`: `acb9784bcadf7e8569fb3cd6d50831dbc6cd32e03d91aba2b4fefff2f8c1ed08`
  - `/privacy/`: `e31dba49bf8659b8ecce3844176873806612abf45a7e66607ad5743b2b4a5d37`
  - `/terms/`: `82879e661090a27a6ee568aa4105ed2dc86c24214eb3850bb9760fc5614a3f61`
  - `/sw.js`: `d14e2058ab1a699087b635b3a44b66cac04395d5e47a0f62fc2f18f29d0b7bec`
- The downloaded live extension and rebuilt ZIP have different archive hashes
  (`427ea89e...` live versus `b2d7359f...` rebuilt) because ZIP timestamps
  differ. Extraction followed by recursive diff was empty, and all 13 packaged
  file hashes match. The live package therefore contains the candidate.
- HTTPS is valid for the hostname, HTTP redirects to HTTPS, and HSTS is present.

## Clean install and repository gates

Environment: Node `v22.23.2`, npm `10.9.8`, Playwright `1.58.2`.

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 213 packages installed; lockfile honored |
| `npm audit --audit-level=low` | PASS; 0 vulnerabilities |
| `npm run check` | PASS; TypeScript strict check |
| `npm run test:unit` | PASS; 7/7 tests in 2 files |
| `npm test` | PASS; unit suite and loaded-extension verifier |
| `npm run build` | PASS; exact production build produced `dist/` |
| `npm run test:e2e` | PASS; 10/10 desktop and 390 px cases |

There is no separate lint script. There is no repository `verify-url.sh`, so
the equivalent title/lang/main/image/console checks were run with Playwright in
addition to the supplied suite.

## Product exercise

### Passing behavior

- Default popup state is off with Balanced selected.
- Keyboard-only operation works: Tab reaches the skip link then the switch;
  Space toggles the switch; arrow keys change the radio profile; Enter starts
  and ends the exception. Focus uses a visible 3 px lime outline.
- Per-host persistence works and does not leak from `127.0.0.1` to `localhost`.
- Computed motion behavior on a real page:
  - Gentle: decorative animation `160 ms`, one iteration; transition `120 ms`.
  - Balanced: decorative animation `1 ms`, one iteration; transition `80 ms`.
  - Still: decorative animation and transition `none`/`0 s`.
- In every profile, descendants of `role=status`, `role=progressbar`,
  `aria-live`, native `progress`, and native `meter` retained their original
  2-second status animation. A password input value remained unchanged.
- The ten-minute exception stored an expiry 599,992 ms ahead, removed the page
  policy immediately, could be ended early, and automatically re-applied the
  profile after a 250 ms boundary fixture expired.
- Disabling the profile removed the injected style and restored the page's
  original CSS animation. A regular media element without autoplay/loop was not
  paused.
- Protected-page and induced storage-write-error states display actionable
  recovery copy. The popup has one H1, one main landmark, no overflow, and no
  axe violations.
- No extension request left the local fixture or extension origin.

### Failing behavior: autoplay race

A valid looping WAV served by a local HTTP fixture was loaded with Chromium's
autoplay policy explicitly enabled. The extension setting was stored before
navigation, matching a user revisiting a site where Low Motion is already on.

- On 5/5 fresh loads, non-status `<audio autoplay loop>` remained playing after
  one second (`currentTime` approximately `0.94 s`, `paused=false`) and had no
  `data-low-motion-paused` marker.
- A valid `<audio autoplay loop>` inserted after the policy was active also
  remained playing (`currentTime=0.57 s` after 0.7 seconds) and unmarked.
- The status-region control audio also played, as expected.
- Enabling the profile only after the non-status media was already playing
  paused and marked both initial and dynamic media; manually started media
  without autoplay/loop continued. This isolates the failure to timing.

Root cause evidence is in `lib/motion-policy.ts:49-54` and
`entrypoints/content.ts:27-48`: the scan skips qualifying media while
`media.paused` is true. Parser-created and newly inserted media are normally
paused before autoplay begins, and no `play`/`playing` listener retries the
policy after playback starts.

## Live site, accessibility, privacy, and PWA

- Live desktop (1440 px) and mobile (390×844) visual review passed for layout,
  hierarchy, meaningful hero art, and no horizontal overflow.
- Live axe scans of `/`, `/privacy/`, and `/terms/` in both viewports found zero
  violations at any impact level; serious/critical count is zero. All six runs
  had one H1, one main landmark, `lang=en`, no console errors, and no page
  errors.
- Keyboard traversal exposed the skip link and a consistent 3 px visible focus
  ring. `prefers-reduced-motion: reduce` produced `scroll-behavior: auto`, zero
  active animations, and no non-zero transitions.
- The live page made ten first-load requests, all to its own origin. It created
  no cookies, local storage, or session storage. Static/source inspection found
  no analytics, telemetry, remote configuration, sign-in, payment, or product
  API calls. Extension preferences use `chrome.storage.local` only.
- Service-worker registration and `update()` succeeded, the active controller
  was `/sw.js`, cache `low-motion-site-v1` existed, and a controlled 390 px page
  reloaded offline with its main content and visible offline status. No service
  worker/page errors occurred.
- Sign-in/Entra validation is not applicable: the product has no sign-in.
- API burst/rate-limit validation is not applicable: this is a static site and
  extension with no server-side or product-unlock endpoint.
- Library/CLI/backend concurrency and persistence checks are not applicable.

## Performance and bundle budgets

Fresh Lighthouse 12.8.2 mobile run against the live URL at
`2026-08-28T08:26:26Z`:

| Measure | Result |
| --- | ---: |
| Performance / accessibility / best practices / SEO | 100 / 100 / 100 / 100 |
| FCP / LCP | 816 ms / 1,211 ms |
| TBT / max potential FID | 53 ms / 80 ms |
| CLS | 0 |
| Total first-load transfer | 83,448 bytes in 7 requests |

INP is not produced by a navigation-only lab run. The max-potential-FID and TBT
results are within the interaction budget.

Built budgets pass: site JS `965 B` (`0.51 kB` gzip), CSS `17,029 B`
(`4.56 kB` gzip), fonts `62,964 B`, mobile AVIF hero `11,281 B`, extension
runtime JavaScript `10,295 B`, and extension ZIP `79,816 B`.

## Defects

### High

1. **Remembered profiles fail to pause autoplay/looping media.** Initial and
   dynamic media can start after the one-time scan and observer callback has
   skipped their initially paused state. This directly fails the brief and the
   README's autoplay promise. Add playback-event enforcement (while excluding
   preserved regions), cover initial and dynamic real media in a loaded-
   extension test, and verify reversible restoration.

### Medium

1. **Live caching ignores the authored policy.** Hashed JS/CSS and fonts all
   return `Cache-Control: public, must-revalidate, max-age=30`; the checked-in
   `_headers` requires one-year immutable caching. The download also receives
   30 seconds rather than one hour. This fails the supplied caching policy.
2. **Several interactive targets are below 44×44 CSS px.** Examples measured
   live include both wordmarks at `128×32`, the footer Terms link at `38×44`,
   and the popup's “How profiles work” link at `101×30` (the popup skip link is
   `121×34`). The landing page also uses 12–14 px for substantial descriptive
   copy despite the supplied 16 px body-text baseline.

### Low

1. **Live response metadata differs from the checked-in response policy.** The
   site serves AVIF as `application/octet-stream`, omits the authored
   `Permissions-Policy`, and uses `strict-origin-when-cross-origin` rather than
   the authored `no-referrer`. It also has no CSP. HSTS, nosniff, same-origin
   runtime requests, and the static design limit immediate exploitability.
2. **Unknown URLs return the home page with HTTP 200** rather than a true 404,
   which can produce misleading crawl and monitoring results.

## Required next verification

After the autoplay race is fixed, repeat the real-media fixture with an active
setting before navigation and with media inserted after load; both must remain
paused, preserved-region media must remain available, and disabling/temporary
exception must resume only extension-paused media. Re-run all clean gates and
confirm deployment caching/MIME/policy headers after the hosting configuration
is corrected.
