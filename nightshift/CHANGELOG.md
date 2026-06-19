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

## 2026-06-19T09:02Z — PASS — aircraft-pagination
- What: `/aircraft` now paginates the full filtered result set instead of pinning to the first 60 rows. Replaced the fixed `.limit(60)` with `.range(from, to)` keyed off a new `?page=N` param, and added a Prev/Next control under the listings. The results header changed from "1,856 … — showing first 60" to a true window: "**Showing 61–120 of 1,856** aircraft for sale". Directly executes the prior cycle's flagged "Next" (count advertised 1,856 but only 60 rendered).
- Spec: nightshift/specs/2026-06-19T0902Z-aircraft-pagination.md
- Verdict: PASS. `npx next build` green (compile + typecheck). QA via /browse against the live DB (1,856 active listings → 31 pages):
  - Page 1: header "Showing 1–60 of 1,856", pager "← Previous (disabled) | Page 1 of 31 | Next →".
  - `?page=2`: header "Showing 61–120 of 1,856", listings differ from page 1 (page 2 starts "Cirrus Sf50 G2 Plus" vs page 1 "Hangar Airport Boulevard…"), Previous href = `/aircraft` (drops page param), Next href = `/aircraft?page=3`.
  - Filter preservation: `?max_tt=2000&page=2` → header "Showing 61–120 of 418", prev/next hrefs carry `max_tt=2000` (`/aircraft?max_tt=2000`, `/aircraft?max_tt=2000&page=3`).
  - Out-of-range `?page=9999`: graceful "No more aircraft on this page." + "← Back to the first page" link (→ `/aircraft`), NO red error box and no crash. (Caught a bug during QA: PostgREST returns a 416 "range not satisfiable" when the offset is past the end, which the old single `error` flag rendered as the generic "Failed to load… try again" box. Fixed: an error on page > 1 is treated as out-of-range, only page 1 — offset 0, always satisfiable — keeps the genuine error box.)
  - 375px mobile (`?page=2`): no horizontal overflow (scrollWidth = clientWidth = 375), pager wraps cleanly.
  - Console: only the pre-existing Wikimedia LCP image warnings (warnings, not errors) — no new errors.
- Screenshots: nightshift/screenshots/aircraft-pagination/ (01-desktop-page1, 02-desktop-page2, 03-desktop-filter-page2, 04-desktop-out-of-range, 05-mobile-375-page2, 06-desktop-pager-closeup)
- Staging: pushed to origin/staging (e2f85d2..4225226) — Vercel auto-deploys clubhanger-staging.vercel.app/aircraft
- Notes: One-file change (`AircraftSaleList.tsx`). Same uncommitted human scraper WIP still in the tree (scraper/ingest.mjs, scraper/lib/ingest-core.mjs, scraper/adapters/{hangar67,aircraftforsale}.mjs, src/components/AircraftSaleCard.tsx) — left untouched; committed only my one file by explicit path, same as the prior three cycles. Price-drops path (`?drops=1`) is unchanged: its count is JS-narrowed (totalCount = null) so it stays single-window with no pager, as specced.
- Next: Pagination is Prev/Next only — a small enhancement would be numbered page buttons (1 2 3 … 31) or a jump-to-page input for the 31-page default set. Otherwise the filter overhaul P1 is now functionally complete except the two blocked slices (avionics + SMOH filters; missing real photos) which both wait on the in-flight human scraper work. Good next pick when that lands, or "Save / favorite listings" slice 1 (heart-button UI + logged-out registration gate, no DB write yet).

## 2026-06-19T08:03Z — PASS — aircraft-true-match-count
- What: `/aircraft` results header now shows the **true total match count** instead of capping at "60+". `AircraftSaleList` fetched with `.limit(60)` and printed `listings.length`, so any result set ≥60 read "60 aircraft for sale+ found" — making Make/Model/Max-Total-Time filtering look broken above 60 matches (the default page has 1856 active listings). Added `{ count: 'exact' }` to the same Supabase select to get the real filtered total, displayed exactly (no "+") with a subtle "— showing first 60" clarifier when the total exceeds the 60-row display window. Directly executes the "Next" idea from the prior cycle.
- Spec: nightshift/specs/2026-06-19T0803Z-aircraft-true-match-count.md
- Verdict: PASS. `npx next build` green (compile + typecheck). QA via /browse against the live DB: default `/aircraft` → "**1,856** aircraft for sale found — showing first 60" (DB active count = 1856; previously read "60+"); `?max_tt=2000` → "**418** … — showing first 60" (DB = 418, proves total-time filtering works above the 60-row window — previously "60+"); `?max_tt=100` → "**56**" with NO "showing first" note (≤60, DB = 56); `?max_tt=50` → "**42**" (DB = 42). Price-drops path (`?drops=1`) keeps its JS-narrowed count → "1 aircraft for sale found", no regression (count: 'exact' can't express the column-to-column price comparison, so that path falls back to the displayed length). 375px mobile: header wraps cleanly, no overflow (scrollWidth = clientWidth = 343). No new console errors (only the pre-existing Wikimedia LCP image warning).
- Screenshots: nightshift/screenshots/aircraft-true-match-count/ (after-desktop-default, after-desktop-maxtt-2000, after-desktop-maxtt-100, after-mobile-375)
- Staging: pushed to origin/staging (d6e8080..a3765c0) — Vercel auto-deploys clubhanger-staging.vercel.app/aircraft
- Notes: One-file change (`AircraftSaleList.tsx`). Same uncommitted human scraper WIP still in the tree (scraper/ingest.mjs, scraper/lib/ingest-core.mjs, scraper/adapters/{hangar67,aircraftforsale}.mjs, src/components/AircraftSaleCard.tsx) — left untouched; committed only my file by explicit path, same as the prior two cycles.
- Next: The count now advertises 1856 but only 60 rows render — a real **pagination / "load more"** control is the natural follow-up. Filter slice 3 (avionics + SMOH) and the missing-photos P1 both remain blocked on the in-flight scraper work (avionics/SMOH columns 0% populated; AircraftSaleCard.tsx is human WIP). Alternative next pick: "Save / favorite listings" slice 1 (heart-button UI + logged-out registration gate, no DB write yet).

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
