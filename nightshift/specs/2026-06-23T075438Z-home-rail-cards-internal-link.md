# Wire homepage curated-rail cards to internal listing detail pages

## Goal
Make the homepage "Browse curated collections" rail cards link to each plane's
internal `/aircraft/listing/[id]` detail page (instead of bouncing visitors and
crawlers straight out to the external `source_url`) — the final internal-linking
half of slice 4 of the [P1][want] "Internal listing detail pages" item.

## Lane
[goal] — internal linking / indexability. Last non-bug cycle (`similar-aircraft-listings`)
pulled [want]; no blocker; so [goal] is owed per the 1:1. STAGE=INDEXING, and the
homepage is priority seed page #1: pointing its highest-traffic links *into* the
freshly-sitemapped detail family spreads crawl reachability to those new pages.

## Scope (small)
- `src/components/AircraftRailCard.tsx` — swap the external `<a href={source_url} target=_blank>`
  for a Next `<Link href={`/aircraft/listing/${p.id}`}>`, exactly mirroring how
  `AircraftSaleCard` already links its photo/title internally. Presentation unchanged.

## Acceptance criteria
- Each homepage rail card links to `/aircraft/listing/<id>` (same-tab, internal), not
  to an external source URL.
- The card renders identically (photo, price, label, location, hover-lift) — purely a
  link-target change, no visual regression at 1280 + 375.
- Clicking a rail card lands on that plane's internal detail page (HTTP 200).
- `next build` + typecheck pass; QA smoke (homepage) is clean — HTTP 200, no app-origin
  console errors, no horizontal overflow at desktop 1280 + mobile 375.

## Out of scope
- Changing rail definitions, queries, ordering, or the `/aircraft` card.
- Any change to the detail page itself or to `source_url` handling elsewhere.
- Sitemap (already done in a prior slice).
