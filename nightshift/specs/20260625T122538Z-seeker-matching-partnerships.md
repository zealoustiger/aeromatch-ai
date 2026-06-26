# Spec: seeker-matching-partnerships

**Timestamp:** 2026-06-25T122538Z  
**Lane:** [P1][want] — "Instant payoff when posting a seeking"  
**Slug:** seeker-matching-partnerships

## Goal
When a pilot views their seeker listing (or when an aircraft owner visits it), show up to 4 real open partnerships near that airport that match the seeker's aircraft preference — so posting feels immediately valuable, not into-the-void.

## Scope
- **1 file modified:** `src/app/partnerships/seeking/[id]/page.tsx`
  - Add `getMatchingPartnerships(seeker)` helper (server-side, calls `getPartnershipListings`)
  - Add import for `PartnershipCard` and `getPartnershipListings`
  - Render a new "Partnerships near {airport}" section below the main 2-col grid

## Acceptance criteria
1. A **"Partnerships near {airport}"** section appears below the main content on the seeker detail page when ≥1 matching active partnership exists.
2. **Matching logic:**
   - Primary filter: `airport = seeker.home_airport` (existing ilike query path)
   - Make filter: applied only when seeker has exactly **1** `preferred_makes` entry (avoids over-narrowing for multi-make or no-make-preference seekers)
   - Budget filter: apply `max_buyin` when set
   - Limit: 4 results
   - Fallback: if airport-filtered results = 0 AND seeker has a `state`, re-query with `state` filter only (same make + budget filters) — still up to 4
3. Section **self-suppresses** entirely when 0 matches (no empty state, no heading, no card grid).
4. Renders up to 4 **`PartnershipCard`** components in a responsive 2-col grid (1-col on mobile).
5. A **"Browse all partnerships near {airport}"** link at the bottom navigates to `/partnerships?airport={airport}`.
6. Build passes, no TypeScript errors, no console errors, no horizontal overflow at 375px or 1280px.

## Out of scope
- Background matching job / push notifications
- Radius expansion beyond exact airport match + state fallback
- Multi-make matching (deferred — over-narrows for seekers who want "Cessna or Cirrus")
- Pagination on the matching section
