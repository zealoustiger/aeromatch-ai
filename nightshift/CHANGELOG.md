# Night Shift Changelog

Newest first. One entry per cycle. The loop appends here; you read it over coffee.

<!-- Entries look like:

## 2026-06-15T08:00Z — PASS — price-drop-badges
- What: Added price-drop badges to Planes-for-Sale cards
- Spec: nightshift/specs/2026-06-15T0800-price-drop-badges.md
- Verdict: build green, smoke test passed, badge renders on 12/120 cards with a prior price
- Screenshots: nightshift/screenshots/price-drop-badges/
- Staging: https://aeromatch-git-staging-...vercel.app
- Next: consider a "price dropped" filter toggle

-->

## 2026-06-19T07:03Z — PASS — aircraft-total-time-filter
- What: Filter overhaul slice 2 on /aircraft. Added a **Max Total Time (hrs)** filter (`?max_tt=N` → `ttaf <= N`) and restructured the panel so it leads with Make → Model and tucks the secondary dimensions (State, Max Price, Year min, Max Total Time) behind a collapsible **"More filters"** disclosure that's collapsed by default and auto-expands when any of them is active. Cleaner-than-Controller progressive disclosure. One component (`AircraftSaleFilters`) drives both the desktop sidebar and the 375px mobile drawer.
- Spec: nightshift/specs/2026-06-19T0703Z-aircraft-total-time-filter.md
- Verdict: PASS. `npx next build` green (compile + typecheck). QA via /browse: panel order is Make, Model, Sort, Price-drops, Search, then "More filters" (collapsed by default — State/Max Total Time hidden). Expanding reveals State, Max Price, Year (min), Max Total Time (hrs) in order. Filtering is exact against the live DB: `?max_tt=100` → "56 aircraft for sale found" (DB count = 56), `?max_tt=50` → "42" (DB = 42); clearing restores 60+. `?max_tt=2000` auto-expands More filters with the input pre-filled to 2000. Mobile active-count badge counts max_tt (shows 1); "Clear all" drops max_tt back to /aircraft. 375px drawer renders cleanly. No new console errors (only the pre-existing Wikimedia LCP image warning).
- Screenshots: nightshift/screenshots/aircraft-total-time-filter/ (after-desktop-default, after-desktop-more-expanded, after-desktop-maxtt-2000, after-desktop-sidebar, after-mobile-375-drawer)
- Staging: pushed to origin/staging (fadb5a4..04c951c) — Vercel auto-deploys clubhanger-staging.vercel.app/aircraft
- Data note: deliberately did NOT build avionics or engine-time (SMOH) filters — both columns are **0% populated** across 1856 active listings (ttaf is ~51% populated). Those filters would silently return zero results. Likely an ingest gap; overlaps the in-flight human scraper WIP (scraper adapters + ingest-core). For the human: if SMOH/avionics get ingested, slice 3 can add those two filters into the existing "More filters" section trivially.
- Notes: Same uncommitted human WIP still in the tree (scraper/ingest.mjs, scraper/lib/ingest-core.mjs, scraper/adapters/{hangar67,aircraftforsale}.mjs, src/components/AircraftSaleCard.tsx). Left untouched; committed only my 2 files (AircraftSaleFilters.tsx, AircraftSaleList.tsx) by explicit path.
- Next: Slice 3 — once SMOH/avionics ingest lands, add Engine Time (SMOH max) + Avionics (multi-select from a facet) into "More filters". Also consider a result count that doesn't cap the display at "60+" (show true match count) so total-time filtering reads as obviously working above 60 matches.

## 2026-06-19T06:04Z — PASS — aircraft-make-model-filters
- What: Replaced the free-text Make input on /aircraft with a real Make dropdown (populated from live listings, most-listed first) + a dependent Model dropdown whose options follow the selected Make. Make + Model now lead the filter panel (desktop sidebar + mobile drawer). Slice 1 of BACKLOG [P1] "Filter UI overhaul."
- Spec: nightshift/specs/2026-06-19T0604Z-aircraft-make-model-filters.md
- Verdict: PASS. `npx next build` green (compile + typecheck). QA via /browse: Make select sorted by listing count (Cessna, Piper, Cirrus, Beechcraft...); Model disabled with "Select a make first" until a Make is chosen, then populates with that make's models (Cessna → 140/150/172...); selecting make+model narrows results (Cessna 172 → 14 from 60+); switching Make (Cessna→Piper) resets the stale Model and reloads Piper's models; Make+Model are the first two controls on desktop and in the 375px mobile drawer; no new console errors (only a pre-existing LCP image warning).
- Screenshots: nightshift/screenshots/aircraft-make-model-filters/ (after-desktop-default, after-desktop-cessna, after-desktop-sidebar, after-mobile-375-drawer)
- Staging: pushed to origin/staging — Vercel auto-deploys clubhanger-staging.vercel.app/aircraft
- Notes: Found uncommitted human WIP in the working tree (scraper adapters hangar67.mjs/aircraftforsale.mjs, ingest-core.mjs, AircraftSaleCard.tsx). Left it untouched — committed only my 6 files by explicit path. This is also why I skipped the other P1 (missing photos): it overlaps that in-flight scraper work.
- Next: Slice 2 of the filter overhaul — add the secondary Controller-style dimensions with progressive disclosure (avionics, total time / tach-Hobbs, engine time / SMOH), keeping the panel clean at 375px. Also worth a "make exact match" pass: Make currently uses ilike (substring) while Model uses eq; fine today, revisit if make names collide.
