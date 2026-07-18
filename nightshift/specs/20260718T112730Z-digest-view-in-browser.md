# digest-view-in-browser

## Goal
Give alert-digest emails a tokenized "View in browser" link that lands on a new page
rendering the alert's CURRENT live matches, closing the last open item in the plan-pass
batch #6 alert-experience `[goal]` queue.

## Scope
- New page `src/app/alerts/digest/view/page.tsx` — token-scoped (same `unsubscribe_token`
  trust boundary as `/alerts/manage`), server component, `noindex,nofollow`. Resolves the
  alert by token via `createAdminClient`, calls the existing `getAlertDigestPreview`
  (`src/lib/alertMatchCounts.ts`) for real current matches, renders them as on-site cards
  (same `ch-card` treatment `AlertsLanding.tsx` already uses for sample previews), honestly
  labeled "Live view — updated since your email was sent." Invalid/missing token renders the
  same "This link is no longer valid" pattern `/alerts/manage` uses. Links to
  `/alerts/manage?token=...` to manage/unsubscribe (no raw unsubscribe anchor on-page —
  avoids any link-prefetch risk of a GET unsubscribe route).
- `src/lib/email.ts`: add optional `viewUrl` to `buildAlertDigestEmail`'s opts (renders a
  quiet "View in browser" link near the top, HTML + text) and to `AlertDigestSection` /
  `buildCombinedAlertDigestEmail` (per-section, alongside the existing Edit/Stop/Share
  links).
- `src/app/api/cron/alert-digest/route.ts`: compute `viewUrl` from each alert's
  `unsubscribe_token` (same pattern as `manageUrl`) and pass it through on both the
  single-alert and combined send paths.
- Update both dev-only email-preview fixtures
  (`/api/dev/email-preview/alert-digest{,-combined}`) with a real `viewUrl` so the new link
  is visible for visual QA.
- Add unit tests in `src/lib/email.test.ts` mirroring the existing `shareUrl` test pairs
  (renders when set, omitted when not, per-section scoping for the combined template).

## Acceptance criteria
- `/alerts/digest/view?token=<valid-token>` renders the alert's live matches as clickable
  cards with real listing photos/prices, a live count line, and a manage-alert link.
- `/alerts/digest/view?token=<invalid-or-missing>` renders an honest "no longer valid" page,
  never a crash or empty blank page.
- `buildAlertDigestEmail({ ...opts, viewUrl })` renders a "View in browser" link in both
  HTML and text; omitted when `viewUrl` is not passed.
- `buildCombinedAlertDigestEmail` renders a per-section "View in browser" link only for
  sections that set `viewUrl`, never leaking one section's link into another's.
- `next build` + `tsc --noEmit` clean; full `node --test` suite green including the new
  tests.
- QA smoke (desktop 1280 + mobile 375) passes on `/alerts/digest/view` (valid + invalid
  token cases) and the two dev email-preview routes with zero console errors / overflow.

## Out of scope
- No change to `buildPriceDropEmail`, `buildConfirmEmail`, or any other email template.
- No new analytics/capture event (this is a viewing surface, not a new alert-signup point).
- No schema/DB change.
- No raw on-page unsubscribe link (routes through `/alerts/manage` instead).
