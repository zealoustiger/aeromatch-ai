# seeker-model-variant-rollup

## Goal
Roll up near-duplicate model-variant tokens (e.g. "SR20" / "Sr20 G2" / "SR20-G2") under
one parent "{base} (all)" checkbox in the `/partnerships/seeking` "Model Wanted" filter
and its active-filter chips, matching the rollup `/aircraft` and `/partnerships` already
have.

## Scope
- `src/components/SeekerFilters.tsx` — group the `models` option list via the existing
  `groupModelVariants()` helper (`src/lib/modelGroups.ts`, already unit-tested, no
  changes needed there); render a parent "(all)" checkbox + collapsed "Show N variants"
  disclosure for multi-member groups, plain checkboxes for singletons — mirrors
  `PartnershipFilters.tsx`'s `ModelGroupRow` exactly (same helper, same UI shape, ported
  not reinvented).
- `src/components/SeekerActiveFilterChips.tsx` — accept an optional `models` prop; when
  a rolled-up group's members are ALL selected, collapse them into one "{base} (all)"
  removable chip instead of one chip per variant — mirrors
  `PartnershipActiveFilterChips.tsx`'s collapse logic.
- `src/app/partnerships/seeking/page.tsx` — pass the already-fetched `seekerModels` list
  into `SeekerActiveFilterChips` (currently only receives `params`).
- `nightshift/BACKLOG.md` — check off the "apply the same rollup to the
  partnerships/seeking model filters" remaining note under the `[P2][want] Model filter:
  roll up variants into a parent model` item.

## Out of scope
- DB casing normalization of stored model variants (flagged destructive-ish, human call,
  already noted in BACKLOG.md).
- Any change to `getSeekerModels()`/`seekerModelFilter.ts` query/matching logic — this is
  a pure client-side grouping of the option list already returned.
- `/aircraft` and `/partnerships` (already shipped).

## Acceptance criteria
- On `/partnerships/seeking`, a model family with ≥2 variant tokens (e.g. mock/seed data
  containing "172" + "172 G1000", or a synthetic SR20 cluster if seed data doesn't
  cluster) renders a single "{base} (all)" parent checkbox with a collapsed "Show N
  variants" disclosure; singleton tokens render as plain checkboxes, unchanged.
- Clicking the parent checkbox selects/deselects every member in one click (URL `model`
  param updates to the full member list or drops them all).
- When every member of a group is selected, the active-filter chip row shows one "{base}
  (all)" chip (not one per variant); removing it drops all members.
- Partial/singleton selections still render one chip per model, unchanged.
- No change to `/aircraft` or `/partnerships` filter behavior.
- `npx tsc --noEmit` and `npx next build` clean; QA smoke passes on
  `/partnerships/seeking` (desktop 1280 + mobile 375, HTTP 200, no console errors, no
  overflow).
