# Unique content depth — slice 4: "About co-owning a {Make}" prose on partnership make hubs

**Lane:** [goal] (last non-bug cycle `profile-menu` was [want]; no blocker — last cycle PASSed). STAGE=INDEXING.

## Goal
Give each of the 8 curated `/partnerships/make/[make]` hub pages a genuinely unique, evergreen "About co-owning a {Make}" narrative section — the partnership-side counterpart to the for-sale make-hub prose (slice 1) — so these priority index pages (#5 cessna, #6 cirrus, #7 piper among them) rise above templated, count-only boilerplate Google deprioritizes in the INDEXING stage.

## Scope (small, additive)
- `src/lib/seo.ts` — add a `PARTNERSHIP_MAKE_OVERVIEWS: Record<string, string[]>` map (8 makes × 2 paragraphs) + a `getPartnershipMakeOverview(slug)` helper (mirrors `getPartnershipMakeFaqs` / `getForSaleStateOverview`).
- `src/app/partnerships/make/[make]/page.tsx` — render an "About co-owning a {Make}" card (curated makes only; non-curated → nothing), reusing the for-sale-state overview card styling.

## Acceptance criteria
- All 8 curated makes (cessna/piper/cirrus/beechcraft/mooney/diamond/vans/grumman) render a 2-paragraph "About co-owning a {Make}" section with **distinct wording** from both the partnership FAQs on the same page AND the for-sale `MAKE_OVERVIEWS` (co-ownership angle, not brand-history retread).
- Prose is evergreen — NO fabricated statistics, NO live listing counts → never goes stale.
- The route still only generates the 8 SEO_MAKES (non-curated makes 404 as before); no make renders an empty/placeholder section.
- `npx next build` + typecheck pass; QA smoke exit 0 (HTTP 200, zero app console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on ≥3 make pages.
- No new component/color/dependency; NO schema/DB/SQL/JSON-LD change.

## Out of scope
- Partnership *state* hub prose, airport-page overviews, dynamic make+model prose (later slices).
- Any change to the FAQs, JSON-LD, listings query, or layout beyond inserting the prose card.
