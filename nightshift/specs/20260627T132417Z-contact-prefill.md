# Spec: contact-prefill

**UTC**: 2026-06-27T132417Z  
**Slug**: contact-prefill  
**Pillar**: Posting (Pillar 1) — friction removed: logged-in users no longer need to type their email and name into the contact section

## Goal
Pre-fill the `contact_email` and `contact_name` fields on the Partnership and Seeking post forms with the signed-in user's account email and display name, so they never have to type what we already know.

## Scope
- `src/app/partnerships/new/page.tsx` — pass `userEmail` + `userName` to `PostPartnershipForm`
- `src/app/partnerships/seeking/new/page.tsx` — pass same to `PostSeekerListingForm`
- `src/components/PostPartnershipForm.tsx` — add `userEmail?`/`userName?` props; set as `defaultValue` on contact fields; update hint text
- `src/components/PostSeekerListingForm.tsx` — same

No schema change. No new routes.

## Acceptance criteria
1. A logged-in user visiting `/partnerships/new` sees their account email pre-filled in the "Email" contact field and (if name is available from their profile) their name pre-filled in "Your Name."
2. A logged-in user visiting `/partnerships/seeking/new` sees the same pre-fill.
3. Both fields remain editable — the user can clear or change the pre-filled values before submitting.
4. A logged-out user sees the original empty placeholder text (no pre-fill).
5. The hint text below the email field updates to say "Pre-filled from your account — edit if needed" when an email is pre-filled, and retains the original "Defaults to your account email. Not shown publicly." when not logged in.
6. `npx next build` passes with zero TypeScript errors.
7. QA smoke exits 0 on `/partnerships/new`, `/partnerships/seeking/new` (HTTP 200, no console errors, no overflow at desktop 1280 + mobile 375).

## Out of scope
- Aircraft post form (`/aircraft/new`) — no contact fields exist there
- Controlled state for the contact fields (still uncontrolled `defaultValue`)
- Fetching a display name from the database profiles table — use `user.user_metadata.full_name` from auth only
