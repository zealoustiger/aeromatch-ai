# Spec: post-platform-default

**UTC:** 2026-06-29T112442Z
**Pillar:** Frictionless listing posting (Pillar 1)

## Goal
Add "Message through ClubHanger" as the first/default contact-method option on both the partnership and seeker post forms, and change the server-action fallback from `'email'` to `'platform'`. Keeps engagement on-site, protects poster privacy by default, and removes the confusing email-exposure decision from the posting flow.

## Problem
Both `PostPartnershipForm` and `PostSeekerListingForm` offer three contact-method choices — "Email only", "Phone only", "Email or phone" — with no platform-messaging option. The server action defaults to `'email'` when nothing is submitted, meaning every new listing exposes the poster's email to any logged-in user via a `mailto:` link. The helper text says "Not shown publicly" which is incorrect for the `'email'` and `'both'` cases. `ContactButtons` and `SeekerContactBar` already handle `contact_method='platform'` correctly (show Message button, suppress email/phone links) — the gap is only in the post forms and server-action defaults.

## Scope
- `src/components/PostPartnershipForm.tsx` — add `<option value="platform">` as first option in `contact_method` select; update email helper text
- `src/components/PostSeekerListingForm.tsx` — same
- `src/app/actions.ts` — change two fallback defaults from `|| 'email'` to `|| 'platform'`
- No schema change, no DB migration, no ContactButtons/SeekerContactBar/ContactBar changes

## Acceptance criteria
1. `PostPartnershipForm`: "Preferred Contact Method" select shows "Message through ClubHanger (default)" as first option; "Email only", "Phone only", "Email or phone" remain as secondary choices.
2. `PostSeekerListingForm`: same.
3. `createPartnership` server action: `contact_method` falls back to `'platform'` when not submitted.
4. `createSeekerListing` server action: same.
5. A partnership or seeker detail page with `contact_method='platform'` shows only the "Message" button — no "Send Email" link (no regression in existing ContactButtons/SeekerContactBar).
6. Existing listings with `contact_method='email'` continue to show "Send Email" (existing DB rows unaffected).
7. `npx next build` + `tsc --noEmit` pass clean.
8. `qa-smoke.mjs` exit 0 on the affected post forms + one partnership detail + one seeker detail.

## Out of scope
- Conditionally hiding/showing the email input based on selected contact method (JS state — future slice)
- Changing existing listings' contact_method in the DB
- Changes to ContactButtons, SeekerContactBar, ContactBar components
