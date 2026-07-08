## 2026-07-08T13:14:17Z — Night Shift run: 1 cycles (PASS 1 / FAIL 0) — night budget cap ($120)
- Models: cycles on sonnet; 0 escalated to opus; 1 quality-judged on opus
- Night spend so far: $121.4278 of $120 cap

- PASS — homepage-alert-band — added a Not ready to browse yet? email alert-signup band to the homepage (below the deals rail), reusing the existing AlertSignup component; verifi

### VPS headroom
- ✅ no headroom issues — peak load 1.6/2 cores, min free mem 4.2 GB, container peaked at 36% of its memory cap (18 samples)


## 2026-07-08T13:05:35Z — Night Shift run: 25 cycles (PASS 21 / FAIL 4) — safety cap (25)
- Models: cycles on sonnet; 4 escalated to opus; 8 quality-judged on opus
- Night spend so far: $118.9981 of $120 cap

- cycle produced no verdict (exit 0)
- PASS — qa-playwright-1223-pin — pinned Playwright to 1.60.0 so the QA smoke gate launches Chromium again, unblocking every cycle
- PASS — partnerships-map-list-sync — clicking a map pin's popup on /partnerships now scrolls to and briefly highlights the matching listing card in the list below
- cycle produced no verdict (exit 124)
- PASS — partnerships-map-search-area — added a Zillow/Redfin-style Search this area button to the `/partnerships` map that filters the list to listings in the current map viewpo
- cycle produced no verdict (exit 124)
- PASS — listing-save-social-proof — real, never-fabricated Saved by N pilots chip (≥2 distinct saves) now on aircraft/partnership/seeker cards
- PASS — seeker-similar-rail — Added a Similar pilots also seeking comparables rail to pilot-seeking detail pages (`/partnerships/seeking/[id]`), closing the last gap of the back
- PASS — monetization-intent-cta — shipped a Work with a broker fake-door CTA on aircraft listing pages, and fixed a real pre-existing bug (broken `waitlist` RLS policy that sile
- PASS — monetization-services-cta — added Financing/Insurance/Escrow-title/Pre-buy-inspection honest fake-door CTAs below the existing broker CTA on aircraft-for-sale listing de
- PASS — monetization-partnership-cta — added Help me form a partnership and Manage my co-ownership fake-door CTAs to the partnership listing detail page, verified end-to-end (re
- PASS — monetization-tally-admin — new `/admin/monetization` panel shows real opt-in counts per revenue-path CTA (broker/financing/insurance/escrow/prebuy/partnership formation/
- PASS — aircraft-rare-find-chip — Added honesty-gated New today (24h freshness) and Rare find — only N like this (scarce make/model, 1–3 active listings) chips to `/aircraft
- PASS — saved-page-social-proof-parity — Wired the existing Saved by N pilots and Rare find honesty-gated chips into `/saved`, which previously showed comp/deal data but never t
- cycle produced no verdict (exit 124)
- PASS — profile-base-favorite-airports — signed-in pilots can now set their base airport + up to 3 favorite airports on /account (seeds the airport-page pilots based here slice)
- PASS — match-count-travel-radius — the compatibility-matching N matches count on partnership/pilot-seeking pages now honors a seeker's stated travel radius (previously it ignor
- PASS — airport-pilots-based-here — added a Pilots based at {ICAO} community section to `/airports/[icao]` (anonymous avatars of real signed-up pilots who set that airport as ba
- PASS — aircraft-map-view — added a View on map clustered-pin map to `/aircraft`, unblocking the last piece of the `[P1][want]` Map Search item (partnerships side already fully 
- PASS — aircraft-map-search-area — ported /partnerships' Search this area map filter onto /aircraft (floating button, honest Showing M of N in this map area count, hidden-by-are
- PASS — partnerships-list-map-sync — recovered a stranded branch (finished Eng work never merged, falsely marked shipped in BACKLOG.md) implementing `/partnerships` cards' Show 
- PASS — aircraft-list-map-sync — `/aircraft` list and map are now synced both directions (pin popup → Show in list highlights the card; card → Show on map pans/zooms to the 
- PASS — device-saves-social-proof-parity — logged-out /saved now shows real save-count/comp-verdict/rare-find chips matching the signed-in view`
- PASS — tools-token-sweep — applied the shared warm rounded-2xl design tokens (`.ch-card`/`.ch-panel`) to the `/tools` hub and both calculators (incl. the compact variant embedd
- PASS — guides-token-sweep — the `/guides` hub and all 8 guide articles now match the site's warm rounded-2xl Etsy × Airbnb card look (`.ch-card`/`.ch-panel`), completing the 5

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 3.3 on 2 cores, sustained ~3 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container neared its memory cap: peak 2.9 GB of 3.2 GB (90%) — raise --memory in the env file before it OOM-kills a build
- ⚠️ container CPU-throttled ~952s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles
- 3 of 25 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-08T07:00:52Z — Night Shift run: 25 cycles (PASS 0 / FAIL 25) — safety cap (25)
- Models: cycles on sonnet; 12 escalated to opus; 0 quality-judged on opus
- Night spend so far: $12.4626 of $120 cap

- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)

### VPS headroom
- ✅ no headroom issues — peak load 1.8/2 cores, min free mem 5.1 GB, container peaked at 4% of its memory cap (2 samples)


## 2026-07-08T06:01:02Z — Night Shift run: 25 cycles (PASS 0 / FAIL 25) — safety cap (25)
- Models: cycles on sonnet; 12 escalated to opus; 0 quality-judged on opus
- Night spend so far: $12.4626 of $120 cap

- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)
- cycle produced no verdict (exit 1)

### VPS headroom
- ✅ no headroom issues — peak load 2.5/2 cores, min free mem 4.9 GB, container peaked at 1% of its memory cap (2 samples)


## 2026-07-07T20:40:06Z — Night Shift run: 3 cycles (PASS 2 / FAIL 1) — time box · manual
- Models: cycles on sonnet; 1 escalated to opus; 1 quality-judged on opus
- Night spend so far: $12.4626 of $120 cap

- cycle produced no verdict (exit 0)
- PASS — partnerships-map-view — added a collapsible View on map Leaflet/OSM map of filtered results to /partnerships (pins at real FAA airport coords → popup with make/model, 
- PASS — partnerships-map-clustering — fixed 10 of 23 stacked/invisible partnership map pins (all sharing KPAO) by clustering overlapping markers on `/partnerships`.

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 3.4 on 2 cores, sustained ~3 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~112s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles


# Overnight review — 2026-07-07

## 📊 Traffic (PostHog) — as of 2026-07-07

- **Visitors:** 38 all-time · 8 in the last 7 days
- **Pageviews:** 756 all-time · 76 in the last 7 days
- **Not from Oakland:** 36 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

---

## 🧭 Visitors — day-over-day & week-over-week

_Real visitors (bots excluded), first-party, Pacific-day windows — matches the live `/admin` card._

- **Totals:** 1 yesterday _(vs 0 the day before)_ · 9 last 7 days _(vs 25 the prior 7)_

**Visitors by city**  ·  _Δ d/d = yesterday vs. the day before · Δ w/w = last 7 days vs. the prior 7_

| City | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| CA | 0 | — | 3 | ▲ +2 |
| Ashburn, VA | 1 | ▲ +1 | 1 | — |
| Boulder, CO | 0 | — | 1 | ▲ +1 |
| Canary Wharf, ENG | 0 | — | 1 | ▲ +1 |
| Gwangju, 41 | 0 | — | 1 | ▲ +1 |
| Naples, FL | 0 | — | 1 | ▲ +1 |
| The Bronx, NY | 0 | — | 1 | ▲ +1 |
| Arlington, VA | 0 | — | 0 | ▼ −1 |
| Auburn, WA | 0 | — | 0 | ▼ −1 |
| Bethel, ME | 0 | — | 0 | ▼ −1 |

**Top landing pages**

| Page | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| / | 0 | — | 3 | ▼ −6 |
| /aircraft/listing/b7f5200a-6b6f-4077-b4cc-3d3471bf5b27 | 0 | — | 2 | ▲ +2 |
| /partnerships/state/tx | 1 | ▲ +1 | 1 | — |
| /aircraft/mooney/m20/florida | 0 | — | 1 | ▲ +1 |
| /partnerships/dcd64d61-0bce-4992-86c8-dc3bebfea2ed | 0 | — | 1 | ▲ +1 |
| /partnerships/make/cirrus | 0 | — | 1 | ▲ +1 |
| /aircraft | 0 | — | 0 | ▼ −1 |
| /aircraft/for-sale/arkansas | 0 | — | 0 | ▼ −4 |
| /aircraft/listing/119eac1e-1ea0-4a77-8ef7-cf8417bc7f6a | 0 | — | 0 | ▼ −1 |
| /aircraft/listing/1350cd7e-6fa5-4c4d-bbb8-d5d6c1f77389 | 0 | — | 0 | ▼ −6 |

---

_No new cycles landed on staging since the last promote._
