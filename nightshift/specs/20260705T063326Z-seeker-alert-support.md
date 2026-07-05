# Seeker-listing alert support

## Goal
Extend the demand-capture alert pipeline (digest cron + `/alerts` landing + inline
browse-page signup) to cover seeker ("pilots seeking a partnership") listings, the
one of the three listing types it currently silently drops.

## Why
The nav's primary CTA is now "Get alerts" (`/alerts`), and the digest cron
(`/api/cron/alert-digest`) already supports `aircraft` and `partnership` alert
targets — but `partnership_seekers` has no equivalent. `/partnerships/seeking` is
the only browse page of the three listing types with no inline `AlertSignup`, and
the `/alerts` landing page has no seeker chip. A visitor interested in "pilots
seeking a partnership near me" has no way to get alerted today. This was flagged
explicitly as a follow-up in the immediately-prior cycle's CHANGELOG "Next" note.

## Scope
- `src/app/api/cron/alert-digest/route.ts`: add a `seeker` variant to the
  `AlertTarget` union, a `parseSourcePath` match for the bare `/partnerships/seeking`
  path → `{ type: 'seeker' }`, and a `countNewSeekers` query against
  `partnership_seekers` (`status = 'active'`, `created_at >= since`), wired into
  `countNew`.
- `src/components/AlertsLanding.tsx`: add an interest chip "Pilots seeking a
  partnership" → `sourcePath: '/partnerships/seeking'`, `noun: 'seeker'`.
- `src/app/partnerships/seeking/page.tsx`: add the same inline `AlertSignup` the
  other two listing types' browse pages have (placed after the About/FAQ section,
  mirroring `partnerships/state/[state]/page.tsx`'s placement), `sourcePath:
  '/partnerships/seeking'`, `noun: 'seeker'`, no `context` (general copy, matching
  the existing "Partnership shares" chip which also has no context).

## Out of scope
- Filtered seeker alerts (by make/airport) — the bare "any new seeker listing" path
  only, matching how `/partnerships` bare-path alerts already work.
- Any change to `scraper/send-alerts.mjs` (flagged separately as possibly-dead code
  in the prior cycle; not touched here).
- No schema change — `partnership_seekers` already has everything needed.

## Acceptance criteria
- `parseSourcePath('/partnerships/seeking')` returns `{ type: 'seeker' }`.
- `countNew` for a `seeker` target queries `partnership_seekers` correctly (verified
  via a standalone logic check, mirroring how the query-filter fix was verified).
- `/alerts` renders a new "Pilots seeking a partnership" chip that produces working
  copy via `AlertSignup`.
- `/partnerships/seeking` renders an inline `AlertSignup` section, matching the
  visual/behavioral pattern already on `/partnerships/state/[state]` etc.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) on
  `/alerts` and `/partnerships/seeking` at desktop 1280 + mobile 375.
