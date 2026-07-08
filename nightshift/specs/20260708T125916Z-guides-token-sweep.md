# Guides page-family design-token sweep

## Goal
Finish the "Etsy × Airbnb" design-token sweep (`nightshift/BACKLOG.md` [P3][want]
"slice 5: token sweep") on the `/guides` page family — the last remaining family
after `/tools` shipped this drain (`tools-token-sweep`).

## Scope
- `src/app/guides/page.tsx` — the hub's list-item cards use a hand-rolled
  `rounded-2xl border-slate-200 bg-white` instead of the shared `.ch-card` utility
  (exact same fix as the `/tools` hub in the prior cycle).
- All 8 guide detail pages (`aircraft-co-ownership`, `aircraft-partnership-agreement`,
  `aircraft-pre-purchase-inspection`, `aircraft-title-escrow-and-closing`,
  `cost-of-aircraft-co-ownership`, `flying-club-vs-co-ownership`,
  `how-to-find-aircraft-partners`, `leaseback-vs-co-ownership`) — each has several
  neutral `rounded-xl border-slate-200 bg-white` info panels (→ `.ch-panel`) and
  colored accent panels (`sky-50`/`amber-50`, `rounded-xl` → `rounded-2xl`, matching
  the existing sky "Interested?" card / footer-CTA convention already used on these
  same pages). 3 pages also have a `rounded-xl border-slate-200` table wrapper
  (comparison tables) → `.ch-panel` (drops the manual border/radius, keeps
  `overflow-x-auto`).
- Purely presentational (className changes only) — no logic, copy, or schema change.

## Acceptance criteria
- `/guides` hub's list-item cards render with `.ch-card` (rounded-2xl + soft
  hover-lift shadow), consistent with `/tools`, `/aircraft`, `/partnerships`.
- All 8 guide detail pages' neutral info panels use `.ch-panel`; colored (sky/amber)
  accent panels and the 3 comparison-table wrappers get the same rounded-2xl bump.
- No visual regression — text, colors, spacing, and copy are unchanged; only corner
  radius/shadow/border-token treatment changes.
- No new component, color, or dependency; no schema/DB change.
- `npx next build` + typecheck pass.
- QA smoke passes (200 / no console errors / no horizontal overflow) at desktop 1280
  + mobile 375 on `/guides` and a sample of detail pages.

## Out of scope
- Any functional/logic/copy change to the guides.
- Normalizing `--ch-border` color usage beyond the panels touched here.
