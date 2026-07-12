# Night Shift Backlog

This is the steering wheel. The overnight loop reads this file every cycle and
picks the highest-value unblocked item. Keep it current — what's here is what
gets built while you sleep.

**North star: `nightshift/GOAL.md` — ACTIVATION (pivot 2026-06-26).** Three pillars:
(1) frictionless listing posting, (2) frictionless signup/auth, (3) proprietary,
honest buyer analysis on listing pages (the ClubHanger Estimate is the template).
**SEO is PARKED** — do NOT invent SEO experiments or build new programmatic page
families; the SEO sections below are tagged `[PARKED]`, touch them only to fix a
`[bug]`. Each cycle, pull the highest-value slice from **"ACTIVATION (pivot focus)"**
just below, rotating across the three pillars so none stalls. `[goal]` now means
"advances an activation pillar," not SEO. The previous SEO goal is preserved verbatim
in `GOAL-seo-parked.md` for when we un-park it.

## How to add an idea
- Drop it under **Ideas** with a one-line description.
- For design/UX work, add an **Inspiration** entry: a URL + 2-3 bullets of
  *exactly what you like*. Specific likes → on-brand results; "make it nicer" → slop.
- Mark priority with `[P1]` (do first) / `[P2]` / `[P3]`.
- **Mark intent so the allocation policy can route it** (see `GOAL.md`):
  `[want]` = a product feature outside the 3 pillars · `[bug]` = something's broken ·
  `[goal]` = advances an activation pillar (posting / signup / buyer-analysis). Since
  the 2026-06-26 pivot, `[goal]` is ACTIVATION, not SEO; the loop pulls the highest-value
  activation slice each cycle (rotating pillars), with `[bug]`/blockers always first.
- Big items (map, AI search, comparison) must be **sliced** into shippable
  increments across multiple cycles — one slice per cycle.

## Note to the PM agent
Each cycle, pick ONE scoped slice. Prefer P1s. For multi-cycle items, do the
smallest valuable increment and note the next slice in the CHANGELOG. You may
append your own ideas to the Ideas list with an `[agent]` tag + one-line rationale.
Monetization/ads = build UI only, never activate a paid network (see FREEZE.md).

---

## Inspiration

- **Hangar67** — https://www.hangar67.com/ — the human likes a lot of its features.
  - Modern aircraft marketplace; study it for listing-card density, saved searches/favorites, filtering, comparison, and map.
  - NOTE: Cloudflare-blocks headless browsers. To study it, use headed/handoff browse mode or work from the human's notes.
- **Controller.com filters** — https://www.controller.com/listings/for-sale/piston-single-aircraft/6
  - Take the *filter taxonomy*, leave the clutter — the human finds Controller "a little busy."
  - Borrow the dimensions (make, model, year, price, total time, engine time, avionics, condition, location); present far fewer at once with progressive disclosure.
- **Etsy × Airbnb — overall visual aesthetic** — https://www.etsy.com/ + https://www.airbnb.com/ — the human wants ClubHanger to feel like a warm, polished consumer marketplace blending these two.
  - **Airbnb:** photo-forward cards with big rounded corners (~`rounded-2xl`), soft hover-lift shadow, minimal/no hard borders; a horizontally-scrolling **category chip bar with small icons** at the top of browse pages; clean type hierarchy + generous whitespace; heart-favorite in the card's top-right.
  - **Etsy:** warm, editorial feel — slightly warm off-white/cream surfaces (not cold slate-gray), friendlier headline type, and curated **collection "rails"** on the homepage (e.g. "Time-builders under $100k", "Glass-panel singles", "Project planes", "Near you").
  - **Branding is OPEN for experimentation** — logo, name treatment, accent color(s), typography, overall look are all fair game; the human will give feedback after the cycle. Try things, but keep each cycle cohesive and reversible (don't thrash the whole brand at once), and keep the "cleaner than Controller" restraint. (Major nav/IA *reordering* still asks a human — see FREEZE.)

---

## Ideas

~~- **[P2][want] Empty-state CTA on partnerships/seeking.**~~ ✅ SHIPPED via `seeking-content-depth` (2026-06-22) When <3 seeking listings match
  (or none near the visitor's search airport), show a full-width card: "Be the first pilot
  seeking a partnership near {airport}. Post for free — owners will find you." The current
  + Post button is small and top-right; this needs to be unmissable in the empty state.
~~- **[P2][want] Cross-link aircraft search → partnerships.**~~ ✅ SHIPPED via
  `aircraft-crosssell-airport-aware` (2026-07-06) The existing `/aircraft` →
  partnerships `MarketplaceCrossSell` card was make-aware but ignored the visitor's
  active `airport` filter, showing the nationwide partnership count/samples even
  when searching near a specific airport. It's now also location-aware: when
  `airport` is set, the count/samples/CTA link narrow to partnerships within 100mi
  (`countActivePartnerships`/`getPartnershipListings` now both accept
  `{airport, radius}`), and the copy reads "See N {make} co-ownership partnerships
  near {ICAO}…". No schema change. **Reverse direction ✅ SHIPPED via
  `partnerships-crosssell-airport-aware` (2026-07-09):** `/partnerships` → aircraft
  cross-sell now also carries `params.airport` into `nearAirport`, `countForSale`
  (extended with an `{ airport }` opt that resolves the airport's state, mirroring
  `fetchAircraftPage`'s existing airport→state narrowing), and `fetchAircraftPage`
  itself (which already supported an `airport` filter — it just wasn't being
  passed). This item is now fully complete both directions.
- **[P2][want] Dynamic-location seed seeking personas.** Make the seeded seeking profiles
  (concierge@clubhanger.com) dynamically match airports near the visitor's search. Instead
  of showing a Bay Area persona to a Texas visitor, render the same persona at an airport
  near the visitor's search/location. Keeps the page from looking empty everywhere.
  **Audit note (2026-07-09):** no `concierge@clubhanger.com` account exists; the real seed
  mechanism is `scripts/seed-seekers.mjs` → real `partnership_seekers` rows (`poster_id:
  null`), which already pulls airports dynamically from the live `airports` table and is
  confirmed geographically diverse in prod today (12 active seed rows spread across
  MS/MD/ME/CA/KS/TX/NC/AR/WA/OR — no Bay-Area skew). The literal "Bay Area persona" this item
  describes is `MOCK_SEEKERS` in `src/lib/mockData.ts` (KPAO/Wei C.), a hardcoded fixture used
  only when `!hasSupabase()` (local dev without env vars) — it never renders on staging/prod,
  so this item has no live user-facing effect today. Leaving open at P2 in case the mock
  fixture is ever surfaced somewhere real; not a build target until then.
~~- **[agent][bug] `image_is_placeholder` never resets to `true` on partnership edit.**~~
  ✅ SHIPPED via `partnership-edit-placeholder-reset` (2026-07-04) `updatePartnershipListing`
  (`src/app/actions.ts`) only set `image_is_placeholder: false` when photos exist, but never
  flipped it back to `true` if a poster removed all photos on edit. Now computed unconditionally
  (`photoUrls.length === 0`), matching `updateAircraftListing`'s existing correct pattern.
  `createPartnership` (insert path) was never affected — it correctly relies on the DB default.
~~- **[agent][goal] Seeker-listing alert support.**~~ ✅ SHIPPED via `seeker-alert-support`
  (2026-07-05) The alert pipeline (`/api/cron/alert-digest`, `/alerts` landing chips, inline
  browse-page `AlertSignup`) supported aircraft-for-sale and partnership alerts but silently
  dropped pilots-seeking-a-partnership listings — the one gap left after the new "Get alerts"
  primary CTA shipped. Added a `seeker` `AlertTarget` + `countNewSeekers` query against
  `partnership_seekers`, an `/alerts` chip, and the same inline signup box on
  `/partnerships/seeking` the other two listing types' browse pages already have. **Not done,
  intentionally:** filtered seeker alerts (by make/airport) — bare "any new seeker listing"
  only, matching how `/partnerships` worked before query-filter support was added.
  **Make-filtering ✅ SHIPPED 2026-07-05** (`seeker-alert-make-filter`): `parseSourcePath` now
  parses `make` off `/partnerships/seeking?make=...` into `.overlaps('preferred_makes', [make])`,
  and the seeking page's inline `AlertSignup` builds that query string from the active make
  filter, mirroring `/aircraft`'s `alertSourcePath` pattern. **Still not done:** airport/state
  filtering for seeker alerts — seeker location matching is multi-airport + radius +
  `additional_airports`-aware, materially more complex than the scalar `icao`/`state` aircraft/
  partnership alerts use; a natural next slice.
~~- **[agent][bug] Nav unread-message badge 400'd for every signed-in user, every page.**~~ ✅
  SHIPPED via `nav-unread-badge-migration-fallback` (2026-07-06) `Nav.tsx`'s unread-count query
  selects `threads.last_message_at`/`last_message_sender_id`/`inquirer_read_at`/`owner_read_at`
  — columns `schema.sql` declares (lines 526-529) but that were never applied to the live
  Supabase DB (confirmed directly: `42703 column threads.last_message_at does not exist`, with
  both the service-role and anon key). Every signed-in page load/route change fired this failing
  query, permanently breaking the unread badge (always renders 0) and logging a `supabase.co`
  400 — flagged twice already in CHANGELOG (`searches-quickstart-onboarding`,
  `alerts-manage-page` cycles) as a "possible future `[bug]`" but never actioned. Added a
  module-level cache so a not-yet-migrated DB fails the query at most once per browser tab
  session instead of on every navigation; self-heals to the real query with no code change once
  the migration lands. **⚠️ HUMAN ACTION still needed: apply the additive `threads` columns
  (schema.sql lines 526-529) against live Supabase** — until then the unread badge stays
  silently at 0 for everyone (degraded gracefully, not broken-looking, but not functional
  either). This joins `alerts_owner_select` and the `saved_listings.note` migration as pending
  human DDL applications.

## 🔔 GOAL — BEST ALERT EXPERIENCE (human-set 2026-07-05) — PULL FROM HERE FIRST
**The `[goal]` is now: make setting/managing an alert the best experience on the web,
everywhere on the site.** Alerts are far lower-friction than posting, and our traffic is
mostly buyers who want to be told when the right aircraft/partnership lists. See GOAL.md.
**Priority order every cycle: `[bug]` → `[want]` (human tasks) → `[goal]` (these).** When
you PASS one of these, **mark it ✅ SHIPPED here in the same cycle** (strike + `via <slug>`).
The `/alerts` landing + `AlertSignup` already exist — build on them; each new capture point
must emit the `alert_subscribed` PostHog event.

- **[P1][want] "Save this search" loses users at the magic-link auth wall — reconcile
  with the lighter `AlertSignup` capture.** Real observed drop-off (2026-07-11 PostHog
  session, mobile/San Jose): visitor filtered `/partnerships` by make+model, clicked
  "Save this search," landed on `/auth`, bounced back to `/partnerships` 8 seconds
  later. 0 new `auth.users`, 0 `saved_searches` rows created that day — did not check
  email / click the magic link. `SaveSearchButton.tsx` already has a clever
  save-and-resume trick (`?saveSearch=1` marker survives the auth round-trip and
  auto-completes on return per `SAVE_INTENT_PARAM`), so this isn't broken — the user
  just never came back. But it means every non-returning visitor's "save" intent is
  silently lost, and it sits awkwardly next to all the `AlertSignup` capture points
  shipped above this cycle, which need only an email (no magic link, no account) to
  fire `alert_subscribed`. Two things to reconcile:
  1. Does "Save this search" (full-auth, syncs to `/searches` + `/account`) need to be
     the *only* path, or should filter pages also surface the lighter `AlertSignup`
     ("just email me new matches") as a lower-friction alternative alongside it —
     mirroring how `/aircraft` and `/partnerships` already do below empty/zero-result
     states? Two similar-sounding CTAs on one page needs care so it doesn't read as
     redundant/confusing. **Still open** — a bigger product call, may need a human
     decision rather than an agent choosing unilaterally.
  2. ~~Independent of (1): can `/auth`'s copy for the `saveSearch` intent be more
     concrete about what's waiting for them ("Your Cessna 172 search is saved as soon
     as you click the link") so the round-trip has better follow-through?~~ ✅ SHIPPED
     via `auth-savesearch-concrete-copy` (2026-07-12) `deriveAuthContext()` in
     `src/app/auth/page.tsx` now detects the `saveSearch=1` round-trip marker and names
     the actual search via the existing `autoNameSearch()` helper — e.g. "Your Cessna
     172 for sale under $80k search is saved the instant you click the link below — no
     extra steps," in place of the generic "Sign in to ClubHanger" copy. Verified live
     (real browser, not just curl — this page's heading renders client-side post-
     hydration) for all 3 `SaveSearchButton` basePaths (`/aircraft`, `/partnerships`,
     `/partnerships/seeking`); all pre-existing `deriveAuthContext` cases (listing
     contact, post flows, `/saved`, generic default) confirmed unchanged. No schema/
     component-signature change.

~~- **[P1][goal] Alert CTA on every aircraft listing page.**~~ ✅ SHIPPED via
  `aircraft-listing-alert-cta` (2026-07-06) A prominent "Alert me for {make} {model}"
  capture on `/aircraft/listing/[id]` (prefill make+model context, sourcePath a
  matchable `/aircraft?make=…&model=…`). Biggest-traffic surface with no alert entry today.
~~- **[P1][goal] "Alert me for this search" on browse/filter results.**~~ ✅
  AUDIT-CONFIRMED ALREADY SHIPPED 2026-07-06 (found during `search-empty-state-alert`
  scoping). `/aircraft` and `/partnerships` already render `<AlertSignup>` below the results
  with `alertContext`/`alertSourcePath` computed from every active query param (not just
  make) — confirmed via direct code read (`aircraft/page.tsx`, `partnerships/page.tsx`), no
  code change needed. This was quietly completed as a side-effect of the family-page alert
  rollout; the backlog line just never got struck.
~~- **[P1][goal] Alert prompt in empty/zero-result search states.**~~ ✅ SHIPPED via
  `search-empty-state-alert` (2026-07-06) When a filter returns 0 results on `/aircraft`,
  `/partnerships`, or `/partnerships/seeking`, the empty-state card now leads with a
  filter-aware "Get alerts for new {context} listings" capture (reusing the exact
  `alertContext`/`alertSourcePath` each page already computes for its below-the-list
  `AlertSignup`) instead of just "try widening your search." The pre-existing below-the-list
  `AlertSignup` on `/aircraft`/`/partnerships` is now suppressed when the list is empty to
  avoid showing the identical capture twice back-to-back.
~~- **[P1][goal] Alert management page (v1, read-only).**~~ ✅ SHIPPED via `alerts-manage-page`
  (2026-07-06) New `/alerts/manage` page lists a signed-in user's own alert subscriptions
  (email-keyed against the `alerts` table, `context` + a "View" link back to `source_path` +
  Active/Pending status chip), plus a Bell "Alerts" tile on `/account`'s activity grid. Added
  an additive `alerts_owner_select` RLS policy (⚠️ apply against live Supabase before real rows
  show — page renders a clean empty state, never an error, until then). Read-only per the slice;
  pause/delete is the next item below. `/account`'s existing mislabeled "Email alerts"
  (saved-searches) section left untouched — flagged as a copy follow-up.
~~- **[P1][goal] Pause & delete an alert.**~~ ✅ SHIPPED via `alert-pause-delete` (2026-07-06)
  Added owner-scoped `pauseAlert`/`resumeAlert`/`deleteAlert` server actions (ownership proven
  by matching the signed-in user's own email against the row via the service-role client — no
  RLS write policy needed) and Pause/Resume/Delete buttons on `/alerts/manage`. Also fixed that
  page's read: it was querying via the anon/authenticated client, which the still-pending
  `alerts_owner_select` RLS policy blocks, so the page always rendered empty for real users —
  switched to the same email-scoped service-role read, so it shows real rows *today* without
  waiting on that migration. No schema change (`alerts.status` is free-text; a new `'paused'`
  value needs no migration) and no cron change (`alert-digest` already only queries
  `status='confirmed'`, so a paused alert is auto-skipped). The unwired legacy
  `scraper/send-alerts.mjs` (not on any cron — the live one is `/api/cron/alert-digest`) was
  not touched.
~~- **[P1][goal] Alert CTA on make/model & state pages.**~~ ✅ SHIPPED via `aircraft-listing-alert-cta` (2026-07-06) `/aircraft/[make]/[model]` and
  `/aircraft/for-sale/[state]` — inline `AlertSignup` with the page's context (many already
  have it; audit + fill gaps), each emitting `alert_subscribed`.
~~- **[P2][goal] Homepage alert band.**~~ ✅ SHIPPED via `homepage-alert-band` (2026-07-08)
  A "Not ready to browse yet?" band on `/` (below the deals rail, above "Three ways to fly
  more for less") using the existing `AlertSignup` component (`sourcePath="/"`, general
  copy) — no new component, no schema/action change.
~~- **[P2][goal] Better unsubscribe UX.**~~ ✅ SHIPPED via `alert-unsubscribe-recover`
  (2026-07-09) The one-click unsubscribe email link still immediately sets the alert to
  `status='unsubscribed'` (no regression), but `/alerts/status` now forwards the same
  `unsubscribe_token` and renders a "Changed your mind? Get fewer emails instead of none"
  recovery box — a new public, token-scoped `pauseAlertByToken` server action (no session
  needed, unlike the existing `pauseAlert`/`resumeAlert` which require a signed-in email
  match) flips the row to the same recoverable `status='paused'` the authenticated
  `/alerts/manage` flow already uses (digest cron already skips paused alerts — no schema
  change). Fires `alert_unsubscribe_recovered` on success. Verified end-to-end against a
  real `@example.com` test alert row (created + deleted this cycle): clicked the real
  unsubscribe link, confirmed the token carried through, clicked "Pause instead," confirmed
  the DB row flipped to `paused` and the UI swapped to an inline confirmation with no reload.
  **Not done, intentionally:** resuming a *paused* alert back to `confirmed` from this public
  token flow (only `/alerts/manage` does full resume today); a per-alert digest-frequency
  ("fewer" as in less-often) setting — that's a separate `alerts` schema addition.
~~- **[P2][goal] Confirmation-email + confirm-landing polish.**~~ ✅ SHIPPED via
  `alert-confirm-polish` (2026-07-09) `buildAlertConfirmEmail()` was a plain white/slate-50
  template; `/alerts/status` was a bare white page — both out of step with the site's warm
  cream (`ch-surface`/`ch-panel`) Etsy×Airbnb tokens used everywhere else. The confirm email
  now renders on a `#faf7f2` cream body with a rounded white card, a small "ClubHanger"
  header, and friendlier copy ("Almost there — confirm your alerts"); `/alerts/status` (all 3
  states: confirmed/unsubscribed/invalid) now wraps in `ch-surface` + a `ch-panel` card, and
  `UnsubscribeRecover`'s "Changed your mind?" box swapped its cold `slate-200/slate-50` for
  the same warm `#ece6dc`/`#f4efe7` tones so it reads as part of the same card. Pure
  presentational — no change to confirm/unsubscribe/pause token logic, subject-line logic, or
  routing. No schema/dependency change.

_Planner refill — generated by Fable 2026-07-11 as the alert-experience `[goal]` queue drained. Priority order every cycle stays `[bug]` → `[want]` → `[goal]`._

~~- **[P1][goal] Detect and store price drops on listings.**~~ ✅ SHIPPED via `aircraft-price-drop-alerts` (2026-07-11) Scoped down from the original "new `price_history` table" plan: `aircraft_for_sale.previous_price`/`price_changed_at` (written by the scraper on every detected price change, confirmed `null` on first insert so a brand-new listing can never double-count as a drop) already carry everything a "was there a recent genuine drop" check needs — no migration required. New pure `src/lib/priceDrops.ts` (`hasRecentPriceDrop`/`priceDropAmount`, unit-tested, 8 cases) plus `countRecentAircraftPriceDrops` in `alert-digest/route.ts` (mirrors `countNewAircraft`'s make/model/state/price/year/ttaf filters, JS-filtered post-fetch since PostgREST can't compare `asking_price` to `previous_price` as columns). Went further than "no UI yet": wired live into the weekly digest — aircraft-type alerts now count price drops alongside new listings, with `buildAlertDigestEmail` (`email.ts`) naming both distinctly ("2 new listings + 1 price drop") rather than conflating them, per GOAL.md's honesty bar. Verified against real prod data (read-only query, no mutation): 87 real listings had a price change in the last 30 days: some are increases (correctly excluded) and some genuine drops (correctly counted). Partnerships/seekers unaffected (different price columns / no price). **Not done, intentionally:** partnership price-drop alerts (separate `previous_buy_in_price` column pair — natural next slice); the opt-in/opt-out toggle and the prettier email template are the next two `[P1]`/`[P2]` items below, unaffected by this change.
~~- **[P1][goal] Add edit-criteria to alert management.**~~ ✅ SHIPPED via `alert-manage-edit-criteria` (2026-07-11) On `/alerts/manage`, each alert row (whose `source_path` is the modern query-string shape — `/aircraft?...`, `/partnerships?...`, `/partnerships/seeking?...`) gets an Edit action opening an inline form pre-filled with its current criteria (aircraft: make/model/state/price range; partnership: make/state/airport; seeker: make/model). Saving calls the new owner-scoped `updateAlertCriteria` action, which rebuilds `source_path` + `context` layered onto the existing query string so unexposed params (e.g. `min_year`/`max_tt`) survive; a confirmation toast shows and only that row's `source_path`/`context` change (status/created_at/tokens untouched). Legacy path-segment SEO alerts show no Edit button and are unaffected. No migration — uses existing columns.
~~- **[P1][goal] Add alert CTA to partnership detail pages.**~~ ✅ SHIPPED via `partnership-detail-alert-cta` (2026-07-11) On `/partnerships/[id]`, added the same email-only `AlertSignup` block shipped on aircraft listing pages (`context`=make+model, `sourcePath=/partnerships?make=...&model=...`, `noun="partnership"`), in the sidebar right after the contact card. Mirrors the aircraft-listing-detail convention exactly (search-scoped `sourcePath`, not a listing-id-scoped one) so the alert is a real, matchable search. No schema/action change — reuses the existing `AlertSignup` component and `subscribeToAlerts` action as-is, so it emits `alert_subscribed` with the existing `context`/`source_path` payload shape (there is no separate `source` tag field in this codebase — confirmed no other caller uses one).
~~- **[P1][goal] Price-drop alert email template.**~~ ✅ SHIPPED via `price-drop-email-template` (2026-07-11) New `buildPriceDropEmail()` in `src/lib/email.ts` renders a single-listing price-drop notification (photo, struck-through old price + bold new price, percent-off badge, "View listing" CTA, manage/unsubscribe footer) on the site's warm cream/sky brand tokens, unit-tested (6 cases: percent-off math, USD formatting, photo/no-photo branches, HTML-escaping). New dev-only `/api/dev/email-preview/price-drop` route renders it against a static fixture for visual QA — no DB read, no email sent, already excluded from crawling via the blanket `/api` robots disallow. **Not done, intentionally:** wiring this template into the live `alert-digest` cron send path — it depends on the not-yet-built price-drop opt-in toggle (separate `[P1][goal]` item below) so a matching alert can't yet be distinguished from one that only wants new-listing alerts; the existing aggregate weekly digest (`aircraft-price-drop-alerts`) is unaffected and still the only live price-drop notification path today.
~~- **[P1][goal] Price-drop opt-in toggle at capture and manage.**~~ ✅ SHIPPED via `alert-price-drop-opt-in` (2026-07-11) Added `alerts.price_drop_opt_in` (additive, default `true` — everyone keeps today's behavior unless they opt out; ⚠️ HUMAN ACTION still needed to apply it live, same as `alerts_owner_select`/`threads` columns). `AlertSignup` now shows an "Also alert me when the price drops on a match" checkbox (default checked) only when `noun === 'aircraft'` (price-drop tracking doesn't exist for partnerships/seekers). New owner-scoped `updateAlertPriceDropOptIn` action + `PriceDropToggle` on `/alerts/manage` (aircraft-type rows only). `alert-digest` now skips `countRecentAircraftPriceDrops` for an opted-out alert. All three read/write paths (`subscribeToAlerts` insert, the manage-page select, the digest-cron select) retry without the column on a `42703`/missing-column error — verified live against the real (not-yet-migrated) prod DB: a real `@example.com` test signup succeeded via the fallback path with no user-facing error, confirming the graceful-degrade design actually works, not just in theory. `alert_subscribed` now carries `price_drop_opt_in` in its payload.
~~- **[P1][goal] Digest vs instant frequency choice.**~~ ✅ SHIPPED via `alert-digest-frequency` (2026-07-11) Scoped down from "instant | daily | weekly" to **daily | weekly** (honesty gate: the live send path is a single daily cron gated per-alert by `last_digest_at`, with no event-driven/real-time trigger, so "instant" would be a fabricated capability — mirrors the scoping-down precedent set by `aircraft-price-drop-alerts` earlier this drain). New additive `alerts.frequency text default 'weekly'` column (⚠️ HUMAN ACTION still needed to apply it live, same pending-DDL pattern as the other `alerts.*` columns) + pure unit-tested `src/lib/alertFrequency.ts` (`isDigestDue`, 8 cases). `AlertSignup` gets a "How often?" Weekly/Daily select (for all 3 listing types, not gated like the price-drop checkbox); `/alerts/manage` gets a `FrequencyToggle` per row (mirrors `PriceDropToggle`). `alert-digest`'s fixed 7-day window is now a per-alert `isDigestDue` check (daily fires after ~1 day, weekly after ~7, unchanged default for everyone who doesn't touch the new control). All three read/write paths retry without whichever of `price_drop_opt_in`/`frequency` the DB is missing (up to 2 passes, since PostgREST names one unknown column per error). Verified end-to-end against the real (not-yet-migrated) prod DB via a real `@example.com` test account + a real magic-link-authenticated session (service-role `generateLink` + `@supabase/ssr`'s own cookie-setting code path, not a mock): `/alerts/manage` rendered the real alert row with a "Weekly" toggle, clicking it flipped to "Daily" with zero new console errors (the only console errors were the pre-existing, already-documented `Nav.tsx` unread-badge 400, unrelated to this change) — test alert + auth user deleted immediately after (verified 0 rows remain). **Not done, intentionally:** an actual "instant" per-listing send trigger (real next slice, needs event-driven infra, not just a column).
~~- **[P2][goal] Rebuild the new-listing alert email to best-in-aviation quality.**~~ ✅ SHIPPED via `alert-digest-email-redesign` (2026-07-11) `buildAlertDigestEmail` now renders on the site's warm cream brand tokens (was plain slate) with up to 3 real matching-listing preview cards for aircraft alerts (photo, title, year/TTAF/location, price — struck-through previous price on a drop sample), a "why you got this" criteria-echo line, and a "Manage alerts" footer link alongside unsubscribe. New `fetchNewAircraftSamples`/`fetchAircraftPriceDropSamples` in `alert-digest/route.ts` (mirror the existing count queries' filters, widened to the columns the cards need); reuses `pickRealPhoto`/`getPlaceholderPhoto` so a placeholder sample photo carries the honest "Not actual plane photo" caption, same site-wide convention. Partnership/seeker alerts keep the CTA-only path (still reskinned to cream tokens) — real sample cards for those types is a natural follow-up. New dev-only `/api/dev/email-preview/alert-digest` preview route. No schema/migration change.
~~- **[P2][goal] Alert CTA on airport pages.**~~ ✅ SHIPPED via `airport-alert-cta` (2026-07-11) Add the email-only alert block to airport pages, pre-filled with that airport's location/state context ("Alert me when aircraft or partnerships near KPAO are listed"), emitting `alert_subscribed` with source `airport_page`. Mirrors the shipped make/model and state page pattern. **Scoped to `noun="partnership"`** (honesty gate: `/airports/[icao]` is a partnerships-only hub — no aircraft-for-sale airport hub exists — so a single honest noun matches the page's actual content, same precedent as `partnership-detail-alert-cta`). `context`=ICAO, `sourcePath=/partnerships?airport=<ICAO>&radius=50` (the exact URL the page's own "search with filters" footer link already uses). Placed right after the intro/overview section, before the FBOs/flying-clubs and listings sections — same position convention as the make/model and state pages. No schema/action change.
~~- **[P2][goal] Post-confirmation cross-sell on /alerts/status.**~~ ✅ SHIPPED via `alert-cross-sell` (2026-07-11) After a user confirms an alert on `/alerts/status`, show "You're set for X - also want alerts for Y?" with one or two one-click suggestions derived from the confirmed criteria (nearby state, sibling model, or the partnerships counterpart of an aircraft alert); accepting creates the second alert instantly for the already-confirmed email and emits `alert_subscribed` with source `cross_sell`. **Scoped down to one suggestion type this cycle:** the aircraft ↔ partnerships counterpart for the same `make` (the concrete "partnerships counterpart" option named in the original item) — the `/api/alerts/confirm` route now forwards `confirm_token` on `?state=confirmed` (mirrors the existing unsubscribe-token-forwarding convention), and `/alerts/status` uses it to admin-lookup the alert's `source_path`, compute a counterpart suggestion via new `src/lib/alertCrossSell.ts`, and render a new `AlertCrossSell` one-click widget. New `subscribeToConfirmedAlert` action inserts the second alert directly as `status: 'confirmed'` for the same email (no second opt-in email — ownership already proven by the first confirm). Only fires for the modern query-string source-path shape with a real `make` present; bare/legacy/seeker alerts show nothing (honesty gate — no suggestion beats a wrong one). **Not done, intentionally:** "nearby state" and "sibling model" suggestion types — natural next slices, noted in CHANGELOG.
~~- **[P2][goal] Social proof count on capture forms.**~~ ✅ SHIPPED via `alert-social-proof-count` (2026-07-11) Add a live "N buyers get alerts for this model" line (real count from the alerts table, hidden below a threshold of 3) to the listing-detail and make/model capture blocks, with the count included in the `alert_subscribed` event payload so its lift is measurable. Read-only query, no migration. New `src/lib/alertCounts.ts` (`getAlertCounts`, mirrors `saveCounts.ts`'s `getSaveCounts` pattern) counts `status='confirmed'` rows grouped by exact `context` string via the service-role client, `MIN_ALERTS_TO_SHOW = 3`. `AlertSignup` takes an `alertCount` prop and renders the line only at/above the floor; `alert_subscribed` now carries `alert_count` when the line was shown. Wired into `/aircraft/[make]/[model]` and `/aircraft/listing/[id]` only (per scope). Live-verified against the real prod DB: 3 real confirmed `@example.com` test rows seeded per context → line rendered correctly on both pages ("3 buyers get alerts for Cessna 172" / "...Experimental"); all 6 test rows deleted after (0 remain).

_Planner refill #2 — generated by Fable 2026-07-11 (the queue fully drained again). Priority order every cycle stays `[bug]` → `[want]` → `[goal]`. Sources: GOAL.md's alert priorities + the "not done, intentionally" follow-ups flagged in shipped items above, verified un-built by direct code read._

~~- **[P1][goal] Alert capture on sold/removed listing pages.**~~ ✅ SHIPPED via `sold-listing-alert-cta` (2026-07-11) Added an `AlertSignup` block inside the amber "no longer for sale" card on `SoldListingPage` (`/aircraft/listing/[id]`), family-scoped ("Get alerts for new {Make} {Model} listings", `sourcePath=/aircraft?make=…&model=…`) when the sold aircraft's make/model resolves via `resolveMakeModelFamily`, falling back to the generic no-context box (`sourcePath=/aircraft`) otherwise — honesty gate: never a listing-id-scoped alert that can't match. Reuses the existing component/action as-is; emits `alert_subscribed`.
~~- **[P1][goal] Branded 404 page with an alert catch.**~~ ✅ SHIPPED via `branded-404-alert-catch` (2026-07-11) New `src/app/not-found.tsx` renders inside `RootLayout` (Nav/Footer stay), Next auto-handles the 404 status + noindex — a friendly headline, "Browse aircraft for sale" / "Browse partnerships" buttons, and the existing `AlertSignup` (`sourcePath="/"`, general copy) replace Next's bare default 404 sitewide. No new component/schema.
~~- **[P1][goal] One-click "email me about this" on saved searches (saved-search ↔ alert unification, slice 1).**~~ ✅ SHIPPED via `saved-search-alert-button` (2026-07-11) GOAL.md explicitly wants signed-in users to see saved searches and alerts unified; today they're disjoint tables/surfaces. Added a per-row "Get email alerts" button on `/searches` (new `subscribeSavedSearchAlert` action) that creates a `status='confirmed'` alert directly for the signed-in user's own verified email (ownership proven by the session — same no-second-opt-in precedent as `subscribeToConfirmedAlert`), reusing the saved search's query string as `source_path` and its own name as `context`; idempotent on re-click/reload via the existing `(email, source_path)` unique constraint, button reflects real state on load via new read-only `src/lib/savedSearchAlerts.ts` (service-role, mirrors the `/alerts/manage` read pattern). Also fixed `/account`'s "Email alerts" section, which falsely claimed "Saving a search turns on its alerts automatically, no extra step" (confirmed via code read that `saved_searches` was never wired to any send path) — now honestly points at `/searches` to turn alerts on and `/alerts/manage` to manage them. Fires `alert_subscribed` (`source: 'saved_search'`) on a genuine new subscribe. No schema change.
~~- **[P1][goal] Live match count per alert on /alerts/manage.**~~ ✅ SHIPPED via `alert-live-match-count` (2026-07-11) Each alert row on `/alerts/manage` now shows an honest "N listings match right now" (or "N pilots match right now" for seeker alerts) via a new standalone `src/lib/alertMatchCounts.ts` — a separate parser from the cron's `parseSourcePath` (same precedent as `alertEditCriteria.ts`: the live production cron route is left untouched this cycle, no shared import). Unparseable source_paths (e.g. `/aircraft/mission/...`) render no count line; a genuine zero renders honestly (the "is this alert dead" signal the item asked for), verified live against real prod data (Cessna 172 → 27 real matches; a nonexistent make → honest 0; an unparseable path → no line) via a throwaway `@example.com` test account + real session, all test rows/user deleted after. No new capture point.
~~- **[P2][goal] Resend-confirmation for pending alerts.**~~ ✅ SHIPPED via `alert-resend-confirmation` (2026-07-11) A subscriber whose double-opt-in email got lost is stranded: `/alerts/manage` shows the Pending chip with no action, and the post-subscribe "check your email" state offers no retry. Added a "Resend confirmation email" action — owner-scoped `resendAlertConfirmation(id)` on `/alerts/manage`'s Pending rows (`AlertActions`), and public `resendAlertConfirmationByEmail(email, sourcePath)` for the resend link in `AlertSignup`'s post-submit state (looked up by the email+sourcePath just submitted seconds ago, no session needed) — both funnel through a shared `sendConfirmationResend` helper reusing the existing `buildAlertConfirmEmail` send path and the row's existing `confirm_token`/`unsubscribe_token`. Rate-limited to 1 resend per row per ~10 min via new additive `alerts.last_confirm_sent_at` column (⚠️ HUMAN ACTION still needed to apply it live, same pending-DDL pattern as the other `alerts.*` columns — until then the resend still sends, it just can't enforce the cooldown). Live-verified end-to-end against the real (not-yet-migrated) prod DB: a real `@example.com` test signup → resend click → "Sent!" with zero new console errors (confirmed the DB read for the not-yet-migrated column failed as expected and the send still succeeded, proving the graceful-degrade path); a real magic-link-authenticated session (service-role `generateLink` + `@supabase/ssr`'s own session-cookie format) exercised the owner-scoped button on `/alerts/manage` — resend succeeded, the only console errors were the pre-existing, already-documented `Nav.tsx` unread-badge 400s (confirmed by URL, unrelated to this change). Test alert + auth user deleted immediately after (verified 0 rows remain).
~~- **[P2][goal] Seeker alerts: airport/state criteria matching.**~~ ✅ SHIPPED via `seeker-alert-airport-state` (2026-07-11) `parseSourcePath`'s `/partnerships/seeking?...` branch now also reads `state`/`airport` off the query string; `countNewSeekers` filters by `state` (exact) and a single `icao` (matches `home_airport` OR `additional_airports`, same OR semantics as `seekersQuery.ts`'s `getSeekers()`, single-ICAO/no-radius — same scope precedent as the existing partnership-alert `icao` matcher), with a graceful-degrade retry if `additional_airports` isn't migrated live yet (same precedent as the other pending `alerts.*`/`additional_airports` columns). `/partnerships/seeking`'s inline `AlertSignup` now carries `state`/`airport` (legacy single param, not the multi-select `airports` — mirrors `/partnerships/page.tsx`'s identical pattern) into `sourcePath` alongside the existing `make`/`model`. **Not done, intentionally:** multi-airport/radius seeker-alert matching (partnership alerts don't have this either — consistent, not a regression); `alertMatchCounts.ts` (the separate live-match-count parser on `/alerts/manage`) still doesn't honor airport/state — natural next slice.
~~- **[P2][goal] Partnership price-drop alerts (detect + digest count).**~~ ✅ SHIPPED via `partnership-price-drop-alerts` (2026-07-11) Mirrors the shipped aircraft pattern: new `countRecentPartnershipPriceDrops` in the digest cron reuses the existing `hasRecentPriceDrop` helper (`src/lib/priceDrops.ts`, unchanged — already generic) by remapping `buy_in_price`/`previous_buy_in_price`/`buy_in_price_changed_at` onto its `asking_price`/`previous_price`/`price_changed_at` shape; wired into the existing `dropCount` computation for `target.type === 'partnership'`, respecting each alert's `price_drop_opt_in` (defaults true — no partnership-specific opt-out UI exists). `buildAlertDigestEmail` gets a new optional `dropNoun` param so the copy reads "N buy-in drop(s)" for partnerships vs "N price drop(s)" for aircraft, counted distinctly from `newCount` as GOAL.md's honesty bar requires. **Column pair already existed** (`previous_buy_in_price`/`buy_in_price_changed_at`, migration `partnership_add_price_history` in `supabase/schema.sql`, already written by `updatePartnershipListing`) — this cycle just wires them into the digest cron's read side; graceful-degrades to 0 drops on the same not-yet-migrated-live column error (confirmed live against the real prod DB: `column partnerships.previous_buy_in_price does not exist` today, and the new code's error-message match correctly returns 0 rather than failing the whole digest send). No new capture point, no schema change (columns pre-existing).
~~- **[P2][goal] Cross-sell: sibling-model suggestion on /alerts/status.**~~ ✅ SHIPPED via `alert-cross-sell-sibling-model` (2026-07-11) `getCrossSellSuggestion` (`src/lib/alertCrossSell.ts`) now tries a curated sibling-model suggestion first for aircraft alerts that name a `model` (172→182, 182→210, SR20→SR22, Cherokee→Arrow — a small hand-picked `SIBLING_MODELS` map keyed by `resolveMakeModelFamily`'s `makeSlug/modelSlug`, the same curated-family matcher the comps/cross-sell modules already use), falling back to the existing make-counterpart (aircraft↔partnerships) suggestion when the model isn't mapped or absent — unchanged. Suggestion's `sourcePath` is the sibling's own curated `/aircraft/[makeSlug]/[modelSlug]` SEO page URL, which the digest cron's `parseSourcePath` already resolves via the same `SEO_MAKE_MODELS` pattern, so the resulting alert matches real listings immediately. No change to `AlertCrossSell.tsx`/`subscribeToConfirmedAlert`/the `alert_subscribed` event — reuses the existing one-click accept path as-is. Verified live against the real prod DB with two throwaway `@example.com` confirmed test alerts (Cessna 172→ rendered "Also want alerts for the Cessna 182?" linking `/aircraft/cessna/182`; Cessna 150 → correctly fell back to the generic "Cessna co-ownership partnerships" suggestion); both test rows deleted after (0 remain). No schema/migration change.

_Planner refill #3 — generated by Fable 2026-07-11 (queue fully drained again). Priority order every cycle stays `[bug]` → `[want]` → `[goal]`. Every candidate below was verified un-built by direct code read this pass (not just absent from the changelog)._

~~- **[P1][goal] Token-scoped alert management for email-only subscribers.**~~ ✅ SHIPPED via `alert-manage-by-token` (2026-07-11) `/alerts/manage?token=<unsubscribe_token>` now proves ownership of that alert's email (same public token-scoped precedent `pauseAlertByToken` established) and renders that email's full alert list with working pause/resume/delete/edit-criteria/price-drop/frequency controls — no sign-in wall. `loadOwnedAlert`/`resendAlertConfirmation` generalized behind a shared `resolveOwnerEmail(admin, token?)` (token → resolve via `unsubscribe_token`; no token → session, unchanged); a signed-in session always takes priority so a stray `?token=` on a signed-in visit is never forwarded to that visitor's own actions. The weekly digest email's "Manage alerts" link now carries `?token=`. No schema change. **Not done, intentionally:** a "Manage alerts" link on the confirm email (it has none today) — separate, smaller follow-up. See CHANGELOG.
~~- **[P1][goal] Signed-in one-click alert capture in `AlertSignup`.**~~ ✅ SHIPPED via `alert-signin-one-click` (2026-07-11) When a session with a verified email exists, `AlertSignup` now renders "Alert me — we'll email {their email}" as a single button in place of the email field, creating the alert directly as `status='confirmed'` via a new `subscribeSignedInAlert` server action (same no-second-opt-in precedent as `subscribeSavedSearchAlert`/`subscribeToConfirmedAlert`). Signed-out visitors see the unchanged email-field flow. One shared-component change upgrades every existing capture point site-wide; `alert_subscribed` now carries `signed_in: true` on this path. See CHANGELOG.
~~- **[P1][goal] Wire `buildPriceDropEmail` into the live digest cron.**~~ ✅ SHIPPED via `price-drop-email-live` (2026-07-11) The best-in-aviation single-listing price-drop template shipped (`price-drop-email-template`) but is still only reachable via the dev preview route — its stated blocker (the price-drop opt-in toggle) shipped later the same day, so it's now dark for no reason. Slice: in the daily cron pass, when an opted-in aircraft alert's window contains price drops, send the rich per-listing template for the best drop (or top-N cards) instead of/alongside the bare "+1 price drop" count line. Honesty: the send path stays the daily cron — copy must say "dropped this week/yesterday", never "just dropped". No new capture point; completes an already-shipped surface.
  New `pickBestPriceDropSample` (`src/lib/email.ts`, unit-tested) picks the largest genuine % decrease among the up to 3 fetched price-drop samples. The cron route (`alert-digest/route.ts`) now sends `buildPriceDropEmail` for the featured listing when an aircraft alert's window has a drop and zero new listings (never drops new-listing info — an alert with both still gets the aggregate digest, unchanged). Partnerships/seekers unaffected (no rich template exists for them). **Bonus honesty fix found + fixed this cycle:** `buildPriceDropEmail`'s text body said "just dropped X%" — a false real-time claim now that this fires from a daily/weekly cron, not just the static dev preview; added a `periodLabel` param ("yesterday" for daily-frequency alerts, "this week" default) so the copy matches the actual send cadence, per this item's own honesty note. Verified read-only against real prod data: queried genuine recent `aircraft_for_sale` price drops (8 found), fed 3 real candidates through `pickBestPriceDropSample` + `buildPriceDropEmail` — correctly picked the largest % decrease (14%, not the most recent) and rendered honest copy. No live cron invocation (RESEND_API_KEY is set and CRON_SECRET isn't, so a real hit would email real subscribers) — same precedent as `partnership-price-drop-alerts`.
