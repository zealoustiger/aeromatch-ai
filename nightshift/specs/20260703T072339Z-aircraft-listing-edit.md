# Spec: Edit flow for user-posted aircraft-for-sale listings

## Goal
Let a poster fix a typo, update the price, or add specs on an aircraft-for-sale
listing they already published, instead of having no way to change it once live
(Pillar 1 — frictionless posting; the friction removed here is "posting is a
one-way door").

## Why this slice
Flagged as the top remaining Pillar-1 gap in the last two CHANGELOG "Next" notes
(`draft-resume-banner`, `aircraft-cost-vs-renting`): no `update*Listing` server
action exists for any of the three post types, and `/listings` only offers
View / Mark as sold — no Edit. Scoping to **aircraft-for-sale only** (of the
three listing types) per code-audit recommendation: fewest derived/array fields,
smallest safe slice for one cycle. Partnership/seeker edit is a natural follow-up.

## Scope
- `src/app/actions.ts`: new `updateAircraftListing(id, formData)` — mirrors the
  `deactivateListing` auth/ownership pattern (`.eq('poster_id', user.id)` on the
  update) but writes content columns instead of `status`. Same column set + same
  derivation logic (home_airport → location/state, title fallback, price_text)
  as `createAircraftListing`. Throws if not authenticated or not the owner (0
  rows affected via `.select().single()` after the ownership-scoped update).
- `src/components/PartnershipPhotoUpload.tsx`: add an optional `initialPhotos?:
  string[]` prop to seed existing photo thumbnails when editing (skips the
  localStorage-draft restore path, which stays create-only).
- `src/components/PostAircraftForm.tsx`: add `mode?: 'create' | 'edit'`,
  `listingId?: string`, `initialValues?: {...}` props. In edit mode: prefill
  every field via `defaultValue`, use a listing-scoped draft/autosave key
  (`ch:draft:aircraft-edit:<id>`, isolated from the create-flow key), call
  `updateAircraftListing` instead of `createAircraftListing`, redirect to
  `/aircraft/listing/<id>?updated=1`, button label "Save changes".
- New route `src/app/aircraft/listing/[id]/edit/page.tsx`: server component,
  fetch the row, redirect to `/auth?next=...` if not logged in, `notFound()` if
  the row doesn't exist or `poster_id !== user.id` (never leak someone else's
  listing via a 403 vs 404 — plain not-found), render `PostAircraftForm` in
  edit mode.
- `src/app/listings/page.tsx`: add an "Edit" link next to "Mark as sold" on
  each active aircraft-for-sale row, linking to the new edit route.

## Out of scope
- Partnership and seeker edit flows (follow-up slice).
- Any change to `deactivateListing`/`relistListing`.
- The dead `contact_phone` form field on the aircraft form (not in the
  `aircraft_for_sale` schema at all — pre-existing, unrelated gap; left as-is).
- The "paste a source URL" AI-prefill variant (previously flagged as needing
  server-side fetch + SSRF mitigation — too large/risky for one cycle).
- Schema changes (none needed — RLS already permits owner updates on
  `aircraft_for_sale`).

## Acceptance criteria
1. `/aircraft/listing/[id]/edit` renders the aircraft form prefilled with the
   listing's current make/model/year/registration/ttaf/smoh/engine_type/
   asking_price/home_airport/title/description/photos for the owner; visiting
   it while logged out redirects to `/auth?next=...`; visiting someone else's
   listing (or a nonexistent id) 404s.
2. Submitting the edit form updates the existing row (not a new insert) and
   redirects to `/aircraft/listing/[id]?updated=1`; the listing detail page
   reflects the new values immediately (no stale cache).
3. `/listings` shows an "Edit" link on each active aircraft-for-sale listing
   that goes straight to its edit page.
4. The existing `/aircraft/new` create flow is unchanged — same draft key,
   same behavior, same button label, no regression.
5. `npx next build` + `tsc --noEmit` are clean.
6. QA smoke passes at desktop 1280 + mobile 375 on `/listings`,
   `/aircraft/new`, and one `/aircraft/listing/[id]/edit` URL for a real
   owned test listing — HTTP 200, zero app-origin console errors, zero
   horizontal overflow.
