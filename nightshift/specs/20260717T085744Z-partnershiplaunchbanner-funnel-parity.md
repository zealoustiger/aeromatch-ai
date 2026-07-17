# PartnershipLaunchBanner funnel parity

## Goal
`PartnershipLaunchBanner.tsx` (renders on `/partnerships`, `/partnerships/browse`,
`/partnerships/seeking`, `/partnerships/seeking/[id]`, `/partnerships/[id]`) should fire a
one-shot `alert_capture_viewed` impression event and swap to a quiet "you're set" state for a
browser that already subscribed, matching the exact pattern `footer-alert-capture-known-
subscriber` shipped for `FooterAlertCapture.tsx`.

## Scope
- `src/components/PartnershipLaunchBanner.tsx` only.
- Add an `IntersectionObserver`-based one-shot `alert_capture_viewed` impression (threshold
  0.5) on the component's root, payload `{ context, source_path: sourcePath, source:
  'partnership_launch_banner' }` — same shape the `alert_subscribed` call already uses.
- On mount, check `isLocallySubscribed(sourcePath)` (from `src/lib/alertLocalSubscriptions.ts`)
  — if true, render a quiet "You're on the list — manage your alerts" line (link to
  `/alerts/manage`) instead of the form, mirroring `FooterAlertCapture`'s known-subscriber
  branch.
- On a successful subscribe, call `addLocalSubscription(sourcePath)` and `setLocalEmail(email)`
  so this browser is recognized on the next page view (same as `FooterAlertCapture`).
- No change to `subscribeToAlerts` call shape, no new server action, no schema change.

## Acceptance criteria
- A fresh/anonymous visitor sees the banner exactly as before (byte-identical default render).
- After the impression sentinel intersects the viewport, `alert_capture_viewed` fires exactly
  once per page load with `{ context, source_path, source: 'partnership_launch_banner' }`.
- After a successful subscribe, `isLocallySubscribed(sourcePath)` becomes true (localStorage
  written) and a **fresh reload** of the same page renders the quiet "you're set" state instead
  of the form — no re-ask.
- The "you're set" state still links to `/alerts/manage`.
- The existing "want to get matched faster? Post a seeking profile" post-submit CTA is
  preserved for the same-session submit path (untouched).
- No new console errors; zero horizontal overflow at 1280/375.

## Out of scope
- Any change to the 5 pages that mount this component.
- Any change to `subscribeToAlerts`, alert schema, or other alert components.
