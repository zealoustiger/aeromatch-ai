# admin-alerts-scoreboard

## Tier check (strict cascade)
1. `[bug]` — none open. Last CHANGELOG entry (`aircraft-make-pulse-line`) was a PASS.
2. `[want]` — re-checked, still empty of *actionable* work:
   - `[P1][want]` "Save this search" auth-wall reconciliation (BACKLOG.md:135) — explicitly
     flagged "a bigger product call, may need a human decision," unchanged since filed.
   - `[P1][want]` Redesign collection layout (BACKLOG.md:2119) — explicitly "STILL OPEN —
     awaits the human's mock," unchanged.
   - `[P1][want]` Trade-A-Plane ingestion (BACKLOG.md:2698) — re-verified live this cycle:
     `curl -A <realistic UA> https://www.trade-a-plane.com/search?...` returns HTTP 403 with
     a DataDome (`captcha-delivery.com`) bot-challenge page. Building this would require bot-
     evasion, which is explicitly out of scope (see the sibling Controller.com item's own
     "do NOT build Cloudflare-evasion" guidance, same class of block).
   - `[P1][want]` Bay-Area coverage benchmark (BACKLOG.md:2710) — prior cycles already shipped
     the numerator (`/admin/coverage`); the denominator remains blocked on no honest external
     data source (same TAP/Controller block).
   - Remaining `[P2][want]` items checked (dynamic seed personas, owner-leads list, model
     filter rollup) are either dormant/no-live-effect or flagged for human review before an
     autonomous build.
3. `[goal]` — dropping to tier 3. Two open `[P1][goal]` items remain in the alert-experience
   queue: "Real instant alerts" (its own audit note says it needs re-scoping before it's
   buildable in one cycle — not picking this) and **"`/admin/alerts` scoreboard — prove which
   placements convert"** (BACKLOG.md:1383) — this one.

## Audit finding before scoping
The backlog item assumes "every alert row already carries a per-placement `source` tag."
Verified against the live `alerts` table (service-role query) this is not true: the table's
real columns are `id, email, context, source_path, status, created_at, confirm_token,
confirmed_at, unsubscribe_token, last_digest_at` — **no `source` column**. `source` is passed
into `AlertSignup` purely for the client-side PostHog `alert_subscribed`/`alert_capture_viewed`
events (`src/components/AlertSignup.tsx`), never written to the DB by `subscribeToAlerts`/
`subscribeSignedInAlert`/etc. (`src/app/actions.ts`). So per-exact-placement ranking isn't
buildable from the DB today without a schema change threading a new column through every
insert path (bigger than one cycle, and not what's needed to hit the core ask this cycle).

**Re-scoped, honestly:** build the parts of "prove it converts" the DB *can* answer without
fabricating precision — status funnel totals, week-over-week confirmed trend, and a
`source_path`-bucketed "which pages" ranking (classified into route families via a pure
function, not a fake per-widget number). Note the `alerts.source` column as a flagged
follow-up for true per-placement precision.

## Goal
Give the human a read-only `/admin/alerts` view of alert funnel health (status totals,
week-over-week confirmed growth, top-converting page families) without PostHog spelunking.

## Scope
- New `src/lib/alertScoreboard.ts`: pure `classifySourcePath()` (buckets a `source_path` into
  a human-readable page family — homepage, aircraft browse, make/model/state pages, listing
  pages, mission/compare pages, partnerships browse/make/state/near/detail/seeking, guides,
  tools, saved, other) + `getAlertScoreboard()` (admin-client query over `alerts`, aggregates
  status counts, this-week-vs-last-week confirmed counts by `confirmed_at`, top page families
  by confirmed count).
- New `src/app/admin/alerts/page.tsx` — mirrors the `/admin/monetization` page's style
  (bar-list layout, honest empty states, "computed at" timestamp).
- `src/components/AdminTabs.tsx` — add an "Alert Scoreboard" tab (Bell icon).
- Unit test `src/lib/alertScoreboard.test.ts` for `classifySourcePath` (pure, no DB).
- BACKLOG.md: check off the item.

## Out of scope
- No schema change (no `alerts.source` column — flagged as a follow-up in the CHANGELOG).
- No new alert capture point, no `alert_subscribed` emission change.
- No change to `admin-auth.ts` / the admin gate (FREEZE).
- Not touching the "Real instant alerts" item (separate, needs its own re-scoping cycle).

## Acceptance criteria
- `/admin/alerts` renders behind the existing admin gate (unchanged FREEZE'd auth check).
- Shows real status-breakdown counts (confirmed/pending/paused/bounced/unsubscribed/other)
  queried live from `alerts`, not fabricated.
- Shows a real this-week-vs-last-week confirmed count (by `confirmed_at`), with an honest
  "not enough data" state when both weeks are 0.
- Shows top page-family buckets ranked by confirmed count (top 8), empty-state when 0.
- `npx tsc --noEmit` and `npx next build` both clean.
- `qa-smoke.mjs` passes on `/admin/alerts` (signed-out gated view: HTTP 200, zero app-console
  errors, zero horizontal overflow, desktop 1280 + mobile 375).
- The actual aggregation logic verified directly against the live DB with the service-role
  key (same precedent as `admin-monetization`/`admin-pilot-verify` cycles), since QA has no
  admin session to exercise the authenticated render.