~~- **[P2][goal] Seeker alerts: airport/state in the live match count.**~~ ✅ SHIPPED via `seeker-alert-match-count-location` (2026-07-11) `alertMatchCounts.ts`'s seeker branch still only parsed `make`/`model` (verified by code read), so a seeker alert saved with `?airport=KPAO` showed a "N pilots match right now" number on `/alerts/manage` that ignored location — the exact over-matching the digest cron just fixed (`seeker-alert-airport-state`), still live on the manage page. Mirrored the cron's state/`home_airport`-OR-`additional_airports` matching (with the same graceful-degrade retry when `additional_airports` isn't migrated live yet) in the count query. Honesty fix on an existing surface.
~~- **[P2][goal] Partnership sample cards in the digest email.**~~ ✅ SHIPPED via
  `partnership-digest-samples` (2026-07-11) `alert-digest-email-redesign` shipped real
  listing preview cards for aircraft alerts only; partnership alerts still got the
  CTA-only fallback. Added `fetchNewPartnershipSamples` (mirrors `fetchNewAircraftSamples`'s
  filter/limit/order pattern) + a `shareType` field on `AlertDigestSample` (rendered in
  place of the aircraft-only `ttaf` in the specs line) so a partnership alert with genuine
  new matches now shows up to 3 real cards: photo (honest placeholder caption when no real
  photo), share type (e.g. "1/4 Share"), city/state or home airport, and buy-in price.
  Verified against real prod data (read-only): fed 3 real active Piper-partnership rows
  through the actual `pickRealPhoto`/`getPlaceholderPhoto`/`formatShareType` helpers and
  through `buildAlertDigestEmail` itself — correct HTML/text output, no TTAF leakage. **Not
  done, intentionally:** partnership price-drop preview cards (parity with
  `fetchAircraftPriceDropSamples` — a partnership alert with only a buy-in drop still gets
  the CTA-only fallback); natural next slice.
~~- **[P2][goal] Saved-search ↔ alert unification, slice 2: inline alert settings on `/searches`.**~~ ✅ SHIPPED via `searches-inline-alert-settings` (2026-07-12) A row with a confirmed alert now shows `FrequencyToggle`/`PriceDropToggle` (aircraft-only for the latter, same gate as `/alerts/manage`) inline, plus a "Turn off alerts" button calling the existing `pauseAlert` action — reverts the row to its pre-alert "Get email alerts" state, the saved search itself untouched. New `getAlertDetailsBySourcePath` (replaces `getAlertedSourcePaths`) returns each matched alert's `id`/`frequency`/`price_drop_opt_in` (graceful-degrades on the not-yet-migrated-live columns, same pattern as `/alerts/manage`); `subscribeSavedSearchAlert` now also returns the new alert's id/settings so the row can render the toggles immediately without a page reload. No schema change. Verified end-to-end against the real prod DB with a real `@example.com` test account (magic-link session minted server-side, no browser round-trip): toggled frequency Weekly→Daily, price-drop On→Off, then turned alerts off — confirmed the alert row's `status` flipped to `paused` (not deleted) and the row correctly reverted; all test rows/user deleted after (0 remain). **Bug caught + fixed during QA:** the new inline controls overflowed at 375px (didn't wrap) — fixed by mirroring `AlertEditForm`'s `w-full`/`flex-wrap` pattern.
~~- **[P2][goal] Contextual alert CTA on `/tools/cost-calculator`.**~~ ✅ SHIPPED via
  `cost-calculator-alert-cta` (2026-07-11) The item as written assumed the calculator
  collects make/model — verified false by reading `CostCalculator.tsx` (buy-in/monthly
  fixed/wet rate/hours/rental-rate only, no aircraft identity field at all), so a
  make/model-prefilled CTA wasn't buildable without fabricating context. Shipped the honest
  scoped-down version instead: a general `AlertSignup` (`noun="partnership"`, no `context`)
  now renders below the explanatory copy on `/tools/cost-calculator`, the first alert
  capture point under `/tools`. **Bonus correctness fix caught before shipping:** the
  obvious `sourcePath="/tools/cost-calculator"` would have created an alert that can
  *never* fire — `alert-digest/route.ts`'s `parseSourcePath` only recognizes real site
  routes and silently drops (`unparseable`) anything else — so `sourcePath` points at
  `/partnerships` (bare, all-partnerships) instead, verified end-to-end against the real
  prod DB (real submit + row inspection, cleaned up after) to land as `source_path:
  '/partnerships'` and match the existing `parseSourcePath`/`alertMatchCounts` support.
  See CHANGELOG.
~~- **[P2][goal] Cross-sell: nearby-state suggestion on `/alerts/status`.**~~ ✅ SHIPPED via
  `alert-cross-sell-nearby-state` (2026-07-11) The last un-built suggestion type from the
  original cross-sell item (make-counterpart and sibling-model both shipped). `getCrossSellSuggestion`
  (`src/lib/alertCrossSell.ts`) is now async and, when a confirmed alert's `source_path` names a
  `state` (and no sibling-model match applies), walks a small curated `ADJACENT_STATES` map
  (same 10-state curated set used elsewhere) calling the existing `getAlertMatchCount`
  (`alertMatchCounts.ts`) per neighbor — offers the first one with a real, non-zero count
  ("Also want alerts for Cessna aircraft in Nevada? 6 listings now"), falling back to the
  existing make-counterpart suggestion when no neighbor has live inventory. No component change
  (`AlertCrossSell.tsx` already renders any suggestion generically) or schema change. Verified
  live end-to-end against the real prod DB: seeded two throwaway `@example.com` confirmed
  alerts (`/aircraft?make=Cessna&state=CA` and `/partnerships?make=Cirrus&state=TX`), confirmed
  the first correctly rendered the honest Nevada suggestion (6 real listings) and the second
  correctly fell back to the counterpart suggestion (0 real Cirrus partnerships in any TX
  neighbor), then Playwright-clicked "Yes, alert me" on the first and confirmed a second
  `confirmed` alert row was inserted with the exact suggested context/source_path; all 3 test
  rows deleted after (0 remain). This closes the alert-experience `[P2][goal]` queue again
  (until the next plan-pass refill).

_Planner refill #4 — generated by Fable 2026-07-12 (queue fully drained again). Priority
order every cycle stays `[bug]` → `[want]` → `[goal]`. Every candidate below was verified
un-built by direct code read this pass._

~~- **[P1][goal] Placement `source` tag on every `alert_subscribed` event.** GOAL.md's "prove
  it converts" clause needs to know *which placement* converted, but `AlertSignup` (verified
  by code read) emits no placement field — all ~12 shipped capture points (listing detail,
  make/model, state, airport, homepage band, empty states, sold page, 404, cost calculator,
  browse footers…) fire indistinguishable events, and `source_path` conflates placements that
  share a search URL (listing-detail and make/model pages both use `/aircraft?make=…&model=…`).
  Add a `source` prop to `AlertSignup` (e.g. `listing_detail`, `empty_state`, `homepage_band`,
  `not_found`), thread it through every render site + `QuickStartSearchForm` (also missing
  it), and include it in the event payload — consistent with the values the non-AlertSignup
  emitters already use (`saved_search`, `cross_sell`). No new surface, no schema change —
  makes every existing surface measurable.~~ ✅ SHIPPED via `alert-source-placement-tag`
  (2026-07-12) Added an optional `source?: string` prop to `AlertSignup`, included in all
  three `track('alert_subscribed', ...)` calls (anonymous + signed-in one-click submit paths;
  `undefined` when omitted, never a fabricated default), and threaded a distinct snake_case
  value through all 23 real `<AlertSignup>` render sites (`listing_detail`, `sold_listing`,
  `make_model_page`, `make_model_state_page`, `make_page`, `state_page`, `mission_page`,
  `browse_footer`, `empty_state`, `airport_page`, `partnership_detail`,
  `partnership_make_page`, `partnerships_near_airport`, `partnership_state_page`,
  `seeking_page`, `seeking_detail`, `homepage_band`, `not_found`, `cost_calculator`,
  `alerts_landing`) plus `QuickStartSearchForm`'s own alert (`saved_search`, matching
  `SavedSearchAlertButton`'s existing convention). Pure client-side analytics-payload change —
  no schema/server-action change, no DB rows needed. See CHANGELOG.
