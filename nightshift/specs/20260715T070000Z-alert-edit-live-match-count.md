# Live match-count preview while editing an alert (`/alerts/manage`)

## Goal
Show a live "N listings/pilots match right now" preview (with an honest 0-match
warning) inside the alert edit form as a subscriber changes criteria, before they save.

## Scope
- `src/components/AlertEditForm.tsx` — add a debounced effect that recomputes a
  candidate `source_path` from the in-progress form fields (reusing
  `buildAlertCriteriaUpdate` from `src/lib/alertEditCriteria.ts`) and fetches its
  match count via the existing `getAlertMatchCountForSourcePath` server action
  (`src/app/actions.ts`, already used the same way by `RecentlyViewedAlertBanner.tsx`).
  Render the count near the Save button, reusing the exact singular/plural + amber-
  on-zero convention already used for the per-row static count on `/alerts/manage`
  (`src/app/alerts/manage/page.tsx` ~L355-364), plus a 0-match warning line.
- No new files. No schema change. No new capture/analytics event (read-only preview).

## Acceptance criteria
- Opening the Edit form for an alert shows a live match count that updates
  (debounced ~350ms) as make/model/state/price/deal fields change, without
  requiring Save.
- The count uses the same real counting logic as the existing static per-row
  count (`getAlertMatchCount`/`countActiveAircraft`/`countActivePartnerships`/
  `countActiveSeekers`) — never a guess or client-side estimate.
- 0 matches renders an honest amber warning ("This alert won't match anything
  today — consider widening") instead of just a bare "0".
- A fetch error or unrecognized candidate path shows nothing extra (fails soft,
  same convention as the existing static count) — never blocks Save.
- No regression to the existing Edit/Save/Cancel/hidden-criteria-chip flow.
- `npx next build` + typecheck pass; qa-smoke clean on `/alerts/manage` at
  desktop 1280 + mobile 375, zero new console errors, zero overflow.

## Out of scope
- Changing the Save/submit path itself, `updateAlertCriteria`, or any schema.
- Live count for the hidden-criteria chips (still static/per-row only).
- Any new PostHog event.
