# branded-404-alert-catch

## Goal
Replace Next's default 404 with a warm, on-brand `not-found.tsx` that gives visitors a
recovery path (links to `/aircraft` + `/partnerships`) plus a general alert signup, turning
a dead end into an alert entry point.

## Scope
- New `src/app/not-found.tsx` (Server Component, root-level — renders inside `RootLayout`
  so Nav/Footer stay, same as `error.tsx`).
- Reuses existing `AlertSignup` component as-is (`sourcePath="/"`, no `context` → renders
  the general "Get new-listing alerts" copy, same as the homepage's alert band).
- No new component, action, schema, or dependency.

## Acceptance criteria
- Visiting an unmatched route (e.g. `/this-page-does-not-exist`) renders the new branded
  page instead of Next's default 404, with Nav + Footer present.
- Page includes: friendly "page not found" headline/copy, a link to `/aircraft`, a link to
  `/partnerships`, and an `AlertSignup` block (general copy, `sourcePath="/"`).
- HTTP status is a real 404 (non-streamed) — confirm via `curl -I`.
- No horizontal overflow at 375px; no new console errors.
- `alert_subscribed` still fires on submit (unchanged `AlertSignup`/`subscribeToAlerts` path).
- `npx next build` + typecheck pass clean.

## Out of scope
- The experimental `global-not-found.js` convention (not needed — root `not-found.tsx`
  already handles all unmatched URLs per Next's docs, since there's a single root layout).
- Per-segment custom 404s (e.g. a listing-specific "this listing doesn't exist" — the sold/
  removed listing page already has its own dedicated handling, untouched).
- Any change to `error.tsx`/`global-error.tsx`.
