# Spec — forsale-cost-calc-crosslink

## Goal
Add ONE tasteful contextual internal link from the for-sale make+model aggregation page (`/aircraft/[make]/[model]`) to `/tools/cost-calculator`, so crawlers reach the cost calculator from more high-intent for-sale surfaces and buyers reading a listing-family page get funneled to a genuinely relevant tool.

## Lane
`[goal]` — Internal-linking lever (the `[P1][goal]` "Internal linking graph" backlog item). **Deliberate fall-through**: the `[want]` lane is blocked this run (per the prior DRAIN SUMMARY: `partnership_seekers` 0 rows, email infra missing, photos/ingest WIP, pilot-profiles needs a human migration).

## Why this surface
The make+model page (`/aircraft/[make]/[model]`) already has a "Cost to own a {Make} {Model}" card (the `Wallet` card) that talks about ownership cost and already links to `/partnerships`. It is the single highest-intent, most-contextually-relevant spot on the site for a "estimate your cost to own" CTA — the visitor is already reading cost-to-own prose for a specific aircraft. This is the make+model surface named first in the task; it's the best fit so the make-level / state alternates are not needed.

## Scope (small)
- `src/app/aircraft/[make]/[model]/page.tsx` — add ONE inline contextual link inside the existing "Cost to own a {label}" card, immediately after the existing "Browse {make} partnerships" line. Reuse the existing inline `<Link className="font-medium text-sky-600 hover:underline">` pattern + sky-blue accent already used in that exact card. Text: "Estimate your cost to own a {Make} {Model} →" → `/tools/cost-calculator`.

## Acceptance criteria
1. `/aircraft/[make]/[model]` (e.g. `/aircraft/cessna/172`) renders a single new contextual link reading "Estimate your cost to own a Cessna 172 →" that points to `/tools/cost-calculator`.
2. The link reuses the existing sky-blue inline-link styling already present in that card (no new component, no banner, no new color). It sits inside the existing "Cost to own a {label}" card.
3. Clicking the link navigates to `/tools/cost-calculator` (200, calculator renders).
4. No new link is added to any OTHER page type (not make-level, not state, not the listing cards) — exactly one surface.
5. Looks right at 375px (no horizontal overflow, link wraps cleanly) AND desktop.
6. `npx next build` + typecheck pass with no new errors; no new console/hydration errors on the page.

## Out of scope
- No new page family, no schema/DB change, no SQL, no JSON-LD change.
- No query-param prefill of the calculator (it accepts none).
- No links on `/aircraft/[make]`, `/aircraft/for-sale/[state]`, or listing cards.
- No banner / sidebar / repeated CTA. Exactly one inline contextual link.
