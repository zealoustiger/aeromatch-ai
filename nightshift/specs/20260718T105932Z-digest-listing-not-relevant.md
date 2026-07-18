# Per-listing "Not relevant?" feedback link on digest samples

## Goal
Give a subscriber a one-click way to flag WHICH sample listing in a digest email read as
noise, instead of only being able to vote on the whole digest.

## Scope
- `src/lib/email.ts` — `AlertDigestSample` gains optional `id`/`type` fields;
  `sampleCardHtml` renders an optional quiet "Not relevant?" link per card (HTML + plain
  text); `buildAlertDigestEmail`/`buildCombinedAlertDigestEmail` gain an optional
  `digestFeedbackBaseUrl` opt used to build each sample's link.
- `src/app/api/cron/alert-digest/route.ts` — `toDigestSample`/`toPartnershipDigestSample`/
  `toSeekerDigestSample` set `id`/`type`; both send paths (single + combined) build and pass
  `digestFeedbackBaseUrl`.
- `src/app/api/alerts/digest-feedback/route.ts` — accepts new optional `listing`/`type`/
  `title` params; when `listing` is present, records a `digest_listing_vote` feedback row
  (message = title, page_path = the listing's real detail path) instead of the whole-digest
  vote, then redirects to a new friendly state.
- `src/app/alerts/status/page.tsx` — new `digest_listing_feedback` state.
- `src/app/api/dev/email-preview/alert-digest/route.ts` (+ `-combined`) — wire the new opt
  into the fixtures so the link is visible in preview/QA.

## Acceptance criteria
- A digest sample card (HTML) shows a small, quiet "Not relevant?" link only when the
  subscriber has an `unsubscribe_token` AND the sample has a listing `id` — never on the
  pre-confirmation preview email (no token yet).
- Clicking it hits `/api/alerts/digest-feedback?token=...&listing=...&type=...&title=...`,
  inserts exactly one `feedback` row (`type: 'digest_listing_vote'`) tied to the token's
  owning email, and redirects to a friendly "Thanks — noted!" status page — never a raw
  error page, even for a bad/expired token (falls back to `invalid`, same as the existing
  whole-digest vote).
- Plain-text digest gets the same link as a line under each sample.
- No DB schema change (reuses `feedback.type`/`message`/`email`/`page_path`, all existing
  columns).
- `npx tsc --noEmit` and `npx next build` both pass; existing digest/digest-feedback tests
  still pass, plus new unit coverage for the added `sampleCardHtml`/route behavior.

## Out of scope
- Surfacing a per-listing feedback rollup in the admin email (follow-up, per the backlog
  item's own note).
- The other 2 open `[P2]`s in the same plan-pass batch (view-in-browser page; share-with-
  partner footer line).
