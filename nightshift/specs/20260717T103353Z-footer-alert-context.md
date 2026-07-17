# footer-alert-context

## Goal
Make the universal footer alert capture (`FooterAlertCapture`, rendered on every page via `Footer`) page-aware instead of hard-coded to a generic `/` alert, so subscribing from a make/model/state hub page creates a real, matchable, page-scoped alert with matching copy.

## Scope
- New `src/lib/footerAlertContext.ts`: pure, client-safe `deriveFooterAlertTarget(pathname)` that resolves a small whitelist of path shapes already understood by `alert-digest`'s `parseSourcePath` (`/aircraft/[make]`, `/aircraft/[make]/[model]`, `/aircraft/[make]/[model]/[stateCode]`, `/aircraft/for-sale/[state]`, `/partnerships/make/[make]`, `/partnerships/state/[state]`, `/partnerships/near/[icao]`) into a `{ sourcePath, context }` pair; every other path (including look-alikes `parseSourcePath` can't actually match, like `/aircraft/listing/[id]`, `/aircraft/mission/[x]`, `/aircraft/compare/[x]`) falls back to the existing universal `/` target.
- `src/components/FooterAlertCapture.tsx`: reads `usePathname()`, derives `{ sourcePath, context }` via the new helper, uses them (not the old hard-coded `/`) for subscribe/analytics/local-subscription-memory/copy. Resets per-render state (submitted/local-subscribed check/impression tracking) when `sourcePath` changes, since the root layout doesn't remount `Footer` across client-side navigations.

## Acceptance criteria
- On `/aircraft/cessna` (a real make hub), the footer box reads "Get email alerts for new Cessna listings" and subscribing writes an `alerts` row whose `source_path` is `/aircraft/cessna` (not `/`).
- On a page with no derivable filter (e.g. `/`, `/about`, `/aircraft/listing/[id]`), the footer box is byte-identical in behavior to before this change: generic "Get email alerts for new listings" copy, `source_path` = `/`.
- A visitor who already subscribed via the bare `/` footer (or the same page's footer previously) still sees the "You're getting alerts — manage them" state; no re-nagging.
- `npx tsc --noEmit` and `npx next build` pass clean.
- `qa-smoke.mjs` passes (HTTP 200, no console errors, no horizontal overflow at 1280/375) on a representative sample: `/`, `/aircraft/cessna`, `/aircraft/cessna/172`, `/partnerships/make/cirrus`.
- No schema change, no change to `alert-digest`'s parsing logic.

## Out of scope
- Query-string-based context (e.g. `/aircraft?make=Cessna`) — this slice is pathname-only (`usePathname()`, no `useSearchParams()`), matching the backlog item's literal scope and avoiding the Suspense-boundary requirement `useSearchParams()` would add to every page via the root layout.
- Match-count / social-proof lines (that's the full `AlertSignup` component's job, not this thin footer island).
- Mobile sticky alert bar / compare-hub / duplicate-alert / other items in the same planner batch — separate slices.
