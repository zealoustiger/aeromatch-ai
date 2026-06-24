# Night Shift — North-Star Goal

**Goal: maximize organic search traffic — clicks from Google.** The real metric is
the **Google Search Console funnel: indexed → impressions → clicks**, each gating the
next (a page can't get impressions until it's indexed, or clicks until it has
impressions). On-site pageviews (PostHog) are a *secondary* signal — they include you,
the team, and direct visits, so they don't tell you if SEO is working. (We optimize
search traffic, not signups, on purpose: signups can't grow until the top of the funnel does.)

**Read the current score every cycle:**
```bash
node nightshift/bin/scoreboard.mjs   # leads with the GSC funnel + STAGE, then on-site pageviews
```
The scoreboard computes a **STAGE** that tells you what to prioritize *right now*:
- **INDEXING** (indexed ≈ 0 — where we are): get pages *indexed* — indexability, internal
  linking, sitemap freshness, page quality, request-indexing. Do NOT just build more pages
  Google can't index yet. (Backlinks — a human lever — accelerate indexing the most.)
- **VISIBILITY** (indexing, few impressions): build more quality pages targeting real
  queries; improve titles/H1s/internal links on families already showing up.
- **CTR** (impressions but few clicks): improve titles/meta/structured data on
  high-impression / low-click pages to win the click.
- **SCALING**: scale what works; push almost-ranking pages (position 5-15) to page one.

Always mine the scoreboard's **top queries** for page ideas (queries you almost rank for → new pages).
GSC + PostHog both fail soft if unconfigured (see `GSC_SETUP.md`).

## Priority pages — get THESE indexed first (human-set, 2026-06-20)
We're in the **INDEXING** stage, so concentrate indexing / quality / internal-linking /
metadata effort on this specific seed set before building more. Get each one genuinely
complete, uniquely titled (title / H1 / meta / canonical / OG / JSON-LD), richly
internally linked, in the sitemap, and request-indexed:

1. `/` — homepage
2. `/aircraft`
3. `/partnerships`
4. `/partnerships/seeking`  ← currently thin/blank; needs real content to be index-worthy
5. `/partnerships/make/cessna`
6. `/partnerships/make/cirrus`
7. `/partnerships/make/piper`
8. `/partnerships/state/ca`
9. `/partnerships/state/tx`
10. `/partnerships/state/fl`
11. `/tools/cost-calculator`
12. `/guides/aircraft-co-ownership`

These are the hub/seed set — nailing their quality, metadata, and internal links first
bootstraps crawl of everything else. New programmatic pages are still welcome, but never
at the expense of getting these 12 right. Treat work on them as the top `[goal]` priority.

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
2. **Then weight `[want]` over `[goal]` ~3:1 (≈75% features / 25% SEO).** Look at the
   most recent *non-bug* cycles in `CHANGELOG.md`: pull **`[goal]`** only when the last
   **3** non-bug cycles were all `[want]` (so roughly every 4th non-bug cycle is an
   SEO / page-improvement cycle); otherwise pull **`[want]`**. Pick the highest-value
   item in that lane (P1 first; `[P1][want]` always preempts). This is the knob:
   **`roadmap:goal ratio = 3:1`** — change this line to retune (e.g. `1:1` = balanced,
   `1:3` = goal-heavy). *(Set 3:1 on 2026-06-24: SEO lift lags by weeks and we've already
   done heavy on-page optimization, so weight toward features/roadmap for now — revisit
   the ratio once indexing/traffic starts moving.)*
3. **If the chosen lane is empty, fall through to the other**; if both human lanes
   are empty, **default to `[goal]`** and invent an SEO experiment. The night never idles.

The CHANGELOG `Goal:` line records which lane each cycle pulled, so the 3:1 mix is
self-tracking and the human can see the actual ratio each morning and retune it.

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
- Stay inside `FREEZE.md` and the taste notes in `BACKLOG.md` (mobile-first,
  cleaner-than-Controller; branding/palette is open for experimentation — human reviews post-cycle).

## How the PM uses this
Each cycle: read the scoreboard, then pick the work with the **highest expected
pageview impact per cycle** — whether that's a `BACKLOG.md` item or an SEO
experiment you invent. When you invent one, append it to `BACKLOG.md` under Ideas
with an `[agent]` tag + a one-line "why this should grow pageviews" rationale, then
build the smallest valuable slice. Non-SEO backlog items (features, fixes) still get
built — they make the pages worth visiting and sharing — but when nothing else is
clearly higher-value, default to the goal: ship another quality indexable page or
make an existing one rank better.
