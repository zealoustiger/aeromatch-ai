# Spec — Deep-link the /aircraft mission chips to the mission landing pages

**Lane:** `[want]` (last non-bug cycle `aircraft-mission-landing-pages` pulled `[goal]`;
last cycle PASS so no blocker → `[want]` owed per the 1:1). This is the directly-queued
"Next" from that cycle: *"wire the existing AircraftChipBar mission chips to deep-link to
these pages (currently they apply in-place filters)."* Part of the `[P1][goal]/[want]`
"Search-by-mission presets + SEO landing pages" backlog item.

## Goal
Make the four mission chips in the `/aircraft` chip bar navigate to their dedicated,
editorial mission landing pages (`/aircraft/mission/[mission]`) instead of applying an
in-place `q=` keyword filter — sending buyers to the richer page and adding four internal
links from the high-traffic `/aircraft` seed hub to the new mission family (helps INDEXING).

## Scope (small)
- `src/components/AircraftChipBar.tsx` — change the mission chips from `q`-param toggles to
  direct `<Link href="/aircraft/mission/[slug]">` links. The 4 chips map 1:1 to the 4
  curated mission slugs: IFR → `ifr`, Glass cockpit → `glass-cockpit`, Tailwheel →
  `tailwheel`, Low time → `low-time`.

## Acceptance criteria
- On `/aircraft`, each of the 4 mission chips links to `/aircraft/mission/<slug>` (verifiable
  in the rendered HTML `href`), not to a `?q=` URL.
- Clicking a mission chip navigates to the matching mission landing page (HTTP 200, correct H1).
- Make chips and price-band chips are unchanged (still in-place `?make=` / `?max_price=` filters).
- `npx next build` + typecheck pass; QA smoke exit 0 (HTTP 200, no app-origin console errors,
  no horizontal overflow) on `/aircraft` + the 4 mission pages at desktop 1280 + mobile 375.
- No visual regression to the chip strip (same pill styling, same horizontal scroll).

## Out of scope
- Changing the mission page content, the mission registry, or `fetchAircraftPage` filters.
- Adding/removing missions or changing chip labels beyond what's needed to link.
- Touching the partnerships chip bar or any other page.
