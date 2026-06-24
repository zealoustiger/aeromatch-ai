# Post-a-Seeking form: make it frictionless (slice 1, ripple-free subset)

**Lane:** [want] (last non-bug cycle `footer-for-sale-by-make` pulled [goal]; last cycle PASS → no blocker → [want] owed per the 1:1).

## Goal
Lower the friction of posting a "pilot seeking a partnership" listing by removing
redundant/unnecessary fields, mirroring the proven `post-partnership-frictionless`
slice that already shipped — fewer fields, same data quality.

## Scope (small)
- `src/components/PostSeekerListingForm.tsx` — Base Location section: keep just the
  Home Airport **ICAO** (required) input; **remove** the Airport Name / City / State
  inputs (implied by the code). Add helper text matching the partnership form. Remove
  the **Preferred Scheduling System** field from Partnership Preferences.
- `src/app/actions.ts` (`createSeekerListing`) — derive `airport_name` / `city` /
  `state` server-side from the authoritative `airports` table by ICAO (exact mirror of
  `createPartnership`), instead of reading them from the form. `preferred_scheduling`
  simply goes null (field no longer submitted).

## Acceptance criteria
- `/partnerships/seeking/new` renders 200 with the form; the Base Location section
  shows only Home Airport (ICAO) + Willing to Travel — no Airport Name / City / State
  inputs. No Preferred Scheduling System field anywhere on the form.
- The ICAO input is still required and uppercases; helper text explains we fill in the
  airport name/city/state automatically.
- `createSeekerListing` looks up the `airports` table by the submitted ICAO and stores
  the derived name/city/state (falls back to null when the ICAO isn't in the table; the
  insert still succeeds), so `/partnerships/seeking` and the state SEO surfaces keep
  real location data. No schema change.
- `next build` + typecheck green; QA smoke (production build) exit 0 at desktop 1280 +
  mobile 375 — HTTP 200, zero app-origin console errors, zero horizontal overflow.
- Screenshots confirm the shortened form renders cleanly on both viewports.

## Out of scope (deferred to later slices — they carry ripples)
- **Multiple base airports** — needs a schema change on `partnership_seekers` plus the
  seeking browse filter + display to handle many airports. Next slice.
- **"Willing to travel" → drive-time (30/45/60 min)** — the existing `willing_to_travel_nm`
  column is rendered as "±X nm" in `SeekerCard` + the seeking detail page, and seeded rows
  store nm; switching the *unit* to minutes needs those display sites + data semantics
  handled together (a new column), so it's its own slice. Left unchanged (still nm) here.
- Description-writing help/examples, autosave, AI-generate, 375px micro-polish, post-type toggle.
