# alert-email-utm-attribution

## Goal
Tag every site-page link inside the alert-confirm, alert-digest, price-drop, and
combined-digest emails with UTM params so visits driven by alert emails are
attributable in analytics, without touching the token-scoped confirm/unsubscribe/
frequency redirect links.

## Scope
- `src/lib/email.ts`: add a private `withUtm(url, campaign)` helper
  (`utm_source=alert_email&utm_medium=email&utm_campaign=<campaign>`, preserving any
  existing query params; falls back to the raw URL if it isn't a valid absolute URL).
  Apply it to the **site-page** links only, inside each builder, using the campaign
  name matching that builder:
  - `buildAlertConfirmEmail` → `campaign: 'confirm'` — tags `manageUrl` and every
    preview sample's `url` (the "here's what you'd be watching" cards).
  - `buildAlertDigestEmail` → `campaign: 'digest'` — tags `listingsUrl`, `manageUrl`,
    and every sample's `url`.
  - `buildPriceDropEmail` → `campaign: 'price_drop'` — tags `listingUrl` and
    `manageUrl`.
  - `buildCombinedAlertDigestEmail` → `campaign: 'combined'` — tags each section's
    `listingsUrl` and sample `url`s, and the shared `manageUrl`.
- Do **NOT** touch `confirmUrl`, `unsubscribeUrl`, or `frequencyUrl` in any builder —
  these are `/api/alerts/*` redirect endpoints and their tokens must stay byte-exact.
- Do **NOT** touch `buildManageLinkEmail`, `buildListingUnavailableEmail`,
  `buildNewMessageEmail`, `buildSeedInquiryEmail`, or `buildMatchAlertEmail` — none of
  these are named in the four campaign values, out of scope for this slice.
- No change to any call site (`src/app/actions.ts`, `alert-digest/route.ts`) — the
  builders already receive plain absolute URLs, tagging happens inside `email.ts`.
- No schema change, no new capture point, no cron change.

## Acceptance criteria
- `manageUrl`/`listingsUrl`/`listingUrl`/sample `url`s rendered in the four builders'
  HTML `href` and plain-text bodies carry `utm_source=alert_email&utm_medium=email&
  utm_campaign=<the right campaign>`.
- `confirmUrl`, `unsubscribeUrl`, `frequencyUrl` are rendered completely unchanged
  (byte-exact) in every builder — verified by unit test.
- A URL that already has query params (e.g. `listingsUrl` built from `source_path`
  with `?make=...&model=...`) keeps its existing params alongside the new UTM ones.
- `npx tsc --noEmit` and `npx next build` both clean.
- Existing `src/lib/email.test.ts` suite still passes; new tests added for UTM
  tagging + token-link exclusion.

## Out of scope
- `buildManageLinkEmail`, `buildListingUnavailableEmail`, `buildNewMessageEmail`,
  `buildSeedInquiryEmail`, `buildMatchAlertEmail`.
- Any change to PostHog/analytics receiving-side code (it already auto-captures UTM
  params client-side).
- Any change to the `/api/alerts/*` routes.
