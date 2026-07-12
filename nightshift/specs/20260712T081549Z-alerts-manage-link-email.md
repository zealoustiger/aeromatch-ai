# alerts-manage-link-email

## Goal
Give email-only alert subscribers who lost their digest/confirm email a self-serve way back into `/alerts/manage`, by requesting a fresh manage link sent to their email — closing the "signed-out `/alerts/manage` is a dead end" gap flagged in BACKLOG.md's 🔔 GOAL section (`[P1][goal] "Email me my manage link"`).

## Scope
- `src/lib/email.ts` — new `buildManageLinkEmail(opts)` template (cream/sky brand tokens, mirrors `buildAlertConfirmEmail`'s style; no confirm action, just a "manage your alerts" link).
- `src/app/actions.ts` — new public server action `requestAlertsManageLink(email)`:
  - validates email format
  - looks up the most recent non-unsubscribed alert row for that email with a token
  - rate-limits via the existing `last_confirm_sent_at` column/`RESEND_COOLDOWN_MS` pattern (graceful-degrades if the column isn't migrated live yet, same precedent as `sendConfirmationResend`)
  - sends the manage-link email when a row is found and not in cooldown
  - **always returns the same neutral `{ ok: true }` result** regardless of whether an alert existed or the send happened — no email enumeration
- New `src/components/ManageLinkRequestForm.tsx` (client) — email field + submit, renders a neutral "if that email has alerts, a link is on its way" message post-submit.
- `src/app/alerts/manage/page.tsx` — render the new form in the existing signed-out branch, below the sign-in CTA.
- `src/components/AlertsLanding.tsx` — small "Already set up alerts? Manage them" link to `/alerts/manage` near the existing trust row.

## Acceptance criteria
- Signed-out visitor to `/alerts/manage` sees both the existing sign-in CTA and a new "email me my manage link" form.
- Submitting a real subscriber's email sends (or logs, since `RESEND_API_KEY` is unset in this environment) a manage-link email whose URL is `/alerts/manage?token=<their unsubscribe_token>` and correctly loads their alerts when visited.
- Submitting an email with no alerts, or a malformed email, never reveals whether alerts exist — same neutral success copy (malformed email may show a distinct "enter a valid email" validation error, which is not enumeration).
- Repeated submissions for the same email within the ~10 min cooldown do not re-send (silently), but the UI still shows the same neutral message.
- `/alerts` landing page links to `/alerts/manage` for returning subscribers.
- `npx next build` + typecheck clean; `qa-smoke.mjs` passes on `/alerts` and `/alerts/manage` at desktop 1280 + mobile 375 with zero app console errors / zero overflow.

## Out of scope
- Any change to the confirm/unsubscribe/pause token flows themselves.
- A "My alerts" nav-state change (separate backlog item).
- New DB columns/migrations (reuses `alerts.unsubscribe_token`/`last_confirm_sent_at`, already declared).
