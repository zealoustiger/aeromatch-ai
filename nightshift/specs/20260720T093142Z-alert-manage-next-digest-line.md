# alert-manage-next-digest-line

## Goal
Show a forward-looking "Next digest: ~<when>" line on each confirmed alert row in `/alerts/manage`, mirroring the existing backward-looking "Last email … · checks weekly" line, so subscribers can see when to expect their next email instead of only when the last one went out.

## Scope
- `src/lib/alertFrequency.ts` — new pure `describeNextDigest(lastDigestAt, frequency, nowIso, digestDay)` helper that scans forward day-by-day (bounded) reusing the existing `isDigestDue` (the exact same predicate the cron gates sends on) to find the next date a send would actually fire, then formats it as "~tomorrow morning" / "~<Weekday>" (within 6 days) / "~<Mon D>" (further out).
- `src/lib/alertFrequency.test.ts` — new unit tests for `describeNextDigest` (never-sent, daily, weekly with/without `digest_day`, monthly, far-future).
- `src/app/alerts/manage/page.tsx` — render the new line directly below the existing `describeLastDigest` line, same `a.status === 'confirmed'` gate (so it never claims a schedule for a pending/paused/bounced row).

## Acceptance criteria
- A confirmed alert row shows both "Last email …" and a new "Next digest: ~…" line.
- The projected date is computed by reusing `isDigestDue` (no duplicated due-date math), so it can never claim a date the cron itself wouldn't send on.
- Pending / paused / bounced rows never show a "Next digest" line (paused rows keep their existing "Paused until <date>" pill only).
- `npx tsc --noEmit` and `npx next build` both pass; new unit tests pass alongside the existing `alertFrequency.test.ts` suite.
- QA smoke passes on `/alerts/manage` (desktop 1280 + mobile 375, zero console errors, zero horizontal overflow) — non-visual-ish but touches rendered text, so screenshots are read for confirmation.
- No schema change, no new capture point, no change to the actual cron send logic.

## Out of scope
- Any change to `isDigestDue`, the cron route, or send timing itself.
- Snooze/vacation-mode "resumes" copy (already handled by the existing paused-status pill).
- Any other `/alerts/manage` layout change.
