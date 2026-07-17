# saved-page-watch-offers

## Goal
Add a per-row "email me if the price drops" watch offer to every saved aircraft and
partnership row on `/saved`, since today the highest-intent set of listings on the
site (a signed-in user's hearted items) has zero alert capture.

## Scope
- New client component `src/components/SavedListingWatchButton.tsx`: on mount calls
  `getExistingAlertForSourcePath(sourcePath)`; if an alert already exists, renders a
  quiet non-interactive "Watching for price drops" state; otherwise renders a small
  "Email me if the price drops" one-tap button that calls `subscribeSignedInAlert`
  (`source: 'saved_page_watch'`), fires `track('alert_subscribed', ...)` +
  `markAlertSubscriber()` on success, then swaps to the watching state.
- `src/app/saved/page.tsx`: for each saved partnership and aircraft row (skip
  seekers — no price to watch), compute `watchContext`/`watchSourcePath` using the
  exact same convention as the detail pages (`/aircraft/listing/${id}?watch=price`,
  `/partnerships/${id}?watch=price`, context = `[year, make, model].filter(Boolean).join(' ')`)
  and render the new button under each card, alongside the existing `SavedListingNote`.
- No schema change, no new capture surface pattern — reuses `subscribeSignedInAlert`
  and `getExistingAlertForSourcePath`, both already used elsewhere for the exact
  same watch flow (`SaveListingButton`'s save→watch cross-sell).

## Acceptance criteria
- Signed-in user with a saved active aircraft and/or partnership listing sees an
  "Email me if the price drops" button under each row on `/saved` (not under seeker
  rows).
- Clicking it, on success, writes a real `alerts` row (`source: 'saved_page_watch'`,
  `source_path` = the listing's own `?watch=price` path) and swaps the button to a
  quiet "Watching for price drops" state — no page reload needed.
- A row the user is already watching (alert already exists for that exact
  `source_path`) shows the watching state immediately on load, not the offer button
  (no redundant ask).
- `alert_subscribed` fires with `source: 'saved_page_watch'` on a genuine new
  subscribe.
- `npx tsc --noEmit` and `npx next build` both pass.
- No console errors / no horizontal overflow at desktop 1280 or mobile 375 on
  `/saved`.

## Out of scope
- Seeker rows (no price field).
- Any change to the existing save→watch cross-sell prompt on detail-page hearting
  (`SaveListingButton`'s `watchCrossSell` — untouched).
- Bulk/"watch all saved" action.
