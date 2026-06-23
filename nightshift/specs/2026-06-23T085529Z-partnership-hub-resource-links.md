# Spec — partnership-hub-resource-links

**Lane:** `[goal]` (last non-bug cycle `home-rails-snap-carousel` pulled `[want]`; last cycle
PASS so no blocker → `[goal]` owed per the 1:1). STAGE=INDEXING.

## Goal
Add a "New to co-ownership?" related-resources cross-link block to the partnership **make**
hubs (`/partnerships/make/[make]`) and **state** hubs (`/partnerships/state/[state]`) so these
priority seed pages link into the co-ownership guides cluster + the cost calculator — routing
crawl equity to seed pages #11 (`/tools/cost-calculator`) and #12 (`/guides/aircraft-co-ownership`)
from seed pages #5–10. This is the partnership-side counterpart to the existing
`ForSaleGuideLinks` block on the for-sale surfaces; the partnership hubs currently have no
equivalent (they only cross-link to other hubs and `/partnerships`).

## Scope (small)
- NEW `src/components/PartnershipResourceLinks.tsx` — a presentational, no-data-fetch cross-link
  block mirroring `ForSaleGuideLinks` styling (rounded-xl / sky accent). Links:
  - `/guides/aircraft-co-ownership` — how co-ownership works (seed #12)
  - `/guides/how-to-find-aircraft-partners` — finding/vetting partners
  - `/tools/cost-calculator` — true monthly/per-hour cost of a share (seed #11)
  - footer link → `/guides` hub
- Render it on `src/app/partnerships/make/[make]/page.tsx` and
  `src/app/partnerships/state/[state]/page.tsx`, alongside the existing cross-link block.

## Acceptance criteria
- `/partnerships/make/cessna` and `/partnerships/state/ca` each render the new block with working
  links to `/guides/aircraft-co-ownership`, `/guides/how-to-find-aircraft-partners`,
  `/tools/cost-calculator`, and `/guides`.
- All linked targets are existing, always-valid static pages — zero 404 risk (no inventory-gated
  or dynamic targets).
- `next build` + typecheck pass.
- QA smoke (desktop 1280 + mobile 375) passes on both pages: HTTP 200, no app-origin console
  errors, no horizontal overflow. Screenshots look right.

## Out of scope
- Cross-marketplace links to `/aircraft/[make]` / `/aircraft/for-sale/[state]` (inventory-gated →
  404 risk; deferred).
- Any change to page content, FAQs, JSON-LD, or the existing cross-link blocks.
- Applying the block to other page families this cycle.
