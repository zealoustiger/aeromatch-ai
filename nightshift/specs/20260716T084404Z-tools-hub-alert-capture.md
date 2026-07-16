# tools-hub-alert-capture

## Goal
Add email-alert capture to the two remaining `/tools` pages that have none — the
`/tools/earnings-calculator` page and the `/tools` hub index — closing the last
tools-surface gap in alert entry-point coverage (BACKLOG.md 🔔 goal queue,
Plan-pass batch #2, item 3).

## Scope
- `src/app/tools/earnings-calculator/page.tsx` — add an `<AlertSignup>` box
  below the "How the offset works" copy, framed for an owner considering
  offering shares: alert them when a new pilot starts seeking a partnership
  (`noun="seeker"`, `sourcePath="/partnerships/seeking"`, a real,
  `parseSourcePath`-matchable route already wired for the seeker alert
  pipeline — see `seeker-alert-support`/`seeker-alert-make-filter` cycles).
  `source="earnings_calculator"` for per-placement conversion attribution.
- `src/app/tools/page.tsx` (the `/tools` hub) — add a generic `<AlertSignup>`
  at the bottom (`noun="partnership"`, `sourcePath="/partnerships"`, mirrors
  `/tools/cost-calculator`'s existing box), `source="tools_hub"`.
- No component changes to `AlertSignup` itself — reuse as-is.
- No schema change.

## Acceptance criteria
- `/tools/earnings-calculator` renders a working email-alert signup box that
  submits successfully and stores a real `alerts` row with
  `source_path="/partnerships/seeking"`.
- `/tools` (hub) renders a working email-alert signup box wired to
  `sourcePath="/partnerships"`.
- Both boxes fire `alert_subscribed` with the correct, distinct `source` tag
  (`earnings_calculator` / `tools_hub`) on submit.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- No regression on `/tools/cost-calculator` (untouched, still has its own box).
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow)
  at desktop 1280 + mobile 375 on all three `/tools*` pages.

## Out of scope
- Model-aware capture on `/tools/cost-calculator` (a separate, sibling
  plan-pass item — not touched this cycle).
- Any change to the alert-digest cron / `parseSourcePath` (both target paths
  are already supported).
