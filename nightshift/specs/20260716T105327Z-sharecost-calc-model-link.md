# sharecost-calc-model-link

## Goal
Thread the listing's make/model into `ShareCostPanel`'s "Run your own numbers" link so
visitors from a real aircraft-for-sale listing land on the model-aware cost-calculator
alert box instead of the generic partnership one.

## Scope
- `src/components/ShareCostPanel.tsx` — accept optional `make`/`model` props, append them
  as query params (`?make=&model=`) to the existing `/tools/cost-calculator` link when
  present; unchanged (bare `/tools/cost-calculator`) when either is missing.
- `src/app/aircraft/listing/[id]/page.tsx` — pass `make={p.make}` `model={p.model}` into
  the existing `<ShareCostPanel>` call (~line 1028).

## Acceptance criteria
- `ShareCostPanel` on `/aircraft/listing/[id]` links "Run your own numbers" to
  `/tools/cost-calculator?make=<Make>&model=<Model>` when the listing has both fields.
- If a listing is missing `make` or `model`, the link falls back to bare
  `/tools/cost-calculator` (no broken/partial query string).
- The cost-calculator page's existing model-aware alert box (shipped in
  `cost-calc-model-alert`) renders correctly when reached via this new link — no new
  logic needed there, just confirms the existing query-param contract is honored.
- `npx next build` + typecheck green.
- QA smoke passes (HTTP 200, zero app-console errors, zero horizontal overflow) at
  desktop 1280 + mobile 375 on `/aircraft/listing/<id>` and
  `/tools/cost-calculator?make=X&model=Y`.
- No regression to any other `ShareCostPanel` caller (there is only the one, on the
  aircraft listing detail page).

## Out of scope
- No changes to `CostCalculator.tsx`'s numeric inputs/defaults.
- No changes to `PartnerShareCostPanel` (partnership side) — different component, not
  touched.
- No new capture surfaces, no schema change.
