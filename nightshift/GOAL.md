# Night Shift — North-Star Goal

> **PIVOT 2026-06-26 (human-set): activation over SEO.** We've already done heavy
> on-page SEO and are now *waiting for Google to index/rank* — that lag is weeks, and
> there is little more on-page work worth doing right now. So **SEO is PARKED** (see
> "SEO is parked" below) and the loop's mission moves to **product activation**. The
> previous SEO-centric goal is preserved verbatim in `GOAL-seo-parked.md` for when we
> un-park it.

**Goal (updated 2026-07-05, human-set): build the best "set an alert" experience on the
web — everywhere on the site.** Setting an alert is *far* lower-friction than posting a
listing (one email vs. a whole form), and most of our traffic is buyers who want to be
told when the right aircraft or partnership shows up. So the whole site should make
setting — and managing — an alert effortless, obvious, and delightful.

**Do alerts FIRST.** Before anything else in the goal lane, make the alert experience
best-in-class. Concretely, that means (invent more — this is a starting list):
- **Alert entry points everywhere they make sense:** every listing page, every browse /
  search / filter result, make/model/state pages, the homepage, empty-search states — a
  visitor should never be more than one click from "alert me about this." One-tap "alert
  me for *this* search" from any active filter set.
- **Frictionless capture:** email-only, no account required (already the case) — keep it
  one field; pre-fill context from the page; instant, reassuring confirmation UX; make the
  double-opt-in email itself excellent.
- **Great alert *management*:** a place to see, edit, pause, and delete your alerts;
  signed-in users see saved-search ↔ alert unified; one-click unsubscribe that doesn't
  feel like a dead end (offer "fewer" instead of "none").
- **Smart, honest alert content:** new-listing AND price-drop alerts; only fire on genuine
  matches; digest vs. instant options; never spam. The email a subscriber receives should
  be the best listing alert email in aviation.
- **Prove it converts:** every alert surface emits an analytics event (`alert_subscribed`
  with the context/source) so we can see which placements convert.

This IS the goal now. The three earlier activation pillars (posting, signup, buyer
analysis) are **still valuable but secondary** — pull them only after the alert experience
is genuinely great, or when a `[want]`/`[bug]` calls for them.

## How to judge a cycle (the honesty rule)
We are a cold-start marketplace: signups/alerts/posts are **low-volume**, so a single
night's conversion delta is noise — **do not judge a cycle by tonight's numbers.** Judge
by **leading indicators**: a new alert entry point live in a place that lacked one; friction
removed from setting/managing an alert; a better confirmation/unsubscribe flow; a real
`alert_subscribed` event wired. Track PostHog conversions (`alert_subscribed`, `signup`,
`*_posted`, `contact_initiated`) **week-over-week** as the lagging confirmation. The GSC
funnel is *background* (SEO parked).

## Allocation — STRICT priority order (human-set 2026-07-05, replaces the old ratio)
Every backlog item carries an intent tag: `[bug]` = broken behavior/regression/console
error/CWV-mobile regression · `[want]` = **a task the human (user) put in the backlog** ·
`[goal]` = AI-invented work toward the goal (the alert experience). Work them **strictly in
this order — finish a higher tier before touching a lower one:**

1. **`[bug]` — fix bugs first (uncapped).** Any known bug, a FAILed prior cycle, a broken
   page / console error / CWV or 375px regression → fix it before anything else. A broken
   alert/signup/post flow is a P0 bug (it defeats the goal directly).
2. **`[want]` — then do human-inputted tasks.** Every task the user added to the backlog
   (tagged `[want]`, or under a human-added section) outranks all AI-invented goal work.
   Clear the `[want]` queue (highest `[P1]` first) before pulling any `[goal]` item. These
   are the human's explicit priorities — they always beat what the AI thinks is best.
3. **`[goal]` — then AI-generated goal work (the alert experience).** Only when tiers 1 & 2
   are empty. Pull the highest-value `[P1]` alert-experience slice from BACKLOG. **Do alerts
   before the older activation pillars.**

There is no rotation and no ratio anymore — it is a strict cascade. If a higher tier is
empty, drop to the next; if all are empty, generate new `[goal]` tasks (see below).

### Generating new goal tasks — use the SMARTEST model (human-set 2026-07-05)
When tiers 1 & 2 are empty and the `[goal]` (alert-experience) queue is thin, **generate
the next batch of goal tasks with the strongest available model — Opus (`claude-opus-4-8`)
or Fable (`claude-fable-5`)** — NOT the cheap execution model. Task *ideation* is where
model quality matters most; execution can stay on the cheaper cycle model. The loop runs a
dedicated **plan pass** on `config.json.models.plan` (opus/fable) via `PLAN_TASK.md` that
appends concrete, sliced `[P1][goal]` alert-experience tasks to BACKLOG; the ordinary
execution cycles then build them. Do not invent goal tasks inline on the cheap model.

