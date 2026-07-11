# Alert CTA on airport pages

## Goal
Add the email-only alert capture to `/airports/[icao]` pages so a visitor browsing an
airport hub is never more than one click from "alert me about new listings here" — the
last un-covered listing-hub page type in the alert-experience `[goal]` queue (make/model,
state, and partnership-detail pages already have it).

## Scope
- `src/app/airports/[icao]/page.tsx`: import and render `<AlertSignup>` once, placed
  right after the intro/overview section and before the "FBOs & flying clubs" /
  "Based at {icao}" listings sections (mirrors the make/model and state pages' placement:
  after intro prose, before the listings).
- `context` = the airport's ICAO (e.g. `KPAO`), `noun="partnership"` (this hub is
  partnerships-only content — no aircraft-for-sale airport hub exists — so scoping to one
  honest noun matches the page's actual content, same precedent as
  `partnership-detail-alert-cta`).
- `sourcePath` = the exact same matchable search URL the page's own "search with filters"
  footer link already uses: `/partnerships?airport=${airport.icao}&radius=50`.
- No new component, no schema/action change — reuses `AlertSignup` +
  `subscribeToAlerts` exactly as every other alert surface does, so it emits
  `alert_subscribed` with the existing `context`/`source_path` payload shape.

## Acceptance criteria
- Every `/airports/[icao]` page (indexable and thin/noindex alike) renders the alert
  signup box once, in the position described above.
- Submitting a valid email calls `subscribeToAlerts` with `context=<ICAO>`,
  `sourcePath=/partnerships?airport=<ICAO>&radius=50`, and fires `alert_subscribed`.
- No layout regression: existing sections (overview, facilities, based-here listings,
  seekers, pilots, nearby, cross-links) are unchanged in content/order aside from the new
  block's insertion point.
- `npx next build` (typecheck + build) passes clean.
- QA smoke passes (HTTP 200, zero app-origin console errors, zero horizontal overflow) at
  desktop 1280 + mobile 375 on at least one indexable airport page (e.g. `/airports/kpao`)
  and one thin/noindex page (e.g. `/airports/00aa`, if it renders at all — else two
  indexable pages).

## Out of scope
- No aircraft-for-sale-specific alert variant on airport pages (no such hub exists today).
- No new `source` tag field (this codebase has no per-surface `source` field distinct from
  `context`/`source_path` — confirmed in the prior `partnership-detail-alert-cta` cycle).
- No changes to the alert-digest cron, email templates, or `/alerts/manage`.
