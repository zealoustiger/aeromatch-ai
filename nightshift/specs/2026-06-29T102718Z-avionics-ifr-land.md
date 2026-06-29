# Spec: avionics-ifr-land

**Timestamp:** 2026-06-29T102718Z  
**Slug:** avionics-ifr-land

## Goal
Clear the stale `.next` build cache that caused phantom-chunk 404s and land the already-complete `partnership-avionics-ifr` feature (IFR suitability badge on partnership detail pages) that was blocked only by that environment issue.

## Context
The previous cycle (FAIL — partnership-avionics-ifr) completed all code, passed `npx next build`, `tsc --noEmit`, 12 unit tests, and visual QA screenshots — but the smoke gate exited 1 because the production build server was serving HTML that referenced two `_next/static/chunks/*.js` files (`0279po_9_9ssh.js`, `0fko-k2qmtiwp.js`) that were not emitted to disk. The prior agent reproduced this on clean staging (no edits), proving it was environmental — stale `.next` artifacts from earlier in the session causing a chunk-manifest mismatch. Clearing `.next` and rebuilding from scratch eliminates the stale references.

## Scope
- Delete `/app/.next` (stale build cache — not source code)
- Checkout `night/partnership-avionics-ifr` (already authored)
- Run `npx next build` to emit a clean, self-consistent set of chunks
- Run `qa-smoke.mjs` on the affected pages to confirm smoke gate passes
- Merge `night/partnership-avionics-ifr` to `staging` and push

**Source files already changed on the branch:**
- `src/lib/avionicsClassify.ts` — extracted `computeIfrSuitability` + `IfrTier`/`IfrSuitability` into the shared classifier
- `src/lib/avionicsClassify.test.ts` — 12 unit tests
- `src/app/partnerships/[id]/page.tsx` — IFR badge in the Avionics panel
- `src/app/aircraft/listing/[id]/page.tsx` — imports from shared classifier (aircraft behaviour unchanged)

## Acceptance criteria
- [ ] `rm -rf .next` executed before the new build
- [ ] `npx next build` exits 0 on the `night/partnership-avionics-ifr` branch
- [ ] `tsc --noEmit` exits 0
- [ ] `qa-smoke.mjs` exits 0 on partnership and aircraft listing pages (HTTP 200, zero app-console errors, zero horizontal overflow)
- [ ] Partnership detail page shows IFR suitability badge in the Avionics panel (visual confirm)
- [ ] Aircraft detail page behaviour unchanged (visual confirm)
- [ ] Merged to staging and pushed

## Out of scope
- Any new code changes beyond the existing branch
- Changes to `qa-smoke.mjs` or any nightshift harness file
