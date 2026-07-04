# partnership-annual-damage

## Goal
Bring the honesty-gated "Annual inspection" and "Damage history" buyer-analysis panels — already live on aircraft-for-sale listing pages — onto partnership listing pages, closing a Pillar 3 (proprietary buyer analysis) parity gap.

## Scope
- `supabase/schema.sql` — additive migration: `alter table partnerships add column if not exists annual_due date;` + `alter table partnerships add column if not exists damage_history boolean;` (HUMAN ACTION REQUIRED comment, same pattern as the existing `partnership_add_spec_fields`/`aircraft_add_contact_phone` migrations).
- `src/lib/types.ts` — add `annual_due: string | null` and `damage_history: boolean | null` to the `Partnership` interface.
- `src/app/actions.ts` — `createPartnership` and `updatePartnershipListing`: collect the two new optional fields from the post/edit form and write them, with the same graceful-fallback pattern already used for `ttaf`/`smoh`/`engine_type` and `previous_buy_in_price`/`buy_in_price_changed_at` (retry without a column group if Postgres reports it missing, so posting/editing keeps working before the migration is applied).
- `src/components/PostPartnershipForm.tsx` — two new optional fields in the existing "Aircraft" subsection of "More details": "Annual due" (`<input type="month">`) and "Damage history reported?" (a 3-state select: unknown/no/yes). Add both to `PartnershipEditInitial`.
- `src/app/partnerships/[id]/edit/page.tsx` — select the two new columns (with the same graceful fallback used for ttaf/smoh/engine_type) and prefill `initialValues`.
- `src/app/partnerships/[id]/page.tsx` — import `computeAnnualStatus`/`formatAnnualDueLabel` (`@/lib/annualStatus`) and `computeDamageHistory` (`@/lib/damageHistory`, both already shared, pure, unit-tested libs used by the aircraft detail page); add local `AnnualStatusPanel`/`DamageHistoryPanel` components (ported from the aircraft detail page's implementation — same codebase pattern as `ShareCostPanel`/`PartnerShareCostPanel`, page-local mirrors rather than a shared component) and render them near `EngineLifePanel`/`AirframeUsagePanel`. Both self-suppress when the underlying field is null — never fabricate a status.

## Acceptance criteria
- `npx next build` + typecheck pass clean.
- `/partnerships/new` renders the two new optional fields in "More details" → "Aircraft"; leaving them blank still submits successfully (graceful fallback keeps working pre-migration).
- `/partnerships/[id]/edit` prefills the two fields when present on the listing.
- `/partnerships/[id]` renders `AnnualStatusPanel`/`DamageHistoryPanel` when the corresponding field is present, and cleanly omits them when null (no crash, no fabricated value).
- No change to `/aircraft/*` pages or behavior (aircraft-for-sale is untouched — its `annual_due`/`damage_history` are scraper-only, as before).
- QA smoke passes (HTTP 200, no app-origin console errors, no horizontal overflow) at desktop 1280 + mobile 375 on `/partnerships/new`, `/partnerships/[id]`, `/partnerships/[id]/edit`.

## Out of scope
- AI-draft extraction of annual_due/damage_history from pasted partnership text (a natural follow-on, left as a `Next` note — would require extending the draft-from-text/draft-from-url extraction schemas).
- Any change to the aircraft-for-sale form, detail page, or its scraper-populated `annual_due`/`damage_history`.
- Running the actual `ALTER TABLE` in the live Supabase project (human action, same as prior pending migrations).
