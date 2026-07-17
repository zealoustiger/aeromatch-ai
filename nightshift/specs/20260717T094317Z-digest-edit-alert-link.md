# digest-edit-alert-link

## Goal
Add a per-section "Edit this alert" link (next to the existing "Stop just this alert" link) in the combined alert-digest email, deep-linking to that alert's row on the token-scoped `/alerts/manage` page with its edit form pre-opened.

## Scope
- `src/lib/email.ts` — `AlertDigestSection` gets an optional `editUrl`; `buildCombinedAlertDigestEmail` renders an "Edit this alert" link (html + text) beside the existing stop link when present.
- `src/app/api/cron/alert-digest/route.ts` — build `editUrl` per section as `${SITE_URL}/alerts/manage?token=<this alert's unsubscribe_token>&edit=<alert.id>#alert-<alert.id>`, omitted when the row has no token yet (same graceful-degrade precedent as `stopUrl`).
- `src/app/alerts/manage/page.tsx` — read `?edit=<id>` from `searchParams`, add `id={`alert-${a.id}`}` to each alert `<li>` so the URL hash scrolls to the right row, and pass `autoOpen` to the matching row's `AlertEditForm`.
- `src/components/AlertEditForm.tsx` — new optional `autoOpen` prop; when true, opens the edit form once on mount (only if `target` is editable).

## Acceptance criteria
- A combined digest section whose alert has an `unsubscribe_token` renders an "Edit this alert" link beside "Stop just this alert" (both html and plain-text bodies), pointing at `/alerts/manage?token=...&edit=<id>#alert-<id>`.
- A section whose alert has no token renders no edit link (fails soft, no dead link) — matches `stopUrl`'s existing behavior.
- Visiting `/alerts/manage?token=...&edit=<id>` auto-expands that specific alert's edit form on load; other rows stay collapsed.
- Visiting `/alerts/manage` without `?edit=` behaves exactly as before (no row auto-opens).
- `npx tsc --noEmit` and `npx next build` pass.
- No schema change, no new capture point, no change to `buildAlertDigestEmail` (single-alert path) or existing `stopUrl`/manage/unsubscribe behavior.

## Out of scope
- Adding an edit link to the single-alert (non-combined) digest email.
- Adding an edit link to the confirm/price-drop emails.
- Any change to `updateAlertCriteria`/`AlertActions`/pause/resume/delete behavior.
