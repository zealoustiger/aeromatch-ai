# Post-contact alert cross-sell

## Goal
At the two real contact-success moments on a user-posted aircraft listing page —
sending a message to the seller, or clicking the seller's phone number — offer a
one-tap "get alerts for similar {make} {model} listings" prompt, since a buyer who
just contacted a seller has proven exactly what they want but has no alert capture
at that moment today.

## Scope
- `src/components/AircraftContactButton.tsx` — after a message actually sends
  (both the manual "Send" submit and the `?contact=1` auto-send-after-auth effect),
  stop immediately `router.push`-ing to `/messages/{threadId}`. Instead show an
  inline "Message sent!" success panel containing the existing `<AlertSignup
  source="post_contact" .../>` plus a "View conversation →" button that completes
  the navigation. New props: `alertContext?`, `alertSourcePath`, `alertCount?`.
- New `src/components/PhoneContactLink.tsx` (client) — wraps the existing "Or call
  / text: {phone}" line; on click of the `tel:` link (which doesn't navigate the
  page away), reveals the same `<AlertSignup source="post_contact" .../>` inline
  below the number.
- `src/app/aircraft/listing/[id]/page.tsx` — extract the already-computed
  `alertSourcePath` expression (currently inlined only for the bottom AlertSignup)
  into a shared const; pass it + `alertContext`/`alertCount` to both
  `AircraftContactButton` and the new `PhoneContactLink`. Replace the raw phone
  `<p>` with `<PhoneContactLink>`.
- Emits the existing `alert_subscribed` event with `source: 'post_contact'` (no
  new event type — reuses `AlertSignup`'s existing tracking).

## Out of scope
- Scraped/non-user listings (`p.source !== 'user'`) — no on-site contact action
  exists there (outbound link only), so no success moment to hook into.
- Partnership/seeker detail pages' contact bars (`ContactBar`/`ContactButtons`) —
  same idea, but a separate follow-up slice (different components/pages).
- Auto-navigating away without the user clicking through — keep it a deliberate,
  skippable single extra click, not a forced delay.

## Acceptance criteria
- Sending a message on a user-posted aircraft listing shows a "Message sent!"
  panel with a make/model-scoped `AlertSignup` (`source="post_contact"`) instead
  of navigating immediately; clicking "View conversation →" completes the nav to
  `/messages/{threadId}`.
- Clicking the seller's phone number reveals the same alert prompt inline, without
  navigating the page away.
- A signed-in visitor who already has an alert for that make/model sees
  `AlertSignup`'s existing "already subscribed" state, never a duplicate form.
- Owner-viewing-own-listing and scraped-listing branches are unchanged.
- `npx tsc --noEmit` and `npx next build` both clean.
- `qa-smoke.mjs` passes on a real `/aircraft/listing/[id]` (user-posted) at
  desktop 1280 + mobile 375: HTTP 200, 0 app-console errors, 0 overflow.
