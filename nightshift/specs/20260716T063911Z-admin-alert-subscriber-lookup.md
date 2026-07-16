# Subscriber lookup on `/admin/alerts` — support tooling

## Goal
Give the human a way to answer "I can't find my manage link / why did I get this alert
email?" by looking up a subscriber's alerts by email on `/admin/alerts`, with a button to
resend their manage link — without ever displaying raw tokens in the admin UI.

## Scope
- `src/lib/alertsForOwner.ts` — add `fetchAlertsForEmailAdmin(email)`: like the existing
  `fetchAlertsForEmail` but (a) does NOT filter out `status='unsubscribed'` rows (a support
  agent needs to see those too) and (b) also selects the optional `source` column, with the
  same graceful per-column retry fallback for not-yet-migrated columns.
- `src/app/admin/alerts/actions.ts` (new) — two admin-only server actions, both gated by the
  existing, untouched `assertAdmin()` from `@/lib/admin-auth`:
  - `adminLookupAlertsByEmail(email)` — validates + looks up that email's alert rows
    (context, status, frequency, source, last_digest_at). Never returns `unsubscribe_token`/
    `confirm_token`.
  - `adminSendManageLink(email)` — thin wrapper around the existing, already-shipped
    `requestAlertsManageLink` (`src/app/actions.ts`) so the send path, cooldown, and
    no-enumeration behavior are 100% reused, not reimplemented.
- New client component `src/components/AdminAlertSubscriberLookup.tsx` — email input +
  submit, renders a small table of that email's alerts, and a "Email them their manage
  link" button with an inline success/cooldown message.
- `src/app/admin/alerts/page.tsx` — render the new component in a new "Subscriber lookup"
  section.

## Acceptance criteria
- `/admin/alerts` (signed in as an authorized admin) shows a new "Subscriber lookup"
  section with an email input and submit button.
- Submitting a known subscriber's email shows their alert rows (context/status/frequency/
  source/last-sent); an unknown email shows an honest "No alerts found for that email"
  empty state — never an error page.
- No raw `unsubscribe_token`/`confirm_token` ever renders in the admin UI.
- "Email them their manage link" reuses the existing `requestAlertsManageLink` send path
  (same cooldown, same email template) — no new email template.
- Both new server actions independently call `assertAdmin()` (mirrors the existing
  `publishDraft` pattern in `src/app/admin/review/actions.ts`) so they can't be invoked by
  a non-admin even if called directly, not just protected by the page-level gate.
- `npx tsc --noEmit` and `npx next build` both exit 0; no schema change; no new
  `alert_subscribed` capture point (this is a support tool, not a capture surface).

## Out of scope
- Editing a subscriber's alerts from the admin UI (read-only lookup + resend only).
- Bulk export / CSV of subscriber data.
- The separate "Daily-cron run log" admin item (different backlog entry).
- Any change to `src/app/admin/**` auth-gating logic or `ADMIN_EMAILS` (FREEZE'd) — this
  only calls the existing `assertAdmin()` helper, never modifies it.
