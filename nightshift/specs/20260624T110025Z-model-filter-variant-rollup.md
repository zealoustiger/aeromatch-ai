# Spec — Model filter: roll up variants into a parent model

- **Slug:** `model-filter-variant-rollup`
- **Lane:** `[want]` (last non-bug cycle `compare-pairs-expansion-2` pulled `[goal]`; alternate to `[want]`)
- **Backlog item:** "[P2][want] Model filter: roll up variants into a parent model."

## Goal
On the `/aircraft` Model filter, group near-duplicate model variants (e.g. `SR20`,
`Sr20 G2`, `Sr20 G3`, `SR20-G2`, `SR20-G3`) under one **"SR20 (all)"** parent that
selects every variant in one click, with the individual variants behind a
collapse-by-default "Show variants" disclosure — so picking "an SR20" no longer means
ticking many boxes.

## Why this is a clean, safe slice
The browse query already accepts a comma-joined `model` param and does
`.in('model', [exact strings])` (`AircraftSaleList.tsx`). So a parent "(all)" simply
selects all its variant strings into the existing param — **no query, no schema, no
backend change.** The grouping is a pure, unit-tested helper. Mobile reuses the same
`AircraftSaleFilters` component, so one component changes both viewports.

## Scope (files)
- `src/lib/modelGroups.ts` — NEW pure helper `groupModelVariants(models)` + types.
- `src/lib/modelGroups.test.ts` — NEW unit tests.
- `src/components/AircraftSaleFilters.tsx` — render grouped Model checkboxes.

## Grouping rule (conservative — never merge genuinely different models)
Normalize a raw model to a grouping key: uppercase, split on `-`, `_`, `/`, whitespace.
- If the first token contains a digit → key = first token (`SR20-G2`→`SR20`, `SF50 G2 Plus`→`SF50`, `172`→`172`).
- Else (alpha prefix like `PA`) → key = first token + `-` + second token (`PA-28-181`→`PA-28`), so Piper families don't all collapse to "PA".
Groups with ≥2 members get a parent "(all)" + expandable variants; single-member
groups render as a plain checkbox (unchanged behavior). `SR20` vs `SR22`, `172` vs
`182` stay separate (different keys); turbo/non-turbo suffix variants (`172N` vs `172`)
stay separate (no letter-stripping) — deliberately conservative.

## Acceptance criteria
1. For a make with variant clutter (e.g. Cirrus), the Model list shows a parent
   "{base} (all)" row with a "Show N variants" disclosure; checking the parent selects
   all member variants (URL `model=` lists every variant), unchecking removes them.
2. The parent checkbox reflects state: checked when all members selected, indeterminate
   when some, unchecked when none.
3. Individual variant checkboxes still work (selecting one shows the parent as partial).
4. Makes whose models don't cluster (each unique) render as before — plain checkboxes.
5. `groupModelVariants` has passing unit tests covering Cirrus generations, casing
   dupes, Piper `PA-28-xxx`, and singletons.
6. `npx next build` + typecheck pass; QA smoke passes on `/aircraft` desktop 1280 +
   mobile 375 with no app-origin console errors / no horizontal overflow; screenshots
   look right.

## Out of scope
- ActiveFilterChips collapsing 6 variant chips into one parent chip (note as follow-up).
- Partnerships/seeking model filters.
- Any DB/query change, casing normalization of stored data, turbo-variant merging.
