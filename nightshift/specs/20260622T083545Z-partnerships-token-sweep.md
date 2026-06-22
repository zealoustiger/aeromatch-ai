# Etsy × Airbnb refresh — slice 5: token sweep onto `/partnerships`

## Goal
Bring the `/partnerships` search page (priority index page #3) onto the shared
Etsy × Airbnb warm design tokens already used on `/aircraft`, so the page surface
and filter panel match its already-warm `PartnershipCard`s — finishing the
visible cold-slate / warm-cream inconsistency on a high-traffic page.

## Lane
`[want]` — Etsy × Airbnb visual refresh, **slice 5: token sweep** (one page family
per cycle). The last non-bug cycle (`partnership-make-overview-prose`) pulled
`[goal]`, so `[want]` is owed per the 1:1. Slice 4 (homepage rails) already shipped.

## Scope (one file)
- `src/app/partnerships/page.tsx` only:
  1. Wrap the page content in `<div className="ch-surface min-h-screen">` (mirrors
     `/aircraft`), so the warm cream surface sits behind the listings/filters.
     CompareTray stays outside the wrap, exactly as on `/aircraft`.
  2. Convert the desktop filter sidebar card from
     `rounded-xl border border-slate-200 bg-white p-5 shadow-sm` → `ch-panel p-5`.
  3. Match the `/aircraft` H1 treatment: `text-3xl font-bold tracking-tight`,
     icon `h-7 w-7`, body copy `text-slate-600`.
  4. Skeleton card radius `rounded-xl` → `rounded-2xl` for card-radius parity.

## Acceptance criteria
- `/partnerships` renders on the warm cream `ch-surface` (not bare white), with the
  filter sidebar as a `ch-panel` (rounded-2xl, soft shadow, warm hairline).
- All existing functionality unchanged: tabs, chip bar, removable filter chips,
  filters sidebar + mobile drawer, Save-this-search, Post CTA, compare tray, list.
- `npx next build` + typecheck green (no new errors in touched file).
- QA smoke exit 0 at desktop 1280 + mobile 375 on `/partnerships` (HTTP 200, zero
  app-origin console errors, zero horizontal overflow); screenshots look on-brand.

## Out of scope
- No changes to `PartnershipCard`, filters, query, params, or any other page.
- No new tokens/colors/components/dependencies. No schema/DB/SQL. No `globals.css` edit.
- `/partnerships/seeking`, make/state hubs, and detail pages are NOT touched this cycle.
