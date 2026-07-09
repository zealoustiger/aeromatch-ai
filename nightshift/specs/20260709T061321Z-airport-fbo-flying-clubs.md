# Spec: airport-fbo-flying-clubs

**Goal:** Add a real, honest "FBOs & flying clubs" section to the airport hub page
(`/airports/[icao]`) for the handful of already-indexable airports, closing slice 1 of
the `[P1][want]` "Airport pages as community hubs" backlog item.

**Scope:**
- `src/lib/seo.ts` — new hand-curated `AIRPORT_FACILITIES` record (mirrors the existing
  `AIRPORT_OVERVIEWS` pattern: keyed by lowercase ICAO, curated ONLY for the 9 genuinely
  indexable airport hubs — kads, kaus, kfxe, khwd, klvk, koak, kpao, krhv, ksql) + a
  `getAirportFacilities(icao)` accessor. Data is real, verified via web search against
  AirNav.com listings, official airport tenant directories, and each business's own
  site — never fabricated. Businesses that appeared closed/stale during verification
  were excluded rather than guessed at.
- `src/app/airports/[icao]/page.tsx` — new section rendering the FBOs + flying clubs
  lists (name + phone where verified) for curated airports; renders nothing at all for
  the ~17k non-curated airports (same self-suppress pattern as the overview prose).

**Acceptance criteria:**
- The 9 curated airport pages (e.g. `/airports/kpao`) show a new "FBOs & flying clubs"
  section listing real, named businesses (with phone numbers where verified) sourced
  during this cycle's research.
- Any non-curated airport page (e.g. a random low-traffic ICAO) renders no such section
  — no fabricated placeholder, no empty box.
- No schema/DB change — pure static data + presentational addition.
- `npx next build` + typecheck pass clean.
- QA smoke passes on a curated airport page (`/airports/kpao`) and a non-curated one at
  desktop 1280 + mobile 375 (HTTP 200, zero console errors, zero horizontal overflow).
- Screenshots confirm the new section renders cleanly, no layout regression to existing
  sections.

**Out of scope:**
- Ratings/reviews for FBOs or clubs (separate, much bigger slice — needs a schema +
  moderation).
- "Pilots who fly out of here" — already shipped in a prior cycle
  (`airport-pilots-based-here`).
- Live/scripted ingestion from AirNav/FAA — the build sandbox has no outbound network
  access (confirmed by existing `/api/faa-lookup` CHANGELOG notes), so this is a
  hand-curated micro-dataset for the curated airport set only, not a scalable seed
  across all ~17k airports. Flagged as a real scope limit, not hidden.
