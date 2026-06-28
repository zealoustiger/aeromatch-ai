# Spec: Engine Life Panel on Partnership Detail Pages

**Timestamp:** 2026-06-28T06:43:10Z  
**Slug:** partnership-engine-life  
**Pillar:** Buyer Analysis (Pillar 3)

## Goal
Surface the same honest engine life & overhaul reserve analysis that aircraft listing pages already show, on partnership detail pages — so co-ownership shoppers can evaluate engine freshness and budget overhaul reserves at a glance, without having to ask the owner.

## Why
Partnership buyers are evaluating a multi-year financial commitment. A shared aircraft with an engine 50 hrs from TBO has a very different cost profile than one fresh after overhaul. The aircraft detail page already shows this analysis (shipped in `engine-life-overhaul-reserve`); the partnership detail page has the same `smoh` and `engine_type` data (via `select('*')`) but no panel to surface it. This is a clear gap in the proprietary buyer-analysis story — the same data, the same honesty gates, just not shown where partnership shoppers are looking.

## Scope (files to touch)
- `src/app/partnerships/[id]/page.tsx` — add `computeEngineLife` import + inline `EngineLifePanel` component (same JSX pattern as aircraft listing) + render it in the main column

## Acceptance Criteria
1. A partnership listing with `smoh` and a known `engine_type` (e.g., Lycoming IO-360) shows an "ENGINE LIFE" panel in the main column, between PartnershipDealSignals and the pilot requirements section
2. The panel shows hours remaining to TBO, a colour-coded progress bar (emerald / amber / red), and the engine reserve budget ($/yr and $/hr)
3. A listing where the engine is past TBO shows the amber "Engine is beyond published TBO" warning with hours over-TBO
4. A listing with `smoh = null`, `engine_type = null`, or an unrecognised engine string shows NO panel (self-suppresses)
5. `/partnerships/[id]` pages remain HTTP 200 with zero app-origin console errors and no horizontal overflow at desktop 1280 and mobile 375

## Out of Scope
- Extracting `EngineLifePanel` to a shared component (can be done later)
- Engine chips on partnership browse cards or rails
- Schema changes (query already fetches these columns via `select('*')`)
