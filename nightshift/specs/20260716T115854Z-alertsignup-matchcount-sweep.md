# Honest capture-time match count on the weakest-context AlertSignup surfaces

## Goal
Wire the existing `AlertSignup` `matchCount` prop (already built and rendering
"N match right now" honestly, incl. the 0-match case) into every guides/`/tools/*`
page whose alert box currently has no count at all — the last `[P1][goal]` item
open in Plan-pass batch #3.

## Scope
- `getAlertMatchCount` (`src/lib/alertMatchCounts.ts`) already recognizes bare
  `/aircraft`, `/partnerships`, `/partnerships/seeking` and the query-string
  `/aircraft?make=&model=` shape — no changes needed there.
- Files to touch (make each page's default export `async`, call
  `getAlertMatchCount(sourcePath)` once, pass `matchCount={result?.count}` into
  the existing `<AlertSignup>` call — no other changes):
  - `src/app/guides/page.tsx`
  - `src/app/guides/aircraft-co-ownership/page.tsx`
  - `src/app/guides/how-to-find-aircraft-partners/page.tsx`
  - `src/app/guides/aircraft-partnership-agreement/page.tsx`
  - `src/app/guides/leaseback-vs-co-ownership/page.tsx`
  - `src/app/guides/cost-of-aircraft-co-ownership/page.tsx`
  - `src/app/guides/flying-club-vs-co-ownership/page.tsx`
  - `src/app/guides/aircraft-pre-purchase-inspection/page.tsx`
  - `src/app/guides/aircraft-title-escrow-and-closing/page.tsx`
  - `src/app/tools/page.tsx`
  - `src/app/tools/cost-calculator/page.tsx` (both the make/model-scoped branch
    and the generic `/partnerships` fallback branch)
  - `src/app/tools/earnings-calculator/page.tsx`
- **`not-found.tsx` is explicitly OUT of scope**: its box uses `sourcePath="/"`,
  which `parseSourcePath` doesn't recognize (returns `null`) — there is no real
  count to attach without changing what the alert itself subscribes to, which
  is a bigger, separate decision. Leaving it exactly as-is (no line, same as
  today) is the honest behavior, not a bug.
- No schema change. No new capture surface — every touched page already renders
  `AlertSignup`; this only adds the reassurance line.

## Acceptance criteria
- Each listed page's `AlertSignup` renders a real, non-fabricated `matchCount`
  (or correctly omits the line if `getAlertMatchCount` legitimately returns
  null/0 — 0 must render the honest "none right now" copy, never be hidden).
- `npx tsc --noEmit` and `next build` both exit 0.
- QA smoke (desktop 1280 + mobile 375) passes on: `/guides`, `/guides/aircraft-co-ownership`,
  `/tools`, `/tools/cost-calculator`, `/tools/cost-calculator?make=Cessna&model=172`,
  `/tools/earnings-calculator` (representative sample of the touched families —
  every touched file shares the exact same one-line change, so this sample
  exercises the pattern without needing all 12 pages screenshotted).
- No fabricated numbers — every count comes from a live `getAlertMatchCount` call
  against the real DB at build time, same honesty floor as every other
  `matchCount` caller already in the codebase.

## Out of scope
- `not-found.tsx` (see above — no resolvable sourcePath).
- Footer (`FooterAlertCapture`) — a deliberately thinner component, per the
  `footer-alert-capture` cycle's own note, that intentionally skips match count.
- Any change to `getAlertMatchCount`/`parseSourcePath` themselves.
- Adding `revalidate` to any of these pages (none had it before; consistent
  with the existing precedent on curated make/model pages, which also compute
  `matchCount` with no `revalidate` export).
