# Capture-attribution contract test — every `<AlertSignup>` call site must pass `source`

## Goal
Add a `node --test` unit test that fails the build if any `<AlertSignup>` JSX call
site omits the `source` prop, so a future placement can never silently land in the
admin scoreboard's "untagged" bucket and quietly erode the "prove it converts" goal
(every alert surface should emit an attributable `alert_subscribed` event).

## Scope
- New pure function `findAlertSignupUsagesMissingSource(files: {path: string, text:
  string}[]): {path: string, line: number}[]` in a new `src/lib/alertSignupSourceContract.ts`.
  It strips `/* ... */` block comments (so JSDoc mentions of `<AlertSignup>` in prose,
  which exist today in `PartnershipList.tsx`, `SeekerList.tsx`, `AircraftSaleList.tsx`,
  don't false-positive), then scans for `<AlertSignup\b...\/>` tags and flags any whose
  attribute text has no `source=` (and no `{...` spread, which could carry it
  indirectly — none exist today, verified by direct scan, but the check stays honest
  either way).
- New `src/lib/alertSignupSourceContract.test.ts`:
  - Unit tests for `findAlertSignupUsagesMissingSource` against small inline fixture
    strings (comment-only mention → not flagged; tag with `source=` → not flagged; tag
    missing `source=` → flagged; multi-line tag → still detected).
  - One repo-wide contract test that globs real `src/**/*.tsx` files via `fs`, runs the
    same function, and asserts the result is empty (module-level allowlist array for any
    deliberate legacy exception — empty today, verified by direct scan that all 63
    current call sites already pass `source`).
- No runtime/page change. No new capture point. No schema change.

## Acceptance criteria
- `findAlertSignupUsagesMissingSource` correctly ignores comment-only mentions and
  correctly flags a tag missing `source=` in fixture tests.
- The repo-wide contract test passes today (0 real call sites missing `source`) and
  would fail if a new `<AlertSignup ... />` without `source` were added (proven by a
  fixture test, not by actually adding one to the app).
- `npx tsc --noEmit` and `npx next build` both exit 0.
- Full `node --experimental-strip-types --test 'src/**/*.test.ts'` suite passes,
  including the new tests.
- QA smoke on a couple of real AlertSignup-bearing pages (e.g. `/alerts`, `/aircraft`)
  still passes — this cycle makes no runtime change, so it's a baseline-regression
  check, not a new-behavior check.

## Out of scope
- Changing any existing `<AlertSignup>` call site.
- Enforcing `source` at the TypeScript type level (making the prop required) — that's
  a bigger, separate decision (would need every call site audited for correctness, not
  just presence); this cycle only guards presence via a test.
- Any other backlog item.
