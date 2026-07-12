# New alert builder on /alerts/manage

**Goal:** Let a subscriber create a brand-new alert directly from `/alerts/manage` instead of having to go hunt for a capture box elsewhere on the site.

## Scope
- `src/app/actions.ts` — new `createManageAlert(type, fields, token?)` server action. Proves ownership via the existing `resolveOwnerEmail` (session or the page's own `?token=`, same as every other manage-page action). Builds `source_path`/`context` via the existing `buildAlertCriteriaUpdate(type, null, fields)` helper (same one `updateAlertCriteria` uses), then inserts a new `alerts` row directly as `status: 'confirmed'` for the proven owner email (no second opt-in email — ownership already proven, same no-second-opt-in precedent as `subscribeManageCrossSell`/`subscribeSignedInAlert`). Idempotent on the existing `(email, source_path)` unique constraint (23505 → success). Same graceful-degrade retry for the not-yet-migrated `price_drop_opt_in`/`frequency` columns as `subscribeSignedInAlert`.
- `src/components/NewAlertForm.tsx` (new) — client component rendered on `/alerts/manage`: a "+ New alert" button that opens an inline form with a listing-type selector (Aircraft for sale / Partnerships / Seeking a partnership) followed by the matching fields (mirrors `AlertEditForm`'s field set per type). On submit, calls `createManageAlert`, fires `track('alert_subscribed', { source: 'manage_new', ... })` on success, shows a confirmation toast, and `router.refresh()`s so the new row appears in the list immediately.
- `src/app/alerts/manage/page.tsx` — render `<NewAlertForm token={scopeToken} />` above the alert list (and in place of/alongside the empty state when there are zero alerts).

## Acceptance criteria
- Signed-in visitor with zero or more alerts sees a "+ New alert" affordance on `/alerts/manage`.
- Opening it shows a type selector + the matching fields (aircraft: make/model/state/min/max price; partnership: make/state/airport; seeker: make/model).
- Submitting creates a real `status='confirmed'` alert row for the signed-in/token-proven email with no second opt-in email, and the new row appears in the list without a full page reload.
- Submitting again with the exact same criteria is idempotent (no duplicate row, no error).
- Fires `alert_subscribed` with `source: 'manage_new'` on a genuine new subscribe (not on the idempotent no-op).
- No console errors, no 375px horizontal overflow, works both on the signed-in-session path and the token-scoped (`?token=`) no-account path.

## Out of scope
- Editing an existing alert's criteria (already shipped, `AlertEditForm`).
- Any change to the digest cron / email templates.
- A "recently searched" quick-fill shortcut (future idea, not this slice).
