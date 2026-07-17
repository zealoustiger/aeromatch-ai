# Spec: make bare-`/` alerts actually match and fire

**Slug:** `alert-any-listing-target`
**Tier:** 3 — `[P1][goal]` (Plan-pass batch #4, GOAL.md alert-experience lane)

## Goal
Every alert captured with `sourcePath="/"` (site-wide footer, homepage band,
`/about`, `/saved` fallback, `not-found.tsx`) is stored and confirmed but never
matched, counted, or emailed, because both source-path parsers (`alert-digest`
cron's `parseSourcePath` and `alertMatchCounts.ts`'s `parseSourcePath`) fall
through to `return null` for a bare `/`. Teach both to treat `/` as an honest
"any new listing" target (aircraft ∪ partnerships, no seekers — matches the
buyer-facing framing of every one of those capture points) so these alerts
match, show an honest count, and actually get emailed.

## Scope
- `src/app/api/cron/alert-digest/route.ts`: add an `{ type: 'all' }` branch to
  the `AlertTarget` union, `resolveTarget`, `countNew`, the `dropCount`
  computation, and the samples computation (merge aircraft + partnership,
  capped at `MAX_DIGEST_SAMPLES`). Leave `marketPulse`, `bestDrop`'s
  aircraft/partnership-only gate, and `dropNoun`'s partnership-only label
  untouched — `'all'` falls through to their existing sane defaults (no
  market-pulse line, aggregate digest template not the rich single-drop
  template, generic "price drop" label).
- `src/lib/alertMatchCounts.ts`: same `AlertTarget`/`parseSourcePath` addition;
  `getAlertMatchCount` gets an `'all'` branch summing active aircraft +
  partnership counts (`noun: 'listing'`); `getAlertDigestPreview` gets a merged
  preview (count + samples) reusing `previewAircraft`/`previewPartnerships`.
- No DB schema change. No new capture point, no new PostHog event (the 7
  existing `sourcePath="/"` surfaces already emit `alert_subscribed`).

## Acceptance criteria
- `getAlertMatchCount('/')` returns a real, non-null count (active aircraft +
  active partnerships), not `null`.
- The digest cron's `resolveTarget('/', undefined)` returns `{ type: 'all' }`,
  not `null` — `parseSourcePath('/')` no longer falls into the `unparseable`
  bucket.
- A due `'all'` alert with new matches sends a real digest email (merged
  aircraft+partnership samples, honest combined `newCount`), not silently
  skipped.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on the pages whose alert box now resolves to a real count:
  `/`, `/about`, `/saved`, a 404 page.
- No change to any OTHER existing target type's behavior (aircraft/
  partnership/seeker paths untouched, byte-for-byte).

## Out of scope
- Seekers are excluded from the `'all'` union (matches the buyer-facing
  framing of the affected capture points; a seeker match under a generic
  "new listing" alert would be a category mismatch).
- No frequency/volume dampener for `'all'` alerts — `weekly` is already the
  fixed default cadence for every alert type (`alertFrequency.ts`), so this
  doesn't introduce a new spam vector; already-broad bare `/aircraft` and
  `/partnerships` alerts fire at the same cadence today.
- `alertEditCriteria.ts` (the `/alerts/manage` "edit criteria" + widen-suggestion
  parser) is intentionally left untouched — a bare-`/` alert simply gets no
  Edit/widen affordance, same as any other unparseable-for-edit shape today.
- `alertCrossSell.ts` untouched — already returns no suggestion for `/`.
