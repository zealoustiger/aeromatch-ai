# partnership-post-photos-visible

## Goal
Surface the photo uploader on the "Post a Partnership" form (`/partnerships/new`) as an
always-visible section instead of burying it inside the collapsed "More details (optional)"
disclosure — mirroring the `aircraft-post-photos-visible` cycle that already did this for
`/aircraft/new`, so both post forms prompt for the highest-value listing element (photos) on
page load.

## Pillar
Pillar 1 — Frictionless listing posting. Friction removed: photos go from one-click-hidden
(behind a closed `<details>`) to visible-on-load on the partnership post form, so an owner is
prompted to add photos before expanding optional details. Parity with the aircraft form.

## Scope
- `src/components/PostPartnershipForm.tsx` — lift the existing **Photos** block out of the
  `<details>` "More details" disclosure into its own always-visible `<section>` placed between
  the "The basics" section and the "More details" disclosure, using the same card styling as the
  aircraft form's surfaced Photos section (`rounded-xl border border-slate-200 bg-white p-4
  shadow-sm sm:p-6`).

## Acceptance criteria
- The Photos block (`<PartnershipPhotoUpload />` + heading + helper copy) renders as its own
  always-visible card on `/partnerships/new`, NOT inside the collapsed "More details" disclosure.
- The new Photos section sits between "The basics" `</section>` and the "More details" `<details>`,
  matching the aircraft form's placement and card styling.
- "More details" still contains the remaining optional fields (Year, Listing details Title/Description,
  Ongoing costs, Share structure) and stays closed by default.
- The `PartnershipPhotoUpload` component, its upload endpoint, MAX_PHOTOS, and accepted types are
  unchanged (block is moved, not modified).
- The AI-prefill `hasOptional` auto-open logic is unaffected (it never referenced photos — photos
  aren't a form field).
- `npx next build` + `npx tsc --noEmit` pass; QA smoke (desktop 1280 + mobile 375) is HTTP 200,
  zero app-origin console errors, zero horizontal overflow; screenshots show the Photos card
  rendering correctly above the collapsed "More details" disclosure at both viewports.

## Out of scope
- Any change to the uploader behavior, endpoints, photo limits, or accepted types.
- Any change to the other post forms.
- "Paste & prefill from a source URL" (external fetch — needs human compliance review).
