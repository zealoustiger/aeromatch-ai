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
