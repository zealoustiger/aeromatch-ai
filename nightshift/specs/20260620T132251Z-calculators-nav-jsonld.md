# calculators-nav-jsonld

## Goal
Make both calculators (`/tools/cost-calculator`, `/tools/earnings-calculator`) discoverable from the global nav and eligible for richer search results, by adding a real "Tools" hub page + a top-level nav link with an icon, and `SoftwareApplication` JSON-LD on each calculator page.

## Why (Lane [want])
Explicit "Next" follow-up from the already-shipped Cost + Earnings Calculators item. Today the nav "Tools" link points directly at only `/tools/cost-calculator` (with no icon), and the earnings calculator is reachable only via footer/cross-links. A `/tools` hub surfaces both from one tasteful global nav entry, matching the existing `/guides` hub pattern.

## Scope (small)
- `src/app/tools/page.tsx` — NEW `/tools` hub page listing both calculators (mirrors `/guides` hub: card list + `CollectionPage` JSON-LD + breadcrumbs). Unique title/description/canonical/OG.
- `src/components/Nav.tsx` — point the existing "Tools" link at `/tools` and give it a `Calculator` icon (icon + label, sky accent) to match the icon+label pattern used by the other nav links. Desktop + mobile menus. No reordering of other items.
- `src/app/tools/cost-calculator/page.tsx` — add `SoftwareApplication` JSON-LD (name, description, applicationCategory FinanceApplication, free Offer, url) via the existing inline `<script type="application/ld+json">` pattern.
- `src/app/tools/earnings-calculator/page.tsx` — same JSON-LD treatment.
- `src/app/sitemap.ts` — add `/tools` hub URL.
- `src/components/Footer.tsx` — add "All tools" hub link (consistency with guides hub).

## Acceptance criteria
1. `/tools` returns 200 and lists both calculators with working links; unique `<title>`/`<meta description>`/canonical present in served HTML.
2. Global nav "Tools" link (desktop + mobile) points at `/tools`, renders with a Calculator icon + sky accent, and is active-highlighted on any `/tools*` route.
3. Both calculator pages emit a valid `SoftwareApplication` JSON-LD block (parses as JSON) with real fields only: name, description, applicationCategory, free Offer (price "0"), url. No fabricated ratings/reviews.
4. `/tools` hub emits valid `CollectionPage`/`ItemList` JSON-LD pointing at the two calculators.
5. `npx next build` green; `npx tsc --noEmit` shows no NEW errors vs the known `.test.ts` baseline.
6. No new console/hydration errors; no 375px horizontal overflow; sky-blue accent only.

## Out of scope
- No change to the calculator components themselves (CostCalculator / EarningsCalculator).
- No reordering/restructuring of other nav items.
- No new calculators, no schema/DB/SQL change.
- No ratings/reviews/aggregateRating in JSON-LD (would be fabricated).
