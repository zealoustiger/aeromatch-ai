# aircraft-listing-alert-cta

## Goal
On `/aircraft/listing/[id]`, add a make/model-scoped "Get alerts" capture and demote
the off-platform "View on {source}" button's visual weight so a scraped listing's
sidebar isn't a pure exit-the-site dead end.

## Scope
- `src/app/aircraft/listing/[id]/page.tsx` only:
  - Import and render `<AlertSignup>` right after the existing contact-CTA block
    (both the on-platform and off-platform branches), context = `make + model`
    (falls back to no context if make is missing), `sourcePath` built as
    `/aircraft?make=...&model=...` (the query-string shape `alert-digest`'s
    `parseSourcePath` already understands).
  - In the off-platform (`else`) branch only: restyle the "View on {source}" link
    from a solid filled primary button (`bg-sky-600` white text) to a lighter
    outline/secondary treatment (border + white/tinted background, sky text) —
    same copy, same href, same icon, just less visually dominant than the new
    on-platform alert box below it.
- No schema change, no new component, no action change (`subscribeToAlerts` /
  `AlertSignup` already exist and are used verbatim elsewhere).

## Acceptance criteria
- Every `/aircraft/listing/[id]` page (both user-posted and scraped) renders an
  inline "Get alerts for new {Make} {Model} listings" box below the contact CTA.
- Submitting a real-looking email inserts a row into `alerts` with
  `source_path` matching `/aircraft?make=...&model=...` (verified via a read-only
  DB check, then deleted — no leftover test rows).
- The off-platform "View on {source}" button still works (correct href, opens in
  a new tab for real external sources) but is visually secondary to the alert box.
- The on-platform "Contact the seller" branch (user-posted listings) is
  unchanged except for the new alert box appended below it.
- `npx next build` + typecheck clean; QA smoke passes on a scraped listing detail
  page and a user-posted one at desktop 1280 + mobile 375, zero console errors,
  zero horizontal overflow.

## Out of scope
- Any change to partnership/seeker detail pages (already on-platform-only, no
  redirect to reduce — confirmed via code audit).
- Filtering the alert by price/year/state (matches how other listing-context
  alert boxes on this site work today — make+model only).
- Any change to `alert-digest`, `subscribeToAlerts`, or the `alerts` schema.
