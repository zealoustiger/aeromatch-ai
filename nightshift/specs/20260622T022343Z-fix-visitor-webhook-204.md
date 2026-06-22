# Fix: `/api/visitor-webhook` returns invalid 204-with-body → 500 console error sitewide

## Blocker (uncapped — fixed first, ahead of the planned [want] cycle)
`src/app/api/visitor-webhook/route.ts` returns
`NextResponse.json({ ok: false }, { status: 204 })` when Slack env vars are unset.
HTTP **204 No Content responses must not carry a body**, so the `Response`
constructor throws `TypeError: Invalid response status code 204` → the route 500s.
The visitor-radar beacon in `src/lib/analytics.ts` fires this on **every page load**,
so every visitor's browser logs a **500 app-origin console error on every page** in
any environment without `SLACK_BOT_TOKEN` + `SLACK_VISITOR_CHANNEL_ID` (staging / QA).
This also breaks the mandatory QA-smoke "zero app-origin console errors" gate for
*every* Night Shift cycle going forward.

## Goal
Return a valid empty 204 (semantically: "Slack not configured → nothing to report")
so the beacon endpoint stops 500-ing and the sitewide console error disappears.

## Scope (one line)
- `src/app/api/visitor-webhook/route.ts` — the not-configured early return becomes
  `new NextResponse(null, { status: 204 })` (a body-less 204). No other behavior,
  auth, or the Slack-configured path changes.

## Acceptance criteria
- `POST /api/visitor-webhook` with Slack env unset returns **204** (not 500), no body.
- No app-origin console error on `/aircraft` (or any page) when loaded in a browser.
- The Slack-configured code path (env set) is byte-for-byte unchanged.
- `next build` + typecheck green; QA smoke exit 0 (HTTP 200, **zero** console errors,
  zero horizontal overflow) at desktop 1280 + mobile 375; screenshots look right.

## Out of scope
- No change to the Slack alerting logic, the beacon client, or any other route.
- No env/secret/auth/schema/DB change. The deferred `/aircraft` filter-chips work
  stays on its branch (`night/aircraft-filter-chips`) for a later cycle.
