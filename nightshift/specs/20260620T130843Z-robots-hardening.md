# Robots.txt crawl-hygiene hardening

## Goal
Focus crawl budget on the new programmatic content page families by disallowing internal/private/duplicate routes in `src/app/robots.ts`.

## Scope
- `src/app/robots.ts` (only file touched)

## Acceptance criteria
- Served `/robots.txt` (production build) contains `Disallow:` lines for the confirmed internal/private/duplicate routes: `/admin`, `/api`, `/auth`, `/saved`, `/searches`, `/compare`, `/partnerships/new`, `/partnerships/seeking/new`.
- Served `/robots.txt` still contains `Allow: /`.
- Served `/robots.txt` still contains the `Sitemap:` line (unchanged).
- No content routes are disallowed (`/`, `/aircraft*`, `/partnerships` content pages, `/airports*`, `/guides*`, `/tools*`, `/about`).
- A real content route (`/aircraft`) returns 200 and is not blocked.
- `npx next build` passes; `npx tsc --noEmit` shows only the 3 pre-existing baseline `.test.ts` import-extension errors (no new errors).

## Out of scope
- No `noindex` page metadata changes.
- No sitemap changes.
- No page component changes.
- No schema/SQL/auth/env/FREEZE changes.

## Confirmed routes (exist under src/app)
admin, api, auth, compare, saved, searches, partnerships/new, partnerships/seeking/new.
Content routes preserved: aircraft, partnerships (+ state/make/near/[id]/seeking content), airports, guides, tools, about.
