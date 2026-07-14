# Remember email-only alert subscribers in the browser

## Goal
An email-only (no-account) visitor who already subscribed to alerts at a given
capture point sees an honest "you're already getting alerts for this" state on
return visits instead of a blank form, mirroring the signed-in `existingAlert`
experience `AlertSignup` already has.

## Scope
- `src/lib/alertLocalSubscriptions.ts` (new) — SSR-safe localStorage helper,
  same fail-soft pattern as `recentlyViewed.ts` / `alertSubscriberFlag.ts`.
  Stores only `source_path` strings (no email, no token, no PII beyond a route
  already visible in the URL).
- `src/components/AlertSignup.tsx` — on a successful signed-out subscribe,
  record `activeSourcePath` locally; on mount/`activeSourcePath` change, check
  the local record and render an "already getting alerts" state (with a link
  to `/alerts/manage`'s self-serve "email me my manage link" flow) instead of
  the blank capture form when it matches.

## Acceptance criteria
- A fresh visitor (no local record) sees the normal capture form, unchanged.
- After a successful signed-out subscribe at a given `sourcePath`, reloading
  the same page (same browser) shows the "you're already getting alerts for
  this" state instead of the blank form.
- The existing signed-in `existingAlert` state and copy are unaffected — this
  only changes the signed-out branch.
- No new console errors; no change to the DB write path (`subscribeToAlerts`
  is untouched) — this is a pure client-side UI-memory addition.
- `next build` + `tsc --noEmit` pass; `qa-smoke.mjs` passes at desktop 1280 +
  mobile 375 on representative alert-capture pages.

## Out of scope
- Vacation-mode bulk pause, sample digest preview, comparison-page capture,
  market-pulse digest line, bounce webhook (separate plan-pass batch items).
- Storing the subscriber's email locally (not needed — `/alerts/manage`'s
  existing `ManageLinkRequestForm` already covers the self-serve path back in).
