# alert-matchcount-rollout

**Goal:** Thread the live "N match right now" expectation line (`AlertSignup`'s
`matchCount` prop) into the alert-capture surfaces that don't have it yet, reusing
counts each page already computes wherever possible — no new queries except where an
existing exported helper is the correct, already-used-elsewhere count.

**Scope (files expected to touch):**
- `src/components/AlertSignup.tsx` — make the honest zero-match copy noun-aware
  (currently hardcodes "None for sale right now" for every noun; wrong once
  `matchCount=0` renders on a `noun="partnership"`/`"seeker"` box).
- `src/components/AircraftSaleList.tsx`, `src/components/PartnershipList.tsx`,
  `src/components/SeekerList.tsx` — empty-state `AlertSignup` gets `matchCount={0}`
  (trivial, the count IS zero by definition of that branch).
- `src/app/aircraft/[make]/page.tsx` — pass existing `total`.
- `src/app/aircraft/for-sale/[state]/page.tsx` — pass existing `n`.
- `src/app/partnerships/near/[icao]/page.tsx` — pass existing `results.length`.
- `src/app/partnerships/make/[make]/page.tsx` — call existing
  `countPartnershipsByMake(entry.filter)` (already used by `/partnerships/browse`).
- `src/app/partnerships/state/[state]/page.tsx` — call existing
  `countPartnershipsByState(code)` (already used by `/partnerships/browse`).
- `src/app/partnerships/seeking/page.tsx` — call existing `getAlertMatchCount(alertSourcePath)`
  (same helper the listing-detail page already uses), which correctly resolves this
  page's own filtered `sourcePath` shape to a seeker count.

**Out of scope (left for a follow-up, noted in CHANGELOG):**
- `/aircraft` and `/partnerships` browse/filter pages — their live result count isn't
  threaded back out of `AircraftSaleList`/`PartnershipList` to the parent page today;
  wiring it needs a small return-value plumbing change, more invasive than a one-line
  prop pass. Left for a dedicated slice.
- Homepage band (`src/app/page.tsx`) — its `AlertSignup` uses `sourcePath="/"`, a
  site-wide (non-search-specific) capture with no matching "search result count" to
  honestly show; intentionally omitted, not a gap.

**Acceptance criteria:**
1. Every empty-state `AlertSignup` (aircraft/partnership/seeker list empty states)
   renders the honest zero-match line ("None available right now — be first to know
   when one lists." for non-aircraft nouns, unchanged "None for sale right now…" text
   for aircraft).
2. `/aircraft/[make]`, `/aircraft/for-sale/[state]`, `/partnerships/near/[icao]`,
   `/partnerships/make/[make]`, `/partnerships/state/[state]`, `/partnerships/seeking`
   each render a live, non-fabricated match-count line matching that page's own
   already-displayed count (or a fresh call to an existing count helper).
3. No new database queries added except the two existing-but-previously-unused-here
   `countPartnershipsByMake`/`countPartnershipsByState` calls and one
   `getAlertMatchCount` call on the seeking page — all three already exist and are
   already used elsewhere for the identical purpose.
4. `next build` + typecheck clean.
5. QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) at
   desktop 1280 + mobile 375 on a representative sample of the touched pages.
6. No regression to the two already-wired surfaces (make/model page, listing detail
   page) — their copy/behavior stays byte-for-byte for the aircraft noun.

**Not attempted:** browse/filter page match counts, homepage band.
