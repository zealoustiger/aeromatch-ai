# Spec — airport-token-sweep

**Lane:** `[want]` (last non-bug cycle `og-card-parity-seed` was `[goal]`; alternating to `[want]`).
Etsy × Airbnb visual refresh **slice 5: token sweep**, next remaining family per BACKLOG
("Remaining families: guides, tools, airport pages"). Airport pages are a family the human
"really likes" and a heavy internal-linking crawl hub, so they're the highest-value remaining
token-sweep target. Human-requested design sequence; branding open for experimentation.

## Goal
Bring the airport detail page (`/airports/[icao]`) onto the shared warm design tokens
(`.ch-surface` / `.ch-panel` / rounded-2xl) already used on `/aircraft`, `/partnerships`,
and the partnership detail page — finishing a visible cold-slate/white inconsistency on a
page whose listing cards are already warm `.ch-card`s.

## Scope (one file, presentational only)
- `src/app/airports/[icao]/page.tsx`:
  - Wrap the page content in `<div className="ch-surface min-h-screen">` (cream surface),
    mirroring `/aircraft` + `/partnerships`.
  - H1 → `text-3xl font-bold tracking-tight` + icon `h-7 w-7` (was `text-2xl` / `h-6 w-6`);
    bump intro body `text-slate-500` → `text-slate-600` for parity.
  - Empty-state "no partnerships based here yet" card:
    `rounded-xl border border-slate-200 bg-white p-10` → `ch-panel p-10`.
  - "Aircraft partnerships near {airport}" sky CTA card: `rounded-xl` → `rounded-2xl`
    (keep its sky border/bg/hover — same treatment the partnership-detail "Interested?" card got).

## Acceptance criteria
- `npx next build` + typecheck pass.
- `/airports/[icao]` (a populated airport, e.g. KHWD) renders on a cream `.ch-surface` with a
  larger H1; the empty-state card and near CTA card use the rounded-2xl token family.
- No functional change: breadcrumb, JSON-LD (Airport + ItemList), listing cards, near-CTA link,
  "Search with filters" link, "Post the first one" CTA all unchanged.
- QA smoke exit 0 at desktop 1280 + mobile 375 (HTTP 200, zero app console errors, zero overflow)
  on at least one populated and one empty airport; screenshots look on-brand.

## Out of scope
- No new sections (FBOs / flight-clubs / ratings — that's the separate P1 community-hub item).
- No content/SEO/metadata/JSON-LD change, no token/`globals.css` change, no new color/component/dependency.
- No schema/DB/SQL. No change to any other page family (guides/tools handled in later cycles).
