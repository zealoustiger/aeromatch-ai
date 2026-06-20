# Spec — Homepage search skips the SignUpGate when already signed in

**Slug:** `hero-search-skip-gate-when-authed`
**Lane:** [bug] (blocker — allocation policy: blockers first)
**Date:** 2026-06-20

## Context / which bug
Two `[P1][bug]` items were open under "From report feedback":
- (a) Save-listing sign-in redirects to homepage instead of back to the listing.
- (b) Logged-in user clicking homepage **Search** still hits the `SignUpGate`.

Verification on current `staging` (code audit):
- **(a) is ALREADY FIXED.** `SaveListingButton` builds `next=<originating path+query>` and routes to
  `/auth?next=<next>`; `auth/page.tsx` threads `next` into `/auth/callback?next=…`; `auth/callback/route.ts`
  redirects to `${origin}${next}`. The whole post-auth `next` chain is sound — no homepage fallback. Will
  re-confirm in QA, but there is nothing to fix in code.
- **(b) STILL REPRODUCES.** `HeroSearch.handleSearch()` unconditionally does `setShowGate(true)` with **no
  auth check at all**, so a signed-in user is forced through the gate instead of going straight to results.

→ Fix **(b)**, the still-reproducing, highest-value blocker.

## Goal (one sentence)
When a signed-in user runs the homepage airport/radius search, skip the `SignUpGate` and navigate
straight to `/partnerships?<params>`; logged-out behavior (show the gate) is unchanged.

## Scope (small)
- `src/components/HeroSearch.tsx` — read the current auth state (read-only `supabase.auth.getUser()` +
  `onAuthStateChange`, the exact pattern already used in `SaveListingButton.tsx`). In `handleSearch()`,
  if a user is present, `router.push('/partnerships?<params>')` directly instead of opening the gate.

## Acceptance criteria (QA grades these)
1. **Logged-out** homepage search still opens the `SignUpGate` (unchanged behavior).
2. **Logged-in** homepage search opens **no** gate and navigates straight to `/partnerships?airports=…`
   (or `?airport=…&radius=…`) — proven on a fresh load with a real signed-in session.
3. Bug (a) re-verified gone: from a logged-out listing page, clicking the heart → sign in → lands back on
   the **originating listing path**, not `/`. (No code change; QA confirmation of the existing chain.)
4. `npx next build` green and `tsc` shows no new errors in touched files.
5. No new console errors / hydration warnings at desktop (1280) and 375px on the homepage.
6. No visual change to the homepage search UI (auth state only affects what Search does).

## Out of scope
- Any change to the auth flow / `src/app/auth/**` / supabase clients (FREEZE — and not needed).
- Any change to `SignUpGate` internals or its copy.
- Touching `SaveListingButton` / the `next` redirect chain (already correct).
- Server-side auth gating, middleware, or new tables.
