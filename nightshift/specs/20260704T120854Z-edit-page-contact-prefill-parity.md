# Spec: edit-page-contact-prefill-parity

## Goal
Fix a Pillar 1 (frictionless posting) regression: the "remembered contact info"
convenience — where a poster's name/email/phone auto-saves from any listing
(`src/app/actions.ts`'s lazy-save into `user_metadata`) and prefills on their
*next* listing — silently breaks in edit mode because the three edit pages don't
pass the saved `userEmail`/`userName`/`userPhone` values into the post forms the
way the three `new` pages already do.

## Scope
- `src/app/aircraft/listing/[id]/edit/page.tsx` — pass
  `userPhone={user.user_metadata?.contact_phone}` to `<PostAircraftForm>`
  (matches `/aircraft/new/page.tsx`; this form has no name/email fields).
- `src/app/partnerships/[id]/edit/page.tsx` — pass
  `userEmail={user.email} userName={user.user_metadata?.full_name} userPhone={user.user_metadata?.contact_phone}`
  to `<PostPartnershipForm>` (matches `/partnerships/new/page.tsx`; currently
  passes none of the three).
- `src/app/partnerships/seeking/[id]/edit/page.tsx` — add the missing
  `userPhone={user.user_metadata?.contact_phone}` to the existing
  `<PostSeekerListingForm>` call (already passes `userEmail`/`userName`).
- No component/form changes — `PostAircraftForm`/`PostPartnershipForm`/
  `PostSeekerListingForm` already accept and correctly use these props (fallback
  is `initialValues?.contact_* ?? user{Email,Name,Phone}`, so a listing's own
  saved value always wins; the account-level value only fills a field the
  *current* listing left blank).
- No schema/DB change, no auth files touched.

## Acceptance criteria
1. All three edit pages fetch `user` (already do, for the auth gate) and thread
   the three contact props through to their form component, matching what the
   corresponding `new` page passes.
2. On a listing whose own `contact_phone`/`contact_name`/`contact_email` is null
   but the account has a saved value, the edit form now prefills it (previously
   blank). A listing that already has its own contact value is unaffected
   (initialValues still wins).
3. `npx next build` + typecheck stay clean.
4. No new console errors or horizontal overflow at desktop 1280 / mobile 375 on
   the three edit routes or their `new` counterparts (regression check).

## Out of scope
- Any change to auth/signup gating (Pillar 2) or the lazy-save mechanism itself.
- The seeker form's missing photo-upload section (runner-up finding, bigger lift).
- The partnership/seeker home-airport required-field question (looks intentional).
