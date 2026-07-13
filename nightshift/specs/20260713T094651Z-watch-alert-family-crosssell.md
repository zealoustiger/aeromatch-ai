# watch-alert-family-crosssell

## Goal
After a visitor confirms a "watch this listing" alert (price-drop watch on one aircraft or
partnership), offer a one-click cross-sell to alert on the whole make/model family — today
`getCrossSellSuggestion` silently returns nothing for watch-shaped `source_path`s.

## Scope
- `src/lib/alertWatchStatus.ts` — add `make`/`model` (raw DB values) to `WatchedListingStatus`,
  populated from the fetch `getAircraftWatchStatus`/`getPartnershipWatchStatus` already make
  (no extra round-trip).
- `src/lib/alertCrossSell.ts` — teach `getCrossSellSuggestion` to recognize a watch path
  (`isListingWatchPath`), resolve it via `getWatchedListingStatus`, and build a suggestion:
  - Aircraft: prefer the curated family page (`resolveMakeModelFamily` → `/aircraft/{makeSlug}/{modelSlug}`),
    falling back to `/aircraft?make=…&model=…` when no curated family page exists.
  - Partnership: `/partnerships?make=…` (partnership match-counting has no model dimension,
    matching the existing counterpart-suggestion precedent already in this file).
  - Honesty gate: re-verify with `getAlertMatchCount` and only return a suggestion when the
    live count is > 0 — no suggestion beats a wrong/empty one (existing file convention).
- No component or page changes needed — `AlertCrossSell` / `/alerts/status` / `/alerts/manage`
  already render whatever `getCrossSellSuggestion` returns.

## Acceptance criteria
- Confirming a watch alert on an active aircraft listing whose make/model has ≥1 other active
  match renders the family cross-sell box on `/alerts/status`.
- Confirming a watch alert on a partnership with ≥1 other active same-make partnership renders
  the make-wide cross-sell box.
- A watch alert whose family has 0 other live matches renders no cross-sell box (no fabricated
  suggestion).
- Existing non-watch cross-sell behavior (sibling model / nearby state / counterpart type) is
  unchanged.
- `npx tsc --noEmit` and `npx next build` both clean.
- QA smoke passes on `/alerts/status` and `/alerts/manage` (desktop 1280 + mobile 375, HTTP 200,
  no console errors, no horizontal overflow).

## Out of scope
- Changing `/alerts/manage`'s watch-status UI itself.
- Adding a model dimension to partnership match counting.
- The other open `[P2][goal]` item (capture-time widen alternative on zero-match empty states).
