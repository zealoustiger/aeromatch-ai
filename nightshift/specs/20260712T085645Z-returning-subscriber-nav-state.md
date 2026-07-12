# Returning-subscriber nav state: "Get alerts" → "My alerts"

## Goal
Once a browser is known to belong to an alert subscriber, the nav's primary "Get alerts"
CTA becomes "My alerts" → `/alerts/manage`, so management is one click from every page for
returning subscribers while capture stays the default for everyone else.

## Scope (small)
- New `src/lib/alertSubscriberFlag.ts` — SSR-safe localStorage boolean flag + change event,
  mirroring the existing `src/lib/localSaves.ts` pattern. Stores ONLY a boolean; never the
  token, email, or any alert data.
- `src/components/AlertSignup.tsx` — call `markAlertSubscriber()` after a successful subscribe
  (both the anonymous double-opt-in submit and the signed-in one-click submit paths).
- New tiny client marker component `src/components/AlertSubscriberMarker.tsx` — sets the flag
  on mount; rendered by `/alerts/manage` ONLY on the resolved-owner branch (session or a valid
  manage-link token), i.e. a genuine authenticated visit to the manage page.
- `src/components/Nav.tsx` — read the flag on mount + subscribe to its change/storage events;
  when set, the desktop CTA, the mobile top CTA, and the mobile-menu row render "My alerts" →
  `/alerts/manage` instead of "Get alerts" → `/alerts`.

## Acceptance criteria
- Fresh browser (no flag): nav shows "Get alerts" → `/alerts` exactly as today (desktop,
  mobile top button, mobile menu).
- After a successful alert subscribe, the flag is set and the nav CTA switches to
  "My alerts" → `/alerts/manage" without a full reload (same-tab change event).
- Visiting `/alerts/manage` as a resolved owner (signed-in or valid `?token=`) sets the flag;
  the signed-out dead-end state does NOT set it.
- The flag stores only a boolean — inspecting localStorage shows no token/email/PII.
- `npx tsc --noEmit` and `npx next build` are clean.
- qa-smoke passes (HTTP 200, 0 app-console errors, 0 horizontal overflow) at desktop 1280 +
  mobile 375 on `/` and `/alerts/manage`.

## Out of scope
- No new capture point, no `alert_subscribed` event, no schema change.
- No server-side detection of subscriber state (purely a per-browser localStorage hint; the
  manage page still proves ownership via session/token as it does today).
- No change to alert-capture, confirmation, or management logic.
