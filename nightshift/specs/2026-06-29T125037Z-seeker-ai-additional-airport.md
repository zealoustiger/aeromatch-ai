# Spec: seeker-ai-additional-airport

**Timestamp:** 2026-06-29T125037Z
**Pillar:** Frictionless listing posting (Pillar 1)

## Goal
When a seeker generates an AI draft on `/partnerships/seeking/new`, the "Also flying from" field (`additional_airport_2`) is now extracted and pre-filled from the pasted notes — completing the full AI-prefill coverage for the seeker form.

## Context
The `seeker-additional-airports` cycle (2026-06-29) added an "Also flying from" `AirportFormInput` with `name="additional_airport_2"` to the seeker form. The `createSeekerListing` action already reads this field and stores it as `additional_airports[0]` in the DB. However, `generateSeekerDraft` does not extract a second airport — so if a seeker writes "I'm based at KPAO but also fly regularly from KSQL," only `home_airport=KPAO` gets filled; the second field stays empty and must be filled manually.

## Scope
Files expected to touch:
- `src/app/actions.ts` — `SeekerDraft` interface + `generateSeekerDraft` tool schema + system prompt + return value
- `src/components/PostSeekerListingForm.tsx` — add `fillFormField` call for `additional_airport_2`

## Acceptance criteria
1. `SeekerDraft` interface in `actions.ts` includes `additional_airport_2?: string`
2. `generateSeekerDraft` tool schema includes `additional_airport_2` as an optional ICAO string
3. System prompt instructs the model to extract a second airport ICAO when the pilot mentions flying from multiple airports
4. `generateSeekerDraft` returns `additional_airport_2` (uppercased, 4-char clamped) when extracted
5. `PostSeekerListingForm.tsx` fills `[name="additional_airport_2"]` from `result.additional_airport_2` when present
6. `npx next build` + `tsc --noEmit` pass clean
7. QA smoke exits 0 on `/partnerships/seeking/new` (HTTP 200, zero app-console errors, zero overflow)

## Out of scope
- Extracting 3+ airports (the form only has one "Also flying from" field)
- Changing the form UI
- Any other forms or AI drafts
- Schema changes
