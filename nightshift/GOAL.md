# Night Shift — North-Star Goal

> **PIVOT 2026-06-26 (human-set): activation over SEO.** We've already done heavy
> on-page SEO and are now *waiting for Google to index/rank* — that lag is weeks, and
> there is little more on-page work worth doing right now. So **SEO is PARKED** (see
> "SEO is parked" below) and the loop's mission moves to **product activation**. The
> previous SEO-centric goal is preserved verbatim in `GOAL-seo-parked.md` for when we
> un-park it.

**Goal: make ClubHanger effortless to act on.** Three pillars, equal weight:

1. **Frictionless listing posting** — posting a partnership, an aircraft for sale, or a
   pilot-seeking listing should take as few steps, fields, and decisions as humanly
   possible. The ideal is "paste what you have → we draft the rest → publish in one
   screen." Every required field, every extra click, every dead-end is a target to remove.
2. **Frictionless signup / auth** — never make someone create an account before they get
   value. Defer the gate to the moment of value (save / message / publish), and when we do
   ask, make it one tap (Google) or one field (magic link). Cut the signup form to the bone.
3. **Proprietary, useful buyer analysis on listing pages** — give shoppers decision-making
   insight they **cannot get on Controller / Barnstormers / Trade-A-Plane**: synthesized
   from our own data (the **ClubHanger Estimate** is the template). Every listing page
   should answer "is this a good buy, and what will it really cost me?" with honest,
   data-grounded analysis — not a spec dump.

These three ARE the goal. Build the highest-value slice of one of them every cycle.

## Why these, and how to judge a cycle (the honesty rule)
We are a cold-start marketplace: signups and posts are **low-volume**, so a single
night's conversion delta is noise — **do not judge a cycle by tonight's signup/post
count.** Judge by **leading indicators of friction removed and value added**:
- **Posting:** required fields cut, steps collapsed, a new prefill/import path, autosave,
  a gate removed. Measure: count the clicks/fields to publish before vs after — fewer wins.
- **Signup:** a gate deferred, an auth method added (Google/magic-link), the form shortened,
  intent preserved across the redirect.
- **Analysis:** a new proprietary module live on the listing page that's honest and
  data-grounded (uses real columns, says "unknown" when data is missing, never fabricates).

Track conversions (PostHog `signup`, `partnership_posted`, `aircraft_posted`,
`seeker_posted`, `contact_initiated`) **week-over-week** as the lagging confirmation —
not as the nightly scoreboard. `node nightshift/bin/scoreboard.mjs` still runs; read the
GSC funnel as *background* (we're parked there), and prefer PostHog activation events.

## Allocation — how cycles are split (replaces the old SEO 3:1 knob)
Every backlog item still carries an intent tag (`[bug]` / `[want]` / `[goal]`), but the
meanings shift under the pivot:
- **`[goal]` now means "advances one of the three activation pillars."** (It no longer
  means SEO.) Default for agent-invented work — invent activation experiments, not SEO ones.
- **`[want]`** — a human-wanted product feature outside the three pillars.
- **`[bug]`** — broken behavior, regression, console error, CWV/mobile regression.

**Lane order, every cycle:**
1. **Blockers first, uncapped.** Last cycle FAILED, or a known broken page / console error /
   CWV regression → fix it before anything else. (A broken post or signup flow is a P0 here —
   it directly defeats the goal.)
2. **Then pull the highest-value activation slice.** Prefer `[P1]` pillar items in
   `BACKLOG.md` under "ACTIVATION (pivot focus)". Rotate across the three pillars so none
   stalls — don't spend a week only on analysis modules while posting friction sits.
3. **`[want]` features** that aren't pillar work are still built when they're clearly
   high-value or P1, but the three pillars take precedence on ties.
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
