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

## 2026-06-19T06:04Z — PASS — aircraft-make-model-filters
- What: Replaced the free-text Make input on /aircraft with a real Make dropdown (populated from live listings, most-listed first) + a dependent Model dropdown whose options follow the selected Make. Make + Model now lead the filter panel (desktop sidebar + mobile drawer). Slice 1 of BACKLOG [P1] "Filter UI overhaul."
- Spec: nightshift/specs/2026-06-19T0604Z-aircraft-make-model-filters.md
- Verdict: PASS. `npx next build` green (compile + typecheck). QA via /browse: Make select sorted by listing count (Cessna, Piper, Cirrus, Beechcraft...); Model disabled with "Select a make first" until a Make is chosen, then populates with that make's models (Cessna → 140/150/172...); selecting make+model narrows results (Cessna 172 → 14 from 60+); switching Make (Cessna→Piper) resets the stale Model and reloads Piper's models; Make+Model are the first two controls on desktop and in the 375px mobile drawer; no new console errors (only a pre-existing LCP image warning).
- Screenshots: nightshift/screenshots/aircraft-make-model-filters/ (after-desktop-default, after-desktop-cessna, after-desktop-sidebar, after-mobile-375-drawer)
- Staging: pushed to origin/staging — Vercel auto-deploys clubhanger-staging.vercel.app/aircraft
- Notes: Found uncommitted human WIP in the working tree (scraper adapters hangar67.mjs/aircraftforsale.mjs, ingest-core.mjs, AircraftSaleCard.tsx). Left it untouched — committed only my 6 files by explicit path. This is also why I skipped the other P1 (missing photos): it overlaps that in-flight scraper work.
- Next: Slice 2 of the filter overhaul — add the secondary Controller-style dimensions with progressive disclosure (avionics, total time / tach-Hobbs, engine time / SMOH), keeping the panel clean at 375px. Also worth a "make exact match" pass: Make currently uses ilike (substring) while Model uses eq; fine today, revisit if make names collide.
