# Spec — Partnership content guide: aircraft co-ownership pillar page

## Goal
Ship one genuinely-useful long-form pillar guide, "How Aircraft Co-Ownership &
Partnerships Work" at `/guides/aircraft-co-ownership` (new `/guides` route family),
targeting real informational search intent and wired into the internal link graph
both ways — to grow indexable, link-earning content (lane `[goal]`).

## Scope (files expected to touch — keep small)
- NEW `src/app/guides/aircraft-co-ownership/page.tsx` — the guide (server component:
  unique title/meta/canonical/OG, single H1, sectioned H2s, scannable body, FAQ
  section, Breadcrumbs, internal `<Link>`s out, FAQPage JSON-LD).
- EDIT `src/app/sitemap.ts` — add the guide URL under the static section (and a
  `/guides` hub line is out of scope; just the guide).
- EDIT `src/components/Footer.tsx` — add one tasteful "Guides" link so the page is
  reachable via a crawlable link, not only the sitemap.
- NEW spec + screenshots (this file + `nightshift/screenshots/guide-coownership/`).

## Acceptance criteria (QA grades against these)
1. `/guides/aircraft-co-ownership` renders real, readable, substantive long-form
   content (NOT lorem/placeholder/AI-slop): clear single H1, multiple H2 sections
   (how it works, types of shares, costs, how to split costs, finding a partner,
   pros/cons), and a FAQ section with real Q&As. No DB needed.
2. Unique `<title>`, meta description, and self-referential canonical; one H1.
3. Breadcrumbs render Home › Guides › How Aircraft Co-Ownership & Partnerships Work
   (reusing the shared `Breadcrumbs` component) and emit BreadcrumbList JSON-LD.
4. Real crawlable `<Link>`s OUT to: `/tools/cost-calculator`,
   `/tools/earnings-calculator`, `/partnerships`, and ≥1 make+model page that exists
   (`/aircraft/cessna/172`). Spot-checked links resolve HTTP 200 (not 404).
5. FAQPage JSON-LD present, parses as valid JSON, and every Q&A in it matches a
   Q&A visibly rendered on the page (no cloaking). NO review/rating markup.
6. `/sitemap.xml` lists `/guides/aircraft-co-ownership` and resolves HTTP 200.
7. `npx next build` green + typecheck clean (no NEW errors); no console/hydration
   errors; no horizontal overflow at 375px; sky-blue accent only.

## Out of scope
- No `/guides` index/hub page this cycle (just the one pillar page).
- No schema/DB change (additive content only; the page is fully static).
- No new components beyond the page itself (reuse Breadcrumbs).
- No nav (top-bar) change; footer link only.
- No additional guides — one pillar page this cycle.
