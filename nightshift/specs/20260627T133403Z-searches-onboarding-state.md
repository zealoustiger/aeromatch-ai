# Spec: searches-onboarding-state

**UTC:** 2026-06-27T133403Z  
**Pillar:** 2 — Frictionless signup/auth  
**Slug:** `searches-onboarding-state`

## Goal
When a user has no saved searches (especially a new user who just signed up and was redirected to `/searches` by the auth callback), show a rich, welcoming orientation state instead of a minimal empty shell — so they immediately understand what ClubHanger offers and have clear, actionable paths forward.

## Problem
The auth callback defaults to `/searches` when there's no `?next=` param. A brand-new user after signup lands on a page titled "My Saved Searches" showing a dashed empty box with "No saved searches yet." There's nothing to orient them about ClubHanger, no call to action for the core user journeys, and no explanation of what saved searches even are. The page reads as a dead-end.

## Scope — files to touch
- `src/app/searches/page.tsx` — replace the minimal empty state with a richer onboarding state (additive, non-breaking for users who DO have searches)

## Acceptance criteria
1. When the user has 0 saved searches, the page shows a welcome section above the empty-state message with a short orientation blurb ("ClubHanger helps you find the right aircraft partnership or plane for sale") and 3 prominent action cards: Browse aircraft for sale (`/aircraft`), Browse partnerships (`/partnerships`), Post a listing (`/partnerships/new` as entry point).
2. Each action card has a title, a one-line description, and a clear CTA link.
3. Below the action cards, the current instructional message about saved searches is preserved (so the user learns how to create one).
4. Users with 1+ saved searches see NO change — the existing populated UI is unchanged.
5. Page renders cleanly at desktop 1280 and mobile 375 (no horizontal overflow, no layout breaks).
6. No new console errors. Build passes clean.

## Out of scope
- Any change to auth files or the auth callback redirect destination
- DB schema changes
- Detecting "new user vs. returning user with no searches" — the improved empty state serves both equally well
- Any A/B testing or analytics instrumentation
