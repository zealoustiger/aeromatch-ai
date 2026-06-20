# Night Shift — North-Star Goal

**Goal: maximize total pageviews.** The loop optimizes for more people landing on
more pages of ClubHanger. (We're optimizing views, not signups, on purpose:
at ~25 views/day traffic is the bottleneck — signups can't grow until the top of
the funnel does.)

**Read the current score every cycle:**
```bash
node nightshift/bin/scoreboard.mjs
```
It prints pageviews (last 7d vs prior), all-time totals, and the top pages by traffic.

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
