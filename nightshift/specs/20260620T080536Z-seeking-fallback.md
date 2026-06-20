# Spec — seeking-fallback

**Lane:** `[want]` · scoreboard at orient = **54** (scoreboard prints 60 pageviews/7d)

## Goal
Turn the empty `/partnerships/seeking` ("Pilots Seeking Partnerships") dead-end into a
useful page: when there are zero (or very few) seeker listings, show an improved empty
state that explains the situation, invites the visitor to post their own seeking listing,
AND surfaces real available partnerships so the page is no longer a dead-end.

## Scope (files expected to touch — keep small)
- `src/lib/partnerships.ts` — NEW: extract the existing `getLatestPartnerships(limit)`
  fetch (currently a private fn inside `FeaturedListings.tsx`) into a shared, exported
  helper so the new empty state reuses ONE source of truth (no duplicated fetch logic).
- `src/components/FeaturedListings.tsx` — import the extracted helper instead of its own
  inline copy (de-dupe; no behavior change).
- `src/components/SeekerList.tsx` — when `seekers.length === 0`, render the improved
  empty state: explanatory copy + "Post Seeking Listing" CTA (`/partnerships/seeking/new`)
  + a "While you're here, browse N available partnerships" block with a few real
  `PartnershipCard`s (reusing the shared helper) + a "View all partnerships" link to
  `/partnerships`. Each card links to a real `/partnerships/[id]`.
- `src/app/partnerships/seeking/page.tsx` — NO change needed (keep SEO metadata intact);
  only touch if required for wiring.

## Acceptance criteria (QA grades against these)
1. `/partnerships/seeking` with zero seeker listings renders an improved empty state that
   (a) clearly explains no pilots are currently posting seeking-listings, (b) shows a
   working "Post Seeking Listing" CTA → `/partnerships/seeking/new`, and (c) surfaces real
   available partnerships as `PartnershipCard`s with a "View all partnerships" → `/partnerships` link.
2. Each surfaced partnership card links to a real `/partnerships/[id]` that resolves HTTP 200.
3. The populated path is unchanged: if seeker listings exist, the normal SeekerCard list
   renders exactly as before (no fallback block).
4. Page SEO metadata, the partnership tabs, and the header "Post Seeking Listing" CTA are
   all still present (nothing removed).
5. `npx next build` green + typecheck clean (no NEW errors vs baseline). No schema change.
6. QA on the PRODUCTION build (`npm run start`) at desktop + 375px: no console/hydration
   errors, no horizontal overflow at 375px, sky-blue accent only.

## Out of scope
- No removal of the seeking feature, tabs, or CTA (FREEZE: removing features = ask-a-human).
- No schema/DB change, no migration.
- No redesign of the populated SeekerCard list or the partnerships page.
- No new palette colors (sky + existing neutrals only).
- No changes to frozen files (auth, env, secrets, harness).
