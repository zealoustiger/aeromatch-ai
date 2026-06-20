# Night Shift — North-Star Goal

**Goal: maximize total pageviews.** The loop optimizes for more people landing on
more pages of ClubHanger. (We're optimizing views, not signups, on purpose:
at ~25 views/day traffic is the bottleneck — signups can't grow until the top of
the funnel does.)

**Read the current score every cycle:**
```bash
node nightshift/bin/scoreboard.mjs   # on-site pageviews (PostHog)
node nightshift/bin/gsc.mjs          # real Google search: clicks, impressions, indexed-count, top queries
```
GSC is the truer SEO signal once configured (see `GSC_SETUP.md`): indexed-count →
impressions → clicks is the real funnel. Both fail soft if unconfigured.
It prints pageviews (last 7d vs prior), all-time totals, and the top pages by traffic.

## Allocation policy — how cycles are split across work types
The pageview metric is the **tiebreaker and the default, not the dictator.** Bug
fixes and human-wanted features carry value the metric can't see (a working site;
product bets that pay off later). So allocate by lane, don't greedily chase pageviews.

**Every backlog item carries an intent tag** (set by the human, or inferred):
- `[bug]` — broken behavior, regression, console error, perf/mobile/CWV regression.
- `[want]` — the human wants it for product reasons, regardless of pageview impact.
- `[goal]` — expected to grow pageviews (SEO/content/speed). Default for agent-invented work.
- *Untagged defaults:* an item under an SEO/content heading → `[goal]`; an item that
  says BUG/broken/regression → `[bug]`; any other feature/idea → `[want]`.

**Lane order, every cycle:**
1. **Blockers first, uncapped.** If the last cycle FAILED, or there's a known
   broken page / console error / CWV regression, fix it before anything else.
2. **Then alternate `[want]` ↔ `[goal]` ~1:1.** Look at the most recent *non-bug*
   cycle in `CHANGELOG.md`: if it pulled the `[want]` lane, do `[goal]` this cycle;
   if it pulled `[goal]`, do `[want]`. Pick the highest-value item in that lane
   (P1 first; `[P1][want]` always preempts). This is the knob:
   **`roadmap:goal ratio = 1:1`** — change this line to retune (e.g. `1:3` = goal-heavy).
3. **If the chosen lane is empty, fall through to the other**; if both human lanes
   are empty, **default to `[goal]`** and invent an SEO experiment. The night never idles.

The CHANGELOG `Goal:` line records which lane each cycle pulled, so the 1:1 is
self-tracking and the human can see the actual mix each morning and retune the ratio.

## Primary lever: SEO breadth + quality
This is a niche marketplace with programmatic landing pages already in place
(`/partnerships/state/[state]`, `/partnerships/make/[make]`, `/airports/[icao]`).
The fastest path to more pageviews is **more genuinely-useful indexable pages and
better-ranked existing ones.** Fair game for the PM to pick OR invent:
- New programmatic page families with real, unique data: make+model pages, model
  pages, city pages, airport detail pages, "Cessna 172 partnerships near me", etc.
- Better on-page SEO: titles, meta descriptions, H1s, structured data (schema.org),
  canonical tags, Open Graph for shareable listing pages.
- Internal linking + breadcrumbs so crawlers (and humans) reach more pages.
- A fresh, complete sitemap.xml + robots; fast indexing.
- Core Web Vitals / page speed (a Google ranking factor) — faster = ranks better.
- Genuinely useful content: buyer/partnership guides, cost explainers, FAQs that
  target real search intent.

## The honesty rule (don't fool yourself with the metric)
**Pageview lift from SEO LAGS indexing by weeks.** Do NOT judge an SEO cycle by
tonight's pageview delta — you won't see it yet. Judge each cycle by **leading
indicators**: new quality indexable pages live + in the sitemap, valid unique
metadata/canonical, internal links added, Lighthouse SEO/perf score, no crawl
errors. Track the `scoreboard.mjs` number **week-over-week**, not night-over-night.

## Guardrails — these make the goal real instead of gamed
A change that grows the page count but violates these is a **LOSS**, not a win:
- **No doorway / thin / near-duplicate pages.** Every new page must carry real,
  substantively unique value (actual listings, real airport/aircraft data, genuine
  content). Auto-generating empty or near-identical pages to inflate the count gets
  the whole site penalized by Google — the opposite of the goal.
- **No keyword stuffing, cloaking, hidden text, or fake/AI-slop content.**
- **No analytics manipulation** (self-pageview loops, bot traffic). The metric must
  reflect real humans.
- **Don't count admin/internal routes** (`/admin/*`, `/api/*`) toward the goal.
- **Never regress Core Web Vitals / mobile.** A page-speed or 375px regression is a loss.
- **Canonicalize** to avoid duplicate-content sprawl across the programmatic pages.
- Stay inside `FREEZE.md` and the taste notes in `BACKLOG.md` (sky-blue accent,
  mobile-first, cleaner-than-Controller).

## How the PM uses this
Each cycle: read the scoreboard, then pick the work with the **highest expected
pageview impact per cycle** — whether that's a `BACKLOG.md` item or an SEO
experiment you invent. When you invent one, append it to `BACKLOG.md` under Ideas
with an `[agent]` tag + a one-line "why this should grow pageviews" rationale, then
build the smallest valuable slice. Non-SEO backlog items (features, fixes) still get
built — they make the pages worth visiting and sharing — but when nothing else is
clearly higher-value, default to the goal: ship another quality indexable page or
make an existing one rank better.
