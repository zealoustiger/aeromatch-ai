# Spec — hub-itemlist-jsonld

## Goal
Add `ItemList` JSON-LD structured data to the two main marketplace hub pages —
`/aircraft` (priority seed page #2) and `/partnerships` (priority seed page #3) —
so search engines understand each hub as a list of real aircraft / co-ownership
offers, matching the structured data their make/model/state sub-family pages
already emit.

## Why (lever)
`[goal]` lane (last non-bug cycle `home-newest-partnerships-rail` pulled `[want]`;
last cycle PASS → no blocker → `[goal]` owed per the 1:1). STAGE=INDEXING. The
two highest-priority hub pages currently emit **no JSON-LD at all**, while every
sub-family page below them (`/aircraft/[make]`, `/aircraft/[make]/[model]`,
`/aircraft/for-sale/[state]`, `/partnerships/make/[make]`, `/partnerships/state/[state]`)
already emits `ItemList`. This closes that gap on the two seed pages the human
most wants indexed. Pure additive structured data — a leading indicator (richer
machine understanding of the hub pages), not a tonight-pageview play.

## Scope (small)
- `src/app/aircraft/page.tsx` — fetch the same default listing set the page shows
  (`fetchAircraftPage(params)`), build `buildAircraftItemListJsonLd`, emit one
  `<script type="application/ld+json">`.
- `src/app/partnerships/page.tsx` — fetch `getPartnershipListings(params)`, build
  `buildPartnershipItemListJsonLd`, emit one `<script type="application/ld+json">`.

Mirrors the established sub-family pattern exactly (see
`src/app/partnerships/make/[make]/page.tsx` lines 61–92, and
`src/app/aircraft/[make]/page.tsx`): the page-level fetch uses the SAME filters
the rendered list uses, so the JSON-LD matches the visible cards 1:1; the helper
returns `null` (renders nothing) when there are no qualifying priced/valid rows.

## Acceptance criteria
- [ ] `/aircraft` served HTML contains a valid `"@type":"ItemList"` JSON-LD block
      with `itemListElement` of the listings shown (no fabricated fields).
- [ ] `/partnerships` served HTML contains a valid `"@type":"ItemList"` JSON-LD block.
- [ ] `npx next build` + `tsc --noEmit` pass (no new errors vs baseline).
- [ ] qa-smoke exit 0 on `/aircraft` + `/partnerships` at desktop 1280 + mobile 375
      (HTTP 200, zero app-origin console errors, zero horizontal overflow).
- [ ] Screenshots: both pages render visually unchanged (JSON-LD is invisible).
- [ ] No visual/layout change; no new dependency; no schema/DB change.

## Out of scope
- No change to the listing cards, filters, layout, or copy.
- No new page family (mission pages etc.) — separate item.
- No `AggregateOffer`/`FAQPage` additions this cycle (ItemList only, to stay scoped).
- No change to the sub-family pages (already covered).
