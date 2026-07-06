# nav-unread-badge-migration-fallback

## Goal
Stop the nav's unread-message-count query from 400ing on every page for every signed-in user, and make it self-heal automatically once the human applies the pending `threads` read-tracking migration.

## Background (confirmed live)
`schema.sql` (lines 526-529) declares `threads.last_message_at`, `last_message_sender_id`, `inquirer_read_at`, `owner_read_at` as additive columns, but they were never applied to the live Supabase DB (verified directly against prod via the service-role key: `select ... from threads` including these columns returns Postgres error `42703 column threads.last_message_at does not exist`). `Nav.tsx`'s unread-count effect selects exactly these columns on every mount/pathname change while signed in, so every route navigation by every signed-in user fires a failing request (visible in the browser console as a `supabase.co` 400) and `unreadCount` silently stays wrong (always computed from `null` data). This is a real broken feature (the unread badge never works), not just console noise — flagged twice already in CHANGELOG as a "possible future `[bug]`" but never actioned.

The write paths (`sendMessage`, `markThreadRead` in `src/app/actions.ts`) already ignore the update `error`, so they don't crash — they just silently no-op the read-tracking columns. Those don't need a code change.

The loop cannot apply DDL against the shared prod/staging Supabase project directly (no raw Postgres connection, only the service-role REST key) — this is a schema application gap that needs a human to run the already-written additive SQL, same class of gap as the `alerts_owner_select` RLS policy and `saved_listings.note` column noted in prior cycles.

## Scope
- `src/components/Nav.tsx` only.
- Add a module-level cache (`threadsReadTrackingAvailable: boolean | null`) so the first failing request in a browser tab session marks the enhanced columns as unavailable, and every subsequent Nav mount/route-change in that same tab skips the network call entirely instead of re-firing the failing query on every navigation.
- On failure, `unreadCount` degrades to `0` (matches the codebase's established graceful-degradation pattern for not-yet-applied migrations elsewhere).
- Once the human applies the migration, a fresh page load naturally retries and picks it up — no further code change needed.

## Acceptance criteria
- Signed-in nav's unread-count query fires the full-column select at most once per browser tab session (not once per route navigation).
- No behavior change once the columns exist (untouched success path, same unread-count logic).
- `npx next build` + typecheck pass.
- QA smoke passes (HTTP 200 / no app-origin console errors / no horizontal overflow) at desktop 1280 + mobile 375 on a couple of representative pages.
- No schema/DB change (this is a client-code resiliency fix, not the migration itself).

## Out of scope
- Actually applying the `threads` migration (needs a human with SQL-editor/DB access — flag loudly in the CHANGELOG).
- Any other messaging feature work.
- Retrying the failed request later in the same tab session (it stays degraded until reload — acceptable, matches other fallback patterns in this codebase).
