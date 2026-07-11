# alert-digest-email-redesign

## Goal
Rebuild the weekly alert-digest notification email (`buildAlertDigestEmail`) from a plain
slate-colored count-only email into a best-in-aviation-quality alert email: on-brand warm
cream styling, up to 3 real matching-listing preview cards (photo, price, year/TTAF/location)
for aircraft alerts, an honest "why you got this" criteria echo, and a manage-alerts footer
link alongside unsubscribe.

## Scope
- `src/lib/email.ts` — rewrite `buildAlertDigestEmail` to accept an optional `samples` array
  and a `manageUrl`; render sample cards (photo/title/specs/price, struck-through previous
  price when it's a price-drop sample) using the same warm cream/card visual language as
  `buildPriceDropEmail`/`buildAlertConfirmEmail`; render criteria-echo + manage/unsubscribe
  footer. New exported `AlertDigestSample` type.
- `src/app/api/cron/alert-digest/route.ts` — for aircraft-type alerts only, fetch up to 3 real
  sample listings (new listings first; price-drop rows when there are no new ones) using the
  same filter fields `countNewAircraft`/`countRecentAircraftPriceDrops` already build, map to
  `AlertDigestSample` via existing `pickRealPhoto`/`getPlaceholderPhoto` helpers. Partnership/
  seeker alerts keep the no-samples (CTA-only) path — different data shape, out of scope this
  cycle (noted as a follow-up).
- New dev-only `src/app/api/dev/email-preview/alert-digest/route.ts` — static-fixture preview
  (mirrors the existing `email-preview/price-drop` route), no DB read, no send.
- `src/lib/email.test.ts` — add unit tests for the new `buildAlertDigestEmail` shape.

## Acceptance criteria
- `buildAlertDigestEmail` renders on the site's warm cream (`#faf7f2`/`#ece6dc`) brand tokens,
  not the old plain `#f8fafc` slate look.
- With `samples` provided, up to 3 real listing preview cards render (photo, title,
  year/TTAF/location specs line, price — struck-through previous price when supplied),
  each linking to the real listing URL; with no samples, the email still renders cleanly
  (CTA-only, no broken layout).
- A placeholder (non-real) sample photo carries a small "Not actual plane photo" caption,
  matching the site-wide honesty convention — never silently implies a fabricated photo.
- Counts (`newCount`/`dropCount`) are named distinctly exactly as today — no regression to
  the existing honesty-gated new-vs-drop copy.
- Footer includes both "Manage alerts" (→ `/alerts/manage`) and "Unsubscribe" links.
- `npx next build` + typecheck pass; new unit tests pass; QA smoke passes on the new preview
  route + `/alerts` + `/alerts/manage` at desktop 1280 + mobile 375.

## Out of scope
- Partnership/seeker sample listing cards (different data shape — CTA-only stays as-is).
- Wiring an "instant" per-listing send (separate, already-flagged follow-up).
- Any change to the digest cadence/opt-in logic (frequency/price-drop-opt-in columns).
