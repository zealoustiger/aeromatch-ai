# partnership-digest-market-pulse

## Goal
Add an honest make-level "N {Make} partnerships listed right now, median buy-in $X"
market-context line to partnership alert digest emails, the partnership counterpart of
the aircraft-only `getMarketPulseLine` shipped in `alert-digest-market-pulse`.

## Scope
- `src/lib/alertMatchCounts.ts` — new `getPartnershipMarketPulseLine(supabase, make)`,
  reusing `priceStats`/`MIN_SNAPSHOT_LISTINGS` against `partnerships.buy_in_price`
  (`status='active'`, `ilike make`, `buy_in_price > 0`), same honesty-floor shape as
  `getMarketPulseLine`.
- `src/app/api/cron/alert-digest/route.ts` — extend the existing `marketPulse` computation
  (currently aircraft-only) to also call the new function for `target.type === 'partnership'`
  alerts that have a `make` set. No change to `AlertTarget`, matching logic, or the shared
  `buildAlertDigestEmail`/`buildCombinedAlertDigestEmail` (both already accept a generic
  `marketPulse` string, wired in the `alert-digest-market-pulse` cycle).

## Scoped down (and why)
Partnership alert targets carry only `make` for matching today (no `model` — confirmed by
direct read of `resolveTarget`/`countNewPartnerships`; a `/partnerships?make=&model=` source
path's `model` param is parsed off the URL by callers but never read into `AlertTarget` or
used in any partnership match query). So this line is make-level ("6 Cessna partnerships"),
not make+model like the aircraft line — matching the actual granularity partnership alerts
match against. Adding model-level partnership matching is a separate, larger change (touches
live matching logic for every partnership alert) and is out of scope this cycle.

## Acceptance criteria
- `getPartnershipMarketPulseLine` returns `null` when fewer than `MIN_SNAPSHOT_LISTINGS` (8)
  active partnerships exist for the make — never a guessed median.
- A partnership alert with `target.make` set and enough live listings gets a `marketPulse`
  line in both the single-alert and combined-digest sends; alerts with no `make` (bare
  `/partnerships`, state-only, icao-only) get none, same as before.
- No change to aircraft or seeker digest behavior.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke passes on at least one page that renders `AlertSignup`/digest-adjacent UI
  (no user-facing page changes this cycle — email-only — so the smoke gate is the
  non-visual bar, no screenshots needed).

## Out of scope
- Model-level partnership matching/market-pulse.
- Make-only pulse for AIRCRAFT alerts (separate backlog item).
- Price-drop-email market pulse (separate backlog item).
- Digest feedback thumbs / `/admin/alerts` scoreboard (separate backlog items).
