# footer-alert-capture

## Goal
Add a slim, site-wide email-capture band to `Footer.tsx` — the one component that
renders on literally every page — so no page on the site is missing an alert
entry point (GOAL.md: "never more than one click from alert me").

## Scope
- New `src/components/FooterAlertCapture.tsx` — a compact client component:
  one email field + button (no signed-in detection, no match count, no
  price-drop/deal-only checkboxes, no frequency picker — those live in the
  full `AlertSignup`). Reuses the existing `subscribeToAlerts` server action,
  `track()` analytics, `markAlertSubscriber`, and the remembered-email
  one-tap pattern (`getLocalEmail`/`addLocalSubscription`/`setLocalEmail`)
  already shipped for `AlertMeChip`/`MobileStickyAlertBar`, so a returning
  subscriber gets a true one-tap here too.
- `sourcePath="/"`, `source="footer"`, generic (no) context — matches the
  `/alerts` landing page's "Get new-listing alerts" copy.
- Edit `src/components/Footer.tsx` to render the new band once, near the
  bottom of the footer (above the copyright row), full-width.
- Emits `alert_subscribed` (and `alert_capture_viewed` is out of scope — see
  below) on success, per GOAL.md's "every alert surface emits an analytics
  event" rule.

## Acceptance criteria
- The footer renders the capture band on every page that renders `Footer`
  (verified via a representative sample: homepage, `/aircraft`,
  `/partnerships`, a guide page).
- Submitting a valid email calls `subscribeToAlerts` with `source: 'footer'`,
  `sourcePath: '/'`, shows a "check your inbox" confirmation, and fires
  `track('alert_subscribed', { source: 'footer', ... })`.
- A browser with a remembered email (`getLocalEmail()`) sees a one-tap
  "Alert me — {email}" button instead of a blank field.
- Component stays a thin client island — no Supabase auth call, no
  IntersectionObserver, no extra network round-trip beyond the existing
  local-storage read — to keep the sitewide footer light (no CWV/375px
  regression).
- `npx next build` + typecheck pass; QA smoke passes at desktop 1280 +
  mobile 375 on the sampled pages (HTTP 200, zero console errors, zero
  horizontal overflow).

## Out of scope
- `alert_capture_viewed` impression tracking (would need an
  IntersectionObserver on a component that renders on every page — adds
  weight for a metric the other capture surfaces already cover at higher-
  intent placements).
- Signed-in one-click subscribe (would require a Supabase auth check on
  every page load just for the footer — not worth the weight for this
  placement; signed-in visitors still get the ordinary email-capture path
  or can use any of the site's other, richer capture points).
- Price-drop / deal-only / frequency options (footer alert is a simple
  weekly, all-matches default — matches `/alerts` landing page defaults).
