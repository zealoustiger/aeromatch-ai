# Spec — Aircraft Pre-Purchase Inspection buyer's-guide (guide #6)

slug: `guide-pre-purchase-inspection`
lane: `[goal]` (fall-through; `[want]` exhausted/blocked this run)
route: `/guides/aircraft-pre-purchase-inspection`

## Goal
Ship a sixth pillar content guide — a BUYER-side guide, "Aircraft Pre-Purchase
Inspection — A Buyer's Checklist" — that fills a real content gap (all 5 existing
guides are partnership/co-ownership focused; none covers the buyer/for-sale side)
and funnels high-intent "pre-buy inspection / what to check buying a used airplane"
search traffic into `/aircraft`, the highest-traffic, guide-less marketplace section.

## Scope (files touched — additive only)
- NEW `src/app/guides/aircraft-pre-purchase-inspection/page.tsx` — mirrors the exact
  pattern of guide 5 (`how-to-find-aircraft-partners`): `Metadata` with
  `title.absolute`, unique description, `alternates.canonical`, `openGraph` article;
  `Breadcrumbs` with crawlable Home > Guides > this crumb; a FAQ array as single
  source of truth feeding BOTH visible Q&As AND FAQPage JSON-LD; amber disclaimer box;
  sky-blue accents only.
- EDIT `src/app/guides/page.tsx` — append guide #6 to GUIDES array (lucide icon).
- EDIT `src/app/sitemap.ts` — add the new URL to the Guides static block, priority 0.6.
- EDIT `src/components/Footer.tsx` — append to `guideLinks`.
- EDIT `src/app/guides/how-to-find-aircraft-partners/page.tsx` — add ONE reciprocal
  `<Link>` to the new guide (in its "Keep reading" block) so the new guide isn't an orphan.

## Acceptance criteria
1. `/guides/aircraft-pre-purchase-inspection` resolves 200 with a UNIQUE
   title/description/canonical/OG-article distinct from the other 5 guides.
2. All JSON-LD parses: FAQPage (every Q AND answer rendered verbatim on the page),
   BreadcrumbList (Home > Guides > this).
3. Guide links OUT to `/aircraft` (primary CTA), `/guides/cost-of-aircraft-co-ownership`,
   `/guides/how-to-find-aircraft-partners`, `/guides`; every internal link resolves 200.
4. Reciprocal `<Link>` to the new guide is present on guide 5.
5. `/guides` hub now shows 6 cards (ItemList count 6); `/sitemap.xml` lists the new URL;
   Footer has it.
6. Zero horizontal overflow at 375px; no console/hydration errors at desktop + 375px on
   both the new guide and the hub; sky-blue accent only; amber disclaimer present.

## Honesty guardrails
- NO fabricated statistics, NO fake precision, NO specific legal/tax/airworthiness
  determinations. Cost framing qualitative/range only. Standard "general educational
  info, not legal/tax/financial/airworthiness advice — consult a qualified A&P/IA and
  your own advisors" disclaimer.

## Out of scope
- No schema/DB change. No new Nav item. No changes to the other 4 guides beyond the one
  reciprocal link on guide 5. No restructure of the guide layout.
