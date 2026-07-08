# monetization-partnership-cta

## Goal
Add the two "partnership formation/management" honest fake-door CTAs (from the
Monetization — intent signals backlog item, slice 3) to the partnership detail
page, reusing the existing `MonetizationIntent` component verbatim.

## Scope
- `src/app/partnerships/[id]/page.tsx` — add a "More ways we can help" style
  card with two `MonetizationIntent` CTAs: `path="partnership_formation"`
  ("Help me form a partnership") and `path="co_ownership_management"`
  ("Manage my co-ownership"), placed in the sidebar column right after the
  "Interested?" contact card and before `ReportListing`.
- No changes to `MonetizationIntent.tsx`, `joinWaitlist`, or the DB schema —
  `source`/`path` is already free-text, no union type to extend.
- Out of scope this cycle: the "seller upgrade" CTAs in the post-listing flow
  (the other half of slice 3 per BACKLOG — a separate placement, left for a
  follow-up cycle to keep this one scoped) and slice 4 (admin tally of clicks
  per path).

## Acceptance criteria
- `/partnerships/[id]` renders a new card with two buttons: "Help me form a
  partnership" and "Manage my co-ownership".
- Clicking either opens the existing "Coming soon — want early access?" modal
  and fires `track('monetization_intent', { path })` with the matching path
  (`partnership_formation` / `co_ownership_management`).
- Submitting an email in the modal upserts a real `waitlist` row with the
  matching `source` (verified directly against the DB with a throwaway
  `@example.com` email, then deleted).
- `npx next build` + `tsc --noEmit` both clean.
- `qa-smoke.mjs` exits 0 on a real `/partnerships/[id]` page at desktop 1280 +
  mobile 375 (HTTP 200, zero app-console errors, zero horizontal overflow).
- No regression to the existing sidebar cards (cross-sell, structure, trust
  badge, contact card) at either viewport.

## Out of scope
- Seller-upgrade CTAs in the post-listing flow.
- Admin tally / scoreboard surfacing of click counts per path.
- Any change to the broker/financing/insurance/escrow/prebuy CTAs already on
  the aircraft listing page.
