# alert-status-whats-next

## Goal
Replace `/alerts/status`'s static "confirmed" copy with the alert's real cadence and live match count, so a subscriber knows exactly what to expect right when trust is highest.

## Scope
- `src/app/alerts/status/page.tsx` — in the `key === 'confirmed' && token` branch (already fetches `source_path`/`unsubscribe_token` via the admin client for cross-sell + the manage link), also select `frequency` with the same graceful-degrade retry precedent `alerts/manage/page.tsx` uses (column may not be migrated live yet), then call the existing `getAlertMatchCount(source_path)`. Build a dynamic body string naming the real cadence ("weekly digest" / "daily digest") and, when available, the honest live match count ("N listings match right now — you'll hear about the next one too" / honest zero case / "N pilots match right now" for seeker alerts). Falls back to today's generic copy when there's no token, no source_path, the frequency column errors, or the match-count query returns null.
- No other files. No schema change (frequency column already exists in `schema.sql`, same pending-live-DDL status as everywhere else it's read). No new capture point, no new `alert_subscribed` event.

## Acceptance criteria
- A real confirmed alert with a parseable `source_path` renders a body naming its actual frequency (weekly/daily) instead of the generic "we'll send you an alert whenever…" line.
- When `getAlertMatchCount` returns real data, the body also states the honest current match count, worded with the correct noun (listing vs. pilot) and an honest zero-case (never fabricated).
- Graceful degrade: missing `frequency` column, unparseable `source_path`, or a match-count query error all fall back to the existing static copy — no crash, no fabricated number.
- `unsubscribed` / `weekly` / `invalid` states are visually and textually unchanged.
- `next build` + typecheck pass; QA smoke passes on `/alerts/status` (all 4 states via query params) at desktop 1280 + mobile 375, zero app console errors, zero overflow.

## Out of scope
- Any change to `/alerts/manage`, the confirm/unsubscribe token routes, or the digest cron.
- A schema/DDL change.
- Enriching the `unsubscribed`/`weekly`/`invalid` panels.
