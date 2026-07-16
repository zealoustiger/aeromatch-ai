# Spec: "Invite your co-buyer" — share an alert from /alerts/manage

## Goal
Let a subscriber share any of their alerts with a link, so the co-buyer they're
searching with can set up their own alert on the same search with one click —
a new, organic `alert_subscribed` entry point tagged `source: 'shared_alert'`.

## Scope
- `src/lib/shareAlertLink.ts` (new) — pure `withShareParam(sourcePath)` helper
  that appends `share=alert` to a source_path's query string (mirrors the
  existing `withDealOnly` pattern in `AlertSignup.tsx`).
- `src/components/ShareAlertButton.tsx` (new, client) — small per-row button:
  copies `${origin}${withShareParam(sourcePath)}` to the clipboard, shows a
  transient "Copied!" state, fires `alert_shared` with `{ source_path }`.
- `src/app/alerts/manage/page.tsx` — render `<ShareAlertButton>` on each alert
  row (next to the existing Edit form).
- `src/components/AlertSignup.tsx` — on mount, check the browser URL's own
  query string (not the `sourcePath` prop) for `share=alert`. When present:
  render a small "Someone shared this alert with you — set up your own below"
  note above the form, and pass `source: 'shared_alert'` (overriding whatever
  `source` prop the page normally sends) to `subscribeToAlerts`/
  `subscribeSignedInAlert`/the one-tap path and the `alert_subscribed` track
  call. Never expose the sharer's email or token — the link only carries the
  alert's own public `source_path`, identical to any other page URL.
- `src/lib/shareAlertLink.test.ts` (new) — unit tests for `withShareParam`.

## Acceptance criteria
- `/alerts/manage` shows a "Share" action on every alert row; clicking it
  copies a real URL (origin + source_path + `?share=alert` or `&share=alert`)
  to the clipboard and shows a brief "Copied!" confirmation.
- Visiting any page that renders `<AlertSignup>` with `?share=alert` (or
  `&share=alert`) in the URL shows the "shared with you" note above the
  capture form; without that param, the page renders exactly as before (no
  regression).
- Submitting the form from a `share=alert` URL creates a real `alerts` row
  with `source = 'shared_alert'` (verified directly via the DB, not just the
  UI) and fires an `alert_subscribed` PostHog event with the same source.
- No sharer PII (email, token) appears anywhere in the shared URL.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke (`qa-smoke.mjs`) passes on `/alerts/manage` and one AlertSignup
  surface (`/aircraft`) at desktop 1280 + mobile 375, zero console errors,
  zero horizontal overflow.

## Out of scope
- Sharing a specific listing card/link (this shares the *alert's search*, not
  a listing) — that's the existing native browser/OS share on listing pages.
- Any change to the digest cron, unsubscribe/pause flows, or the `alerts`
  schema (no new column — `source` already exists and is free-text).
- A dedicated "shared alert" landing page or extra copy variants beyond the
  one note in `AlertSignup`.
