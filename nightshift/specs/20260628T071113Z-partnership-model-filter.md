# Spec: partnership-model-filter

**Goal**: Add a `model` URL filter to the partnerships browse page so the cross-sell CTA on aircraft listing detail pages can deep-link to exact-model partnership searches (e.g. `/partnerships?make=cessna&model=172`).

**Scope**:
- `src/lib/partnershipsQuery.ts` — add `model?: string` to `PartnershipFilters`; apply ILIKE model filter in mock and Supabase branches
- `src/components/PartnershipFilters.tsx` — add "Aircraft Model" text input after "Aircraft Make"
- `src/components/PartnershipActiveFilterChips.tsx` — add removable model chip
- `src/app/aircraft/listing/[id]/page.tsx` — update `PartnershipCrossSellPanel` CTA link to include `model` param when model-level match exists

**Acceptance criteria**:
1. `/partnerships?make=cessna&model=172` returns only active Cessna listings where the model field contains "172" (ILIKE)
2. An "Aircraft Model" text input appears in the filter sidebar below "Aircraft Make" — typing "172" and tabbing away applies the filter
3. A removable chip for the model filter appears in `PartnershipActiveFilterChips` when `?model=` is set
4. On aircraft listing detail pages, the cross-sell CTA links to `/partnerships?make={make}&model={model}` when `crossSell.modelLevel` is true (and plain `?make=` when model-level is false, as before)
5. No regression: `/partnerships?make=cessna` (make-only), all other filters, and the count line all work as before

**Out of scope**:
- Model filter on the seeking browse page
- Model variant rollup/grouping
- Schema changes
