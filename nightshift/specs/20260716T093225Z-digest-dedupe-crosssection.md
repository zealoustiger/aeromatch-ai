# digest-dedupe-crosssection

## Goal
A subscriber with two overlapping confirmed alerts (e.g. "Cessna 182" + "all of TX") who
gets a combined digest email currently sees the same matching listing's photo card
repeated once per section — dedupe so each listing card renders once, attributed to its
first-matching section, with an honest "also matches your X alert" note.

## Scope
- `src/lib/alertDigestDedupe.ts` (new) — pure `dedupeDigestSectionSamples()` helper:
  given the per-section sample lists built for a combined digest, keeps each sample
  (by `url`) only in the first section it appears in, and attaches an `alsoMatchesLabel`
  note to that kept sample naming one other section it also matched.
- `src/lib/alertDigestDedupe.test.ts` (new) — unit tests via
  `node --experimental-strip-types --test`.
- `src/lib/email.ts` — add optional `alsoMatchesLabel?: string` to `AlertDigestSample`;
  render it in `sampleCardHtml` (HTML) and the combined-digest section's plain-text
  sample lines.
- `src/app/api/cron/alert-digest/route.ts` — call `dedupeDigestSectionSamples()` on the
  `sections` array right before it's passed to `buildCombinedAlertDigestEmail` (only the
  2+-alerts-due combined-email branch; the single-alert path is untouched).

## Acceptance criteria
- Two due alerts for the same subscriber that both match the same listing produce a
  combined email where that listing's card renders exactly once (under whichever
  section's alert it first matched, by section order).
- The kept card shows an honest note ("Also matches your {other alert's context} alert")
  when it was deduped from another section; a card with no duplicate elsewhere carries no
  note.
- Each section's own `newCount`/`dropCount` (the truthful per-alert totals) are
  unchanged by dedupe — only the preview sample cards are deduped, never the counts.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `node --experimental-strip-types --test src/lib/alertDigestDedupe.test.ts` passes.
- No behavior change to the single-alert digest path or any other email template.

## Out of scope
- Reworking `newCount`/`dropCount` to be cross-section-deduped (GOAL.md: keep per-alert
  counts truthful, don't sum/dedupe them).
- Deduping across the "listing unavailable" watch-alert emails (always their own
  dedicated send, per existing code comment) or across separate (non-combined) emails.
- The "invite your co-buyer" share action and 8-week admin trend sparklines (separate
  backlog items).
