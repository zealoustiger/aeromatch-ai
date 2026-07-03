# Partnership browse-card freshness signal ("New" + "Listed N days ago")

## Goal
Give partnership shoppers the same honest freshness / days-on-market read on the
browse card that aircraft-for-sale cards already have, so a buyer can tell a
just-posted share from a stale one at a glance.

## Why (Pillar 3 — proprietary honest buyer analysis)
Days-on-market / freshness is an explicit GOAL.md buyer-analysis signal
("days-on-market + drop trend"). `AircraftSaleCard` shows a "New" badge (< 7 days)
and a Redfin-style "Listed N days ago" footer line, built from `first_seen_at`.
`PartnershipCard` shows neither — a parity gap. Partnership detail already computes
days-on-market from `created_at` (user-posted partnerships have no `first_seen_at`),
so the card should use the same `created_at` field. Honest: `created_at` is always
present, no fabrication, self-suppresses nothing (always renders a real value).

## Scope (small — one component)
- `src/components/PartnershipCard.tsx` only.
- Add local `isNew(createdAt)` + `listedAgo(createdAt)` helpers mirroring
  `AircraftSaleCard.tsx` (same thresholds/wording), keyed off `p.created_at`.
- Render a "New" pill (amber, Sparkles icon) in the badge row when `isNew`.
- Render a "Listed N days ago" item (CalendarDays icon) in the footer.

## Acceptance criteria
- [ ] Partnership cards on `/partnerships` show "Listed …" text derived from `created_at`.
- [ ] Cards created < 7 days ago also show a "New" badge; older cards do not.
- [ ] Wording matches the aircraft card ladder ("Listed today" / "Listed N days ago"
      / "Listed 1 week ago" / "Listed N weeks ago" / "Listed N months ago" / years).
- [ ] `npx next build` + typecheck pass; QA smoke exits 0 at 1280 + 375; no console
      errors; no horizontal overflow.
- [ ] No new required data, no schema change, no query change (uses `created_at`,
      already selected).

## Out of scope
- Aircraft card (already has this).
- Any change to the partnership detail page days-on-market panel.
- Extracting the helpers into a shared util (would touch AircraftSaleCard — keep the
  change to one file, matching the established per-card-local pattern).
- Any price-drop signal (user-posted partnerships have no `previous_price`).
