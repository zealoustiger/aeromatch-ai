# admin-pilot-verify

## Goal
Give admins a way to grant/revoke a pilot's "Verified" badge (`profiles.verified`),
closing the last open slice ("slice 4: admin verify wiring for the verified badge")
of the `[P1][want]` "Pilot profiles + reviews/trust" backlog item — the `verified`
column and its public badge on `/pilots/[id]` have existed since 2026-06-22 but no
admin UI has ever been able to set it (the column is trigger-protected: only
service-role writes are allowed).

## Scope
- `src/app/admin/pilots/page.tsx` (new) — lists `profiles` rows (most recent 100,
  newest first), each row showing display name (or "Unnamed"), email (looked up via
  `admin.auth.admin.getUserById`), home airport, ratings held, member-since, and a
  Verified/Not verified badge.
- `src/app/admin/pilots/actions.ts` (new) — `setPilotVerified` server action:
  `assertAdmin()` (existing, unmodified) then `createAdminClient().from('profiles')
  .update({ verified })`. No change to `admin-auth.ts` / `ADMIN_EMAILS`.
- `src/components/AdminTabs.tsx` — add a "Verify Pilots" tab linking to `/admin/pilots`.
- No schema change (`verified` already exists, trigger already allows service-role
  writes per `supabase/schema.sql` line 496).

## Acceptance criteria
- `/admin/pilots` renders the admin-only gate for a signed-out/non-admin visitor
  (reusing the existing `src/app/admin/layout.tsx` gate — no new auth logic).
- For an admin, the page lists profiles with a Verify/Unverify button per row.
- Clicking Verify sets `profiles.verified = true` for that `user_id` via the
  service-role client and the page reflects the new state after revalidation.
- Clicking Unverify reverses it.
- New tab appears in `AdminTabs` alongside the existing 9 tabs.
- `npx next build` + typecheck pass; QA smoke passes on `/admin/pilots` (HTTP 200,
  no console errors, no overflow at 1280/375 — rendering the logged-out admin gate,
  since the loop has no admin session to sign in with, same convention as other
  admin-page cycles).

## Out of scope
- Search/pagination beyond the most-recent-100 cap.
- Wiring `verified_ratings` (per-rating verification) — badge-level `verified` only.
- Any change to `admin-auth.ts`, `ADMIN_EMAILS`, or the admin layout's auth check.
