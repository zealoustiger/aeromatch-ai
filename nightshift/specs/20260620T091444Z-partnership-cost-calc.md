# Spec — Embed compact cost calculator on partnership detail + add Tools nav link

**UTC:** 2026-06-20T09:14:44Z
**Slug:** partnership-cost-calc
**Lane:** [want] (prior non-bug cycle guides-hub was [goal]; alternation → [want])
**Scoreboard at orient:** 60 pageviews/7d

## Goal
Surface ClubHanger's cost tools where buyers actually decide: embed a COMPACT cost
estimator on each partnership detail page pre-filled from that listing's real
numbers, and add a top-nav "Tools" link so the calculators are discoverable.

## Scope (files expected to touch — small)
- `src/app/partnerships/[id]/page.tsx` — mount `<CostCalculator variant="compact" />`
  in the sidebar, pre-filled from the listing's real fields.
- `src/components/Nav.tsx` — add ONE new top-level "Tools" nav item (desktop + mobile),
  matching the existing `links` array pattern.

## Implementation notes
- `CostCalculator` already has a `variant="compact"` prop accepting
  `initialBuyIn`, `initialMonthlyFixed`, `initialHourlyWet`, `shareFraction`.
  Pre-fill from `p.buy_in_price`, `p.monthly_fixed`, `p.hourly_wet`, and
  `shareFractionFromType(p.share_type)` (helper in `src/lib/calculators.ts`).
- All listing fields are `number | null`; the component already falls back to
  sensible defaults (`?? 18000` etc.) so it degrades gracefully when a field is
  absent — never crashes.
- Tools link target: `/tools/cost-calculator` (the primary tool; it already links
  to the earnings calculator). No `/tools` index page exists, so pointing there
  would 404 — out of scope to create one this cycle.

## Acceptance criteria (QA grades against these)
1. Partnership detail `/partnerships/[id]` renders a compact "Cost estimator" card
   in the sidebar; editing Hours/month or Wet rate updates the All-in monthly /
   true-cost-per-hour live; "Open full calculator" links to `/tools/cost-calculator`.
2. The embed is pre-filled from the listing's real data when present (wet rate
   matches the listing's Wet Rate), and still renders correctly on a listing that
   lacks buy-in / monthly / wet fields (no crash, sensible defaults).
3. Top nav shows a "Tools" link on desktop AND in the mobile menu, linking to
   `/tools/cost-calculator`; clicking it loads the cost calculator (HTTP 200).
4. `npx next build` green; `npx tsc --noEmit` shows only the 3 known baseline
   `.test.ts` import-extension errors, no new errors in touched files.
5. Zero horizontal overflow at 375px on the partnership detail page; sky-blue
   accent only; no new console / hydration errors at desktop + 375px.

## Out of scope
- Do NOT touch `/partnerships/new` or any aircraft pages.
- Do NOT create a `/tools` index page or schema/DB changes.
- Do NOT reorder the existing nav; only append one item.
