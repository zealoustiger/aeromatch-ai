# guide-alert-right-noun

## Goal
Fix the alert capture box on the 2 aircraft-buyer guide pages to offer an honest
aircraft-for-sale alert (not a partnership alert), and give all 8 guide pages a
distinct `source` tag so per-guide placement conversion is measurable.

## Scope
- `src/app/guides/aircraft-pre-purchase-inspection/page.tsx` — `AlertSignup`:
  `noun="partnership"`/`sourcePath="/partnerships"` → `noun="aircraft"`/`sourcePath="/aircraft"`,
  `source="guide_page"` → `source="guide_pre_purchase_inspection"`.
- `src/app/guides/aircraft-title-escrow-and-closing/page.tsx` — same aircraft-noun fix,
  `source="guide_title_escrow_closing"`.
- The other 6 guide pages (all genuinely partnership/co-ownership content — keep
  `noun="partnership"`/`sourcePath="/partnerships"` as-is, honest match) — only change
  `source` to a distinct per-guide value:
  - `aircraft-co-ownership` → `guide_aircraft_co_ownership`
  - `aircraft-partnership-agreement` → `guide_partnership_agreement`
  - `cost-of-aircraft-co-ownership` → `guide_cost_of_co_ownership`
  - `flying-club-vs-co-ownership` → `guide_flying_club_vs_co_ownership`
  - `how-to-find-aircraft-partners` → `guide_find_partners`
  - `leaseback-vs-co-ownership` → `guide_leaseback_vs_co_ownership`
- `src/app/guides/page.tsx` (the guides hub/index) is out of scope — it's a mixed
  hub, not one of the 8 topical guides; leaving its existing generic partnership box.
- No component/schema/action changes — `AlertSignup` already supports `noun`/`sourcePath`/
  `source` as props (verified via direct read).

## Acceptance criteria
- `aircraft-pre-purchase-inspection` and `aircraft-title-escrow-and-closing` render an
  aircraft-noun alert box (price-drop-opt-in + "only good deals" checkboxes now show,
  since those only render for `noun === 'aircraft'`) whose submission would create an
  `/aircraft`-scoped alert, not a `/partnerships` one.
- All 8 guide pages emit `alert_subscribed`/`alert_capture_viewed` with a distinct,
  guide-specific `source` value (no two guides share `source: 'guide_page'` anymore).
- The 6 partnership-content guides are visually/functionally unchanged except the
  `source` tag (still `noun="partnership"`, still `sourcePath="/partnerships"`).
- `npx tsc --noEmit` and `next build` both pass.
- QA smoke passes on all 8 guide pages at desktop 1280 + mobile 375 (HTTP 200, zero
  console errors, zero horizontal overflow); screenshots read for the 2 changed pages
  to confirm the new checkboxes render cleanly.

## Out of scope
- The guides hub page (`/guides`).
- Any change to `AlertSignup`'s component logic.
- Wiring the new `source` values into any admin dashboard grouping (existing
  `classifySourcePath`/admin panels group by `sourcePath`, unaffected by this change).
