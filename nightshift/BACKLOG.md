# Night Shift Backlog

This is the steering wheel. The overnight loop reads this file every cycle and
picks the highest-value unblocked item. Keep it current — what's here is what
gets built while you sleep.

**North star: `nightshift/GOAL.md` — maximize pageviews (lever: SEO).** The PM now
picks by expected pageview impact and may *invent* SEO experiments (tagged
`[agent]`) when they beat the backlog, so this list never runs dry. Items below are
still built — they make pages worth visiting — but the goal breaks ties.

## How to add an idea
- Drop it under **Ideas** with a one-line description.
- For design/UX work, add an **Inspiration** entry: a URL + 2-3 bullets of
  *exactly what you like*. Specific likes → on-brand results; "make it nicer" → slop.
- Mark priority with `[P1]` (do first) / `[P2]` / `[P3]`.
- **Mark intent so the allocation policy can route it** (see `GOAL.md`):
  `[want]` = you want it for product reasons · `[bug]` = something's broken ·
  `[goal]` = expected to grow pageviews (SEO/content). Untagged → inferred
  (SEO/content=goal, "BUG"=bug, other features=want). The loop alternates
  `[want]`↔`[goal]` ~1:1, with `[bug]`/blockers always first.
- Big items (map, AI search, comparison) must be **sliced** into shippable
  increments across multiple cycles — one slice per cycle.

## Note to the PM agent
Each cycle, pick ONE scoped slice. Prefer P1s. For multi-cycle items, do the
smallest valuable increment and note the next slice in the CHANGELOG. You may
append your own ideas to the Ideas list with an `[agent]` tag + one-line rationale.
Monetization/ads = build UI only, never activate a paid network (see FREEZE.md).

---

## Inspiration

- **Hangar67** — https://www.hangar67.com/ — the human likes a lot of its features.
  - Modern aircraft marketplace; study it for listing-card density, saved searches/favorites, filtering, comparison, and map.
  - NOTE: Cloudflare-blocks headless browsers. To study it, use headed/handoff browse mode or work from the human's notes.
- **Controller.com filters** — https://www.controller.com/listings/for-sale/piston-single-aircraft/6
  - Take the *filter taxonomy*, leave the clutter — the human finds Controller "a little busy."
  - Borrow the dimensions (make, model, year, price, total time, engine time, avionics, condition, location); present far fewer at once with progressive disclosure.
