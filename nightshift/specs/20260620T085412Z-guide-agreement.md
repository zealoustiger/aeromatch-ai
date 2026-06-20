# Spec — Partnership-agreement pillar guide (guide 3)

## Goal
Ship a THIRD, distinct content guide — "What to Put in an Aircraft Partnership Agreement"
at `/guides/aircraft-partnership-agreement` — an educational explainer (NOT legal advice,
NOT a downloadable template) covering the topics a good co-ownership agreement addresses,
to win the high-intent / low-competition "airplane partnership agreement template / llc"
seam and grow indexable, genuinely-useful pageviews.

## Scope (files expected to touch — small)
- NEW `src/app/guides/aircraft-partnership-agreement/page.tsx` (mirror guide 2's structure,
  metadata, Breadcrumbs usage, FAQ-as-single-source-of-truth + FAQPage JSON-LD).
- EDIT `src/app/sitemap.ts` — add the new guide URL to the Guides static block (priority 0.6).
- EDIT `src/components/Footer.tsx` — add "Partnership agreement" to `guideLinks`.
- EDIT the two existing guides (`aircraft-co-ownership`, `cost-of-aircraft-co-ownership`)
  to add a real `<Link>` to guide 3 (reciprocal link graph, both directions).

## Acceptance criteria (QA grades against these)
1. `/guides/aircraft-partnership-agreement` renders real readable content (not lorem), with
   a unique H1/title DISTINCT from the other two guides (this one = the agreement/legal-structure
   checklist: ownership shares & buy-in/buy-out, scheduling & fair use, cost-sharing fixed vs hourly,
   maintenance & reserves, insurance, dispute resolution & exit/sale of a share, LLC-vs-direct).
2. Includes clear H2 sections, a short checklist, and a 5-question FAQ (incl. "Do I need an LLC
   to co-own a plane?" and "What happens if one owner wants out?").
3. A clear, PROMINENT "this is general educational information, NOT legal advice — have a qualified
   aviation attorney review your actual agreement" line is visible. No fabricated statutes/stats/legal-tax claims.
4. Unique title + meta + canonical + openGraph; Breadcrumbs (Home › Guides › {title}); FAQPage +
   BreadcrumbList JSON-LD parse valid and match the visible FAQ/breadcrumb (only visible Q&As; no review/rating).
5. Internal `<Link>`s to the other two guides, `/tools/cost-calculator`, `/partnerships`, and
   `/aircraft/cessna/172`; both other guides backlink to guide 3. Added to sitemap + footer.
   Spot-checked links resolve HTTP 200; `/sitemap.xml` lists it and resolves 200.
6. `npx next build` + typecheck pass; no console/hydration errors desktop + 375px; no overflow at 375px;
   sky-blue accent only.

## Out of scope
- NO DB / schema change (additive only).
- NO downloadable template/contract file, NO actual legal language to copy.
- NO /guides hub page (breadcrumb "Guides" stays plain text, matching guides 1 & 2).
- NO new palette / brand change; no frozen-file edits.
