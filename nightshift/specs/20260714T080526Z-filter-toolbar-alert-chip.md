# Filter-toolbar "Alert me for this search" chip

## Goal
Add a compact 🔔 "Alert me for this search" chip to the active-filter toolbar on
`/aircraft` and `/partnerships`, so a visitor with an active filter set can subscribe
in one tap instead of scrolling to the bottom of the results list.

## Scope
- New shared client component `src/components/AlertMeChip.tsx`:
  - Props: `context?: string`, `sourcePath: string`, `noun?: 'aircraft' | 'partnership'`.
  - Mirrors `AlertSignup`'s client-side signed-in check (`supabase.auth.getUser()` +
    `onAuthStateChange`) and `getExistingAlertForSourcePath` lookup, plus
    `isLocallySubscribed` for the signed-out/email-only case.
  - Signed-in, no existing alert → clickable chip; click calls
    `subscribeSignedInAlert(context, sourcePath)`, then `track('alert_subscribed', {
    source: 'filter_toolbar', signed_in: true, ... })` and `markAlertSubscriber()`.
  - Signed-in with an existing alert for this exact `sourcePath`, OR signed-out with
    `isLocallySubscribed(sourcePath)` true → non-interactive "🔔 Alerts on" pill
    (mirrors `SavedSearchAlertButton`'s subscribed state) — never re-submits.
  - Signed-out, not locally subscribed → clickable chip; click smooth-scrolls to the
    page's existing `#alert-email` input (the footer `AlertSignup`, which already
    receives the same `context`/`sourcePath`) and focuses it. No new subscribe path —
    reuses the existing double-opt-in email form. If `#alert-email` isn't present in
    the DOM (e.g. zero results so the footer `AlertSignup` doesn't render), the click
    is a silent no-op.
- `ActiveFilterChips.tsx` (`/aircraft`) and `PartnershipActiveFilterChips.tsx`
  (`/partnerships`): accept new `alertContext`/`alertSourcePath` props, render
  `<AlertMeChip>` after the mapped filter chips (same gate as today — only when
  `chips.length > 0`, i.e. at least one filter is active).
- `src/app/aircraft/page.tsx` and `src/app/partnerships/page.tsx`: pass the
  already-computed `alertContext`/`alertSourcePath` into the two chip components.

## Acceptance criteria
- On `/aircraft?make=Cessna` (or any ≥1-filter URL), the filter toolbar shows a 🔔
  "Alert me for this search" chip alongside the removable filter chips.
- With no filters active, no chip renders (matches the existing chip-row suppression).
- Signed-out click scrolls to and focuses the existing email field; no page navigation,
  no console error.
- Signed-in click (verified directly against the DB, not a live browser session — no
  test auth session available in this environment, consistent with prior cycles'
  precedent) creates a confirmed `alerts` row and the chip swaps to "Alerts on"; a
  second click is a no-op (already-subscribed state).
- New capture point fires `alert_subscribed` with `source: 'filter_toolbar'`.
- Same behavior lands on `/partnerships` (shared component, `noun="partnership"`).
- `npx tsc --noEmit` and `npx next build` both pass; no regression to the existing
  removable filter chips.

## Out of scope
- `/partnerships/seeking`'s `SeekerActiveFilterChips` (not named in the backlog item;
  can follow as a natural next slice).
- Any change to `AlertSignup` itself, the digest cron, or the `alerts` schema.
- An `alert_capture_viewed` impression event for the chip (not requested).
