# Spec: defer-partnership-search-gate

**UTC**: 2026-06-27T115545Z
**Pillar**: Signup / auth (Pillar 2) — defer gate to the moment of value

## Goal
Remove the sign-up modal that intercepts logged-out users when they search for
partnerships from the homepage. Take everyone directly to the `/partnerships?…`
results page; the "Save this search" affordance on the results page handles email
capture / account creation at the right moment (the value moment).

## Scope
- `src/components/HeroSearch.tsx` — remove `user` auth state, `showGate`/`pendingParams`
  state, `SignUpGate` import, and the gating branch in `handleSearch()`; the function
  now always navigates to `/partnerships?…`.
- Leave `src/components/SignUpGate.tsx` in place (valid component, no break).

## Acceptance criteria
1. A logged-out user on the homepage who picks an airport and clicks "Search" is
   taken directly to `/partnerships?airport=…` without any modal interruption.
2. A logged-in user still navigates to the same URL (behaviour unchanged for them).
3. Homepage (`/`) smoke-tests clean at desktop 1280 + mobile 375: HTTP 200, zero
   app-origin console errors, zero horizontal overflow.
4. `/partnerships` smoke-tests clean at the same checkpoints.
5. No new TypeScript errors; `npx next build` exits 0.

## Out of scope
- Removing `SignUpGate.tsx` from the codebase (leave it; doesn't break anything).
- Changing the `joinWaitlist` action or the results-page email capture flows.
- Any change to the "for sale" search tab (already gate-free).
- Any auth-flow changes (frozen per FREEZE.md).
