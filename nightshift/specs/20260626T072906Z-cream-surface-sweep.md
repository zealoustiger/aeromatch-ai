# Spec: cream-surface-sweep

**UTC**: 2026-06-26T072906Z  
**Goal**: Apply the `.ch-surface` cream background to the remaining pages that still use a plain white page background: `/aircraft/new`, `/guides`, `/tools`, `/tools/cost-calculator`, `/tools/earnings-calculator`.

**Why**: The warm off-white/cream `.ch-surface` token is already applied to `/aircraft`, `/partnerships`, `/aircraft/listing/[id]`, `/airports/[icao]`, and both posting forms (`/partnerships/new`, `/partnerships/seeking/new`). The remaining outliers — the aircraft-for-sale posting form page, the guides hub, and the tools hub + calculator pages — still render on a plain white background, breaking the cohesive marketplace feel the human wants (Etsy × Airbnb aesthetic). This also closes the CHANGELOG Next note from `aircraft-for-sale-ai-draft` ("`/aircraft/new` page wrapper still lacks `.ch-surface` cream background").

**Scope** (5 files, each a 2-line wrapper change):
- `src/app/aircraft/new/page.tsx` — wrap inner div in `<div className="ch-surface min-h-screen">`
- `src/app/guides/page.tsx` — same
- `src/app/tools/page.tsx` — same
- `src/app/tools/cost-calculator/page.tsx` — same
- `src/app/tools/earnings-calculator/page.tsx` — same

**Acceptance criteria**:
1. `/aircraft/new` renders on the warm cream `.ch-surface` background (same as `/partnerships/new`)
2. `/guides` renders on cream background
3. `/tools` renders on cream background
4. `/tools/cost-calculator` renders on cream background
5. `/tools/earnings-calculator` renders on cream background
6. At 375px mobile, no horizontal overflow on any of the 5 pages
7. `npx next build` passes (these are pure presentational wrapper changes, zero TypeScript impact)
8. QA smoke exits 0 on all affected paths at desktop 1280 + mobile 375

**Out of scope**:
- Changing any content, copy, or functionality
- Applying tokens to sub-pages of guides (individual guide articles — separate cycle)
- Any branding changes beyond the background color
