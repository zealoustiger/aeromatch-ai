# Spec: contact-intent-restore

**UTC:** 2026-06-28T072419Z  
**Branch:** night/contact-intent-restore  
**Pillar:** 2 — Frictionless signup / auth

## Goal
When a logged-out user clicks "Message" on any listing and returns to the same page after signing in via magic link, the messaging thread opens automatically — they don't need to click "Message" a second time.

## Problem
Currently, the contact-after-auth flow has one unnecessary click:
1. Anonymous user views a listing, clicks "Message seller/owner"
2. Redirected to `/auth?next=/partnerships/[id]` (context-specific headline shows since auth-context-headline cycle)
3. Signs in via magic link (email round-trip)
4. Returns to `/partnerships/[id]` — **but must click "Message" again**
5. Thread opens → `/messages/[threadId]`

Step 4 is pure friction: the user already expressed intent; the second click adds no value.

## Solution
Encode the contact intent as a `?contact=1` query param in the `next` URL when redirecting to auth. On mount, if `?contact=1` is present AND the user is authenticated, auto-trigger the message action.

## Scope

Files to modify:
- `src/components/ContactBar.tsx` — partnership contact (main flow for partnership listings)
- `src/components/SeekerContactBar.tsx` — seeker contact (aircraft owners contacting pilot seekers)
- `src/components/AircraftContactButton.tsx` — aircraft contact (user-posted aircraft)

Files NOT modified:
- `src/components/MessageOwnerButton.tsx` — seed/concierge personas only, not real listing flow
- Auth, Supabase, or any frozen files

## Acceptance criteria

1. Clicking "Message" while logged out on a partnership listing redirects to `/auth?next=%2Fpartnerships%2F[id]%3Fcontact%3D1`
2. Clicking "Message" while logged out on a seeker listing redirects to `/auth?next=%2Fpartnerships%2Fseeking%2F[id]%3Fcontact%3D1`
3. Clicking "Message" while logged out on a user-posted aircraft redirects to `/auth?next=%2Faircraft%2Flisting%2F[id]%3Fcontact%3D1`
4. After sign-in via magic link and landing on any of these URLs with `?contact=1` and an active session → thread auto-created and `/messages/[threadId]` navigation fires within 1–2 seconds of page load
5. The `?contact=1` param is removed from the URL immediately after auto-trigger (prevents re-fire on back-navigation)
6. If the user IS the listing owner, auto-trigger does NOT fire (owner can't message their own listing)
7. If `poster_id` is null, auto-trigger does NOT fire (can't message a listing with no account owner)
8. Existing logged-in "click to message" behavior is 100% unchanged

## Out of scope
- SaveSearchButton intent restore (separate slice)
- MessageOwnerButton (seed personas)
- Modifying auth callback or any frozen auth code
- Error UI changes (existing inline errors still apply)
