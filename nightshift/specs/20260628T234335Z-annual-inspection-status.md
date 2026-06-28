# Annual inspection status — proprietary buyer-analysis (Pillar 3)

## Goal
On the aircraft-for-sale detail page, turn the raw `annual_due` value into an honest,
proprietary buyer-decision read — "months of annual remaining" / "due soon" / "may be
overdue" — so a shopper instantly sees whether a fresh annual (~$2,500) is an imminent cost.

## Why this is proprietary + honest
- No listing site (Controller / Barnstormers / Trade-A-Plane) computes the annual-inspection
  status as a buyer signal — they print the raw date. We synthesize a decision read from our
  own normalized `annual_due` column + the annual-cost assumption already used in the cost model.
- Honesty-gated: `annual_due` is stored as a normalized first-of-month ISO date (extractor
  `parseAnnualDate`). The read self-suppresses (renders nothing) when the value can't be parsed
  to a real year+month, or when the implied date is implausibly far out (likely stale/mis-parsed
  data) — never fabricating a status. Month granularity only (the source states month/year), so
  copy says "~N months", never a false-precision day count.

## Scope (small)
- **New lib** `src/lib/annualStatus.ts` — `computeAnnualStatus(annualDue, now)` →
  `{ dueLabel, monthsFromNow, state: 'current'|'soon'|'overdue', headline, detail } | null`.
- **New unit test** `src/lib/annualStatus.test.ts` — honesty gating + the three states
  (matches the existing `node --test` lib-test convention).
- **Wire into** `src/app/aircraft/listing/[id]/page.tsx`: compute the status, render a new inline
  `AnnualStatusPanel` after the Airframe-time panel, and format the existing "Annual due" spec
  row to a friendly "Mon YYYY" (it currently prints the raw `2025-11-01` ISO string).

## Acceptance criteria
- [ ] `computeAnnualStatus` returns `null` for null/unparseable input and for implausibly
      out-of-range dates; returns a populated result for a clean `YYYY-MM-01` value.
- [ ] Future due date → `current` ("≈N months of annual remaining"); this/next month → `soon`
      ("a fresh annual ~$2,500 will be needed soon"); past due → `overdue` (verify-a-current-annual
      framing, no assertion the aircraft is grounded).
- [ ] The panel self-suppresses when the lib returns null (no empty/`null` UI).
- [ ] The "Annual due" spec row renders "Nov 2025", not "2025-11-01".
- [ ] `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) exits 0 with no
      app-origin console errors and no horizontal overflow; the panel looks correct in screenshots.

## Out of scope
- No DB/schema change, no new query, no change to the extractor or `annual_due` data.
- Not folding the status into the Deal Score panel (possible future slice — note in CHANGELOG).
- No change to partnership/seeker pages or the post forms.
