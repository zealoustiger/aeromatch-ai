# Save→watch cross-sell after hearting a listing

## Goal
When a signed-in visitor hearts (saves) an aircraft-for-sale or partnership listing for
the first time, offer a one-tap "alert me if the price drops" watch-alert signup inline
right next to the heart button — the highest-intent moment on the site currently has no
alert offer at all.

## Scope
- `src/components/SaveListingButton.tsx` — accept two new optional props
  (`watchContext`, `watchSourcePath`); after a signed-in visitor's heart click results in
  a *new* save (not an unsave, not a device-local save), check
  `getExistingAlertForSourcePath` for that listing's watch source path and, if none
  exists, show a small dismissible inline banner with a one-tap "Alert me if the price
  drops" button that calls the existing `subscribeSignedInAlert` server action
  (`source: 'save_cross_sell'`), then shows a done state.
- `src/app/aircraft/listing/[id]/page.tsx` — pass `watchContext`/`watchSourcePath`
  (reusing the same `watchContext`/`watchSourcePath` values already computed for the
  page's existing "Watch this listing" `AlertSignup` box) into its `SaveListingButton`.
- `src/app/partnerships/[id]/page.tsx` — same, computing the equivalent watch
  context/sourcePath values already used by that page's own watch `AlertSignup` box.
- Reuses existing server actions (`subscribeSignedInAlert`, `getExistingAlertForSourcePath`)
  — no new action, no schema change.
- Seeker listings (`/partnerships/seeking/[id]`) are out of scope — a seeker profile has
  no price to watch, so no props are passed there and the button's behavior is unchanged.

## Acceptance criteria
- Signed-in visitor hearts an aircraft-listing or partnership-detail page for the first
  time (not previously saved) → a small banner appears near the heart button offering
  "Alert me if the price drops."
- Clicking the banner's button creates a real, already-confirmed `alerts` row (via
  `subscribeSignedInAlert`) scoped to that exact listing's watch source_path, fires
  `alert_subscribed` with `source: 'save_cross_sell'` and `signed_in: true`, and the
  banner flips to a "you're set" done state.
- If the visitor already has a live watch alert for this listing, the banner does not
  render (no redundant offer).
- The banner has a close (X) affordance and never blocks or shifts the heart button
  itself; no horizontal overflow at 375px.
- Logged-out visitors and the seeker listing type see no behavior change (existing
  soft-save-prompt / plain heart-toggle flows untouched).
- `npx tsc --noEmit` and `npx next build` both exit 0.

## Out of scope
- Card-grid (icon variant) placements — this cycle only wires the detail-page "full"
  variant buttons.
- Any change to the existing watch `AlertSignup` box further down each detail page.
- Persisting "dismissed" state across page loads/sessions.
