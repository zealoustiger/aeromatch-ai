# Spec — Content guide 5: "How to Find Aircraft Co-Owners / Partners"

## Goal
Ship a fifth pillar content guide at `/guides/how-to-find-aircraft-partners` targeting the
high-intent search "how to find aircraft partners / find someone to co-own a plane with /
find a co-owner" — the SOURCING/"how do I actually find people" angle, distinct from the
four existing guides, funneling straight to `/partnerships` as the primary CTA.

## Scope (files to touch — small)
- NEW `src/app/guides/how-to-find-aircraft-partners/page.tsx` — mirrors guide 4
  (`leaseback-vs-co-ownership/page.tsx`) structure EXACTLY: same Metadata shape
  (`title.absolute`/description/`alternates.canonical`/`openGraph` article), same
  `Breadcrumbs` with crawlable Guides crumb, FAQ-array as single source of truth feeding
  visible Q&As + FAQPage JSON-LD (+ BreadcrumbList from Breadcrumbs).
- EDIT `src/app/guides/page.tsx` — add guide 5 to `GUIDES` array (auto-grows card grid +
  ItemList JSON-LD to 5).
- EDIT `src/app/sitemap.ts` — add `/guides/how-to-find-aircraft-partners` (priority 0.6).
- EDIT `src/components/Footer.tsx` — append to `guideLinks`.
- EDIT guide 1 (`aircraft-co-ownership/page.tsx`) and guide 3
  (`aircraft-partnership-agreement/page.tsx`) — add reciprocal `<Link>` to guide 5.

## Distinct topic (no duplication with guides 1-4)
This is the SOURCING guide: WHERE to look (flying clubs, FBOs/flight schools, EAA chapters
& type clubs, airport bulletin boards, online incl. ClubHanger partnerships); HOW to vet a
candidate (flying goals, hours/ratings, budget, based airport, personality/compatibility,
references); RED FLAGS; how many partners makes sense; and the steps from "found someone" to
a signed agreement (link guide 3) and shared costs (link guide 2 + calculator). 5-question FAQ.

## Internal links (both directions)
- Out: `/partnerships` (primary CTA), `/guides/aircraft-partnership-agreement`,
  `/guides/cost-of-aircraft-co-ownership`, `/tools/cost-calculator`, `/guides` hub.
- In: reciprocal `<Link>` to guide 5 from guide 1 and guide 3.

## Acceptance criteria (QA grades against these)
1. `/guides/how-to-find-aircraft-partners` resolves 200 with unique H1, `<title>`, meta
   description, canonical, OG article — all distinct from guides 1-4.
2. Genuinely distinct sourcing content (where to look, vetting, red flags, partner count,
   path to agreement) — no thin/duplicate content.
3. JSON-LD: FAQPage (5 questions rendered verbatim) + BreadcrumbList both `JSON.parse` OK;
   NO aggregateRating/Review.
4. All internal links resolve 200; reciprocal `<Link>` to guide 5 present on guide 1 & 3.
5. `/guides` hub lists it (ItemList count = 5, card grid shows 5); `/sitemap.xml` lists it;
   Footer Guides group includes it.
6. Mobile-first: zero horizontal overflow at 375px; no console/hydration errors desktop+mobile.

## Honesty rules
No fabricated statistics, no fake precision, no specific legal/tax advice, standard
"general info, not advice" disclaimer. Sky-blue accent only.

## Out of scope
No schema/DB change. No nav change. No new components. No changes to guides 2 or 4 content
beyond what already links to this guide path (guide 4 already lists guide 3; no edit needed).
