# Spec — Make "Save this search" prominent in results

**Slug:** `save-search-prominence`
**Lane:** `[want]` (last non-bug cycle `sitemap-lastmod` pulled `[goal]`; alternate → `[want]`)
**Backlog item:** "[P2][want] Make 'Save this search' prominent in results for both for-sale and
partnerships (saving a listing is discoverable; saving a search isn't)."

## Goal
Make the existing "Save this search" affordance on `/aircraft` and `/partnerships` clearly
discoverable — it currently appears (only when filters are active, which is correct) as a muted
gray bordered button tucked in the header action bar, easy to miss next to the prominent sky
"+ Post" CTA, so users who just filtered don't realize they can save the search the way they can
heart a listing.

## Scope (small — one shared component)
- `src/components/SaveSearchButton.tsx` — restyle the resting/default button state to an inviting,
  prominent sky-accent affordance (sky border + sky text + bookmark icon, light sky hover), so it
  reads as a real call-to-action rather than a muted secondary control. Both `/aircraft`
  (`basePath="/aircraft"`) and `/partnerships` (default) render this shared component, so both pages
  benefit from the single change. Behavior is unchanged.

## Acceptance criteria
- When filters are active, "Save this search" renders with a prominent sky-accent style (sky border
  + sky text/icon) on BOTH `/aircraft` and `/partnerships`, visibly distinct from the prior muted
  gray treatment.
- When NO filters are active (no query params), the control still renders nothing (unchanged).
- Logged-out click still routes to `/auth?next=<basePath>?<params>` (gate unchanged).
- Logged-in click still opens the inline "Name this search…" form, and saving still persists via
  `saveSearch(...)` and shows the "Saved!" confirmation (behavior unchanged).
- No horizontal overflow at 375px and no app-origin console errors on either page.
- `next build` + typecheck pass.

## Out of scope
- No new save-search entry points / second affordance (avoid clutter) — restyle in place only.
- No change to the save/replay logic, the `saved_searches` table, the `/searches` view, or the
  auth gate flow.
- No email-alert wiring (separate backlog item; "don't send yet").
- No change to any other page or component.
