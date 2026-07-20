# Spec: demand-vs-supply ("most wanted") block on /admin/alerts

## Goal
Give the admin a "which make/model do subscribers want that we don't have enough of"
readout, so alert data can drive owner-acquisition/outreach targeting.

## Scope
- New pure module `src/lib/alertDemandFamily.ts` — `familyForSourcePath(sourcePath)`
  buckets an alert's `source_path` into a curated `SEO_MAKE_MODELS` family (reuses
  `getMakeModel`/`resolveMakeModelFamily` from `src/lib/seo.ts`), or `null` when the
  alert isn't targeting one specific curated model.
- New unit test `src/lib/alertDemandFamily.test.ts`.
- `src/lib/alertScoreboard.ts`: export the existing `LIVE_STATUSES` set; add
  `getDemandSupplyRollup()` — fetches live (active/confirmed) alerts, buckets by family,
  counts subscribers per family, and calls the existing, already-reused
  `countMakeModel()` (from `src/components/AircraftSaleList.tsx`, same function every
  `/aircraft/[make]/[model]` page and the sitemap already use) to get the live listing
  count per family — guaranteeing the admin number always agrees with the public page.
- `src/app/admin/alerts/page.tsx`: add the rollup to the existing `Promise.all`, render
  one new `<section>` (same card/heading pattern as the other sections) listing families
  sorted by least-supply-first, then most-demand-first, with honest empty state.

## Acceptance criteria
- `/admin/alerts` renders a new "Demand vs. supply" section showing, for each curated
  make/model family with ≥1 live (active/confirmed) subscriber, the family label, the raw
  subscriber count, and the raw live-listing count — sorted ascending by listing count,
  then descending by subscriber count.
- Raw counts are never floored/fabricated — real 0s and 1s render as-is (per GOAL.md's
  honesty rule); a family with 0 live listings and ≥1 subscriber is visually flagged
  (rose text), since that's the actionable "most wanted, least available" signal.
- Alerts that don't resolve to one curated make/model (make-only, state/price-only,
  partnerships, seekers, uncurated model, homepage/browse) are excluded from this list —
  they don't distort the paired subscriber/listing counts.
- When there are zero live alerts resolving to a curated family, the section shows an
  honest "not enough data" message instead of an empty table.
- No new capture point, no schema/DB change, no regression to any existing section on
  `/admin/alerts` or to `/alerts`.
- `npx tsc --noEmit` and `npx next build` both pass; new unit tests pass; full test suite
  has no regressions.

## Out of scope
- Uncurated / dynamically-discovered make+model combos (only the curated
  `SEO_MAKE_MODELS` list is bucketed).
- Partnerships/seeker criteria, state-only or price-only alerts.
- Any outreach/owner-acquisition UI beyond this read-only admin list.
