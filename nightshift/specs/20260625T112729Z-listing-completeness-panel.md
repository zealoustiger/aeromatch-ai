# Spec: listing-completeness-panel

**Timestamp:** 2026-06-25T112729Z
**Lane:** [want] (last 3 non-bug: airport-seeker-section [want], carbon-cub-curate [goal], message-notify-throttle [want] — not all [want] → pull [want])

## Goal
Add a "Listing completeness" panel to the aircraft detail page (`/aircraft/listing/[id]`) showing individual quality signals with explicit ✓/✗ checkmarks — so buyers can see at a glance what information is available for a listing, beyond the opaque A/B/C grade badge.

## Scope
Files expected to touch:
- `src/components/ListingCompletenessPanel.tsx` (new component)
- `src/app/aircraft/listing/[id]/page.tsx` (import + render the panel)

## Acceptance criteria
1. A "Listing details" completeness panel renders on the aircraft detail page below the grade badge and above (or alongside) the ClubHanger Estimate panel.
2. The panel shows 5 signals with ✓ (green) if present or a muted gray `—` if missing:
   - **Real photos**: `pickRealPhoto(p.images) != null`
   - **Full specs** (make, model, year all non-null)
   - **Asking price** (`p.asking_price != null`)
   - **Registration / N-number** (`p.registration` non-empty)
   - **Total time** (`p.ttaf != null`)
3. Each signal is labeled in plain English (not internal field names).
4. The panel is visually contained (light border or soft background), consistent with the existing `EstimatePanel` style.
5. At 375px mobile the panel lays out correctly (single-column or 2-col grid) with no horizontal overflow.
6. The panel does NOT duplicate or replace the existing A/B/C grade badge — it is additive.
7. `npx next build` exits 0 with no TypeScript errors.
8. QA smoke exits 0 on the aircraft detail page at desktop 1280 + mobile 375.

## Out of scope
- Changing the A/B/C grade badge or removing it
- Showing the panel on browse cards (too crowded)
- Partnership listings (separate scope)
- "Description" signal (hard to show meaningfully on its own in the panel)
- "Posted by member" signal (N/A for scraped listings which are all aircraft-for-sale)
