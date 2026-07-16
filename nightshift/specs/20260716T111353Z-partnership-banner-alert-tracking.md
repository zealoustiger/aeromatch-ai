# partnership-banner-alert-tracking

## Goal
Fire the `alert_subscribed` PostHog event from `PartnershipLaunchBanner`'s successful subscribe, so its real conversions show up in the placement-conversion funnel like every other alert capture surface does.

## Scope
- `src/components/PartnershipLaunchBanner.tsx` — add `import { track } from '@/lib/analytics'` and call `track('alert_subscribed', { context, source_path: sourcePath, source: 'partnership_launch_banner', frequency: 'weekly' })` right after a successful `subscribeToAlerts` call (mirroring the payload shape `AlertSignup.tsx` already uses), before `setSubmitted(true)`.
- No UI change, no schema change, no change to `subscribeToAlerts`/server actions.

## Acceptance criteria
- `PartnershipLaunchBanner` imports and calls `track('alert_subscribed', ...)` only on a successful (non-error) subscribe result.
- The event payload includes `context`, `source_path`, `source: 'partnership_launch_banner'`, `frequency: 'weekly'` — matching the shape other capture surfaces emit so it joins the same funnel.
- No `track()` call fires on a failed/errored subscribe attempt.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke passes (HTTP 200, zero app-origin console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on at least one page that renders this banner (`/partnerships/browse`, and `/partnerships` if it also renders unmatched/beta state).
- Non-visual cycle (analytics-only, no visible UI change) — screenshots saved for the audit trail but not required reading for PASS.

## Out of scope
- Any UI change to the banner itself.
- Wiring `alert_capture_viewed` (impression) tracking.
- Touching any other capture surface (`AlertSignup`, `AlertMeChip`, `MobileStickyAlertBar`).
