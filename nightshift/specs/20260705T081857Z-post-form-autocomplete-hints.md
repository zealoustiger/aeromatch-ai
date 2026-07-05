# post-form-autocomplete-hints

## Goal
Add explicit `autoComplete` hints to the contact-info fields (name/email/phone) on all
3 post forms so browsers reliably offer saved-profile autofill, cutting a small but real
step in the posting flow (flagged as a follow-up in the prior `post-form-error-alert-role`
cycle).

## Scope
- `src/components/PostPartnershipForm.tsx` — `contact_name` (autoComplete="name"),
  `contact_email` (autoComplete="email"), `contact_phone` (autoComplete="tel").
- `src/components/PostSeekerListingForm.tsx` — same 3 fields, same values.
- `src/components/PostAircraftForm.tsx` — `contact_phone` only (this form has no
  `contact_name`/`contact_email` field).
- No changes to the shared local `Input` components — `autoComplete` is a native
  `InputHTMLAttributes` prop and already passes through via `{...props}`.
- These 3 components are also reused by the 3 edit pages
  (`aircraft/listing/[id]/edit`, `partnerships/[id]/edit`,
  `partnerships/seeking/[id]/edit`), so the fix applies to both create and edit for free.

## Acceptance criteria
- Each of the 7 contact-field call sites listed above has the appropriate
  `autoComplete` value set.
- No other attributes/behavior change on these inputs.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes (HTTP 200, no console errors, no overflow) at desktop 1280 + mobile 375
  on `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`.
- Rendered HTML for each field shows the correct `autocomplete` attribute.

## Out of scope
- Any other input's `autoComplete` (registration, airport, price, etc.).
- Adding `contact_name`/`contact_email` fields to the aircraft form (not in scope, would be
  a separate schema/UX decision).
- Any change to the shared `Input` wrapper component itself.
