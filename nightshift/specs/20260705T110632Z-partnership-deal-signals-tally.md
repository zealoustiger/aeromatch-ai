# partnership-deal-signals-tally

**Goal:** Give the partnership detail page's "How this partnership stacks up" panel
(`PartnershipDealSignals.tsx`) the same at-a-glance tally-chip synthesis
(`DealScorePanel` on the aircraft-for-sale detail page already has), so both
listing types offer the identical quick-read summary on top of the same honest
signal rows.

**Scope:**
- `src/components/PartnershipDealSignals.tsx` only — add a `summary` tally
  computed from the existing `rows` (count `kind === 'positive'` → "N in this
  listing's favor" chip, count `kind === 'negative'` → "N to ask about" chip),
  rendered above the `<ul>` of rows, mirroring `DealScorePanel` in
  `src/app/aircraft/listing/[id]/page.tsx` (lines 1619-1674) almost verbatim
  (same chip styling classes, same threshold logic, same placement).
- No new data, no new query, no schema change — purely a `.filter().length`
  tally over rows this component already computes and renders.

**Acceptance criteria:**
- A partnership listing whose `PartnershipDealSignals` renders (≥2 signal rows)
  shows 0-2 summary chips above the row list: a green "N in this listing's
  favor" chip when `favorable > 0`, an amber "N to ask about" chip when
  `watchOuts > 0`. Neutral rows are not counted in either chip (matches
  aircraft's behavior exactly).
- When there are zero positive and zero negative rows (all neutral), no chip
  row renders — same self-suppress behavior as the aircraft panel.
- The component's existing `rows.length < 2` self-suppress (whole panel
  doesn't render) is unchanged.
- `npx next build` + typecheck pass clean.
- QA smoke passes on `/partnerships/[id]` (a real listing) at desktop 1280 +
  mobile 375: HTTP 200, no console errors, no horizontal overflow.
- Visual cycle — screenshots read to confirm chip layout/wrapping looks right
  next to the existing row list, no overlap.

**Out of scope:**
- No changes to the aircraft-side `DealScorePanel`.
- No changes to seeker listings (no equivalent synthesis panel there today —
  separate scope, not touched).
- No new signal rows, no change to `computeSignals()`'s existing row logic.
