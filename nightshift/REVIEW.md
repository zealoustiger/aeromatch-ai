# Overnight review — 2026-06-21

## 📊 Traffic (PostHog) — as of 2026-06-21

- **Visitors:** 7 all-time · 7 in the last 7 days
- **Pageviews:** 103 all-time · 104 in the last 7 days
- **Not from Oakland:** 6 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

**By city**

| City | Visitors | Pageviews |
|---|--:|--:|
| Oakland | 2 | 97 |
| Monte Vista | 2 | 2 |
| El Cerrito | 1 | 2 |
| Wuhan | 1 | 1 |
| (unknown) | 1 | 1 |
| Council Bluffs | 1 | 1 |

**Top pages**

| Page | Pageviews |
|---|--:|
| / | 27 |
| /aircraft | 22 |
| /admin | 17 |
| /partnerships | 15 |
| /partnerships/seeking | 5 |
| /admin/review | 4 |
| /admin/listings | 3 |
| /admin/backlog | 3 |
| /auth | 2 |
| /saved | 2 |

---

**4 build cycles landed on staging across 4 pages last night** (one of them brand new). Review the live staging site (you must be logged into Vercel), then tell Claude which pages to promote to production — or "promote everything."

Staging site: https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app

---

## /aircraft — Planes for Sale  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft)

The most-worked page last night — three separate improvements.

- **New Airbnb-style quick-filter chip bar** at the top of the page. A row of tappable pills lets you instantly filter by make (Cessna / Piper / Cirrus / Beechcraft / Biplane), price band (Under $100k / $250k / $500k), or mission (IFR / Glass cockpit / Tailwheel / Low time). The picked chip lights up blue; tap it again to clear. On a phone the row scrolls sideways on its own without dragging the whole page sideways. Everything else — sidebar filters, save heart, compare, badges, pagination — works exactly as before. *(cycle: aircraft-chip-bar)*
- **Search-engine + social-share metadata** added: the page now carries a full set of OpenGraph + Twitter tags, so a shared link to /aircraft unfurls with a real title, description, and the branded card image. Nothing a visitor sees changed — metadata only. *(cycle: index-pages-canonical-og)*
- **New "Browse all makes, models & states →" link** added next to the "Aircraft for sale by state" heading, pointing to the new browse hub (see below). Nothing else on the page changed. *(cycle: aircraft-browse-hub)*

_Screenshots: nightshift/screenshots/aircraft-chip-bar/ · nightshift/screenshots/index-pages-canonical-og/ · nightshift/screenshots/aircraft-browse-hub/_

## /aircraft/browse — Browse all aircraft for sale (NEW PAGE)  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/browse)

- **Brand-new hub page** — a single human-readable index that links to every for-sale page on the site. Three labelled sections: **By make** (e.g. "Cessna for sale"), **By make & model** (each make's models grouped with a live for-sale count, e.g. "Cessna 172 — 60"), and **By state** (every US state with inventory, with its count). Every link goes to a real page that actually has listings — nothing points at an empty or missing page. It reads cleanly for a person and gives Google a crawlable path to all the programmatic for-sale pages. The hub is also now listed in the sitemap. *(cycle: aircraft-browse-hub)*

_Screenshots: nightshift/screenshots/aircraft-browse-hub/_

## / — Homepage  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/)

- **New "Browse curated collections" section** (Etsy-style) just below the existing "Newest partnerships" cards. Four horizontally-scrolling rails of real for-sale aircraft pulled live from the same database the marketplace uses: **Time-builders under $100k**, **Glass-panel singles**, **Cessna for sale**, and **New this week**. Each card shows a real asking price, the year/make/model, and location, and each rail's title is a link straight to the matching filtered search on /aircraft. On a phone each rail scrolls sideways on its own without making the whole page scroll sideways. Nothing else on the homepage changed. *(cycle: homepage-rails)*

_Screenshots: nightshift/screenshots/homepage-rails/_

## /partnerships  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships)

- **Search-engine fix:** this page previously had **no canonical web address at all** — it now tells Google its own canonical address (`https://clubhanger.com/partnerships`). It also gained a complete set of OpenGraph + Twitter tags so a shared link unfurls with a real title, description, and the branded card image. Nothing a visitor sees changed — metadata only; listings, filters, and save hearts render exactly as before. *(cycle: index-pages-canonical-og)*

_Screenshots: nightshift/screenshots/index-pages-canonical-og/_

## Site-wide / other

- Nothing this round — all four cycles were scoped to the pages above. (No nav, layout, or infra changes beyond the sitemap entry for the new /aircraft/browse hub, noted under that page.)

---

## Anything that needs your attention

- **No schema, database, or migration changes this round.** Every cycle explicitly confirmed "NO schema/DB/SQL." Nothing to review on the data side.
- **No failed cycles, no abandoned branches.** All four cycles passed QA (PASS) against a production build at desktop 1280px and phone 375px, with zero horizontal overflow and no app-origin console/hydration errors.
- **One known non-issue to be aware of:** during rapid QA, the pages that show aircraft photos logged some external-CDN "429" (rate-limit) noise from the Next image optimizer fetching placeholder photos from `upload.wikimedia.org`. This is a pre-existing throttle on shared placeholder images under fast automated testing, **not** a code regression — but if any listing photo ever looks slow or missing in real use, this placeholder-image source is the thing to revisit.
- **Worth eyeballing yourself, logged into Vercel:** these were all verified by the automated build/QA, but the two most interactive changes deserve a quick hands-on check — the new **chip-bar filtering** on /aircraft and the **curated rails** scrolling on the homepage, both on your own phone.

## To ship

Tell Claude: "promote /aircraft and /aircraft/browse" (or "promote everything"). Claude merges the chosen work staging→main, which deploys it to clubhanger.com.

A natural bundle if you like all of it: **promote everything** — the four cycles are complementary, and the new browse hub is linked from /aircraft, so promoting /aircraft without /aircraft/browse would leave that new link pointing at a page that isn't on production yet.
