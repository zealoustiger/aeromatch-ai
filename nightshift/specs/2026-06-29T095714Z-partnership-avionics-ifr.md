# partnership-avionics-ifr

**Pillar:** 3 — proprietary, honest buyer analysis (rotation: last cycle was Pillar 1
`past-listings-relist`, before that Pillar 3 `avionics-ifr-summary`; Pillar 2 Google OAuth
remains human-blocked on frozen `/auth`).

## Goal
Port the IFR-suitability buyer read (shipped to the aircraft detail page in
`avionics-ifr-summary`) onto the **partnership detail page**, so a co-ownership buyer gets
the same honest "can I file IFR in this shared aircraft, and how capable is the panel?"
synthesis that no other listing site offers — instead of just a raw capability-chip list.

## Scope (small)
- `src/lib/avionicsClassify.ts` — extract the `computeIfrSuitability` logic + `IfrTier` /
  `IfrSuitability` types out of the aircraft page into this shared avionics lib (they operate
  purely on `AvionicsCap[]`, which already lives here). Export them.
- `src/lib/avionicsClassify.test.ts` — new unit tests for `computeIfrSuitability` (tier
  precedence + the empty/`null` self-suppression honesty floor).
- `src/app/aircraft/listing/[id]/page.tsx` — delete the now-duplicated local
  `computeIfrSuitability` / types; import from the lib. Behavior unchanged.
- `src/app/partnerships/[id]/page.tsx` — render the IFR verdict at the top of the local
  `AvionicsPanel` (add a local `IFR_CHIP` color map, mirroring the existing local
  `CAP_COLORS` per-page pattern).

## Acceptance criteria
- [ ] `computeIfrSuitability` + `IfrTier`/`IfrSuitability` live in `avionicsClassify.ts` and
      are imported by both detail pages — no duplicated copy of the function.
- [ ] The aircraft detail page's avionics IFR badge is unchanged (same headline/sub/tier).
- [ ] The partnership detail page's Avionics panel now shows the IFR verdict badge + sub-line
      above the capability chips, using the same honesty-gated logic.
- [ ] Honesty floor preserved: no IFR badge renders when `caps` is empty (function returns
      `null`); nothing fabricated — every sub-line that lacks data says "ask/verify the owner."
- [ ] `npx next build` + typecheck pass; new lib unit tests pass.
- [ ] QA smoke (HTTP 200 / no app console errors / no horizontal overflow at 1280 + 375) passes
      on an aircraft and a partnership detail page.

## Out of scope
- No change to `classifyAvionics` extraction logic or the capability-chip set.
- No new DB queries, columns, or schema.
- No change to the aircraft IFR deal-signal row (lines ~292-305) other than the import source.
- No restyling of the existing chips or panels beyond inserting the IFR badge.
