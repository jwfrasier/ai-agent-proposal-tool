# DESIGN.md — VAERS Prototype

## Color

USWDS-derived federal palette (tokens in `src/styles/tokens.css`). Strategy:
**restrained** — tinted light neutrals, federal blue as the single working
accent, status colors used only for status.

- Primary: `#005ea2` (actions, links, active states)
- Primary dark/darker: `#1a4480` / `#162e51` (header, hero, JSON panel)
- Ink: `#1b1b1b`; soft ink `#3d4551`; muted `#5c5c5c`
- Surfaces: two neutral layers, both blue-tinted (never pure white): page
  `#f5f7f9`, cards/inputs `#fdfdfe`; text on dark `#f5f8fc`
- Status: error `#b50909`, success `#00a91c`/`#008817`, warning `#ffbe2e`,
  info `#00bde3`; each has a matched `-border` tint for callout borders
- Demo identity (banner, simulated tags): `#8a3ffc` on `#f3ebff` — the one
  non-USWDS color, reserved exclusively for "this is a demonstration" chrome
  so demo framing never contaminates product UI.

## Typography

- Display: Merriweather 700 (page titles, hero) — the USWDS serif pairing.
- UI/body: Public Sans 400/600/700.
- Data/mono: system mono stack (structured record output).
- Body size 1.0625rem, line-height 1.55; scale ratio ≈ 1.25.

## Layout

- Max content width 72rem; form column capped at 40rem; inputs capped 30rem.
- Report page: two-column grid, sticky guidance rail 20rem on the right;
  single column under 60rem with meter above form, assist inline after it.
- Radius 0.25rem (0.5rem for rail cards/modals). Shadows minimal, two levels.

## Components

- Buttons: solid primary, outlined secondary, text ghost; 2px transparent
  border reserved so outline variant doesn't shift layout.
- Choice cards: bordered label-wrapped radios/checkboxes, `:has(:checked)`
  highlight in primary-lightest.
- Callouts: tinted background + 1px full border in the matched status border
  tint, optional bold lead word. Never side-stripe borders (no `border-left`
  accents anywhere).
- Focus: 0.25rem `#2491ff` ring, offset 2px; suppressed visually (not
  programmatically) on `tabindex="-1"` targets.
- "Applied live" / "demo · simulated" tags: small uppercase chips; green for
  state confirmation, purple only for demo framing.

## Motion

Reduced-motion respected globally. Interactive state transitions 160ms on an
ease-out-quint curve (`cubic-bezier(0.22, 1, 0.36, 1)`); meter fill 0.4s; new
callouts (branch note, upload rejection) reveal with a 220ms fade-rise.
Motion conveys state only; this is a calm federal form, not a product tour.
The completeness meter turns success-green when all key answers are provided.
