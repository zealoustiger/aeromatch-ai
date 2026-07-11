# Live match count per alert on /alerts/manage

## Goal
Show an honest "N listings match right now" (or "N pilots match right now" for
seeker alerts) on each row of `/alerts/manage`, so a subscriber can tell if their
alert is well-scoped or dead — closing `[P1][goal]` from `BACKLOG.md`.

## Scope
- New `src/lib/alertMatchCounts.ts`: a standalone parser + counter for "how many
  active listings/seekers match this alert's `source_path` right now." Mirrors
  the shape of `src/app/api/cron/alert-digest/route.ts`'s private `parseSourcePath`
  (same source_path shapes: modern query-string + legacy SEO path-segments) and
  `countNewAircraft`/`countNewPartnerships`/`countNewSeekers`, but counts ALL
  currently-active matches (no `since`/date-gate). Deliberately a **separate**
  module, not an import from the cron route — same precedent as
  `alertEditCriteria.ts` (see its own header comment): the cron route is a live
  production send path with no test harness, so it's left untouched this cycle.
  Returns `null` when the `source_path` isn't parseable (never a fake `0`).
- Modify `src/app/alerts/manage/page.tsx`: for each fetched alert row, call the
  new counter (in parallel via `Promise.all`) and render a small honest line
  ("3 listings match right now" / "1 pilot matches right now") next to the
  existing "Subscribed <date>" line. Render nothing when the count is `null`
  (unparseable `source_path`) — no fake zero, no fake blank.
- No new capture point, no `alert_subscribed` event change, no schema change.

## Acceptance criteria
- `/alerts/manage` (signed in, with alerts) shows a real, server-computed match
  count per row for every alert whose `source_path` is parseable by the new
  counter; unparseable rows show no count line (not "0").
- A genuinely zero-match alert shows "0 listings match right now" (a real,
  useful "this alert may be dead" signal), not hidden — this is the whole point
  of the feature per GOAL.md.
- Count query only counts `status='active'` rows (aircraft/partnerships) or
  `status='active'` seekers, respecting the same make/model/state/price/year/tt
  filter fields the digest cron matches on.
- `npx next build` + typecheck pass.
- No console errors on `/alerts/manage` at desktop 1280 / mobile 375; no
  horizontal overflow.
- The cron route (`src/app/api/cron/alert-digest/route.ts`) is untouched.

## Out of scope
- Refactoring the cron route to share the parser (explicitly deferred, same as
  `alertEditCriteria.ts`'s precedent).
- Any change to alert capture, digest email content, or the Edit form.
- Partnership/seeker price-drop matching (separate backlog item).