### Check the item OFF when you finish it (human-set 2026-07-05 — the backlog must shrink)
When a cycle SHIPS a backlog item (PASS), it **must mark that item done in BACKLOG.md** in
the same cycle: strike the title and append `✅ SHIPPED via \`<slug>\` (<date>)`. Do NOT
add a fresh duplicate item for work you just did. The morning digest also runs
`backlog-reconcile.mjs --apply` as a backstop, but the deterministic check-off is yours —
the human noticed the backlog wasn't shrinking, so treat an un-checked-off shipped item as
an incomplete cycle. Only add NEW backlog items for genuinely new, un-built work.

**(legacy note — superseded by the strict order above):**
4. **The night never idles.** If the pillar queue is somehow empty, invent the next
   activation slice (tag `[agent][goal]` + a one-line "which pillar / what friction this
   removes" rationale), append to `BACKLOG.md`, build the smallest valuable increment.

## SEO is parked (do NOT pull these)
- **Do not invent new SEO experiments.** Do not build new programmatic page families
  (`/aircraft/compare/...`, new state/make/model hubs, new guide pages) for SEO reasons.
- **Do not pull `[goal]` items that are SEO/content** — those are now parked; the SEO
  sections in `BACKLOG.md` are marked PARKED. Leave them; don't delete them.
- **The ONE exception: SEO *bugs*.** A broken canonical, a 404/500 on an indexed page, a
  busted sitemap, a CWV/mobile regression, broken structured data → still fix as a `[bug]`
  (we don't want to lose ground Google has already crawled). That's maintenance, not new SEO.
- Existing programmatic pages keep working and keep their metadata — just don't *expand* the surface.

## Guardrails — what makes each pillar a real win, not a gamed one
- **Posting friction removed must not remove trust or data integrity.** Cutting a required
  field is good; silently publishing garbage is not. Keep listings honest and complete
  *enough* — push optional fields to progressive disclosure / post-publish enrichment, don't
  delete them from the model. A listing a buyer can't evaluate is friction moved, not removed.
- **A deferred signup gate must still capture the user at the value moment** — don't let
  someone do real work (post, save, message) and then lose it because there was no account.
  Persist intent across auth (the `?next=` pattern) so nothing is dropped.
- **Analysis must be PROPRIETARY and HONEST.** It has to be synthesized from our data in a
  way the big sites don't offer — and it must never fabricate. Use real columns
  (`ttaf`, `smoh`, `engine_type`, `asking_price`, comps, `previous_price`); when the input
  is missing, say "not enough data" rather than inventing a number. A confident-but-wrong
  estimate is a LOSS — it destroys the exact trust this pillar is meant to build. Reuse the
  existing honesty floors (min comps / dead-band) from the ClubHanger Estimate as the bar.
- **Never regress Core Web Vitals / mobile** (375px). Analysis modules must be fast and not
  block render — compute server-side from data we already have where possible.
- **Don't activate any paid network / monetization** — build UI only (see `FREEZE.md`).
- Stay inside `FREEZE.md` and the taste notes in `BACKLOG.md` (mobile-first, cleaner-than-
  Controller, warm Etsy×Airbnb feel; major nav/IA reordering still asks a human).

## Source material the analysis pillar can build on (already in the codebase/DB)
- **Extracted specs** (new, 2026-06-26): `ttaf`, `smoh`, `engine_type`, `avionics[]`,
  `annual_due`, `damage_history` now populated from descriptions → enough to compute
  engine-life-remaining, overhaul-reserve, equipment-completeness, condition signals.
- **ClubHanger Estimate / Deal Check** (`src/lib/aircraftComps.ts`, family comp queries in
  `aircraftForSale.ts`) — the template for proprietary, honesty-gated value analysis.
- **Cost calculator** (`/tools/cost-calculator`, `src/lib/calculators.ts`) — bring it ONTO
  the listing page, prefilled with the listing's real make/model/hours/price.
- **Price history** (`previous_price`, `price_changed_at`) — days-on-market + drop trend.
- **Partnership cross-sell** — "split this into N shares → $X each" using buy-in math.

## How the PM uses this
Each cycle: skim the scoreboard for blockers, then pick the **highest-value activation
slice** across the three pillars (rotate so none stalls). Slice big items — one shippable
increment per cycle, note the next slice in `CHANGELOG.md`. Tag invented work
`[agent][goal]` with the pillar + the friction it removes. The `Goal:` line in the
CHANGELOG should name which pillar each cycle advanced, so the human can see the rotation.
