# Spec — Flying Club vs. Aircraft Co-Ownership guide

**Slug:** `guide-flying-club-vs-co-ownership`
**Lane:** `[goal]` (last non-bug cycle `saved-search-inline-rename` pulled `[want]`; last cycle PASS, no blocker → alternate to `[goal]`). STAGE=INDEXING; on-site pageviews 325/7d at orient (PostHog secondary; GSC not configured).

## Goal
Ship one new genuinely-useful, indexable editorial guide at `/guides/flying-club-vs-co-ownership` that answers the real, high-intent buyer query "flying club vs co-ownership / partnership" — a decision GA pilots actually weigh, not yet covered by the 7 existing guides — and wire it into the guides hub + sitemap with full structured data and internal links.

## Why this grows pageviews
"Flying club vs co-ownership/partnership" is a common, distinct, high-intent informational query for the exact GA-piston audience ClubHanger serves. It extends the proven "X vs co-ownership" decision-guide pattern (leaseback-vs) into a second axis (membership/access vs ownership stake), carries real unique value, and spreads crawl equity by interlinking the existing guide/tool/partnership hubs (INDEXING stage). Diversifies off the heavily-worked aircraft-compare family per its own "DIVERSIFY next" note.

## Scope (small)
- New: `src/app/guides/flying-club-vs-co-ownership/page.tsx` (matches the `leaseback-vs-co-ownership` guide structure: metadata + canonical/OG/Twitter, Breadcrumbs, intro + disclaimer, TOC, prose sections, side-by-side table, who-each-is-for, how-to-decide, FAQ, related guides, CTA, Article + FAQPage JSON-LD).
- Edit: `src/app/guides/page.tsx` — add the new guide to the `GUIDES` array (visible card + CollectionPage/ItemList JSON-LD stay in sync).
- Edit: `src/app/sitemap.ts` — add the new URL to the static guides block.

## Acceptance criteria
- [ ] `/guides/flying-club-vs-co-ownership` returns HTTP 200 and renders a complete, unique editorial guide (no thin/duplicate content; wording distinct from leaseback-vs and how-to-find-partners).
- [ ] Unique `<title>`, meta description, canonical, OG/Twitter; valid Article + FAQPage JSON-LD whose marked-up Q&As match the visible FAQ 1:1 (no fabricated stats, no advice claims — carries the educational/not-advice disclaimer like sibling guides).
- [ ] Appears as a card on `/guides` and is included in that page's ItemList JSON-LD; present in `sitemap.ts`.
- [ ] Internal links out to existing hubs (co-ownership guide, how-to-find-partners, cost guide, cost calculator, /partnerships) so it is not a dead-end.
- [ ] `npx next build` + typecheck pass; QA smoke (1280 + 375) is HTTP 200, zero app-origin console errors, zero horizontal overflow on `/guides` and the new page; screenshots look right.

## Out of scope
- No new data, schema, or DB changes. No changes to other guides' content. No new programmatic family. No compare-family work.
