# Etsy × Airbnb refresh — slice 5 (token sweep): partnership detail `/partnerships/[id]`

**Lane:** `[want]` (last non-bug cycle `seeking-content-depth` was `[goal]` PASS → `[want]` owed per the 1:1).
**Item:** BACKLOG "[P3][want] slice 5: token sweep" — next remaining family per the
backlog is **partnership detail `/partnerships/[id]`** (the `/partnerships` search page
shipped 2026-06-22T08:35Z; `/aircraft` is the reference surface).

## Goal
Bring the partnership **detail** page onto the shared warm design tokens already used on
`/aircraft` and `/partnerships`, finishing the visible cold-white/slate inconsistency on a
priority-adjacent page — purely presentational, reversible, no behaviour change.

## Scope (one file, presentational only)
- `src/app/partnerships/[id]/page.tsx`:
  - Wrap the listing content div in `<div className="ch-surface min-h-screen">` (warm cream
    page surface), leaving the sticky mobile `<ContactBar>` OUTSIDE the wrap — mirrors how
    `/aircraft` keeps `<CompareTray>` outside its `ch-surface` wrap.
  - Convert the four neutral info panels
    `rounded-xl border border-slate-200 bg-white p-{5,6} shadow-sm` → `ch-panel p-{5,6}`
    (the listing card, Pilot Requirements, Costs, Structure cards).
  - Bump the desktop "Interested?" sky accent card's corner radius `rounded-xl` → `rounded-2xl`
    for radius parity with the now-rounded-2xl panels; keep it sky-tinted (it is an
    intentional accent card, like the accent cards `/aircraft` left as-is).

## Acceptance criteria
- `/partnerships/<id>` renders on the warm cream `ch-surface` background at desktop 1280 + mobile 375.
- All four neutral cards use `.ch-panel` (rounded-2xl, warm border, soft shadow); no stray
  `bg-white rounded-xl border-slate-200 shadow-sm` neutral panels remain on the page.
- The sticky mobile ContactBar still sits flush at the bottom (outside the cream wrap) and works.
- Everything functional is unchanged: photo gallery, Save/Share buttons, cost calculator,
  trust checklist, owner nudge, contact buttons, Similar listings, breadcrumb back-link, JSON-LD.
- `npx next build` + typecheck green; QA smoke exit 0 (HTTP 200, zero app console errors,
  zero horizontal overflow) at 1280 + 375; screenshots look on-brand.

## Out of scope
- No `globals.css` / token changes; no new color, component, or dependency.
- No changes to child components (PhotoGallery, CostCalculator, TrustBadge, SimilarListings, ContactBar/Buttons).
- No content, metadata, JSON-LD, schema/DB/SQL, or routing changes.
- Other token-sweep families (guides, tools, airport pages) — one family per cycle, future.
