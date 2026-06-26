# Spec: messages-unread-badge

**Timestamp:** 20260625T080938Z  
**Lane:** [want] — slice 4 of on-site messaging (P1[want])

## Goal
Show users how many unread message threads they have, so they don't miss conversations started while they were away.

## Scope (files to touch)
- `supabase/schema.sql` — additive migration: 4 new columns on `threads` + 1 UPDATE RLS policy
- `src/lib/types.ts` — extend Thread type with new fields
- `src/app/actions.ts` — update `sendMessage` to stamp `last_message_at/sender_id`; add `markThreadRead`
- `src/app/messages/[threadId]/page.tsx` — call `markThreadRead` on thread view (server-side)
- `src/components/Nav.tsx` — client-side unread count query + badge on mobile Messages link + prop to ProfileMenu
- `src/components/ProfileMenu.tsx` — badge on Messages menu item + notification dot on avatar button

## Acceptance criteria
1. After another user sends a message, the recipient sees a badge (count) on the Messages link in the mobile menu and on the ProfileMenu avatar.
2. The badge clears when the user opens the thread (visits `/messages/[threadId]`).
3. Badge shows correct count even with multiple unread threads.
4. Badge is hidden / count 0 when all threads are read or the user has no threads.
5. No badge for the sender's own messages (only shows messages from others).
6. No regression: messaging send/receive still works, `/messages` and `/messages/[threadId]` still render correctly.

## Out of scope
- Real-time badge update (Supabase channel subscription) — count updates on page navigation / next mount; live update is a follow-up
- Email notification on new message (slice 3 of messaging)
- Backfilling `last_message_at` for existing threads (they start as null → treated as no unread)
