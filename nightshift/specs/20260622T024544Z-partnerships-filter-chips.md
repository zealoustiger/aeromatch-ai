# Removable active-filter chips on /partnerships

## Goal
Mirror the proven removable active-filter chip row (shipped on `/aircraft`) onto the
Partnerships results so pilots can see at a glance what's narrowing their search and
remove any one filter with a tap.

## Scope (small, additive)
- New `src/components/PartnershipActiveFilterChips.tsx` — a pure **server** component
  (no client JS / hydration), modeled on `ActiveFilterChips.tsx`, keyed to the
  partnership filter params: `airport` (+`radius`), `state`, `make`, `share_type`,
  `max_monthly`, `max_buyin`.
- `src/app/partnerships/page.tsx` — render the chips above the `PartnershipList`
  Suspense block, passing the resolved `params`.

## Acceptance criteria
- With no filters set, nothing renders (returns null).
- Each active partnership filter shows one removable sky pill; tapping the × strips
  just that filter (href is a `<Link>` to `/partnerships?…`), the rest stay.
- `airport` chip removal also clears `radius` (radius is meaningless without an airport).
- `state` shows the full state name; `share_type` shows its human label (e.g. "1/2 Share",
  "Leaseback"); `max_monthly`/`max_buyin` show "Under $X/mo" / "Under $X buy-in".
- "Clear all" link appears only with ≥2 chips and links to bare `/partnerships`.
- No new console errors, no horizontal overflow at desktop 1280 + mobile 375; build + typecheck green.

## Out of scope
- Multi-select / range filters on partnerships (filters stay single-value).
- Changing the partnership filter UI, query, or any styling beyond the chip row.
- Touching `/aircraft` or the existing `ActiveFilterChips` component.
- Any schema/DB/SQL change.
