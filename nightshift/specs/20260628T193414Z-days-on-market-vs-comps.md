# Days-on-market vs. comparable active listings (Pillar 3 — buyer analysis)

## Goal
Make the listing detail page's days-on-market signal **relative and proprietary**: tell
the buyer how long this listing has been for sale *compared to comparable {make} {model}
listings still on the market* — a real, honesty-gated seller-flexibility signal no other
listing site surfaces — instead of only the absolute "Listed N months ago" line.

## Why this slice (rotation + gap)
- Pillar rotation: last 3 cycles were P1 (post-photos-survive-auth), P2 (soft-save), P3
  (estimate-price-bar). Pillar 2's headline items are human-blocked behind the frozen
  `/auth`; Pillar 3 is the most-overdue unblocked pillar.
- Genuine gap: days-on-market is currently shown only **absolutely** (a header badge and a
  generic deal signal "Long listing cycle — seller may have flexibility"). The BACKLOG
  `[P2][goal] Market position + days-on-market` item's days-on-market half is not yet
  data-grounded. This adds the **relative** read — proprietary (fuses our own `first_seen_at`
  across the active family) and distinct from the family-price ClubHanger Estimate.

## Scope (small)
- `src/lib/daysOnMarket.ts` — NEW pure helper `computeDaysOnMarketContext(subjectFirstSeen,
  compFirstSeen[], now)` → `{subjectDays, compCount, percentileLongerThan, relative}` or
  `null`. Honesty floor `MIN_DOM_COMPS = 5`; a ±40–60% dead band → "typical". `now` is a
  param (no `Date.now()` inside) so it's deterministically testable.
- `src/lib/daysOnMarket.test.ts` — NEW worked-example tests (node --test), matching the
  `aircraftEstimate.test.ts` style.
- `src/lib/aircraftForSale.ts` — extend `getFamilyComps` to also `select` and return
  `first_seen_at` (the deal-verdict helper ignores the extra field, so no behavior change;
  reuses the exact same comp set — no extra DB read).
- `src/app/aircraft/listing/[id]/page.tsx` — compute the context from `familyComps`, pass it
  into `computeDealSignals`, and enrich the existing "Days on market" signal's detail line
  with the relative phrasing when the context is available; fall back to the current generic
  copy when it isn't.

## Acceptance criteria
- [ ] When ≥5 comparable active listings have a known `first_seen_at`, the "How this stacks
      up" panel's days-on-market row reads with a data-grounded comparison, e.g. "Listed
      longer than ~80% of comparable Cessna 172 listings still for sale — a seller-flexibility
      signal."
- [ ] When fewer than 5 comparable listings exist (honesty floor), the row falls back to the
      existing generic copy — never a fabricated/percentage claim.
- [ ] The phrasing is honest about survivorship: it compares against listings **still for
      sale**, never "how fast they sell."
- [ ] `clubHangerDealVerdict` output is unchanged (extra `first_seen_at` field ignored); the
      ClubHanger Estimate, Deal Check, Engine Life, Cost-to-own panels are untouched.
- [ ] `npx next build` + typecheck pass; new lib tests pass (`node --experimental-strip-types
      --test src/lib/daysOnMarket.test.ts`).
- [ ] QA smoke (HTTP 200 / no app console errors / no horizontal overflow at 1280 + 375) on a
      real `/aircraft/listing/[id]` passes; screenshot shows the enriched signal renders.

## Out of scope
- No new standalone "Market position" card (would duplicate the Estimate panel).
- No schema change; no change to upload/data model/auth.
- No change to the absolute header "Listed N ago" badge or the price-history block.
- No change to the family-price Estimate / Deal Check math or honesty floors.
