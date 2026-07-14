# price-drop-market-pulse

## Goal
Show the same honest market-pulse sentence ("14 Cessna 172s listed right now, median
asking $89k") in the single-listing price-drop alert email that already renders it in
the aggregate digest email — market context is most persuasive exactly when a price
drops (GOAL.md, Plan-pass batch item (b)).

## Scope
- `src/lib/email.ts`: add an optional `marketPulse?: string` param to
  `buildPriceDropEmail`, rendered with the same style/placement convention
  `buildAlertDigestEmail` already uses (a light blue info line), in both the HTML and
  plain-text bodies. Omitted entirely when not provided (honesty gate — never invent one).
- `src/app/api/cron/alert-digest/route.ts`: the single-alert send path already computes
  `marketPulse` for both aircraft (curated make+model) and partnership (make) alerts at
  line ~1327, but silently drops it when the send resolves to the rich single-listing
  `buildPriceDropEmail` template (the `bestDrop` branch) instead of the aggregate digest
  template — only the aggregate branch receives it today. Pass `marketPulse: marketPulse
  ?? undefined` into the `buildPriceDropEmail(...)` call so the value already computed
  isn't wasted.
- `src/app/api/dev/email-preview/price-drop/route.ts`: add a fixture `marketPulse` string
  to the aircraft preview variant so the rendering can be eyeballed via the dev-only
  preview route.
- `src/lib/email.test.ts`: add unit coverage mirroring the existing digest
  marketPulse tests — renders when present (HTML + text), omitted when absent.

## Out of scope
- Computing a NEW market-pulse variant (e.g. make-only pulse for un-curated aircraft
  alerts) — that's part (a) of the same plan-pass item, a separate slice.
- Any schema change — `marketPulse` is a plain string already computed by existing code,
  no new query added.
- The combined multi-alert email (`buildCombinedAlertDigestEmail`) — it never routes
  through `buildPriceDropEmail`, only the single-alert `group.length === 1` path does.

## Acceptance criteria
- `buildPriceDropEmail({ ...marketPulse: 'X' })` renders `X` in both the HTML and text
  output; omitting `marketPulse` renders neither an empty line nor a fabricated one.
- The alert-digest cron's single-alert bestDrop send path now passes its already-computed
  `marketPulse` through to `buildPriceDropEmail`.
- `npx tsc --noEmit` and `npx next build` both pass.
- Full unit suite (`node --experimental-strip-types --test src/lib/*.test.ts`) passes,
  including new coverage for this change.
- QA smoke gate passes on the affected pages; this is a non-visual (email-template /
  backend digest-computation) change — no page markup changes, screenshots not read into
  context per RUNBOOK.
