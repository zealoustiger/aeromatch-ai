# Homepage in-content "Guides & tools" resources section

**Lane:** `[goal]` (SEO / internal linking). STAGE=INDEXING — strengthen in-content
internal links from the highest-authority page to the priority content seed pages.

## Goal
Add a genuinely useful "Free guides & tools" resources section to the homepage body
that links — in-content, not just from the boilerplate footer — to the cost calculator
and co-ownership guide (priority seed pages #11 and #12) plus the rest of the guides/tools
families, so Google crawls and prioritizes the seed set faster.

## Why this grows pageviews
We're in the INDEXING stage. GOAL.md says concentrate internal-linking effort on the 12
priority seed pages. Today the homepage surfaces make hubs and state hubs *in-body*, but the
guides/tools families (incl. seed pages `/tools/cost-calculator` and
`/guides/aircraft-co-ownership`) are only reachable from the sitewide footer — boilerplate
links Google weights far less than in-content links from the top-authority page. An in-content
resources rail raises their crawl priority and is genuinely useful to a visitor planning a
partnership.

## Scope (small)
- `src/app/page.tsx` only — add one new `<section>` (a card grid) + a small `resources`
  const + a few lucide icon imports. No new components, no data fetching, no backend.

## Acceptance criteria
- A new homepage section links in-content to at least: `/tools/cost-calculator`,
  `/guides/aircraft-co-ownership`, `/guides/cost-of-aircraft-co-ownership`,
  `/guides/how-to-find-aircraft-partners`, plus "All guides" (`/guides`) and "All tools" (`/tools`).
- Copy is accurate to each page (no fabricated claims); section reads as a real resources hub,
  not keyword stuffing.
- Renders correctly at desktop 1280 and mobile 375 with no horizontal overflow.
- `npx next build` + typecheck pass; QA smoke exits 0 with zero app-origin console errors.
- Existing homepage sections (hero, featured, rails, explore, benefits, make/state SEO, FAQ, CTA)
  are unchanged.

## Out of scope
- New page families / routes. Changing the footer. Restyling existing sections.
- Any data fetching or schema changes.
