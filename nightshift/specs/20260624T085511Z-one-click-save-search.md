# One-click save search — auto-name + skip the naming step

**Lane:** `[want]` (last non-bug cycle `earnings-calculator-faq-jsonld` pulled `[goal]`;
last cycle PASS → no blocker → `[want]` owed per the 1:1). Closes **slice 1** of the
`[P2][want]` "One-click save search: auto-name + skip the naming step" backlog item — the
explicit "Next" queued by the just-shipped `save-search-in-filter-panel` cycle.

## Goal
Saving a search should be **one click**: auto-generate a readable name from the active
filters, save immediately (no "Name this search…" form), and confirm with a link to the
Saved Searches page where the user can manage/rename it later.

## Scope (small)
- **New** `src/lib/savedSearchName.ts` — a pure `autoNameSearch(params, path)` helper that
  turns the active query string into a concise human name (e.g. "Cessna 172 for sale in CA
  under $80k", "Cirrus partnerships near KHWD"). Unit-tested.
- **New** `src/lib/savedSearchName.test.ts` — worked-example tests for the helper.
- **Edit** `src/components/SaveSearchButton.tsx` — drop the inline naming form; on click
  (when signed in) save in one click with the auto-name, then show a confirmation that
  links to `/searches`. Gracefully treat a duplicate ("already saved") as success with the
  same link. Logged-out + no-filters behavior unchanged.

## Acceptance criteria
- Clicking **Save this search** while signed in saves immediately (no name prompt) and
  shows a confirmation containing a working link to **My Saved Searches** (`/searches`).
- The saved row's name is the auto-generated readable summary of the active filters (visible
  on `/searches`).
- Saving the **same** filters twice does not show a scary error — it confirms "Already saved"
  with the same link.
- Signed-out click still routes to `/auth?next=…`; the button still hides when no filters
  are active; the `fullWidth` panel variant still renders correctly.
- `npx next build` + typecheck pass; the helper's unit tests pass; QA smoke (HTTP 200, no
  app console errors, no horizontal overflow at 1280 + 375) passes on `/aircraft` and
  `/partnerships`.

## Out of scope
- Inline rename on `/searches` (that is **slice 2** — note in CHANGELOG Next).
- Any schema change (none — reuses the existing `saved_searches` table + `saveSearch` action).
- Changing the server-side `saveSearch` action or the `/searches` page layout.
