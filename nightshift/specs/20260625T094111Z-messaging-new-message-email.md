# Spec: messaging-new-message-email

**UTC:** 2026-06-25T094111Z  
**Lane:** [want] — on-site messaging slice 3 (email notification on new message)

## Goal
When a user sends an on-site message, automatically email the recipient a notification with a direct link to the thread — gated behind `RESEND_API_KEY` so it's a safe no-op until the key is configured.

## Scope
- `src/lib/email.ts` — add `buildNewMessageEmail(opts)` template
- `src/app/actions.ts` — update `sendMessage` to fire-and-forget the notification email

## Acceptance criteria
1. After a message is successfully inserted, `sendEmail` is called with the recipient's email address and a `/messages/{threadId}` deep link.
2. The notification goes to the OTHER participant (not the sender). Recipient = `owner_id` when sender is the inquirer; `inquirer_id` when sender is the owner.
3. When `RESEND_API_KEY` is absent, the whole flow logs `[email:noop]` and returns `{ ok: true }` — message delivery is never blocked or errored by the email path.
4. The email renders cleanly: subject "New message on ClubHanger", brief "You have a new message" body, a call-to-action button linking to `https://clubhanger.com/messages/{threadId}`.
5. The email send is fire-and-forget (does not add latency to the `sendMessage` action — await it but don't propagate the error).

## Out of scope
- Unsubscribe preferences for message notifications (future slice)
- Rate-limiting / deduplication if multiple rapid messages arrive (future slice)
- Real-time Supabase channel subscription for the unread badge (separate slice)
- Alert confirmation / digest emails (separate feature)