~~- **[P1][goal] Honor `radius` in partnership alert matching — the airport-page alerts
  under-match what they promise.**~~ ✅ SHIPPED via `partnership-alert-radius-match`
  (2026-07-12) Honesty gap on a shipped surface: `airport-alert-cta` stores
  `sourcePath=/partnerships?airport=<ICAO>&radius=50` and the page promises "near KPAO," but
  both the digest cron (`alert-digest/route.ts`) and `alertMatchCounts.ts` matched the exact
  ICAO only. Added a `radius` field to both files' `AlertTarget` partnership variant + parsed
  it from the query string, and a shared `resolveIcaoList` helper (one copy per file, matching
  each file's existing "deliberately separate parser" precedent) that calls the existing
  `getAirportsWithinRadius` (`src/lib/airports.ts` — the same haversine helper the live
  `/partnerships?airport=…&radius=…` search page already uses) and swaps `.eq('home_airport',
  icao)` for `.in('home_airport', list)` in all 4 affected queries (`countNewPartnerships`,
  `countRecentPartnershipPriceDrops`, `fetchNewPartnershipSamples` in the cron;
  `countActivePartnerships` in the match-count lib). No radius → unchanged exact-match
  behavior; seeker/`near/[icao]` paths untouched (no radius param on those). No schema change,
  no new capture point. Live-verified against the real prod DB: a real `@example.com` test
  alert on `/partnerships?airport=KHWD&radius=50` showed "4 listings match right now" on
  `/alerts/manage` (verified independently via direct query: 2 exact-ICAO matches vs. 4 across
  the 9-airport 50mi radius set) — before this fix it would have shown 2. Test row deleted
  after (0 remain).
~~- **[P1][goal] "You already get alerts for this" state in `AlertSignup` for signed-in
  users.**~~ ✅ SHIPPED via `alert-signup-already-subscribed` (2026-07-12) The signed-in
  one-click path (`alert-signin-one-click`) still rendered "Alert me — we'll email {email}"
  even when that user already had a live alert for the same `source_path` (the insert is
  idempotent, but the UI misled and the click was a silent no-op). New read-only server action
  `getExistingAlertForSourcePath` (reuses `getAlertDetailsBySourcePath`) + a client
  `useEffect`/render branch in `AlertSignup.tsx` now detect the existing alert and render
  "✓ You're already getting alerts for this" with the email + digest frequency and a
  "Manage alerts" link to `/alerts/manage`, taking priority over the capture button — never
  fires a duplicate `alert_subscribed`. Two files, no new props to the 17 server call sites,
  no schema change. Live-verified against prod DB with a throwaway `@example.com` alert +
  minted session (matching page → "already" state, no button; non-matching page → normal
  button unchanged); test data deleted after.
~~- **[P1][goal] "Manage alerts" link in the confirmation email + on `/alerts/status`'s
  confirmed panel.**~~ ✅ SHIPPED via `alert-confirm-manage-link` (2026-07-12) The
  explicitly-flagged not-done follow-up from `alert-manage-by-token`: `buildAlertConfirmEmail`
  took only confirm/unsubscribe URLs, so the first email a subscriber ever receives had no
  path to management, and the confirmed state on `/alerts/status` didn't link the token-scoped
  manage page either. Added a `manageUrl` option (`${SITE_URL}/alerts/manage?token=
  <unsubscribe_token>` — the same convention `alert-digest`'s emails already use) to
  `buildAlertConfirmEmail`, threaded through both call sites (`subscribeToAlerts`,
  `sendConfirmationResend`) in `actions.ts`. `/alerts/status`'s confirmed-state query now also
  selects `unsubscribe_token` (distinct from the page's own `confirm_token` param) and renders
  a "Manage your alerts" link when present. No schema change. Live-verified against the real
  prod DB with a throwaway `@example.com` confirmed test alert: `/alerts/status?state=confirmed
  &token=<confirm_token>` rendered "Manage your alerts" linking `/alerts/manage?token=
  <real unsubscribe_token>`, which correctly loaded that alert (not an invalid-link state); a
  bogus token showed no link, no crash. Row deleted after (0 remain).
~~- **[P2][goal] Partnership buy-in-drop preview cards in the digest email.**~~ ✅ SHIPPED
  via `partnership-price-drop-cards` (2026-07-12) The flagged not-done parity slice from
  `partnership-digest-samples`: a partnership alert whose window contains only a buy-in drop
  no longer gets the CTA-only fallback — it now gets the same rich per-listing drop cards
  aircraft alerts already have. New `fetchPartnershipPriceDropSamples` (mirrors
  `fetchAircraftPriceDropSamples`, remapping `previous_buy_in_price`/`buy_in_price_changed_at`
  the same way `countRecentPartnershipPriceDrops` already does) wired in as the fallback when
  a partnership alert has `newCount === 0 && dropCount > 0`; `toPartnershipDigestSample` gains
  the same optional `previousPrice` param `toDigestSample` already has. No `email.ts` change —
  `AlertDigestSample.previousPrice`/`shareType` and the card renderer already supported this
  generically. Graceful-degrades to `[]` on the not-yet-migrated-live column error, same as
  the count path (confirmed live: `previous_buy_in_price` still doesn't exist on the real prod
  DB today). No schema change (columns already declared in `schema.sql`, just pending human
  DDL application — joins the existing pending-migration list).
- ~~**[P2][goal] Alerts entry point in the global footer.**~~ ✅ SHIPPED via
  `footer-alerts-link` (2026-07-12) Added a "Get email alerts" link as the first item in
  the footer's "Explore" column (site-wide, every page). Audited `/alerts` landing copy
  against the current feature set — `AlertsLanding`/`AlertSignup` already accurately
  state no-account, price-drop opt-in, one-click unsubscribe, and the daily/weekly
  frequency selector already renders inline in the signup form; no copy changes needed.
~~- **[P2][goal] Cross-sell suggestion on `/alerts/manage` (digest → manage → grow loop).**~~
  ✅ SHIPPED via `alerts-manage-cross-sell` (2026-07-12) New `subscribeManageCrossSell`
  server action (proves ownership via `resolveOwnerEmail` — session or the page's own
  `?token=`, same as every other manage-page action) + `ManageAlertCrossSell.tsx` client
  component render one honest "Also want alerts for the {sibling}?" box on
  `/alerts/manage`, trying each confirmed alert's `source_path` (newest first) via the
  existing `getCrossSellSuggestion` until one isn't already among the visitor's alerts.
  Live-verified end-to-end (real click, not `.click()`) against the real prod DB with a
  throwaway `@example.com` confirmed test alert: the box rendered "Also want alerts for
  the Cessna 182?", clicking "Yes, alert me" inserted a real second `confirmed` alert row
  with the correct `source_path`, no second opt-in email, no duplicate; a follow-up load
  correctly showed no box once every reachable candidate was already subscribed (honest
  dedup, not a bug — the further 182→210 chain needs a query-string-shaped seed, and the
  182 alert's own curated URL is path-segment style, matching `/alerts/status`'s existing,
  documented behavior). Both test rows deleted after (0 remain). No schema change.

_Planner refill #5 — generated by Fable 2026-07-12 (queue fully drained again — all of
refill #4 shipped). Priority order every cycle stays `[bug]` → `[want]` → `[goal]`. Every
candidate below was verified un-built by direct code read this pass (signed-out
`/alerts/manage` is a sign-in dead end; `Nav.tsx`'s "Get alerts" is static; the digest cron
has no seeker sample fetch; `buildPriceDropEmail` is aircraft-only)._

~~- **[P1][goal] "Email me my manage link" — self-serve manage access for email-only
  subscribers.**~~ ✅ SHIPPED via `alerts-manage-link-email` (2026-07-12) Token-scoped
  `/alerts/manage` shipped, but the token only arrived inside alert emails — a no-account
  subscriber who deleted them had NO path back in. Added an "Email me my manage link"
  form to the signed-out `/alerts/manage` state (new `ManageLinkRequestForm.tsx` +
  `requestAlertsManageLink` action) + a "Already set up alerts? Manage them" link on the
  `/alerts` landing page. Looks up the most recent non-unsubscribed alert for the
  submitted email, sends a new `buildManageLinkEmail` template pointing at
  `/alerts/manage?token=<unsubscribe_token>`, rate-limited via the existing
  `last_confirm_sent_at` column/cooldown (same graceful-degrade-if-not-migrated-live
  pattern as `alert-resend-confirmation`). **Always returns the identical neutral
  "if that email has alerts, a link is on its way" response** whether or not the email
  has alerts — no enumeration. Live-verified via a real Playwright browser session
  against the real prod DB: a throwaway `@example.com` confirmed test alert + a
  nonexistent email both rendered the exact same success message; confirmed
  `last_confirm_sent_at` still doesn't exist live today (joins the existing pending-DDL
  list), so the cooldown can't yet be enforced, matching every other `alerts.*` column in
  this state. Test alert row deleted after (0 remain). No schema change, no new capture
  point (no `alert_subscribed`, per scope).
~~- **[P1][goal] "New alert" builder on `/alerts/manage`.**~~ ✅ SHIPPED via
  `alerts-manage-new-alert` (2026-07-12) The manage page could edit/pause/delete but not
  CREATE — a subscriber wanting one more alert had to go hunt for a capture box elsewhere.
  New "+ New alert" button opens an inline form (a listing-type selector — Aircraft for
  sale / Partnerships / Seeking a partnership — then the matching fields, mirroring
  `AlertEditForm`'s field set per type) via new `NewAlertForm.tsx`. New `createManageAlert`
  server action proves ownership via the existing `resolveOwnerEmail` (session or the
  page's own `?token=`, same as every other manage-page action), builds `source_path`/
  `context` via the existing `buildAlertCriteriaUpdate(type, null, fields)` helper (the
  same one `updateAlertCriteria` uses), and inserts directly as `status='confirmed'` — no
  second opt-in email, same no-second-opt-in precedent as `subscribeManageCrossSell`.
  Idempotent on the existing `(email, source_path)` constraint (23505 → success, no
  duplicate `alert_subscribed`). Fires `alert_subscribed` with `source: 'manage_new'` on a
  genuine new subscribe. No schema change. Live-verified end-to-end (real Playwright
  clicks, not `.click()`) against the real prod DB with a throwaway `@example.com` test
  account + a real magic-link-minted session: opened the form, selected Partnerships,
  filled make=Cessna/airport=KHWD, submitted — new "Cessna near KHWD" row appeared
  immediately (no page reload) with working View/Pause/Delete/Edit/frequency controls and
  even triggered the existing cross-sell suggestion; submitting the identical criteria
  again confirmed exactly 1 row in the DB (idempotent, no duplicate). Console showed only
  the pre-existing, already-documented `Nav.tsx` unread-badge `threads` 400 (confirmed by
  URL, unrelated to this change). Test alert + auth user deleted immediately after
  (verified 0 rows remain).
~~- **[P1][goal] Popular-alert one-click chips on the `/alerts` landing page.**~~ ✅
  SHIPPED via `alerts-landing-popular-chips` (2026-07-12) The page already had a static
  chip row (Cessna 172 / Cirrus SR22 / Piper Cherokee / Beechcraft Bonanza), but it was a
  hardcoded canned list with no honesty gate. `src/app/alerts/page.tsx` (now an async
  server component, `revalidate = 3600` matching `/airports/[icao]`'s convention) runs
  each candidate through the existing `getAlertMatchCount` and drops any with 0 live
  matches before they ever reach the client; added "Partnerships in California" as a
  5th candidate per the item's own example. `AlertsLanding.tsx` now tags the server-
  verified chips' `AlertSignup` with `source: 'alerts_landing_popular'`, distinct from
  the 3 unchanged catch-all chips (still `alerts_landing`). Live-verified end-to-end with
  a real Playwright browser (not `.click()`): clicked the Cessna 172 chip, submitted a
  throwaway `@example.com` email, intercepted the `alert_subscribed` payload — confirmed
  `source: 'alerts_landing_popular'` + correct `context`/`source_path`; test alert row
  deleted after (0 remain). All 5 candidates had live matches today, so all 5 rendered.
~~- **[P1][goal] Post-contact alert cross-sell at the highest-intent moment.**~~ ✅
  SHIPPED via `post-contact-alert-crosssell` (2026-07-12) On a user-posted aircraft
  listing, sending a message to the seller no longer immediately navigates to
  `/messages/{threadId}` — `AircraftContactButton` now shows a "Message sent!"
  success panel with the existing `AlertSignup` (`source="post_contact"`,
  family-scoped `sourcePath=/aircraft?make=…&model=…`) plus a "View conversation →"
  button that completes the navigation (applies to both the manual Send submit and
  the `?contact=1` auto-send-after-auth path, only when a message was actually
  sent). New `PhoneContactLink.tsx` wraps the "Or call / text" number similarly —
  clicking the `tel:` link (which doesn't navigate the page away) reveals the same
  alert prompt inline. Both reuse `AlertSignup` as-is, so the existing signed-in
  one-click path and `getExistingAlertForSourcePath`'s "already subscribed" state
  both apply with no new logic. **Scope note (found this cycle):** verified via
  direct query against the real prod DB that this branch has zero current
  observers — `aircraft_for_sale` has 0 rows with a non-null `poster_id` (no real
  user has posted their own aircraft yet) and `contact_phone` still isn't migrated
  live (`schema.sql`'s `aircraft_add_contact_phone`, same pending-DDL status as
  several `alerts.*` columns), so end-to-end live verification against a real
  "active" user-posted listing wasn't possible — and deliberately not worked
  around: the `quarantine_test_listing` trigger (schema.sql:662, added specifically
  to stop QA cycles leaking test listings) forces any `@example.com`-posted row to
  `status='test'`, which the public `aircraft_public_read` RLS policy excludes, so
  there's no way to synthesize a reachable test row without defeating that guard —
  not attempted. Verified instead via a temporary local-only preview page (never
  committed, deleted before landing) rendering the exact success-panel/phone-reveal
  JSX with fixture props — confirmed no layout/overlap issues at both viewports —
  plus a clean `tsc`/`next build` and `qa-smoke.mjs` regression pass on real (scraped)
  listing pages. This will be observable the moment a real user posts their own
  aircraft and/or the `contact_phone` migration is applied.
~~- **[P1][goal] Returning-subscriber nav state: "Get alerts" → "My alerts".**~~ ✅ SHIPPED
  via `returning-subscriber-nav-state` (2026-07-12) New SSR-safe boolean-only localStorage
  flag (`src/lib/alertSubscriberFlag.ts`, mirrors `localSaves.ts`) is set on a successful
  subscribe (both `AlertSignup` paths) and on an authenticated `/alerts/manage` visit (new
  `AlertSubscriberMarker`, rendered only on the resolved-owner branch, never the signed-out
  dead end). `Nav.tsx` reads it after mount (+ same-tab change event + cross-tab `storage`
  event) and swaps the desktop CTA, mobile top CTA, and mobile-menu row to "My alerts" →
  `/alerts/manage`. Stores ONLY `'1'` — never token/email/PII; the manage page still proves
  ownership via session/token. No new capture point, no `alert_subscribed`, no schema change.
  Live-verified end-to-end (real browser + real prod DB): fresh browser shows "Get alerts" →
  `/alerts`; a real `@example.com` subscribe swapped the nav to "My alerts" → `/alerts/manage`
  with no reload and 0 console errors; localStorage held only `{flag:"1"}`; test alert row
  deleted after (0 remain).
~~- **[P1][goal] Unsubscribe recovery: offer "fewer," literally.**~~ ✅ SHIPPED via
  `unsubscribe-recovery-weekly` (2026-07-12) GOAL.md says one-click unsubscribe should
  offer "fewer instead of none," but `/alerts/status`'s recovery box only offered pause
  (all-or-nothing). New public, token-scoped `updateAlertFrequencyByToken` (mirrors
  `pauseAlertByToken`) revives the alert to `status='confirmed', frequency='weekly'`;
  `UnsubscribeRecover.tsx` now renders a "Switch to weekly instead" button alongside
  "Pause instead" when the alert's current frequency is `daily`, plus a "Manage all your
  alerts" link (`/alerts/manage?token=...`) always shown. Fires
  `alert_unsubscribe_recovered` with `{ action: 'paused' | 'weekly' }`. Same
  graceful-degrade precedent as every other `alerts.frequency` write: retries with just
  the status flip if the column isn't migrated live yet (confirmed live today — column
  genuinely absent, verified via a real Supabase update erroring with "Could not find the
  'frequency' column").
~~- **[P1][goal] Seeker sample cards in the digest email (last parity gap).**~~ ✅ SHIPPED
  via `seeker-digest-sample-cards` (2026-07-12) Aircraft and partnership alerts both
  render up to 3 rich preview cards in the digest; seeker alerts still got the CTA-only
  fallback (confirmed: no seeker sample fetch existed in `alert-digest/route.ts`). Added
  `fetchNewSeekerSamples` (mirrors `countNewSeekers`'s make/state/`additional_airports`-
  aware icao/free-text-model filters, selecting card columns instead of a head-only
  count) + a new `lookingFor` field on `AlertDigestSample` for an honest "looking for"
  summary (make(s) + model(s), e.g. "Cessna, Cirrus · 172, SR20") — no price/TTAF
  fabrication, no photo slot (skipped, not a placeholder-plane-photo). See CHANGELOG.
~~- **[P1][goal] Partnership single-listing buy-in-drop email.**~~ ✅ SHIPPED via
  `partnership-price-drop-email` (2026-07-12) The rich per-listing `buildPriceDropEmail`
  template (fired when a drop is an alert's ONLY news) was aircraft-only — a partnership
  alert in that state got aggregate digest cards, not the best-in-aviation single-listing
  treatment. `buildPriceDropEmail` now accepts optional `dropNoun` (default `"price drop"`,
  byte-for-byte unchanged for aircraft) and `shareType` params; the cron's `bestDrop`
  branch now covers `target.type === 'partnership'` too (was aircraft-only), passing
  `dropNoun: 'buy-in drop'` + the sample's `shareType` (e.g. "1/4 Share") — reusing
  `pickBestPriceDropSample` + the existing `fetchPartnershipPriceDropSamples` as-is, no new
  query. Dev preview route gained `?type=partnership`. Graceful-degrades to today's
  behavior until `previous_buy_in_price` lands live (same pending-DDL status already
  documented). No new capture point. **This closes out the 🔔 alert-experience `[goal]`
  queue (Planner refill #5) — all named items shipped.**

_Planner refill #6 — generated by Fable 2026-07-12 (queue fully drained again — all of
refill #5 shipped). Priority order every cycle stays `[bug]` → `[want]` → `[goal]`. Every
candidate below was verified un-built by direct code read this pass (no `List-Unsubscribe`
header anywhere in `src/`; `/saved` and all 8 `/guides/*` pages render zero `AlertSignup`;
`/alerts/status`'s confirmed panel is static copy; no capture surface uses
`getAlertMatchCount`; `clubHangerDealVerdict` is unwired to alerts; `/api/alerts/` has only
`confirm` + `unsubscribe` routes). Entry points and management are now broad — this refill
shifts weight to deliverability, expectation-setting, and the first smart-alert type._

~~- **[P1][goal] RFC 8058 `List-Unsubscribe` one-click headers on every alert email.**~~
  ✅ SHIPPED via `alert-list-unsubscribe-header` (2026-07-12) New pure
  `buildListUnsubscribeHeaders(unsubscribeUrl?)` in `src/lib/email.ts`; `sendEmail` threads
  it into Resend's `headers` field (`List-Unsubscribe` + `List-Unsubscribe-Post:
  List-Unsubscribe=One-Click`) whenever a caller passes `unsubscribeUrl` — now true at all
  four alert-email call sites (confirm, confirm-resend, manage-link, digest/price-drop).
  `/api/alerts/unsubscribe` gained a `POST` handler (RFC 8058's one-click target) sharing
  the existing GET's token→DB-update logic but returning a plain non-redirecting `200`; GET
  behavior is unchanged (still redirects to `/alerts/status`). Verified live against the
  real prod DB with a throwaway `@example.com` test alert: GET still redirects and flips
  the row exactly as before; POST returns `200` with no redirect and flips the same row;
  POST with no token returns `400`. Row deleted after (0 rows remain).
~~- **[P1][goal] One-click "get fewer emails" link in alert-email footers.**~~ ✅ SHIPPED
  via `alert-fewer-emails-footer` (2026-07-12) New GET-only `/api/alerts/frequency` route
  (mirrors `/api/alerts/unsubscribe`'s token pattern) flips a daily alert's `frequency` to
  `weekly` and redirects to a new `/alerts/status?state=weekly` confirmation panel.
  `buildAlertDigestEmail`/`buildPriceDropEmail` gained an optional `frequencyUrl` footer
  link ("Get fewer emails"), wired from the digest cron only when `frequency === 'daily'`
  (a weekly alert has no lighter cadence to offer). Graceful-degrades exactly like
  `updateAlertFrequencyByToken` while `alerts.frequency` is pending live DDL — verified live
  against the real prod DB with a throwaway `@example.com` test alert (row deleted after, 0
  remain): the route redirected correctly and left `status` untouched even though the
  `frequency` column genuinely doesn't exist yet on the shared table.
- **[P1][goal] Live-match expectation line at capture in `AlertSignup`.** Capture boxes
  show subscriber social proof but nothing about what the alert will actually DO.
  `getAlertMatchCount` (`alertMatchCounts.ts`) already computes honest live-match counts
  for `/alerts/manage` — no capture surface uses it (verified). Add an optional
  `matchCount` prop rendering "N listings match right now — we'll email you when the next
  one lists" (and at a genuine 0, the strongest alert pitch there is: "None for sale right
  now — be first to know when one lists"). Wire it on listing-detail + make/model pages
  first — they already fetch `alertCount` server-side, so the plumbing pattern exists.
  Include `match_count` in the `alert_subscribed` payload so its conversion lift is
  measurable.
- **[P1][goal] "Only good deals" aircraft alert filter — the first smart-alert type.**
  GOAL.md's "smart, honest alert content" clause, unstarted: `clubHangerDealVerdict`
  (`aircraftComps.ts`/`aircraftEstimate.ts`, honesty-floored at ≥4 comps + dead-band)
  classifies deals sitewide, but alerts can't use it — no competitor offers "email me only
  when a good deal lists." Slice: an "Only email me good deals" checkbox (default
  unchecked) on aircraft-noun `AlertSignup`, encoded as `deal=good` in `source_path`'s
  query string (no schema change — layered params already survive `updateAlertCriteria`'s
  rebuild); the digest cron's `countNewAircraft`/`fetchNewAircraftSamples` JS-filter
  matches through the existing verdict helper when the flag is present (same
  post-fetch-filter precedent as the price-drop counts), so a deal-only alert only fires
  on verdict-passing listings — and stays silent rather than fabricating when comps are
  below the honesty floor. `alert_subscribed` carries `deal_only`. If comps-in-cron proves
  too heavy for one cycle, slice further: capture + manage-edit + count path only, sample
  cards next.
- **[P2][goal] Alert capture on the 8 `/guides/*` pages.** Verified: nothing under
  `src/app/guides/` renders `AlertSignup` — a reader who just finished "flying club vs
  co-ownership" is a hot partnership prospect with zero capture on the page. Add a
  partnership-noun `AlertSignup` (source `guide_page`, `sourcePath=/partnerships` — the
  bare parseable path, per the cost-calculator precedent) after the article body on each
  guide + the `/guides` index. This is an alert entry point on existing pages, not SEO
  expansion (no new pages, no metadata changes). Emits `alert_subscribed`.
- **[P2][goal] Alert capture on `/saved` — "alerts for listings like your saves."**
  Verified: `/saved` renders saved aircraft/partnership/seeker cards (both the signed-in
  and device-saves branches) with no alert capture at all, yet a save is proven purchase
  intent. Derive the visitor's most-common saved make (or make+model family) and render a
  family-scoped `AlertSignup` ("Get alerts for new Cessna 172 listings", source
  `saved_page`, matchable `/aircraft?make=…` sourcePath); fall back to the generic box
  when saves are empty or too mixed to name honestly. Emits `alert_subscribed`.
- **[P2][goal] "What happens next" on `/alerts/status`'s confirmed panel.** The confirmed
  state is static copy today (verified — fixed `body` string). Enrich it with the alert's
  real cadence ("your weekly digest") from the row the token lookup already fetches, plus
  the live match count via existing `getAlertMatchCount` ("12 listings match right now —
  you'll hear when the next one lists"), both graceful-degrading to today's copy. Sets
  honest cadence expectations at the moment trust is highest; no schema change, no new
  capture point.
- **[P2][goal] "Send me a sample digest" on `/alerts/manage`.** A subscriber can't see
  what their alert email will look like until the cron happens to fire — and has no way to
  reassure themselves the alert works. Per-alert owner-scoped action (via the existing
  `resolveOwnerEmail` session-or-token pattern, rate-limited via the `last_confirm_sent_at`
  cooldown precedent) that builds a real `buildAlertDigestEmail` from the alert's live
  criteria and samples, clearly labeled as a sample ("your real digest arrives
  {frequency}"), sent to the owner's email only. Doubles as an "is my alert working?"
  check. No new capture point.

_(The plan pass on Opus/Fable will append more alert-experience `[P1][goal]` tasks here as
this queue drains — see PLAN_TASK.md.)_

---

## ACTIVATION pillars (2026-06-26) — SECONDARY (pull only after the alert experience is great)
The three earlier pillars still carry value, but are **below the alert goal** now. Pull a
pillar item only when the alert queue above is genuinely exhausted, or a `[want]`/`[bug]`
calls for it. When you ship one, mark it ✅ and note the next slice in the CHANGELOG.

### Pillar 1 — Frictionless listing posting
Target: cut every step/field/decision between "I want to list" and "it's published."
Current post flows: `/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new`
(server actions in `src/app/actions.ts`; AI draft already exists for partnership/seeker).
~~- **[P1][goal] N-number autofill on the aircraft post form.**~~ ✅ SHIPPED (earlier in this drain) The `/api/faa-lookup` route is wired into `/aircraft/new`: type the registration → auto-fills make / model / year (editable); "Look up →" button + blur trigger; AI prefill also chains a registry backfill when make/model/year are missing.
~~- **[P1][goal] "Paste & prefill" the whole form.**~~ ✅ SHIPPED via `aircraft-url-prefill`
  (2026-07-03) + `partnership-url-prefill` (2026-07-03). The pasted-text half
  (make/model/year/price/hours/airport/share terms → nearly every field) was already live
  on all 3 forms; `aircraft-url-prefill` added the "OR a source URL" half on the
  aircraft-for-sale form, and `partnership-url-prefill` mirrored it onto the partnership
  form — paste a link to an existing listing (Barnstormers/Controller/TradeAPlane, or
  another partnership listing) and the server fetches + reads it through the same
  extraction prompt. SSRF-guarded (`src/lib/urlFetchGuard.ts`), shares the existing 10/hr
  AI-draft rate limit on both forms. **Not done, intentionally:** the seeker form has no
  URL-paste path — seeking listings have no external source listing to link to.
- **[P1][goal] Collapse the post flow to one smart screen.** Reduce required fields to the
  irreducible set (make/model · airport ICAO · price-or-share · contact); push everything
  else to optional/progressive disclosure. ICAO already auto-derives airport/city/state —
  lean on that. Measure clicks-to-publish before vs after. **Status check (2026-07-03):**
  already effectively true today — aircraft form requires only make/model, partnership
  requires make/model/home_airport/share_type, seeker requires only home_airport; everything
  else is optional/progressive disclosure. Confirm with the human whether this needs a
  dedicated "measure clicks-to-publish" pass or can be marked done.
~~- **[P1][goal] Autosave the draft (localStorage) + restore.**~~ ✅ SHIPPED via `draft-start-over` (2026-06-28) A half-filled form must
  survive a reload or the auth redirect — never lose someone's typing. Pairs with Pillar 2's
  deferred gate (post first, sign in to publish, draft intact).
~~- **[P2][goal] Photo upload polish.**~~ ✅ SHIPPED via `aircraft-photo-upload` (2026-06-26) Drag-drop + paste + multi-file on the post forms
  (upload routes `/api/upload-aircraft-photo`, `/api/upload-partnership-photo` exist). Make
  adding photos a non-event.
~~- **[agent][goal] Draft-resume banner.**~~ ✅ SHIPPED via `draft-resume-banner` (2026-07-03)
  A visitor who autosaves a post draft (any of the 3 forms) and navigates away had no way
  back except remembering the exact URL. A small dismissible site-wide banner now detects
  an in-progress draft via the existing `useFormDraft` localStorage keys and links straight
  back to it; self-suppresses on the draft's own post page. Pure client-side read, no schema.
  **Edit-mode parity ✅ SHIPPED 2026-07-04** (`draft-resume-banner-edit-mode`): the banner only
  ever recognized the "new post" autosave keys; now also detects the edit-mode keys
  (`ch:draft:{type}-edit:{id}`) the 3 edit forms already write, with "Unsaved changes" copy
  and the correct per-listing edit href — new-post drafts still win if both exist. This item
  is now fully complete across new-post and edit-mode drafts.
~~- **[agent][goal] Unified `/post` chooser page.**~~ ✅ SHIPPED via `post-chooser-page`
  (2026-07-03) The nav's "Post a Listing"/"Post" CTA used to hardlink straight to
  `/partnerships/new`, so anyone wanting to sell an aircraft or post a seeker listing
  landed on the wrong form first and only found the other options via the tab-switcher
  *inside* that form. New `/post` page presents all 3 flows up front (Sell an aircraft /
  Post a partnership / Seeking a partnership); both nav CTAs now point there.
~~- **[agent][goal] Edit flow for published listings.**~~ ✅ SHIPPED (all 3 types: aircraft,
  partnerships, seeker) via `aircraft-listing-edit`, `partnership-listing-edit`, and
  `seeker-listing-edit` (all 2026-07-03). Posting used to be a one-way door — no
  `update*Listing` action existed for any of the 3 post types. Added
  `updateAircraftListing`/`updatePartnershipListing`/`updateSeekerListing` (ownership-scoped
  like `deactivateListing`), edit mode on all 3 post forms, and
  `/aircraft/listing/[id]/edit`/`/partnerships/[id]/edit`/`/partnerships/seeking/[id]/edit`,
  all linked from an "Edit" affordance on `/listings`. **Correction (found 2026-07-03 during
  `contact-phone-prefill` research):** the seeker slice had already shipped (`seeker-listing-edit`,
  merged before `partnership-card-freshness`) — this note was stale, listing it as still open.
  Edit-flow parity across all three post types is complete; no further slice needed.
~~- **[agent][goal] AI draft: extract share-type + intended-use on the seeker form.**~~ ✅
  SHIPPED via `seeker-ai-draft-share-use` (2026-07-03) "Prefill from your notes ✨" on the
  seeker form already extracted 14 fields but silently skipped `preferred_share_types` and
  `intended_use` — a parity gap vs. the partnership form's AI-extracted `share_type`. Now the
  AI extracts both and auto-checks the matching chips, so a note like "1/3 share for weekend
  trips" no longer needs manual checkbox taps after prefilling everything else.
~~- **[agent][goal] AI draft: extract min_hours + ratings_required on the partnership form.**~~
  ✅ SHIPPED via `partnership-ai-draft-partner-reqs` (2026-07-04) "Prefill from your notes ✨"
  on the partnership form extracted every aircraft/cost spec but silently skipped the "Partner
  requirements" fields (`min_hours`, `ratings_required`) — a parity gap vs. the seeker form's
  already-extracted `hours_per_month`/`ratings_held`. Now the AI extracts both, auto-filling
  the Minimum Hours input and checking the matching Ratings Required chips. **Gap closed
  2026-07-04** (`partnership-ai-draft-scheduling-system`): the third field in that same
  section, `scheduling_system`, was missed by the fix above — now extracted too, so a pasted
  note fills all three Partner-requirements fields. This item is now fully complete.
~~- **[agent][goal] "Use my location" autofill on the home-airport field.**~~ ✅ SHIPPED via
  `airport-geolocation-autofill` (2026-07-04) Every remaining Pillar 1 backlog line was
  already shipped, so this cycle invented the next slice: a 📍 button on the shared
  `AirportFormInput` (home airport on all 3 post forms) that geolocates the browser and
  autofills the nearest airport's ICAO code via a lat/lng bounding-box + haversine lookup
  against the existing `airports` table — no schema change, graceful fallback on denied
  permission. Removes the "look up my airport's code" step entirely.
~~- **[agent][goal] Description-writing help on the aircraft post form.**~~ ✅ SHIPPED via
  `aircraft-description-help` (2026-07-04) `/partnerships/seeking/new` already had a
  collapsible "How to write a great description" tips box + two example descriptions, but
  `/aircraft/new` (and by extension its edit form) only had a single line of guidance above
  a bare textarea — despite that page's own copy calling the description "the single biggest
  factor in getting a serious inquiry." Ported the identical tips-box/examples pattern,
  aircraft-flavored copy (specs/condition/why-selling/standout-feature tips; a well-equipped
  and a budget trainer example). Purely additive presentational UI, no schema/actions change.
  **Description-writing help parity ✅ SHIPPED 2026-07-04** (`partnership-description-help`):
  ported the identical tips-box/examples pattern onto `PostPartnershipForm.tsx`, the one
  remaining post form without it — partnership-flavored tips + two examples ("established
  group with an opening" / "new partnership forming"). This feature is now complete across
  all 3 post forms (aircraft, partnership, seeker).
~~- **[agent][goal] Autosave status parity on the aircraft post form.**~~ ✅ SHIPPED via
  `aircraft-draft-indicator` (2026-07-04) `/aircraft/new` (built later than the other two
  forms) never got the shared `DraftIndicator` component — it showed a static, non-`aria-live`
  "Draft saved" label that never announced "Saving…" mid-debounce or distinguished a restored
  draft from a freshly-saved one, unlike the partnership and seeker forms. Ported the identical
  `DraftIndicator` (Saving…/Draft saved/Draft restored, `aria-live="polite"`). Purely additive
  presentational fix, no schema/actions change. Autosave-status parity is now complete across
  all 3 post forms. **Runner-ups not pursued:** N-number helper text on the aircraft form omits
  the word "Optional" the partnership form's has (cosmetic); photo-upload `endpoint` prop
  explicit-vs-default between forms (looked intentional, not a bug).
~~- **[agent][goal] Surface the description field on the seeker post form.**~~ ✅ SHIPPED via
  `seeker-description-surface` (2026-07-04) The seeker form's Description field (tips box +
  textarea, content already shipped) stayed nested inside the collapsed "More details"
  `<details>`, unlike the aircraft and partnership forms which surface description in its own
  always-visible section — a seeker who never expands "More details" never saw that a
  description field existed. Moved it into its own "About you" section matching the other two
  forms' layout exactly; no schema/actions change. Description-field visibility is now
  consistent across all 3 post forms.
~~- **[agent][goal] Edit actions never lazy-saved contact name/phone to `user_metadata`.**~~
  ✅ SHIPPED via `edit-contact-lazy-save-parity` (2026-07-04) All 3 create actions save a
  first-time `contact_name`/`contact_phone` into `user_metadata` so the next post form
  pre-fills it; the 3 update actions wrote those fields to the listing row but never ran
  the equivalent lazy-save — a poster who first added their phone while *editing* an
  existing listing never got it remembered for their next new post. Copied the identical
  lazy-save blocks into `updatePartnershipListing`/`updateSeekerListing`/`updateAircraftListing`.
  No schema/UI change. Pillar 1 candidates remaining need a human call (see Next in CHANGELOG).
~~- **[agent][goal] Numeric mobile keypad on all 3 post forms.**~~ ✅ SHIPPED via
  `post-form-numeric-keypad` (2026-07-05) All 20 `type="number"` fields across the aircraft/
  partnership/seeker post forms (price, year, TTAF/SMOH, rates, shares, hours) had no
  `inputMode`, an unreliable-on-iOS-Safari mobile-keypad signal — a poster on a phone at the
  hangar could get the full keyboard instead of a numeric pad. Each form's shared local `Input`
  wrapper now defaults `inputMode="numeric"` whenever `type="number"` (override-able), fixing
  all 20 fields via one 3-line change per file. No schema/visual change. **Next:** the aircraft
  edit form's Home Airport field still can't prefill a `defaultValue` (schema only stores
  derived `location`/`state`, not raw ICAO) — needs a human call on adding the column.
~~- **[agent][goal] Submission-error accessibility on all 3 post forms.**~~ ✅ SHIPPED via
  `post-form-error-alert-role` (2026-07-05) The red error box shown on a failed submission
  (bad airport code, Supabase insert error, etc.) had no `role`/`aria-live`, unlike the same
  files' `DraftIndicator` which already announces "Draft saved" via `aria-live="polite"` — a
  screen-reader user posting a listing got no accessible signal that submission failed or why.
  Added `role="alert"` to the identical error div in all 3 forms.
~~- **[agent][goal] `autoComplete` hints on post-form contact fields.**~~ ✅ SHIPPED via
  `post-form-autocomplete-hints` (2026-07-05) None of the 7 contact fields (`contact_name`/
  `contact_email` on partnership + seeker forms; `contact_phone` on all 3, incl. aircraft which
  has no name/email field) had `autoComplete` set, so phone/browser saved-profile autofill was
  unreliable. Added `autoComplete="name"|"email"|"tel"` to each — pure attribute addition, no
  schema/logic change, applies to both create and edit (shared form components). Pillar 1's
  explicit checklist is now fully exhausted outside two human-blocked items (aircraft edit
  form's Home Airport schema gap; "collapse to one smart screen" status-check).
~~- **[agent][goal] Inline validation for a typo'd/nonexistent airport ICAO code.**~~ ✅
  SHIPPED via `airport-icao-inline-validation` (2026-07-05) `AirportFormInput` (shared by all
  3 post/edit forms) suppressed its autocomplete lookup entirely once a typed value matched
  the complete 4-char ICAO shape, so a mistyped code (e.g. `KUAS` instead of `KAUS`) gave no
  feedback until the poster filled the entire rest of the form and got bounced by the
  server-side check on submit. Now that branch runs a debounced exact-match lookup and flips
  the existing invalid-state UI (red border + message) if the code doesn't exist — no new
  UI, no schema change. Invented this cycle since Pillar 1's explicit checklist had nothing
  left except the two human-blocked items noted above. **Start Over/Revert parity ✅ SHIPPED
  2026-07-05** (`airport-input-start-over-reset`): the invalid-state UI this feature added
  was never cleared by any of the 3 forms' Start Over/Revert flow (`reset()`'s native
  `form.reset()` doesn't fire the `onChange` this component relies on) — a poster fixing a
  typo via Start Over saw a cleared field still showing the stale red error. Fixed with the
  same `photoMountKey`-style remount pattern already used for the photo uploader. This item
  is now fully complete.
~~- **[agent][goal] Reorder uploaded photos / pick the cover photo.**~~ ✅ SHIPPED via
  `photo-reorder-cover` (2026-07-05) `PartnershipPhotoUpload` (shared by aircraft +
  partnership post/edit forms) only ever appended new photos to the end — since the first
  photo is the listing's cover/thumbnail everywhere on the site (`pickRealPhoto`), a poster
  who uploaded their best shot last had to delete everything and re-upload in order. Added
  move-earlier/move-later buttons per thumbnail (2+ photos) and a "Cover" badge on the first
  photo. Pure array reorder, no schema/action change. Invented this cycle since Pillar 1's
  explicit checklist had nothing left except the two human-blocked items noted above.
~~- **[agent][goal] Seeker AI-prefill mishandled a pasted URL.**~~ ✅ SHIPPED via
  `seeker-ai-draft-url-guard` (2026-07-05) The aircraft/partnership forms' AI-prefill boxes
  detect a bare pasted URL and route it through a dedicated fetch-and-read path; the seeker
  form had no such branch and shipped the raw link straight to Claude as if it were the
  pilot's own notes, risking a backwards/misleading draft (e.g. extracting a for-sale
  listing's make/model as the pilot's own preference). Since a seeker post has no analogous
  external source page to fetch, `handleGenerate` now detects the bare-URL case and shows an
  explanatory message instead of calling the AI. No schema/action change. Invented this cycle
  (via an Explore-agent code audit, not the changelog) since Pillar 1's explicit checklist was
  already exhausted outside the two human-blocked items noted above.
~~- **[agent][goal] Publishing while a photo is still uploading silently dropped it.**~~ ✅
  SHIPPED via `photo-upload-block-submit` (2026-07-05) `PartnershipPhotoUpload` (shared by
  the aircraft + partnership post/edit forms) only attaches a photo's hidden `photo_url`
  input once its upload resolves, but neither form tracked the uploader's in-flight state —
  the submit button's only gate was the server action's own `pending` flag. A seller who hit
  publish before an in-flight upload (~1-3s, longer on mobile) finished got a listing
  published with that photo silently missing, no error shown. New `onUploadingChange` prop
  on the shared uploader reports the live mid-upload count; both forms now disable submit
  and show "Uploading photos…" until every photo resolves. No schema/action change. Invented
  this cycle (via an Explore-agent code audit) since Pillar 1's explicit checklist was already
  exhausted outside the two human-blocked items noted above.
~~- **[agent][bug] Seeker edit page 404'd for every owner.**~~ ✅ SHIPPED via
  `seeker-edit-additional-airports-fallback` (2026-07-05) `/partnerships/seeking/[id]/edit`
  explicitly named the not-yet-migrated `additional_airports` column in its select with no
  fallback — unlike the aircraft and partnership edit pages, which both already handle a
  not-yet-applied optional column via select-then-retry. On today's unmigrated DB this meant
  the query errored, `listing` came back null, and the owner hit `notFound()` trying to edit
  their own published seeker listing. Added the same select-without-the-column fallback;
  confirmed the bug and the fix directly against the live DB. Invented this cycle (via an
  Explore-agent code audit) since Pillar 1's explicit checklist was already exhausted outside
  the two human-blocked items noted above.
~~- **[agent][goal] Airport autocomplete input had zero ARIA combobox wiring.**~~ ✅ SHIPPED
  via `airport-input-combobox-aria` (2026-07-05) `AirportFormInput` (shared "Home Airport"/
  "Based at" field on all 3 post/edit forms) had a fully working visual+keyboard suggestion
  dropdown but the `<input>` carried none of `role="combobox"`/`aria-expanded`/`aria-controls`/
  `aria-activedescendant` — confirmed via grep, a total absence, not a partial gap — so a
  screen-reader user got no signal a suggestion list had opened on a field required on 2 of 3
  forms. Added the missing ARIA attributes (stable `useId()`-derived listbox id, matching
  option ids); existing keyboard/mouse selection behavior untouched. Invented this cycle (via
  an Explore-agent audit) since Pillar 1's explicit checklist was already exhausted outside
  the two human-blocked items noted above. **Next:** `AirportAutocompleteInput.tsx` (a
  separate component used outside the post forms) may have the same gap — unaudited, out of
  scope this cycle.
~~- **[agent][goal] "More details" auto-open check missed the contact field on 2 of 3 forms.**~~
  ✅ SHIPPED via `post-form-details-contact-autoopen` (2026-07-05) All 3 post/edit forms
  auto-expand their collapsed "More details" section in edit mode when it already holds data,
  so a returning editor's existing info isn't hidden — but the seeker form's check included
  `contact_phone` while the aircraft and partnership forms' equivalent checks didn't (partnership
  also omitted `contact_name`/`contact_email`, all 3 of which live inside its collapsed section).
  A seller whose only saved data was a contact field (e.g. added a phone number while editing,
  with no other optional specs filled in) got a collapsed section hiding it with no visual cue.
  Added the missing fields to both OR-chains, mirroring the seeker form's already-correct check.
  Found via a second, more targeted Explore-agent audit after a first audit surfaced the
  `PostSeekerListingForm.tsx` live-auth-state gap (correctly identified as Pillar 2, not Pillar 1
  — that slice remains open, see Pillar 2 below). No schema/action change — pure boolean-condition
  fix, verified visually via a temporary mock-data preview route (deleted before merge).

### Pillar 2 — Frictionless signup / auth
Target: never gate value behind an account; when we must ask, one tap or one field.
~~- **[P1][goal] "Continue with Google" (OAuth).**~~ ✅ ALREADY SHIPPED (human, pre-pivot,
  2026-06-12, `50f3a7a`) — **correction 2026-07-04** (`partnership-comp-family-scope` audit):
  this line was stale for weeks; several recent CHANGELOG entries wrongly described Pillar 2
  as "structurally blocked," implying the feature was missing. In reality `/auth` (`src/app/auth/page.tsx`)
  has shipped both "Continue with Google" and magic-link email sign-in since before the
  pivot. What IS true: `FREEZE.md` blocks the loop from *editing* `src/app/auth/**` further —
  the feature itself is done, only further changes to it are off-limits to this loop.
~~- **[P1][goal] Defer the gate to the value moment.**~~ ✅ SHIPPED via `defer-partnership-search-gate` (2026-06-27) Audit every forced-signup point (home
  search gate, save, post, message) and move the ask to the moment of value: let people
  browse, filter, and build a draft first; sign in only to *save/publish/message*. Device-
  saves already merge on signup (`mergeDeviceSaves`) — extend that pattern so nothing is lost.
~~- **[P2][goal] Shorten the signup form to email-only.**~~ ✅ ALREADY SHIPPED (human,
  pre-pivot) — **correction 2026-07-04**: `/auth` only ever asks for an email address
  (magic-link) or a single Google OAuth tap; there is no separate name/profile collection
  step on signup to remove. Pillar 2's two explicit BACKLOG items are both done.
~~- **[agent][goal] Photo upload silently 401s when logged out.**~~ ✅ SHIPPED via
  `photo-upload-signin-redirect` (2026-07-04) `PartnershipPhotoUpload` (shared by both post
  forms) had no auth awareness — dropping/pasting/browsing a photo while logged out hit the
  upload API directly and 401'd, showing a cryptic per-thumbnail "Not authenticated" badge
  with no path forward, unlike the forms' own submit button which already defers to
  `/auth?next=...` with the draft intact. Now the uploader takes the same `isLoggedIn`/
  `onRequireAuth` treatment: the drop-zone proactively says "Sign in to add photos" and
  routes straight to the save-draft-and-redirect flow. Not in a frozen path (auth files
  untouched). **IndexedDB recovery ✅ SHIPPED 2026-07-05** (`photo-mid-upload-recovery`):
  new `src/lib/idbPhotoDraft.ts` persists a photo's raw file to IndexedDB the instant its
  upload starts and clears it once the upload settles; `PartnershipPhotoUpload` resumes any
  leftover file automatically on mount. Note: the addressed race is narrower than originally
  framed — a logged-out `addFiles()` never touches the file at all (nothing to lose there);
  the real gap was a reload/navigation during the ~1-3s an already-logged-in upload is in
  flight. This item is now fully complete.
~~- **[agent][goal] Save/heart missing entirely on seeker listings.**~~ ✅ SHIPPED via
  `seeker-save-heart` (2026-07-04) `saved_listings`/`SaveListingButton`/the guest-device-save
  system hard-coded exactly `'partnership' | 'aircraft'` — seeker listings had no heart
  button at all (not gated, just absent), so the "defer signup to the value moment" pattern
  the other two listing types get was missing for 1 of 3. Now seeker cards + the seeker detail
  page have the same heart (device soft-save for guests, account save when logged in), and
  `/saved` shows a "Saved seeker listings" section both logged-in and logged-out. No migration
  needed (`listing_type` is a plain `text` column). **Next:** small copy-only follow-on — the
  `/saved`/`DeviceSavedListings` empty-state hint text still only mentions partnerships/aircraft.
  **✅ Closed 2026-07-04** (`saved-empty-state-seeker-mention`) — see below.
~~- **[agent][goal] AI "Prefill from your notes" silently 401s when logged out.**~~ ✅
  SHIPPED via `ai-draft-signin-redirect` (2026-07-04) Same bug class as the photo-upload fix
  above, on the single most prominent CTA on every post form: `handleGenerate` on all 3 post
  forms called the AI-draft server action with no login check, which threw a bare "Not
  authenticated." shown as raw red text — no path forward. Now checks `isLoggedIn` first and
  redirects to `/auth?next=...` (draft + pasted notes intact — the AI-notes textarea now has
  a `name` so it's captured by the existing autosave/restore mechanism). Not in a frozen path.
~~- **[agent][goal] Edit pages don't prefill saved contact info.**~~ ✅ SHIPPED via
  `edit-page-contact-prefill-parity` (2026-07-04) The `new` pages for all 3 listing types pass
  the poster's saved `userEmail`/`userName`/`userPhone` (from `user_metadata`) into their post
  form so a returning poster's contact info auto-fills; the 3 edit pages never threaded these
  props through at all (partnership edit: missing all 3; seeker edit: missing phone; aircraft
  edit: missing its one applicable prop), so a poster editing an older listing that itself had
  no saved contact value saw a blank field instead of the expected prefill. Now all 3 edit
  pages pass the same props their `new` counterparts do.
~~- **[agent][goal] SeekerContactBar's privacy copy doesn't match its actual gating.**~~ ✅
  SHIPPED via `seeker-contactbar-privacy-copy-fix` (2026-07-04) The logged-out copy claimed
  "contact details are only shown to signed-in members," but `showEmail`/`showPhone` never
  checked login state — the reveal was always shown, exactly like the sibling aircraft/
  partnership `ContactBar` (which makes no such claim). Copy now matches actual behavior.
  **Next:** the `/saved`/`DeviceSavedListings` empty-state copy still omits "seeker listings"
  (small copy-only follow-on, flagged since `seeker-save-heart`).
~~- **[agent][goal] `/saved` empty-state + footer copy omits seeker listings.**~~ ✅ SHIPPED
  via `saved-empty-state-seeker-mention` (2026-07-04) Closes the copy gap flagged above and in
  `seeker-save-heart` — the empty state, "Looking for more?" footer (both logged-in and
  logged-out/device-save views), and the logged-in header subcopy on `/saved` only ever
  mentioned partnerships and aircraft for sale, even though seeker listings have had full
  save/heart support since `seeker-save-heart`. Added a third link to `/partnerships/seeking`
  in all four spots. Pure copy/link change, no schema/logic change.
~~- **[agent][goal] `/partnerships` hub missing the filter-aware guest alert signup.**~~ ✅
  SHIPPED via `partnerships-hub-alert-signup` (2026-07-05) `/aircraft`, `/partnerships/seeking`,
  and all three partnership sub-family pages (near/[icao], make/[make], state/[state]) already
  had a one-email-field, no-account `AlertSignup` box that carries the active filter into the
  alert; the flagship `/partnerships` hub only showed the geo-IP `PartnershipLaunchBanner`,
  which ignores active filters entirely. Added the same filter-aware `alertContext`/
  `alertSourcePath` (make/state/airport, matching `alert-digest`'s existing `parseSourcePath`)
  and rendered `<AlertSignup>` after the listings, mirroring `/aircraft`'s placement. No schema
  change. **Next (flagged, not fixed this cycle):** (1) `PartnershipLaunchBanner`'s visitor-count
  copy is fabricated/deterministic, shown unconditionally — a copy-honesty smell, separate scope.
  (2) ~~`SeekerContactBar` renders a broken empty box when a seeker-listing owner views their own
  listing~~ ✅ SHIPPED via `seeker-contactbar-owner-view` (2026-07-05) — added the same explicit
  owner-view early return `AircraftContactButton` already had, showing a neutral "This is your
  listing" note instead of an empty card. **Closed 2026-07-05** (`partnership-contactbar-owner-view`):
  `ContactBar.tsx`/`ContactButtons.tsx` (the partnership contact bar/box on `/partnerships/[id]`)
  now have the same owner-view early return — the last of the 3 listing types to get it.
~~- **[agent][goal] `PartnershipLaunchBanner`'s "visitor count" was fabricated.**~~ ✅ SHIPPED
  via `launch-banner-honest-stats` (2026-07-05) The banner (shown on 5 partnership pages)
  claimed "{N}+ pilot visitors this month" from `VISITOR_BASE + charCodeAt(0)*7` — a number
  with zero backing data — and padded the real seeker count up to a floor of 12 if it was
  smaller, plus falsely claimed that sitewide count was "in this location." Deleted the
  fabricated visitor stat entirely, removed the artificial floor so the real `seekerCount`
  renders as-is (correct singular/plural, omits the clause at 0), and dropped the false
  location-scoping claim. Single-file change, no schema/query/prop-signature change.
~~- **[agent][goal] Homepage "Sign in" doesn't preserve `next=/`.**~~ ✅ SHIPPED via
  `nav-signin-homepage-next` (2026-07-05) `Nav.tsx` special-cased the homepage by omitting
  `next=` entirely — but `/auth`'s own fallback for a missing `next` is `/searches`, not `/`,
  so a plain "Sign in" click from home dropped the user on Saved Searches after auth instead
  of back home. Every other page already passed its own path; this was the one intent-drop
  case, found via an Explore-agent audit of every `/auth?next=...` call site (all others
  confirmed correct). Fixed in `Nav.tsx` only — `src/app/auth/**` untouched. **Pillar 2 now
  looks structurally complete** across every auth-gated CTA in the app (save, save-search,
  message, photo-upload, AI-draft, post/edit forms, generic sign-in) — a future cycle
  reaching for this pillar may want a human check-in before inventing further slices.
~~- **[agent][goal] Aircraft edit form's auth redirect always pointed at `/aircraft/new`.**~~
  ✅ SHIPPED via `aircraft-edit-redirect-fix` (2026-07-05) `PostAircraftForm.tsx`'s
  `redirectToAuth()` hardcoded `next=/aircraft/new` regardless of `isEdit` — the partnership
  and seeker edit forms already branched correctly, but the aircraft one didn't, so a
  logged-out/session-expired user editing an existing aircraft listing (via the AI-draft or
  photo-upload auth gate, or the submit-time gate) was bounced to a blank new-post form
  instead of back to their edit page, losing their intent. One-line fix, mirroring the two
  sibling forms exactly.
~~- **[agent][goal] `isLoggedIn` is a static SSR-derived prop with no client-side auth-state
  listener — slice 1 (`PostAircraftForm.tsx`).**~~ ✅ SHIPPED via
  `aircraft-form-live-auth-state` (2026-07-05) A session that expired mid-edit left the AI-
  draft/photo-upload/submit auth gates silently stale (never firing their redirect), surfacing
  a raw 401 instead. `PostAircraftForm.tsx` now tracks `isLoggedIn` as live client state,
  seeded from the SSR prop and kept current via `supabase.auth.getUser()` +
  `onAuthStateChange` — the exact pattern `Nav.tsx` already uses. **Slice 2 ✅ SHIPPED
  2026-07-05** (`partnership-form-live-auth-state`): identical treatment on
  `PostPartnershipForm.tsx`. **Slice 3 ✅ SHIPPED 2026-07-05** (`seeker-form-live-auth-state`):
  identical treatment on `PostSeekerListingForm.tsx` — this closes the live-auth-state gap
  across all 3 post forms. **Still open (verification gap, all 3 slices):** the real
  mid-session-expiry repro (sign out in another tab while the form is open) has never been
  driven live in this sandbox (no seeded auth session available to invalidate) — every PASS
  leans on code parity with `Nav.tsx`'s proven pattern, not a live repro.
- **[HUMAN-BLOCKED][goal] Auth callback drops `next` on error; `/auth` missing contextual
  copy for 2 redirect paths.** Found 2026-07-05 (`airport-hub-comp-verdicts` cycle's Pillar 2
  audit, not fixed — both fixes require editing frozen `src/app/auth/**`). (1)
  `src/app/auth/callback/route.ts`'s error branch redirects to `/auth?error=auth_failed` with
  no `next=`, so a user mid-contact/mid-post whose magic-link/OAuth exchange fails (expired
  link, stale code) loses their intended-return path on retry. (2) `src/app/auth/page.tsx`'s
  `deriveAuthContext` has no branch for `/partnerships/seeking/*` contact (`SeekerContactBar`)
  or `/members/{id}` message (`MessageOwnerButton`) — both land on generic "Sign in to
  ClubHanger" copy instead of "Sign in to contact the owner" (functionally fine, the redirect
  itself works — copy-only gap). Same class as Pillar 1's two human-blocked items — needs a
  human call on authorizing a scoped edit to frozen auth files.

### Pillar 3 — Proprietary buyer analysis on listing pages
Target: every aircraft listing answers "is this a good buy, and what will it really cost me?"
with honest, data-grounded analysis the big sites don't offer. Honesty-gated: when an input
is missing, say "not enough data" — NEVER fabricate (a confident-wrong number is a LOSS).
Build on: extracted specs (`ttaf`/`smoh`/`engine_type`/`avionics`/`annual_due`/`damage_history`),
the ClubHanger Estimate (`src/lib/aircraftComps.ts`), the cost calculator (`src/lib/calculators.ts`),
price history (`previous_price`/`price_changed_at`), comps (`getFamilyComps`).
~~- **[P1][goal] Engine life & overhaul reserve.**~~ ✅ SHIPPED via `partnership-engine-life` (2026-06-28) From `smoh` + `engine_type` → a curated
  TBO table (per engine family) → "≈ X hrs / ~Y yrs to overhaul; budget ~$Z reserve."
  Render only when smoh + engine are known. Proprietary because it fuses our extracted specs
  with a TBO/reserve model no listing site shows. **Browse-card parity ✅ SHIPPED 2026-07-04**
  (`partnership-card-engine-chip`): `PartnershipCard` (the main `/partnerships` browse card)
  now shows the same "~N hrs to TBO" chip `AircraftSaleCard` already had — previously this
  signal only existed on the detail page's `EngineLifePanel`. Dormant in the sandbox DB
  pending the still-unapplied `partnership_add_spec_fields` migration (same as the annual/
  damage panels). **Rail-card parity ✅ SHIPPED 2026-07-04** (`partnership-rail-card-engine-chip`):
  `PartnershipRailCard` (Similar-partnerships rail + aircraft⇄partnership cross-sell rail)
  now shows the same chip too — previously only `AircraftRailCard` had it (a gap left over
  from `engine-time-rail-chips`, 2026-06-27). This item is now fully complete across detail
  panel, browse card, and rail card, both listing types.
~~- **[P1][goal] Cost-to-own, on the listing.**~~ ✅ SHIPPED via `partner-share-cost-panel` (2026-06-29) Bring the cost calculator onto the detail
  page, prefilled with the listing's real make/model/price/hours → annual fixed + per-hour +
  reserve, with a share-split toggle ("as a 1/3 partner: ~$X each + ~$Y/mo"). Turns a static
  price into a real ownership cost. Aircraft detail got `cost-per-flight-hour` (ShareCostPanel) earlier; partnerships now have the equivalent `PartnerShareCostPanel` with 50/75/100/150 hrs/yr tabs + buy-in break-even vs. renting. **Parity gap closed 2026-07-03** (`aircraft-share-cost-hours-toggle`): the aircraft-side `ShareCostPanel` now also has the 50/75/100/150 hrs/yr toggle (previously hardcoded to 100), so both panels are at full feature parity. This item is now fully complete.
~~- **[P1][goal] Deal Score panel.**~~ ✅ SHIPPED via `deal-score-signal-tally` (2026-06-28) Synthesize the signals we already have into one honest
  verdict: comp value (ClubHanger Estimate) + days-on-market + price drops + spec completeness
  → a transparent "how this stacks up" with the *reasons* shown (not a black-box score).
  Reuse the Estimate's min-comps / dead-band honesty floors.
~~- **[agent][goal] Partnership Deal Check (year/hours-narrowed value verdict).**~~ ✅
  SHIPPED via `partnership-deal-check` (2026-07-04) Aircraft-for-sale listings had both a
  whole-family descriptive estimate AND a narrower year+hours "Good deal/Fair/Priced high"
  Deal Check (`clubHangerDealVerdict`); partnerships only ever got the whole-family version
  (`partnershipBuyInComp`). New `partnershipDealVerdict()` mirrors the same year(±5yr)/
  hours-band narrowing, additionally normalized for share size (implied full-aircraft value),
  rendered as a "Deal check" sub-block inside `PartnershipMarketCheck` on `/partnerships/[id]`.
  **Dormant on today's seed data** — needs both the still-unapplied `partnership_add_spec_fields`
  migration (ttaf/smoh) AND enough same-family comps to clear the 4-comp floor (neither exists
  yet in the sandbox DB); verified correct via a standalone pure-function test + a temporary
  mock-data screenshot pass instead. **Browse/rail-card parity ✅ SHIPPED 2026-07-04**
  (`partnership-deal-check-card-parity`): `PartnershipCard`/`PartnershipRailCard` now prefer
  this narrowed verdict over the plain whole-family pill on `/partnerships`, `/saved`,
  `/partnerships/near/[icao]`, and the detail page's "Similar partnerships" rail — full parity
  with the aircraft-for-sale side. Still dormant on today's data for the same reason as above.
~~- **[P2][goal] Market position + days-on-market.**~~ ✅ SHIPPED (confirmed complete
  2026-07-03) "N comparable {make} {model} listed, median $X — this is P% below/above;
  listed N days ago" is live across every buyer surface: aircraft browse cards (CompPill:
  %/median/count), aircraft detail (inline price-card hint + EstimatePanel + DealScorePanel
  days-on-market row), partnership browse (comp pill), partnership detail (inline buy-in
  hint + `PartnershipMarketCheck` + `PartnershipDealSignals` "Listed N days ago" row, built
  on `created_at` since user-submitted partnerships have no `first_seen_at`). No further
  slice needed for this item.
~~- **[agent][goal] Price-drop badge on the partnership browse card.**~~ ✅ SHIPPED via
  `partnership-card-price-drop` (2026-07-04) `previous_buy_in_price`/`buy_in_price_changed_at`
  (self-serve price-edit history) already rendered as a "Buy-in reduced" row on the partnership
  *detail* page (`PartnershipDealSignals`), but `PartnershipCard` — the primary browse/list
  card — had no equivalent, unlike `AircraftSaleCard` which has shown a "Price drop $X" badge
  + strikethrough previous price for a while. Now mirrored onto `PartnershipCard`; no schema
  change, no new query. **Follow-on ✅ SHIPPED 2026-07-05** (`seeker-detail-relative-freshness`):
  the seeker detail page (`/partnerships/seeking/[id]`) showed an absolute "Posted {date}"
  while its own `SeekerCard` already showed relative "Listed N days ago" — now uses the
  identical relative label. **Next:** the partnership detail page (`/partnerships/[id]`) has a
  milder version of the same split (absolute "Posted {date}" in the header, separate relative
  "Listed N days ago" lower in the market-check sidebar) — left alone, needs a human call on
  whether to unify since that page has an existing sidebar panel to reconcile with.
~~- **[agent][goal] Budget check on seeker listings.**~~ ✅ SHIPPED via `seeker-budget-check`
  (2026-07-03) Seeker listings (`/partnerships/seeking/[id]`) had zero Pillar 3 analysis —
  aircraft-for-sale and partnership listings both compare price/buy-in to the market, but a
  seeker's stated budget got no equivalent read. New `getSeekerBudgetCheck()` reuses the
  existing `partnershipBuyInComp` share-normalized comp math (same honesty floors as
  `PartnershipMarketCheck`) to tell a seeker whether their max buy-in is realistic for the
  one make + one fractional share size they specified. Self-suppresses on ambiguous
  preferences or <4 same-make comps — doesn't yet render on today's low-volume seed data
  (same as `PartnershipMarketCheck` today), but is correct and will light up as inventory grows.
  **Card badge shipped 2026-07-03** (`seeker-budget-check-badge`): `SeekerCard`/`SeekerList`
  now show the same below/above-market chip via a new batched `getSeekerBudgetCheckVerdicts()`
  (one query per unique preferred make, not per card). This item is now fully complete.
~~- **[agent][goal] Trust/completeness badge on seeker listings.**~~ ✅ SHIPPED via
  `seeker-trust-badge` (2026-07-05) Aircraft-for-sale and partnership listings both had an
  honest "N/4 trust signals" chip; seeker listings had none — the last listing type with zero
  Pillar 3 trust coverage. New `seekerTrust.ts` scores aircraft-preference-stated,
  budget-disclosed, experience-disclosed (hours + ratings), and member-posted, rendered via
  `SeekerTrustBadge` on every `SeekerCard`. **Detail-page checklist ✅ SHIPPED 2026-07-05**
  (`seeker-trust-checklist-detail`): `SeekerTrustBadge` gained a `variant="checklist"` option
  (identical to `AircraftTrustBadge`/`TrustBadge`'s), rendered on `/partnerships/seeking/[id]`
  above the contact card — same placement convention as the other two listing types. **Owner
  nudge ✅ SHIPPED 2026-07-05** (`seeker-owner-nudge`): new `SeekerListingOwnerNudge.tsx` mirrors
  `ListingOwnerNudge`/`AircraftListingOwnerNudge` exactly, driven by the existing
  `evaluateSeekerTrust()`, rendered only to the listing's owner directly above the trust
  checklist on `/partnerships/seeking/[id]`. **Explainer-page parity ✅ SHIPPED 2026-07-05**
  (`listing-quality-seeker-parity`): `/listing-quality` now documents seeker trust signals in
  a third column alongside partnership/aircraft, and its intro copy no longer implies
  partnership listings carry a quality grade (aircraft-only in the code). This item is now
  fully complete across all 3 listing types: card chip, detail checklist, owner nudge, and the
  explainer page.
~~- **[agent][goal] Annual inspection + damage history panels on partnership listings.**~~
  ✅ SHIPPED via `partnership-annual-damage` (2026-07-04) Aircraft-for-sale listings had
  honesty-gated `AnnualStatusPanel`/`DamageHistoryPanel` (built on `annual_due`/`damage_history`);
  partnerships had neither column, so co-ownership buyers got no equivalent read. Added the
  additive migration (`annual_due date`, `damage_history boolean` — ⚠️ HUMAN ACTION REQUIRED,
  confirmed still unapplied, same as the still-pending `ttaf`/`smoh`/`engine_type` migration),
  two optional fields on the post/edit form, and both panels on `/partnerships/[id]`, reusing
  the exact shared `src/lib/annualStatus.ts`/`src/lib/damageHistory.ts` functions the aircraft
  page already ships. **AI-draft extraction shipped 2026-07-04** (`partnership-ai-draft-annual-damage`):
  the "Prefill from your notes ✨" box now also extracts `annual_due`/`damage_history` from
  pasted text, mirroring the `ttaf`/`smoh`/`engine_type` extraction. **Aircraft form fields
  shipped 2026-07-04** (`aircraft-annual-damage-form`): `/aircraft/new` and
  `/aircraft/listing/[id]/edit` now have the same "Annual due"/"Damage history" fields —
  `aircraft_for_sale` already had the columns natively (no migration needed), so a
  self-posted aircraft listing can now show both panels too. **Aircraft AI-draft extraction
  shipped 2026-07-04** (`aircraft-ai-draft-annual-damage`): the "Prefill from your notes ✨"
  box on `/aircraft/new` now also extracts `annual_due`/`damage_history`, mirroring the
  partnership AI-draft work. This item is now fully complete across both listing types —
  manual fields + AI-draft extraction, aircraft and partnership alike. **Browse-card parity
  ✅ SHIPPED 2026-07-04** (`listing-card-annual-damage-chip`): `AircraftSaleCard` and
  `PartnershipCard` now show an amber "Annual overdue"/"Annual due soon"/"Damage reported"
  chip (only for the actionable states — the common current/clean case stays quiet)
  reusing the same `computeAnnualStatus`/`computeDamageHistory` helpers — previously this
  signal only existed on the two detail pages, unlike engine-life/avionics which already had
  card parity. **Rail-card parity ✅ SHIPPED 2026-07-04** (`rail-card-annual-damage-chip`):
  `AircraftRailCard`/`PartnershipRailCard` (Similar-X rails, homepage rails, cross-sell rail)
  now show the same chip at top-right, priority damage > overdue-annual > due-soon when both
  are actionable — the one surface engine-life/avionics had already reached that this signal
  hadn't. This item is now fully complete: detail panels + AI-draft + browse-card chips +
  rail-card chips, both listing types.
~~- **[agent][goal] Avionics field on the aircraft post/edit form.**~~ ✅ SHIPPED via
  `aircraft-avionics-field` (2026-07-04) The built `AvionicsPanel`/IFR-suitability read
  (`src/lib/avionicsClassify.ts`) only ever rendered for scraped listings — no post/edit form
  or AI-draft path wrote to `aircraft_for_sale.avionics`, so it was structurally invisible for
  every self-posted (organic) listing. Added an optional comma-separated "Avionics & equipment"
  field to `/aircraft/new` and the edit form, wired into `createAircraftListing`/
  `updateAircraftListing`, and AI-draft extraction on "Prefill from your notes ✨" — no schema
  change (native column). **Correction (found 2026-07-04 during `partnership-card-avionics-badge`):**
  the "Next" note above was stale — partnerships already classify avionics from description
  text (no column needed) via `classifyAvionics()` on both the detail page and the
  `PartnershipRailCard`; no migration was ever required. **Gap closed 2026-07-04**
  (`partnership-card-avionics-badge`): the one place that gap was real — the primary
  `PartnershipCard` browse/list card (`/partnerships`, `/saved`, `/airports/[icao]`,
  `/members/[id]`, `/partnerships/near/[icao]`) — now runs the same classification and shows
  the same chips. This item is now fully complete across aircraft and partnership listings.
  **Synthesis-panel row ✅ SHIPPED 2026-07-04** (`partnership-dealsignals-avionics`): the
  "How this partnership stacks up" panel (`PartnershipDealSignals`) now also folds in a
  positive-only avionics/IFR-suitability row (`'full'`/`'capable'` tiers) mirroring the
  aircraft page's `computeDealSignals` row exactly — previously this signal only existed in
  the standalone `AvionicsPanel` and the browse/rail-card chips, not the top synthesis
  panel. This item is now fully complete across detail panels (standalone + synthesis),
  browse-card chips, and rail-card chips, both listing types.
~~- **[agent][goal] Aircraft-for-sale detail page trust checklist.**~~ ✅ SHIPPED via
  `aircraft-trust-checklist-detail` (2026-07-05) The detail page (`/aircraft/listing/[id]`)
  never used the canonical trust-signal system (`evaluateAircraftTrust`, the same 4 signals
  behind the browse card's compact chip and `/listing-quality`'s documentation) — instead it
  showed an unrelated one-off "Listing info" (X/5) panel with a different signal set, so the
  card and detail page could disagree about the same listing's completeness. Replaced it with
  `AircraftTrustBadge`'s new `variant="checklist"`, matching how the partnership detail page
  already shows its trust checklist; deleted the orphaned `ListingCompletenessPanel` (sole
  usage site). **Owner nudge ✅ SHIPPED 2026-07-05** (`aircraft-owner-nudge`): the
  owner-facing "Improve your listing" nudge partnerships already had (`ListingOwnerNudge`)
  is now mirrored on the aircraft-for-sale detail page as `AircraftListingOwnerNudge`,
  driven by the same `evaluateAircraftTrust` signals, gated on `poster_id` ownership, no
  new query/schema. **Correction (found 2026-07-05 during `seeker-cost-panel` audit):** this
  note was stale — seeker listings gained a full trust/completeness module (card chip, detail
  checklist, owner nudge, explainer-page column) via `seeker-trust-badge` and its follow-ons,
  all shipped 2026-07-05. No further slice needed.
~~- **[agent][goal] Flying-cost estimate on the seeker detail page.**~~ ✅ SHIPPED via
  `seeker-cost-panel` (2026-07-05) Aircraft-for-sale and partnership listings both show a
  "what will this cost me per hour" panel (`ShareCostPanel`/`PartnerShareCostPanel`); seeker
  listings collect the identical shape of budget inputs (max buy-in/monthly/hourly, hours/month,
  preferred share type) but never turned them into the same estimate. `PartnerShareCostPanel` is
  now reused as-is on `/partnerships/seeking/[id]`, fed from the seeker's own stated maximums,
  with an added disclaimer line clarifying these are projected from a stated budget, not a
  confirmed cost. Self-suppresses when no monthly/hourly figure is set, same as the source
  component. No schema/component change.
~~- **[agent][goal] Price-range/percentile bar on the partnership market check.**~~ ✅
  SHIPPED via `partnership-market-check-range-bar` (2026-07-05) The aircraft-for-sale
  ClubHanger Estimate has a visual low–high spread bar (median tick + "this listing"
  marker) built up over 3 separate cycles; the partnership-side `PartnershipMarketCheck`
  only ever showed a plain median sentence, despite `partnershipBuyInComp` already
  computing the identical sorted comp array. `PartnerCompResult` now also carries
  `low`/`high`/`percentile` (same comp set, same honesty floor), and the panel renders
  the same bar, falling back to the plain sentence when the comp set has zero spread.
  **Correction 2026-07-05** (`seeker-budget-check-range-bar`): the note below calling the
  seeker panel out-of-scope was wrong — `getSeekerBudgetCheck` calls the identical
  `partnershipBuyInComp` and its result already carries `low`/`high`/`percentile`;
  `SeekerBudgetCheck.tsx` just never rendered them. Now ported (see below); this item is
  fully complete across all 3 comp-based panels (aircraft, partnership, seeker).
~~- **[agent][goal] Partnership Deal Signals panel missing the favor/watch-out tally chips.**~~
  ✅ SHIPPED via `partnership-deal-signals-tally` (2026-07-05) `deal-score-signal-tally`
  (2026-06-28) added an at-a-glance "N in this listing's favor" / "N to ask about" chip
  tally to the aircraft-side `DealScorePanel` — `PartnershipDealSignals.tsx` computes the
  identical row shape (and got every later aircraft-side row addition ported into its own
  `computeSignals()`) but never got the tally-chip UI itself. Now mirrors the aircraft
  panel's chips exactly, same `.filter().length` count over existing rows, no new data.
  Dormant amber-chip path on today's seed data (no partnership listing has a negative-kind
  row yet) — same limitation as several recent Pillar-3 items. This item is now fully
  complete; the seeker detail page intentionally has no equivalent panel (no single
  aircraft's specs to synthesize against in the same shape).
~~- **[agent][goal] Seeker Budget Check panel missing the low–high range bar.**~~ ✅ SHIPPED
  via `seeker-budget-check-range-bar` (2026-07-05) `getSeekerBudgetCheck` already returns a
  full `PartnerCompResult` (same shape `PartnershipMarketCheck` uses) carrying `low`/`high`/
  `percentile`, but `SeekerBudgetCheck.tsx` only ever rendered `kind`/`deltaDollars`/`pct`/
  `median`/`count` — a prior BACKLOG note calling this out-of-scope didn't hold up once the
  implementation was actually read. Now renders the identical visual spread bar (median tick
  + "your budget" marker), falling back to the existing plain sentence on a degenerate/zero
  spread. Dormant on today's seed data (no make yet clears the 4-comp floor) — verified via a
  temporary mock-data preview route (3 result shapes), screenshotted, then deleted before
  merge. **Synthesis panel ✅ SHIPPED 2026-07-05** (`seeker-deal-signals-panel`): new
  `SeekerDealSignals.tsx` mirrors `PartnershipDealSignals`'s "how this stacks up" tally-chip
  pattern, synthesizing budget-vs-market + preference specificity + experience disclosed +
  budget transparency + days-listed into one scannable card above `SeekerBudgetCheck`. All 3
  listing types now have full synthesis-panel parity (aircraft `DealScorePanel`, partnership
  `PartnershipDealSignals`, seeker `SeekerDealSignals`) — this item is now fully complete.
~~- **[agent][goal] `/airports/[icao]` hub missing comp/budget verdicts entirely.**~~ ✅
  SHIPPED via `airport-hub-comp-verdicts` (2026-07-05) `/partnerships/near/[icao]` and
  `/saved` both batch-fetch comp/budget verdicts and pass them into their `PartnershipCard`/
  `SeekerCard` renders; `/airports/[icao]` rendered both card types with zero verdict props at
  all — a parity gap found via an Explore-agent audit that also ruled out the aircraft browse
  family, homepage rails, and an honesty-floor mismatch (none found). Fixed by calling the same
  `getPartnershipCompVerdicts`/`getSeekerBudgetCheckVerdicts` batch helpers already proven
  elsewhere. Dormant on today's seed data at both audited airports (no make clears the 4-comp
  floor) — verified via a temporary mock-data preview route, screenshotted, then deleted before
  merge. **`DeviceSavedListings.tsx` gap ✅ SHIPPED via `device-saves-social-proof-parity`
  (2026-07-08)** — verdict maps now threaded through `hydrateDeviceSaves`, confirmed via direct
  code read (this line was stale, never struck off). **`/members/[id]` gap ✅ SHIPPED via
  `member-profile-comp-verdict-parity` (2026-07-09)** — the persona's `PartnershipCard` now
  receives the same batched `comp`/`dealVerdict`/`saveCount` props (`getPartnershipCompVerdicts`
  + `getSaveCounts`), matching every other call site. This item is now fully complete across
  every `PartnershipCard`/`SeekerCard` render surface in the app.

---

### Agent-invented SEO experiments  `[PARKED 2026-06-26]`
> PARKED — do not pull. SEO is on hold (waiting for Google to index); fix only as `[bug]`.
- **[agent][goal] Aircraft comparison pages (`/aircraft/compare/[a-vs-b]`).** ✅ SHIPPED
  2026-06-24 (`aircraft-compare-pages`). A new indexable family targeting the very
  high-volume "{model} vs {model}" buyer query class (e.g. "Cessna 172 vs Cirrus SR22"),
  built entirely from the existing curated `MODEL_SPECS` + `MODEL_HIGHLIGHTS` tables (no
  fabricated figures) with a unique per-pair editorial intro, a side-by-side spec table,
  both models' highlights, live inventory CTAs, and internal links from the indexed model
  seed pages into the new family. **Why this grows pageviews:** "X vs Y" is one of the
  highest-intent, highest-volume informational query patterns in aircraft buying, and these
  pages carry real unique value while spreading crawl equity into the model hubs (INDEXING
  stage). Slice 1 = 8 curated pairs + index hub + sitemap. Expanded to **13** curated pairs
  (`compare-pairs-expansion`, 2026-06-24) and to **18** (`compare-pairs-expansion-2`,
  2026-06-24: 182 vs Bonanza, Mooney M20 vs Comanche, Saratoga vs 182, Cessna 180 vs 182,
  Cub vs Citabria). FAQ + FAQPage JSON-LD now ship on every pair. Expanded to **21**
  (`compare-pairs-expansion-3`, 2026-06-24: Cessna 172 vs Grumman AA-5, Grumman AA-5 vs
  Cherokee, Cessna 150 vs Piper Cub — brings the Grumman AA-5 into the family). Expanded
  to **24** (`compare-pairs-expansion-4`, 2026-06-24: Cirrus SR20 vs Cessna 172, Beechcraft
  Bonanza vs Piper Saratoga, Mooney M20 vs Piper Arrow). **Next:** the curated-model pool is
  now very heavily cross-compared — **DIVERSIFY off this family next [goal] cycle** to avoid
  over-concentration (several recent cycles touched it). Remaining niche pairs are thin on
  genuine value; better next [goal] bets: a ClubHanger-Estimate price-context row once a
  comparison-appropriate display is settled, a CWV/`next/image` pass, or geocoding
  `aircraft_for_sale.location` to light up `/aircraft/near/[icao]`.

### Growth & data — owner acquisition (human, 2026-06-23)
FAA-registry-powered ideas. The aircraft registry is public (tail number → owner
name OR LLC + mailing address, make/model/year; NO emails/phones). Two items:

~~- **[P2][want] N-number autofill on "Post a Listing".**~~ Slices (1) and (2) were
  already live (`/api/faa-lookup`'s single-record inquiry endpoint, wired into
  `/aircraft/new` + `/partnerships/new` to prefill make/model/year). **Slice 3 ✅
  SHIPPED via `faa-lookup-registrant-type-hint` (2026-07-06):** the route already parsed
  and returned `registrantType` (Individual/LLC/Trust/Corporation/Government) from the
  FAA registry but both forms fetched and silently discarded it. Now appended to the
  lookup status line (e.g. "Found: 2015 Cirrus SR22 · Individually registered"). No new
  data source, no schema change — pure client-side surfacing of data already in hand.
  **Not done, intentionally:** the bulk `faa_aircraft` registry import / owner-leads
  angle — that's the separate, much larger "Owner-leads list" item below, still
  flagged for human review before any autonomous build.

- **[P2][want] Owner-leads list from airport-based tail numbers — DATA COLLECTION ONLY,
  NO OUTREACH YET.** Growth-prospecting dataset: for a chosen airport, enumerate based
  aircraft + tail numbers, enrich each via the FAA registry to an owner name or LLC +
  address, resolve LLCs via state business registries (registered agent / members +
  address), and later attach likely online profiles / emails — assembled into a `leads`
  table + admin view. **Build the list only; contact NObody.** Slice: (1) source
  based-aircraft tail numbers for an airport (ADS-B operators seen at the field / airport
  directory / FAA owner-address proximity — pick a method); (2) FAA registry enrich →
  owner/LLC + address; (3) LLC resolution via Secretary-of-State lookups → agent/members;
  (4) **(gated, later)** profile/email discovery; (5) `leads` table + admin view.
  - **HARD GATE — outreach is OFF.** Do NOT build any send/email/message flow and do NOT
    contact leads. Assembling the dataset is the entire scope. Before ANY outreach: a human
    decision **and** a compliance check (CAN-SPAM, FAA data-use + owner opt-outs, state-data
    ToS, publicity/privacy). Brand note: cold-blasting scraped owners cuts against the
    trust differentiator and risks sender reputation — this is a curated, careful list,
    not a spam cannon.
  - **Flag for human review before any autonomous build.** Touches third-party sources:
    FAA registry is clean/public, but ADS-B, state-SoS scraping, and email enrichment each
    need a ToS/compliance look — the night-shift loop should NOT scrape these unattended
    without sign-off. (Pairs with the N-number autofill item above, which shares the FAA data.)

### Backlog capture — screenshots (human, added in chat)
Items the human captured from chat with a reference screenshot. Each links a
screenshot in Supabase Storage (`backlog-shots` bucket). **When an item here is
completed, delete its screenshot object from `backlog-shots` to reclaim storage.**

~~- **[P3][want] Link to email settings from Saved Searches.**~~ ✅ SHIPPED via `searches-email-settings-link` (2026-06-26) On the Saved Searches
  page (`/searches`), add a clear link/CTA to the email-notification settings on the
  profile/account page (`/account`) — so a user managing saved searches can jump
  straight to controlling their email alerts for them. (No screenshot.)

~~- **[P2][want] Detail page + inquiry routing for USER-posted aircraft.**~~ ✅ SHIPPED
  via `internal-aircraft-listing-detail` (2026-06-23) + `aircraft-listing-contact` (2026-06-26).
  **Correction (found 2026-07-03 during `contact-phone-prefill` research):** this note was
  stale, listing it as still open. `/aircraft/listing/[id]/page.tsx` is the internal detail
  page (mirrors the partnership one); `AircraftSaleCard`/`AircraftRailCard` already link every
  row there (not `#`); when `source === 'user'` it renders an in-platform "Contact the seller"
  button (`AircraftContactButton` → `getOrCreateAircraftThread`, keyed on `poster_id`, same
  generic `threads` table as partnerships/seekers) instead of the external source-link card.
  **One dependency still open:** the `threads.aircraft_for_sale_id` column + unique index
  (additive migration, `supabase/schema.sql` ~line 534) needs a human to run it in the Supabase
  SQL editor before aircraft inquiries can actually insert a thread row — until then the button
  shows a graceful inline error rather than crashing. Not a code gap, just an unapplied DDL step.

~~- **[P2][want] Optional note when saving a listing.**~~ ✅ SHIPPED via `seeker-saved-note-parity`
  (2026-07-06) When a user saves a listing, they can attach an optional free-text note,
  displayed **(a)** on the listing page and **(b)** on `/saved`. The aircraft and partnership
  detail pages, plus `/saved`, already had this (`SavedListingNote` + `updateSavedNote`) — the
  seeker (pilot-seeking-a-partnership) detail page was the one of the 3 listing types that
  never got the with-note fetch + editor, even though the component/action were already
  listing-type-agnostic. Ported the identical with-note/fallback-without-note query pattern
  (graceful degrade if the `note` column isn't migrated yet — confirmed still true on the
  live DB) and rendered `SavedListingNote` next to the Save button. No schema/component change.
  This item is now fully complete across all 3 listing types.
  — shows breadcrumb `Home / Planes for Sale / Dassault Falcon 900ex`, a Share + **Save**
  pair top-right, the photo, a PRICE card ($795,000), and a "View on AircraftForSale"
  card. Data: add a `note text` column to the saved-listings record (per-user save row).
  Slice: (1) note column + an "add note" input in the save flow (inline on save, or an
  edit affordance once saved); (2) render the note on `/saved`; (3) render the note on
  the listing detail page when present (optionally on the listing card too). Applies to
  both aircraft-for-sale saves and partnership saves.
  — **note column + `/saved` editor ✅ SHIPPED 2026-06-25T085625Z** (`saved-listing-note`):
  additive `note text` column on `saved_listings` (in `schema.sql`); new owner-scoped
  `updateSavedNote` action; inline `SavedListingNote` editor under each card on `/saved`
  (add → textarea → Save; amber sticky note + pencil to edit; clear+save removes). Covers
  the edit-affordance variant of slice 1 + slice 2. **⚠️ Needs the human to apply the
  additive migration in the Supabase SQL editor** (`alter table saved_listings add column
  if not exists note text;`) — the loop can't run DDL; until then the affordance
  self-suppresses (dormant, no regression). **Correction (found 2026-07-04 during
  `seeker-remove-scheduling-field` research):** this "Remaining: slice 3" note was stale —
  `SavedListingNote` already renders on both `/aircraft/listing/[id]` (imported + used
  there) and `/partnerships/[id]` (same component, same pattern), so the detail-page render
  slice is done. Only remaining sub-piece: the inline-on-save variant (needs `SaveButton`
  restructuring) — optional, not blocking. Item is otherwise complete pending the human
  migration above; **delete the `backlog-shots/save-note-listing/` screenshot object** once
  that migration is applied and confirmed live.


Theme: make ClubHanger feel like a polished Zillow/Redfin for aircraft, and stop
showing junk. All human-requested this session. Inspiration: Zillow + Redfin
(listing pages, price history, map, Zestimate), Etsy/Airbnb (collection layout).

**Data quality (do first):**
- ~~**[P1][bug] Hide listings under $50k + no-price from all buyer surfaces.**~~ **Slice 1 ✅ SHIPPED 2026-06-25** (`hide-sub50k-listings`): global `asking_price >= $50k` floor applied to all 9 buyer-facing queries in `AircraftSaleList.tsx` — browse, counts, family pages (make/model/state), market price stats, comp pill price map. Sitemap already had this floor; now all buyer surfaces are in parity. **Remaining:** slice 2 — suppress no-price rows from homepage `HomeRails` `photoOnly` path (low impact, HomeRails already passes `min_price=50000` on most rails). Also see the separate `[P1][bug] Hide parts/wanted listings` item for tightening the ingest classifier. Keep partnerships unaffected (buy-in ≠ aircraft price).

**Homepage curated collections (replaces the old slice-4 "Time-builders under $100k"):**
- ~~**[P1][want] Re-theme collections — stop leading with the cheapest planes.**~~ ✅ SHIPPED 2026-06-23T06:49Z (`rethemed-home-collections`). `HomeRails` `RAILS` re-themed to: *Just listed this week · Recently reduced (price drops) · Glass-panel cross-country · Step-up performance (Cirrus SR22) · Family four-seaters (Cessna 172)*; no "under $X" lead themes, all carry `min_price=50000` (real priced aircraft only), model rails match the model field + link to curated model pages, thin rails auto-drop. See CHANGELOG. **Remaining from the original wishlist:** a "Turnkey & ready to fly" rail (needs a reliable fresh-annual/low-SMOH signal — no clean filter today) and "Near your home airport" (needs home-airport/geolocation — no server-side location yet).
- **[P1][want] Redesign the collection layout — drop the horizontal scrollbar.**
  Preferred **Option A: category tile mosaic** (Airbnb "Explore" / Zillow tiles) —
  responsive grid of big rounded photo tiles (real plane photo behind the label), no
  horizontal scroll, 375px-first, tap → filtered results, on the homepage. **Option B:
  polished snap-carousel** (hidden scrollbar, scroll-snap, next-card peek, chevron
  arrows on desktop hover) for in-listing "more like this" rails. (Human may pick A vs
  a tabbed Option C after a mock.) Reuse `.ch-card`/cream tokens.
  — **Interim Option-B polish ✅ SHIPPED 2026-06-23T08:47Z** (`home-rails-snap-carousel`):
  the homepage curated rails now hide the scrollbar + scroll-snap + next-card peek +
  desktop chevron arrows via a reusable client `RailScroller` (cards stay server-rendered
  as children). This delivers the headline "drop the horizontal scrollbar" reversibly on
  the existing real-listing rails. **STILL OPEN — the wholesale redesign awaits the human's
  mock: Option A (category-tile mosaic) vs tabbed Option C.** **RailScroller rollout ✅
  AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06** — both named follow-ups are done: the in-listing
  Similar-aircraft rail (`SimilarAircraft.tsx`, `similar-rails-snap-carousel`), the
  newest-partnerships homepage row (`FeaturedListings.tsx`, `home-newest-partnerships-rail`),
  and also `DealsRail.tsx` + `SimilarListings.tsx` — `RailScroller` is now the standard for
  every card rail site-wide. Confirmed via grep, no code change needed.

**Zillow/Redfin features buyers love (all [want]):**
~~- **[P1][want] Internal listing detail pages.**~~ ✅ AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06
  (found stale/unchecked during `partnership-model-multiselect` cycle's backlog scan; no code
  change needed). All 4 slices are live on `/aircraft/listing/[id]`: slice 1 (route + gallery +
  specs + source CTA, `internal-aircraft-listing-detail`); slice 2 — cost-to-own breakdown (sole
  vs 1/2, 1/3, 1/4 partnership shares, inline on the page) + price-history block (`previous_price`/
  `price_changed_at`, only when a real recorded change exists); slice 3 — `SimilarAircraft` rail;
  slice 4 — `buildAircraftListingJsonLd` Product/Offer JSON-LD + BreadcrumbList, wired into the
  page. Confirmed via direct grep of the current file, not a changelog note.
~~- **[P1][want] "ClubHanger Estimate" — fair-value pricing (Zestimate analog).**~~ ✅
  AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06 (all 3 slices done per the note below, parent
  bullet lacked its strikethrough). "Priced
  $18k below similar 2008 SR22s" + a Good-deal / Priced-high score, computed from comps
  on make/model/year-band/hours. Differentiator. Slice: (1) comp model + API; (2) deal
  badge on cards (extends existing `CompResult`); (3) price-analysis block on detail page.
  — **slice 1 (comp model) + slice 2 (per-card pill) already live** as `src/lib/aircraftComps.ts`
  (`compVsMarket`) + the `AircraftSaleCard` `CompPill`. — **slice 3 ✅ SHIPPED 2026-06-23T08:01Z**
  (`clubhanger-estimate-detail`): a "ClubHanger Estimate" panel on `/aircraft/listing/[id]`
  comparing the asking price to the median of OTHER active priced same-make+model listings —
  **Below / Around / Above market** with $/% delta, comp count, family link, and a year/hours/
  avionics caveat. Deliberately a **descriptive market comparison, not an endorsement**
  (comp set is the whole family). Pure unit-tested helper `src/lib/aircraftEstimate.ts` +
  read-only `getFamilyAskingPrices()`; self-suppresses on no-price/unknown-family/<4 comps.
  See CHANGELOG. — **endorsement-style "Good deal / Priced high" verdict ✅ SHIPPED
  2026-06-24T10:21Z** (`clubhanger-estimate-deal-verdict`): a "Deal check" line in the
  detail-page `EstimatePanel` comparing the asking price only against **similar-year
  (±5yr) + similar-hours** same-make+model comps (≥4 required) → **Good deal / Fair price /
  Priced high**, additive on top of the existing whole-family descriptive estimate; pure
  unit-tested `clubHangerDealVerdict` + read-only `getFamilyComps`; self-suppresses on
  thin/missing data. **Remaining:** optionally surface the verdict chip on the detail
  page's "Similar aircraft" cards + the browse `AircraftSaleCard`; consider accepting SMOH
  when TTAF is missing to widen coverage.
~~- **[P2][want] Price history + "Price cut ↓$X" + days-on-market + "New" pills (Redfin).**~~ ✅ SHIPPED via `listing-cost-and-price-history` (2026-06-23)
  Data already stored (`previous_price`, `price_changed_at`, `first_seen_at`). Slice:
  (1) New + Price-cut pills on cards (extend existing `priceDrop`/`isNew`); (2)
  price-history mini-chart on the detail page; (3) days-on-market label.
~~- **[P1][want] Map search (Zillow/Redfin core).**~~ ✅ AUDIT-CONFIRMED FULLY SHIPPED
  2026-07-09 (found during `match-alert-digest` cycle's `[want]`-tier scoping — the last
  sub-bullet below already read "fully closed" but the parent line was never struck).
  Browse planes & partnerships on a map by airport/region using `airports` lat/lng; click
  pins → listings. Slice: (1) map view on `/aircraft` + `/partnerships`; (2) pin clustering;
  (3) "search this area" / region filter; (4) sidebar list ↔ map sync.
  - **Slice 1 — `/partnerships` half ✅ SHIPPED via `partnerships-map-view` (2026-07-07)**:
    collapsed-by-default "View on map (N)" toggle above the filtered results → lazy-loaded
    Leaflet/OSM map (no API key, off the default CWV) with one pin per listing at its home
    airport's real FAA-seeded lat/lng (`resolveAirportCoords()`); pin popup shows
    make/model, airport/city/state, buy-in, and a link to the listing. **Remaining:** the
    `/aircraft` half is blocked on geocoding `aircraft_for_sale.location` (no ICAO/lat/lng
    column — separate backlog item); then slices (2) clustering, (3) "search this area",
    (4) list ↔ map sync.
  - **Slice 2 — pin clustering ✅ SHIPPED via `partnerships-map-clustering` (2026-07-07)**:
    a live-DB check found 10 of 23 active partnerships share `KPAO` alone (23 rows, only 9
    unique airports) — most markers were rendering exactly stacked/invisible on top of each
    other, a real bug in slice 1, not just polish. Wrapped the marker list in
    `react-leaflet-cluster`'s `MarkerClusterGroup` (new dep, peer-matches installed
    react-leaflet ^5/react ^19/leaflet ^1.9 exactly); co-located pins now group into a
    numbered cluster bubble that spiderfies/zooms on click, verified via Playwright driving
    the real map: a "10" bubble appears over Palo Alto and clicking it reveals all 10
    individual markers with working popups. **Remaining:** (3) "search this area" region
    filter, (4) sidebar list ↔ map sync; `/aircraft` half still blocked on geocoding.
  - **Slice 3 — "search this area" region filter ✅ SHIPPED via
    `partnerships-map-search-area` (2026-07-08)**: the `/partnerships` map now has a
    Zillow/Redfin-style floating "Search this area" button that appears once the
    visitor pans/zooms; clicking it filters the list below to only the listings whose
    pins fall inside the current viewport (`map.getBounds().contains`). The results-count
    line becomes a client component (`PartnershipResultCount`) that stays honest —
    "Showing M of N in this map area · Show all" — with a one-tap reset; collapsing the
    map ("Hide map") clears the filter automatically (unmount cleanup). Purely a
    client-side in-page view over listings already fetched — no schema/query/JSON-LD
    change. Shares `mapListSync.ts`'s window-CustomEvent pattern (new
    `MAP_BOUNDS_FILTER_EVENT`). **Remaining:** the `/aircraft` map half is still blocked
    on geocoding `aircraft_for_sale.location` (no ICAO/lat/lng column).
  - **Slice 4 — sidebar list ↔ map sync ✅ FULLY SHIPPED (both directions)**: map →
    list via `partnerships-map-list-sync` (2026-07-08) — a pin's popup has a "↓ Show
    in list" button that smooth-scrolls to and briefly highlights (2s blue ring) the
    matching card below. List → map via `partnerships-list-map-sync` (2026-07-08) —
    a card whose listing has a resolvable pin now shows "Show on map"; clicking it
    opens the map (if collapsed), scrolls it into view, and pans/zooms to the pin
    (spiderfying out of a cluster via `zoomToShowLayer` if needed) then opens its
    popup. Both directions share `mapListSync.ts`'s window-CustomEvent pattern
    (mirrors `LOCAL_SAVES_EVENT`), no schema/query change.
  - **`/aircraft` half — basic view ✅ SHIPPED via `aircraft-map-view` (2026-07-08)**:
    unblocked the geocoding gap noted above. `aircraft_for_sale` has no ICAO column like
    partnerships' `home_airport`, only free-text `location` ("City, ST") + `state` — so a
    new `resolveLocationCoords()` (`src/lib/airports.ts`) matches the parsed city + state
    against the seeded `airports` table (case-insensitive, largest-airport-type wins on a
    city collision) instead of an exact ICAO join. Verified live: 63.8% of active priced
    listings with a location resolve to a real coordinate; the rest (non-US locations,
    bare-state or truncated/typo'd city strings) simply get no pin — no fabrication, same
    self-suppress pattern as unmatched ICAOs. Since city-level matching collides far more
    than partnerships' exact-airport matching did, shipped **with clustering from day
    one** (`MarkerClusterGroup`, already installed) rather than repeating the
    stacked-pins bug partnerships hit in its own slice 1. New `AircraftMapView.tsx` /
    `AircraftLeafletMap.tsx` (mirror the partnerships pair); popup shows the listing's own
    real make/model/asking-price/location text (never an inferred airport claim) + a link
    to `/aircraft/listing/[id]`. Wired into `/aircraft/page.tsx` reusing the
    already-fetched `itemListListings` (no second query).
  - **"Search this area" region filter ✅ SHIPPED via `aircraft-map-search-area`
    (2026-07-08)**: ported partnerships' slice-3 feature onto `/aircraft` — a floating
    "Search this area" button appears on the aircraft map once the visitor pans/zooms;
    clicking it filters the list below to only listings whose pin falls inside the
    current viewport. The inline pagination-aware count line became a new client
    component `AircraftResultCount.tsx` (mirrors `PartnershipResultCount.tsx`) that
    swaps to "Showing M of N in this map area · Show all" while filtered and restores
    the exact original text on reset/collapse; `AircraftSaleCard.tsx` gained the same
    `hiddenByArea` bounds-filter subscription `PartnershipCard.tsx` already had. Purely
    client-side, no schema/query change.
  - **List ↔ map sync ✅ SHIPPED via `aircraft-list-map-sync` (2026-07-08)**: ported
    partnerships' slice-4 feature onto `/aircraft` (both directions, one cycle — the
    generic `mapListSync.ts` event pattern needed no changes). Map → list: a pin's popup
    gets a "↓ Show in list" button (`AircraftLeafletMap.tsx`) that smooth-scrolls to +
    briefly highlights (2s sky ring) the matching card (`AircraftSaleCard.tsx`). List →
    map: a card whose listing has a resolvable pin now shows "Show on map"
    (`AircraftSaleList.tsx` threads `mapPinIds` computed in `aircraft/page.tsx`, same
    pattern as `/partnerships`' `mapPinIds`); clicking it opens the map if collapsed,
    scrolls it into view, and pans/zooms to the pin (spiderfying out of a cluster via
    `zoomToShowLayer` if needed) then opens its popup (`AircraftMapView.tsx`). Verified
    live via Playwright driving the real map on both viewports: clicked a cluster to
    reveal individual markers, clicked a marker's "Show in list" and confirmed exactly 1
    highlighted card; collapsed the map, clicked a card's "Show on map" and confirmed the
    map auto-opened + panned to the correct pin's popup ("Cessna 182 / Gustavus, AK /
    $56,850") on both desktop and mobile — zero console errors. **The whole "Map search
    (Zillow/Redfin core)" backlog item is now fully closed on both listing types.**
~~- **[P2][want] Saved listings + instant new-match email alerts (Redfin favorites).**~~
  **Slice 1 ✅ SHIPPED via `savesearch-real-alerts` (2026-07-06)** — `saveSearch()` (used by
  `SaveSearchButton` on `/aircraft`, `/partnerships`, `/partnerships/seeking`, and the
  `/searches` quick-start form) now also inserts a `status='confirmed'` `alerts` row
  (skipping the anonymous double-opt-in since the user is already authenticated), so a
  saved search actually starts receiving the already-live `alert-digest` cron's emails —
  closing the gap the site's own copy already promised ("tap Save this search to turn on
  alerts") but the code never delivered on. Slices 2 (nightly match job) and 3 (the email
  itself) were **already live** before this cycle (`alert-digest` cron + Resend), so this
  slice was the one missing link. **Not done, intentionally:** no backfill of
  `saved_searches` rows created before this cycle — they won't have a matching alert until
  re-saved (flagged in CHANGELOG, not silently mutated on a real user's data this cycle).
~~- **[P2][want] "Similar planes" comparables on every listing.**~~ ✅ SHIPPED — same
  make/model/region "similar" rails were already live on aircraft-for-sale
  (`SimilarAircraft`) and partnership (`SimilarListings`) detail pages from earlier
  cycles; **slice done this cycle** via `seeker-similar-rail` (2026-07-08): the third
  listing type, `/partnerships/seeking/[id]`, now has a matching "Similar pilots also
  seeking" rail (`SimilarSeekers`/`SeekerRailCard`) ranked by same preferred make →
  same state → same home airport, excluding the current seeker, self-suppressing at 0
  matches. All three listing types now have this comparables pattern.

#### Batch from chat — 2026-06-24 (posting/messaging/filter friction)

~~- **[P2][want] Post-a-partnership: multi-photo drag-and-drop upload.**~~ ✅ SHIPPED via `aircraft-photo-upload` (2026-06-26) The "Post a
  partnership" page should let the user upload **multiple photos** via an easy
  **drag-and-drop** zone (with click-to-browse fallback), thumbnail previews,
  remove-before-submit, and reorder if cheap. Today the flow lacks an easy multi-image
  uploader. Slice: (1) DnD + multi-select zone with previews → Supabase Storage + attach
  URLs to the listing; (2) remove/reorder + validation (type/size/count cap); (3) progress
  states + 375px polish.
~~- **[P1][want] Post-a-partnership form: make posting frictionless.**~~ ✅
  AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06 (all sub-slices below already done, including
  buy-in itself later made optional per `buy-in-price-optional` — an even friendlier
  end-state than this item's original ask; parent bullet lacked its strikethrough). Goal —
  make posting a
  partnership as easy as possible. Changes: (1) **N-number optional** with helper text;
  (2) **simplify "Home airport"** to just the identifier, drop airport-name/city/state
  (implied); (3) **buy-in required**, monthly-fixed + wet (per-hr) rate **optional** with an
  **info hover** explaining partnerships work different ways (leave blank if N/A); (4)
  **remove the pilot-requirements** section; (5) **move "Listing details" earlier** (2nd–3rd
  section); (6) **autosave** with a visible "Saving…/Saved" indicator so users don't fear
  losing progress. Slice: (1) field changes 1–5; (2) autosave + save-state; (3) 375px polish.
  — **slice 1 (field changes 1–5) ✅ SHIPPED 2026-06-24T06:24Z** (`post-partnership-frictionless`):
  N-number marked optional; Home Airport asks for ICAO only (server now derives
  airport_name/city/state from the `airports` table so the state SEO pages keep real data);
  Buy-In required + Monthly/Wet optional with an info hover; Pilot Requirements section removed;
  Listing Details moved to the 2nd section. No schema change. See CHANGELOG.
  — **slice 2 (autosave + "Saving…/Saved" indicator) ✅ SHIPPED 2026-06-24T08:08Z** (`post-partnership-autosave`):
  new reusable `useFormDraft` hook autosaves the form to localStorage (debounced) with a
  Saving…/Draft saved/Draft restored indicator, restores on return, clears on successful post.
  Client-only, no schema. Seeker form later adopted the same hook (see its own autosave slice).
  — **slice 3 (375px micro-polish) ✅ SHIPPED 2026-07-03** (`post-forms-ios-zoom-fix`): every
  field on all 3 post forms (+ the shared airport-code input) rendered at 14px, which triggers
  iOS Safari's auto-zoom-on-focus for any input under 16px; bumped to 16px on mobile (desktop
  unchanged). This item is now fully complete. The `EarningsCalculator` widget's number inputs
  were flagged as a follow-up and are now also fixed — ✅ SHIPPED 2026-07-03
  (`earnings-calculator-ios-zoom-fix`).
~~- **[P2][want] Easy toggle between the three "Post a…" types.**~~ ✅ SHIPPED (confirmed
  complete 2026-07-03) `PostTypeTabs` (`src/components/PostTypeTabs.tsx`) renders on all
  three post pages (`/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new`) with
  `active` set per page. Screenshot object can be deleted from `backlog-shots`.
~~- **[P1][want] Post-a-Seeking form: make it frictionless.**~~ ✅ FULLY SHIPPED (last sub-item
  closed 2026-07-04 via `seeker-remove-scheduling-field`) Goal — make posting a "pilot
  seeking partnership" listing as easy as possible. Changes: (1) **base location → multiple
  airports**, drop airport-name/city/state (implied); (2) **"willing to travel" → drive time**
  (e.g. 30/45/60 min), infer distance behind the scenes; (3) **remove "preferred scheduling
  system"**; (4) **description help outside the box** on how to write a great description,
  with **examples of good writing**; (5) reuse partnership-form friction-reducers (optional
  labels, autosave + save-state, sensible order). Slice: (1) fields 1–3; (2) description help
  + examples; (3) shared autosave + 375px polish.
  — **slice 2 (description help + examples) ✅ SHIPPED 2026-06-24T07:28Z** (`seeking-description-help`):
  a "How to write a great description" tips panel (4 bullets) + a native `<details>` "See two example
  descriptions" disclosure (first-time buyer + experienced time-builder) around the Description textarea
  on `/partnerships/seeking/new`. Static/presentational only — no new fields, no schema, no change to
  `createSeekerListing`. See CHANGELOG.
  — **slice 3 (autosave + "Saving…/Saved") ✅ SHIPPED (earlier in this drain)**: seeker form now uses `useFormDraft(DRAFT_KEY)` with the `DraftIndicator` component — full Saving/Saved/Restored cycle, "Start over" confirm, `forceSaveDraft` on auth redirect, draft key `ch:draft:seeker-new`.
  — **field change (2) "willing to travel" → drive time ✅ SHIPPED**: the seeker form's `willing_to_travel_nm` select already uses "~30 min drive / ~45 min drive / ~1 hr drive / ~1.5 hr drive / ~2 hr drive" labels.
  — **field change (1) multiple base airports ✅ SHIPPED 2026-06-29 via `seeker-additional-airports`**: seeker form "The basics" section now has an optional "Also flying from" `AirportFormInput`; stored as `additional_airports text[]` in DB (migration required: see schema.sql `seeker_additional_airports`); displayed on the seeker detail page; graceful fallback if column not yet applied.
  — **field change (3) remove "preferred scheduling system" ✅ SHIPPED 2026-07-04 via `seeker-remove-scheduling-field`**: the "Preferred Scheduling" free-text input is removed from the create + edit forms and the detail-page display row; DB column left in place, unused. This item is now fully complete — all 5 changes + all 3 slices shipped.
~~- **[P2][want] "Generate with AI" for title + description (all post flows).**~~ ✅
  AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06 (found during `alert-pause-delete` cycle's tier-2
  scan; no code change needed). Slice 1 (`seeking-ai-draft`, 2026-06-25) shipped the seeking
  form's "Generate with AI ✨" box. The two "remaining" slices below were stale: slice 2
  (reuse on for-sale + partnership forms) is done — `generateAircraftDraft`/
  `generatePartnershipDraft` (`src/app/actions.ts`) both return `{title, description, ...}`,
  and `PostAircraftForm.tsx`/`PostPartnershipForm.tsx` both call `fillFormField(form,
  '[name="title"]', result.title)` and the same for `description` — confirmed via direct grep,
  not a changelog note. Slice 3 (rate limit/cost cap) is also done — `checkAiDraftAccess`
  enforces a 10/hr-per-user cap shared by all 3 forms' draft + URL-paste variants.
- ~~**[P2][want] Seeking-partnership profile: fill the empty right rail.**~~ ✅ SHIPPED
  2026-06-24T06:02Z (`seeking-profile-right-rail`). On `/partnerships/seeking/[id]`, the
  **Aircraft Preferences** and **Flying Profile** cards moved out of the full-width left column
  into the **right rail** (order: Budget → Aircraft Preferences → Flying Profile → contact CTA),
  with their inner grids collapsed to a single column to fit the narrow rail; "About me" stays
  the main left column. Same data + privacy gating, purely a layout balance/conversion move.
  See CHANGELOG. (Screenshot object can be deleted from `backlog-shots`.)
~~- **[P1][want] On-site messaging instead of exposing emails.**~~ ✅ AUDIT-CONFIRMED FULLY
  SHIPPED 2026-07-06 (found stale/unchecked during `partnership-model-multiselect` cycle's
  backlog scan via an Explore-agent audit; no code change needed). All 4 slices are live and
  merged to staging: (1) `threads`/`messages` schema covers all 3 listing types
  (`partnership_id`/`seeker_id`/`aircraft_for_sale_id`, participant-based RLS) with
  `MessageOwnerButton`/`AircraftContactButton`/`SeekerContactBar` replacing "Send Email" as the
  primary CTA on `/aircraft/listing/[id]`, `/partnerships/[id]`, and `/partnerships/seeking/[id]`
  (mailto kept only as the explicit fallback this item itself asked for); (2) `/messages` +
  `/messages/[threadId]` inbox, all 3 listing types; (3) `RESEND_API_KEY`-gated new-message email
  notification (`messaging-new-message-email`, `message-notify-throttle`); (4) unread badge in
  `Nav.tsx` (`messages-unread-badge`). Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/in-app-messaging/20260624-in-app-messaging.png
- ~~**[P2][want] Partnership filter: multiple airport codes.**~~ ✅ SHIPPED 2026-06-24T10:40Z
  (`partnership-filter-multi-airport`). The `/partnerships` "Home Airport (ICAO)" filter now
  takes **multiple codes** (Enter/comma/blur to add) as removable chips, OR'd via the existing
  `airports` param + `.in('home_airport', …)` query path; one removable chip per airport also
  renders in the results header (`PartnershipActiveFilterChips`). Desktop + 375px; legacy single
  `?airport=KHWD` (+radius) preserved. Pure front-end (no schema). See CHANGELOG. (Screenshot
  object can be deleted from `backlog-shots`.) **Next:** same multi-airport input on the seeking
  browse filter (`SeekerFilters`) + the seeking-form "multiple base airports" field; optional
  "within X mi" radius alongside the multi-airport list.
- ~~**[P2][want] Add "Save this search" inside the filter panel.**~~ ✅ SHIPPED
  2026-06-24T08:39Z (`save-search-in-filter-panel`). A full-width "Save this search" button
  now renders inside the Filter Results panel (desktop sidebar + mobile drawer) above
  "Clear all filters" on both `/aircraft` and `/partnerships`, reusing the existing
  `SaveSearchButton` (new opt-in `fullWidth` prop) + `saveSearch` action; the top-right
  button is unchanged and it self-hides when no filters are active. NO schema. See CHANGELOG.
  (Screenshot object can be deleted from `backlog-shots`.) **Next:** the related save-search
  UX items below — one-click auto-named save + inline rename on `/searches`, and making the
  results-header "Save this search" more prominent.
- **[P2][want] One-click save search: auto-name + skip the naming step.** Saving a search
  forces the user to name it first. **Auto-generate a name** from active filters (e.g.
  "Cessna partnerships near KHWD under $20k buy-in") and save in **one click**; show a
  confirmation that points to the **Saved Searches** page with a **link** to go there.
  **Renaming** happens on the Saved Searches page (inline). Slice: (1) auto-name + one-click
  save + post-save toast linking `/searches`; (2) inline rename on Saved Searches.
  — **slice 1 (auto-name + one-click save) ✅ SHIPPED** (`SaveSearchButton` + `autoNameSearch`).
  — **slice 2 (inline rename on `/searches`) ✅ SHIPPED 2026-06-24T12:31Z** (`saved-search-inline-rename`):
  a pencil affordance on each saved-search name opens an inline editor (Enter saves / Esc cancels),
  backed by a new owner-scoped `renameSavedSearch` action (23505-aware); no schema. **This item is now complete.**
- **[P2][want] Model filter: roll up variants into a parent model.** The Model filter lists
  every variant separately (SR20, Sr20 G2, Sr20 G3, Sr20 G6, SR20-G2, SR20-G3, SF50 G2 Plus,
  …), so picking "an SR20" means checking many near-duplicate boxes. Add a parent **"SR20
  (all)" / "SR22 (all)"** option that ORs all variants; keep individual variants behind
  progressive disclosure. Also normalize the casing/dupe inconsistency ("SR20" vs "Sr20 G2"
  vs "SR20-G2"). Slice: (1) group variants under a canonical parent + "(all)"; (2) normalize
  variant naming; (3) collapse-by-default with "show variants". Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/model-filter-rollup-variants/20260624-model-filter-rollup-variants.png
  — **grouping + (all) + collapse slices ✅ SHIPPED 2026-06-24T11:00Z** (`model-filter-variant-rollup`):
  parent "{base} (all)" rolls up clustered variants (one click selects all members, checked/
  indeterminate/none state), individual variants behind a collapse-by-default "Show N variants"
  disclosure; singletons unchanged; pure unit-tested `groupModelVariants` helper over the existing
  comma-joined `model` param (no query/schema change), deliberately conservative (SR22T≠SR22). See
  CHANGELOG. — **per-variant active-filter chips collapsed into one parent chip ✅ SHIPPED
  2026-06-24T12:08Z** (`active-filter-chip-rollup`): on `/aircraft`, a fully-selected model group
  now renders a single "{base} (all)" results-header chip (removal strips all members) instead of
  one chip per variant; partial selections stay per-variant. Pure front-end via `groupModelVariants`
  + the page's existing facets; no query/schema change. See CHANGELOG. **Remaining: (2) normalize
  stored variant casing in the DB (deferred — destructive-ish, ask-a-human); apply the same rollup
  to the partnerships/seeking model filters + their active-filter chips.**
  — ~~**`/partnerships` variant-group rollup**~~ ✅ SHIPPED via `partnership-model-rollup`
  (2026-07-06): the gap explicitly called out below ("Deliberately NOT done this slice") —
  `PartnershipFilters`' Model checkbox list now groups clustered variants under a parent
  "{base} (all)" checkbox (collapse-by-default "Show N variants", indeterminate state) via the
  same `groupModelVariants` helper, and `PartnershipActiveFilterChips` collapses a fully-selected
  group into one removable chip — both mirror `/aircraft`'s existing rollup exactly, no
  query/schema change. Live partnership data currently has no make with >1 model (dormant on
  today's seed data), so verified via a temporary mock-data preview route (screenshotted, then
  deleted before merge) with a mocked SR20/Sr20 G2/Sr20 G3/SR20-G2 cluster — parent checkbox,
  "Show 4 variants" disclosure, and the collapsed "SR20 (all)" chip all render correctly.
  **Remaining: still (2) DB casing normalization (human call).** ~~The `/partnerships/seeking`
  half~~ ✅ SHIPPED via `seeker-model-variant-rollup` (2026-07-10) — see below.
  — **`/partnerships` Model multi-select UI ✅ SHIPPED 2026-07-06** (`partnership-model-multiselect`):
  the prerequisite this line called for ("needs the multi-select UI first") — Make is now a live-facets
  `<select>` and Model a checkbox multi-select scoped to the selected make (`getPartnershipFacets()`,
  mirrors `getAircraftFacets`), `model` param comma-joined → `.eq`/`.in()`, one removable chip per
  selected model in the results header. **Deliberately NOT done this slice:** variant-group rollup
  (`groupModelVariants`, "SR20 (all)") on the new partnership model list — plain checkboxes only.
  — **`/partnerships/seeking` Model filter ✅ SHIPPED 2026-07-06** (`seeker-model-filter`): turned out
  NOT to be a mechanical UI port — seeker rows have no clean `model` column at all (`preferred_models`
  is free text, e.g. `"SR20, SR22"`, previously display-only). Added `src/lib/seekerModelFilter.ts`
  (unit-tested token-parsing + case-insensitive exact-token match — no substring false positives, e.g.
  "172" never matches "172RG"), `getSeekerModels()` frequency-ranking (mirrors `getSeekerMakes()`), a
  new "Model Wanted" checkbox multi-select in `SeekerFilters`/`MobileFiltersDrawer`, and a removable
  chip in `SeekerActiveFilterChips`. Filtering happens in JS on the already-DB-filtered rows, not SQL
  (avoids `.or()`/`ILIKE` escaping risk on free text). Verified against the live DB: unfiltered page
  showed 14 links (13 active seekers + "post new"); `model=172` narrowed to exactly 1 (excluding the
  "172 G1000" row, confirming exact-token match); `model=SR20` narrowed to exactly 2 (both rows
  containing that token).
  ~~Not scoped by the selected Make (the two fields aren't linked in the data).~~ ✅ SHIPPED via
  `seeker-model-filter-make-scoped` (2026-07-10) `getSeekerModels()` now accepts an optional `makes`
  filter (`.overlaps('preferred_makes', makes)`, same semantics `getSeekers` already uses) applied
  before tokenizing `preferred_models`, and `/partnerships/seeking/page.tsx` passes the active `make`
  query param into it — so the Model Wanted option list narrows to tokens from seekers who also want
  one of the selected make(s) instead of always showing every token site-wide. Verified live: no
  filter showed 9 tokens (152/M20/RV-7/SR20/SR22/172/172 G1000/182/Super Cub); `make=Cessna` narrowed
  to exactly 4 (152/172/172 G1000/182). Individual tokens still aren't linked to a specific make
  within one seeker row (free-text field) — this narrows the candidate row pool, matching the
  precision `getSeekers`' own `.overlaps` narrowing already has. No schema change.
  **Variant rollup ✅ SHIPPED via `seeker-model-variant-rollup` (2026-07-10):** the "Model
  Wanted" filter now groups near-duplicate tokens (e.g. "172" + "172 G1000") under one
  "{base} (all)" parent checkbox with a collapse-by-default "Show N variants" disclosure,
  and `SeekerActiveFilterChips` collapses a fully-selected group into one "{base} (all)"
  chip — both port the existing `groupModelVariants()` helper + `ModelGroupRow`/collapse
  pattern already shipped on `/aircraft` and `/partnerships` verbatim. No query/schema
  change (pure client-side grouping of the option list `getSeekerModels()` already
  returns). Verified live: `model=172,172%20G1000` renders "Wants 172 (all)". This closes
  the last open piece of the "Model filter: roll up variants" item across all 3 listing
  types.
  ~~**Not done, intentionally:** wiring `model` into the seeker `AlertSignup` source path/alert-digest
  matching (mirrors how `make`-only alert matching already works there) — a natural next slice.~~ ✅
  SHIPPED via `seeker-alert-model-filter` (2026-07-06) `/partnerships/seeking`'s `alertContext`/
  `alertSourcePath` now carry `model` alongside `make`; `alert-digest`'s `parseSourcePath` parses it
  and `countNewSeekers` matches it against the free-text `preferred_models` field via the existing
  `matchesModelFilter` helper. This item is now fully complete.
~~- **[P2][want] Promote Price/Year/Total-Time out of "More filters"; drop Listing Quality.**~~ ✅ SHIPPED via `filter-promote-core-fields` (2026-06-24)
  Price, Year, and Total Time are buried in the collapsed "More filters" disclosure — core
  buying criteria. Surface them **higher and always-visible** in the main filter panel, and
  **remove "Listing quality"** as a filter. (Reordering already-present fields — not the
  deferred avionics/SMOH filters.) Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/filter-promote-core-fields/20260624-filter-promote-core-fields.png
~~- **[P2][want] Filter: "Priced below market" checkbox.**~~ ✅ SHIPPED via `aircraft-below-market-deals` (2026-06-23) Alongside "Price drops," add an
  **"Aircraft priced below market"** checkbox showing only listings under computed market
  value for their make/model. Depends on the **price-vs-market** comp calc already in the
  backlog (own-inventory comps, show only with ≥N comps). Slice: (1) reuse/finish the
  per-listing below-market flag; (2) checkbox + query; (3) badge parity in cards + filter.
~~- **[P2][want] Filter: airport ICAO + distance radius (for-sale).**~~ ✅ SHIPPED via `aircraft-airport-filter` (2026-06-26) Add an **optional**
  location filter to for-sale browse — enter an **airport ICAO** + a **distance** (e.g. within
  100/250/500 mi or custom) to show only aircraft in range, like the partnership browse
  centers on a home airport. Slice: (1) ICAO input + distance selector → geocode airport
  (reuse our coords) + filter by distance (needs lat/long or geocoded location); (2) "within X
  of {ICAO}" filter chip; (3) sort-by-distance + 375px polish. If listing coords are sparse,
  fall back to state/metro match and note the coverage gap.
~~- **[P1][bug] Hide parts/wanted listings — only show actual aircraft.**~~ ✅ SHIPPED via
  `parts-filter-pattern-gaps` (2026-07-06) The originally-reported titles ("CIRRUS SR22T WING
  ASSEMBLY", "WHEELPANTS FOR THE CIRRUS SR22", the "CIRRUS SR22 NON TURBO" WANTED ad) were
  already fixed by an earlier, undocumented pass (`PARTS_TITLE_PATTERNS` in
  `src/lib/partsFilter.ts` + a Barnstormers ingest-time regex, both already wired into the
  main feed query, the `aircraft_by_distance` RPC, the sitemap query, and "similar aircraft").
  This cycle's live-DB audit found the pattern list still had real gaps — "WINGTIPS" (no
  space), "WING ASSY"/"WING RACK", and standalone "GOVERNOR" parts slipped past — invisible on
  the live feed today only because those specific rows happen to be priced below the $50k
  floor or unpriced, not because the filter actually caught them; a future higher-priced
  ingest with one of these patterns would have leaked through. Added the 4 missing patterns to
  both the display-layer array and the scraper regex; spot-checked against the live DB with no
  false positives (governor-part titles that mention a historic airframe, e.g. "P-51 MUSTANG
  GOVERNORS", are governors *for* that type, not aircraft listings). **Deliberately NOT
  added** (false-positive risk): "spares", "project" — "project aircraft" is a legitimate,
  human-named listing category elsewhere in this backlog, so a bare "project" filter would
  hide real listings. **Not done, intentionally:** the one-time backfill cleanup of existing
  junk rows and a `category`/`is_aircraft` schema column — both out of scope per FREEZE (no
  bulk-rewrite of existing listings; schema change is a separate, bigger slice).
  Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/filter-out-parts-listings/20260624-filter-out-parts-listings.png

### Design & aesthetic — 2026-06-20 (fresh human request)
The human likes the look/feel of **Etsy + Airbnb** and wants ClubHanger to adopt a
combination of the two (see the Etsy × Airbnb entry under **Inspiration** for the
exact likes). A wholesale reskin is too big for one cycle, so this is **sliced — ONE
slice per cycle**, each shippable on its own and **375px-first**. **Branding is now
open for experimentation** (logo, accent color, typography, overall look) — the human
reviews post-cycle, so try things; just keep each cycle cohesive and reversible.

- ~~**[P1][want] Etsy × Airbnb visual refresh — slice 1: design tokens + reference surface.**~~ ✅ SHIPPED 2026-06-20 (see Done). Tokens (`--ch-surface` cream / `--ch-radius-card` rounded-2xl / soft + hover-lift shadows; `.ch-card`/`.ch-panel`/`.ch-surface`) live in `globals.css`, applied to the `/aircraft` reference surface. **Next slices use these tokens — start from `globals.css`.**
- ~~**[P2][want] slice 2: listing-card redesign (Airbnb-style).**~~ ✅ SHIPPED 2026-06-20 (see Done). Both `AircraftSaleCard` + `PartnershipCard` now share `.ch-card` (rounded-2xl + soft shadow + hover-lift, no hard border), larger mobile photo (h-52), bold price (text-2xl extrabold), heart top-right, badges + location intact. QA PASS desktop + 375px on /aircraft and /partnerships. **Next slice = chip bar (slice 3).**
- ~~**[P2][want] slice 3: category chip bar (Airbnb-style).**~~ ✅ FULLY SHIPPED — `/aircraft` (`AircraftChipBar`: top makes / price bands / mission keyword chips, commit 29f13aa) + **`/partnerships` 2026-06-22T08:02Z** (`PartnershipChipBar`: live makes / share types / budget bands; `getPartnershipMakes()` read-time make aggregation with junk-make filter; see Done). Horizontally-scrolling, 375px-first, reuses existing filter params; no new backend. **Next slice = homepage curated rails (slice 4).**
~~- **[P2][want] slice 4: homepage curated rails (Etsy-style).**~~ ✅ SHIPPED via `homerails-deal-chips` (2026-06-27) Add horizontally-scrolling "collection" rails of real listings on the homepage ("Time-builders under $100k", "Glass-panel singles", "Near you", "New this week"), each linking to the matching filtered search / SEO page.
~~- **[P3][want] slice 5: token sweep.**~~ ✅ SHIPPED — all 5 page families done. Apply the design tokens to the remaining pages (listing detail, guides, tools, airport, partnerships) for consistency. One page-family per cycle. — **`/partnerships` search page ✅ SHIPPED 2026-06-22T08:35Z** (`.ch-surface` cream wrap + filter sidebar → `.ch-panel` + larger H1, mirroring `/aircraft`; see Done + CHANGELOG). — **partnership detail `/partnerships/[id]` ✅ SHIPPED 2026-06-22T08:49Z** (`ch-surface` wrap with ContactBar left outside; the 4 neutral listing/requirements/costs/structure panels → `.ch-panel`; sky "Interested?" card → rounded-2xl; see Done + CHANGELOG). — **airport detail `/airports/[icao]` ✅ SHIPPED 2026-06-22T13:35Z** (`ch-surface` cream wrap + larger H1; empty-state card → `.ch-panel`; near-CTA → rounded-2xl; presentational only; see CHANGELOG). — **`/tools` family ✅ SHIPPED via `tools-token-sweep` (2026-07-08)**: the hub's list-item cards now use `.ch-card` (rounded-2xl + soft hover-lift shadow) instead of a hand-rolled `rounded-2xl border-slate-200`; `CostCalculator`/`EarningsCalculator` (both `full` and `compact` variants — compact is also embedded on `/partnerships/new`) neutral input panels now use `.ch-panel`, colored accent result panels bumped `rounded-xl`→`rounded-2xl` to match the existing sky "Interested?" card convention. Presentational only, no schema/logic change. — **`/guides` family ✅ SHIPPED via `guides-token-sweep` (2026-07-08)**: the hub's list-item cards → `.ch-card`; all 8 guide detail pages' neutral info panels → `.ch-panel`, colored (sky/amber) accent panels + 3 comparison-table wrappers bumped `rounded-xl`→`rounded-2xl`. Presentational only, no schema/logic change. **This item is now fully complete — all 5 page families (partnerships, partnership detail, airport detail, tools, guides) carry the shared design tokens.**

### From report feedback — 2026-06-20 (human review of first run)
Highest-priority steering. Bugs first, then alternate want/goal per the allocation policy.

**Bugs (do first):**
- ~~**[P1][bug] `/airports/[icao]` returns HTTP 500 (local production build).**~~ ✅ RESOLVED 2026-06-22T13:09Z (error-boundaries cycle) — **NOT a route bug; it was a stale `.next`/turbopack chunk-cache artifact, not reproducible on a clean build.** On `rm -rf .next && next build && next start`, every suspect page returns **200 with real content**: `/airports/{khwd,kpao,koak,ksql,kccr,klvk,kapc}`, `/aircraft/{cessna/172,cirrus/sr22,piper/cherokee,beechcraft/bonanza,cessna/182}`, `/partnerships/near/khwd` — and **production (clubhanger.com) returns 200 on all three** too (Vercel always builds clean), so the sitemap'd families are healthy; there was no prod outage. The masking (`ChunkLoadError` on the default `_global-error` chunk) traced to the app having **no error boundaries at all**; that's now fixed — `src/app/error.tsx` + `src/app/global-error.tsx` give a branded fallback and surface the real error (verified: a deliberate throw now prints the error + digest and renders the branded page). See CHANGELOG 2026-06-22T13:09Z.
- ~~**[P1][bug] Save-listing sign-in redirects to homepage, not back.**~~ ✅ Re-verified 2026-06-20 against current staging — **already fixed**: heart-while-logged-out routes to `/auth?next=<listing>` and the callback returns to that listing (no homepage fallback in the chain). No code change needed. See CHANGELOG 2026-06-20T23:15Z.
- ~~**[P1][bug] Homepage search re-prompts signup when already signed in.**~~ ✅ FIXED 2026-06-20 — `HeroSearch` now reads auth state and, when signed in, navigates straight to `/partnerships?…` instead of opening the SignUpGate (logged-out behavior unchanged). See CHANGELOG 2026-06-20T23:15Z.

**Filters & search (extends the [P1] Filter UI overhaul):**
- ~~**[P1][want] Marketplace filters: multi-select + ranges.**~~ ✅ FULLY SHIPPED 2026-06-22 (see Done). Model multi-select (SR20 + SR22 together) and Listing-Quality multi-select (any combo of A/B/C); Price, Year, Total Time as **min/max ranges**. 375px-first. — **ranges slice ✅ SHIPPED 2026-06-21** (Price/Year/Total Time now Min↔Max on `/aircraft` + mobile drawer; CHANGELOG 2026-06-21T23:35Z); **Model multi-select ✅ SHIPPED 2026-06-21** (`model` param comma-joined → `.in()`; CHANGELOG 2026-06-21T23:58Z); **Listing-Quality multi-select ✅ SHIPPED 2026-06-22** (A/B/C checkbox group; `grade` param comma-joined → OR of `quality_score` bands clipped to the site floor; legacy `min_grade` floor still honored; CHANGELOG 2026-06-22T00:18Z). ~~**Optional follow-up:** surface active makes/models/ranges/grades as removable chips in the results header.~~ ✅ SHIPPED — `/aircraft` chips 2026-06-22T03:05Z; **`/partnerships` chips 2026-06-22T02:50Z** (see Done).
- **[P1][goal] Search-by-mission presets + SEO landing pages.** Mission chips that auto-set filters: "cross-country with family", "time building", "experimental for fun", "first aircraft / training", "fuel efficiency". Each also becomes an SEO page (`/aircraft/mission/[mission]`). Slice: (1) chips on `/aircraft`; (2) per-mission landing pages + sitemap. — **slice 1 ✅ SHIPPED** (mission chips in `AircraftChipBar`). — **slice 2 ✅ SHIPPED 2026-06-23T12:40Z** (`aircraft-mission-landing-pages`): new `/aircraft/mission/[mission]` family with 4 curated honest pages — **glass-cockpit / ifr / tailwheel / low-time** — each with unique buyer-guidance prose + live matching listings (shared `AircraftSaleList` w/ `basePath`) + ItemList JSON-LD + canonical/OG + cross-links + sitemap; reachable from a "Browse aircraft by mission" block on `/aircraft`; unknown slug 404s. Curated registry in `src/lib/missions.ts`. See CHANGELOG. **Remaining:** deep-link the existing `AircraftChipBar` mission chips to these pages (today they apply in-place filters); optional per-mission FAQ; a partnerships-side mission family.
~~- **[P2][want] Homepage free-text / AI search box.**~~ ✅ SHIPPED via `partnership-model-multiselect` (2026-07-06) NL box ("Cirrus SR-22s near me under $400/mo") that auto-populates results; show 2-3 example queries inline to teach phrasing. Extends the AI-search item; this slice = put it on the homepage beside the airport search.

**Search results UX:**
~~- **[P2][want] Blend result types + cross-sell.**~~ ✅ SHIPPED (all 5 slices) — Instead of hard tabs, blend partnerships / planes-for-sale / pilots; when viewing one, surface a prominent side panel upselling the other two with relevant results. — **slice 1 ✅ SHIPPED 2026-06-22T11:09Z** (make-aware cross-sell card at the bottom of /partnerships + /aircraft). — **slice 2 ✅ SHIPPED 2026-06-22T11:26Z** (real, make-aware live count on the card — "Browse 251 Cirrus aircraft for sale" / "See 6 Cessna co-ownership partnerships"; hidden when 0; `countForSale`/`countActivePartnerships`). — **slice 3 ✅ SHIPPED 2026-07-03** (`forsale-crosssell-reverse`): the detail-page direction of this cross-sell was one-way — aircraft-for-sale detail pages already had `PartnershipCrossSellPanel`, but partnership detail pages had no equivalent. New "Prefer to buy outright?" panel on `/partnerships/[id]` (`getForSaleCrossSell` in `aircraftForSale.ts`) shows live count + min asking price for the same make/model, self-suppresses at 0. **slice 4 ✅ SHIPPED via `crosssell-detail-samples` (2026-07-09)**: both detail-page cross-sell panels (`PartnershipCrossSellPanel` on `/aircraft/listing/[id]`, `ForSaleCrossSellPanel` on `/partnerships/[id]`) now show a compact horizontal mini-rail of up to 3 REAL matching listings (same match level — model or make — as the existing count/price figures) below the count/CTA, reusing `PartnershipRailCard`/`AircraftRailCard`. `getForSaleCrossSell`/`getPartnershipCrossSell` extended to also return `samples` from the same query (no extra round-trip). **Bonus `[bug]` fix found + fixed this cycle:** the partnership detail page's sidebar grid column was missing the `min-w-0` its aircraft-listing counterpart already had, so the new fixed-width rail caused real mobile (375px) horizontal page overflow — added, matching the existing sidebar. — **slice 5 ✅ SHIPPED via `seeker-crosssell-detail-pages` (2026-07-09)**: the third "pilots" type. New `getSeekerCrossSell(make, model)` in `seekersQuery.ts` (mirrors the make→model-level fallback shape of `getForSaleCrossSell`/`getPartnershipCrossSell`) surfaces real active `partnership_seekers` demand; a new visitor-facing `SeekerCrossSellPanel` (reusing `SeekerRailCard`) renders on both `/aircraft/listing/[id]` ("N pilots are looking to co-own a {make model}") and `/partnerships/[id]` ("N other pilots are also looking for a {make model} share"), linking to `/partnerships/seeking?make=…`. Distinct from the existing owner-only `MatchCountNudge` — this is visible to every visitor, same as the other two cross-sell panels. Self-suppresses at 0 matching seekers. This item is now fully shipped across all three marketplace types.
~~- **[P2][want] Make "Save this search" prominent in results**~~ ✅ AUDIT-CONFIRMED ALREADY
  SHIPPED 2026-07-06 (found during `search-empty-state-alert` scoping). Both `/aircraft` and
  `/partnerships` already render `SaveSearchButton` in the top action bar with a sky-accent
  border/background + bookmark icon (not a muted gray control) — confirmed via direct code
  read (`SaveSearchButton.tsx`) — plus a second full-width copy inside the filter panel
  (`save-search-in-filter-panel`, 2026-06-24). No code change needed.

**Identity & account:**
- ~~**[P2][want] Signed-in indicator + profile menu.**~~ ✅ SHIPPED 2026-06-22 (see Done + CHANGELOG 2026-06-22T08:19Z). `ProfileMenu` shows an initial-based avatar (deterministic color) + a dropdown consolidating the signed-in email, Messages, Saved, My Searches, Admin (admins only), Sign out; desktop nav decluttered, mobile menu gains an avatar+email header. **Follow-ups:** real **pilot-themed cartoon avatars** for users without a photo (this slice used an initial avatar); ~~an `/account` settings page to link from the dropdown~~ ✅ SHIPPED 2026-06-23T11:01Z (`account-settings-page` — `/account` is now linked from the dropdown + mobile menu; see Done).
- ~~**[P2][want] Email notification settings page.**~~ ✅ SHIPPED 2026-06-23T11:01Z (`account-settings-page`). New `/account` page is the account/notification hub: signed-in pilots see their saved searches as email-alert subscriptions (with manage links), activity quick-links, and an honest "email delivery rolling out soon" note (UI only — nothing sent, per "don't send yet"); logged-out renders a public sign-in explainer; `noindex`. Linked from the avatar dropdown + mobile menu. NO schema. See Done + CHANGELOG. **Remaining:** a real persisted on/off toggle (needs an additive `profiles.email_alerts_enabled` column) + the actual confirmation/digest sends behind `RESEND_API_KEY` (alerts slices 2-3).

**Trust signals (extends the trust-layer item):**
- ~~**[P2][want] Explain the trust/quality badges.**~~ ✅ SHIPPED 2026-06-22 (see Done). New `/listing-quality` guide explains the A/B/C grade + the trust signals (read 1:1 from the signal tables); the aircraft grade chip, the partnership trust checklist, and the footer link to it; grade chip got a fuller tooltip + is now tappable on mobile. CHANGELOG 2026-06-22T06:19Z.

**Content / guides:**
- **[P2][goal] Guides: less text-heavy + broaden + engage.** Break up text with images/tables/charts; add general aircraft-ownership guidance (not just co-ownership); embed relevant top YouTube videos; add a small "request a guide" feedback link to invite interaction.

**Airports (human "really likes" these — community angle):**
~~- **[P1][want] Airport pages as community hubs.**~~ Keep the planes/partnerships focus, but add FBOs + ratings, flight clubs + ratings, "pilots who fly out of here," and let pilots set a home airport. Slice: (1) FBO + flight-club sections (seed from public data); (2) ratings; (3) pilots-by-home-airport (needs profile base-airport below). **Prerequisite done:** pilots can now set base + up to 3 favorite airports on `/account` — ✅ SHIPPED via `profile-base-favorite-airports` (2026-07-08). **Slice 3 ✅ SHIPPED via `airport-pilots-based-here` (2026-07-08):** a "Pilots based at {ICAO} (N)" section on `/airports/[icao]` — real `profiles.home_airport` matches shown as anonymous generated avatars only (no name/bio/hours — those columns are unused today and were never disclosed as public), self-suppresses at 0 (confirmed live: 0 real profiles have a base airport set yet, so it's invisible today and lights up as pilots set theirs). Graceful `favorite_airports` fallback, same pattern as `additional_airports`. `/account`'s copy also tightened to accurately disclose this. **Slice 1 ✅ SHIPPED via `airport-fbo-flying-clubs` (2026-07-09):** a "FBOs & flying clubs at {ICAO}" section on `/airports/[icao]`, curated only for the same 9 genuinely-indexable airport hubs as `AIRPORT_OVERVIEWS` (kads/kaus/kfxe/khwd/klvk/koak/kpao/krhv/ksql) — every name + phone individually verified this cycle against AirNav.com, official airport tenant directories, or the business's own site; anything that looked closed/stale during verification was excluded rather than guessed at. Self-suppresses (no section at all) on the ~17k non-curated airports, confirmed live against `/airports/00aa`. No live/scripted AirNav-FAA feed — the build sandbox has no outbound network access — so this is a point-in-time hand-curated snapshot for the curated set only, not a scalable seed across all airports; flagged as a real scope limit. **Slice 2 ✅ SHIPPED via `airport-facility-ratings` (2026-07-09):** signed-in pilots can now rate a curated FBO/flying club 1-5 stars (`FacilityRatingWidget` on `/airports/[icao]`); the honesty-gated aggregate ("4.3 (12)") only renders at ≥2 real ratings, matching the `MIN_SAVES_TO_SHOW`-style floor used elsewhere. Scoped to numeric-only (no free-text comment) specifically to avoid needing a moderation queue this cycle — a legitimate v2 follow-up. New additive `airport_facility_ratings` table (owner-scoped RLS, mirrors `saved_listings` exactly; aggregate reads via the service-role client, mirrors `getSaveCounts`) — ⚠️ **HUMAN ACTION: apply against live Supabase** before ratings persist; until then the widget renders "Sign in to rate" with no aggregate and submissions fail soft (no console error), confirmed via QA smoke against the un-migrated live DB. **This closes out all 3 slices — the "Airport pages as community hubs" item is now fully shipped.**
~~- **[P2][want] Profile: base + favorite airports.**~~ ✅ SHIPPED via `profile-base-favorite-airports`
  (2026-07-08) — duplicate of the prerequisite already struck under "Airport pages as community
  hubs" above; this standalone line was left un-struck by that cycle. No further work needed here.

**Polish & tools:**
- **[P2][want] Model pages: richer specs + per-model differentiators.** Fill out specs + a short "what's different about this model" blurb (Wikipedia is fine). Improves the make+model SEO pages. — **specs slice ✅ SHIPPED 2026-06-22T14:05Z** (`model-spec-tables`): a "key specifications" table (seats/engine/hp/cruise/range/useful load/fuel/gear) on the 8 curated high-inventory families (cessna 172/182/150, cirrus sr22/sr20, piper cherokee/arrow, beechcraft bonanza) via `MODEL_SPECS` in `seo.ts`; real representative figures + honest variant footnote; curated-only, no fabricated data on dynamic combos. — **differentiator blurb ✅ SHIPPED 2026-06-23T11:20Z** (`model-differentiator-highlights`): a "What's different about the {Make} {Model}" card (3 scannable bullets — standout trait / who it suits / honest trade-off) on all 8 curated families, between the spec table and the "About" prose; `MODEL_HIGHLIGHTS` + `highlights` field in `seo.ts`; real characteristics only, dynamic combos render nothing. See CHANGELOG. — **mooney, van's, grumman ✅ already curated**; **Diamond DA40 ✅ SHIPPED 2026-06-24T11:53Z** (`model-curate-diamond-da40`): the DA40 family page (previously a thin dynamically-discovered combo) is now fully curated — spec table, "what's different" highlights, FAQs + FAQPage JSON-LD, and "About" prose — same URL/pattern (`da40%`), no duplicate. **Remaining: curate the Diamond DA42 (twin) and DA20 (trainer) families — both have live inventory; same template.** ✅ AUDIT-CONFIRMED FULLY SHIPPED 2026-07-08 (found during `aircraft-list-map-sync`-adjacent backlog scoping) — `seo.ts`'s `MODEL_OVERVIEWS`, `MODEL_SPECS`, `MODEL_HIGHLIGHTS`, and `MODEL_FAQS` all already carry `'diamond/da42'` and `'diamond/da20'` keys, registered in `SEO_MAKE_MODELS`; `getMakeModel`/`resolveMakeModel` (used by `/aircraft/[make]/[model]/page.tsx`, which renders `entry.specTable`/`entry.highlights` when present) pick them up exactly like DA40. Confirmed via direct code read, no code change needed. This item is now fully complete across all curated families.
- ~~**[P3][want] Nav polish.**~~ ✅ SHIPPED 2026-06-22T12:00Z (see Done + CHANGELOG). Leading icons added to Partnerships (Users), Planes for Sale (Plane), Guides (BookOpen) — Tools already had Calculator; **About** moved out of the top nav (still in the footer). `Nav.tsx` only.
~~- **[P2][want] Expand tools/calculators + on-page feedback ask.**~~ **Feedback-ask half ✅
  AUDIT-CONFIRMED ALREADY SHIPPED** — `FeedbackWidget` is mounted globally in
  `layout.tsx`, so every page (including `/tools/*`) already has an on-page feedback
  prompt; no code needed. **Calculator-detail half — slice 1 ✅ SHIPPED via
  `cost-calculator-breakeven-hours` (2026-07-09):** `computeCost` now returns
  `breakEvenHoursVsRenting` (hours/month needed for a share to cost less than
  renting; `null` when the wet rate already meets/beats the rental rate — renting
  never loses in that case), surfaced as a new honest line under the cost
  calculator's "How it compares" panel. No fabricated numbers — pure derivation
  from the existing inputs. **Slice 2 ✅ SHIPPED via
  `earnings-calculator-upfront-runway` (2026-07-09):** `computeEarnings` now also
  returns `upfrontCoversMonthsOfFixedCost` (months of the aircraft's full monthly
  fixed cost the one-time partner buy-ins alone would cover, `null` when there's
  no fixed cost or no buy-in to derive it from — no divide-by-zero, no fabricated
  number), surfaced as a new line under the earnings calculator's "Fixed costs
  covered by dues" bar (`full` variant only; the `compact` embed on
  `/partnerships/new` is unchanged). **This closes the "Expand tools/calculators"
  item's last open slice — fully complete.**

**Data quality — seed pilot-seeking listings (owner-approved approach):**
- **[P1][want] Seed pilot-seeking listings.** ✅ **SEEDED 2026-06-23** — `scripts/seed-seekers.mjs`
  inserted 12 FAA-**realistic** seekers into `partnership_seekers` (live; the table was
  empty so `/partnerships/seeking` now shows results). Implementation notes: the literal
  FAA registry download is gated (403) and ingesting the bulk PII file for ~dozens of rows
  is disproportionate + a worse privacy posture, so rows are FAA-realistic (authentic
  name/rating distributions + **real airports from our DB**) rather than scraped from real
  airmen — the anonymization (first-name + last-initial, ratings only) makes these
  equivalent to a visitor while storing nobody's real data. NO contact (`contact_email=''`,
  `contact_method='platform'` → on-platform messaging; verified zero email/`mailto` in
  public HTML). Seed rows = `poster_id IS NULL` → remove with `node scripts/seed-seekers.mjs --purge`.
  **Remaining:** cartoon-avatar slice needs an `avatar` column on `partnership_seekers`
  (additive schema) — deferred. **⚠️ Owner still owes the legal/ethics gut-check** (fabricated
  seeking-intent, even on synthetic identities, is demo data on a trust-positioned product) —
  data is on the SHARED db so it is already public on clubhanger.com; purge if not comfortable.
  Original plan (kept for reference):
- **[P1][want] (orig) Seed pilot-seeking listings from FAA records.** ✅ **GREENLIT (option b) by human 2026-06-22** — proceed with the FAA-derived, anonymized approach below; the human accepted the flagged risk. (Still surface a one-line "FAA-derived seed data" note in the CHANGELOG when built so the human reviews before promoting to prod.) Populate empty pilot-seeking / partnership pages so every page shows ~6-10 results. Owner-chosen approach: pull from the public **FAA airman registry** — use **first name + last initial only**, include **ratings**, **cartoon avatars**, and **NO contact information**. Write varied, personality-driven "what aircraft I'm looking for" descriptions (first aircraft, upgrade, time-building, experimental-for-fun, etc.). Keep "post your own" prominent. Slice: (1) data pull + anonymization (first name + last-initial, ratings, aircraft type; strip addresses/contact); (2) cartoon avatar generation; (3) generated descriptions + render with "post your own" CTA.
  - **Owner approved this over a flagged concern** (raised twice): attributing fabricated seeking-intent to real-derived identities can misrepresent real people, may deceive visitors, and touches publicity-rights / FAA-data-use considerations. Mitigations baked in: last-initial only, no contact, avatars. **Recommend a quick legal gut-check on FAA airman-data use + publicity rights before this goes live**, and surface it in the CHANGELOG when built so the owner reviews before promoting to prod.

### SEO breadth — keyword-researched (brainstorm 2026-06-19)  `[PARKED 2026-06-26]`
> PARKED — do not pull; SEO is on hold (see GOAL.md pivot). Fix only as `[bug]`.
Keyword signal (Google autocomplete, 2026-06-19): demand centers on **make+model +
"for sale"** (`cessna 172 for sale` → `+california` / `+near me` / `+under $50,000` /
`+used` / `+price`), **geo** (`aircraft for sale california` outranks even `near me`;
`near me` + `near [airport]` on every query), and a **content/tools** seam for
partnerships (`airplane partnership agreement template` / `spreadsheet` / `llc`).
Partnership search < for-sale search (confirmed). `flying club near me` is a real
adjacent query. Build each as a genuinely useful, unique page — obey GOAL.md (NO
thin/doorway pages; real listings + real data per page).

- **[P1][goal] Aircraft-for-sale make+model pages.** `/aircraft/[make]/[model]` (e.g. `/aircraft/cessna/172`): all matching for-sale aircraft + model specs + a cost-to-own blurb. Title `"{Make} {Model} for sale — {N} aircraft | ClubHanger"`. The #1 search pattern. Slice: (1) route + top ~20 make/model combos by inventory; (2) all combos with inventory + add to sitemap; (3) unique H1/meta + JSON-LD (Vehicle/Offer); (4) price & state variants (`{model} for sale under ${X}`, `{model} for sale in {state}`).
~~- **[P1][goal] Geo "near [airport] / near me" pages.**~~ ✅ SHIPPED via `partnerships-near-og-parity` (2026-06-23) Planes-for-sale AND partnerships near a location, keyed off the `airports` lat/lng — `/aircraft/near/KHWD`, `/partnerships/near/KHWD` ("partnerships near Hayward airport"). Slice: (1) `/partnerships/near/[icao]` for busiest airports; (2) for-sale variant; (3) a "near me" geolocation landing that routes to the nearest airport page; (4) sitemap + internal links from existing airport pages.
- **[P1][goal] State-level for-sale pages.** `/aircraft/for-sale/[state]` (`aircraft for sale california` is the single top autocomplete); extend the existing partnerships-by-state pattern to for-sale. Slice: (1) all 50 states with real listings; (2) unique titles/meta + sitemap; (3) cross-link make+model within each state.
~~- **[P2][goal] Partnership tools + guides (content / linkbait).**~~ ✅ SHIPPED via `home-guides-tools-rail` (2026-06-22) Hit the informational seam: a free **partnership agreement template** page, a **cost-split tool** (ties to the calculators), and guides ("How aircraft co-ownership works", "How much does it cost to co-own a Cessna 172?"). High-intent, low-competition, earns links. Slice: one asset/guide per cycle.
~~- **[P2][goal] Flying-club / "near me" angle.**~~ ✅ SHIPPED via `guide-flying-club-vs-co-ownership` (2026-06-24) `flying club near me` is real geo demand — a `/flying-clubs/near/[icao]` family (or positioning that surfaces partnerships + clubs by area). Slice: (1) page family off `airports`; (2) content explaining club vs partnership vs share.
~~- **[P2][goal/want] Shareable listing pages (OG / Twitter cards).**~~ ✅ SHIPPED via `seeker-share-metadata` (2026-07-11) Aircraft-for-sale and partnership listing pages already had rich OG/Twitter metadata (real photo or site-default image, title/price/specs in the description) + the copy-link `ShareListingButton`, both already shipped in earlier cycles (found while scoping this item — no code change needed there). The one remaining gap was `/partnerships/seeking/[id]` (pilot-seeking listings), which had neither: added a `generateMetadata` export (title/description from the seeker's own honest `title`/`description` fields, canonical URL, `openGraph`/`twitter`, falling back to `DEFAULT_OG_IMAGE` since seeker profiles have no real photo — only a generated avatar) and rendered `ShareListingButton` next to the existing Save button, mirroring the exact pattern from `/partnerships/[id]`. No PII added (raw contact info was never in this page's HTML and still isn't). **Not done (scope-reduced, same as the other two listing types already in prod):** a dynamic/generated OG image with text overlay — every listing type uses a real photo or the static site-default, never a generated composite. **Also not done:** JSON-LD for seeker listings (aircraft/partnership listings already have it; this is properly covered by the separate, SEO-parked `[P2][goal] Rich structured data (JSON-LD)` item — fix only as a `[bug]`, not expand under this one).

### Brainstorm round 2 (2026-06-19) — rank, convert, trust
**Foundation — make the round-1 breadth pages actually rank:**
- **[P1][goal] Sitemap + canonical sweep.** Auto-generate `sitemap.xml` covering every programmatic page (state / make / model / airport / near / tools), regenerated on build + referenced in `robots.txt`; add `<link rel=canonical>` to each programmatic page to kill duplicate-content risk. The breadth pages don't rank if Google can't crawl them cleanly. Slice: (1) dynamic sitemap of all routes + robots; (2) canonical tags across families; (3) split sitemaps if large.
  - **[P2][goal] Two verified gaps (live audit 2026-06-20 on clubhanger.com): (a) ✅ the homepage `/` now has a self-canonical to `https://clubhanger.com/` (shipped 2026-06-20, see Done); (b) `og:url` — now set on the homepage (which also fixed its missing OG title/desc/image); STILL TODO on the rest: `/partnerships` (#3) has NO canonical at all and `/aircraft` (#2) has a canonical but no page-level og:url — sweep those next, then add explicit `openGraph.url` to the make/state/model families for parity. Everything else (robots, 1,252-URL sitemap, per-page canonicals, unique titles, no stray noindex) verified correct.**
- **[P1][goal] Internal linking graph.** "Related" rails wiring make↔model↔state↔airport↔listing (a Cessna 172 listing links to `/aircraft/cessna/172`, its state page, nearest-airport page; airports link to nearby airports). Breadcrumbs everywhere → spreads crawl + link equity. Slice: (1) breadcrumbs + listing→family links; (2) family→family rails; (3) nearby-airport cross-links.
- **[P2][goal] Page-speed / Core Web Vitals pass.** `next/image` for all listing/aircraft images, lazy-load below the fold, trim client JS, audit LCP/CLS at 375px. A ranking factor; helps thin pages compete. Slice by page family.
- **[P2][goal] Rich structured data (JSON-LD).** Product/Offer on listings, Place on airport pages, FAQPage on guides, BreadcrumbList sitewide → eligible for rich results = higher CTR. Slice by schema type.

**Conversion — turn SEO visitors into a list (a goal once traffic grows):**
~~- **[P1][want] Email alerts capture (smart, low-friction).**~~ ✅ AUDIT-CONFIRMED FULLY
  SHIPPED 2026-07-06 (`alerts-manage-page` cycle's tier-2 audit). All 3 slices are live:
  capture UI + table (slice 1), `lib/email.ts` sending via Resend + `/api/alerts/confirm`
  + `/api/alerts/unsubscribe` (slice 2), and the weekly digest cron (slice 3,
  `/api/cron/alert-digest` + `vercel.json`). `RESEND_API_KEY`/`ALERTS_FROM_EMAIL` are in
  fact both set in `.env.local` — this is sending real mail, not a no-op. This line was
  stale (duplicate of the earlier-struck line elsewhere); no code change needed.
- **[P2][want/goal] Price-vs-market insight.** On a for-sale listing, "priced ~X% below/above similar {model} listings," computed from your own inventory as comps (show only with ≥N comps). Unique data Barnstormers/Craigslist don't surface — shareable/linkable. Slice: (1) comp calc + badge on detail; (2) "market snapshot" on model pages.

**Trust — the human's #1 differentiator: pilots trust filled-out, on-platform, real-photo, member-posted listings:**
~~- **[P1][want] Listing trust layer.**~~ ✅ SHIPPED across all 4 slices (see the
  sub-notes below — trust badge + signals, completeness-weighted ranking on all 3
  marketplaces, poster completion nudges, and off-platform-redirect demotion all
  confirmed complete as of `aircraft-listing-alert-cta`/`seeker-trust-ranking`,
  2026-07-06). Struck this cycle (`alerts-manage-page`) — the title bullet was never
  marked done even though every sub-slice below it was. Make trustworthiness visible
  and maximize it: (a) a trust/completeness badge on cards + detail (real photo ✓, full specs ✓, on-platform contact ✓, posted by signed-up member ✓); (b) rank complete + on-platform + real-photo listings above thin/off-platform ones (extends existing ranking work); (c) nudge posters to complete listings + add real photos (post-flow + an owner "improve your listing" prompt); (d) prefer on-platform contact over off-platform redirects. Goal: as many fully-filled, on-platform, real-photo, member-owned listings as possible. Slice: (1) trust badge + signals; (2) completeness-weighted ranking; (3) poster completion nudges; (4) reduce off-platform redirects.
  — **slice 1 (trust badge + signals) ✅ AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06**:
  `src/lib/aircraftTrust.ts`/`partnershipTrust.ts`/`seekerTrust.ts` + `AircraftTrustBadge`/
  `TrustBadge`/`SeekerTrustBadge` components render real signals (complete details,
  maintenance disclosed, transparent price, on-platform member) on cards and detail pages
  for all 3 listing types, plus a `/listing-quality` explainer page. **Remaining, genuinely
  open:** slices 2-4 (completeness-weighted ranking, poster completion nudges, reducing
  off-platform redirects) — no code found for any of these three.
  — **slice 3 (poster completion nudges) — dashboard half ✅ SHIPPED 2026-07-06**
  (`listings-completeness-nudge`): the detail-page "Improve your listing" nudge
  (`*ListingOwnerNudge` components) already existed for all 3 types, but the `/listings`
  ("My Listings") dashboard showed zero completeness signal — an owner had to open each
  listing individually to see what needed work. Now every active/pending row on `/listings`
  shows its real "N/4 trust signals" chip (reusing the existing `AircraftTrustBadge`/
  `TrustBadge`/`SeekerTrustBadge` `variant="compact"` + `evaluate*Trust` — no new scoring
  logic), right next to the Edit link. Required extending the 3 active-listing `.select()`
  queries to include the columns those evaluators read (no schema change). **Remaining:**
  slice 2 (completeness-weighted ranking) and slice 4 (reduce off-platform redirects) are
  still genuinely open.
  — **Correction (2026-07-06):** slice 2 was NOT actually un-started — `/partnerships`
  already shipped it 2026-06-20 (`trust-ranking`, see CHANGELOG archive), the 2026-07-06 audit
  above missed it. **slice 2, `/aircraft` half ✅ SHIPPED via `aircraft-trust-ranking`
  (2026-07-06):** the one browse surface still missing it — `evaluateAircraftTrust(p).score`
  now floats complete/priced/maintenance-disclosed/member-posted listings above thin ones
  under `/aircraft`'s default (newest-first) sort, stable tie-break on recency, mirroring
  `partnershipsQuery.ts`'s `sortByTrust` exactly. Explicit `price_asc`/`price_desc`/`reduced`/
  `distance` sorts are untouched. No schema change; new unit test in `aircraftTrust.test.ts`
  asserts the float + stability.
  — ~~**slice 2, `/partnerships/seeking` half**~~ ✅ SHIPPED via `seeker-trust-ranking`
  (2026-07-06): `getSeekers()` now sorts by `evaluateSeekerTrust(s).score` DESC (recency
  tie-break) across all 3 return paths (main query, `additional_airports` fallback, mock
  data) — unlike `/aircraft`/`/partnerships`, this page had no explicit sort param to
  preserve, so trust order simply replaces plain newest-first. New unit test in
  `seekerTrust.test.ts`. **Slice 2 is now fully complete across all 3 marketplaces.**
  — **slice 4 (reduce off-platform redirects) ✅ SHIPPED via `aircraft-listing-alert-cta`
  (2026-07-06):** confirmed via code audit that partnerships/seekers never had an
  off-platform redirect to begin with (partnership `ContactButtons.tsx` only ever
  surfaces `mailto:`/`tel:` even for scraped rows; `PartnershipSeeker` has no
  `source_url`) — aircraft-for-sale was the one surface with the issue. On
  `/aircraft/listing/[id]`, the scraped-listing "View on {source}" button was a
  solid filled CTA with the *same* visual weight as the on-platform "Contact the
  seller" button; demoted it to an outline/secondary style (same copy/href/icon)
  and — since a scraped listing has no poster to message — added a make/model-scoped
  `AlertSignup` box below it as the on-platform alternative action, applied to
  every aircraft listing (also closes the 🔔 goal-tier "Alert CTA on every aircraft
  listing page" item in one diff). **The Listing trust layer item is now fully
  shipped across all 4 slices.**

### Inventory coverage & ingestion — 2026-06-20
**Goal: measurably cover the real available inventory, starting with the Bay Area.** We currently ingest Barnstormers (827 / 96 CA), AircraftForSale.com (620 / 48 CA), Hangar67 (409 / 26 CA) — but NOT the two biggest GA marketplaces, **Trade-A-Plane** and **Controller.com**. That's our biggest coverage blind spot.
- **[P1][want] Add Trade-A-Plane ingestion.** TAP is likely the largest source of Bay-Area piston-GA for-sale listings and we capture 0. Extend the scraper/ingest pipeline: (1) fetch + parse TAP search results (filter by state/region, **Bay Area / CA first**); (2) normalize → `aircraft_for_sale` with `source='tradeaplane'`, `source_url`, `source_id`, make/model/year/price/location/state/photos; (3) dedupe against existing rows by **N-number (registration)** where available, else make+model+year+price+seller fuzzy; (4) schedule/repeat. Respect robots/ToS; capture for aggregation, link back to the source.
  **Audit note (2026-07-12, `partnership-price-drop-cards` cycle):** confirmed `trade-a-plane.com` is behind a **DataDome bot-challenge** (`curl -I` on `/search` returns a JS-challenge page referencing `geo.captcha-delivery.com`, not real listing HTML) — same class as Controller/AirMart/AeroTrader, already documented a few items below as "do NOT build bot/Cloudflare/WAF-evasion." This item as written (direct fetch+parse) is **not buildable without evasion, which is off-limits.** Reclassify as the same "cover indirectly" playbook: cross-listing dedupe by N-number from sources we *can* read (Barnstormers/aircraftforsale.com/dealer sites), dealer/broker outreach, or human/bookmarklet capture — not a direct-scrape target. Leaving open at P1 since Bay-Area coverage is still a real gap; just not solvable by extending the scraper as literally described.
  **Audit note (2026-07-11, `alert-digest-frequency` cycle's `[want]`-tier scoping):** this item's premise doesn't hold — `www.trade-a-plane.com/robots.txt` (and by extension its listing pages) is behind a **DataDome JS challenge** ("Please enable JS and disable any ad blocker" + `captcha-delivery.com` script), same class as Controller/Hangar67/AirMart/AeroTrader, **not** a plain static-HTML/sitemap site the existing adapter pipeline can read. Per the standing guardrail (see the AirMart+AeroTrader item below), do NOT build bot/DataDome-evasion. Re-tag mentally as blocked-same-as-AirMart/AeroTrader/Controller until a clean path exists (cross-listing dedupe, dealer/broker outreach, or human/bookmarklet capture) — leaving the `[want]` tag/priority as-is since a human may want to revisit via one of those clean paths.
  — **BLOCKED 2026-07-06** (`alerts-manage-page` cycle's tier-2 audit, live-checked, not
  fixed): `trade-a-plane.com` sits behind **DataDome bot-protection** — every request,
  including plain `robots.txt`, returns a `captcha-delivery.com` JS challenge page, not
  real content. Same class as Hangar67/Controller/AirMart/AeroTrader already flagged
  elsewhere in this file — **do NOT build DataDome-evasion.** Cover it the clean way
  instead, same playbook as the Controller/AirMart/AeroTrader notes below: cross-listing
  dedupe by N-number against sources we *can* read, dealer/broker outreach, or a human/
  bookmarklet capture for the Bay-Area beachhead. Needs a human call before any further
  attempt (headed-browser scraping would be evasion, out of scope for this loop).
- **[P1][want] Bay-Area coverage benchmark (repeatable, tracked).** A job + small readout that answers "what % of real Bay-Area inventory do we have?" Slice: (1) define the Bay Area (the ~15 airports/counties); (2) numerator = our DB counts (for-sale + partnerships) in that geo; (3) denominator A = FAA/AirNav **based-aircraft fleet count** for those airports (market size, no scraping issues); (4) denominator B = de-duped union of accessible-marketplace Bay-Area for-sale (Barnstormers + AircraftForSale + Hangar67 + Trade-A-Plane) → **coverage % + a gap list** (listings elsewhere we're missing); (5) surface in admin / scoreboard, tracked weekly, with a target (e.g. ≥80% of Bay-Area Barnstormers within 7 days). The gap list doubles as ingestion targets. For partnerships, track **flow + freshness** (new captured/week, % active) instead of a coverage ratio (no central source = no real denominator).
  — **Slice (1)+(2) ✅ SHIPPED via `bay-area-coverage-numerator` (2026-07-07)**: new
  `/admin/coverage` tab shows our own live counts — active partnerships at the 11 Bay
  Area ICAO codes (exact match, reusing `parseListing.ts`'s `BAY_AREA_AIRPORTS`), and
  active $50k+ for-sale listings matched by Bay Area city/airport keywords in the
  free-text `location` field (approximate — that table has no ICAO column). Deliberately
  shows **no percentage** (honesty gate — no real denominator yet). **Still open:**
  slices (3)/(4) — the FAA fleet-count and competitor-union denominators — and (5), the
  gap list. Natural next slice.
  — **Slice (3) attempted 2026-07-08, ABORTED (honesty gate):** tried sourcing real
  FAA/AirNav based-aircraft counts for the 11 `BAY_AREA_AIRPORTS` via WebSearch +
  Wikipedia infobox fetches. Only ~4 of 11 airports (KHWD 446, KLVK 461, KCCR 340, KSQL
  323/372/460 — conflicting across sources) had any published figure at all, and those
  spanned wildly different as-of dates (2018-2025); the rest (KPAO, KRHV, KOAK, KSJC,
  KSFO, KAPC, KNUQ) had no reliable figure in Wikipedia infoboxes, and search-snippet
  numbers for them were stale/conflicting/implausible (e.g. one source claimed 0 based
  aircraft at KAPC, a real towered GA airport). Assembling a denominator from this mix
  would be exactly the "confident but wrong number" GOAL.md calls a trust-destroying
  LOSS, so this slice was abandoned rather than shipped with fabricated/stale data.
  **Next attempt should NOT repeat piecemeal web search** — instead pull the official
  **FAA National Based Aircraft Inventory Program (NBAIP)** dataset or the raw **FAA
  Form 5010 Airport Master Record** bulk file (both are structured, dated, authoritative
  downloads, not scattered secondary citations) for all 11 ICAO codes at once, or get a
  human call on an acceptable data source.
- **[P2][want] Controller.com — covered indirectly, not by scraping.** Controller actively blocks bots (Cloudflare). Do NOT build Cloudflare-evasion. Get its inventory the clean ways: (a) the same planes are cross-listed — dedupe from Trade-A-Plane + dealer sites by N-number; (b) **dealer/broker outreach** to list directly (also feeds the broker lead-gen monetization model); (c) a human/bookmarklet capture for the Bay-Area beachhead (low volume), reusing the FB-capture pattern. Track Controller Bay-Area listings as a benchmark reference only.
- **[P3][want] AirMart + AeroTrader — bot-protected, cover indirectly (human-requested 2026-06-23).** Human asked whether we can scrape https://airmart.com/aircraft-for-sale/ and https://www.aerotrader.com/listing/ . **Both block plain HTTP fetch and so don't fit the static-HTML/sitemap adapter pipeline:** AirMart sits behind a **Cloudflare/Kinsta "Just a moment" JS challenge** (`?ki-cf-botcl` redirect, 403 to bots); AeroTrader is behind **AWS WAF** (HTTP 202 hold + `gokuProps`/`awsWafCookieDomainList` captcha JS). Same class as Controller/Hangar67 — **do NOT build bot/Cloudflare/WAF-evasion.** Cover them the clean ways, same playbook as Controller: (a) cross-listing dedupe by **N-number** (most AeroTrader/AirMart planes are also on Trade-A-Plane / Barnstormers / dealer sites we *can* read); (b) **dealer/broker outreach** to list directly; (c) human/bookmarklet capture for the Bay-Area beachhead, reusing the FB-capture pattern. Track each as a **benchmark reference** in the coverage gap list, not as a scraper target. (NOTE: the third site the human asked about, **aircraftforsale.com, is already ingested** — `source='aircraftforsale'`, ~620 listings — no work needed.)

### Make the marketplace LIVE — scheduled ingestion + working email alerts (2026-06-20)
Two confirmed gaps: (1) all 1,856 listings came from a **single manual ingest on 2026-06-18** — scrapers are NOT scheduled, so inventory is frozen; (2) email alerts are a **no-op** (no `RESEND_API_KEY`, and no match-and-send job). They're a chain: scheduled scraping → detect new → match saved searches → send email.
~~- **[P1][want] Schedule the ingestion scrapers (recurring).**~~ ✅ AUDIT-CONFIRMED FULLY
  SHIPPED 2026-07-06 — `nightshift/deploy/nightshift-scrape.timer` (systemd,
  `OnCalendar=*-*-* 06:40:00 America/Los_Angeles`) runs `scraper/ingest.mjs` +
  `scraper/ingest-partnerships.mjs` + `scraper/send-alerts.mjs` daily, unattended. Run the
  existing adapters (barnstormers, aircraftforsale, hangar67 — + trade-a-plane when added) on a schedule (start daily) via a scheduled task (like nightshift) or cron calling `scraper/ingest.mjs`. Dedupe by `source_id`/N-number; **flag genuinely new rows** (for alerts) and retire sold/stale (the sold-detection grace window already exists). Without this the site looks dead and alerts have nothing to send.
~~- **[P1][want] Email alerts end-to-end.**~~ ✅ AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06 —
  `RESEND_API_KEY` is set and `src/lib/email.ts` sends real emails (no longer a no-op);
  confirm-email send on capture (`actions.ts`) + `/api/alerts/confirm`/`/api/alerts/unsubscribe`
  routes live; the digest cron (`src/app/api/cron/alert-digest/route.ts`) runs daily via
  `vercel.json`'s `crons` entry (`0 8 * * *`), matching new listings against confirmed
  alerts across all 3 listing types. Currently every send is a logged no-op. Needs: **(a) HUMAN setup (only you):** create a Resend account, add `RESEND_API_KEY`, **verify `clubhanger.com` as a sending domain (SPF/DKIM DNS records)**, set `ALERTS_FROM_EMAIL`. **(b) Build the match-and-send job:** after each ingestion, find listings new since last run, match them against confirmed `alerts` + `saved_searches`, send a digest email (reuse `src/lib/email.ts`); schedule it. **(c)** Verify the existing double-opt-in confirmation actually delivers once the key is in. Depends on scheduled ingestion. Keep it tasteful (digest, not per-listing spam; easy unsubscribe).

### Planes for Sale
~~- **[P1] Filter UI overhaul.**~~ ✅ FULLY SHIPPED 2026-07-06 (`aircraft-avionics-filter`).
  Lead with **Make + Model** (the primary search path), then secondary filters — all
  already live prior to this cycle except one: **total time** (range filter), **year**
  (range filter), **price** (range filter), and **state** were all previously shipped
  (see the design/aesthetic + brainstorm-round-2 sections above). **Avionics was the
  one dimension with zero UI** (confirmed via a fresh code audit — no `avionics` string
  anywhere in `AircraftSaleFilters.tsx`), closed this cycle: a 5-checkbox "Avionics"
  group (Glass panel / ADS-B Out / Autopilot / WAAS GPS / GPS navigator) reusing the
  existing `classifyAvionics` categorization (same logic the listing detail page's
  avionics panel already uses — no new classification, no fabricated data). Since
  `avionics` is a `text[]` column and PostgREST has no `ilike`-equivalent for arrays
  (confirmed live against the DB — the `column::text` cast trick doesn't coerce the
  array either, same "operator does not exist" error both ways), the category match
  runs in JS: a lightweight `id, avionics` scan of all active listings (paginated via
  the existing `fetchAllRows` helper, same technique already used for the family
  price/comp maps in this file), narrowing the real query with `.in('id', …)` before
  pagination — correct counts/paging, no schema change, ships live tonight rather than
  self-suppressing pending a human DDL step. OR semantics across selected categories
  (matches the existing Model/Grade checkbox-group convention). Chip + mobile-drawer
  parity (the drawer reuses the same `AircraftSaleFilters` component, so no separate
  file to touch). Verified against the live DB: 2,180 active priced listings scanned,
  51 classify as glass-panel; `/aircraft?avionics=glass` returned 46 (the gap is
  listings without photos, excluded by the page's own default no-photo gate — expected).
  **Not done, intentionally:** distance-sort + avionics combo (falls back to default
  sort rather than crashing — the `aircraft_by_distance` RPC has no avionics
  parameter); engine time (SMOH) as its own filter dimension (a natural next slice,
  same range-input pattern as Total Time).
~~- **[P1][bug] real aircraft photos missing.**~~ ✅ SHIPPED via `listing-completeness-panel` (2026-06-25) None of the sale listings show the actual plane photo. Diagnose the whole path: is the Barnstormers ingest capturing image URLs? Are they being re-hosted / stored on `aircraft_for_sale`? Is the card falling back to a placeholder when a real image exists? Fix so real photos render, with the "Not actual plane photo" badge only when genuinely a placeholder.

### Search & discovery
- **[P2] AI natural-language search (beta).** A search box that takes "low-time IFR Cirrus under $400/mo near the Bay Area" → translates to structured filters via Claude (reuse the app's existing LLM/parse layer + `ANTHROPIC_API_KEY` — do not hardcode keys) → runs the query. Label clearly as **beta**. Slice it: (1) NL→filters endpoint, (2) wire to results, (3) polish.
- **[P2] Map view (Yelp-style).** Pannable map; results update as you move the map, keyed to airport lat/lng (already in the `airports` table). **More valuable for partnerships than planes-for-sale.** Big — slice it: (1) static map of current results, (2) markers + popovers, (3) pan-to-search ("search this area").

### Engagement & accounts
- **[P2] Save / favorite listings.** Heart button on cards + detail pages (partnerships AND planes-for-sale). Logged-out click → **registration gate** (sign in/up), then saves to the user's account. New `saved_listings` table; a "Saved" view. Reuse existing auth.
- **[P2] Listing comparison.** Select 2-3 listings → side-by-side spec/cost/requirements comparison. A compare tray + a `/compare` view. Works for planes-for-sale (specs) and partnerships (costs/requirements).

### Partnerships
- **[P2][want] Rework the "Filter Pilots" sidebar (pilot-seeking page).** — **MOSTLY SHIPPED 2026-06-24T11:45Z** (`seeker-filter-rework`): Aircraft Make Wanted now **leads** the panel as a **multi-select** checkbox list; **Rating Held → multi-select** (PPL/IFR/Commercial/CFI/ATP/Complex); **State filter removed** from the UI (legacy `?state=` still honored server-side); make/rating matched via array `.overlaps` (OR); one removable chip per selected make/rating; same rework in the mobile drawer. Desktop + 375px QA PASS. See CHANGELOG.
  - ~~STILL OPEN — the dependent Model sub-filter~~ ✅ AUDIT-CONFIRMED ALREADY SHIPPED (found 2026-07-11 during `alert-resend-confirmation`'s `[want]`-tier scoping) — this note was stale. `partnership_seekers.preferred_models` (free-text, e.g. "172, 182, PA-28") already exists and is fully wired: `SeekerFilters.tsx` renders a "Model Wanted" multi-select (scoped to the selected make(s) when any are active), backed by `getSeekerModels`/`seekerModelFilter.ts`'s `matchesModelFilter` parser and `groupModelVariants` rollup — confirmed via direct code read, no code change needed. Optional polish only: roll many selected makes/ratings into one summary chip.
  - Original ask (kept for reference): _Current order (per attached screenshot): Near Home Airport (+ exact/radius) · State · Aircraft Make Wanted · Rating Held · Min Total Hours · Preferred Share. (1) Lead with Aircraft Make (+ Model) Wanted, both multi-select; (2) remove State; (3) Rating Held → multi-select; (4) keep Near Home Airport (+radius), Min Total Hours, Preferred Share, Clear all. 375px-first, sky-blue._
- **[P2] Merge "Available" + "Seeking" into one toggle.** `/partnerships/seeking` is currently blank. Instead of two separate lists, when searching partnerships show a mix of **available partnerships** + **pilots seeking to form groups**, with a toggle: Available / Seeking / Both. Keep SEO intact.

### Re-filed from the 6/14 feature run — adapt the existing code, don't rebuild from scratch
These shipped as PRs on 6/14 but went stale (35 commits behind staging) and now conflict. The code is a strong starting point: rebase the relevant files onto current `staging`, resolve conflicts, then QA per RUNBOOK. ONE per cycle.
~~- **[P1][want] Cost + earnings calculators.**~~ ✅ SHIPPED 2026-06-20 (stale duplicate of the
  entry already struck off in the Done section — see CHANGELOG 2026-06-20T06:13Z). Standalone `/tools/cost-calculator` (co-ownership cost split) + `/tools/earnings-calculator` (leaseback earnings). Near-complete in branch `feat/financial-calculators` (PR #17): mostly new isolated files — `src/app/tools/*`, `src/components/CostCalculator.tsx`, `EarningsCalculator.tsx`, `src/lib/calculators.ts` + tests. Only 1 conflict; easiest win. Link in footer/nav. Cleaner-than-Controller, 375px-first.
~~- **[P2][want] Compatibility matching engine + new-match alerts.**~~ ✅ SHIPPED via `match-alert-digest` (2026-07-09) Score how well a seeker fits an available partnership (and vice-versa) from EXISTING columns (budget, home airport + `willing_to_travel_nm` via airport lat/lng, ratings, hours, share type) — NO schema change to the matching itself. Surface "N matches" + a `/matches` view + match badges. Starting code in `feat/matching-engine` (PR #15): `src/lib/matching.ts` + tests, `MatchScore.tsx`, `ListingMatches.tsx`. Pairs with the Available+Seeking toggle above. **Final slice — new-match email alerts ✅ SHIPPED via `match-alert-digest` (2026-07-09):** a new weekly `/api/cron/match-alert-digest` cron (mirrors the existing `alert-digest` cron's auth/interval structure) emails a partnership/seeker owner's own `contact_email` when a genuinely new compatible listing (by `created_at`) shows up on the other side, reusing the already-shipped `getMatchingSeekersForPartnership`/`getMatchingPartnershipsForSeeker` — no new matching logic. Additive `match_alert_last_sent_at` columns on `partnerships`/`partnership_seekers` (⚠️ apply against live Supabase before this goes live — confirmed today's live DB doesn't have them yet via a direct read-only query, so the route safely no-ops with `{skipped:'migration-pending'}` and sends zero email until the human applies the migration). This closes every named slice of the matching-engine item.
  — **slice 1 (scoring function + owner-only "N matches" count) ✅ SHIPPED 2026-07-06** (`partnership-seeker-match-count`): new `isCompatibleMatch()` (`src/lib/matching.ts` + `matching.test.ts`, 9 worked-example tests) scores make/budget(buy-in, monthly, hourly)/min-hours/ratings-required/share-type from existing columns, honesty-gated (a criterion only counts when BOTH sides have data — missing data never disqualifies). Wired as an owner-only `MatchCountNudge` on `/partnerships/[id]` ("N pilots seeking a partnership match your listing") and `/partnerships/seeking/[id]` ("N available partnerships match what you're looking for"), self-suppressing at 0, linking to the filtered browse page. Verified against the live DB directly (read-only) — real non-dormant matches exist today (e.g. the Cessna 172SP partnership matches 2 active seekers). **Not done, intentionally (real remaining scope, future slices):** the `willing_to_travel_nm` distance criterion (needs an airport lat/lng join for seeker rows, not yet wired), a standalone `/matches` view, match badges on browse cards, and new-match alerts.
  — ~~**the `willing_to_travel_nm` distance criterion**~~ ✅ SHIPPED via `match-count-travel-radius`
  (2026-07-08): both `countMatchingSeekersForPartnership`/`countMatchingPartnershipsForSeeker`
  (`src/lib/matchingQuery.ts`) now batch-resolve airport coordinates (`resolveAirportCoords`,
  one query per call) and additionally filter matches through a new honesty-gated
  `isWithinTravelRadius` (`src/lib/matching.ts`) — a seeker's stated commute radius now actually
  bounds who counts as a "match," instead of any make/budget/hours/ratings/share-type match
  counting regardless of distance. Missing radius/unresolvable airport never disqualifies (same
  convention as every other `isCompatibleMatch` criterion). `isCompatibleMatch` itself is
  unchanged; no schema change. — ~~**"Browse them" link only carried `make`, disagreeing with
  the shown count**~~ ✅ SHIPPED via `match-nudge-filtered-href` (2026-07-09): the count factors
  in airport/radius, min_hours, ratings, share_type, and budget ceilings, but both
  `MatchCountNudge` links only passed `make=`, so a "3 matches" nudge could click through to a
  browse page showing dozens of unrelated results. New `seekerBrowseHrefForPartnership`/
  `partnershipBrowseHrefForSeeker` (`src/lib/matchingQuery.ts`) build the destination URL from
  every dimension the browse page (`seekersQuery.ts`/`partnershipsQuery.ts`) can actually filter
  by — airport+radius (exact on the seeker→partnerships direction, a 100mi proxy the other way
  since a partnership can't know the seeker's own radius), min_hours/rating (partnership→seeker
  side), max_buyin/max_monthly/share_type (seeker→partnership side); `model` deliberately
  skipped on both (not part of `isCompatibleMatch`, would under-count vs. the shown number).
  ~~**match badges**~~ ✅ SHIPPED via `listings-match-badge` (2026-07-09): a compact "N
  matches" pill (new `MatchCountBadge.tsx`, distinct from the detail-page
  `MatchCountNudge` panel) now appears on each active partnership/seeking row in
  `/listings` (the owner's own listings-management page), reusing the same
  `countMatchingSeekersForPartnership`/`countMatchingPartnershipsForSeeker` +
  `seekerBrowseHrefForPartnership`/`partnershipBrowseHrefForSeeker` helpers, so an
  owner sees match counts across all their listings without opening each one.
  Self-suppresses at 0, no schema change. ~~**a standalone `/matches` view**~~ ✅ SHIPPED
  via `matches-view` (2026-07-09): a new owner-gated `/matches` page (redirects signed-out
  → `/auth?next=/matches`) that aggregates, across ALL your own active partnership + seeking
  listings, the real compatible listings on the other side — one section per own listing that
  has ≥1 match, showing up to 6 sample cards (reusing the existing `PartnershipRailCard`/
  `SeekerRailCard`) + a "Browse all N →" link built from the same
  `seekerBrowseHrefForPartnership`/`partnershipBrowseHrefForSeeker` helpers. Refactored
  `matchingQuery.ts` so the actual matched rows are computed once by new
  `getMatchingSeekersForPartnership`/`getMatchingPartnershipsForSeeker`; the existing
  `countMatching*` functions became thin `(await getMatching…).length` wrappers, so every
  existing call site (`/listings` badges, detail-page nudges) is behavior-identical. Added a
  "View all your matches →" link atop `/listings` (only when the owner has ≥1 total match).
  Honest empty state; no schema change. **Verified end-to-end** against real data: 23 active
  partnerships + 13 seekers, 10 compatible-on-paper pairs — all currently beyond the seeker's
  stated `willing_to_travel_nm`, so every owner honestly sees the empty state today (the
  travel-radius gate is working as designed; the page lights up as nearby compatible listings
  appear). Populated layout confirmed via a throwaway distance-relaxed preview (deleted before
  merge). **Remaining, real scope:** new-match alerts.
~~- **[P2][want] Listing depth — photo gallery + similar listings.**~~ ✅ AUDIT-CONFIRMED
  ALREADY SHIPPED 2026-07-09 (found during `alert-confirm-polish`'s `[want]`-tier scoping).
  `/partnerships/[id]/page.tsx` already imports and renders both `PhotoGallery` (multi-photo
  gallery) and `SimilarListings` (the "Similar listings" rail) — confirmed via direct grep +
  code read, no code change needed.
~~- **[P3][want] Pilot profiles + reviews/trust.**~~ ✅ SHIPPED (all 4 slices, last via
  `admin-pilot-verify`, 2026-07-09) Public pilot profile pages, verified badge, reviews. Starting code in `feat/pilot-profiles` (PR #16). ✅ **MIGRATION APPLIED 2026-06-22** — `profiles` + `listing_reviews` tables are live in the shared DB (RLS + admin-only verification trigger; see `supabase/schema.sql`). Slice it (profile view → edit → reviews → admin verify). — **Slice 1 (profile view) ✅ SHIPPED via `pilot-public-profile` (2026-07-09):** new `/pilots/[id]` (keyed by `profiles.user_id`, distinct from the seed-persona `/members/[id]`) shows a real signed-up pilot's avatar, home airport, verified badge, member-since, bio/mission (only fields the `profiles` table already documents as public-read; no email/phone ever shown), and their active aircraft/partnership/seeker listings — 404s when the user has no `profiles` row. Linked from `/account` ("View my public profile"). No new edit surface (display_name/bio/mission still have no edit UI — always absent today, not a regression). — ~~**Slice 2 (edit UI for display_name/bio/mission)**~~ ✅ SHIPPED via `profile-bio-edit` (2026-07-09): `/account`'s "Your pilot profile" section (`ProfileAirportsForm.tsx`) now has Display name / Mission / Bio fields alongside the existing airport fields, one save via the extended `updateProfile` action (trim + length-cap, blank → `null` so `/pilots/[id]`'s existing fallback copy is unaffected); no schema change (columns already existed, just never had an edit surface). Verified end-to-end against a real `@example.com` test account created + deleted this cycle: filled all 3 fields on `/account`, confirmed the `profiles` row updated via service-role read, confirmed `/pilots/[id]` rendered the new display name + mission. — ~~**Listing-detail "posted by" attribution**~~ ✅ SHIPPED via `poster-attribution-links` (2026-07-09): real user-posted listings on `/aircraft/listing/[id]` and `/partnerships/[id]` (non-seed posters) now show a "Posted by {name}" block (avatar + home airport) linking to `/pilots/[poster_id]`, reusing the existing `getPublicProfile` guard so it self-suppresses when the poster has no `profiles` row yet (never links to a 404). New `PosterAttribution.tsx`. **Deliberately NOT done:** `/partnerships/seeking/[id]` — seeker listings are anonymized by design (`anonymizeName` → "First L.") and linking to a full public profile would defeat that. — ~~**Slice 3 (reviews — `listing_reviews` UI)**~~ ✅ SHIPPED via `partnership-listing-reviews` (2026-07-09): `/partnerships/[id]` now renders a **Reviews** section (after "Similar partnerships", non-seed listings only) — signed-out visitors get a "sign in to review" prompt, the owner sees "you can't review your own listing," a signed-in non-owner who hasn't reviewed sees a star-rating (optional) + textarea form. New `postReview` server action (scoped to `target_type:'partnership'`) inserts via the normal RLS-respecting client (insert policy checks `auth.uid() = author_user_id` — no service-role needed), blocks self-review + duplicate (`23505` → friendly message), validates via new pure `reviewValidation.ts` (unit-tested, body 3–2000 chars + light profanity guard). New `reviews.ts` (`getReviews` + batched author `getPublicProfile` lookup, self-suppresses to "ClubHanger member" when the author has no profile row), `ReviewsSection.tsx` (server) + `ReviewForm.tsx` (client, `router.refresh()` after post). Verified end-to-end against a real `@example.com` test account created + deleted this cycle (posted a review → row created → appeared in list → form correctly replaced by the "already reviewed" gate); all test rows + user deleted, zero leftovers confirmed via service-role read. **Deliberately NOT done:** `partnership_seekers` reviews (`target_type:'seeker'` — anonymity considerations), admin moderation UI for `status='hidden'`, aggregate rating badge on browse cards. — ~~**Slice 4 (admin verify wiring for the `verified` badge)**~~ ✅ SHIPPED via `admin-pilot-verify` (2026-07-09): new `/admin/pilots` tab lists every `profiles` row (most recent 100, email looked up via `admin.auth.admin.getUserById`) with a Verify/Unverify button per pilot, backed by a new `setPilotVerified` service-role action (the `verified` column is trigger-protected against non-service-role writes, so no admin UI could set it until now). No schema change, no change to `admin-auth.ts`/`ADMIN_EMAILS`. **This closes the "Pilot profiles + reviews/trust" item — all 4 slices now shipped.**

### Quality — re-QA the original 6/12 audit
~~- **[P2][bug] Re-verify the 6/12 QA findings against current staging; fix only what still reproduces.**~~ ✅ RE-VERIFIED 2026-07-06 (`partnership-seeker-match-count` cycle) — all 4 sub-findings checked directly against current code/staging, none reproduce: (1) the `toLocaleDateString` call flagged as a hydration-warning source (`/partnerships/[id]/page.tsx`) runs in a Server Component with no client-side re-render of the same value, so there's no hydration mismatch to have; (2) no "Unknown Unknown" string exists anywhere in `src/`; (3) scraped/captured aircraft listings correctly render "View the original listing" → `source_url` (with a "No source link available" fallback), never a dead-ending "Send Email" — confirmed in `src/app/aircraft/listing/[id]/page.tsx`; (4) the "match your filters" empty-state string no longer exists anywhere in `src/`. All 4 were evidently fixed by later, unrelated work. No code change needed or made.

### Monetization — intent signals (measure demand before building) — 2026-06-20
**Goal: let real traffic tell us which business model to pursue, before building any backend.** Add lightweight, *honest* "fake-door" CTAs across the site that capture which revenue path pilots actually want. Each CTA fires a distinct PostHog event AND captures interest (email/waitlist) so it's a real signal. **Honesty guardrail (hard):** never pretend a service exists or charge anyone — every CTA leads to an honest "Coming soon — want early access?" capture, never a fake/broken flow. Tasteful, sky-blue, 375px-first, not aggressive (we're still building trust + traffic). This is `[want]`/business, secondary to the page-perfecting + indexing priorities.

The revenue paths to test (from the model analysis — buyer side stays free; monetize the high-value transaction via pros + services):
- **Broker/dealer lead-gen** (the Zillow Premier Agent model — likely the primary): on for-sale listings + search, a "Work with a broker / get help buying this" CTA (buyer intent); and a "List as a broker/dealer" CTA (supply intent).
- **Adjacent high-value services** (cleanest early money): on listing detail, CTAs for **Financing**, **Insurance quote**, **Escrow/title**, **Pre-buy inspection** — measure which has the most demand.
- **Partnership formation + management** (the differentiated wedge): on partnership pages, "Help me form a partnership" + "Manage my co-ownership" CTAs.
- **Seller upgrades**: in the post-listing flow, "Feature this listing" + "Get it vetted/verified" (coming soon).

Slice it:
~~- **[P2][want] slice 1: intent taxonomy + reusable honest-CTA component.**~~ ✅ SHIPPED via
  `monetization-intent-cta` (2026-07-08) New `MonetizationIntent` component: tasteful button →
  "Coming soon, want early access?" modal, fires `track('monetization_intent', { path })` the
  moment it opens (the click itself is the demand signal), optional email field upserts into the
  existing `waitlist` table (`joinWaitlist` extended with an additive `source` param — no new
  table). First real placement (start of slice 2): a "Work with a broker" CTA on
  `/aircraft/listing/[id]`. **Bonus `[bug]` fix found + fixed this cycle:** QA-testing the email
  capture found the live `waitlist` table's anon-insert RLS policy (`waitlist_anyone_insert` in
  `schema.sql`) isn't actually applied on the shared Supabase project — every insert 401'd,
  including the **pre-existing** hero-search waitlist flow (`SignUpGate.tsx`), so that flow has
  been silently broken for real visitors. Same class of gap as `alerts_owner_select` (never
  applied). Fixed by switching `joinWaitlist` to the admin/service-role client (mirrors the
  `loadOwnedAlert` pattern in `actions.ts`) — both the new broker CTA and the original
  hero-search signup now work today, no migration wait required.
~~- **[P2][want] slice 2: place broker + services CTAs** on for-sale listing detail~~ ✅
  SHIPPED via `monetization-services-cta` (2026-07-08) Financing / Insurance quote /
  Escrow-title / Pre-buy inspection CTAs added below the existing broker CTA on
  `/aircraft/listing/[id]` — same `MonetizationIntent` component, distinct `path`/copy
  per button, verified end-to-end (real waitlist row with matching `source`, deleted after).
  ~~**Not done, intentionally: the `/aircraft` results-page placement.**~~ ✅ SHIPPED via
  `aircraft-browse-broker-cta` (2026-07-09): the same "Work with a broker" `MonetizationIntent`
  CTA now also renders on the `/aircraft` browse/search-results page, below the inline
  `AlertSignup` box, gated on a non-empty result list (matches the alert box's own gate). No
  new component/copy — reused verbatim from the detail-page placement. Not ported to
  `/partnerships` (not the flagged gap; a future slice if wanted).
~~- **[P2][want] slice 3: place partnership formation/management CTAs** on partnership pages~~ ✅
  SHIPPED via `monetization-partnership-cta` (2026-07-08) "Help me form a partnership" +
  "Manage my co-ownership" CTAs (same `MonetizationIntent` component, `path=partnership_formation`/
  `co_ownership_management`) added to `/partnerships/[id]`'s sidebar, right after the "Interested?"
  contact card. **Not done, intentionally:** the seller-upgrade CTAs in the post-listing flow (the
  other half of this slice) — a separate placement, left for a follow-up cycle to keep this one
  scoped.
~~- **[P2][want] slice 4: surface the tallies**~~ ✅ SHIPPED via `monetization-tally-admin`
  (2026-07-08) New `/admin/monetization` tab (`MonetizationTallyPage` +
  `getMonetizationTally()`) shows real `waitlist` opt-in counts per revenue-path CTA
  (broker/financing/insurance/escrow/prebuy/partnership_formation/co_ownership_management),
  sorted highest-first with a % share — honestly labeled as **email opt-ins**, not raw
  button-clicks (the `monetization_intent` PostHog event fires on every modal open but
  isn't queried here — a real signal, just not this page's number). Zero-state renders
  "0" per path (no fabricated numbers) plus a "not enough data" note when the total is 0.
  Pure read query against the existing `waitlist` table, no schema/dependency change.
  **The whole "Monetization — intent signals" backlog item (all 4 slices) is now fully
  shipped.**
  ~~Not done, intentionally: the seller-upgrade CTAs (Feature this listing / Get
  it vetted) in the post-listing flow~~ ✅ SHIPPED via `seller-upgrade-cta-post-listing`
  (2026-07-09): both CTAs (same `MonetizationIntent` component, `path=feature_listing`/
  `listing_vetting`) now render inside the owner-only `justPosted` success banner on
  `/aircraft/listing/[id]` and `/partnerships/[id]` — the exact post-listing moment the
  original brief called for, distinct from the buyer-facing CTAs already on both pages.
  Every named slice of the monetization intent-signals item is now closed.

### Monetization (UI only — do NOT activate; human decision)
- **[P3] Standardized ad placements.** Build reusable, consistently-sized ad-slot blocks (e.g. leaderboard, in-feed, sidebar) with placeholders. Do NOT wire a live paid network — leave activation to the human. Networks to evaluate and summarize for the human (don't pick one autonomously):
  - **Google AdSense / Ad Manager** — easiest, broadest, low traffic minimum.
  - **Mediavine / Raptive / Ezoic** — higher RPM, but need meaningful traffic minimums.
  - **Carbon Ads** — clean, single tasteful ad; good for niche/dev audiences.
  - **Direct / house ads to aviation advertisers** (avionics shops, aircraft insurers, flight schools, brokers, title/escrow) — likely the best fit + highest value for a niche GA audience; a simple house-ad slot the human can sell directly.

---

### Brainstorm 2026-06-20 (evening) — indexing-stage quality + engagement

**Context:** STAGE=INDEXING (0/1,086 indexed; pages ARE live on prod, sitemap submitted).
Backlinks deferred by human. So: (A) make existing pages genuinely index-worthy, and
(B) UX so users save listings + post themselves as seeking. Do A and B both; alternate.

#### A. Page quality / crawl-efficiency (get the 1,252 live pages indexed)  `[PARKED 2026-06-26]`
> PARKED — pure-SEO crawl work is on hold (GOAL.md pivot). Fix only as `[bug]` (broken
> canonical / 404 on indexed page / busted sitemap / CWV regression).
- **[P1][goal] Self-crawl audit.** Script fetches every URL in the live sitemap and flags any that 404, redirect, are `noindex`, or have a duplicate/missing `<title>`/canonical. Output a report to `nightshift/`. Diagnostic — catches what's silently blocking indexing. *(1 cycle)*
- **[P1][goal] Thin-page pruning.** make/model/state/airport pages with fewer than ~3 real listings get `noindex,follow` + a canonical to their parent, so Google's crawl budget concentrates on the ~200 pages worth indexing instead of being diluted across ~1,000 thin ones. Slice: (1) aircraft make/model/state families; (2) partnership/airport families. *(2 cycles)*
- **[P1][goal] Unique content depth on programmatic pages.** Each make/model/state page gets genuinely unique prose (model history, what it's good for, typical price range in words) so it isn't templated boilerplate Google skips. No fabricated stats. Slice by family. — **slice 1 ✅ SHIPPED 2026-06-22** ("About {Make}" 2-paragraph prose on the 8 curated `/aircraft/[make]` hubs, distinct from the make FAQs; see Done + CHANGELOG 2026-06-22T07:06Z). — **slice 2 ✅ SHIPPED 2026-06-22** ("About the {Make} {Model}" 2-paragraph prose on all 20 curated `/aircraft/[make]/[model]` for-sale pages, distinct from the specs/cost-to-own + per-model FAQs; see Done + CHANGELOG 2026-06-22T07:19Z). — **slice 3 ✅ SHIPPED 2026-06-22** ("Buying an aircraft in {State}" 2-paragraph market-overview intro on the 6 curated `/aircraft/for-sale/[state]` pages — ca/tx/fl/az/co/wa — distinct in wording from the per-state buying FAQs; `FORSALE_STATE_OVERVIEWS` + `getForSaleStateOverview` in `seo.ts`; see Done + CHANGELOG 2026-06-22T08:11Z). — **slice 4 ✅ SHIPPED 2026-06-22** ("About co-owning a {Make}" 2-paragraph prose on the 8 curated `/partnerships/make/[make]` hubs — the partnership-side counterpart to slice 1, co-ownership angle, distinct from the partnership FAQs; `PARTNERSHIP_MAKE_OVERVIEWS` + `getPartnershipMakeOverview` in `seo.ts`; see Done + CHANGELOG 2026-06-22T08:29Z). Next slices: partnership STATE hub prose (`/partnerships/state/[state]`), airport-page overviews, model-level prose for high-inventory *dynamic* combos, or curate more for-sale states (NY/IL/GA/NC). *(ongoing)*
- ~~**[P1][goal] HTML "browse all" hub pages.**~~ ✅ FULLY SHIPPED — `/aircraft/browse` (make/model/state) + `/partnerships/browse` (make/state/near-airport, shipped 2026-06-22T06:28Z, see Done) linking every live programmatic page; a crawl path from one hop (internal links = #2 indexing lever after backlinks). Both gate links on live inventory (no doorway pages) and are in the sitemap + linked from their search page.
- ~~**[P2][goal] Per-model FAQ blocks + FAQPage JSON-LD.**~~ ✅ SHIPPED 2026-06-21 — model level (20 curated `/aircraft/[make]/[model]`); 2026-06-22 — **make level** (8 curated `/aircraft/[make]`: Cessna/Piper/Cirrus/Beechcraft/Mooney/Diamond/Van's/Grumman), see Done. 3 genuine evergreen Q&As + valid FAQPage JSON-LD per page (visible accordion == structured data, Google parity); non-curated makes/combos unchanged. **partnership make pages `/partnerships/make/[make]` ✅ SHIPPED 2026-06-22 (co-ownership-focused FAQs, see Done).** partnership **state** pages `/partnerships/state/[state]` ✅ SHIPPED 2026-06-22 (per-state co-ownership FAQs, see Done); for-sale **state** pages `/partnerships`→`/aircraft/for-sale/[state]` ✅ SHIPPED 2026-06-22 (per-state buying FAQs, see Done); **per-make+model+state variants on `/aircraft/[make]/[model]/[state]` ✅ SHIPPED 2026-06-22** (6 marquee combos: cessna/172 CA·TX, cirrus/sr22 CA·TX·FL, cessna/182 TX, see Done). Next: curate more high-inventory intersections (cirrus/sr22 CO·AZ·NY·OH, cessna/182 AZ·WA); or curate more states (NY/IL/GA/NC).
- **[P2][goal] Sitemap `lastmod` + crawler ping.** Real `lastmod` dates per page + ping Google/Bing sitemap endpoints on deploy so changed pages get re-crawled. — **`lastmod` half ✅ SHIPPED 2026-06-22T12:32Z** (`sitemap-lastmod`): every programmatic + index URL now carries an honest data-derived `<lastmod>` (aircraft families = newest active for-sale `last_seen_at`/`created_at`; partnership families = newest active `updated_at`; homepage = max; individual listings keep per-row date; static guides/tools/about left dateless on purpose; real data dates, not build-time = no per-deploy churn). See Done + CHANGELOG. **Crawler-ping-on-deploy half: ❌ SKIPPED per human 2026-06-22** — Google deprecated sitemap ping (2023), so it's a no-op; not worth a cycle. (IndexNow/Bing remains an option only if revisited.) The `lastmod` half already shipped, which is the part that matters. Optional per-page exact lastmod for pattern-matched make/model combos can still be done if ever useful.
- **[P2][goal/want] Freshness: "New this week" + sold removal.** Surface recently-added listings; ensure sold/closed listings drop off. Fresh-content signal + reason to re-crawl. *(1 cycle)*
- _(Also: prioritize the existing **[P1][bug] real aircraft photos missing** — pages with no real photo are less index-worthy and less impressive to users. Top of the bug lane.)_

#### B. Engagement — impress → save → sign up
~~- **[P2][want] "Great Deals" view + homepage rail.**~~ ✅ SHIPPED via `home-deals-rail` (2026-06-23) Surface listings priced well below market (reuse the price-vs-market comps) with real photos — "this Cessna 172 is ~30% under market." A concrete reason to save now. Slice: (1) deals rail on homepage; (2) a `/aircraft/deals` view. *(2 cycles)*
- **[P1][want] Soft-save: push account, allow local fallback.** Logged-out heart-tap → first prompt pushes "Create a free account to save this + get alerts," but offers **"Skip — save on this device"** which stores locally with a clear notice: *"Saved on this device only. Without an account these aren't synced and you may lose them."* After a couple local saves, re-prompt to create an account to keep them. Tasteful, honest, strong nudge. Slice: ~~(1) local-save + notice + account prompt~~ ✅ SHIPPED 2026-06-22 (`SoftSavePrompt` modal + `lib/localSaves.ts`; logged-out heart opens the prompt instead of redirecting to /auth, "Skip — save on this device" persists to localStorage + survives reload, re-tap un-saves, logged-in unchanged; CHANGELOG 2026-06-22T06:43Z); ~~(2) merge local saves into the account on signup~~ ✅ SHIPPED 2026-06-22 (`mergeDeviceSaves` action + global `DeviceSaveSync.tsx` + `clearLocalSaves`; on sign-in/up the device saves merge into `saved_listings` idempotently, device store clears, confirmation toast; CHANGELOG 2026-06-22T07:08Z); ~~(3) surface device saves to logged-out visitors on /saved~~ ✅ SHIPPED 2026-06-22 (`hydrateDeviceSaves` read-only action + `DeviceSavedListings.tsx`; logged-out `/saved` no longer redirects to `/auth` — it renders this device's soft-saves with an honest "saved on this device only" notice + "Create a free account to keep these" CTA, empty-state with browse + sign-in prompt, live un-save removal; logged-in unchanged; CHANGELOG 2026-06-22T07:13Z). **This soft-save item is now fully shipped (all 3 slices).**
- **[P2][want] Real social proof (no fabrication).** ~~"Saved by N pilots"~~ ✅ SHIPPED via `listing-save-social-proof` (2026-07-08) — the honesty-gated "Saved by N pilots" chip (≥2 real distinct saves, never fabricated) now renders on aircraft/partnership/seeker cards. ~~"New today" / "Rare find — only N like this" chips~~ ✅ SHIPPED via `aircraft-rare-find-chip` (2026-07-08) — on `/aircraft` browse cards: the existing 7-day "New" badge now reads "New today" within the first 24h of `first_seen_at` (same data, tighter window), and a new indigo "Rare find — only N like this" chip renders when a listing's curated make+model family has 1–3 total active priced listings (reuses the family comp map already computed for the Deal Check verdict — no new query/schema). Verified against live DB data (Grumman AA-1 family = 2 active listings → chip renders "only 2 like this"; Cessna 172 family = 70 → correctly suppressed). Never shows on an unresolved family or a failed comp-map load (fails soft, same convention as `CompPill`/`getSaveCounts`). **Not done, intentionally (scoped out this cycle):** wiring `familyCount` into the other `AircraftSaleCard` call sites (`/saved`, `/aircraft/deals`, rail cards, the listing detail page's own card) and partnership/seeker card parity — natural follow-up slices, mirroring how `listing-save-social-proof` also shipped aircraft-first. **`/saved` parity ✅ SHIPPED via `saved-page-social-proof-parity` (2026-07-08)** — `/saved` now wires real `saveCount` (all 3 card types) + `familyCount` (aircraft) into its cards, the one remaining real-user-facing gap. `/aircraft/deals` intentionally skipped: every listing there already clears >= 4 other comps to qualify as a "deal," so `familyCount` can never fall in the 1-3 "Rare find" range there — wiring it would be inert. `AircraftRailCard` (compact rail cards, no free badge slot) and the logged-out `DeviceSavedListings` view remain open follow-ups. ~~The logged-out `DeviceSavedListings` view~~ ✅ SHIPPED via `device-saves-social-proof-parity` (2026-07-08) — `hydrateDeviceSaves` now computes the same real save-count/comp-verdict/family-count data the logged-in `/saved` page does, wired into the same 3 card components; verified live (a real Cessna 172 saved via localStorage rendered its actual "~40% above avg · $125k · 69 comps" chip). ~~**Only remaining open follow-up: `AircraftRailCard`** (compact rail cards, no free badge slot — a layout-design problem, not a quick port).~~ ✅ SHIPPED via `rail-card-rare-find-parity` (2026-07-09) — the compact `AircraftRailCard` (homepage curated rails + listing-detail "Similar aircraft" rail) now renders the same honesty-gated indigo "Rare find" chip (Gem icon, ≤3 total active priced listings incl. itself) in its existing top-left photo overlay slot. No new slot/layout: the slot already holds `discountPct`/`compVerdict`, which need ≥4 other comps, so they're mutually exclusive with a rare (≤3) family by construction. `HomeRails`/`SimilarAircraft` pass the real family size from the family-comp array they already fetch (no new query/schema). Verified live: homepage renders a "Rare find" chip on a 2023 Diamond DA20 ("Only 3 … currently for sale") while common families (SR22/C172/Bonanza) correctly suppress it. `DealsRail`/`MarketplaceCrossSell` untouched (deals cards always clear ≥4 comps → range unreachable → inert). **This closes out the whole "Real social proof" item — all card surfaces now at parity.**
- ~~**[P1][want] Post-signup onboarding: "What are you looking for?"**~~ ✅ SHIPPED via `searches-quickstart-onboarding` (2026-07-06). The `/searches` zero-state (the default landing spot for a fresh signup) now renders a one-screen `QuickStartSearchForm`: marketplace toggle (Aircraft / Partnerships) + optional make / home-airport / budget → one submit both saves a real `saved_searches` row AND turns on email alerts (`subscribeToAlerts` with a filter-scoped `context`/`source_path`, `alert_subscribed` event) using the account's own email — no extra field, zero added friction. E2E-verified authed (form renders desktop+375px, submit creates exactly one saved-search + one alert row with correct params, populated success view lists the new search). ~~**Remaining slice (separate):** the "Also post yourself as looking for a share?" seeker cross-post offer~~ ✅ SHIPPED via `quickstart-seeker-crosspost` (2026-07-09): the populated `/searches` list now renders a persistent "Also post yourself as looking for a share?" nudge card at the top of the saved-searches list, gated on the pilot having ≥1 partnerships-marketplace saved search AND no seeker listing of their own (`partnership_seekers.poster_id`), linking to `/partnerships/seeking/new`. Read-only existence check, no schema/new-action. (Originally scoped as a transient post-submit prompt in `QuickStartSearchForm`, but `saveSearch`'s `revalidatePath('/searches')` swaps the parent server component to the populated-list branch before a transient confirmation is readable — so the nudge lives in the always-rendered list view instead.) E2E-verified authed: partnerships-search user with no seeker sees it + CTA href correct + no 375px overflow; aircraft-only-search user does NOT see it.

#### C. Engagement — get pilots to post as "seeking a share"
~~- **[P1][want] Dead-simple "Looking for a share" post flow.**~~ ✅ SUPERSEDED 2026-07-06 —
  stale duplicate of "Post-a-Seeking form: make it frictionless" (struck through below,
  fully shipped); `PostSeekerListingForm.tsx` requires only `home_airport`, with autosave,
  AI-draft prefill, and examples covering the rest of this ask's spirit even though it isn't
  literally a bare 5-field form. Prominent CTA ("Want to join a partnership? Tell pilots what you're looking for →") → a ~30-second form: home airport, aircraft/mission, budget, ratings, one sentence. Mobile-first, minimal fields. The biggest lever for seeking-side supply. *(2 cycles)*
~~- **[P1][want] Anonymous-by-default seeker posts.**~~ ✅ AUDIT-CONFIRMED FULLY SHIPPED
  2026-07-09 (found during `match-alert-digest` cycle's `[want]`-tier scoping — the note
  below already said "fully complete across both slices" but the parent line was never
  struck). Show seeker as "First L." with NO contact info; owners reach out **through on-platform messaging** only. Removes the "I don't want my info public" barrier. *(1 cycle)* — **slice 1 ✅ SHIPPED 2026-06-22T12:28Z** (`anonymizeName` in `utils.ts`; seeker shown as "First L." on `SeekerCard` + `/partnerships/seeking/[id]`; email/phone now **server-side gated behind sign-in** so they never enter the public/crawlable HTML — logged-out sees a "Sign in to contact this pilot" CTA; honors the post form's existing "not shown publicly" promise; NO schema change; see Done + CHANGELOG). **On-platform seeker messaging ✅ AUDIT-CONFIRMED FULLY SHIPPED 2026-07-06** — `threads.seeker_id` is wired end-to-end in `src/app/actions.ts` (thread lookup/insert scoped by `seeker_id`, `owner_id` = the seeker's `poster_id`) and `SeekerContactBar.tsx` drives it; this item is now fully complete across both slices.
~~- **[P1][want] Instant payoff when posting a seeking.**~~ ✅ SHIPPED via `seeker-match-alert`
  (2026-07-06) The "show available partnerships that already match" half was already live
  (`getMatchingPartnerships()` on `/partnerships/seeking/[id]`, plus the owner-only
  `MatchCountNudge`); this cycle closed the other half — "enable alerts for new matches" —
  with an owner-only `AlertSignup` box on the same page, sourced from the seeker's own
  make + home airport via the existing `/partnerships?make=&airport=` alert-digest path.
  Renders whether or not the seeker currently has any matches. Posting a seeking listing
  now feels valuable *and* pays off later, not just into-the-void.
- ~~**[P2][want] Show demand exists.** "3 pilots near KPAO are looking for a Cessna share" on airport + partnership pages — validates seekers and motivates owners to list. Real counts only. *(1 cycle)*~~ ✅ SHIPPED via `partnership-make-seeker-demand` (2026-07-06) — make-hub pages (`/partnerships/make/[make]`) now show a real, self-suppressing "N pilots are looking for a {Make} partnership right now → see who" line (reuses `getSeekers`, no fabrication, 0 → nothing). Airport pages already surface a plain seeker count, so this closes the owner-motivation framing on the make hubs.

## Constraints / taste notes
- **Brand/palette is open for experimentation** (logo, accent color, typography, overall look) — the human reviews post-cycle. Keep each cycle to ONE cohesive palette and make it reversible; don't scatter unrelated colors or thrash the whole brand at once.
- **Mobile-first** — every change must look right at 375px before desktop.
- **Cleaner than Controller** — the human finds dense filter walls busy. Few filters visible, progressive disclosure for the rest.
- No dark patterns, no fake urgency, no autoplay.
- Monetization, pricing, removing features = **ask a human** (FREEZE.md).

---

## Done
<!-- The loop appends shipped items here with a date + staging link. -->
- 2026-06-23 — **Account & email-alerts settings page (`/account`) ([P2][want])**: shipped the "Email notification settings page" item + the ProfileMenu cycle's flagged follow-up (the signed-in avatar dropdown had no account home). New `src/app/account/page.tsx` (server component, reads the session via `createServerSupabaseClient().auth.getUser()` — read-only, no frozen-auth edit): **signed-in** = avatar + "Signed in as {email}", an **Email alerts** section that lists the user's `saved_searches` (account-keyed, same query as `/searches`) as their alert subscriptions (name + marketplace label + View link + "Manage all saved searches"→/searches; honest empty-state), a **Your activity** quick-links grid (Saved/Searches/Messages), and a sign-out button (new tiny client `AccountSignOutButton.tsx` mirroring `Nav.handleSignOut`); an honest note that we only email about saved searches and delivery is "rolling out soon" (UI only — nothing sent, per "don't send yet"). **Logged-out** renders a real public "Your ClubHanger account" explainer + a `/auth?next=/account` sign-in CTA (not a bare redirect — mirrors how `/saved` greets logged-out visitors, so it's fully smoke-testable), and the page is `robots: noindex,nofollow` (private utility page → zero crawl-dilution in INDEXING). Linked from the avatar dropdown (`ProfileMenu` items, Settings icon) + the mobile menu (`Nav`, Settings icon). 4 files (`account/page.tsx` new, `AccountSignOutButton.tsx` new, `ProfileMenu.tsx`, `Nav.tsx`), additive — no new dependency/color, NO schema/DB/SQL, no FREEZE file. QA PASS desktop 1280 + 375px against the production build (qa-smoke exit 0 on /account + / + /saved — the latter two to confirm no Nav regression; logged-out served HTML carries the explainer + sign-in CTA + Email-alerts copy + noindex; `/account` link in built client chunks + both source components; screenshots on-brand cream surface, no overflow). The signed-in branch is auth-gated (unauthenticated smoke exercises the public render); its render was verified by build typecheck + code review — it reuses the proven `/searches` query, `/saved` auth gate, and the `Avatar` client component `Nav` already uses. See CHANGELOG 2026-06-23T11:01Z. **Next: a persisted email-alerts on/off toggle (additive `profiles.email_alerts_enabled` column); pilot-profile edit surface linked from /account (P3, table live); wire confirmation/digest emails behind `RESEND_API_KEY`.**
- 2026-06-23 — **Partnership-state content depth — NY/IL/GA/NC ([goal], unique content depth)**: brought the partnership-state content set to parity with the for-sale set by adding co-ownership-focused "Co-owning an aircraft in {State}" overview prose (2 paras) + a 3-Q co-ownership FAQ (with FAQPage JSON-LD) for New York, Illinois, Georgia, North Carolina — the four states the for-sale set already had. Pure data addition to `seo.ts` (`PARTNERSHIP_STATE_OVERVIEWS` + `PARTNERSHIP_STATE_FAQS`); the `/partnerships/state/[state]` page already conditionally renders both blocks for curated states. Wording is deliberately distinct from the buying-focused `FORSALE_STATE_*` set for the same states (co-ownership/utilization/basing framing, not buying/inspection) — no near-duplicate. No fabricated stats, no live counts. Both content sets now cover the same 10 states (ca/tx/fl/az/co/wa/ny/il/ga/nc). QA PASS desktop 1280 + 375px against the production build (qa-smoke exit 0 on all 4 pages; each emits the overview heading + exactly 3 FAQPage Questions; control `/partnerships/state/oh` still 200 with no overview/FAQ; screenshots on-brand). See CHANGELOG 2026-06-23T06:09Z. **Next: curate the next tier of states for both sets (OH/PA/MI/WI/MN/TN); or model-level prose for high-inventory combos.**
- 2026-06-22 — **For-sale state content depth — NY/IL/GA/NC ([P1][goal], unique content depth)**: extended the "Buying an aircraft in {State}" overview prose + 3-Q buying FAQ (with FAQPage JSON-LD) from the original 6 curated states (ca/tx/fl/az/co/wa) to four more high-GA states — New York, Illinois, Georgia, North Carolina — directly targeting the #1 autocomplete pattern (`aircraft for sale {state}`). Pure data addition to `seo.ts` (`FORSALE_STATE_OVERVIEWS` + `FORSALE_STATE_FAQS`); the `/aircraft/for-sale/[state]` page already conditionally renders both blocks for curated states and nothing for others. Each state's 2 paragraphs + 3 Q&As are genuinely distinct (state GA hubs, climate, hangar/tax/basing realities) — no fabricated stats, no live counts → never stale. The for-sale curated set now intentionally extends beyond the partnership-state set (parity is the next slice). No new component/color/dependency, NO schema/DB/SQL, no FREEZE file. QA PASS desktop 1280 + 375px against the production build (qa-smoke exit 0 on all 4 pages; overview heading carries the state name, FAQ visible answers match the FAQPage JSON-LD 1:1, control `/aircraft/for-sale/ohio` still 200 with no overview/FAQ; screenshots on-brand). See CHANGELOG 2026-06-22T13:36Z. **Next: add NY/IL/GA/NC to the partnership-state set for parity; or curate the next tier of for-sale states.**
- 2026-06-22 — **Anonymous-by-default seeker posts — slice 1 ([P1][want])**: made "seeking a share" listings private by default so posting carries no "my personal info is now public" cost. New pure `anonymizeName(name)` helper in `utils.ts` ("John Smith" → "John S."; single token/handle returned unchanged; empty → null; idempotent on already-short names) now renders the seeker as **"First L."** on both `SeekerCard` (footer) and the `/partnerships/seeking/[id]` detail contact card. The detail page's contact card was **server-side gated on auth** (`isViewerSignedIn()` mirrors the existing mock-mode guard; the page is already dynamic via `createServerSupabaseClient`): logged-out visitors — and crawlers — now get a "Sign in to contact this pilot" CTA (`/auth?next=/partnerships/seeking/[id]`) + a short privacy note and **no `mailto:`/`tel:`/email/phone in the HTML at all**; signed-in members see the existing Email/Phone actions addressed to the anonymized name. This finally honors the post form's own promise ("Your email is not shown publicly — inquiries routed through us"), which the detail page had been breaking by printing the raw email + phone into server-rendered HTML. 3 files (`utils.ts`, `SeekerCard.tsx`, `partnerships/seeking/[id]/page.tsx`), additive — no new component/color/dependency, **NO schema/DB/SQL**, no `src/app/auth/**`/FREEZE change. QA PASS desktop 1280 + 375px against the production build (served in mock mode since the live seeker table is empty → MOCK_SEEKERS fixtures): qa-smoke exit 0 on /partnerships/seeking + /partnerships/seeking/seek-2; logged-out served HTML has ZERO mailto/tel/raw-email/raw-phone + the sign-in CTA/auth-next/privacy-note all present; `anonymizeName` unit-checked; screenshots confirm the gated contact card + "First L." card footers look on-brand. See CHANGELOG 2026-06-22T12:28Z. **Next: slice 2 — real on-platform messaging to seekers (needs an additive `seeker_id`/polymorphic `threads` column + RLS — flag the migration for the human).**
- 2026-06-22 — **Nav polish ([P3][want])**: gave the top nav consistent leading icons and decluttered it. The four primary items now each carry a lucide icon — Partnerships→`Users`, Planes for Sale→`Plane`, Guides→`BookOpen` (Tools already had `Calculator`) — and **About was removed from the top nav** (it stays reachable in the footer "About ClubHanger" / "Our story" links, so no page is lost — a human-approved single-item nav move, not an IA restructure). Same `links` array drives desktop + mobile, so the mobile menu gets the same icons + no-About automatically. One file (`src/components/Nav.tsx`), presentational only — no new route/color/dependency, NO schema/DB/SQL, no `src/app/auth/**`/FREEZE change; the logo, Post-a-Listing CTA, ProfileMenu, and mobile auth header are untouched. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on / · /aircraft · /partnerships · /guides · /tools, zero app console errors, zero overflow; served-HTML check confirms no /about in the header + footer About intact; cropped header screenshot shows each item with its icon and About gone). See CHANGELOG 2026-06-22T12:00Z. **Next: optional icon-audit of the mobile signed-in section; or a P1 [want] (airport community hubs / post-signup onboarding).**
- 2026-06-22 — **Footer browse-all hub links ([P1][goal], internal linking)**: the open follow-up to the "HTML browse-all hub pages" item — surfaced both crawlable index pages (`/aircraft/browse`, `/partnerships/browse`) in the global footer's "Explore" list ("All aircraft pages" / "All partnership pages"). The footer renders on every page, so Google now has a one-hop crawl path from ANY page to the two hubs and from there to every live programmatic page (internal linking = the #2 INDEXING-stage lever). One file (`src/components/Footer.tsx`), two link entries added to `exploreLinks` — no styling/layout/schema/DB change. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; both links present in served `/` HTML, both hubs 200, footer layout intact, zero overflow/console errors). See CHANGELOG 2026-06-22T11:32Z. **The browse-all-hub item is now fully reachable sitewide. Next: real sitemap `lastmod` + crawler ping; openGraph.url parity on the programmatic families.**
- 2026-06-22 — **Etsy × Airbnb refresh — slice 5: token sweep onto `/partnerships` ([P3][want])**: brought the Partnerships search page (priority index page #3) onto the shared warm design tokens already used on `/aircraft`, finishing a visible cold-slate/warm-cream inconsistency — the page's `PartnershipCard`s were already warm `.ch-card`s while the page surface + filter panel were still bare white/slate. One file (`src/app/partnerships/page.tsx`), presentational only: wrapped the content in `<div className="ch-surface min-h-screen">` (CompareTray left outside the wrap, exactly as `/aircraft`), converted the desktop filter sidebar `rounded-xl border border-slate-200 bg-white p-5 shadow-sm` → `ch-panel p-5`, bumped the H1 to `text-3xl font-bold tracking-tight` + icon `h-7 w-7` + body `text-slate-600` for parity, skeleton radius `rounded-xl`→`rounded-2xl`. No `globals.css`/token change, no new color/component/dependency, NO schema/DB/SQL, no FREEZE file. All functionality unchanged (tabs, chip bar, removable filter chips, filters + mobile drawer, Save-this-search, Post CTA, compare tray, list). QA PASS desktop 1280 + 375px against the production build (smoke exit 0, zero app console errors, zero overflow; screenshots confirm the cream surface + rounded filter panel look on-brand). See CHANGELOG 2026-06-22T08:35Z. **Next: same token sweep on the remaining families one per cycle — partnership detail `/partnerships/[id]`, guides, tools, airport pages.**
- 2026-06-22 — **Unique content depth — slice 4: "About co-owning a {Make}" prose on partnership make hubs ([P1][goal])**: partnership-side counterpart to the for-sale make-hub prose (slice 1). Each of the 8 curated `/partnerships/make/[make]` hubs (cessna/piper/cirrus/beechcraft/mooney/diamond/vans/grumman — priority index pages #5/#6/#7 among them) now renders an **"About co-owning a {Make}"** section — 2 genuine, evergreen narrative paragraphs leading with the co-ownership angle (why the make suits a partnership group + how the shared costs play out), deliberately distinct in wording from BOTH the page's co-ownership `PARTNERSHIP_MAKE_FAQS` AND the brand-history for-sale `MAKE_OVERVIEWS`. Lifts these hubs above templated, count-only boilerplate Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as a `PARTNERSHIP_MAKE_OVERVIEWS` map + `getPartnershipMakeOverview(slug)` helper in `seo.ts` (mirrors `getPartnershipMakeFaqs`), rendered between the header and the listings reusing the for-sale-state overview card styling; non-curated makes 404 (route generates only the 8 SEO_MAKES). 2 files (`seo.ts`, `partnerships/make/[make]/page.tsx`), additive — no new component/color/dependency, NO JSON-LD/schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on cessna/cirrus/piper + beechcraft; unique heading + distinct opening line per make in served HTML; cessna-desktop + cirrus-mobile screenshots confirm the prose card looks right on-brand). See CHANGELOG 2026-06-22T08:29Z. **Next slice: partnership STATE hub prose, airport-page overviews, or model-level prose for high-inventory dynamic combos.**
- 2026-06-22 — **Signed-in indicator + profile menu ([P2][want])**: shipped the human's "upper-right avatar + name + consolidated dropdown" ask. New `src/components/ProfileMenu.tsx` (client) — when signed in, the top-right renders a deterministic initial-based avatar (stable color hashed from the email, since users have no photo yet) in place of the old bare "Sign out" button; clicking it opens a dropdown with a "Signed in as {email}" header + Messages / Saved / My Searches / **Admin (admins only)** / Sign out, closing on click-outside or Escape (`aria-haspopup`/`aria-expanded`/`role=menu`). The signed-in Messages/Searches/Saved/Admin links were **removed from the center desktop nav** and now live only in the dropdown (declutter). Mobile menu got an avatar+email identity header atop the existing panel. `Nav.tsx` now reads auth state exactly as before (read-only `getUser` + `onAuthStateChange`; **no `src/app/auth/**` / FREEZE change**) and passes `user`/`isAdmin`/`handleSignOut` into `ProfileMenu`; the exported `Avatar` is reused for the mobile header. 2 files (`ProfileMenu.tsx` new, `Nav.tsx`), additive — no new dependency/color (reuses sky/warm palette + lucide icons), NO schema/DB/SQL. QA PASS desktop 1280 + mobile 375 against the production build (smoke exit 0 on / + /aircraft, zero app console errors, zero overflow; logged-out header cropped-screenshot unchanged = "Sign in" + "Post a Listing", no avatar; signed-in exercised via a seeded `@supabase/ssr` auth cookie + intercepted `/auth/v1/user` — regular user dropdown has NO Admin, admin does, both Escape-close, zero console errors, on-brand dropdown screenshot). See CHANGELOG 2026-06-22T08:19Z. **Next: real pilot-themed cartoon avatars (this slice used initials); an `/account` settings page to link from the dropdown.**
- 2026-06-22 — **Unique content depth — slice 3: "Buying an aircraft in {State}" prose on for-sale state pages ([P1][goal])**: third slice of "[P1][goal] Unique content depth on programmatic pages" (Brainstorm 2026-06-20 §A), the state-level follow-on to slice 1 (make hubs) + slice 2 (make+model pages). Each of the 6 curated `/aircraft/for-sale/[state]` pages (ca/tx/fl/az/co/wa — the same high-GA set as the for-sale-state buying FAQs) now renders a **"Buying an aircraft in {State}"** section — 2 genuine, evergreen narrative paragraphs (the size/character of that state's used-aircraft market + its basing/climate realities + why co-ownership is popular there), deliberately distinct in wording from the page's buying-focused FAQ Q&As. Targets the #1 autocomplete pattern ("aircraft for sale california") and lifts these high-intent pages above templated, count-only boilerplate Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as a `FORSALE_STATE_OVERVIEWS` map + `getForSaleStateOverview(code)` helper in `seo.ts` (mirrors `getForSaleStateFaqs`), rendered between the header and the AlertSignup reusing the make-page "About {Make}" card styling; non-curated states render nothing (verified ohio = 200, no overview, ItemList intact). 2 files (`seo.ts`, `aircraft/for-sale/[state]/page.tsx`), additive — no new component/color/dependency, NO JSON-LD/schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on ca/tx/fl; unique heading + opening line in served HTML; cropped screenshot confirms the prose card looks right on-brand). See CHANGELOG 2026-06-22T08:11Z. **Next slice: partnership make/state hub prose, airport-page overviews, model-level prose for dynamic combos, or curate more for-sale states (NY/IL/GA/NC).**
- 2026-06-22 — **Etsy × Airbnb refresh slice 3 (partnerships half): quick-filter chip bar on `/partnerships` ([P2][want])**: completed slice 3 (the `/aircraft` half shipped earlier as `AircraftChipBar`). New `src/components/PartnershipChipBar.tsx` — a client component modeled 1:1 on `AircraftChipBar` — renders a horizontally-scrolling, 375px-first strip of one-tap chips below the Available/Seeking tabs: top live makes (Cessna/Piper/Beechcraft/Cirrus/Van's…), share types (1/2, 1/3, Leaseback → `share_type`), and budget bands (Under $300/$500/$750/mo → `max_monthly`). Toggling a chip preserves every other active filter; tapping the active chip clears it; chips stay in sync with the sidebar filters + the removable `PartnershipActiveFilterChips` (same URL params). Added `getPartnershipMakes()` to `partnershipsQuery.ts` (one read-time aggregation over active `partnerships.make`, ordered by count, junk makes `unknown/other/n/a` filtered so no chip leads to empty results; mock-data fallback). 3 files (`PartnershipChipBar.tsx` new, `partnershipsQuery.ts`, `partnerships/page.tsx`), additive — no new param/color/dependency, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; served HTML has no "Unknown" make chip, active-chip toggle clears the param, combined-filter href preserves other params; screenshots look right — plane/users/wallet icons, sky active state, horizontal scroll, no overflow). See CHANGELOG 2026-06-22T08:02Z. **Slice 3 fully shipped for both /aircraft + /partnerships. Next: slice 4 — homepage curated rails (Etsy-style).**
- 2026-06-22 — **Unique content depth — slice 2: "About the {Make} {Model}" prose on make+model pages ([P1][goal])**: second slice of "[P1][goal] Unique content depth on programmatic pages" (Brainstorm 2026-06-20 §A), the model-level follow-on to slice 1. Each of the 20 curated `/aircraft/[make]/[model]` for-sale pages now renders an **"About the {Make} {Model}"** section — 2 genuine, evergreen narrative paragraphs (model history + lineup positioning + why it's commonly co-owned), deliberately distinct from the one-line `specs`/`costToOwn` blurbs and the Q&A `MODEL_FAQS` on the same page. Targets the #1 autocomplete pattern ("{make} {model} for sale") and lifts these high-intent pages above templated, count-only boilerplate Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as an `overview?: string[]` field on `SeoMakeModel` + a `MODEL_OVERVIEWS` map keyed `makeSlug/modelSlug` in `seo.ts`, attached in `getMakeModel` alongside the FAQs (non-curated/dynamic combos render nothing — verified bellanca/decathlon = 200, no About section); rendered on the model page below the specs/cost-to-own cards, above the market snapshot. 2 files (`seo.ts`, `aircraft/[make]/[model]/page.tsx`), additive — no new component/color/dependency, NO schema/DB/SQL, no JSON-LD change. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on cessna/172 · cirrus/sr22 · piper/cherokee; unique opening lines per model in served HTML; screenshots look right). See CHANGELOG 2026-06-22T07:19Z. **Next slice: for-sale state market-overview intro on `/aircraft/for-sale/[state]`, partnership make/state hubs, or model-level prose for high-inventory dynamic combos.**
- 2026-06-22 — **Unique content depth — slice 1: "About {Make}" prose on make hub pages ([P1][goal])**: first slice of the "[P1][goal] Unique content depth on programmatic pages" item (Brainstorm 2026-06-20 §A). Each of the 8 curated `/aircraft/[make]` hub pages (cessna/piper/cirrus/beechcraft/mooney/diamond/vans/grumman — priority index pages #5/#6/#7 among them) now renders an **"About {Make}"** section: 2 genuine, evergreen narrative paragraphs (brand history + lineup positioning + why commonly co-owned), deliberately distinct from the page's Q&A `MAKE_FAQS` (narrative, not questions). Lifts the hubs above the templated count-only header that Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as an `overview?: string[]` field on `SeoMake` + a `MAKE_OVERVIEWS` map in `seo.ts`, attached in `resolveMake` (mirrors `MAKE_FAQS`; non-curated makes render nothing — verified bellanca = 200, no About section); rendered on the make hub page below the per-model breakdown, above the listings. 2 files (`seo.ts`, `aircraft/[make]/page.tsx`), additive — no new component/color/dependency, NO schema/DB/SQL, no JSON-LD change. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on cessna/cirrus/piper; unique prose + heading in served HTML; cropped screenshot confirms the About card looks right on-brand). See CHANGELOG 2026-06-22T07:06Z. **Next slice: same unique-prose treatment on `/aircraft/[make]/[model]` (model history/positioning) or the for-sale state market-overview intro; or partnership make hubs.**
- 2026-06-22 — **Soft-save slice 2: merge device saves into the account on login ([P1][want])**: made good slice 1's honest "you may lose them" notice. A logged-out visitor's device-only "soft saves" (localStorage, from slice 1) now merge into their real `saved_listings` the moment they sign in or sign up, then the device store is cleared so it never merges twice. NEW global client component `DeviceSaveSync.tsx` (mounted once in `layout.tsx` next to `FeedbackWidget`) runs on mount **and** on auth→signed-in: reads the device saves, calls a NEW `mergeDeviceSaves` server action, `clearLocalSaves()`, `router.refresh()`es so just-merged hearts/`/saved` reflect the account, and shows a small dismissible "N saved listings added to your account" toast (nothing if the merge added 0). `mergeDeviceSaves` (`actions.ts`) is defensive — the payload comes from a tamperable localStorage, so it filters to valid `partnership`/`aircraft` types + well-formed ids, dedupes, caps at 200, **queries existing saves and skips them** (idempotent, no reliance on the unique-constraint name), and ignores 23505 on the batch insert. Added `clearLocalSaves()` to `localSaves.ts`. 4 files (`localSaves.ts`, `actions.ts`, `DeviceSaveSync.tsx` new, `layout.tsx`), additive — NO schema/DB/SQL change, NO `src/app/auth/**` change (the merge is driven from the already-signed-in client session, touching no FREEZE auth files), no new dependency/color. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on / · /aircraft · /partnerships · /saved; zero app console errors from the globally-mounted component across 4 pages × 2 viewports; screenshots confirm no stray toast for logged-out visitors). See CHANGELOG 2026-06-22T07:08Z. **Next: slice 3 — surface device saves to *logged-out* visitors on /saved (still redirects to /auth) with the honest notice + account prompt; pairs with post-signup onboarding.**
- 2026-06-22 — **Per-make+model+STATE FAQ blocks + FAQPage JSON-LD ([P2][goal])**: extended the FAQ pattern (per-model → per-make for-sale → partnership-make → partnership-state → for-sale-state, all shipped 2026-06-21/22) to the most specific for-sale family `/aircraft/[make]/[model]/[state]` — the #1 autocomplete pattern ("{make} {model} for sale {state}"). 3 genuine, evergreen, **intersection-specific** Q&As each (why the airplane suits that state, what it costs to own there — hangar/tax/insurance realities, what to check given the local climate) for 6 marquee high-inventory combos: cessna/172 (CA, TX), cirrus/sr22 (CA, TX, FL), cessna/182 (TX) — all confirmed ≥3 live listings at orient (page 404s below that). Intentionally distinct from the model-only `MODEL_FAQS` and the generic-buying `FORSALE_STATE_FAQS`, so not a near-duplicate of a parent (GOAL.md guardrail); durable well-known facts only, NO fabricated stats, NO live counts → never stale. Implemented as a `MAKE_MODEL_STATE_FAQS` map keyed `makeSlug/modelSlug/stateCode` + `getMakeModelStateFaqs()` in `seo.ts` (mirrors `getForSaleStateFaqs`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1. 2 files (`seo.ts`, `aircraft/[make]/[model]/[state]/page.tsx`), additive; non-curated combos render no FAQ (verified cessna/182/washington = 200, no FAQ, ItemList intact). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; one FAQPage with 3 Questions per curated page; screenshots look right). See CHANGELOG 2026-06-22T06:52Z. **Next: curate more high-inventory intersections (cirrus/sr22 CO/AZ/NY/OH, cessna/182 AZ/WA all had ≥3 at orient); or the [P1][goal] unique-content-depth prose on state/airport families.**
- 2026-06-22 — **HTML "browse all" hub pages — slice 2: `/partnerships/browse` ([P1][goal])**: built the partnership twin of `/aircraft/browse` — a single crawlable index page linking every live partnership landing page in three sections: **By make** (the 8 curated SEO_MAKES, each gated on live active-listing count), **By state** (only states with ≥1 active partnership, with counts), and **Near an airport** (the same MIN_NEARBY-gated hub set the `/partnerships/near/[icao]` route + sitemap use, shown by airport name + ICAO + city/state + nearby count). Internal links = the #2 indexing lever after backlinks (STAGE=INDEXING), and every link points at a real, non-thin page (no doorway pages — GOAL.md). NEW `src/app/partnerships/browse/page.tsx` (server component: Breadcrumbs, self-canonical + OpenGraph + Twitter, one `CollectionPage`/ItemList JSON-LD, `ch-surface`/`ch-panel` + sky tokens, empty-state fallback). Added `countPartnershipsByMake`/`countPartnershipsByState` to `partnershipsQuery.ts` (mirror `countForSaleState`); refactored `nearbyPartnerships.ts` so `getNearAirportSitemapIcaos` + a new `getNearAirportHubs()` share one `computeNearAirportHubs()` core (sitemap near set byte-identical — verified 6 ICAOs unchanged). Added the hub to `sitemap.ts` + a "Browse all makes, states & airports →" link on `/partnerships`. No new component/color/dependency, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; served HTML has 7 make / 10 state / 6 near links + a valid CollectionPage; in sitemap + linked from /partnerships; one mobile-overflow fix via `min-w-0` truncation; screenshots look right). See CHANGELOG 2026-06-22T06:28Z. **The browse-all hub item is now fully shipped for both families. Next: optional footer link; or the broader [P1][goal] "unique content depth" prose on state/airport families.**
- 2026-06-22 — **Explain the trust/quality badges ([P2][want])**: shipped the human's exact ask — a "what do these mean?" legend page + the badges linked to it. New `/listing-quality` (server page, mobile-first, cream `ch-surface`) explains (a) the **A/B/C listing-quality grade** — each grade's meaning (`gradeMeta`) + the point-weighted completeness signals (`QUALITY_SIGNALS`/`GRADE_CUTOFFS`), with the honest caveat that it measures *completeness*, not condition/price-fairness; and (b) the **trust signals** — the 4 partnership (`TRUST_SIGNALS`) + 4 aircraft (`AIRCRAFT_TRUST_SIGNALS`) checks, each with a why-it-matters hint — all read 1:1 from the existing tables so the page can't drift from the badges. Self-canonical + OpenGraph + `Breadcrumbs` (BreadcrumbList JSON-LD) + a 3-Q&A FAQ (`ModelFaq` + `buildFaqPageJsonLd`, visible == JSON-LD). Linked from: the aircraft **grade chip** (`<span>`→`<Link>`, fuller tooltip + aria-label — fixes that the chip had NO explanation on mobile, only a desktop `title`), the partnership detail **trust checklist** footer, and the **footer** under Guides. 4 files (`listing-quality/page.tsx` new, `AircraftSaleCard.tsx`, `TrustBadge.tsx`, `Footer.tsx`), additive — no new component/color/dependency, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on /listing-quality + /aircraft; one FAQPage with 3 Qs + BreadcrumbList in served HTML, visible-answer parity; 61 grade-chip links to /listing-quality on /aircraft; screenshots look right). See CHANGELOG 2026-06-22T06:19Z. **Next: optional per-badge hover-popover on the trust chip; or a P1 [want] (airport hubs / "Looking for a share" post flow).**
- 2026-06-22 — **Per-state buying FAQ + FAQPage JSON-LD on FOR-SALE state pages ([P2][goal])**: extended the FAQ pattern (per-model → per-make for-sale → partnership-make → partnership-state, all shipped 2026-06-21/22) to the for-sale geo family `/aircraft/for-sale/[state]`, targeting the #1 autocomplete query pattern (`aircraft for sale california`). 3 genuine, evergreen, **buying-focused** Q&As each (is it a good place to buy, where the inventory clusters at real GA hubs, what to inspect / what drives price — coastal corrosion / density altitude / sales-use tax) for 6 curated high-GA states (ca/tx/fl/az/co/wa, same set as the partnership-state FAQs) — durable well-known facts only, NO fabricated stats, NO live counts → never stale. Intentionally distinct from the co-ownership-focused `PARTNERSHIP_STATE_FAQS`. Implemented as a `FORSALE_STATE_FAQS` map + `getForSaleStateFaqs(code)` helper in `seo.ts` (mirrors `getPartnershipStateFaqs`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). 2 files (`seo.ts`, `aircraft/for-sale/[state]/page.tsx`), additive; non-curated states render no FAQ (verified ohio/georgia/new-york/illinois = 200, no FAQ). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on ca/tx/fl; one FAQPage with 3 Questions per page; ca-desktop + fl-mobile screenshots look right). See CHANGELOG 2026-06-22T02:51Z. **Next: per-make+model+state aircraft FAQ variants on `/aircraft/[make]/[model]/[state]`; or curate more for-sale states (NY/IL/GA/NC).**
- 2026-06-22 — **Removable active-filter chips on `/partnerships` ([want])**: mirrored the proven `/aircraft` chip row onto the Partnerships results (priority index page #3). New `src/components/PartnershipActiveFilterChips.tsx` — a pure **server** component (no client JS) — renders a removable sky pill per active partnership filter (airport+radius / state / make / share_type / max_monthly / max_buyin); each `<Link>` strips just that filter, removing airport also clears radius, share-type shows its human label (e.g. "1/2 Share"), state shows the full name, "Clear all" appears at ≥2 chips, nothing renders with no filters. Rendered above `PartnershipList` in `partnerships/page.tsx`. Reuses existing params + `STATE_NAMES`; no new param/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; removal semantics verified in served HTML). See CHANGELOG 2026-06-22T02:50Z. **Both `/aircraft` and `/partnerships` now have removable filter chips.**
- 2026-06-22 — **Per-state FAQ blocks + FAQPage JSON-LD on PARTNERSHIP state pages ([P2][goal])**: extended the FAQ pattern (per-model → per-make for-sale → partnership-make, all shipped earlier 2026-06-21/22) to the partnership **state** level `/partnerships/state/[state]`, covering priority index pages #8/#9/#10 (ca/tx/fl) plus three more distinctive high-GA states (az/co/wa). 3 genuine, evergreen, **state-specific** co-ownership Q&As each (why co-own in that state, where partnerships cluster — real GA hub airports, what drives shared costs — coastal hangar scarcity / density altitude / mountain flying / PNW weather / no-income-tax) — durable well-known facts only, NO fabricated stats, NO live counts → never stale. Implemented as a `PARTNERSHIP_STATE_FAQS` map keyed by lowercase USPS code + `getPartnershipStateFaqs(code)` in `seo.ts` (mirrors `PARTNERSHIP_MAKE_FAQS`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). 2 files (`seo.ts`, `partnerships/state/[state]/page.tsx`), additive; non-curated states render no FAQ (verified wy = 200, no FAQ) — never templated boilerplate across all 50. No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on ca/tx/fl; one FAQPage with 3 Questions per page; ca-desktop + fl-mobile screenshots look right). See CHANGELOG 2026-06-22T03:42Z. **Next: per-state aircraft FAQ variants on `/aircraft/for-sale/[state]` + `/aircraft/[make]/[model]/[state]`; or curate more states (NY/IL/GA/NC).**
- 2026-06-22 — **Removable active-filter chips on `/aircraft` ([want])**: the twice-recommended follow-up to "Marketplace filters: multi-select + ranges" — a row of removable sky-blue pills above the results, one per active filter (make/model(s)/state/price range/year range/total-time range/grade(s)/keyword/price-drops), each `<Link>`-stripping just that filter and resetting to page 1; removing make also clears model; all-three-grades shows no grade chip; "Clear all" appears at ≥2 chips; nothing renders with no filters. New `src/components/ActiveFilterChips.tsx` — a pure **server** component (no client JS/hydration) — rendered above `AircraftSaleList` in `aircraft/page.tsx`. Reuses existing params + `STATE_NAMES`; no new param/color/dependency, no schema/DB/SQL. Re-applied cleanly onto post-webhook-fix staging (the original `night/aircraft-filter-chips` branch predated that fix). QA PASS desktop 1280 + 375px against the production build (smoke exit 0; removal semantics verified in served HTML). See CHANGELOG 2026-06-22T03:05Z. **Next: optional — same chips on /partnerships results.**
- 2026-06-22 — **Make-level FAQ blocks + FAQPage JSON-LD on PARTNERSHIP make pages ([P2][goal])**: extended the per-make FAQ pattern from the for-sale side (`/aircraft/[make]`, shipped 2026-06-22T00:08Z) to all 8 curated partnership hub pages `/partnerships/make/[make]` (cessna, piper, cirrus, beechcraft, mooney, diamond, vans, grumman — priority index pages #5/#6/#7 among them). 3 genuine, evergreen, **co-ownership-focused** Q&As each (why the make suits a partnership, which model fits a group, how shared costs split) — intentionally distinct from the buying-focused for-sale `MAKE_FAQS`; drawn from the SEO_MAKES blurbs + well-known GA facts (NO fabricated stats, NO live counts → never stale). Implemented as a `PARTNERSHIP_MAKE_FAQS` map + `getPartnershipMakeFaqs(slug)` helper in `seo.ts` (mirrors `MAKE_FAQS`/`resolveMake`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). 2 files (`seo.ts`, `partnerships/make/[make]/page.tsx`), additive; non-curated makes 404 (route generates only the 8 SEO_MAKES). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; one FAQPage with 3 Questions per page; collapsed+expanded screenshots look right). See CHANGELOG 2026-06-22T00:30Z. **Next: partnership state pages + per-state aircraft FAQ variants.**
- 2026-06-22 — **Listing-Quality multi-select on `/aircraft` ([P1][want])** — the final slice of "Marketplace filters: multi-select + ranges": the single grade-*floor* select became an **A/B/C checkbox group** (any combo). The `grade` URL param is a comma-joined subset, parsed into an OR of per-grade `quality_score` score bands (A ≥78, 50≤B<78, C<50) each clipped to the site-wide `FLOOR_GRADE`; none/all-three selected → floor only. Legacy single `min_grade` floor (A/B) is still honored read-only for old links/saved searches. Mirrors the Model multi-select (label "· N selected", normalized A,B,C order, survives in URL, mobile drawer + pager + Clear-all inherit it); `describeAircraftFilters` now mentions the grade subset in save-search/alert text. 3 files (`AircraftSaleFilters.tsx`, `AircraftSaleList.tsx`, `seo.ts`), additive, NO new component/color/dependency, NO schema/DB/SQL (reuses `quality_score` + `GRADE_CUTOFFS`). QA PASS desktop 1280 + 375px against the production build (smoke exit 0; verified by served counts that the bands partition exactly — A 420 / B 1005 / C 431 = 1856 total — and A+C=851=420+431 excludes B, all-three=1856=unfiltered, legacy min_grade=B=1425=A+B; focused panel screenshot confirms "· 2 selected" with A+C ticked). See CHANGELOG 2026-06-22T00:18Z. **This P1 item is now fully shipped. Optional next: removable active-filter chips in the results header.**
- 2026-06-22 — **Make-level FAQ blocks + FAQPage JSON-LD on make hub pages ([P2][goal])**: extended the per-model FAQ pattern to the 8 curated `/aircraft/[make]` hub pages (Cessna, Piper, Cirrus, Beechcraft, Mooney, Diamond, Van's, Grumman) — 3 genuine, evergreen, brand/lineup-level Q&As each (what the make is known for, which model to pick, cost to own), drawn from the existing `SEO_MAKES` blurbs + well-known GA facts (NO fabricated stats, NO live counts → never stale), distinct from the per-model FAQs. Implemented as a `MAKE_FAQS` map keyed by makeSlug attached in `resolveMake` (mirrors `MODEL_FAQS`/`getMakeModel`; added `faqs?` to the `SeoMake` type), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). Curated makes only; non-curated makes (e.g. Bellanca) render nothing (verified 200, no FAQ). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 after killing a stale port-3000 server; FAQPage parses with 3 Qs all present in the visible DOM on cessna/cirrus/piper; collapsed+expanded screenshots look right). See CHANGELOG 2026-06-22T00:08Z. **Next: partnership make pages + per-state FAQ variants.**
- 2026-06-21 — **Per-model FAQ blocks + FAQPage JSON-LD on make+model pages ([P2][goal])**: added 3 genuine, evergreen Q&As + valid `FAQPage` structured data to each of the 20 curated `/aircraft/[make]/[model]` pages (e.g. /aircraft/cessna/172, /aircraft/cirrus/sr22, /aircraft/robinson/r44) — unique content depth + rich-result eligibility for the INDEXING stage. Answers are model-specific, drawn from the existing curated specs/cost-to-own copy + well-known GA facts (NO fabricated stats, NO live counts → never stale). Implemented as a separate keyed `MODEL_FAQS` map attached in `getMakeModel` (kept `SEO_MAKE_MODELS` readable), a `buildFaqPageJsonLd` helper in `aircraftJsonLd.ts`, and a no-JS `<details>` accordion component `ModelFaq.tsx` (sky accent, 375px-first) — the visible answers match the JSON-LD 1:1 (Google parity). Curated combos only; dynamically-discovered combos render nothing (verified /aircraft/bellanca/decathlon = 200, no FAQ, ItemList intact). No new color, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0, FAQPage parses with 3 Qs all present in visible DOM, no console/hydration errors, overflow 0, focused screenshots confirm collapsed+expanded look right). See CHANGELOG 2026-06-21T23:52Z. **Next: same FAQ pattern on make-level `/aircraft/[make]` + partnership make pages; per-state variants.**
- 2026-06-21 — **`/partnerships` + `/aircraft` canonical + OpenGraph ([goal], priority pages #3 + #2)**: finished the sitewide canonical+OG sweep on the last two priority INDEX pages, closing the "Two verified gaps" item. `/partnerships` had NO canonical at all → added `alternates.canonical: '/partnerships'`; `/aircraft` had a canonical but no page-level og:url/og:title → both pages now carry a full page-level `openGraph` (url/title/description + explicit image/site_name/type/locale) + a `twitter` summary_large_image block, mirroring the homepage pattern in `src/app/page.tsx`. Metadata-only in the two `page.tsx` files; reused `SITE_NAME`/`DEFAULT_OG_IMAGE` from `@/lib/seo` only; no layout edit, no visual/content change, no new component/color, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (canonical + full og/twitter in served HTML on both, all JSON-LD parses, no console/hydration errors, overflow 0, both pages visually unchanged). See CHANGELOG 2026-06-21T06:08Z. **The sitewide og:url gap on the priority index set (`/`, `/partnerships`, `/aircraft`) is now closed. Next: explicit `openGraph.url` parity on the make/state/model programmatic families.**
- 2026-06-20 — **Homepage `/` canonical + OpenGraph ([goal], priority page #1)**: closed the two specifically-verified audit gaps on the homepage — (a) it had NO canonical → added `alternates.canonical: '/'` (self-canonical), and (b) `og:url` was empty sitewide → set a full page-level `openGraph` (url/title/description + explicit image/site_name/type/locale) so the homepage now unfurls with a real card and carries its canonical URL. Also added a `twitter` block (summary_large_image) and a `logo` to the WebSite JSON-LD (SearchAction sitelinks box unchanged). Metadata-only in `src/app/page.tsx`; no layout edit (scoped to `/`), no visual/content change, no new component/color, NO schema/DB/SQL. QA PASS desktop + 375px against the production build (canonical + 11 og/twitter tags in served HTML, 3 JSON-LD blocks parse with WebSite logo, no console errors, overflow 0, homepage visually unchanged). See CHANGELOG 2026-06-20T23:26Z. **Next: same sweep on `/partnerships` (#3, no canonical) + `/aircraft` (#2, canonical but no og:url) to finish the sitewide og:url gap.**
- 2026-06-20 — **/partnerships/seeking SEO metadata ([goal], priority page #4)**: brought the weakest of the 12 priority pages up to the make-page SEO bar — added self-canonical + OpenGraph to its metadata, a crawlable `Breadcrumbs` trail (Home › Partnerships › Seeking, emits BreadcrumbList JSON-LD), `ItemList` JSON-LD matching the surfaced available-partnership cards 1:1 (real `/partnerships/[id]` urls, Offers only where price exists), and a make-hub cross-link block (Cessna/Cirrus/Piper + View all) so the page is no longer an internal dead-end. `SeekerList` gained an optional `fallbackPartnerships` prop so one query backs both the markup and the rail. Reused existing helpers only; no new component/color; NO schema/DB/SQL change. QA PASS desktop + 375px against the production build (canonical + 4 OG tags + 3 parseable JSON-LD blocks in served HTML, breadcrumb links real, no overflow, no console errors, CTA/tabs intact). See CHANGELOG 2026-06-20T23:12Z. **Next: same canonical+OG sweep on the parent `/partnerships` (#3) + `/aircraft` (#2) index pages (both still lack a self-canonical/OG); then seed real `partnership_seekers` rows ([want]) so the page shows actual seekers.**
- 2026-06-20 — **Etsy × Airbnb visual refresh — slice 1: design tokens + reference surface ([P1][want])**: established the shared visual language once in `src/app/globals.css` — a warm cream page surface (`--ch-surface` `#faf7f2`), a consistent `rounded-2xl` card radius (`--ch-radius-card`), a soft resting shadow + gentle hover-lift (`--ch-shadow-card`/`--ch-shadow-hover`), exposed as `.ch-card` / `.ch-panel` / `.ch-surface` utilities (reduced-motion respected) and documented inline for later slices. Applied to ONE reference surface — `/aircraft`: `AircraftSaleCard` adopts `.ch-card` (minimal border, big rounded corners, hover-lift), the filters sidebar + by-state blocks adopt `.ch-panel`, a cream `.ch-surface` wraps the page, and the H1 got a larger/friendlier treatment. NO global body change (kept the sky accent; warmed neutrals only) → reversible + cohesive, no other page touched. QA PASS desktop + 375px against the production build (cream surface verified, card radius 16px + shadow, no 375px overflow, no console errors, all card content/links/heart/compare intact, homepage unchanged). See CHANGELOG 2026-06-20T23:03Z. **Next: slice 2 = full `AircraftSaleCard` + `PartnershipCard` content redesign on these tokens (larger photo, bold price, heart top-right, trust/grade badges); start from `globals.css`.**
- 2026-06-20 — **Email alerts capture — slice 1: capture UI + table ([P1][want])**: added a tasteful, inline (NOT modal, no fake urgency) one-field email capture to the two high-intent for-sale SEO pages — `/aircraft/[make]/[model]` ("Get alerts for new {Make} {Model} listings") and `/aircraft/for-sale/[state]` ("Get alerts for new {State} listings"). No account required; on submit it persists email + context + source_path to a NEW additive `alerts` table (`status='pending'`, `created_at`), shows a friendly in-place success state, validates email format, and dedupes idempotently. ⚠️ SCHEMA: added table `alerts` (strictly additive; anon INSERT, NO public SELECT — PII protected, mirrors `waitlist`). Sky-blue accent only, 375px-first. QA PASS desktop + 375px against the production build (success state, real persistence verified via service role, invalid-email rejection, idempotent re-submit = 1 row, anon SELECT denied, no overflow/console errors). See CHANGELOG 2026-06-20T07:38Z. **Next: slice 2 = double-opt-in confirmation email (`status` seam already in place); slice 3 = weekly "N new matches" digest.**
- 2026-06-20 — **Cost + earnings calculators ([P1][want])**: shipped two standalone mobile-first tools — `/tools/cost-calculator` (co-ownership cost split: buy-in/fixed/wet-rate/hours → all-in monthly, true $/hr, vs-renting & vs-owning) and `/tools/earnings-calculator` (leaseback offset: dues + flying margin → monthly/annual offset, upfront buy-ins, fixed-coverage bar). Adapted the 6 isolated files from `feat/financial-calculators` (PR #17) onto current staging (zero conflicts — all net-new), recolored the earnings tool emerald → sky (sky-blue accent only), linked both in a footer "Tools" group. Pure client math, 4 unit tests pass, no schema change. QA PASS desktop + 375px against the production build. See CHANGELOG 2026-06-20T06:13Z. Next: embed the `variant="compact"` calculators on `/partnerships/[id]` + `/partnerships/new`; add a top-nav Tools link + JSON-LD.
- 2026-06-19 — **Save / favorite listings — `/saved` view + nav link (slice 2)**: logged-in users now have a `/saved` ("My Saved Listings") page listing every partnership they've hearted (newest-saved first, reuses `PartnershipCard` with filled hearts, graceful empty state + orphan/inactive drop), plus a "Saved" nav link (Heart icon) in the desktop + mobile menus. Logged-out `/saved` → `/auth?next=/saved`. No schema change — reuses the `saved_listings` table from slice 1 (`toggleSavedListing` already revalidates `/saved`). See CHANGELOG 2026-06-19T13:03Z. Next: aircraft hearts (extend favorites to Planes-for-Sale + surface on `/saved`) — still blocked on `AircraftSaleCard.tsx` human WIP.
- 2026-06-19 — **Save / favorite listings — Partnerships (slice 1)**: heart button on every Partnership card + a "Save" button on the `/partnerships/[id]` detail header. Logged-out → registration gate (`/auth?next=<path>`); logged-in → toggles a new additive `saved_listings` table (owner-only RLS, mirrors saved_searches), heart shows filled (staging). Fulfills the SignUpGate's "Track listings you're interested in" perk. `listing_type` already accepts `'aircraft'` for a future slice. See CHANGELOG 2026-06-19T12:04Z. Next: slice 2 = a `/saved` view + nav link; then aircraft hearts (blocked on AircraftSaleCard.tsx human WIP).
- 2026-06-19 — **Saved searches on Planes-for-Sale**: `/aircraft` now has a "Save this search" button (logged-out → registration gate), and saved searches became marketplace-aware (additive `saved_searches.path` column) so an aircraft search replays against `/aircraft` with aircraft-vocabulary description + a "Planes for Sale" badge on `/searches` — instead of being treated as a partnership search (staging). Reuses the existing `SaveSearchButton`/`saveSearch`/SignUpGate plumbing. See CHANGELOG 2026-06-19T11:06Z. Next: slice 2 = email alerts on new matches (the SignUpGate's promised perk).
- 2026-06-19 — Filter overhaul **numbered pages**: /aircraft pager now shows windowed numbered page buttons (1 2 … current±1 … 31) with the current page highlighted + ellipsis, alongside Prev/Next, so users can jump across the 31-page default set (staging). Filters preserved on every page href; price-drops path still single-window. See CHANGELOG 2026-06-19T10:03Z. Filter overhaul [P1] now functionally complete; remaining slices (avionics/SMOH filters, real photos) blocked on human scraper WIP.
- 2026-06-19 — Filter overhaul **pagination**: /aircraft now pages through the full filtered set (`?page=N`, Prev/Next, "Showing X–Y of N" header, graceful out-of-range last page) instead of stopping at the first 60 rows (staging). Filters are preserved across pages. See CHANGELOG 2026-06-19T09:02Z. Follow-up: numbered page buttons / jump-to-page.
- 2026-06-19 — Filter overhaul **polish**: /aircraft results header shows the true total match count (e.g. "1,856 … — showing first 60") instead of capping at "60+", so filtering visibly works above 60 matches (staging). See CHANGELOG 2026-06-19T08:03Z. Follow-up: real pagination.
- 2026-06-19 — Filter overhaul **slice 2**: Max Total Time filter + progressive-disclosure "More filters" on /aircraft (staging). Avionics/SMOH filters deferred — those columns are 0% populated in the DB (ingest gap). See CHANGELOG 2026-06-19T07:03Z.
- 2026-06-19 — Filter overhaul **slice 1**: Make + Model dependent dropdowns on /aircraft (staging). See CHANGELOG 2026-06-19T06:04Z.
