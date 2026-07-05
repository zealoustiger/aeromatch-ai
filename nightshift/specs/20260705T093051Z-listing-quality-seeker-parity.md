# listing-quality-seeker-parity

## Goal
`/listing-quality` (the trust-signals/quality-grade explainer page) documents trust
signals for partnership and aircraft-for-sale listings but never mentions seeker
(pilots-seeking-a-partnership) listings, even though `seekerTrust.ts` shipped a full
4-signal trust system for them on 2026-07-05 — close that documentation gap so the
explainer covers all 3 listing types, matching what buyers/posters actually see.

## Scope
- `src/app/listing-quality/page.tsx`:
  - Import `SEEKER_TRUST_SIGNALS` from `src/lib/seekerTrust.ts`.
  - Add a third "Seeker listings" column to the trust-signals grid (alongside the
    existing "Partnership listings" / "Aircraft for sale" columns), rendering
    `SEEKER_TRUST_SIGNALS` the same way (Check icon + label + hint).
  - Adjust the grid from `sm:grid-cols-2` to accommodate 3 columns (e.g.
    `sm:grid-cols-2 lg:grid-cols-3`) so it doesn't look cramped.
  - Update the intro sentence "The checks differ slightly for partnerships and for
    aircraft for sale:" → include seeker listings.
  - Update the header paragraph ("Every aircraft and partnership listing...") and the
    FAQ answer ("What are the trust signals?") to mention all 3 listing types instead
    of implying only 2.

## Acceptance criteria
- `/listing-quality` renders a third column listing all 4 seeker trust signals
  (Aircraft preference stated / Budget disclosed / Experience disclosed / Posted by
  a member) with the same visual treatment as the other two columns.
- Intro copy and FAQ copy no longer imply only aircraft + partnership listings have
  trust signals.
- No schema/data/query change — pure copy + presentational JSX addition, reusing the
  existing `SEEKER_TRUST_SIGNALS` export.
- `npx next build` + typecheck pass.
- QA smoke passes on `/listing-quality` at desktop 1280 + mobile 375 (no console
  errors, no horizontal overflow); screenshots reviewed since this is a visual/layout
  change.

## Out of scope
- Any change to `seekerTrust.ts`, `aircraftTrust.ts`, `partnershipTrust.ts`, or the
  badge components themselves.
- Any change to the JSON-LD FAQ structured data beyond keeping the visible FAQ text
  and the JSON-LD in sync (per the existing "keep them in sync" comment).
