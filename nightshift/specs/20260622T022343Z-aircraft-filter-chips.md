# Active-filter chips on `/aircraft` results header

## Goal
Surface the currently-active marketplace filters as a row of **removable chips** at
the top of the `/aircraft` results column, so a pilot can see what's narrowing their
results and clear any one with a single tap — the twice-recommended follow-up to the
now-fully-shipped "Marketplace filters: multi-select + ranges" ([P1][want]).

## Scope (small, additive)
- **New** `src/components/ActiveFilterChips.tsx` — a **server** component (no client
  JS): reads the searchParams record, renders one chip per active filter, each chip a
  `<Link>` to `/aircraft` with that filter param stripped (and `page` reset).
- `src/app/aircraft/page.tsx` — render `<ActiveFilterChips params={params} />` at the
  top of the listings column, just above the `<AircraftSaleList>` Suspense.

## Acceptance criteria
- Setting any of make / model(s) / state / price range / year range / total-time range /
  listing-quality grade(s) / keyword / price-drops shows a matching chip in the header.
- Each chip's × link removes **only** that filter (rebuilding multi-value `model`/`grade`
  lists correctly) and returns to page 1; the rest of the URL/filters persist.
- Removing the **make** chip also clears `model` (mirrors the filter sidebar behavior).
- All-three grades selected (no real narrowing) shows **no** grade chips; `sort`/`page`
  are never shown as chips. A "Clear all" link appears when ≥2 chips are present.
- With no active filters the component renders nothing (no empty bar).
- `next build` + typecheck green; QA smoke exit 0 (HTTP 200, no console errors, no
  horizontal overflow) at 1280 + 375; screenshots look right.

## Out of scope
- No change to the filter sidebar/drawer, the query logic, or the SEO route pages.
- No new param, color, dependency, schema, or DB/SQL change.
- Not touching `sort` (ordering, not a result-set filter).
