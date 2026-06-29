# Spec: partnership-buyin-optional

**UTC:** 2026-06-29T07:27:11Z  
**Pillar:** Frictionless listing posting (Pillar 1)  
**Slug:** `partnership-buyin-optional`

## Goal
Make Buy-in optional on the partnership post form so owners who haven't set a price
("discuss with buyer", "make an offer") can post without being blocked on a required
number field. Reduces required fields from 5 → 4, implementing the BACKLOG
"Collapse the post flow to one smart screen" item (irreducible set: make/model ·
airport ICAO · price-or-share; "price-or-share" means either, not both).

## Scope
- `src/components/PostPartnershipForm.tsx` — remove `required` from buy-in input,
  update Label to show "(optional)", add helper text "Leave blank if price is
  negotiable — describe the terms in your listing."
- No server action change (already handles null buy_in_price gracefully).
- No schema change (buy_in_price is `integer` nullable in DB).
- No query or display changes (PartnerMarketCheck, PartnerShareCostPanel already
  self-suppress when buy_in is null).

## Acceptance criteria
1. `/partnerships/new` loads with HTTP 200, no console errors.
2. The Buy-in field shows "(optional)" in its label.
3. Helper text "Leave blank if price is negotiable" appears under the field.
4. Submitting the form without a buy-in value succeeds — no client-side or
   server-side validation error blocks the submission.
5. `npx next build` compiles cleanly (0 new TS errors).
6. QA smoke exits 0 at desktop 1280 + mobile 375 on `/partnerships/new`.

## Out of scope
- Making Share Type optional (it stays required — it's still valuable for buyers
  filtering by structure).
- Changing any other required fields on any other form.
- Adding client-side "provide either buy-in or share type" validation.
- Changing how partnership cards/listings display when buy_in is null.
