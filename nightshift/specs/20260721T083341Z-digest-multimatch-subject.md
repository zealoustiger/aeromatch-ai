# digest-multimatch-subject

## Goal
Extend the alert-digest email's "standout" hero subject line (currently only fires when
exactly one new listing matched) to also name a listing when 2+ new listings matched, so a
"3 new listings" digest reads "New: 1973 Cessna 210 at $189,000 + 2 more — your Cessna 172
alert" instead of the generic "3 new listings — Cessna 172 on ClubHanger".

## Scope
- `src/lib/email.ts` — `buildAlertDigestEmailCore`'s `standout` subject logic (~line 1479-1492).
  Pick the best sample among those already rendered (prefer a `compBelowAvg` deal, else the
  first), and append `+ N more` where N = `opts.newCount - 1` (the real total, not
  `samples.length`, since samples are capped below the true count).
- `src/lib/email.test.ts` — update the existing "falls back... when there is more than one
  match" test to the new expected behavior, add coverage for the `+ N more` count and the
  compBelowAvg-preference tie-break.

## Out of scope
- No change to which samples are fetched/capped (`MAX_DIGEST_SAMPLES`), no schema change, no
  new capture point or analytics event.
- Still guarded to `dropCount === 0` (a mixed new+drop digest keeps the generic subject, same
  as today) and still never fires for `isSample`/`isFirstSend` frames.
- No change to the combined multi-alert digest subject (`buildCombinedAlertDigestEmail`) —
  that's a separate function/subject already handling its own aggregate framing.

## Acceptance criteria
- `newCount === 1` (existing single-match case) renders byte-identical subjects to before —
  no `+ N more` suffix when there's nothing to add.
- `newCount >= 2` with `dropCount === 0` and at least one usable sample (title + price) now
  names the best sample and appends `+ N more`, where N is computed from the real `newCount`.
- When multiple samples are present, a `compBelowAvg` sample is preferred over an earlier
  non-deal sample for the naming; falls back to the first sample when none qualifies.
- Every existing fallback guard still holds byte-for-byte: `dropCount > 0` (mixed or
  price-drop-only), no usable price, zero samples, `sampleNote`, `firstSend`.
- `npx tsc --noEmit` and `npx next build` stay clean; full node test suite passes with the
  updated + new cases.
