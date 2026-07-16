# Nav "N new since your last visit" alert pill

## Goal
Make the returning-subscriber nav pill ("My alerts") earn the click by honestly
showing how many of the visitor's locally-subscribed searches have new matching
listings since their last visit — "My alerts · 3 new" — never a fabricated count.

## Scope
- `src/lib/alertLocalSubscriptions.ts` — add `getLocalSourcePaths()` (expose the
  existing stored list) and a new last-visit timestamp pair: `getLastVisitAt()` /
  `stampVisitNow()`, same fail-soft localStorage pattern as the rest of the file.
- `src/lib/alertMatchCounts.ts` — add an optional `since?: string` (ISO timestamp)
  to `getAlertMatchCount`'s opts, threaded into `countActiveAircraft` (filters
  `first_seen_at`), `countActivePartnerships` (`created_at`), `countActiveSeekers`
  (`created_at`). Add a new `getNewMatchCountSince(sourcePaths: string[], since:
  string): Promise<number | null>` that caps to the first 8 paths and sums each
  path's new-since count (skipping any path that fails to resolve/query — fail
  soft per-path, not all-or-nothing).
- `src/app/actions.ts` — thin client-callable wrapper
  `getNewAlertMatchesSinceForPaths(sourcePaths, since)` mirroring the existing
  `getAlertMatchCountForSourcePath` precedent.
- `src/components/Nav.tsx` — on the existing `alertSubscriber` sync effect: when
  true, read the previous `getLastVisitAt()` BEFORE overwriting it. If one exists,
  fetch the new-since count for the locally-stored source paths and show it in
  both the desktop and mobile pill labels. Always re-stamp `stampVisitNow()` after
  reading (first-ever "known subscriber" visit has no prior stamp, so it just
  seeds the stamp with no count that time — never counts "since forever" as new).

## Acceptance criteria
- A visitor with `alertSubscriber` false sees the unchanged "Get alerts"/"Alerts" pill — no behavior change.
- A known subscriber's FIRST visit after becoming a subscriber shows the plain "My alerts" pill (no count yet) and silently seeds the last-visit stamp.
- A known subscriber's SUBSEQUENT visit shows "My alerts · N new" only when N > 0 real new matching listings exist since their stamped last visit; when 0 or the count can't be determined (unrecognized path / query error), the pill stays plain "My alerts" — never a fake or stale number.
- Works identically on the desktop pill and the mobile pill.
- `npx tsc --noEmit` and `npx next build` both pass clean.
- No console errors, no horizontal overflow at 1280/375 on the smoke-tested pages.

## Out of scope
- Any change to the base `alertSubscriber` flag / flip-to-"My alerts" logic (already shipped).
- Server-side/email-side "new since" digests (unrelated existing cron feature).
- A visible per-alert breakdown of which alert has new matches (just a total count).
