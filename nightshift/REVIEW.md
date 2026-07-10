## 2026-07-10T11:01:55Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $13.3540 of $120 cap

- ABORT — none — plan needed

### VPS headroom
- ✅ no headroom issues — peak load 1.0/2 cores, min free mem 4.9 GB, container peaked at 6% of its memory cap (4 samples)


## 2026-07-10T10:02:21Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $12.3805 of $120 cap

- ABORT — none — plan needed`

### VPS headroom
- ✅ no headroom issues — peak load 1.3/2 cores, min free mem 4.6 GB, container peaked at 6% of its memory cap (5 samples)


## 2026-07-10T09:02:51Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $11.3686 of $120 cap

- ABORT — none — plan needed

### VPS headroom
- ✅ no headroom issues — peak load 2.5/2 cores, min free mem 4.3 GB, container peaked at 6% of its memory cap (6 samples)


## 2026-07-10T08:02:00Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $10.3308 of $120 cap

- ABORT — none — plan needed`

### VPS headroom
- ✅ no headroom issues — peak load 0.6/2 cores, min free mem 5.0 GB, container peaked at 6% of its memory cap (4 samples)


## 2026-07-10T07:02:17Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $9.4469 of $120 cap

- ABORT — none — plan needed`

### VPS headroom
- ✅ no headroom issues — peak load 1.0/2 cores, min free mem 4.9 GB, container peaked at 6% of its memory cap (5 samples)


## 2026-07-10T06:21:21Z — Night Shift run: 3 cycles (PASS 2 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 1 quality-judged on opus
- Night spend so far: $8.2738 of $120 cap

- PASS — seeker-model-filter-make-scoped — /partnerships/seeking's Model Wanted filter now narrows its option list to models actually wanted by seekers who also want the selected
- PASS — seeker-model-variant-rollup — the `/partnerships/seeking` Model Wanted filter now groups near-duplicate variants (e.g. 172 + 172 G1000) under one 172 (all) checkbox with
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 4.6 on 2 cores, sustained ~4 min — parallel drains are contending; consider more cores or lower --cpus per container


## 2026-07-09T12:28:02Z — Night Shift run: 3 cycles (PASS 3 / FAIL 0) — night budget cap ($120)
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $120.9669 of $120 cap

- PASS — seller-upgrade-cta-post-listing — Added Feature this listing + Get it vetted fake-door CTAs to the owner-only post-listing success banner on aircraft and partnership det
- PASS — earnings-calculator-upfront-runway — the aircraft-partnership earnings calculator now shows owners how many months of their full aircraft costs the upfront partner buy-i
- PASS — admin-pilot-verify — Added a Verify Pilots admin tab (`/admin/pilots`) letting admins grant/revoke a pilot's public Verified badge, closing the last open slice of the pi

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 2.9 on 2 cores, sustained ~2 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~87s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles


## 2026-07-09T11:27:05Z — Night Shift run: 3 cycles (PASS 2 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $110.6327 of $120 cap

- PASS — airport-facility-ratings — Added a 1-5 star rating widget for curated airport FBOs/flying clubs on `/airports/[icao]` (signed-in only, honesty-gated aggregate at ≥2 ra
- PASS — partnerships-crosssell-airport-aware — /partnerships' prefer to own outright? cross-sell box now respects the active airport filter (count + samples narrow to nearby air
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 2.4 on 2 cores, sustained ~2 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~67s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles


## 2026-07-09T11:05:07Z — Night Shift run: 12 cycles (PASS 9 / FAIL 2) — backlog drained
- Models: cycles on sonnet; 2 escalated to opus; 1 quality-judged on opus
- Night spend so far: $101.7701 of $120 cap

- PASS — member-profile-comp-verdict-parity — `/members/[id]` persona partnership cards now show the same real comp-verdict/deal-check/save-count chips every other listing card o
- PASS — cost-calculator-breakeven-hours — Added a break-even hours/month vs. renting figure to `/tools/cost-calculator`, the calculator-detail slice of the open `[P2][want]` too
- PASS — pilot-public-profile — shipped a public `/pilots/[id]` profile page for real signed-up pilots (avatar, home airport, verified badge, listings), linked from `/account` �
- PASS — profile-bio-edit — Signed-in pilots can now edit display name, mission, and bio on `/account`, which now render on their public `/pilots/[id]` profile page (slice 2 of P
- PASS — poster-attribution-links — Real user-posted aircraft/partnership listings now show a Posted by {name} link (avatar + home airport) to the poster's public /pilots/[id] pr
- cycle produced no verdict (exit 124)
- PASS — partnership-listing-reviews — /partnerships/[id] now has a Reviews section where signed-in non-owner pilots can leave a rating + written review, lighting up the previous
- PASS — aircraft-browse-broker-cta — Added the Work with a broker monetization fake-door CTA to the `/aircraft` browse results page (previously only on detail pages), closing a 
- PASS — seeker-crosssell-detail-pages — added a visitor-facing pilots looking cross-sell panel (real seeker demand) to both /aircraft/listing/[id] and /partnerships/[id], closin
- cycle produced no verdict (exit 124)
- PASS — quickstart-seeker-crosspost — /searches saved-search list now nudges partnerships searchers (with no seeker listing) to post themselves as looking for a share
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 3.7 on 2 cores, sustained ~3 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~479s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles
- 2 of 12 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-09T08:51:05Z — Night Shift run: 12 cycles (PASS 9 / FAIL 2) — backlog drained
- Models: cycles on sonnet; 2 escalated to opus; 4 quality-judged on opus
- Night spend so far: $56.0011 of $120 cap

- PASS — airport-fbo-flying-clubs — Added a verified FBOs & flying clubs section to the 9 indexable airport hub pages (`/airports/kpao`, `/airports/khwd`, etc.), closing slice 1 
- cycle produced no verdict (exit 124)
- PASS — rail-card-rare-find-parity — compact homepage/similar rail cards now show the honesty-gated indigo Rare find chip (≤3 in family), closing the Real-social-proof backlog
- PASS — crosssell-detail-samples — Both marketplace detail-page cross-sell panels (`/aircraft/listing/[id]` and `/partnerships/[id]`) now show up to 3 real sample listing cards 
- PASS — alert-unsubscribe-recover — the alert email Unsubscribe link now lands on a page that offers a one-click Pause instead recovery (no sign-in needed), so a subscriber who 
- PASS — match-nudge-filtered-href — fixed the owner-only N matches nudge on partnership/seeker detail pages so the Browse them link carries airport/radius/hours/ratings/share-ty
- PASS
- cycle produced no verdict (exit 124)
- PASS — matches-view — new owner-gated /matches page aggregating each owner's real cross-listing matches, with count functions refactored behavior-identically and a View all you
- PASS — match-alert-digest — new `/api/cron/match-alert-digest` weekly cron emails partnership/seeker owners when a genuinely new compatible listing appears on the other side of
- PASS — alert-confirm-polish — Restyled the alert double-opt-in confirmation email and the `/alerts/status` landing page onto the site's warm cream Etsy×Airbnb tokens (was plai
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 4.0 on 2 cores, sustained ~5 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~494s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles
- 2 of 12 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


# Overnight review — 2026-07-08

## 📊 Traffic (PostHog) — as of 2026-07-08

- **Visitors:** 40 all-time · 9 in the last 7 days
- **Pageviews:** 777 all-time · 84 in the last 7 days
- **Not from Oakland:** 38 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

---

## 🧭 Visitors — day-over-day & week-over-week

_Real visitors (bots excluded), first-party, Pacific-day windows — matches the live `/admin` card._

- **Totals:** 0 yesterday _(vs 1 the day before)_ · 9 last 7 days _(vs 23 the prior 7)_

**Visitors by city**  ·  _Δ d/d = yesterday vs. the day before · Δ w/w = last 7 days vs. the prior 7_

| City | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| CA | 0 | — | 3 | ▲ +3 |
| Ashburn, VA | 0 | ▼ −1 | 1 | — |
| Boulder, CO | 0 | — | 1 | ▲ +1 |
| Canary Wharf, ENG | 0 | — | 1 | ▲ +1 |
| Gwangju, 41 | 0 | — | 1 | ▲ +1 |
| Naples, FL | 0 | — | 1 | ▲ +1 |
| The Bronx, NY | 0 | — | 1 | ▲ +1 |
| Arlington, VA | 0 | — | 0 | ▼ −1 |
| Bethel, ME | 0 | — | 0 | ▼ −1 |
| Cedar Park, TX | 0 | — | 0 | ▼ −1 |

**Top landing pages**

| Page | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| / | 0 | — | 3 | ▼ −4 |
| /aircraft/listing/b7f5200a-6b6f-4077-b4cc-3d3471bf5b27 | 0 | — | 2 | ▲ +2 |
| /aircraft/mooney/m20/florida | 0 | — | 1 | ▲ +1 |
| /partnerships/dcd64d61-0bce-4992-86c8-dc3bebfea2ed | 0 | — | 1 | ▲ +1 |
| /partnerships/make/cirrus | 0 | — | 1 | ▲ +1 |
| /partnerships/state/tx | 0 | ▼ −1 | 1 | — |
| /aircraft | 0 | — | 0 | ▼ −1 |
| /aircraft/for-sale/arkansas | 0 | — | 0 | ▼ −4 |
| /aircraft/listing/119eac1e-1ea0-4a77-8ef7-cf8417bc7f6a | 0 | — | 0 | ▼ −1 |
| /aircraft/listing/1350cd7e-6fa5-4c4d-bbb8-d5d6c1f77389 | 0 | — | 0 | ▼ −6 |

---

**22 cycles landed on staging across 16 pages.** Review the live staging site (you must be logged into Vercel), then tell Claude which pages to promote — or "promote everything."

Staging site: https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app

---

## /aircraft — Planes for Sale (marketplace)  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft)

- **`/aircraft` cards and map pins are now synced both ways, closing out the map search feature.** Click a pin's popup "↓ Show in list" and the matching card below smooth-scrolls into view and briefly highlights. Click a card's new "📍 Show on map" link and the map opens (if collapsed), pans/zooms straight to that listing's pin — spiderfying it out of a cluster if needed — and pops open its info window. _(cycle: aircraft-list-map-sync)_
- **The `/aircraft` map now has the same "Search this area" filter `/partnerships` already shipped.** Pan or zoom the map and a floating "Search this area" button appears; clicking it narrows the results list below to only the aircraft whose pin falls inside the current viewport. The results-count line reads "Showing M of N in this map area · Show all" while filtered, with a one-tap reset that also fires automatically when the map is collapsed. _(cycle: aircraft-map-search-area)_
- **`/aircraft` now has the same "View on map" feature `/partnerships` already fully shipped.** A collapsed-by-default "View on map (N)" toggle above the listings opens a Leaflet map with one clustered pin per aircraft whose location resolves. Clicking a pin's popup shows the aircraft's own make/model/asking-price/location text and a "View listing →" link. _(cycle: aircraft-map-view)_
- **Aircraft-for-sale cards on `/aircraft` now carry two more honest, never-fabricated trust signals.** The existing amber "New" badge now says **"New today"** when a listing appeared in the last 24 hours (same data as before, just a tighter, more honest window — "New" still covers the rest of the first week). And a brand-new indigo **"Rare find — only N like this"** chip appears on listings whose make+model is genuinely scarce right now (1–3 total active priced listings of that type on ClubHanger) — e.g. a Grumman AA-1, which today really does have only 2 for sale. Common types like the Cessna 172 never show it. _(cycle: aircraft-rare-find-chip)_
- **Aircraft, partnership, and seeker cards can now show a genuine "Saved by N pilots" chip** — a small heart-accent badge that appears in the existing badge row **only when a listing has been saved by 2+ different pilots**, using the real save data we already store. It is never fabricated or inflated: a listing saved by 0 or 1 person shows nothing at all (no "Saved by 1 pilot"), and anything that goes wrong just renders no chip. Because it reads real cross-user engagement (which is still very thin on today's cold-start data), the chip won't appear on most cards yet — it lights up automatically as real saves accumulate, so it's honest the moment it shows and never before. Only aggregate counts are read; who saved a listing is never exposed. _(cycle: listing-save-social-proof)_

---

## /partnerships — Browse partnerships  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships)

- **`/partnerships` cards now have a "📍 Show on map" link that jumps you to that listing's pin.** Click it and the map opens (if it was collapsed), scrolls into view, and pans/zooms straight to the right pin — spiderfying it out of a cluster if needed — then pops open its info window. This completes the reverse direction of the map ↔ list sync (the map→list "↓ Show in list" direction shipped earlier tonight). _(cycle: partnerships-list-map-sync)_
- **Aircraft, partnership, and seeker cards can now show a genuine "Saved by N pilots" chip** — a small heart-accent badge that appears in the existing badge row **only when a listing has been saved by 2+ different pilots**, using the real save data we already store. It is never fabricated or inflated: a listing saved by 0 or 1 person shows nothing at all (no "Saved by 1 pilot"), and anything that goes wrong just renders no chip. Because it reads real cross-user engagement (which is still very thin on today's cold-start data), the chip won't appear on most cards yet — it lights up automatically as real saves accumulate, so it's honest the moment it shows and never before. Only aggregate counts are read; who saved a listing is never exposed. _(cycle: listing-save-social-proof)_
- **The `/partnerships` map now lets you "Search this area."** Open the map, pan or zoom to the region you care about, and a floating **"Search this area"** button appears; tap it and the list below instantly narrows to only the partnerships whose pins are in view — exactly the Zillow/Redfin map-search move. The results line stays honest about it ("Showing 6 of 23 in this map area") and offers a one-tap **"Show all"** to go back to the full list; collapsing the map with "Hide map" also clears the filter automatically. This was the last missing slice of the partnerships Map-search feature — pins, clustering, and both directions of list↔map sync already shipped this week. _(cycle: partnerships-map-search-area)_
- **Clicking a pin's popup on the `/partnerships` map now jumps you straight to that listing's card in the list below** — the map and the list finally talk to each other. Previously the map (opt-in "View on map" toggle) was a dead end for browsing: you'd spot an interesting pin but had to scroll and hunt for the matching card yourself. Now the pin's popup has a "↓ Show in list" button (next to the existing "View listing →" link) that smooth-scrolls the page to the matching card and briefly rings it in blue for ~2s so it's unmistakable which one you were looking at. Clicking a different pin re-triggers the scroll/highlight for the new card. _(cycle: partnerships-map-list-sync)_

---

## (site-wide)

- **Signed-in pilots can now set their base airport and up to 3 favorite airports from `/account`.** A new "Your pilot profile" card (between the avatar picker and Email alerts) has a base-airport field (reusing the same `AirportFormInput` autocomplete + "use my location" as the post forms) plus 3 optional favorite-airport fields. Saving persists to `profiles.home_airport` (a column that already existed but was never settable) and — once the migration is applied — `favorite_airports`. This seeds the explicit prerequisite for the backlog's "Airport pages as community hubs → pilots-by-home-airport" slice. _(cycle: profile-base-favorite-airports)_
- **New admin-only "Revenue Signals" tab shows which "coming soon" revenue-path CTA pilots actually want.** Real opt-in counts per path (broker / financing / insurance / escrow / pre-buy / partnership formation / co-ownership management), sorted highest-first with a % share — clearly labeled as email opt-ins, not raw button-clicks, so nobody over-reads the numbers. _(cycle: monetization-tally-admin)_
- Fixed the broken QA smoke gate that was FAILing **every** cycle. The gate _(cycle: qa-playwright-1223-pin)_

---

## /saved — My saved listings  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/saved)

- **A logged-out visitor's device-saved listings on `/saved` now show the same real "Saved by N pilots," price-vs-market, and "Rare find" chips that a signed-in user sees for the identical listing** — previously the logged-out view rendered bare cards with none of that signal, a quiet gap versus the logged-in page. _(cycle: device-saves-social-proof-parity)_
- **A pilot's own `/saved` page now shows the same honest trust chips as every browse page.** `/saved` already rendered aircraft/partnership/seeker cards with real market-comparison data (Deal Check, ClubHanger Estimate), but never passed the "Saved by N pilots" chip (any listing type) or the "Rare find — only N like this" chip (aircraft) — so a pilot who saved a genuinely scarce plane, or a listing other pilots had also saved, never saw those same signals reflected back on their own saved-listings page. _(cycle: saved-page-social-proof-parity)_

---

## /partnerships/[id]

- **The owner-only "N matches" count on partnership and pilot-seeking pages now respects how far a pilot actually said they'd travel.** Before this, a seeker willing to commute 30 minutes from their home airport could count as a "match" for a partnership on the other side of the country, as long as the make/budget/hours/ratings/share-type all lined up. Now the count only includes matches within the seeker's own stated commute radius — no visible UI change, just a more honest number behind the existing feature. _(cycle: match-count-travel-radius)_
- **Partnership listing pages now have two more honest "coming soon" CTAs** — "Help me form a partnership" and "Manage my co-ownership" — in a "More ways we can help" card right after the "Interested?" contact box. Same fake-door pattern as the broker/financing/insurance/escrow/pre-buy CTAs already shipped on aircraft-for-sale listing pages this week: click one, a "Coming soon — want early access?" modal opens (the click itself is the real demand signal), and leaving an email is optional. _(cycle: monetization-partnership-cta)_

---

## /partnerships/seeking/[id]

- **The owner-only "N matches" count on partnership and pilot-seeking pages now respects how far a pilot actually said they'd travel.** Before this, a seeker willing to commute 30 minutes from their home airport could count as a "match" for a partnership on the other side of the country, as long as the make/budget/hours/ratings/share-type all lined up. Now the count only includes matches within the seeker's own stated commute radius — no visible UI change, just a more honest number behind the existing feature. _(cycle: match-count-travel-radius)_
- **Pilot-seeking profile pages now show a "Similar pilots also seeking" rail** — up to 12 other real, active pilots looking for a partnership share, ranked by shared aircraft preference, then state, then home airport, excluding the seeker whose page you're on. Each card (avatar, aircraft they want, home airport/city, stated budget) links straight to that pilot's own profile — the same "keep browsing" loop the aircraft-for-sale and partnership detail pages already offer, just built for the third listing type. If no other seeker is a sensible match, the section simply doesn't render — nothing fabricated, nothing empty-looking. _(cycle: seeker-similar-rail)_

---

## /aircraft/[make]/[model] — Make + Model "for sale" pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/cessna/182)

- **The "Work with a broker" button on aircraft-for-sale listing pages now has 4 siblings** — Financing, Insurance quote, Escrow/title, and Pre-buy inspection — in a compact "More ways we can help" card right below it. Same honest pattern as the broker CTA: click any one, a "Coming soon — want early access?" modal opens (this is the real demand signal), and leaving an email is optional. Nothing claims to exist yet; nothing charges anyone. _(cycle: monetization-services-cta)_
- **A new honest "Work with a broker" button on aircraft-for-sale listing pages** — _(cycle: monetization-intent-cta)_

---

## / — Homepage  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/)

- The homepage now has a "Not ready to browse yet?" alert-signup band — a one-field _(cycle: homepage-alert-band)_

---

## /guides — Guides hub  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/guides)

- **The Guides hub and all 8 guide articles now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, `/tools`, airport pages) — previously they used the older, colder rounded-corner/border style left over from before that visual language existed. _(cycle: guides-token-sweep)_

---

## /guides/[guide] — Guide pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/guides/aircraft-co-ownership)

- **The Guides hub and all 8 guide articles now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, `/tools`, airport pages) — previously they used the older, colder rounded-corner/border style left over from before that visual language existed. _(cycle: guides-token-sweep)_

---

## /tools — Calculators  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/tools)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /tools/cost-calculator  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/tools/cost-calculator)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /tools/earnings-calculator  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/tools/earnings-calculator)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /partnerships/new  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/new)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /airports/[icao] — Airport pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/airports/khwd)

- **Airport pages now show a "Pilots based at {ICAO}" section** — real, signed-up pilots who set that airport as their base on `/account` (a feature shipped earlier tonight) now show up as a row of anonymous generated avatars, with a "Based here too? Set it in your pilot profile →" link back to `/account`. No name, bio, hours, or ratings are shown — just a real, honest presence signal. The section is invisible when nobody's set that airport yet (confirmed live: 0 real profiles have a base airport today, so it's dormant everywhere right now and will light up as pilots opt in). Also tightened `/account`'s copy, which previously only vaguely promised this "in the future" — it now says plainly that your base airport shows up as an anonymous avatar on that airport's public page. _(cycle: airport-pilots-based-here)_

---

## /partnerships/seeking — Pilots seeking shares  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/seeking)

- **Aircraft, partnership, and seeker cards can now show a genuine "Saved by N pilots" chip** — a small heart-accent badge that appears in the existing badge row **only when a listing has been saved by 2+ different pilots**, using the real save data we already store. It is never fabricated or inflated: a listing saved by 0 or 1 person shows nothing at all (no "Saved by 1 pilot"), and anything that goes wrong just renders no chip. Because it reads real cross-user engagement (which is still very thin on today's cold-start data), the chip won't appear on most cards yet — it lights up automatically as real saves accumulate, so it's honest the moment it shows and never before. Only aggregate counts are read; who saved a listing is never exposed. _(cycle: listing-save-social-proof)_

---

## 🧪 Code-quality spot-checks — 8 judged, avg 4.0/5

- **homepage-alert-band — 4/5** — The wrapper adds its own `<h2>` + subcopy ("…we'll email you the moment it's listed") directly above `AlertSignup`, which renders its own `<h2>` ("Get new-listing alerts") + near-identical subcopy — two stacked h2s and duplicated messaging, slightly wordy and awkward heading semantics; not material.
- **aircraft-list-map-sync — 4/5** — The ~30-line focus-polling effect (markersRef/clusterRef/`__parent` poll) is now copy-pasted verbatim across AircraftLeafletMap and PartnershipsLeafletMap — a genuine drift risk if the leaflet-cluster timing hack ever needs a fix, though consistent with the codebase's per-page-component convention.
- **aircraft-map-search-area — 4/5** — Filtered line "Showing M of N in this map area" uses N = full DB total (page size 60) while the map only ever holds the current page's ≤60 pins, so with >60 results it reads e.g. "Showing 8 of 340" when 340 pins can never exist on that map — a semantic mismatch partnerships (radius-scoped) never surfaced.
- **match-count-travel-radius — 4/5** — haversineNm is now triple-duplicated (airports.ts, nearbyPartnerships.ts, matching.ts) — justified & documented (keeps matching.ts free of @/-alias value imports so its tests run under node strip-types) but still drift-prone; also deviates from spec (which said export from airports.ts, not duplicate) and the coord lookup uses `.toUpperCase()` without the `.trim()` that resolveAirportCoords applies, so a whitespaced airport code silently falls through the honesty gate (harmless, never over-counts).
- **profile-base-favorite-airports — 4/5** — The read-side fallback keys off `!profile` rather than an error, so it (a) always fires a second redundant query for brand-new users who simply have no profiles row, and (b) would silently mask a genuine non-column select error by re-querying — minor robustness smell, no user impact.
- **saved-page-social-proof-parity — 4/5** — Spec called for save-counts "in parallel with the existing comp-verdict fetches" but the Promise.all sits after three sequential comp-verdict awaits — a 4th serial DB barrier, minor added latency (only the 3 save-count calls parallelize among themselves).
- **aircraft-rare-find-chip — 4/5** — "Rare find — only 1 like this" reads slightly oddly when the count includes the listing itself (there are zero *others* like it); copy nuance only, tooltip clarifies, not material.
- **monetization-services-cta — 4/5** — The 20-token Tailwind className string is duplicated verbatim across all four buttons rather than hoisted to a local const — minor, matches the codebase's inline-className idiom; also the passed `title` prop only feeds the modal's aria-label (the `<h2>` is hardcoded in the component), so the per-button titles are effectively cosmetic — harmless, mirrors the broker CTA's own usage.

---

## To ship
Tell Claude "promote /aircraft" (or any pages above), or "promote everything." Claude merges the chosen work staging→main, which deploys to clubhanger.com.
