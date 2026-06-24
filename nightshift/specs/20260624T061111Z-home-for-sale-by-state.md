# Spec — Homepage "Browse aircraft for sale by state" internal-link block

**Slug:** `home-for-sale-by-state`
**Lane:** `[goal]` (last non-bug cycle `seeking-profile-right-rail` pulled `[want]`; last cycle PASS → no blocker → `[goal]` owed per the 1:1). STAGE=INDEXING.

## Goal
Add a "Browse aircraft for sale by state" SEO section to the homepage (the highest-authority page) that links directly to the `/aircraft/for-sale/[state]` family — the #1 search-demand pattern ("aircraft for sale california") — gated to states with real live inventory, mirroring the existing "Browse aircraft for sale by make" and "Find aircraft partnerships by state" blocks.

## Why this grows pageviews (INDEXING lever)
GOAL.md STAGE=INDEXING prioritizes internal linking from authority pages. Today the for-sale-by-state family is only reachable from the homepage at one extra hop (home → `/aircraft/browse` → state). The partnerships-by-state family already gets a direct homepage block; the symmetric for-sale-by-state block is the obvious missing parallel. A direct homepage link concentrates crawl budget + link equity on the highest-demand keyword family.

## Scope (small)
- `src/app/page.tsx` only.
  - Make `HomePage` an `async` server component.
  - Fetch inventory-backed states via `countForSaleState` (the SAME single-source-of-truth helper the sitemap + `/aircraft/browse` already use), reusing the exact `Promise.all(STATE_CODES.map(countForSaleState))` pattern.
  - Render a new `<section>` "Browse aircraft for sale by state" with one link per inventory-backed state → `/aircraft/for-sale/${stateSlug(STATE_NAMES[code])}`, placed adjacent to the existing "Browse aircraft for sale by make" / "Find aircraft partnerships by state" sections.
  - Section self-hides if zero states have inventory (Supabase unavailable at build) — no empty block.

## Acceptance criteria
- [ ] Homepage renders a "Browse aircraft for sale by state" section linking to `/aircraft/for-sale/[state]` pages.
- [ ] Only states with live inventory (`countForSaleState(code) > 0`) are linked — no links to 404/noindex states (honesty / no thin-page links).
- [ ] State link hrefs exactly match the existing route slug form used by `/aircraft/browse` (`/aircraft/for-sale/${stateSlug(STATE_NAMES[code])}`).
- [ ] `npx next build` + typecheck pass; `/` returns HTTP 200 with no app-origin console errors and no horizontal overflow at 1280 + 375.
- [ ] No change to existing homepage sections (hero, rails, by-make, partnerships-by-state, FAQ, CTA).

## Out of scope
- New routes/pages (the for-sale-by-state family already exists).
- Changing the partnerships-by-state block or any other family.
- Per-state listing counts in the link label (keep it clean; browse already shows counts) — optional, decide during impl for visual parity.
- Sitemap changes (family already sitemapped).
