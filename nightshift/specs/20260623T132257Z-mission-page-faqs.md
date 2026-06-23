# Mission landing-page FAQs + FAQPage JSON-LD

## Goal
Give each of the 4 curated `/aircraft/mission/[mission]` pages a short, genuinely-useful
FAQ accordion plus matching `FAQPage` structured data — adding unique long-tail content
depth and rich-result eligibility to the freshly-shipped mission family (STAGE=INDEXING).

## Scope (small — mirrors the proven `/partnerships/seeking` pattern)
- `src/lib/missions.ts` — add a `faqs: { q: string; a: string }[]` field to the `Mission`
  interface and curate 4 honest, evergreen, mission-specific Q&As for each of the 4 missions
  (glass-cockpit, ifr, tailwheel, low-time). Distinct in wording from each mission's `intro`.
- `src/app/aircraft/mission/[mission]/page.tsx` — render `ModelFaq` (the existing native
  `<details>` accordion) with the mission's FAQs and emit `buildFaqPageJsonLd` alongside the
  existing ItemList JSON-LD. Reuse both existing, unit-tested helpers/components — no new dep.

## Acceptance criteria
- Each of the 4 mission pages renders a visible FAQ accordion (4 Q&As) below the listings.
- Each emits a `FAQPage` JSON-LD block whose questions/answers match the visible accordion 1:1.
- FAQ copy is honest/evergreen: no fabricated stats, no live counts, no keyword stuffing;
  each set is substantively unique per mission and distinct from that mission's intro prose.
- `npx next build` + typecheck pass; unknown mission slug still 404s.
- QA smoke exit 0 on all 4 mission pages at desktop 1280 + mobile 375 (HTTP 200, zero
  app-origin console errors, zero horizontal overflow); screenshots look right.

## Out of scope
- No change to listing data, filters, or the chip bar.
- No new mission slugs; no partnerships-side mission family.
- No visual redesign of the existing intro/cross-link blocks.
