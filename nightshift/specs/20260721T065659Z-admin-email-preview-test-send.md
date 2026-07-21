# admin-email-preview-test-send

## Goal
Add a "Send this to my inbox" test-send button to each template on
`/admin/alerts/emails` so an admin can see exactly what Gmail/etc. do to a
real send (clipping, dark mode, image proxying) — today the page only
renders an iframe preview and explicitly says "no email is sent from this
page."

## Scope
- `src/app/admin/alerts/emails/actions.ts` (new) — `'use server'` action
  `adminSendEmailPreview({ name, subject, html, text })`: calls
  `assertAdmin()` (existing helper, untouched) to get the signed-in admin's
  own email, then `sendEmail({ to: adminEmail, subject: '[Preview] ' + subject,
  html, text, emailType: 'admin-preview-' + name })` (existing `sendEmail`
  helper, untouched). Recipient is always the caller's own admin email — never
  a free-text/client-supplied recipient.
- `src/components/AdminEmailPreviewCard.tsx` (new) — `'use client'`, renders
  one template's existing preview UI (subject line, iframe, text `<pre>`,
  unchanged) plus a "Send to my inbox" button (`useTransition`, matches the
  `AdminAlertSubscriberLookup.tsx` pending/sent/error pattern).
- `src/app/admin/alerts/emails/page.tsx` — swap the inline `<section>...</section>`
  JSX inside the `entries.map(...)` for `<AdminEmailPreviewCard entry={entry} />`;
  no change to how `entries` is built (all 11 existing builders/live-data
  fetches untouched).

## Acceptance criteria
- `/admin/alerts/emails` renders exactly as before (11 sections, same subject/
  iframe/text preview) plus a "Send to my inbox" button per section.
- Clicking the button sends that exact template's subject/html/text to the
  signed-in admin's own email via the existing `sendEmail` helper — never a
  different/free-text recipient.
- The action is gated by `assertAdmin()` — an unauthenticated/non-admin
  request is rejected, matching every other admin action in this codebase.
- No `RESEND_API_KEY` in this sandbox → `sendEmail` no-ops
  (`{ sent: false, reason: 'no-key' }`); the button must show a clear
  "couldn't send" state in that case, not a false "Sent!".
- No schema change, no new capture point, no change to `admin-auth.ts`/
  `ADMIN_EMAILS`/auth routes (FREEZE.md).
- `npx tsc --noEmit` and `npx next build` both clean.

## Out of scope
- Sending any of the 6 builders not currently on this page.
- Any change to the builders themselves, `sendEmail`, `SendPacer`, or
  `admin-auth.ts`.
- Rate limiting / cooldown on the test-send button (admin-only, self-only
  recipient, low risk — not the "never-spam" guardrail that applies to real
  subscriber sends).
