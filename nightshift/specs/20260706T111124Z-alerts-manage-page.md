# Spec: Alert management page (v1, read-only)

## Tier
`[P1][goal]` — 🔔 GOAL.md alert-experience lane. Pulled after auditing the open
`[P1][want]` queue this cycle (see rationale below) found nothing cleanly
actionable at tier 2, so the cascade drops to tier 3.

## Tier-2 audit (why no `[want]` item was pulled this cycle)
- `Redesign the collection layout` (P1[want]) — explicitly blocked: "STILL OPEN —
  the wholesale redesign awaits the human's mock." Not actionable without human input.
- `Map search` (P1[want]) — zero prior art (no map lib in the repo), a genuine
  multi-cycle epic; too big for one clean slice.
- `Airport pages as community hubs` (P1[want]) — needs a new, unvetted FBO/flight-club
  data source decision before any code; multi-cycle epic with an open data question.
- `Email alerts capture` (P1[want]) — audited: already fully shipped (`lib/email.ts`,
  confirm/unsubscribe routes, digest cron all live; `RESEND_API_KEY` is in fact set).
  Struck this cycle as a duplicate/stale line (see BACKLOG.md diff).
- `Listing trust layer` (P1[want]) — audited: already fully shipped across all 3
  listing types (badges, ranking, owner nudges, off-platform demotion). Struck this
  cycle as a duplicate/stale line.
- `Add Trade-A-Plane ingestion` (P1[want]) — investigated live: `trade-a-plane.com`
  sits behind DataDome bot-protection (`captcha-delivery.com` challenge on every
  request, including `robots.txt`) — the same headless-blocking class of site as
  Hangar67 (already flagged in BACKLOG's Inspiration section). Not buildable/testable
  from this environment this cycle. Left a note on the backlog line rather than
  attempting a scrape that can't be verified.
- `Bay-Area coverage benchmark` (P1[want]) — correctly deferred behind TAP ingestion.

With tier 2 exhausted of actionable items, this cycle pulls the top open tier-3 item:
**Alert management page (v1, read-only)** — foundational for the pause/delete item
right below it in BACKLOG.md.

## Goal
Give a signed-in user a real, read-only list of their own `alerts` table rows (the
email-capture subscriptions used across the site), so they can see what they're
subscribed to. Today `/account`'s "Email alerts" section actually only shows
`saved_searches` — a different table — so a user who subscribed via an inline
`AlertSignup` box (listing page, empty-search state, browse page, etc.) with no
saved search has zero visibility into that subscription anywhere on the site.

## Scope
- **Additive migration** (`supabase/schema.sql`, tag `alerts_owner_select`): add a
  `select` RLS policy on `alerts` so a signed-in user can read rows matching their own
  JWT email — `auth.jwt() ->> 'email' = email`. ⚠️ HUMAN ACTION REQUIRED: like prior
  additive migrations in this repo, this needs to be run against the live Supabase DB
  before the new page shows real data; until then the page renders a correct (if
  perpetually empty) empty state — never an error.
- **New page** `src/app/alerts/manage/page.tsx`: mirrors `/account`'s existing
  auth pattern (`createServerSupabaseClient()` + `auth.getUser()`; logged-out →
  explainer + sign-in CTA, same as `/account`'s logged-out branch). Signed-in: query
  `alerts` filtered to `.eq('email', user.email.toLowerCase()).neq('status',
  'unsubscribed').order('created_at', desc)`, render each row's `context`,
  `source_path` (as a "View results" link back to that filtered page), and a status
  chip (Pending confirmation / Active / Paused-equivalent — v1 has no pause, so just
  Pending vs Active based on `confirmed_at`). Empty state points to `/aircraft`,
  `/partnerships`, `/partnerships/seeking` to go set one up.
- **Entry point**: add a 4th `ActivityLink` tile ("Alerts" → `/alerts/manage`) to
  `/account`'s existing "Your activity" tile grid — one small diff, no change to the
  existing (separately-flagged-as-stale) "Email alerts" saved-searches section.
- No pause/delete actions this slice (v1 is read-only, per the backlog line) — that's
  the very next queued item, cleanly scoped as its own future cycle.
- No changes to `src/app/auth/**` or `src/lib/supabase-server.ts` (frozen; read-only
  calls to the existing exported client only, same as `/account` already does).

## Acceptance criteria
- [ ] `/alerts/manage` logged-out: shows an explainer + sign-in CTA (`next=/alerts/manage`),
      no bare redirect.
- [ ] `/alerts/manage` signed-in with 0 alert rows: clean empty state, no error.
- [ ] `/alerts/manage` signed-in with ≥1 alert row (verified via a temporary seeded row
      through a real test account, deleted after QA): lists context + a working link
      back to the source path + a status chip; never crashes if the RLS policy isn't
      yet applied live (query returning `[]`/error is treated as "no alerts", not a 500).
- [ ] `/account` shows a new "Alerts" tile linking to `/alerts/manage`.
- [ ] No console errors, no horizontal overflow at 375px or 1280px; QA smoke passes.
- [ ] `next build` + typecheck clean.

## Out of scope
- Pause/delete/resume actions (next BACKLOG item, separate cycle).
- Reconciling `/account`'s mislabeled "Email alerts" (saved-searches) section copy —
  flagged as a follow-up, not fixed this cycle to keep the diff small.
- Any change to `send-alerts.mjs`/digest cron behavior.
