# Cross-sell slice 3 — real sample listings on the marketplace cross-sell card

## Goal
Make the marketplace cross-sell card show 2–3 **real, make-aware sample listings**
from the *other* marketplace (a mini rail), so a visitor sees actual planes /
partnerships to tap into — not just a count.

## Lane
`[want]` — slice 3 of `[P2][want] Blend result types + cross-sell` (Search results UX,
BACKLOG), the follow-on the last two cross-sell cycles explicitly queued. Last non-bug
cycle (footer-browse-hubs) was `[goal]`, so `[want]` is owed per the 1:1.

## Scope (small, additive)
- New `src/components/PartnershipRailCard.tsx` — compact partnership rail card mirroring
  the existing `AircraftRailCard` (photo-forward, links to `/partnerships/[id]`).
- `src/components/MarketplaceCrossSell.tsx` — add an optional `samples` prop; render a
  horizontal mini-rail of compact cards (aircraft when `from='partnerships'`, partnerships
  when `from='aircraft'`) below the existing heading/CTA. Restructure the single outer
  `<Link>` into a container so sample cards are their own links (no nested anchors).
- `src/app/partnerships/page.tsx` — fetch sample aircraft via `fetchAircraftPage({make})`,
  pass as `samples`.
- `src/app/aircraft/page.tsx` — fetch sample partnerships via `getPartnershipListings({make})`,
  pass as `samples`.

## Acceptance criteria
- `/partnerships` cross-sell shows up to ~4 real aircraft-for-sale cards; make-aware
  (filtered to Cirrus → Cirrus samples) and links carry the make through.
- `/aircraft` cross-sell shows up to ~4 real partnership cards, make-aware, linking to
  `/partnerships/[id]`.
- When the other marketplace has **zero** matching listings, the rail is omitted entirely
  (card falls back to today's heading + CTA, no empty rail, no fabricated cards).
- No nested anchors; the heading/CTA link and each sample card are independent links.
- `next build` + typecheck green; QA smoke exit 0 (HTTP 200, zero app-origin console
  errors, **zero horizontal overflow** at desktop 1280 + mobile 375) on /partnerships,
  /partnerships?make=Cirrus, /aircraft, /aircraft?make=Cessna.

## Out of scope
- No sticky side-panel positioning (slice 3's "sticky" framing) — a contained mini-rail
  in the existing card is the smaller valuable slice. No third "pilots" type. No DB/schema
  change. No change to the count copy logic. No restyle of the surrounding pages.
