# seller-upgrade-cta-post-listing

## Goal
Add the two "seller upgrade" fake-door CTAs — "Feature this listing" + "Get it vetted/verified" — to the post-listing success moment, closing the one named remaining gap ("a separate placement from this item's scope, still open as its own follow-up idea") left open by the `monetization-tally-admin` cycle that closed out the rest of the Monetization — intent signals `[want]` item.

## Scope
- `src/lib/monetizationTally.ts` — add `feature_listing` and `listing_vetting` to `MONETIZATION_PATHS` so the existing `/admin/monetization` tally page picks up opt-ins for these two new paths with zero other change.
- `src/app/aircraft/listing/[id]/page.tsx` — inside the existing `justPosted` ("Your listing is live!") success banner (owner-only, shown once right after posting), add two small `MonetizationIntent` CTAs: "Feature this listing" (`path="feature_listing"`) and "Get it vetted" (`path="listing_vetting"`).
- `src/app/partnerships/[id]/page.tsx` — same addition inside its own `justPosted` success banner.
- No schema change, no new component (reuses `MonetizationIntent` verbatim), no new dependency.

## Acceptance criteria
- Visiting `/aircraft/listing/[id]?posted=1` for a real listing (or driving the actual post flow) shows the "Your listing is live!" banner with two new CTA buttons below the existing copy; clicking either opens the existing honest "Coming soon — want early access?" modal.
- Same on `/partnerships/[id]?posted=1`.
- The CTAs do NOT render outside the `justPosted` banner (i.e., not shown to ordinary visitors browsing someone else's listing) — this is a seller-only, post-listing-moment placement, distinct from the buyer-facing broker/financing/etc. CTAs already live on both detail pages.
- `/admin/monetization` renders the two new paths (0 count is fine, no fabricated numbers) alongside the existing 7.
- `npx tsc --noEmit` and `npx next build` are clean.
- QA smoke (`qa-smoke.mjs`) passes at desktop 1280 + mobile 375 on a real aircraft listing URL with `?posted=1`, a real partnership listing URL with `?posted=1`, and `/admin/monetization` — HTTP 200, zero app-origin console errors, zero horizontal overflow.

## Out of scope
- Any real feature/vetting service, payment, or admin workflow — this stays a pure fake-door demand-signal capture, same as every other `MonetizationIntent` CTA.
- Placing these CTAs anywhere besides the post-listing success banner (e.g. not on `/listings`, not on ordinary listing views).
- The seeker post flow (`/partnerships/seeking/new`) — its detail page has no comparable "featured/vetted" seller concept; left out.
