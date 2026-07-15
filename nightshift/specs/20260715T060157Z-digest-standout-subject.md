# digest-standout-subject

## Goal
When a weekly alert digest has exactly one genuine new match (no price drops, no sample/first-send framing) and a usable sample (title + price), name that listing in the subject line instead of the generic count-only form.

## Scope
- `src/lib/email.ts` — `buildAlertDigestEmail`'s subject computation only. No other builder (`buildCombinedAlertDigestEmail`, `buildPriceDropEmail`, etc.) is in scope.
- `src/lib/email.test.ts` — new unit tests covering the standout case and every fallback.

## Acceptance criteria
- When `newCount === 1 && dropCount === 0`, not a sample (`sampleNote` unset) and not a `firstSend`, and exactly one sample is present with a non-empty `title` and non-null `price`, the subject becomes `New: <title> at <formatted price> — your <context> alert` (or `New: <title> at <price> — new match on ClubHanger` when `context` is null/empty).
- Falls back to the existing generic subject (`<countLabel> — <thing> on ClubHanger`) whenever: `newCount !== 1`, `dropCount !== 0`, zero or 2+ samples, the one sample's `title` is empty, or its `price` is `null` — never fabricates a name/price that isn't in the data.
- `sampleNote` (sample-preview sends) and `firstSend` continue to use their existing subject framing unchanged — standout naming does not apply to those paths.
- Existing digest subject tests (multi-match counts, drop counts, combined digest) are unaffected.
- `npx tsc --noEmit` and `npx next build` both pass.
- Full `src/lib/email.test.ts` suite green, plus new tests for: standout fires (happy path), falls back on 2 matches, falls back on a price drop present, falls back on missing price, falls back on 0 samples, sampleNote/firstSend unaffected when newCount===1.

## Out of scope
- `buildCombinedAlertDigestEmail`'s subject (multi-alert digest — a different, already-honest "total across N alerts" framing).
- The cron route's sample-fetching logic (`fetchNewAircraftSamples` etc.) — already fetches real samples; no changes needed there.
- Any DB/schema change.
