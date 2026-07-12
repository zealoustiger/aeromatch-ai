# Spec: "Only good deals" aircraft alert filter — the first smart-alert type

## Goal
Let a visitor subscribing to an aircraft alert opt into "only email me when it's a genuine
good deal" — reusing the existing, honesty-gated `clubHangerDealVerdict` (ClubHanger Deal
Check) instead of firing on every new/dropped listing regardless of price.

## Scope
- `src/lib/aircraftComps.ts` — new exported `filterToGoodDeals()` helper: given candidate
  aircraft rows, batches a family-comp query (same batching precedent as
  `getAircraftCompVerdicts`) and returns only the rows whose `clubHangerDealVerdict` is
  `'good'`. Untyped (`any`) supabase param, same precedent `alert-digest/route.ts` already
  uses for its complex chained builders, so this works with both the admin client (cron) and
  the server client without a generic-type fight.
- `src/components/AlertSignup.tsx` — new "Only email me good deals" checkbox (default
  unchecked), shown alongside the existing price-drop toggle (same `noun === 'aircraft'`
  gate). On submit, when checked, appends `deal=good` to the `sourcePath` sent to
  `subscribeToAlerts`/`subscribeSignedInAlert` (query-string-encoded, no schema change —
  matches how `min_price`/`max_price`/etc. already ride in `source_path`). `alert_subscribed`
  carries `deal_only: true` when checked.
- `src/app/api/cron/alert-digest/route.ts`:
  - `parseSourcePath`'s bare-`/aircraft`+qs branch parses `deal=good` → `dealOnly: true` on
    the aircraft `AlertTarget`.
  - `countNewAircraft` / `countRecentAircraftPriceDrops`: when `target.dealOnly`, fetch the
    full candidate rows (not a head-only count) and narrow through `filterToGoodDeals` before
    counting.
  - `fetchNewAircraftSamples` / `fetchAircraftPriceDropSamples`: when `target.dealOnly`,
    widen the DB-side candidate fetch (no early `.limit(3)`), narrow through
    `filterToGoodDeals`, then slice to `MAX_DIGEST_SAMPLES` — mirrors the existing
    `fetchNewSeekerSamples` fetch-then-JS-filter-then-slice precedent.
- `src/lib/aircraftComps.test.ts` (or inline in an existing comps test file) — a few unit
  cases for `filterToGoodDeals` (good deal kept, fair/high dropped, thin comps dropped).

## Acceptance criteria
- `npx next build` (incl. typecheck) exits 0.
- Unit tests for `filterToGoodDeals` pass: a listing priced well below its narrowed comp
  median is kept; a fair/high/thin-comp listing is dropped (never fabricates a "good" verdict
  when comps are too thin — same honesty floor as the on-page Deal Check).
- `AlertSignup` renders the new checkbox only for `noun === 'aircraft'`, default unchecked;
  checking it and submitting encodes `deal=good` into the alert's `source_path`; the
  `alert_subscribed` event carries `deal_only: true` only when checked.
- Cron-side: a `deal=good` alert's new-listing count/samples and price-drop count/samples are
  narrowed to verdict `'good'` listings only (verified via direct code read + the DB-scoped
  live check below, not a live cron send).
- `qa-smoke.mjs` passes (HTTP 200 / 0 console errors / 0 overflow) on an aircraft page that
  renders `AlertSignup` (e.g. `/aircraft/cessna/172`), desktop 1280 + mobile 375.
- No live cron/Resend send triggered.

## Out of scope
- Adding a "deal-only" toggle to the `/alerts/manage` edit form (existing edit form already
  layers unknown query params through untouched, so a deal-only alert keeps working after an
  unrelated edit — just not toggleable from the manage UI yet). Flagged as a follow-up.
- Deal-only matching for partnerships/seekers (no `clubHangerDealVerdict` equivalent wired to
  alerts for those types yet — aircraft only, per the backlog item).
- Sample-card UI changes beyond narrowing which listings qualify (the existing digest sample
  card template is unchanged).
