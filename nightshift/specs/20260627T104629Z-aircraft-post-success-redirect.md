# Spec: aircraft-post-success-redirect

**UTC:** 2026-06-27T104629Z  
**Pillar:** Posting (Pillar 1) — close the posting feedback loop for aircraft-for-sale

## Goal
After a seller posts an aircraft for sale, redirect them directly to their listing's detail page so they can see it live, share the URL, and feel the activation payoff — instead of being silently dropped on the browse page.

## Problem
`createAircraftListing` currently redirects to `/aircraft?posted=${data.id}`. The `/aircraft` browse page ignores the `posted` param entirely — the seller just sees the generic listing browse with no confirmation that their listing was created. This is a dead end in the posting activation loop, especially compared to the partnership post flow which correctly redirects to `/partnerships/${data.id}`.

## Scope (files to touch)
1. `src/app/actions.ts` — change one `redirect` call: `→ /aircraft/listing/${data.id}?posted=1`
2. `src/app/aircraft/listing/[id]/page.tsx` — add `searchParams` prop, show an inline "Your listing is live!" success notice in the main content area when `posted=1` is present. Notice includes a "View my listings →" link to `/listings`.

## Acceptance criteria
1. After submitting the aircraft post form (authenticated), the browser navigates to `/aircraft/listing/{new-id}` (the detail page of the new listing).
2. When `?posted=1` is in the URL, a green/sky "Your listing is live!" notice is visible in the page.
3. The notice includes a "View all my listings →" link pointing to `/listings`.
4. The notice is absent when `?posted=1` is NOT in the URL (normal detail page visit).
5. The seller sees the standard "This is your listing. Interested buyers can message you once they sign in." contact section from `AircraftContactButton`.
6. No console errors. No horizontal overflow at 375px.
7. `npx next build` passes with zero TypeScript errors.

## Out of scope
- No changes to the partnership or seeker post flows (already redirect correctly).
- No dismissible toast/animation — a static inline notice is sufficient.
- No changes to the listing edit/delete functionality.
- No schema changes.