- **Etsy × Airbnb — overall visual aesthetic** — https://www.etsy.com/ + https://www.airbnb.com/ — the human wants ClubHanger to feel like a warm, polished consumer marketplace blending these two.
  - **Airbnb:** photo-forward cards with big rounded corners (~`rounded-2xl`), soft hover-lift shadow, minimal/no hard borders; a horizontally-scrolling **category chip bar with small icons** at the top of browse pages; clean type hierarchy + generous whitespace; heart-favorite in the card's top-right.
  - **Etsy:** warm, editorial feel — slightly warm off-white/cream surfaces (not cold slate-gray), friendlier headline type, and curated **collection "rails"** on the homepage (e.g. "Time-builders under $100k", "Glass-panel singles", "Project planes", "Near you").
  - **Branding is OPEN for experimentation** — logo, name treatment, accent color(s), typography, overall look are all fair game; the human will give feedback after the cycle. Try things, but keep each cycle cohesive and reversible (don't thrash the whole brand at once), and keep the "cleaner than Controller" restraint. (Major nav/IA *reordering* still asks a human — see FREEZE.)

---

## Ideas

### Design & aesthetic — 2026-06-20 (fresh human request)
The human likes the look/feel of **Etsy + Airbnb** and wants ClubHanger to adopt a
combination of the two (see the Etsy × Airbnb entry under **Inspiration** for the
exact likes). A wholesale reskin is too big for one cycle, so this is **sliced — ONE
slice per cycle**, each shippable on its own and **375px-first**. **Branding is now
open for experimentation** (logo, accent color, typography, overall look) — the human
reviews post-cycle, so try things; just keep each cycle cohesive and reversible.

- ~~**[P1][want] Etsy × Airbnb visual refresh — slice 1: design tokens + reference surface.**~~ ✅ SHIPPED 2026-06-20 (see Done). Tokens (`--ch-surface` cream / `--ch-radius-card` rounded-2xl / soft + hover-lift shadows; `.ch-card`/`.ch-panel`/`.ch-surface`) live in `globals.css`, applied to the `/aircraft` reference surface. **Next slices use these tokens — start from `globals.css`.**
- ~~**[P2][want] slice 2: listing-card redesign (Airbnb-style).**~~ ✅ SHIPPED 2026-06-20 (see Done). Both `AircraftSaleCard` + `PartnershipCard` now share `.ch-card` (rounded-2xl + soft shadow + hover-lift, no hard border), larger mobile photo (h-52), bold price (text-2xl extrabold), heart top-right, badges + location intact. QA PASS desktop + 375px on /aircraft and /partnerships. **Next slice = chip bar (slice 3).**
- **[P2][want] slice 3: category chip bar (Airbnb-style).** A horizontally-scrolling row of small icon "chips" at the top of `/aircraft` (then partnerships) that set existing filters — by make, price band, mission, "near me." Reuses current filter params; no new backend.
- **[P2][want] slice 4: homepage curated rails (Etsy-style).** Add horizontally-scrolling "collection" rails of real listings on the homepage ("Time-builders under $100k", "Glass-panel singles", "Near you", "New this week"), each linking to the matching filtered search / SEO page.
- **[P3][want] slice 5: token sweep.** Apply the design tokens to the remaining pages (listing detail, guides, tools, airport, partnerships) for consistency. One page-family per cycle.

### From report feedback — 2026-06-20 (human review of first run)
Highest-priority steering. Bugs first, then alternate want/goal per the allocation policy.

**Bugs (do first):**
- ~~**[P1][bug] Save-listing sign-in redirects to homepage, not back.**~~ ✅ Re-verified 2026-06-20 against current staging — **already fixed**: heart-while-logged-out routes to `/auth?next=<listing>` and the callback returns to that listing (no homepage fallback in the chain). No code change needed. See CHANGELOG 2026-06-20T23:15Z.
- ~~**[P1][bug] Homepage search re-prompts signup when already signed in.**~~ ✅ FIXED 2026-06-20 — `HeroSearch` now reads auth state and, when signed in, navigates straight to `/partnerships?…` instead of opening the SignUpGate (logged-out behavior unchanged). See CHANGELOG 2026-06-20T23:15Z.

**Filters & search (extends the [P1] Filter UI overhaul):**
- **[P1][want] Marketplace filters: multi-select + ranges.** Model multi-select (SR20 + SR22 together) and Listing-Quality multi-select (any combo of A/B/C). Price, Year, Total Time become **min/max ranges**. 375px-first.
- **[P1][goal] Search-by-mission presets + SEO landing pages.** Mission chips that auto-set filters: "cross-country with family", "time building", "experimental for fun", "first aircraft / training", "fuel efficiency". Each also becomes an SEO page (`/aircraft/mission/[mission]`). Slice: (1) chips on `/aircraft`; (2) per-mission landing pages + sitemap.
- **[P2][want] Homepage free-text / AI search box.** NL box ("Cirrus SR-22s near me under $400/mo") that auto-populates results; show 2-3 example queries inline to teach phrasing. Extends the AI-search item; this slice = put it on the homepage beside the airport search.

**Search results UX:**
- **[P2][want] Blend result types + cross-sell.** Instead of hard tabs, blend partnerships / planes-for-sale / pilots; when viewing one, surface a prominent side panel upselling the other two with relevant results.
- **[P2][want] Make "Save this search" prominent in results** for both for-sale and partnerships (saving a listing is discoverable; saving a search isn't).

**Identity & account:**
- **[P2][want] Signed-in indicator + profile menu.** Upper-right avatar + name when signed in; dropdown consolidating Account, Admin, Saved listings, Saved searches. Generate default **pilot-themed cartoon avatars** for users without a photo.
- **[P2][want] Email notification settings page.** Start a settings page for notification preferences (don't send yet — human tests email later). Pairs with the `alerts` table.

**Trust signals (extends the trust-layer item):**
- **[P2][want] Explain the trust/quality badges.** The bare "B" badge is unclear — hover tooltips per badge + a "what do these mean?" legend page linked from listings.

**Content / guides:**
- **[P2][goal] Guides: less text-heavy + broaden + engage.** Break up text with images/tables/charts; add general aircraft-ownership guidance (not just co-ownership); embed relevant top YouTube videos; add a small "request a guide" feedback link to invite interaction.

**Airports (human "really likes" these — community angle):**
- **[P1][want] Airport pages as community hubs.** Keep the planes/partnerships focus, but add FBOs + ratings, flight clubs + ratings, "pilots who fly out of here," and let pilots set a home airport. Slice: (1) FBO + flight-club sections (seed from public data); (2) ratings; (3) pilots-by-home-airport (needs profile base-airport below).
- **[P2][want] Profile: base + favorite airports.** Let pilots set base airport(s) + favorite/frequently-visited airports (feeds the airport "pilots here" section).

**Polish & tools:**
- **[P2][want] Model pages: richer specs + per-model differentiators.** Fill out specs + a short "what's different about this model" blurb (Wikipedia is fine). Improves the make+model SEO pages.
- **[P3][want] Nav polish.** Add icons to Partnerships, Planes-for-Sale, Guides (Tools already has one); move **About** out of top nav into the footer.
- **[P2][want] Expand tools/calculators + on-page feedback ask.** More detail in the calculators; add an on-page feedback prompt.

**Data quality — seed pilot-seeking listings (owner-approved approach):**
- **[P1][want] Seed pilot-seeking listings from FAA records.** Populate empty pilot-seeking / partnership pages so every page shows ~6-10 results. Owner-chosen approach: pull from the public **FAA airman registry** — use **first name + last initial only**, include **ratings**, **cartoon avatars**, and **NO contact information**. Write varied, personality-driven "what aircraft I'm looking for" descriptions (first aircraft, upgrade, time-building, experimental-for-fun, etc.). Keep "post your own" prominent. Slice: (1) data pull + anonymization (first name + last-initial, ratings, aircraft type; strip addresses/contact); (2) cartoon avatar generation; (3) generated descriptions + render with "post your own" CTA.
  - **Owner approved this over a flagged concern** (raised twice): attributing fabricated seeking-intent to real-derived identities can misrepresent real people, may deceive visitors, and touches publicity-rights / FAA-data-use considerations. Mitigations baked in: last-initial only, no contact, avatars. **Recommend a quick legal gut-check on FAA airman-data use + publicity rights before this goes live**, and surface it in the CHANGELOG when built so the owner reviews before promoting to prod.

### SEO breadth — keyword-researched (brainstorm 2026-06-19)
Keyword signal (Google autocomplete, 2026-06-19): demand centers on **make+model +
"for sale"** (`cessna 172 for sale` → `+california` / `+near me` / `+under $50,000` /
`+used` / `+price`), **geo** (`aircraft for sale california` outranks even `near me`;
`near me` + `near [airport]` on every query), and a **content/tools** seam for
partnerships (`airplane partnership agreement template` / `spreadsheet` / `llc`).
Partnership search < for-sale search (confirmed). `flying club near me` is a real
adjacent query. Build each as a genuinely useful, unique page — obey GOAL.md (NO
thin/doorway pages; real listings + real data per page).

- **[P1][goal] Aircraft-for-sale make+model pages.** `/aircraft/[make]/[model]` (e.g. `/aircraft/cessna/172`): all matching for-sale aircraft + model specs + a cost-to-own blurb. Title `"{Make} {Model} for sale — {N} aircraft | ClubHanger"`. The #1 search pattern. Slice: (1) route + top ~20 make/model combos by inventory; (2) all combos with inventory + add to sitemap; (3) unique H1/meta + JSON-LD (Vehicle/Offer); (4) price & state variants (`{model} for sale under ${X}`, `{model} for sale in {state}`).
- **[P1][goal] Geo "near [airport] / near me" pages.** Planes-for-sale AND partnerships near a location, keyed off the `airports` lat/lng — `/aircraft/near/KHWD`, `/partnerships/near/KHWD` ("partnerships near Hayward airport"). Slice: (1) `/partnerships/near/[icao]` for busiest airports; (2) for-sale variant; (3) a "near me" geolocation landing that routes to the nearest airport page; (4) sitemap + internal links from existing airport pages.
- **[P1][goal] State-level for-sale pages.** `/aircraft/for-sale/[state]` (`aircraft for sale california` is the single top autocomplete); extend the existing partnerships-by-state pattern to for-sale. Slice: (1) all 50 states with real listings; (2) unique titles/meta + sitemap; (3) cross-link make+model within each state.
- **[P2][goal] Partnership tools + guides (content / linkbait).** Hit the informational seam: a free **partnership agreement template** page, a **cost-split tool** (ties to the calculators), and guides ("How aircraft co-ownership works", "How much does it cost to co-own a Cessna 172?"). High-intent, low-competition, earns links. Slice: one asset/guide per cycle.
- **[P2][goal] Flying-club / "near me" angle.** `flying club near me` is real geo demand — a `/flying-clubs/near/[icao]` family (or positioning that surfaces partnerships + clubs by area). Slice: (1) page family off `airports`; (2) content explaining club vs partnership vs share.
- **[P2][goal/want] Shareable listing pages (OG / Twitter cards).** Rich Open Graph + Twitter card + JSON-LD on every listing detail so shared links render with photo/price/specs → referral traffic. Add a "Share" button. Slice: (1) OG/twitter meta + a dynamic OG image; (2) share button + copy-link.

### Brainstorm round 2 (2026-06-19) — rank, convert, trust
**Foundation — make the round-1 breadth pages actually rank:**
- **[P1][goal] Sitemap + canonical sweep.** Auto-generate `sitemap.xml` covering every programmatic page (state / make / model / airport / near / tools), regenerated on build + referenced in `robots.txt`; add `<link rel=canonical>` to each programmatic page to kill duplicate-content risk. The breadth pages don't rank if Google can't crawl them cleanly. Slice: (1) dynamic sitemap of all routes + robots; (2) canonical tags across families; (3) split sitemaps if large.
  - **[P2][goal] Two verified gaps (live audit 2026-06-20 on clubhanger.com): (a) the homepage `/` has NO canonical tag — add a self-canonical to `https://clubhanger.com/`; (b) `og:url` is empty on every page — set `og:url` sitewide (and confirm `og:image`/`og:title` are populated) so shared links carry the canonical URL. Everything else (robots, 1,252-URL sitemap, per-page canonicals, unique titles, no stray noindex) verified correct.**
- **[P1][goal] Internal linking graph.** "Related" rails wiring make↔model↔state↔airport↔listing (a Cessna 172 listing links to `/aircraft/cessna/172`, its state page, nearest-airport page; airports link to nearby airports). Breadcrumbs everywhere → spreads crawl + link equity. Slice: (1) breadcrumbs + listing→family links; (2) family→family rails; (3) nearby-airport cross-links.
- **[P2][goal] Page-speed / Core Web Vitals pass.** `next/image` for all listing/aircraft images, lazy-load below the fold, trim client JS, audit LCP/CLS at 375px. A ranking factor; helps thin pages compete. Slice by page family.
- **[P2][goal] Rich structured data (JSON-LD).** Product/Offer on listings, Place on airport pages, FAQPage on guides, BreadcrumbList sitewide → eligible for rich results = higher CTR. Slice by schema type.

**Conversion — turn SEO visitors into a list (a goal once traffic grows):**
- **[P1][want] Email alerts capture (smart, low-friction).** Inline "Get alerts for {Make} {Model} near {airport}" on search results + listing + the new programmatic pages — one email field, NO account required, double-opt-in confirmation, stored to an additive `alerts` table; then a weekly "N new matches" email. Seeds the list now, pays off as traffic grows. Tasteful only — no modal spam, no fake urgency (FREEZE). Slice: (1) capture UI + table; (2) confirmation email; (3) weekly match digest.
- **[P2][want/goal] Price-vs-market insight.** On a for-sale listing, "priced ~X% below/above similar {model} listings," computed from your own inventory as comps (show only with ≥N comps). Unique data Barnstormers/Craigslist don't surface — shareable/linkable. Slice: (1) comp calc + badge on detail; (2) "market snapshot" on model pages.

**Trust — the human's #1 differentiator: pilots trust filled-out, on-platform, real-photo, member-posted listings:**
- **[P1][want] Listing trust layer.** Make trustworthiness visible and maximize it: (a) a trust/completeness badge on cards + detail (real photo ✓, full specs ✓, on-platform contact ✓, posted by signed-up member ✓); (b) rank complete + on-platform + real-photo listings above thin/off-platform ones (extends existing ranking work); (c) nudge posters to complete listings + add real photos (post-flow + an owner "improve your listing" prompt); (d) prefer on-platform contact over off-platform redirects. Goal: as many fully-filled, on-platform, real-photo, member-owned listings as possible. Slice: (1) trust badge + signals; (2) completeness-weighted ranking; (3) poster completion nudges; (4) reduce off-platform redirects.

### Planes for Sale
- **[P1] Filter UI overhaul.** Lead with **Make + Model** (the primary search path — Model options depend on selected Make). Then secondary filters: **avionics, total time (tach/Hobbs), engine time (SMOH), year, price, state.** Cleaner than Controller — surface the few that matter, progressive-disclose the rest. Must work at 375px.
- **[P1][bug] real aircraft photos missing.** None of the sale listings show the actual plane photo. Diagnose the whole path: is the Barnstormers ingest capturing image URLs? Are they being re-hosted / stored on `aircraft_for_sale`? Is the card falling back to a placeholder when a real image exists? Fix so real photos render, with the "Not actual plane photo" badge only when genuinely a placeholder.

### Search & discovery
- **[P2] AI natural-language search (beta).** A search box that takes "low-time IFR Cirrus under $400/mo near the Bay Area" → translates to structured filters via Claude (reuse the app's existing LLM/parse layer + `ANTHROPIC_API_KEY` — do not hardcode keys) → runs the query. Label clearly as **beta**. Slice it: (1) NL→filters endpoint, (2) wire to results, (3) polish.
- **[P2] Map view (Yelp-style).** Pannable map; results update as you move the map, keyed to airport lat/lng (already in the `airports` table). **More valuable for partnerships than planes-for-sale.** Big — slice it: (1) static map of current results, (2) markers + popovers, (3) pan-to-search ("search this area").

### Engagement & accounts
- **[P2] Save / favorite listings.** Heart button on cards + detail pages (partnerships AND planes-for-sale). Logged-out click → **registration gate** (sign in/up), then saves to the user's account. New `saved_listings` table; a "Saved" view. Reuse existing auth.
- **[P2] Listing comparison.** Select 2-3 listings → side-by-side spec/cost/requirements comparison. A compare tray + a `/compare` view. Works for planes-for-sale (specs) and partnerships (costs/requirements).

### Partnerships
- **[P2] Merge "Available" + "Seeking" into one toggle.** `/partnerships/seeking` is currently blank. Instead of two separate lists, when searching partnerships show a mix of **available partnerships** + **pilots seeking to form groups**, with a toggle: Available / Seeking / Both. Keep SEO intact.

### Re-filed from the 6/14 feature run — adapt the existing code, don't rebuild from scratch
These shipped as PRs on 6/14 but went stale (35 commits behind staging) and now conflict. The code is a strong starting point: rebase the relevant files onto current `staging`, resolve conflicts, then QA per RUNBOOK. ONE per cycle.
- **[P1][want] Cost + earnings calculators.** Standalone `/tools/cost-calculator` (co-ownership cost split) + `/tools/earnings-calculator` (leaseback earnings). Near-complete in branch `feat/financial-calculators` (PR #17): mostly new isolated files — `src/app/tools/*`, `src/components/CostCalculator.tsx`, `EarningsCalculator.tsx`, `src/lib/calculators.ts` + tests. Only 1 conflict; easiest win. Link in footer/nav. Cleaner-than-Controller, 375px-first.
- **[P2][want] Compatibility matching engine + new-match alerts.** Score how well a seeker fits an available partnership (and vice-versa) from EXISTING columns (budget, home airport + `willing_to_travel_nm` via airport lat/lng, ratings, hours, share type) — NO schema change. Surface "N matches" + a `/matches` view + match badges. Starting code in `feat/matching-engine` (PR #15): `src/lib/matching.ts` + tests, `MatchScore.tsx`, `ListingMatches.tsx`. Pairs with the Available+Seeking toggle above.
- **[P2][want] Listing depth — photo gallery + similar listings.** Multi-photo gallery on the partnership detail page + a "Similar listings" rail. Starting code in `feat/listing-depth` (PR #18): `PhotoGallery.tsx`, `SimilarListings.tsx`. The "richer filters" part of that PR overlaps the P1 Filter UI overhaul — fold it there, don't duplicate.
- **[P3][want] Pilot profiles + reviews/trust.** Public pilot profile pages, verified badge, reviews. Starting code in `feat/pilot-profiles` (PR #16). CAUTION: needs a new DB migration (`0001_profiles_and_reviews`) **a human must apply**, and it wired into the OLD `admin/review` UI since rebuilt into the tabbed admin — redo the admin-side wiring against current code. Slice it; flag the migration in the CHANGELOG for the human.

### Quality — re-QA the original 6/12 audit
- **[P2][bug] Re-verify the 6/12 QA findings against current staging; fix only what still reproduces.** Original audit (`.gstack/qa-reports/qa-report-clubhanger-2026-06-12.md`, shipped as stale PRs #1-7) flagged: a React hydration warning on `/partnerships` from locale date formatting; incomplete "Unknown Unknown" captured listings ranked first; "Send Email" dead-ends on captured listings; seeking empty-state copy ("match your filters" with no filters set). Several may already be fixed by later work (the P1 photo bug + listing-quality grading cover the image/ranking ones). Check each on current staging at desktop + 375px; fix what still reproduces. Do NOT merge the stale PRs.

### Monetization (UI only — do NOT activate; human decision)
- **[P3] Standardized ad placements.** Build reusable, consistently-sized ad-slot blocks (e.g. leaderboard, in-feed, sidebar) with placeholders. Do NOT wire a live paid network — leave activation to the human. Networks to evaluate and summarize for the human (don't pick one autonomously):
  - **Google AdSense / Ad Manager** — easiest, broadest, low traffic minimum.
  - **Mediavine / Raptive / Ezoic** — higher RPM, but need meaningful traffic minimums.
  - **Carbon Ads** — clean, single tasteful ad; good for niche/dev audiences.
  - **Direct / house ads to aviation advertisers** (avionics shops, aircraft insurers, flight schools, brokers, title/escrow) — likely the best fit + highest value for a niche GA audience; a simple house-ad slot the human can sell directly.

---

## Constraints / taste notes
- **Brand/palette is open for experimentation** (logo, accent color, typography, overall look) — the human reviews post-cycle. Keep each cycle to ONE cohesive palette and make it reversible; don't scatter unrelated colors or thrash the whole brand at once.
- **Mobile-first** — every change must look right at 375px before desktop.
- **Cleaner than Controller** — the human finds dense filter walls busy. Few filters visible, progressive disclosure for the rest.
- No dark patterns, no fake urgency, no autoplay.
- Monetization, pricing, removing features = **ask a human** (FREEZE.md).

---

## Done
<!-- The loop appends shipped items here with a date + staging link. -->
- 2026-06-20 — **/partnerships/seeking SEO metadata ([goal], priority page #4)**: brought the weakest of the 12 priority pages up to the make-page SEO bar — added self-canonical + OpenGraph to its metadata, a crawlable `Breadcrumbs` trail (Home › Partnerships › Seeking, emits BreadcrumbList JSON-LD), `ItemList` JSON-LD matching the surfaced available-partnership cards 1:1 (real `/partnerships/[id]` urls, Offers only where price exists), and a make-hub cross-link block (Cessna/Cirrus/Piper + View all) so the page is no longer an internal dead-end. `SeekerList` gained an optional `fallbackPartnerships` prop so one query backs both the markup and the rail. Reused existing helpers only; no new component/color; NO schema/DB/SQL change. QA PASS desktop + 375px against the production build (canonical + 4 OG tags + 3 parseable JSON-LD blocks in served HTML, breadcrumb links real, no overflow, no console errors, CTA/tabs intact). See CHANGELOG 2026-06-20T23:12Z. **Next: same canonical+OG sweep on the parent `/partnerships` (#3) + `/aircraft` (#2) index pages (both still lack a self-canonical/OG); then seed real `partnership_seekers` rows ([want]) so the page shows actual seekers.**
- 2026-06-20 — **Etsy × Airbnb visual refresh — slice 1: design tokens + reference surface ([P1][want])**: established the shared visual language once in `src/app/globals.css` — a warm cream page surface (`--ch-surface` `#faf7f2`), a consistent `rounded-2xl` card radius (`--ch-radius-card`), a soft resting shadow + gentle hover-lift (`--ch-shadow-card`/`--ch-shadow-hover`), exposed as `.ch-card` / `.ch-panel` / `.ch-surface` utilities (reduced-motion respected) and documented inline for later slices. Applied to ONE reference surface — `/aircraft`: `AircraftSaleCard` adopts `.ch-card` (minimal border, big rounded corners, hover-lift), the filters sidebar + by-state blocks adopt `.ch-panel`, a cream `.ch-surface` wraps the page, and the H1 got a larger/friendlier treatment. NO global body change (kept the sky accent; warmed neutrals only) → reversible + cohesive, no other page touched. QA PASS desktop + 375px against the production build (cream surface verified, card radius 16px + shadow, no 375px overflow, no console errors, all card content/links/heart/compare intact, homepage unchanged). See CHANGELOG 2026-06-20T23:03Z. **Next: slice 2 = full `AircraftSaleCard` + `PartnershipCard` content redesign on these tokens (larger photo, bold price, heart top-right, trust/grade badges); start from `globals.css`.**
- 2026-06-20 — **Email alerts capture — slice 1: capture UI + table ([P1][want])**: added a tasteful, inline (NOT modal, no fake urgency) one-field email capture to the two high-intent for-sale SEO pages — `/aircraft/[make]/[model]` ("Get alerts for new {Make} {Model} listings") and `/aircraft/for-sale/[state]` ("Get alerts for new {State} listings"). No account required; on submit it persists email + context + source_path to a NEW additive `alerts` table (`status='pending'`, `created_at`), shows a friendly in-place success state, validates email format, and dedupes idempotently. ⚠️ SCHEMA: added table `alerts` (strictly additive; anon INSERT, NO public SELECT — PII protected, mirrors `waitlist`). Sky-blue accent only, 375px-first. QA PASS desktop + 375px against the production build (success state, real persistence verified via service role, invalid-email rejection, idempotent re-submit = 1 row, anon SELECT denied, no overflow/console errors). See CHANGELOG 2026-06-20T07:38Z. **Next: slice 2 = double-opt-in confirmation email (`status` seam already in place); slice 3 = weekly "N new matches" digest.**
- 2026-06-20 — **Cost + earnings calculators ([P1][want])**: shipped two standalone mobile-first tools — `/tools/cost-calculator` (co-ownership cost split: buy-in/fixed/wet-rate/hours → all-in monthly, true $/hr, vs-renting & vs-owning) and `/tools/earnings-calculator` (leaseback offset: dues + flying margin → monthly/annual offset, upfront buy-ins, fixed-coverage bar). Adapted the 6 isolated files from `feat/financial-calculators` (PR #17) onto current staging (zero conflicts — all net-new), recolored the earnings tool emerald → sky (sky-blue accent only), linked both in a footer "Tools" group. Pure client math, 4 unit tests pass, no schema change. QA PASS desktop + 375px against the production build. See CHANGELOG 2026-06-20T06:13Z. Next: embed the `variant="compact"` calculators on `/partnerships/[id]` + `/partnerships/new`; add a top-nav Tools link + JSON-LD.
- 2026-06-19 — **Save / favorite listings — `/saved` view + nav link (slice 2)**: logged-in users now have a `/saved` ("My Saved Listings") page listing every partnership they've hearted (newest-saved first, reuses `PartnershipCard` with filled hearts, graceful empty state + orphan/inactive drop), plus a "Saved" nav link (Heart icon) in the desktop + mobile menus. Logged-out `/saved` → `/auth?next=/saved`. No schema change — reuses the `saved_listings` table from slice 1 (`toggleSavedListing` already revalidates `/saved`). See CHANGELOG 2026-06-19T13:03Z. Next: aircraft hearts (extend favorites to Planes-for-Sale + surface on `/saved`) — still blocked on `AircraftSaleCard.tsx` human WIP.
- 2026-06-19 — **Save / favorite listings — Partnerships (slice 1)**: heart button on every Partnership card + a "Save" button on the `/partnerships/[id]` detail header. Logged-out → registration gate (`/auth?next=<path>`); logged-in → toggles a new additive `saved_listings` table (owner-only RLS, mirrors saved_searches), heart shows filled (staging). Fulfills the SignUpGate's "Track listings you're interested in" perk. `listing_type` already accepts `'aircraft'` for a future slice. See CHANGELOG 2026-06-19T12:04Z. Next: slice 2 = a `/saved` view + nav link; then aircraft hearts (blocked on AircraftSaleCard.tsx human WIP).
- 2026-06-19 — **Saved searches on Planes-for-Sale**: `/aircraft` now has a "Save this search" button (logged-out → registration gate), and saved searches became marketplace-aware (additive `saved_searches.path` column) so an aircraft search replays against `/aircraft` with aircraft-vocabulary description + a "Planes for Sale" badge on `/searches` — instead of being treated as a partnership search (staging). Reuses the existing `SaveSearchButton`/`saveSearch`/SignUpGate plumbing. See CHANGELOG 2026-06-19T11:06Z. Next: slice 2 = email alerts on new matches (the SignUpGate's promised perk).
- 2026-06-19 — Filter overhaul **numbered pages**: /aircraft pager now shows windowed numbered page buttons (1 2 … current±1 … 31) with the current page highlighted + ellipsis, alongside Prev/Next, so users can jump across the 31-page default set (staging). Filters preserved on every page href; price-drops path still single-window. See CHANGELOG 2026-06-19T10:03Z. Filter overhaul [P1] now functionally complete; remaining slices (avionics/SMOH filters, real photos) blocked on human scraper WIP.
- 2026-06-19 — Filter overhaul **pagination**: /aircraft now pages through the full filtered set (`?page=N`, Prev/Next, "Showing X–Y of N" header, graceful out-of-range last page) instead of stopping at the first 60 rows (staging). Filters are preserved across pages. See CHANGELOG 2026-06-19T09:02Z. Follow-up: numbered page buttons / jump-to-page.
- 2026-06-19 — Filter overhaul **polish**: /aircraft results header shows the true total match count (e.g. "1,856 … — showing first 60") instead of capping at "60+", so filtering visibly works above 60 matches (staging). See CHANGELOG 2026-06-19T08:03Z. Follow-up: real pagination.
- 2026-06-19 — Filter overhaul **slice 2**: Max Total Time filter + progressive-disclosure "More filters" on /aircraft (staging). Avionics/SMOH filters deferred — those columns are 0% populated in the DB (ingest gap). See CHANGELOG 2026-06-19T07:03Z.
- 2026-06-19 — Filter overhaul **slice 1**: Make + Model dependent dropdowns on /aircraft (staging). See CHANGELOG 2026-06-19T06:04Z.
