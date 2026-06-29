# Spec: aircraft-price-inline-market

**UTC:** 2026-06-29T131948Z
**Slug:** aircraft-price-inline-market
**Pillar:** Pillar 3 — Proprietary buyer analysis on listing pages

## Goal
Add a compact one-line market hint directly under the asking price in the aircraft listing
detail page's sidebar Price card — mirroring what `partner-buyin-inline-market` just did
for partnership detail pages.

## Problem
The aircraft detail page's Price card shows only the asking price (+ price-drop strikethrough).
The market context (below/above market, median, comp count) lives in the EstimatePanel — a
separate sidebar panel that appears just below the price card on desktop, but is buried after all
main content on mobile. A buyer who sees "$148,000" gets no market signal until they scroll to the
EstimatePanel. The partnership detail page was just improved to show this hint at the price;
aircraft detail pages have the same gap.

## Scope
**One file change only:**
- `src/app/aircraft/listing/[id]/page.tsx` — add ~8–10 lines of JSX inside the Price sidebar
  card, using the `estimate` and `dealVerdict` already computed server-side.

## Acceptance criteria
1. A listing with `estimate !== null` shows a one-line hint directly under the asking price:
   - Below market: emerald text, e.g. "~18% below market · $185k median · 37 comps"
   - Around market: slate text, e.g. "Around market · $185k median · 37 comps"
   - Above market: amber text, e.g. "~12% above market · $185k median · 37 comps"
2. If `dealVerdict` is present (more controlled, year+hours), prefer it for the direction label
   ("Good deal" / "Fair price" / "Priced high") but keep format consistent.
3. Self-suppresses when `estimate` is null (no price, no recognized family, or < 4 comps).
4. No horizontal overflow at desktop 1280px or mobile 375px.
5. The EstimatePanel (full analysis below the hint) is unchanged.

## Out of scope
- Changing the EstimatePanel structure or content
- New DB queries or data fetches
- Changes to browse cards, partnership pages, or any other page
- Tooltip or expandable UI (flat text only)
