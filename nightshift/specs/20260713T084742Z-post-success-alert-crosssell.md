# Seller market-watch alert in the "just posted" success banner

## Goal
Give sellers a one-click "know your market" alert signup right in the "your listing is live"
success banner on the aircraft-for-sale and partnership listing detail pages — the poster is
signed in by definition, so it's a one-click confirmed subscribe, not a second email round-trip.

## Scope
- `src/app/aircraft/listing/[id]/page.tsx` — inside the existing `justPosted` banner, add
  `<AlertSignup>` reusing the page's already-computed `alertContext`/`alertSourcePath`/
  `alertCount`/`matchCount` (the exact same family make/model scope as the page's own
  below-the-fold alert box), `source="post_success"`.
- `src/app/partnerships/[id]/page.tsx` — same, inside its `justPosted` banner, reusing the
  same `p.make`/`p.model` → context/sourcePath expression the page's own family `AlertSignup`
  box already uses, `source="post_success"`.
- No new component, no schema/DB change, no new query. Pure reuse of `AlertSignup` (already
  handles the signed-in one-click confirmed path automatically via its own auth check).

## Acceptance criteria
- On `/aircraft/listing/[id]?posted=1`, the "Your listing is live!" banner now also renders an
  `AlertSignup` box scoped to the listing's make/model family, placed between the intro copy
  and the existing monetization-intent CTAs.
- On `/partnerships/[id]?posted=1`, the "Your partnership is live!" banner renders the
  equivalent, family-scoped `AlertSignup` box in the same relative position.
- Both reuse the exact same `context`/`sourcePath` shape as each page's pre-existing family
  alert box (so the cron's `parseSourcePath` needs no new handling).
- `alert_subscribed` fires with `source: 'post_success'` on submit (verifiable via the shared
  `AlertSignup` component's existing `track()` call — no new tracking code needed).
- `npx next build` + typecheck clean; QA smoke passes on both routes at desktop 1280 + mobile
  375 (HTTP 200, zero app-console errors, zero horizontal overflow).
- No other banner content, copy, or layout changes.

## Out of scope
- `/partnerships/seeking/[id]`'s `justPosted` banner (not named in the backlog item; separate
  posting flow, no make/model family search shape defined there).
- Any new analytics event beyond the existing `alert_subscribed`/`alert_capture_viewed` the
  shared component already emits.
- Copy customization beyond `AlertSignup`'s existing default headline (matches the precedent
  set by the already-shipped `post_contact` cross-sell, which also uses default copy).
