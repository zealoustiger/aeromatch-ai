# Spec — forsale-guide-crosslinks

## Goal
Surface the buyer guide (`/guides/aircraft-pre-purchase-inspection`) and the `/guides`
hub from the high-traffic for-sale pages via a small, tasteful "Buying a plane?"
related-guides cross-link block — deepening the internal linking graph toward the new
buyer-guide cluster (a named GOAL.md `[goal]` SEO lever). No new pages, zero
thin/doorway risk.

## Why this lane
Explicit "Next:" follow-up left by BOTH of the last two cycles in CHANGELOG.md
(guide-pre-purchase-inspection: "a small 'Buying a plane?' cross-link block on the
high-traffic `/aircraft` and make+model for-sale pages pointing into this guide";
guides-nav-link: "a 'Guides'/related-guides cross-link block on the high-traffic
for-sale pages"). Deliberate `[goal]` fall-through: prior non-bug cycle was `[goal]`,
but `[want]` lane is blocked this run, so per GOAL.md "if the chosen lane is empty,
fall through to the other." Scoreboard at orient = 61 pageviews/7d (`/aircraft` = top
marketplace page, 18 views/7d).

## Scope (small — one new presentational component + 2 page edits)
- NEW `src/components/ForSaleGuideLinks.tsx` — a server presentational component
  rendering a "Buying a plane?" card: links to the buyer guide
  `/guides/aircraft-pre-purchase-inspection`, the cost guide
  `/guides/cost-of-aircraft-co-ownership`, and the `/guides` hub. Matches the existing
  for-sale card styling (`rounded-xl border border-slate-200 bg-white p-6 shadow-sm`,
  sky-500 lucide icon, sky-600/sky-700 links) — sky-blue accent only, NO emerald, NO
  new palette.
- EDIT `src/app/aircraft/page.tsx` — render the block in the listings column (near the
  existing "Aircraft for sale by state" rail).
- EDIT `src/app/aircraft/[make]/[model]/page.tsx` — render the block (near the existing
  family/cross-link rails).

## Acceptance criteria (QA grades against these)
1. `npx next build` green; `npx tsc --noEmit` shows only the 3 pre-existing `.test.ts`
   baseline errors — no new errors in touched files.
2. The block renders on BOTH `/aircraft` and `/aircraft/[make]/[model]` (e.g.
   `/aircraft/cessna/172`) at desktop (1280) and 375px mobile.
3. All linked routes resolve HTTP 200:
   `/guides/aircraft-pre-purchase-inspection`, `/guides/cost-of-aircraft-co-ownership`,
   `/guides` (no dead links).
4. No horizontal overflow at 375px on either page (scrollWidth === clientWidth === 375).
5. No new console / hydration errors on either page at desktop + 375px.
6. Sky-blue accent only — no emerald, no new palette; matches existing card styling.

## Out of scope
- No new pages, no route changes, no schema/DB change, no SQL.
- No changes to existing metadata, JSON-LD, or the existing rails' content.
- No emerald/new-palette treatment; no nav changes.
- Not adding the block to the by-state pages (`/aircraft/for-sale/[state]`) this cycle —
  scope is the two named families; can be a future Next.
