# aircraft-make-pulse-line

## Goal
Give make-only (uncurated / no clean single model) aircraft alerts the same honest
market-pulse line make+model and partnership alerts already get in digest emails.

## Scope
- `src/lib/alertMatchCounts.ts` — new `getAircraftMakePulseLine(supabase, make)`,
  make-level counterpart to the existing `getMarketPulseLine` (make+model) and
  `getPartnershipMarketPulseLine` (partnership make-level), same
  `priceStats`/`MIN_SNAPSHOT_LISTINGS` honesty floor, same `PARTS_PRICE_FLOOR` filter
  against `aircraft_for_sale.asking_price`.
- `src/app/api/cron/alert-digest/route.ts` — wire it as the fallback in the existing
  `marketPulse` computation: aircraft alerts with a `make` but no `marketPulseModel`
  (e.g. `/aircraft/cessna`, `/aircraft?make=Cessna`) now get a make-level line instead
  of no line at all.

## Acceptance criteria
- New `getAircraftMakePulseLine` returns `null` below the honesty floor (mirrors
  existing floor behavior), never fabricates a count/median.
- Make-only aircraft alert targets (`target.type === 'aircraft' && target.make &&
  !target.marketPulseModel`) now compute a real market-pulse line via the new function.
- Make+model aircraft alerts (`marketPulseModel` set) and partnership alerts are
  unaffected — same code path as before.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- Full unit suite passes with no regressions.
- QA smoke gate passes on affected pages (non-visual cycle — cron/email logic only).

## Out of scope
- Digest feedback thumbs (👍/👎) — separate plan-pass item.
- `/admin/alerts` scoreboard — separate plan-pass item.
- Real "instant" alerts — flagged as needing a re-scoping pass, not buildable this cycle.
