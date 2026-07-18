# alert-digest-price-context

## Goal
Add an honest, comp-derived market-context line ("~12% below avg · $52k median · 8 comps")
to new-listing aircraft sample cards in alert digest emails, reusing the same honesty-gated
comp math that already powers the on-site "vs market" pill.

## Scope
- `src/lib/aircraftComps.ts` — add a small pure `compLabel(comp: CompResult): string`
  helper (formats the same "below/above/near avg · median · N comps" copy the on-site
  `CompPill` already uses, as plain text for email).
- `src/lib/email.ts` — add optional `compLabel?: string | null` to `AlertDigestSample`;
  render it in `sampleCardHtml` (shared by all 3 digest builders) and in the two plain-text
  `sampleLines` builders (`buildAlertDigestEmail`, `buildCombinedAlertDigestEmail`).
- `src/app/api/cron/alert-digest/route.ts` — compute a family price map (make/model/
  asking_price across all active priced listings, paginated, same pattern as
  `AircraftSaleList.tsx`'s `fetchFamilyPriceMap`) once per cron run, memoized/lazy so a run
  with no aircraft new-listing samples never fetches it. Wire it into `toDigestSample`
  (new-listing samples only) via `compVsMarket` from `aircraftComps.ts`.
- New unit test `src/lib/aircraftComps.test.ts` covering `compLabel` for below/above/near.

## Out of scope
- Price-drop samples (`fetchAircraftPriceDropSamples`) — those already show a before/after
  price; adding a market-comp on top is deferred to keep this cycle's diff small.
- Partnership/seeker samples — `compVsMarket`/family maps are aircraft-only today.
- Any change to the on-site `CompPill`/`AircraftSaleList` comp math itself — reused as-is.

## Acceptance criteria
- `compLabel` renders nothing (sample card shows no market-context line) when the family
  has fewer than `MIN_OTHER_COMPS` other priced listings — never a fabricated/noisy claim.
- A genuine below-median new-listing sample shows "~N% below avg · $Xk median · N comps";
  above/near render the honest equivalent copy.
- No change to sample cards that already render today when `compVsMarket` returns null
  (unresolvable family, no price, etc.) — output is byte-identical minus the new line.
- Unit tests pass for `compLabel`'s 3 branches + a null/omitted case.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `/api/dev/email-preview/alert-digest` still renders correctly (dev-only preview route,
  used for visual QA of the HTML template).
