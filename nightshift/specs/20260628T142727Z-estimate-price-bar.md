# estimate-price-bar — visual low–high price bar on the ClubHanger Estimate

## Goal
Turn the ClubHanger Estimate's text-only low–high range + percentile ("…range
$49,995–$435,000 (median $125,000) — this one is priced above 87% of them.") into a
small **visual price bar** that spatially shows where this listing's asking price sits
between the cheapest and priciest comparable listing, with a median tick — so a buyer
reads relative price position at a glance.

## Pillar
Proprietary buyer-analysis (Pillar 3). Sharpens the flagship ClubHanger Estimate module
from a textual position read into a spatial one. No new data, query, or claim — purely a
visual synthesis of values the panel already computes (`low`, `high`, `median`, and the
subject's own asking price recovered as `median + deltaDollars`). Honest by construction.

## Scope
- `src/app/aircraft/listing/[id]/page.tsx` — `EstimatePanel` only. Add a small
  presentational price-bar element rendered **only in the existing `high > low` range
  branch** (where the textual range already shows). The degenerate single-value-spread
  fallback branch is unchanged.
- No changes to `src/lib/aircraftEstimate.ts` (the data is already there) and no new props
  on `EstimatePanel` — the subject asking price is `estimate.median + estimate.deltaDollars`.

## How the bar is positioned (honesty)
- The track represents the real comp spread: left edge = `low`, right edge = `high`.
- Median tick at `(median - low) / (high - low) * 100`%.
- Subject marker at `(asking - low) / (high - low) * 100`%, **clamped to [0, 100]** (the
  subject's own price is excluded from the comp set, so it can fall at/below `low` or
  at/above `high`; clamping keeps the marker on the track and stays consistent with the
  existing "priced below/above all of them" copy).
- All positions derive from the same real comp prices already shown — no fabricated values.

## Acceptance criteria
- [ ] On a listing whose Estimate has a real range (`high > low`), the panel renders a
      horizontal bar with the `low` price labelled at the left, the `high` price at the
      right, a median tick, and a distinct marker for this listing's asking price.
- [ ] The subject marker's horizontal position reflects its asking price within low–high
      (clamped to the track); the median tick sits at the median's position.
- [ ] The single-value-spread fallback branch (`high == low`) renders NO bar (unchanged).
- [ ] `npx next build` + `npx tsc --noEmit` pass clean.
- [ ] QA smoke exit 0 (HTTP 200, no app-origin console errors, no horizontal overflow) at
      desktop 1280 + mobile 375 on an aircraft listing detail page; the bar reads correctly
      in the screenshots at both viewports with no 375px overflow or marker clipping.

## Out of scope
- Changing the estimate math, honesty floors, comp query, or any copy other than what the
  bar needs.
- A bar on the Deal Check / Deal Score panels (this is the Estimate panel only).
- Animation/interactivity (static, server-rendered SVG/divs only — must not regress CWV).
