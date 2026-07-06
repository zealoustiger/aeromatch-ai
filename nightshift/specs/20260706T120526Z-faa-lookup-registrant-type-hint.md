# faa-lookup-registrant-type-hint

## Goal
Surface the FAA registry's registrant-type (Individual / LLC / Trust / Corporation / Government) as a short hint after a successful N-number lookup on the aircraft and partnership post forms, instead of silently discarding data the API already returns.

## Scope
- `src/components/PostAircraftForm.tsx` — `handleLookup`'s success branch (`lookupStatus` string).
- `src/components/PostPartnershipForm.tsx` — identical `handleLookup` success branch.
- No API change: `/api/faa-lookup` (`src/app/api/faa-lookup/route.ts`) already returns `registrantType` (`Individual`/`LLC`/`Trust`/`Corporation`/`Government`/other/`null`) — it's fetched by both forms today but never read.
- No schema change.

## Acceptance criteria
- After a successful lookup, the status line reads e.g. `Found: 2015 Cirrus SR22 · Individually registered` when `registrantType === 'Individual'`.
- LLC → `· Registered to an LLC`; Trust → `· Registered to a trust`; Corporation → `· Registered to a company`; Government → `· Government registered`; any other non-null string → `· Registered to {value}`; `null`/missing → no suffix (status line unchanged from today).
- Both `PostAircraftForm.tsx` and `PostPartnershipForm.tsx` get the identical treatment (parity, matching the existing duplicated-logic pattern between the two files).
- No change to which fields are auto-filled (make/model/year logic untouched) — purely appends to the display string.
- `npx next build` + typecheck pass; QA smoke passes on `/aircraft/new` and `/partnerships/new` at desktop 1280 + mobile 375 with no new console errors/overflow.

## Out of scope
- The bulk FAA registry import / `faa_aircraft` table idea (that's a separate, much larger slice of the same backlog item).
- The seeker post form (`/partnerships/seeking/new`) — it doesn't have an N-number field (no aircraft to look up).
- Any change to the lookup's find/fill behavior itself.
