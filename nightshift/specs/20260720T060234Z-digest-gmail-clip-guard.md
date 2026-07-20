# Gmail-clipping byte-budget guard on digest HTML

## Goal
Guarantee a digest email's HTML never exceeds Gmail's ~102KB clip point by trimming
sample cards (the honest "See all N matches" CTA already covers whatever's cut) instead
of letting Gmail silently truncate the footer that carries the unsubscribe/manage links.

## Scope
- `src/lib/email.ts`: add a shared byte-budget constant + pure trim-and-rebuild loop
  wrapping `buildAlertDigestEmail` (trims `samples`) and `buildCombinedAlertDigestEmail`
  (trims from whichever section currently has the most samples, spreading the cut fairly
  across sections rather than gutting one). Both keep their exact existing byte-for-byte
  output when under budget — the loop is a no-op unless the budget is actually exceeded.
  Both gain an optional `trimmedSamples?: number` field on their return value (count of
  sample cards removed; omitted/undefined when no trimming fired) so callers can log it.
- `src/app/api/cron/alert-digest/route.ts`: after both `buildAlertDigestEmail(...)` and
  `buildCombinedAlertDigestEmail(...)` calls, `console.warn` when `trimmedSamples` is set
  so the admin can see it in the Vercel cron logs (same `console.warn` convention already
  used elsewhere in this file for other fail-soft conditions).
- `src/lib/email.test.ts`: unit tests — a pure function over a synthetic samples array
  large enough to cross the byte budget, asserting the trimmed output's byte length is
  back under budget, `trimmedSamples` is set/omitted correctly, and a normal-size digest
  (the existing tests' sample counts) is byte-identical to before (no accidental trim).

## Out of scope
- The other open `[P2][goal]` item (re-permission lifecycle line in the admin email) —
  separate backlog item, separate cycle.
- Any change to `sampleCardHtml`/card markup itself — only how many cards get built in.
- Real production trimming can't be observed live tonight (real digests are well under
  the budget today) — verified via unit test + a direct byte-length assertion instead.

## Acceptance criteria
- `buildAlertDigestEmail`/`buildCombinedAlertDigestEmail` never return `html` over the
  byte budget when at least one sample can be removed to get under it.
- A digest that never crosses the budget renders byte-identical HTML/text to before this
  change (verified: existing test suite still passes unmodified).
- Trimming removes from the samples array (not the CTA/count copy) so the count/CTA
  ("See all N matches") stays honest even when cards are cut.
- The cron logs a `console.warn` including an identifying detail (email or alert ids)
  whenever a real send gets trimmed.
- `npx next build` + `tsc --noEmit` stay clean; full `node --test` suite passes.
