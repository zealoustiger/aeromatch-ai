# Spec — guide-title-escrow-closing

**UTC:** 2026-06-20T11:16:33Z
**Branch:** night/guide-title-escrow-closing (off staging)
**Lane:** [goal] — SEO breadth + content-gap fill. Scoreboard at orient = 61 pageviews/7d.

## Goal
Ship the **7th** pillar content guide — the **second buyer-side** one — "Aircraft Title,
Escrow & Closing: How Buying a Plane Actually Closes" at
`/guides/aircraft-title-escrow-and-closing`, covering the legal/financial CLOSING process
(title search, FAA registration / N-number, escrow agent role, bill of sale, liens &
releases, closing steps, sales/use tax qualitatively). This is a genuinely distinct,
high-intent buyer topic that does NOT overlap the pre-purchase INSPECTION guide
(mechanical airworthiness) or the partnership/co-ownership guides.

## Why this lane & why it's distinct (honesty gate — PASSED)
- The last two cycles added "Buying a plane?" cross-link blocks across all three for-sale
  surfaces pointing into a buyer-guide cluster that currently has only ONE buyer guide
  (pre-purchase inspection). Both prior cycles' "Next:" lines explicitly call for a
  companion buyer-side guide (e.g. "aircraft title & escrow basics").
- Topic distinctness: the pre-buy guide answers "is the metal sound?" (compression,
  corrosion, ADs, logbooks). THIS guide answers "how does the deal legally and
  financially close?" (who holds the money, how title transfers, how a lien gets
  released, what the FAA needs to register the aircraft to you, how use tax can apply).
  Zero meaningful content overlap; the inspection guide even points AT title/escrow as a
  separate workstream ("a title and lien search to confirm the seller can convey clean
  ownership").

## Scope (match existing guide pattern EXACTLY)
- NEW `src/app/guides/aircraft-title-escrow-and-closing/page.tsx` — mirror
  `aircraft-pre-purchase-inspection/page.tsx`: unique TITLE/PATH/DESCRIPTION, canonical,
  og:type=article; Breadcrumbs (emits BreadcrumbList JSON-LD); a FAQPage JSON-LD built
  from a single FAQS array that is ALSO rendered verbatim in the visible FAQ section (no
  cloaking); sky-blue TOC; amber only on disclaimer + a "watch out" box; mobile-first.
- REGISTER: add to GUIDES array in `src/app/guides/page.tsx` (hub card grid + ItemList
  JSON-LD auto-grows to 7); add URL to `src/app/sitemap.ts` static guides block (priority
  0.6, changeFrequency monthly — same as the others); add to `guideLinks` in
  `src/components/Footer.tsx`.
- LINK GRAPH BOTH WAYS: new guide links OUT to `/aircraft`, the pre-purchase inspection
  guide, the cost-of-co-ownership guide, and `/guides` hub. Add a RECIPROCAL `<Link>` to
  the new guide from the pre-purchase inspection guide's "Keep reading" related block.

## Acceptance criteria (QA grades against these)
1. `/guides/aircraft-title-escrow-and-closing` returns 200 with a UNIQUE title, unique
   meta description, canonical to itself, og:type=article — all distinct from the other 6 guides.
2. JSON-LD parses: BreadcrumbList (Home > Guides > Title, Escrow & Closing) and FAQPage;
   every FAQ answer in the JSON-LD is rendered verbatim in the visible HTML.
3. Out-links all 200: `/aircraft`, `/guides/aircraft-pre-purchase-inspection`,
   `/guides/cost-of-aircraft-co-ownership`, `/guides`. Reciprocal link to the new guide
   is present on `/guides/aircraft-pre-purchase-inspection`.
4. Registered: `/guides` hub ItemList count = 7 and the new card renders; `/sitemap.xml`
   lists the new URL; Footer has the link.
5. Mobile-first 375px: zero horizontal overflow on the new guide AND the hub; desktop 1280 clean.
6. No new console / hydration errors at desktop + 375px on the new guide and the hub.
   Accent discipline: sky-blue accent; amber only on disclaimer + watch-out box.

## Out of scope
- NO schema/DB change, NO SQL. No changes to the for-sale cross-link block components.
- No fabricated dollar figures, statistics, or specific legal/tax determinations.
- No new nav item, no changes to other guides beyond the one reciprocal link.
