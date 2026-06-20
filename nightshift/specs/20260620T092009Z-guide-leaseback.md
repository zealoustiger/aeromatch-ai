# Guide 4 — "Leaseback vs. Co-Ownership" (`/guides/leaseback-vs-co-ownership`)

## Goal
Ship a fourth pillar content guide targeting the high-intent search "aircraft
leaseback vs co-ownership / partnership" — the DECISION/COMPARISON angle (which
model is right for you), distinct from the three existing how/cost/agreement
guides — and wire it into the site's internal-link graph, sitemap, /guides hub,
and footer to grow indexable, genuinely-useful pages (GOAL.md lever: SEO breadth
+ internal linking).

## Lane / scoreboard
- Lane: **[goal]** (SEO/content). Prior non-bug cycle (partnership-cost-calc)
  pulled `[want]`, so this correctly pulls `[goal]` per the 1:1 alternation; it
  is also the explicit task scoped, named in the guides-hub cycle's "Next".
- Scoreboard at orient = **60** pageviews/7d.

## Scope (files)
- NEW `src/app/guides/leaseback-vs-co-ownership/page.tsx` — mirrors guide 3's
  structure EXACTLY (Metadata shape `title.absolute`/description/canonical/OG
  article; Breadcrumbs with crawlable `Guides` `<Link href="/guides">`; FAQ array
  as single source of truth feeding visible Q&As + FAQPage JSON-LD; the
  Breadcrumbs component already emits BreadcrumbList JSON-LD).
- EDIT `src/app/guides/page.tsx` — add guide 4 to the `GUIDES` array (auto-grows
  the visible card grid AND the CollectionPage/ItemList JSON-LD).
- EDIT `src/app/sitemap.ts` — add `/guides/leaseback-vs-co-ownership` to the
  Guides static block (priority 0.6).
- EDIT `src/components/Footer.tsx` — add guide 4 to `guideLinks`.
- EDIT `src/app/guides/aircraft-co-ownership/page.tsx` (guide 1) — add a
  reciprocal `<Link>` to guide 4.
- EDIT `src/app/guides/cost-of-aircraft-co-ownership/page.tsx` (guide 2) — add a
  reciprocal `<Link>` to guide 4.

## Content angle (DISTINCT from guides 1/2/3)
Decision/comparison: **leaseback** (renting your plane to a flight school/FBO for
income) vs. **co-ownership/partnership** (sharing ownership + costs with other
pilots). Cover: who each is for, income vs. cost-offset, control & scheduling,
wear/hours, tax/insurance differences at a high level, and how to decide. Use a
clear side-by-side comparison table of the two models + a 5-question FAQ.

## Internal links (both directions)
Outbound from guide 4: `/tools/earnings-calculator` (leaseback),
`/tools/cost-calculator` (co-ownership), `/guides/cost-of-aircraft-co-ownership`,
`/partnerships`, `/guides` hub. Inbound to guide 4: reciprocal `<Link>` from
guide 1 and guide 2.

## Acceptance criteria
1. `/guides/leaseback-vs-co-ownership` resolves 200 with a UNIQUE H1, title,
   meta description, canonical (`SITE_URL + PATH`), and OG article — distinct
   from the other 3 guides. Genuinely distinct (comparison/decision) content, not
   a duplicate.
2. Side-by-side comparison table of leaseback vs co-ownership, wrapped in
   `overflow-x-auto`; 5-question FAQ rendered verbatim.
3. All JSON-LD on the page parses: FAQPage (questions/answers verbatim) +
   BreadcrumbList (Home > Guides > this). NO aggregateRating/Review.
4. Internal links present and resolve 200: earnings-calculator, cost-calculator,
   cost guide, /partnerships, /guides; reciprocal `<Link>` to guide 4 from guide
   1 and guide 2.
5. Listed in `/guides` hub (card + ItemList JSON-LD now 4), `sitemap.xml`, and
   Footer guideLinks.
6. `npx next build` + `npx tsc --noEmit` pass (only the 3 known baseline
   `.test.ts` import-extension errors allowed; none in touched files).
7. QA on PRODUCTION build (`npm run start`) at desktop + 375px: no console/
   hydration errors, zero horizontal overflow at 375px. Sky-blue accent only.

## Honesty
Every figure a clearly-labeled estimate/range; NO fabricated statistics, NO fake
precision, NO specific legal/tax advice. Same "general info, not legal/tax/
financial advice" disclaimer as the other guides. No thin/duplicate content.

## Out of scope
- No schema/DB change. No new components. No nav change. No changes to guide 3
  beyond what already exists. No edits to frozen files.
