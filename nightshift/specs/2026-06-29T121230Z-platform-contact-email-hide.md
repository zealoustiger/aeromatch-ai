# Spec: platform-contact-email-hide

**Timestamp:** 2026-06-29T121230Z
**Pillar:** Frictionless listing posting (Pillar 1)

## Goal
When a poster selects "Message through ClubHanger" (the default contact method) on the Partnership or Seeker post forms, hide the email input — it is irrelevant when platform messaging is selected and creates visual noise / confusion.

## Scope
- `src/components/PostPartnershipForm.tsx` — add `contactMethod` state; hide the email `<div>` when `contactMethod === 'platform'`
- `src/components/PostSeekerListingForm.tsx` — same pattern

## Acceptance criteria
1. On `/partnerships/new`, the "Email" input is hidden by default (since "Message through ClubHanger" is the default contact method)
2. Selecting "Email only" or "Email or phone" reveals the email field
3. Switching back to "Message through ClubHanger" hides it again
4. Same behavior on `/partnerships/seeking/new`
5. Email value is preserved in the DOM when hidden (uses CSS `hidden` class, not conditional mount) — no data loss if user types email then switches methods
6. Draft restore correctly syncs the `contactMethod` state (mirrors the existing `selectedMake` sync pattern)
7. Build clean, tsc clean, smoke green (HTTP 200, zero app-origin console errors, zero horizontal overflow) on both pages at 1280 + 375

## Out of scope
- Phone field visibility (keep it always visible — it's used for "Phone only" and "Email or phone")
- Aircraft post form (no contact method select — it defaults to platform messaging already)
- Any server-side or schema changes
