# Aircraft for-sale trust badge — slice 1 (make trust VISIBLE)

## Goal
Mirror the proven partnerships trust layer on the FOR-SALE aircraft side: show a small,
honestly-computed trust/completeness chip on every aircraft-for-sale card so buyers can
see at a glance how complete and trustworthy a listing is. ([P1][want] lane.)

## Lane
[want] — human-wanted feature (trust is the human's #1 differentiator). Scoreboard at
orient: 61 pageviews/7d.

## Background
- Partnerships already has `src/lib/partnershipTrust.ts` (flat signal table + pure
  `evaluateTrust` over 4 signals) + `src/components/TrustBadge.tsx` (compact chip +
  checklist), with passing tests. No schema, no ranking effect, sky-blue accent.
- For-sale side (`AircraftSaleCard.tsx`) has NO trust badge.
- `AircraftSaleCard` is the SINGLE render point for for-sale listings across `/aircraft`,
  `/aircraft/[make]/[model]`, `/aircraft/for-sale/[state]`, and `/saved`. One edit there
  surfaces the chip on every for-sale surface.
- There is NO per-listing for-sale detail page (`/aircraft/[id]` does not exist) and the
  `AircraftForSale` type has NO image column (the card always renders a make placeholder
  with an unconditional "Not actual plane photo" badge). So: NO checklist variant is wired
  this slice (nowhere to put it), and the partnerships `real_photo` signal has no
  equivalent column on for-sale and is intentionally NOT ported (it would be permanently
  false = fake/empty, which the runbook forbids).

## Signals (4, all computed from EXISTING `aircraft_for_sale` columns; no schema)
1. `complete_specs` — year + registration + make/model + description >= 80 chars.
2. `maintenance_disclosed` — TTAF (`ttaf`) and engine time since overhaul (`smoh`) both present.
3. `transparent_price` — a concrete numeric `asking_price` (not just "contact for price").
4. `member_posted` — `source === 'user'` (listed by a ClubHanger member; contact stays
   on-platform rather than redirecting to an external aggregator via `source_url`).

## Scope (files I expect to touch)
- NEW `src/lib/aircraftTrust.ts` — mirrors `partnershipTrust.ts` (signal table + pure
  `evaluateAircraftTrust` scorer).
- NEW `src/lib/aircraftTrust.test.ts` — worked-example tests mirroring
  `partnershipTrust.test.ts` (node:test).
- NEW `src/components/AircraftTrustBadge.tsx` — a small parallel compact chip (sky-blue),
  reusing the exact TrustBadge compact visual. (Parallel component is lower-risk than
  generalizing the typed partnerships TrustBadge across two listing shapes.)
- EDIT `src/components/AircraftSaleCard.tsx` — render `<AircraftTrustBadge>` in the badge row.

## Acceptance criteria (QA grades against these)
1. `npx next build` passes; `npx tsc --noEmit` introduces NO new errors in touched files
   (only the 3 pre-existing `.test.ts` import-extension baseline errors remain).
2. New unit tests (`aircraftTrust.test.ts`) all pass.
3. The compact chip renders on for-sale cards on `/aircraft` (production build) at desktop
   (1280) AND 375px mobile, showing a REAL computed "N/4 trust signals" count (never
   fake/empty), sky-blue accent.
4. No new console errors, incl. no hydration-mismatch warning, on `/aircraft`.
5. No change to ranking/sort order; no schema change; no frozen files touched.

## Out of scope
- Ranking/sort changes (later slice).
- Checklist variant / detail page (no for-sale detail page exists).
- A `real_photo` signal (no image column on for-sale).
- Any schema/SQL, auth/admin/ingest/env changes.
