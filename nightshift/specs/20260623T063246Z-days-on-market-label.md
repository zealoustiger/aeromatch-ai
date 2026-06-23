# Days-on-market "Listed X ago" label on for-sale cards

**Lane:** [want] (last non-bug cycle `partnership-state-content-ny-il-ga-nc` pulled
[goal]; the `fix-source-noimage-photos` [bug] blocker did not consume the alternation,
so [want] is owed). Deferred pick explicitly queued in the prior cycle's Next line.

Backlog: `[P2][want] Price history + "Price cut ↓$X" + days-on-market + "New" pills
(Redfin)` — slice (3): days-on-market label. Uses existing `first_seen_at`; no schema.

## Goal
Show a Redfin-style "Listed X ago" days-on-market label on each planes-for-sale card,
so buyers can see listing freshness/staleness at a glance.

## Scope
- `src/components/AircraftSaleCard.tsx` only — add a small `listedAgo(firstSeenAt)`
  helper and render the label in the card footer metadata row (alongside
  location / TTAF / SMOH).

## Acceptance criteria
- Cards with a `first_seen_at` show a "Listed today" / "Listed N days ago" /
  "Listed N weeks ago" / "Listed N months ago" / "Listed N years ago" label in the
  footer, with a clock icon, matching the existing footer chip style.
- Cards with no `first_seen_at` render no label (no "Listed null ago", no empty chip).
- Label is purely presentational — no new data fetch, no ranking effect, real data only.
- `/aircraft` (and any surface using the card) renders correctly at desktop 1280 +
  mobile 375 with zero app-origin console errors and zero horizontal overflow.
- `next build` + typecheck stay green.

## Out of scope
- Price-history mini-chart on the detail page (a later slice of the same item).
- Any change to partnership cards, sorting, or the data model.
- Backfilling/normalizing `first_seen_at` values.
