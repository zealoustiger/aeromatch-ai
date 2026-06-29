# Spec: aircraft-contact-phone

**Timestamp:** 2026-06-29T103759Z  
**Pillar:** Frictionless posting (Pillar 1)  
**Slug:** aircraft-contact-phone

## Goal
Surface the optional `contact_phone` field on the aircraft post form and show it on the listing detail page, closing a parity gap vs. the partnership post form which already collects it.

## Scope
- `src/components/PostAircraftForm.tsx` — add optional `contact_phone` tel input in the "More details" section (following the same pattern as PostPartnershipForm lines 629)
- `src/app/aircraft/listing/[id]/page.tsx` — when `p.source === 'user' && p.contact_phone`, show the phone number below the Message button in the "Contact the seller" section

## Acceptance criteria
1. `/aircraft/new` "More details" section shows an optional "Phone (optional)" tel input
2. Submitting the form with a phone number stores it via the existing `createAircraftListing` action (already reads `formData.get('contact_phone')`)
3. On `/aircraft/listing/[id]` for a user-posted listing with `contact_phone` set, the Contact section shows the phone number below the Message button
4. For user-posted listings without a phone, and for scraped listings, no phone is shown (no empty/null display)
5. Build passes, typecheck clean, QA smoke exits 0

## Out of scope
- Changing the DB schema (column already exists: `aircraft_for_sale.contact_phone text`)
- Changing the server action (already reads `contact_phone` from formData)
- Showing contact_phone for scraped listings (they don't have one; null)
- Email notification changes
