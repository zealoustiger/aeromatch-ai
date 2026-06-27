# Spec: crosssell-model-level

**Timestamp:** 20260627T144010Z  
**Pillar:** Buyer-analysis (Pillar 3)  
**Friction removed:** Cross-sell panel shows irrelevant make-level count ("6 Cessna partnerships") when model-specific partnerships exist — e.g., viewing a Cessna 172 listing should show "3 Cessna 172 partnerships," not "6 Cessna partnerships."

## Goal
Narrow the "Co-ownership available" cross-sell panel on `/aircraft/listing/[id]` from make-level to model-level when same-make+model partnerships exist. Fall back to make-level when no model match is found. This makes the panel's count and CTA link more accurate and actionable for the buyer.

## Scope
- `src/lib/partnershipsQuery.ts` — extend `getPartnershipCrossSell(make)` to accept an optional `model` string; query make+model first, fall back to make-only; return a `modelLevel: boolean` flag
- `src/app/aircraft/listing/[id]/page.tsx` — pass `p.model` to the query; pass `modelLevel` + `model` props to `PartnershipCrossSellPanel`; update panel copy and CTA link accordingly

## Acceptance criteria
1. When viewing an aircraft listing where same-make+model active partnerships exist, the panel reads "N Cessna 172 partnerships" (not "N Cessna partnerships") and the CTA links to `/partnerships?make=Cessna&model=172`.
2. When no model-level partnerships exist but make-level ones do, the panel falls back to the current make-level text ("N Cessna partnerships") and make-only CTA.
3. When `p.model` is null/empty, behavior is unchanged from before (make-level only).
4. Panel still self-suppresses when count is 0 (no matches at either level).
5. `npx next build` passes with zero TypeScript errors.
6. QA smoke exit 0 on `/aircraft/listing/[id]` at desktop 1280 + mobile 375.

## Out of scope
- Changing the visual design or position of the panel
- Adding a new page or schema
- Touching any other listing surface
