# Visual thesis — the quiet signal room

## Direction and rationale

**Luminous glass data landscape.** Low Motion is a selective control layer, not
an animation kill switch. Its visual world is a dark, quiet signal room where
translucent panes separate useful signals from ambient noise. Soft cyan traces
represent status that should remain legible; suspended coral fragments suggest
decorative movement brought to rest. The effect feels technical and reassuring
without borrowing the clinical look of a medical product.

The extension popup uses the same materials at utility scale: a near-black
backplane, one frosted control surface, hairline borders, compact profile rails,
and an illuminated state lamp. The website opens the world up into an editorial
landscape instead of placing generic feature cards over a gradient.

## Tokens

| Role | Dark (primary) | Light (legal/print fallback) |
| --- | --- | --- |
| Background | `#071014` Signal black | `#F2F8F7` Mist paper |
| Elevated surface | `#101E22` Deep glass | `#FFFFFF` Clear glass |
| Quiet surface | `#14292D` | `#E2EFED` |
| Primary text | `#F3FBF8` | `#102124` |
| Muted text | `#A9BFBA` | `#49635F` |
| Accent | `#58E6CC` Stillwater | `#087C69` |
| Accent contrast | `#05201B` | `#FFFFFF` |
| Preserved signal | `#B9F577` Lime trace | `#3E7500` |
| Temporary exception | `#FFC27A` Amber | `#8A4800` |
| Error | `#FF8E86` | `#A72828` |
| Hairline | `#315158` | `#B1CBC6` |

Contrast is checked against each intended surface. Color is always paired with
a label, icon, or state sentence.

## Typography and spacing

- **Interface and display:** `Inter`, self-hosted variable Latin subset,
  chosen for open apertures and calm, compact utility labels.
- **Signal notation:** `IBM Plex Mono`, self-hosted regular Latin subset, for
  domains, counters, profile indices, and technical annotations.
- Scale: 12 / 14 / 16 / 20 / 32 / clamp(48–76) px. Body text never drops below
  16 px on the site or 14 px in the constrained extension panel.
- Spacing follows a 4 px base with an 8 px working rhythm: 4, 8, 12, 16, 24,
  32, 48, 64, 96. Popup controls are at least 44 px tall.
- Editorial measure is 64 characters. Utility text stays under 42 characters.

## Interaction grammar

- A three-position **profile rail** makes strength and current state readable
  without opening menus. Every option has a name and behavioral summary.
- Selection changes the glass pane's luminous edge instantly and announces the
  applied state through a live region.
- The temporary exception is amber, time-bounded, and visibly reversible. The
  interface shows its expiration rather than silently changing site behavior.
- Settings are grouped by proximity. Borders describe actual layers, never
  filler cards. Icons are original inline SVG strokes built from the same
  rounded geometry as the wordmark.

## Motion policy

- Product UI uses only 160–220 ms opacity, border-color, and transform changes.
  No decorative element loops or flashes. The illustration is static.
- With `prefers-reduced-motion: reduce`, transforms and smooth scrolling are
  removed and all state changes are instant. Meaning remains in contrast,
  position, label, and icon.
- The extension's page rules retain explicit progress, status, live-region,
  cursor, and focus feedback even in Still mode. This is the central product
  promise, not merely a visual preference.

## Original asset plan and provenance

### `signal-landscape`

- Use: landing hero and social preview crop.
- Subject: a quiet abstract control plane with three horizontal glass strata;
  calm status traces pass through while scattered motion fragments are held at
  the boundary.
- World/materials: smoked optical glass, etched grid, translucent resin,
  subtle bloom, tactile dark mineral surface.
- Light/lens: controlled cyan edge light, warm amber pin light, orthographic
  three-quarter macro view, generous dark negative space on the left.
- Palette words: signal black, deep teal glass, stillwater cyan, lime trace,
  sparing amber.
- Negative list: people, medical devices, literal browser UI, text, letters,
  logos, watermarks, gradients as the subject, neon cyberpunk clutter, motion
  blur, flashing, brand marks.
- Generation command: `/opt/fleet/lib/gen-image.sh` using the factory image
  deployment, 1536×1024, high quality.
- License/provenance: original AI-generated asset commissioned for this
  product; generated 2026-08-28 with the factory Azure OpenAI image deployment.
  The accepted source and exact prompt are stored as
  `assets/src/signal-landscape-v2.png` and `signal-landscape-v2.json`. An
  initial crushed-black result was rejected during visual review and removed.

All interface icons and the LM monogram are original hand-authored SVG. No
third-party visual assets, fonts from CDNs, analytics, or runtime scripts are
used.

### Distribution derivatives

`site/public/assets/social-preview.png` is a 1200×630 PNG composition cropped
from the accepted original `signal-landscape-v2.png`; it is used only for
Open Graph and Twitter previews. `apple-touch-icon.png` is a 180×180 crop from
the same accepted source. Both derivatives are created reproducibly by
`scripts/create-social-assets.mjs` with local Sharp; no new third-party asset
or generation prompt was introduced.
