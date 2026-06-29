# Spec: seeker-additional-airports

**Timestamp:** 20260629T075453Z
**Pillar:** Frictionless listing posting (Pillar 1)

## Goal
Let a pilot seeking a partnership list one additional airport they'd fly from, capturing real geographic flexibility (e.g., a pilot near both KPAO and KNUQ) without increasing the required minimum for posting.

## Scope
- `supabase/schema.sql` — additive column: `alter table partnership_seekers add column if not exists additional_airports text[];`
- `src/components/PostSeekerListingForm.tsx` — add one optional `AirportFormInput` ("Also flying from") below the required Home Airport in "The basics" section
- `src/app/actions.ts` — `createSeekerListing`: collect the `additional_airport_2` form field, build `additional_airports[]`, include in DB insert with graceful fallback if column not yet migrated
- `src/lib/types.ts` — add `additional_airports?: string[] | null` to `PartnershipSeeker` interface
- `src/app/partnerships/seeking/[id]/page.tsx` — display additional airports after primary home airport when present

## Acceptance Criteria
1. Seeker form shows an optional "Also flying from (optional)" `AirportFormInput` below Home Airport in "The basics" section
2. On submit with the extra airport filled: if column exists in DB, it's stored as `additional_airports: ['KNUQ']`; if column not yet applied, listing still creates without error (graceful fallback)
3. On submit with the extra airport empty: no change to existing behavior — insert unchanged
4. Seeker detail page: when `additional_airports` has entries, shows them alongside the primary airport (e.g., "KPAO · Austin, TX · also: KNUQ")
5. Build (`npx next build`) and typecheck (`tsc --noEmit`) both pass, zero new errors
6. qa-smoke exit 0 on `/partnerships/seeking/new` at desktop 1280 + mobile 375

## Out of Scope
- Filtering/search results across `additional_airports` — a next cycle slice
- AI draft extraction of additional airports from pasted notes
- More than 1 extra airport field in this cycle (can expand later)
- Updating the SeekerList browse cards to show additional airports
