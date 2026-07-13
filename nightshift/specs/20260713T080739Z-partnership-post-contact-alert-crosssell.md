# Post-contact alert cross-sell on partnership listings (parity with aircraft)

## Goal
After a pilot sends an on-site message about a partnership listing, show a
"Message sent!" success panel with a family-scoped `AlertSignup` cross-sell
(source `post_contact`) instead of navigating straight to `/messages/{id}` —
mirroring the aircraft listing page's already-shipped `post-contact-alert-crosssell`.

## Scope
- `src/components/ContactButtons.tsx` (desktop message form on `/partnerships/[id]`):
  on successful send, render a "Message sent!" + `AlertSignup` panel (same shape as
  `AircraftContactButton`'s `sentThreadId` branch) instead of immediately calling
  `router.push`.
- `src/components/ContactBar.tsx` (mobile sticky contact bar, same page): same
  success-panel treatment, both for a message sent from the expanded sticky form
  AND the auto-send-on-return-from-auth (`?contact=1`) path it owns.
- `src/app/partnerships/[id]/page.tsx`: pass the same `alertContext`/
  `alertSourcePath` shape the existing family `AlertSignup` box lower on the
  page already computes inline through as new props to `ContactButtons` and
  `ContactBar` (that box does not currently fetch `alertCount`/`matchCount` on
  this page — `ContactButtons`/`ContactBar` accept those as optional props for
  parity with `AircraftContactButton`, but the page passes `undefined` for
  both here; `AlertSignup`'s existing honesty gate renders no social-proof/
  match-count line when they're omitted, same as the page's own family box
  today — no fabrication, no new query).
- No new DB column, no new query.

## Acceptance criteria
- Sending a real message via the desktop `ContactButtons` form on
  `/partnerships/[id]` shows "Message sent!" plus a family-scoped `AlertSignup`
  (`source="post_contact"`, `noun="partnership"`) with a "View conversation →"
  link, instead of navigating away immediately.
- The mobile sticky `ContactBar` shows the same success panel after a send
  (both the manual expanded-form send and the `?contact=1` auto-send-after-auth
  path), without auto-navigating past it.
- The existing "poster viewing their own listing" neutral note and the
  email/phone contact buttons are unchanged.
- No schema change, no new capture-point copy that isn't reusing the existing
  family alert context already computed on the page.
- `npx next build` + typecheck clean; QA smoke passes on `/partnerships/[id]`
  desktop 1280 + mobile 375 with zero console errors and zero overflow.

## Out of scope
- Aircraft-side listing page (already shipped).
- The seeker-listing contact flow (`SeekerContactBar.tsx`) — not part of this slice.
- Any change to the existing family/watch `AlertSignup` boxes lower on the page.
