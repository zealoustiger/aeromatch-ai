# Spec: aircraft-contact-phone-save

## Goal
Fix a silent data-loss bug in the aircraft-for-sale post flow: the "Phone (optional)"
field on `/aircraft/new` (and its edit form) is rendered and submitted but never saved
to the database, never shown back to the poster on edit, and therefore never appears
on the listing page — even though the listing detail page already has full display
logic for it.

**Correction found during this cycle (2026-07-03):** a prior in-progress draft of this
spec assumed the `contact_phone` column already existed on `aircraft_for_sale`. It does
not — direct verification against the live Supabase DB (service-role insert) showed
`PGRST204: Could not find the 'contact_phone' column`. `aircraft_for_sale` never had this
column; only `partnerships` and `partnership_seekers` do. An earlier merged cycle
(2026-06-29, `feat(posting): surface contact_phone...`) already shipped the form input +
listing-detail display against this nonexistent column, so the feature was dead on
arrival even before this cycle. Scope is revised accordingly: this is now also a additive
schema migration (per `FREEZE.md`, additive-only, human-applied — the loop has no direct
DB/DDL connection, only the PostgREST/service-role client), with the write paths degrading
gracefully until the human runs it — same pattern as `saved_listings.note` /
`partnerships.ttaf` etc.

## Scope
- `supabase/schema.sql` — additive `alter table aircraft_for_sale add column if not
  exists contact_phone text;`, marked ⚠️ HUMAN ACTION REQUIRED at the bottom (human must
  apply in the Supabase SQL editor; not yet applied).
- `src/app/actions.ts` — `createAircraftListing` and `updateAircraftListing`: add
  `contact_phone` to the insert/update payload, but detect a `42703`/`PGRST204` (missing
  column) error and **retry without `contact_phone`** so posting/editing keeps working
  today, before the migration is applied (this is the core posting flow — it must not
  hard-fail).
- `src/app/aircraft/listing/[id]/edit/page.tsx` — select `contact_phone` in the query,
  but fall back to a select without it if that query errors (same reason — must not
  404 the edit page for every owner until the migration lands).
- `src/components/PostAircraftForm.tsx` — add `contact_phone?: string` to the
  `AircraftEditInitial` interface; wire `defaultValue={initialValues?.contact_phone ?? ''}`
  onto the existing Phone `<Input>` so an edit correctly prefills and re-saves it (once
  the column exists).

No change to the partnership or seeker forms/actions (already correct, already have the
column). No change to the listing detail page's display logic (already correct, already
self-suppresses via `p.contact_phone` being `undefined` when absent from the select).

## Acceptance criteria
- `createAircraftListing` writes `contact_phone` from the submitted form into the
  `aircraft_for_sale` insert payload when the column exists, and gracefully retries
  without it (posting still succeeds) when it doesn't.
- `updateAircraftListing` does the same for updates.
- The edit form (`/aircraft/listing/[id]/edit`) prefills the Phone field with the
  listing's current `contact_phone` when the column exists; does not 404 when it doesn't.
- `npx next build` + typecheck pass clean.
- Direct DB verification (service-role insert/update against a throwaway row) confirms
  the write path once the column is applied.
- No regression to the partnership or seeker post/edit forms (untouched files), and no
  regression to plain aircraft posting/editing while the column is still missing.

## Out of scope
- Making the phone field required or changing its copy/placement.
- Any change to how the phone number is displayed on the listing detail page (already
  correct — a `tel:` link renders when `contact_phone` is set).
- Any change to `createPartnership`/`updatePartnershipListing`/`createSeekerListing`/
  `updateSeekerListing` (already save this field correctly).
- Actually applying the migration (human-only — the loop has no DDL connection).
