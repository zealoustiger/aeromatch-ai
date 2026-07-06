# partnership-model-rollup

## Goal
Apply the existing `groupModelVariants` variant-rollup UI (parent "{base} (all)"
checkbox + collapsed-by-default variant list) to `/partnerships`' Model filter and
active-filter chips, matching what `/aircraft` already has — the explicit
"Remaining" item noted on the Model-filter-rollup backlog entry.

## Scope
- `src/components/PartnershipFilters.tsx` — import `groupModelVariants`, add a
  `toggleModelGroup` callback (mirrors `AircraftSaleFilters.tsx`'s), and render the
  model checkbox list via grouped `ModelGroupRow` (singletons stay plain checkboxes).
- `src/components/PartnershipActiveFilterChips.tsx` — accept an optional `facets`
  prop; when a fully-selected variant group exists, collapse its member chips into
  one "{base} (all)" chip (mirrors `ActiveFilterChips.tsx`).
- `src/app/partnerships/page.tsx` — pass the already-fetched `partnershipFacets`
  into `PartnershipActiveFilterChips`.
- No query/schema change — reuses the existing comma-joined `model` param and the
  already-unit-tested `groupModelVariants`/`modelGroupKey` helpers verbatim.

## Acceptance criteria
- On `/partnerships` with a make selected that has ≥2 variants in one group (e.g.
  Cirrus → SR20 family), the sidebar (desktop) and mobile drawer show a single
  "{base} (all)" checkbox with a "Show N variants" disclosure, matching `/aircraft`.
- Clicking the parent checkbox selects/deselects every member variant in one click
  (indeterminate state when some-but-not-all are selected).
- When a group is fully selected, the results-header active-filter chips collapse
  to one "{base} (all)" chip whose removal clears every member; partially-selected
  groups and singleton models still render one chip per model (unchanged).
- `npx next build` + typecheck pass; `qa-smoke.mjs` passes on `/partnerships` at
  desktop 1280 + mobile 375 with no new console errors or overflow.
- Existing single-model selection/removal behavior is unchanged when no group
  applies (e.g. make with no clustered variants, or no make selected).

## Out of scope
- Normalizing stored variant casing in the DB (destructive-ish, human call).
- Applying the rollup to `/partnerships/seeking`'s model filter (separate,
  free-text-parsed model field — different data shape, own slice).
