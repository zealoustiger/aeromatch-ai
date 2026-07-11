# cost-calculator-alert-cta

## Goal
Add an alert-capture entry point to `/tools/cost-calculator` — today the page has no
`AlertSignup` at all, so a visitor actively evaluating a partnership share has to leave
without any way to ask us to notify them about new listings.

## Scope
- `src/app/tools/cost-calculator/page.tsx` — embed `AlertSignup` below the existing
  "How to read these numbers" prose, `noun="partnership"`, `sourcePath="/partnerships"`.
  **`sourcePath` must be `/partnerships`, not the tool's own URL** — verified by reading
  `alert-digest/route.ts`'s `parseSourcePath`: it only recognizes a fixed set of real
  site routes (`/aircraft/...`, `/partnerships/...`), and returns `null` for anything else,
  which the cron then counts as `unparseable` and permanently skips — i.e. a `sourcePath`
  of `/tools/cost-calculator` would create an alert that promises "we'll email you" and can
  *never* fire. `/partnerships` (bare, all-partnerships) is a real, already-supported target
  so the promise is genuinely kept.

**Deviation from the BACKLOG.md item as written (verified by code read):** the backlog
item ("Contextual alert CTA on `/tools/cost-calculator`") assumes the calculator collects
make/model so the CTA can read "Get alerts when a {make} {model} is listed." That's not
true of this tool — `CostCalculator.tsx` collects buy-in / monthly fixed / wet rate / hours
/ rental rate only, no aircraft make or model field (confirmed by reading the component;
no `make`/`model` prop or state anywhere in it). Inventing a make/model context would mean
fabricating copy the page has no basis for, which the GOAL.md honesty guardrail forbids.
Scoping down to a general "Get new partnership listing alerts" CTA (same pattern as the
homepage / `/partnerships` general signups, `noun="partnership"`, no `context`) — still a
genuinely new capture point on a page that had zero alert surface, still emits
`alert_subscribed` with `source_path: '/tools/cost-calculator'` so we can see whether this
placement converts.

## Acceptance criteria
- `/tools/cost-calculator` renders an `AlertSignup` section after the explanatory copy,
  before the closing page wrapper.
- Submitting a real email calls the existing `subscribeToAlerts` action unchanged (no new
  server code) and fires `alert_subscribed` with `source_path: '/partnerships'`.
- No other page's alert copy/behavior changes.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke (`qa-smoke.mjs`) passes at desktop 1280 + mobile 375 on `/tools/cost-calculator`
  (and `/tools/earnings-calculator` as a control — unchanged) with zero app-origin console
  errors and zero horizontal overflow.
- Visual cycle — screenshots reviewed to confirm the new section looks on-brand and doesn't
  crowd the existing layout.

## Out of scope
- No changes to `/tools/earnings-calculator` (seller-side tool — "alert me about new
  partnership listings" isn't the right CTA for someone offering a share, not buying one).
- No new DB columns, no schema change, no new component — reuses `AlertSignup` as-is.
- No make/model-specific alert copy (see deviation note above).
