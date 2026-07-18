# digest-share-with-partner

## Goal
Add a quiet "Buying with a partner? Share this alert" footer line to the new-listing
alert digest emails (single + combined templates), linking to the alert's own
plain (non-tokenized) source_path so a subscriber can forward the exact search to a
co-buyer.

## Scope
- `src/lib/email.ts`: `buildAlertDigestEmail` gains an optional `shareUrl` opt,
  rendered as one quiet footer line (HTML + text) above the Manage/Unsubscribe row.
  `AlertDigestSection` (used by `buildCombinedAlertDigestEmail`) gains an optional
  per-section `shareUrl`, rendered as a small "Share this alert" link next to the
  existing per-section "Edit this alert" / "Stop just this alert" links.
- `src/app/api/cron/alert-digest/route.ts`: both the single-alert and combined-email
  send paths compute `shareUrl` from the alert's own `source_path` via the existing
  `withShareParam` helper (`src/lib/shareAlertLink.ts`) — a plain `SITE_URL` link,
  never a tokenized manage/unsubscribe link, so a forwarded email can't leak account
  control. Omitted when `source_path` is null.
- `src/lib/email.test.ts`: unit tests for both templates (renders when present,
  omitted when absent, per-section scoping in the combined template).

## Acceptance criteria
- `buildAlertDigestEmail({ ...opts, shareUrl })` renders "Buying with a partner?
  Share this alert" linking to `shareUrl` in both HTML and text; omitted entirely
  when `shareUrl` is not passed.
- `buildCombinedAlertDigestEmail`'s per-section `shareUrl` renders a "Share this
  alert" link scoped to that section only (distinct from any other section's link),
  omitted when a section has no `shareUrl`.
- The alert-digest cron route passes a real `withShareParam(source_path)`-derived
  link (no `unsubscribe_token`) on both send paths.
- No schema change, no new capture point — the receiving page's existing
  `AlertSignup`/`alert_subscribed` (share-aware, already reads `?share=alert`)
  measures any resulting conversion.
- `npx tsc --noEmit` and `next build` pass; full `node --test` suite passes.

## Out of scope
- The single-listing price-drop email template (`buildPriceDropEmail`) — this item
  is scoped to the aggregate new-listing digest builders per BACKLOG.md.
- Any new analytics event — the receiving page already emits `alert_subscribed`
  with its own source when the shared link converts.
