# Spec: message-notify-throttle

**Timestamp:** 2026-06-25T101126Z  
**Slug:** message-notify-throttle

## Goal
Throttle new-message email notifications to at most one per thread per hour, preventing inbox spam in active conversations.

## Scope
- `src/app/actions.ts` — add a module-level `MESSAGE_NOTIFY_LAST` Map and a throttle guard inside `notifyMessageRecipient`

## Acceptance criteria
1. `notifyMessageRecipient` sends at most 1 email per (threadId) per 1-hour window.
2. If the throttle window has not elapsed, the function returns early without calling `sendEmail` (still resolves — fire-and-forget contract preserved).
3. If the throttle window has elapsed, a new email is sent and the timestamp is updated.
4. When `RESEND_API_KEY` is absent, the no-op path is unchanged.
5. No schema change. No new imports.
6. `npx next build` passes; QA smoke passes on `/messages`, `/aircraft`, `/partnerships/seeking`.

## Out of scope
- Distributed/Redis-backed throttle (same in-process approach as `AI_DRAFT_CALLS`; fine for current traffic)
- Per-recipient throttling (per-thread is sufficient: a busy thread ≤ 1 email/hr to the recipient)
- Unread badge / read-state changes
