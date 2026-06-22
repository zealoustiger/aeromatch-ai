# Spec — error-boundaries (resolves the airport/aircraft-model 500 blocker)

## Background (the blocker this cycle clears)
The previous cycle filed a `[P1][bug]`: `/airports/[icao]` (and `/aircraft/cessna/172`)
returned **HTTP 500** on a local production build, with the *real* error masked by a
`ChunkLoadError: Cannot find module .../chunks/ssr/_global-error...js`.

**Investigation result this cycle (clean reproduce):** after `rm -rf .next && npx next build
&& npx next start`, **every** suspect page returns **200 with real content**:
- `/airports/{khwd,kpao,koak,ksql,kccr,klvk,kapc}` → all 200 (H1 + JSON-LD present)
- `/aircraft/{cessna/172,cirrus/sr22,piper/cherokee,beechcraft/bonanza,cessna/182}` → all 200
- `/partnerships/near/khwd` → 200
- **Production (clubhanger.com, a clean Vercel build): all three → 200.**

So the 500 was a **stale `.next` / turbopack-prod chunk-cache artifact** (the prior cycle's
working dir had a corrupted/partial `.next`, as the bug note suspected — "may be a local
turbopack-prod quirk"), **not** a route bug and **not** a prod outage. Vercel always builds
clean, so the sitemap'd families are healthy.

The genuine, on-goal fix to the part that *is* real — **the error was masked** — is that the app
has **no error boundaries at all** (`error.tsx`/`global-error.tsx` absent), so any uncaught
server error falls back to Next's built-in default `_global-error` chunk (the one that went
missing). This cycle gives the app its own branded boundaries so future errors surface a useful
page instead of a bare/masked default.

## Goal
Add branded React error boundaries so any uncaught render/server error shows a useful,
on-brand "something went wrong" page (with retry + home link) instead of Next's unstyled
default — and verify the previously-reported 500 family is healthy on a clean build.

## Scope (small, additive)
- `src/app/error.tsx` — segment error boundary (renders inside the root layout/Nav/Footer).
- `src/app/global-error.tsx` — root-layout error boundary (own `<html>`/`<body>`).
- No changes to any existing page, route, data fetch, or component.

## Acceptance criteria
1. `npx next build` + `tsc --noEmit` green (no new errors vs the `.test.ts` baseline).
2. The formerly-suspect pages return **200** on the clean production build and pass qa-smoke
   (HTTP 200, zero app-origin console errors, zero horizontal overflow) at 1280 + 375:
   `/airports/khwd`, `/aircraft/cessna/172`, `/partnerships/near/khwd`.
3. The new `error.tsx` renders a branded page with a working "Try again" (reset) button and a
   link back home — verified by temporarily triggering it and reading the screenshot.
4. `global-error.tsx` compiles into the build (app now owns the global-error chunk).
5. No FREEZE file touched; no schema/DB/SQL; no new dependency; staging only.

## Out of scope
- A custom `not-found.tsx` (404 page) — leave for a follow-up.
- Any change to the airport/aircraft route code (there is no bug to fix there).
- Error logging/telemetry wiring.
