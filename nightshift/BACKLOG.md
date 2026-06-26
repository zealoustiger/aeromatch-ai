# Night Shift Backlog

This is the steering wheel. The overnight loop reads this file every cycle and
picks the highest-value unblocked item. Keep it current — what's here is what
gets built while you sleep.

**North star: `nightshift/GOAL.md` — ACTIVATION (pivot 2026-06-26).** Three pillars:
(1) frictionless listing posting, (2) frictionless signup/auth, (3) proprietary,
honest buyer analysis on listing pages (the ClubHanger Estimate is the template).
**SEO is PARKED** — do NOT invent SEO experiments or build new programmatic page
families; the SEO sections below are tagged `[PARKED]`, touch them only to fix a
`[bug]`. Each cycle, pull the highest-value slice from **"ACTIVATION (pivot focus)"**
just below, rotating across the three pillars so none stalls. `[goal]` now means
"advances an activation pillar," not SEO. The previous SEO goal is preserved verbatim
in `GOAL-seo-parked.md` for when we un-park it.

## How to add an idea
- Drop it under **Ideas** with a one-line description.
- For design/UX work, add an **Inspiration** entry: a URL + 2-3 bullets of
  *exactly what you like*. Specific likes → on-brand results; "make it nicer" → slop.
- Mark priority with `[P1]` (do first) / `[P2]` / `[P3]`.
- **Mark intent so the allocation policy can route it** (see `GOAL.md`):
  `[want]` = a product feature outside the 3 pillars · `[bug]` = something's broken ·
  `[goal]` = advances an activation pillar (posting / signup / buyer-analysis). Since
  the 2026-06-26 pivot, `[goal]` is ACTIVATION, not SEO; the loop pulls the highest-value
  activation slice each cycle (rotating pillars), with `[bug]`/blockers always first.
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

## ⭐ ACTIVATION (pivot focus — 2026-06-26) — PULL FROM HERE FIRST
The three north-star pillars. Each cycle, build the highest-value **`[P1]`** slice and
**rotate across the pillars** so none stalls (don't spend a week only on analysis). All
items are `[goal]` under the pivot (activation), and `[bug]`s in posting/signup flows are
P0 (a broken flow defeats the goal). Slice big items — one shippable increment per cycle.
When you ship one, mark it ✅ and note the next slice in the CHANGELOG.

### Pillar 1 — Frictionless listing posting
Target: cut every step/field/decision between "I want to list" and "it's published."
Current post flows: `/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new`
(server actions in `src/app/actions.ts`; AI draft already exists for partnership/seeker).
- **[P1][goal] N-number autofill on the aircraft post form.** A `/api/faa-lookup` route
  already exists — wire it into `/aircraft/new`: type the registration → auto-fill make /
  model / year / serial (editable). One field replaces four. *Friction removed: 3-4 fields.*
- **[P1][goal] "Paste & prefill" the whole form.** Extend the existing AI-draft
  (`generatePartnershipDraft` / aircraft draft) so a pasted listing blob OR a source URL
  maps into *every* field (make, model, year, price, hours, airport, share terms), not just
  title+description. Human reviews the prefilled form, edits, publishes. *Friction: a whole
  form → a paste + a glance.*
- **[P1][goal] Collapse the post flow to one smart screen.** Reduce required fields to the
  irreducible set (make/model · airport ICAO · price-or-share · contact); push everything
  else to optional/progressive disclosure. ICAO already auto-derives airport/city/state —
  lean on that. Measure clicks-to-publish before vs after.
- **[P1][goal] Autosave the draft (localStorage) + restore.** A half-filled form must
  survive a reload or the auth redirect — never lose someone's typing. Pairs with Pillar 2's
  deferred gate (post first, sign in to publish, draft intact).
- **[P2][goal] Photo upload polish.** Drag-drop + paste + multi-file on the post forms
  (upload routes `/api/upload-aircraft-photo`, `/api/upload-partnership-photo` exist). Make
  adding photos a non-event.

### Pillar 2 — Frictionless signup / auth
Target: never gate value behind an account; when we must ask, one tap or one field.
- **[P1][goal] "Continue with Google" (OAuth).** Supabase supports it — the single biggest
  signup-friction killer. Add to `/auth`, preserve `?next=`. (Magic-link/passwordless email
  is the close second — do it as the next slice.)
- **[P1][goal] Defer the gate to the value moment.** Audit every forced-signup point (home
  search gate, save, post, message) and move the ask to the moment of value: let people
  browse, filter, and build a draft first; sign in only to *save/publish/message*. Device-
  saves already merge on signup (`mergeDeviceSaves`) — extend that pattern so nothing is lost.
- **[P2][goal] Shorten the signup form to email-only.** Collect name/profile *after* the
  account exists (or lazily, when first needed). Every field on the signup screen is friction.

### Pillar 3 — Proprietary buyer analysis on listing pages
Target: every aircraft listing answers "is this a good buy, and what will it really cost me?"
with honest, data-grounded analysis the big sites don't offer. Honesty-gated: when an input
is missing, say "not enough data" — NEVER fabricate (a confident-wrong number is a LOSS).
Build on: extracted specs (`ttaf`/`smoh`/`engine_type`/`avionics`/`annual_due`/`damage_history`),
the ClubHanger Estimate (`src/lib/aircraftComps.ts`), the cost calculator (`src/lib/calculators.ts`),
price history (`previous_price`/`price_changed_at`), comps (`getFamilyComps`).
- **[P1][goal] Engine life & overhaul reserve.** From `smoh` + `engine_type` → a curated
  TBO table (per engine family) → "≈ X hrs / ~Y yrs to overhaul; budget ~$Z reserve."
  Render only when smoh + engine are known. Proprietary because it fuses our extracted specs
  with a TBO/reserve model no listing site shows.
- **[P1][goal] Cost-to-own, on the listing.** Bring the cost calculator onto the detail
  page, prefilled with the listing's real make/model/price/hours → annual fixed + per-hour +
  reserve, with a share-split toggle ("as a 1/3 partner: ~$X each + ~$Y/mo"). Turns a static
  price into a real ownership cost.
- **[P1][goal] Deal Score panel.** Synthesize the signals we already have into one honest
  verdict: comp value (ClubHanger Estimate) + days-on-market + price drops + spec completeness
  → a transparent "how this stacks up" with the *reasons* shown (not a black-box score).
  Reuse the Estimate's min-comps / dead-band honesty floors.
- **[P2][goal] Market position + days-on-market.** "N comparable {make} {model} listed,
  median $X — this is P% below/above; listed N days ago" using `getFamilyComps` +
  `first_seen_at`/`previous_price`. Honest, sourced, proprietary.

---

### Agent-invented SEO experiments  `[PARKED 2026-06-26]`
> PARKED — do not pull. SEO is on hold (waiting for Google to index); fix only as `[bug]`.
- **[agent][goal] Aircraft comparison pages (`/aircraft/compare/[a-vs-b]`).** ✅ SHIPPED
  2026-06-24 (`aircraft-compare-pages`). A new indexable family targeting the very
  high-volume "{model} vs {model}" buyer query class (e.g. "Cessna 172 vs Cirrus SR22"),
  built entirely from the existing curated `MODEL_SPECS` + `MODEL_HIGHLIGHTS` tables (no
  fabricated figures) with a unique per-pair editorial intro, a side-by-side spec table,
  both models' highlights, live inventory CTAs, and internal links from the indexed model
  seed pages into the new family. **Why this grows pageviews:** "X vs Y" is one of the
  highest-intent, highest-volume informational query patterns in aircraft buying, and these
  pages carry real unique value while spreading crawl equity into the model hubs (INDEXING
  stage). Slice 1 = 8 curated pairs + index hub + sitemap. Expanded to **13** curated pairs
  (`compare-pairs-expansion`, 2026-06-24) and to **18** (`compare-pairs-expansion-2`,
  2026-06-24: 182 vs Bonanza, Mooney M20 vs Comanche, Saratoga vs 182, Cessna 180 vs 182,
  Cub vs Citabria). FAQ + FAQPage JSON-LD now ship on every pair. Expanded to **21**
  (`compare-pairs-expansion-3`, 2026-06-24: Cessna 172 vs Grumman AA-5, Grumman AA-5 vs
  Cherokee, Cessna 150 vs Piper Cub — brings the Grumman AA-5 into the family). Expanded
  to **24** (`compare-pairs-expansion-4`, 2026-06-24: Cirrus SR20 vs Cessna 172, Beechcraft
  Bonanza vs Piper Saratoga, Mooney M20 vs Piper Arrow). **Next:** the curated-model pool is
  now very heavily cross-compared — **DIVERSIFY off this family next [goal] cycle** to avoid
  over-concentration (several recent cycles touched it). Remaining niche pairs are thin on
  genuine value; better next [goal] bets: a ClubHanger-Estimate price-context row once a
  comparison-appropriate display is settled, a CWV/`next/image` pass, or geocoding
  `aircraft_for_sale.location` to light up `/aircraft/near/[icao]`.

### Growth & data — owner acquisition (human, 2026-06-23)
FAA-registry-powered ideas. The aircraft registry is public (tail number → owner
name OR LLC + mailing address, make/model/year; NO emails/phones). Two items:

- **[P2][want] N-number autofill on "Post a Listing".** Owner/seller types their FAA
  tail number (N-number) and we prefill make / model / year (and flag individual-vs-LLC
  ownership) from the FAA Aircraft Registry. One-click, accurate listings — gets owners
  to come to us. Low-risk, clean public data. Slice: (1) data source — either the
  single-record inquiry endpoint (`registry.faa.gov/aircraftinquiry`, per-lookup) or
  import the bulk Releasable Aircraft DB (`MASTER.txt` + `ACFTREF.txt`) into an
  `faa_aircraft` table (refresh monthly); (2) an N-number field on the post form that
  fetches + prefills make/model/year; (3) show owner-type (individual vs LLC/trust) hint.
  No emails (FAA has none).

- **[P2][want] Owner-leads list from airport-based tail numbers — DATA COLLECTION ONLY,
  NO OUTREACH YET.** Growth-prospecting dataset: for a chosen airport, enumerate based
  aircraft + tail numbers, enrich each via the FAA registry to an owner name or LLC +
  address, resolve LLCs via state business registries (registered agent / members +
  address), and later attach likely online profiles / emails — assembled into a `leads`
  table + admin view. **Build the list only; contact NObody.** Slice: (1) source
  based-aircraft tail numbers for an airport (ADS-B operators seen at the field / airport
  directory / FAA owner-address proximity — pick a method); (2) FAA registry enrich →
  owner/LLC + address; (3) LLC resolution via Secretary-of-State lookups → agent/members;
  (4) **(gated, later)** profile/email discovery; (5) `leads` table + admin view.
  - **HARD GATE — outreach is OFF.** Do NOT build any send/email/message flow and do NOT
    contact leads. Assembling the dataset is the entire scope. Before ANY outreach: a human
    decision **and** a compliance check (CAN-SPAM, FAA data-use + owner opt-outs, state-data
    ToS, publicity/privacy). Brand note: cold-blasting scraped owners cuts against the
    trust differentiator and risks sender reputation — this is a curated, careful list,
    not a spam cannon.
  - **Flag for human review before any autonomous build.** Touches third-party sources:
    FAA registry is clean/public, but ADS-B, state-SoS scraping, and email enrichment each
    need a ToS/compliance look — the night-shift loop should NOT scrape these unattended
    without sign-off. (Pairs with the N-number autofill item above, which shares the FAA data.)

### Backlog capture — screenshots (human, added in chat)
Items the human captured from chat with a reference screenshot. Each links a
screenshot in Supabase Storage (`backlog-shots` bucket). **When an item here is
completed, delete its screenshot object from `backlog-shots` to reclaim storage.**

- **[P3][want] Link to email settings from Saved Searches.** On the Saved Searches
  page (`/searches`), add a clear link/CTA to the email-notification settings on the
  profile/account page (`/account`) — so a user managing saved searches can jump
  straight to controlling their email alerts for them. (No screenshot.)

- **[P2][want] Detail page + inquiry routing for USER-posted aircraft.** The new
  user post-a-plane flow (`/aircraft/new` → `createAircraftListing`, `source='user'`)
  inserts rows with `source_url = null`. Scraped listings link out to their source,
  but user-posted ones have no destination → their marketplace card currently links to
  `#` (a dead link). Build an internal `/aircraft/[id]` detail page (mirror the
  partnership detail page) that renders the listing and routes buyer inquiries through
  the platform via `poster_id` (reuse the existing partnership messaging/threads, which
  already key off `poster_id`) instead of an external link. Make the card href point to
  `/aircraft/[id]` when `source='user'` (keep the external `source_url` for scraped
  rows). Without this, user-posted aircraft are effectively un-clickable. (No screenshot.)

- **[P2][want] Optional note when saving a listing.** When a user saves a listing,
  let them attach an **optional free-text note** (e.g. "great panel — ask about damage
  history"). If a note exists, display it **(a)** on the listing page and **(b)** on the
  saved listings page (`/saved`). Screenshot (aircraft listing detail — note the
  **Save** button, top-right, where the note affordance attaches):
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/save-note-listing/20260623-falcon-example.png
  — shows breadcrumb `Home / Planes for Sale / Dassault Falcon 900ex`, a Share + **Save**
  pair top-right, the photo, a PRICE card ($795,000), and a "View on AircraftForSale"
  card. Data: add a `note text` column to the saved-listings record (per-user save row).
  Slice: (1) note column + an "add note" input in the save flow (inline on save, or an
  edit affordance once saved); (2) render the note on `/saved`; (3) render the note on
  the listing detail page when present (optionally on the listing card too). Applies to
  both aircraft-for-sale saves and partnership saves.
  — **note column + `/saved` editor ✅ SHIPPED 2026-06-25T085625Z** (`saved-listing-note`):
  additive `note text` column on `saved_listings` (in `schema.sql`); new owner-scoped
  `updateSavedNote` action; inline `SavedListingNote` editor under each card on `/saved`
  (add → textarea → Save; amber sticky note + pencil to edit; clear+save removes). Covers
  the edit-affordance variant of slice 1 + slice 2. **⚠️ Needs the human to apply the
  additive migration in the Supabase SQL editor** (`alter table saved_listings add column
  if not exists note text;`) — the loop can't run DDL; until then the affordance
  self-suppresses (dormant, no regression). **Remaining: slice 3** — render the note on the
  listing detail page (`/aircraft/listing/[id]`) + partnership detail, and optionally on
  browse cards; and the inline-on-save variant (needs SaveButton restructuring). **When
  slice 3 lands and the item is fully done, delete the `backlog-shots/save-note-listing/`
  screenshot object to reclaim storage** (left in place for now — item not yet complete).


Theme: make ClubHanger feel like a polished Zillow/Redfin for aircraft, and stop
showing junk. All human-requested this session. Inspiration: Zillow + Redfin
(listing pages, price history, map, Zestimate), Etsy/Airbnb (collection layout).

**Data quality (do first):**
- ~~**[P1][bug] Hide listings under $50k + no-price from all buyer surfaces.**~~ **Slice 1 ✅ SHIPPED 2026-06-25** (`hide-sub50k-listings`): global `asking_price >= $50k` floor applied to all 9 buyer-facing queries in `AircraftSaleList.tsx` — browse, counts, family pages (make/model/state), market price stats, comp pill price map. Sitemap already had this floor; now all buyer surfaces are in parity. **Remaining:** slice 2 — suppress no-price rows from homepage `HomeRails` `photoOnly` path (low impact, HomeRails already passes `min_price=50000` on most rails). Also see the separate `[P1][bug] Hide parts/wanted listings` item for tightening the ingest classifier. Keep partnerships unaffected (buy-in ≠ aircraft price).

**Homepage curated collections (replaces the old slice-4 "Time-builders under $100k"):**
- ~~**[P1][want] Re-theme collections — stop leading with the cheapest planes.**~~ ✅ SHIPPED 2026-06-23T06:49Z (`rethemed-home-collections`). `HomeRails` `RAILS` re-themed to: *Just listed this week · Recently reduced (price drops) · Glass-panel cross-country · Step-up performance (Cirrus SR22) · Family four-seaters (Cessna 172)*; no "under $X" lead themes, all carry `min_price=50000` (real priced aircraft only), model rails match the model field + link to curated model pages, thin rails auto-drop. See CHANGELOG. **Remaining from the original wishlist:** a "Turnkey & ready to fly" rail (needs a reliable fresh-annual/low-SMOH signal — no clean filter today) and "Near your home airport" (needs home-airport/geolocation — no server-side location yet).
- **[P1][want] Redesign the collection layout — drop the horizontal scrollbar.**
  Preferred **Option A: category tile mosaic** (Airbnb "Explore" / Zillow tiles) —
  responsive grid of big rounded photo tiles (real plane photo behind the label), no
  horizontal scroll, 375px-first, tap → filtered results, on the homepage. **Option B:
  polished snap-carousel** (hidden scrollbar, scroll-snap, next-card peek, chevron
  arrows on desktop hover) for in-listing "more like this" rails. (Human may pick A vs
  a tabbed Option C after a mock.) Reuse `.ch-card`/cream tokens.
  — **Interim Option-B polish ✅ SHIPPED 2026-06-23T08:47Z** (`home-rails-snap-carousel`):
  the homepage curated rails now hide the scrollbar + scroll-snap + next-card peek +
  desktop chevron arrows via a reusable client `RailScroller` (cards stay server-rendered
  as children). This delivers the headline "drop the horizontal scrollbar" reversibly on
  the existing real-listing rails. **STILL OPEN — the wholesale redesign awaits the human's
  mock: Option A (category-tile mosaic) vs tabbed Option C.** Also: apply `RailScroller` to
  the in-listing Similar-aircraft rails (the real Option-B target) + the newest-partnerships
  homepage row for consistency.

**Zillow/Redfin features buyers love (all [want]):**
- **[P1][want] Internal listing detail pages.** Today planes link OUT to the source;
  Zillow/Redfin keep users on-site. Build rich `/aircraft/[…]/listing/[id]` (or similar)
  pages: full photo gallery + all specs + cost-to-own + price history + similar listings
  + contact/source CTA. Biggest UX **and** SEO win (new indexable family — helps the
  INDEXING goal). Slice: (1) route + gallery + specs + source CTA; (2) cost-to-own +
  price-history block; (3) similar listings; (4) JSON-LD Vehicle/Offer + sitemap +
  internal links from cards. (Subsumes the Phase-2 photo gallery/lightbox.)
  — **slice 1 ✅ SHIPPED 2026-06-23T07:55Z** (`internal-aircraft-listing-detail`):
  new `/aircraft/listing/[id]` route with `PhotoGallery` (thumbnail strip + lightbox),
  specs grid, price + price-drop, source/grade/New/registration badges, description,
  Save/Share, breadcrumb + make+model family link, `generateMetadata` (canonical/OG);
  `AircraftSaleCard` photo+title now link internally (footer source CTA unchanged);
  bad ids 404. See CHANGELOG. **Next: slice 2 (cost-to-own + price-history block);
  slice 3 (similar listings); slice 4 (Vehicle/Offer JSON-LD + sitemap + wire homepage
  `AircraftRailCard` to the detail page).**
- **[P1][want] "ClubHanger Estimate" — fair-value pricing (Zestimate analog).** "Priced
  $18k below similar 2008 SR22s" + a Good-deal / Priced-high score, computed from comps
  on make/model/year-band/hours. Differentiator. Slice: (1) comp model + API; (2) deal
  badge on cards (extends existing `CompResult`); (3) price-analysis block on detail page.
  — **slice 1 (comp model) + slice 2 (per-card pill) already live** as `src/lib/aircraftComps.ts`
  (`compVsMarket`) + the `AircraftSaleCard` `CompPill`. — **slice 3 ✅ SHIPPED 2026-06-23T08:01Z**
  (`clubhanger-estimate-detail`): a "ClubHanger Estimate" panel on `/aircraft/listing/[id]`
  comparing the asking price to the median of OTHER active priced same-make+model listings —
  **Below / Around / Above market** with $/% delta, comp count, family link, and a year/hours/
  avionics caveat. Deliberately a **descriptive market comparison, not an endorsement**
  (comp set is the whole family). Pure unit-tested helper `src/lib/aircraftEstimate.ts` +
  read-only `getFamilyAskingPrices()`; self-suppresses on no-price/unknown-family/<4 comps.
  See CHANGELOG. — **endorsement-style "Good deal / Priced high" verdict ✅ SHIPPED
  2026-06-24T10:21Z** (`clubhanger-estimate-deal-verdict`): a "Deal check" line in the
  detail-page `EstimatePanel` comparing the asking price only against **similar-year
  (±5yr) + similar-hours** same-make+model comps (≥4 required) → **Good deal / Fair price /
  Priced high**, additive on top of the existing whole-family descriptive estimate; pure
  unit-tested `clubHangerDealVerdict` + read-only `getFamilyComps`; self-suppresses on
  thin/missing data. **Remaining:** optionally surface the verdict chip on the detail
  page's "Similar aircraft" cards + the browse `AircraftSaleCard`; consider accepting SMOH
  when TTAF is missing to widen coverage.
- **[P2][want] Price history + "Price cut ↓$X" + days-on-market + "New" pills (Redfin).**
  Data already stored (`previous_price`, `price_changed_at`, `first_seen_at`). Slice:
  (1) New + Price-cut pills on cards (extend existing `priceDrop`/`isNew`); (2)
  price-history mini-chart on the detail page; (3) days-on-market label.
- **[P1][want] Map search (Zillow/Redfin core).** Browse planes & partnerships on a map
  by airport/region using `airports` lat/lng; click pins → listings. Slice: (1) map view
  on `/aircraft` + `/partnerships`; (2) pin clustering; (3) "search this area" / region
  filter; (4) sidebar list ↔ map sync.
- **[P2][want] Saved listings + instant new-match email alerts (Redfin favorites).** Save
  exists; add saved-search → alert when new matching listings appear (pairs with the
  `alerts` table). Slice: (1) wire alerts to saved searches; (2) nightly match job; (3)
  email (human tests sending later — build, don't send) + settings page.
- **[P2][want] "Similar planes" comparables on every listing.** Same make/model/region;
  keeps users browsing (the Zillow "more homes like this" loop). Slice: (1) similar-by-
  make/model on the detail page; (2) "also near {airport}" variant.

#### Batch from chat — 2026-06-24 (posting/messaging/filter friction)

- **[P2][want] Post-a-partnership: multi-photo drag-and-drop upload.** The "Post a
  partnership" page should let the user upload **multiple photos** via an easy
  **drag-and-drop** zone (with click-to-browse fallback), thumbnail previews,
  remove-before-submit, and reorder if cheap. Today the flow lacks an easy multi-image
  uploader. Slice: (1) DnD + multi-select zone with previews → Supabase Storage + attach
  URLs to the listing; (2) remove/reorder + validation (type/size/count cap); (3) progress
  states + 375px polish.
- **[P1][want] Post-a-partnership form: make posting frictionless.** Goal — make posting a
  partnership as easy as possible. Changes: (1) **N-number optional** with helper text;
  (2) **simplify "Home airport"** to just the identifier, drop airport-name/city/state
  (implied); (3) **buy-in required**, monthly-fixed + wet (per-hr) rate **optional** with an
  **info hover** explaining partnerships work different ways (leave blank if N/A); (4)
  **remove the pilot-requirements** section; (5) **move "Listing details" earlier** (2nd–3rd
  section); (6) **autosave** with a visible "Saving…/Saved" indicator so users don't fear
  losing progress. Slice: (1) field changes 1–5; (2) autosave + save-state; (3) 375px polish.
  — **slice 1 (field changes 1–5) ✅ SHIPPED 2026-06-24T06:24Z** (`post-partnership-frictionless`):
  N-number marked optional; Home Airport asks for ICAO only (server now derives
  airport_name/city/state from the `airports` table so the state SEO pages keep real data);
  Buy-In required + Monthly/Wet optional with an info hover; Pilot Requirements section removed;
  Listing Details moved to the 2nd section. No schema change. See CHANGELOG.
  — **slice 2 (autosave + "Saving…/Saved" indicator) ✅ SHIPPED 2026-06-24T08:08Z** (`post-partnership-autosave`):
  new reusable `useFormDraft` hook autosaves the form to localStorage (debounced) with a
  Saving…/Draft saved/Draft restored indicator, restores on return, clears on successful post.
  Client-only, no schema. **Remaining: slice 3 (375px micro-polish); and adopt the same hook on the
  Post-a-Seeking form (`/partnerships/seeking/new`).**
- **[P2][want] Easy toggle between the three "Post a…" types.** From "Post a Partnership,"
  make it easy to switch between **post partnership / post plane for sale / post pilot
  seeking partnership** — a segmented toggle/tabs at the top (or at minimum clear links to
  the other two). Today they're separate pages with no cross-nav. Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/post-type-toggle/20260624-post-type-toggle.png
- **[P1][want] Post-a-Seeking form: make it frictionless.** Goal — make posting a "pilot
  seeking partnership" listing as easy as possible. Changes: (1) **base location → multiple
  airports**, drop airport-name/city/state (implied); (2) **"willing to travel" → drive time**
  (e.g. 30/45/60 min), infer distance behind the scenes; (3) **remove "preferred scheduling
  system"**; (4) **description help outside the box** on how to write a great description,
  with **examples of good writing**; (5) reuse partnership-form friction-reducers (optional
  labels, autosave + save-state, sensible order). Slice: (1) fields 1–3; (2) description help
  + examples; (3) shared autosave + 375px polish.
  — **slice 2 (description help + examples) ✅ SHIPPED 2026-06-24T07:28Z** (`seeking-description-help`):
  a "How to write a great description" tips panel (4 bullets) + a native `<details>` "See two example
  descriptions" disclosure (first-time buyer + experienced time-builder) around the Description textarea
  on `/partnerships/seeking/new`. Static/presentational only — no new fields, no schema, no change to
  `createSeekerListing`. See CHANGELOG. **Remaining: slice 3 — shared autosave + "Saving…/Saved" indicator
  (pairs with the deferred post-partnership autosave slice) + 375px micro-polish; plus the still-open
  field changes (1) multiple base airports and (2) "willing to travel" → drive-time.**
- **[P2][want] "Generate with AI" for title + description (all post flows).** ✅ SHIPPED slice 1
  2026-06-25T060247Z (`seeking-ai-draft`). Seeking form (`/partnerships/seeking/new`) now has
  a violet "Generate with AI ✨" box above Title/Description — user types stream-of-consciousness
  notes, Claude Haiku server-side drafts title+desc, fills both fields (editable, not auto-submit).
  Remaining slices: (2) reuse `generateSeekerDraft`-style action on for-sale + partnership post
  forms; (3) rate limit / cost cap before wide traffic.
- ~~**[P2][want] Seeking-partnership profile: fill the empty right rail.**~~ ✅ SHIPPED
  2026-06-24T06:02Z (`seeking-profile-right-rail`). On `/partnerships/seeking/[id]`, the
  **Aircraft Preferences** and **Flying Profile** cards moved out of the full-width left column
  into the **right rail** (order: Budget → Aircraft Preferences → Flying Profile → contact CTA),
  with their inner grids collapsed to a single column to fit the narrow rail; "About me" stays
  the main left column. Same data + privacy gating, purely a layout balance/conversion move.
  See CHANGELOG. (Screenshot object can be deleted from `backlog-shots`.)
- **[P1][want] On-site messaging instead of exposing emails.** Replace the "Send Email" CTA
  ("Have a plane that fits? Reach out to … → Send Email") with a **"Send Message"** flow that
  delivers an **on-site message** to the listing owner instead of handing out their email. If
  no message center/chat exists yet, **build it out** (note: an account "Messages" quick-link
  already exists per recent CHANGELOG — check existing infra first). Slice: (1) `messages`
  schema (thread per listing+sender, additive, RLS so only the two parties read) + send form
  replacing the email CTA; (2) inbox at `/messages` (thread list + view + reply) wired to the
  account link; (3) new-message email **notification** behind `RESEND_API_KEY` (link back, no
  raw email exposed); (4) unread badge + 375px polish. Keep "Send Email" as fallback until
  messaging is live. Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/in-app-messaging/20260624-in-app-messaging.png
- ~~**[P2][want] Partnership filter: multiple airport codes.**~~ ✅ SHIPPED 2026-06-24T10:40Z
  (`partnership-filter-multi-airport`). The `/partnerships` "Home Airport (ICAO)" filter now
  takes **multiple codes** (Enter/comma/blur to add) as removable chips, OR'd via the existing
  `airports` param + `.in('home_airport', …)` query path; one removable chip per airport also
  renders in the results header (`PartnershipActiveFilterChips`). Desktop + 375px; legacy single
  `?airport=KHWD` (+radius) preserved. Pure front-end (no schema). See CHANGELOG. (Screenshot
  object can be deleted from `backlog-shots`.) **Next:** same multi-airport input on the seeking
  browse filter (`SeekerFilters`) + the seeking-form "multiple base airports" field; optional
  "within X mi" radius alongside the multi-airport list.
- ~~**[P2][want] Add "Save this search" inside the filter panel.**~~ ✅ SHIPPED
  2026-06-24T08:39Z (`save-search-in-filter-panel`). A full-width "Save this search" button
  now renders inside the Filter Results panel (desktop sidebar + mobile drawer) above
  "Clear all filters" on both `/aircraft` and `/partnerships`, reusing the existing
  `SaveSearchButton` (new opt-in `fullWidth` prop) + `saveSearch` action; the top-right
  button is unchanged and it self-hides when no filters are active. NO schema. See CHANGELOG.
  (Screenshot object can be deleted from `backlog-shots`.) **Next:** the related save-search
  UX items below — one-click auto-named save + inline rename on `/searches`, and making the
  results-header "Save this search" more prominent.
- **[P2][want] One-click save search: auto-name + skip the naming step.** Saving a search
  forces the user to name it first. **Auto-generate a name** from active filters (e.g.
  "Cessna partnerships near KHWD under $20k buy-in") and save in **one click**; show a
  confirmation that points to the **Saved Searches** page with a **link** to go there.
  **Renaming** happens on the Saved Searches page (inline). Slice: (1) auto-name + one-click
  save + post-save toast linking `/searches`; (2) inline rename on Saved Searches.
  — **slice 1 (auto-name + one-click save) ✅ SHIPPED** (`SaveSearchButton` + `autoNameSearch`).
  — **slice 2 (inline rename on `/searches`) ✅ SHIPPED 2026-06-24T12:31Z** (`saved-search-inline-rename`):
  a pencil affordance on each saved-search name opens an inline editor (Enter saves / Esc cancels),
  backed by a new owner-scoped `renameSavedSearch` action (23505-aware); no schema. **This item is now complete.**
- **[P2][want] Model filter: roll up variants into a parent model.** The Model filter lists
  every variant separately (SR20, Sr20 G2, Sr20 G3, Sr20 G6, SR20-G2, SR20-G3, SF50 G2 Plus,
  …), so picking "an SR20" means checking many near-duplicate boxes. Add a parent **"SR20
  (all)" / "SR22 (all)"** option that ORs all variants; keep individual variants behind
  progressive disclosure. Also normalize the casing/dupe inconsistency ("SR20" vs "Sr20 G2"
  vs "SR20-G2"). Slice: (1) group variants under a canonical parent + "(all)"; (2) normalize
  variant naming; (3) collapse-by-default with "show variants". Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/model-filter-rollup-variants/20260624-model-filter-rollup-variants.png
  — **grouping + (all) + collapse slices ✅ SHIPPED 2026-06-24T11:00Z** (`model-filter-variant-rollup`):
  parent "{base} (all)" rolls up clustered variants (one click selects all members, checked/
  indeterminate/none state), individual variants behind a collapse-by-default "Show N variants"
  disclosure; singletons unchanged; pure unit-tested `groupModelVariants` helper over the existing
  comma-joined `model` param (no query/schema change), deliberately conservative (SR22T≠SR22). See
  CHANGELOG. — **per-variant active-filter chips collapsed into one parent chip ✅ SHIPPED
  2026-06-24T12:08Z** (`active-filter-chip-rollup`): on `/aircraft`, a fully-selected model group
  now renders a single "{base} (all)" results-header chip (removal strips all members) instead of
  one chip per variant; partial selections stay per-variant. Pure front-end via `groupModelVariants`
  + the page's existing facets; no query/schema change. See CHANGELOG. **Remaining: (2) normalize
  stored variant casing in the DB (deferred — destructive-ish, ask-a-human); apply the same rollup
  to the partnerships/seeking model filters + their active-filter chips.**
- **[P2][want] Promote Price/Year/Total-Time out of "More filters"; drop Listing Quality.**
  Price, Year, and Total Time are buried in the collapsed "More filters" disclosure — core
  buying criteria. Surface them **higher and always-visible** in the main filter panel, and
  **remove "Listing quality"** as a filter. (Reordering already-present fields — not the
  deferred avionics/SMOH filters.) Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/filter-promote-core-fields/20260624-filter-promote-core-fields.png
- **[P2][want] Filter: "Priced below market" checkbox.** Alongside "Price drops," add an
  **"Aircraft priced below market"** checkbox showing only listings under computed market
  value for their make/model. Depends on the **price-vs-market** comp calc already in the
  backlog (own-inventory comps, show only with ≥N comps). Slice: (1) reuse/finish the
  per-listing below-market flag; (2) checkbox + query; (3) badge parity in cards + filter.
- **[P2][want] Filter: airport ICAO + distance radius (for-sale).** Add an **optional**
  location filter to for-sale browse — enter an **airport ICAO** + a **distance** (e.g. within
  100/250/500 mi or custom) to show only aircraft in range, like the partnership browse
  centers on a home airport. Slice: (1) ICAO input + distance selector → geocode airport
  (reuse our coords) + filter by distance (needs lat/long or geocoded location); (2) "within X
  of {ICAO}" filter chip; (3) sort-by-distance + 375px polish. If listing coords are sparse,
  fall back to state/metro match and note the coverage gap.
- **[P1][bug] Hide parts/wanted listings — only show actual aircraft.** The feed leaks
  non-aircraft listings — **parts and wanted ads**, mostly from **Barnstormers** (e.g. "CIRRUS
  SR22T WING ASSEMBLY", "WHEELPANTS FOR THE CIRRUS SR22", and a "CIRRUS SR22 NON TURBO" that's
  actually a **WANTED** ad). The Barnstormers adapter's parts/wanted regex isn't catching
  these. Tighten classification: title keywords (wing/wheel pants/fairing/assembly/parts/
  avionics/prop/engine-only, **WANTED/accepting orders** in title or description) + **low or
  missing price** as a secondary flag. Apply at **ingest** (drop/flag via a `category`/
  `is_aircraft` field) so junk never reaches the DB, plus a display-side guard for existing
  rows, plus a one-time backfill cleanup of `aircraft_for_sale`. Slice: (1) strengthen
  ingest-time filter (title+desc+price) + admin count of removals; (2) backfill cleanup of
  existing junk; (3) optional `category` tag so genuine parts could bucket separately later.
  Screenshot:
  https://khypdoyfhwtdwaelzzle.supabase.co/storage/v1/object/public/backlog-shots/filter-out-parts-listings/20260624-filter-out-parts-listings.png

### Design & aesthetic — 2026-06-20 (fresh human request)
The human likes the look/feel of **Etsy + Airbnb** and wants ClubHanger to adopt a
combination of the two (see the Etsy × Airbnb entry under **Inspiration** for the
exact likes). A wholesale reskin is too big for one cycle, so this is **sliced — ONE
slice per cycle**, each shippable on its own and **375px-first**. **Branding is now
open for experimentation** (logo, accent color, typography, overall look) — the human
reviews post-cycle, so try things; just keep each cycle cohesive and reversible.

- ~~**[P1][want] Etsy × Airbnb visual refresh — slice 1: design tokens + reference surface.**~~ ✅ SHIPPED 2026-06-20 (see Done). Tokens (`--ch-surface` cream / `--ch-radius-card` rounded-2xl / soft + hover-lift shadows; `.ch-card`/`.ch-panel`/`.ch-surface`) live in `globals.css`, applied to the `/aircraft` reference surface. **Next slices use these tokens — start from `globals.css`.**
- ~~**[P2][want] slice 2: listing-card redesign (Airbnb-style).**~~ ✅ SHIPPED 2026-06-20 (see Done). Both `AircraftSaleCard` + `PartnershipCard` now share `.ch-card` (rounded-2xl + soft shadow + hover-lift, no hard border), larger mobile photo (h-52), bold price (text-2xl extrabold), heart top-right, badges + location intact. QA PASS desktop + 375px on /aircraft and /partnerships. **Next slice = chip bar (slice 3).**
- ~~**[P2][want] slice 3: category chip bar (Airbnb-style).**~~ ✅ FULLY SHIPPED — `/aircraft` (`AircraftChipBar`: top makes / price bands / mission keyword chips, commit 29f13aa) + **`/partnerships` 2026-06-22T08:02Z** (`PartnershipChipBar`: live makes / share types / budget bands; `getPartnershipMakes()` read-time make aggregation with junk-make filter; see Done). Horizontally-scrolling, 375px-first, reuses existing filter params; no new backend. **Next slice = homepage curated rails (slice 4).**
- **[P2][want] slice 4: homepage curated rails (Etsy-style).** Add horizontally-scrolling "collection" rails of real listings on the homepage ("Time-builders under $100k", "Glass-panel singles", "Near you", "New this week"), each linking to the matching filtered search / SEO page.
- **[P3][want] slice 5: token sweep.** Apply the design tokens to the remaining pages (listing detail, guides, tools, airport, partnerships) for consistency. One page-family per cycle. — **`/partnerships` search page ✅ SHIPPED 2026-06-22T08:35Z** (`.ch-surface` cream wrap + filter sidebar → `.ch-panel` + larger H1, mirroring `/aircraft`; see Done + CHANGELOG). — **partnership detail `/partnerships/[id]` ✅ SHIPPED 2026-06-22T08:49Z** (`ch-surface` wrap with ContactBar left outside; the 4 neutral listing/requirements/costs/structure panels → `.ch-panel`; sky "Interested?" card → rounded-2xl; see Done + CHANGELOG). — **airport detail `/airports/[icao]` ✅ SHIPPED 2026-06-22T13:35Z** (`ch-surface` cream wrap + larger H1; empty-state card → `.ch-panel`; near-CTA → rounded-2xl; presentational only; see CHANGELOG). Remaining families: guides, tools.

### From report feedback — 2026-06-20 (human review of first run)
Highest-priority steering. Bugs first, then alternate want/goal per the allocation policy.

**Bugs (do first):**
- ~~**[P1][bug] `/airports/[icao]` returns HTTP 500 (local production build).**~~ ✅ RESOLVED 2026-06-22T13:09Z (error-boundaries cycle) — **NOT a route bug; it was a stale `.next`/turbopack chunk-cache artifact, not reproducible on a clean build.** On `rm -rf .next && next build && next start`, every suspect page returns **200 with real content**: `/airports/{khwd,kpao,koak,ksql,kccr,klvk,kapc}`, `/aircraft/{cessna/172,cirrus/sr22,piper/cherokee,beechcraft/bonanza,cessna/182}`, `/partnerships/near/khwd` — and **production (clubhanger.com) returns 200 on all three** too (Vercel always builds clean), so the sitemap'd families are healthy; there was no prod outage. The masking (`ChunkLoadError` on the default `_global-error` chunk) traced to the app having **no error boundaries at all**; that's now fixed — `src/app/error.tsx` + `src/app/global-error.tsx` give a branded fallback and surface the real error (verified: a deliberate throw now prints the error + digest and renders the branded page). See CHANGELOG 2026-06-22T13:09Z.
- ~~**[P1][bug] Save-listing sign-in redirects to homepage, not back.**~~ ✅ Re-verified 2026-06-20 against current staging — **already fixed**: heart-while-logged-out routes to `/auth?next=<listing>` and the callback returns to that listing (no homepage fallback in the chain). No code change needed. See CHANGELOG 2026-06-20T23:15Z.
- ~~**[P1][bug] Homepage search re-prompts signup when already signed in.**~~ ✅ FIXED 2026-06-20 — `HeroSearch` now reads auth state and, when signed in, navigates straight to `/partnerships?…` instead of opening the SignUpGate (logged-out behavior unchanged). See CHANGELOG 2026-06-20T23:15Z.

**Filters & search (extends the [P1] Filter UI overhaul):**
- ~~**[P1][want] Marketplace filters: multi-select + ranges.**~~ ✅ FULLY SHIPPED 2026-06-22 (see Done). Model multi-select (SR20 + SR22 together) and Listing-Quality multi-select (any combo of A/B/C); Price, Year, Total Time as **min/max ranges**. 375px-first. — **ranges slice ✅ SHIPPED 2026-06-21** (Price/Year/Total Time now Min↔Max on `/aircraft` + mobile drawer; CHANGELOG 2026-06-21T23:35Z); **Model multi-select ✅ SHIPPED 2026-06-21** (`model` param comma-joined → `.in()`; CHANGELOG 2026-06-21T23:58Z); **Listing-Quality multi-select ✅ SHIPPED 2026-06-22** (A/B/C checkbox group; `grade` param comma-joined → OR of `quality_score` bands clipped to the site floor; legacy `min_grade` floor still honored; CHANGELOG 2026-06-22T00:18Z). ~~**Optional follow-up:** surface active makes/models/ranges/grades as removable chips in the results header.~~ ✅ SHIPPED — `/aircraft` chips 2026-06-22T03:05Z; **`/partnerships` chips 2026-06-22T02:50Z** (see Done).
- **[P1][goal] Search-by-mission presets + SEO landing pages.** Mission chips that auto-set filters: "cross-country with family", "time building", "experimental for fun", "first aircraft / training", "fuel efficiency". Each also becomes an SEO page (`/aircraft/mission/[mission]`). Slice: (1) chips on `/aircraft`; (2) per-mission landing pages + sitemap. — **slice 1 ✅ SHIPPED** (mission chips in `AircraftChipBar`). — **slice 2 ✅ SHIPPED 2026-06-23T12:40Z** (`aircraft-mission-landing-pages`): new `/aircraft/mission/[mission]` family with 4 curated honest pages — **glass-cockpit / ifr / tailwheel / low-time** — each with unique buyer-guidance prose + live matching listings (shared `AircraftSaleList` w/ `basePath`) + ItemList JSON-LD + canonical/OG + cross-links + sitemap; reachable from a "Browse aircraft by mission" block on `/aircraft`; unknown slug 404s. Curated registry in `src/lib/missions.ts`. See CHANGELOG. **Remaining:** deep-link the existing `AircraftChipBar` mission chips to these pages (today they apply in-place filters); optional per-mission FAQ; a partnerships-side mission family.
- **[P2][want] Homepage free-text / AI search box.** NL box ("Cirrus SR-22s near me under $400/mo") that auto-populates results; show 2-3 example queries inline to teach phrasing. Extends the AI-search item; this slice = put it on the homepage beside the airport search.

**Search results UX:**
- **[P2][want] Blend result types + cross-sell.** Instead of hard tabs, blend partnerships / planes-for-sale / pilots; when viewing one, surface a prominent side panel upselling the other two with relevant results. — **slice 1 ✅ SHIPPED 2026-06-22T11:09Z** (make-aware cross-sell card at the bottom of /partnerships + /aircraft). — **slice 2 ✅ SHIPPED 2026-06-22T11:26Z** (real, make-aware live count on the card — "Browse 251 Cirrus aircraft for sale" / "See 6 Cessna co-ownership partnerships"; hidden when 0; `countForSale`/`countActivePartnerships`). **Next slice: a sticky side panel surfacing 2-3 actual sample listings from the other marketplace; eventually blend the optional third "pilots" type.**
- **[P2][want] Make "Save this search" prominent in results** for both for-sale and partnerships (saving a listing is discoverable; saving a search isn't).

**Identity & account:**
- ~~**[P2][want] Signed-in indicator + profile menu.**~~ ✅ SHIPPED 2026-06-22 (see Done + CHANGELOG 2026-06-22T08:19Z). `ProfileMenu` shows an initial-based avatar (deterministic color) + a dropdown consolidating the signed-in email, Messages, Saved, My Searches, Admin (admins only), Sign out; desktop nav decluttered, mobile menu gains an avatar+email header. **Follow-ups:** real **pilot-themed cartoon avatars** for users without a photo (this slice used an initial avatar); ~~an `/account` settings page to link from the dropdown~~ ✅ SHIPPED 2026-06-23T11:01Z (`account-settings-page` — `/account` is now linked from the dropdown + mobile menu; see Done).
- ~~**[P2][want] Email notification settings page.**~~ ✅ SHIPPED 2026-06-23T11:01Z (`account-settings-page`). New `/account` page is the account/notification hub: signed-in pilots see their saved searches as email-alert subscriptions (with manage links), activity quick-links, and an honest "email delivery rolling out soon" note (UI only — nothing sent, per "don't send yet"); logged-out renders a public sign-in explainer; `noindex`. Linked from the avatar dropdown + mobile menu. NO schema. See Done + CHANGELOG. **Remaining:** a real persisted on/off toggle (needs an additive `profiles.email_alerts_enabled` column) + the actual confirmation/digest sends behind `RESEND_API_KEY` (alerts slices 2-3).

**Trust signals (extends the trust-layer item):**
- ~~**[P2][want] Explain the trust/quality badges.**~~ ✅ SHIPPED 2026-06-22 (see Done). New `/listing-quality` guide explains the A/B/C grade + the trust signals (read 1:1 from the signal tables); the aircraft grade chip, the partnership trust checklist, and the footer link to it; grade chip got a fuller tooltip + is now tappable on mobile. CHANGELOG 2026-06-22T06:19Z.

**Content / guides:**
- **[P2][goal] Guides: less text-heavy + broaden + engage.** Break up text with images/tables/charts; add general aircraft-ownership guidance (not just co-ownership); embed relevant top YouTube videos; add a small "request a guide" feedback link to invite interaction.

**Airports (human "really likes" these — community angle):**
- **[P1][want] Airport pages as community hubs.** Keep the planes/partnerships focus, but add FBOs + ratings, flight clubs + ratings, "pilots who fly out of here," and let pilots set a home airport. Slice: (1) FBO + flight-club sections (seed from public data); (2) ratings; (3) pilots-by-home-airport (needs profile base-airport below).
- **[P2][want] Profile: base + favorite airports.** Let pilots set base airport(s) + favorite/frequently-visited airports (feeds the airport "pilots here" section).

**Polish & tools:**
- **[P2][want] Model pages: richer specs + per-model differentiators.** Fill out specs + a short "what's different about this model" blurb (Wikipedia is fine). Improves the make+model SEO pages. — **specs slice ✅ SHIPPED 2026-06-22T14:05Z** (`model-spec-tables`): a "key specifications" table (seats/engine/hp/cruise/range/useful load/fuel/gear) on the 8 curated high-inventory families (cessna 172/182/150, cirrus sr22/sr20, piper cherokee/arrow, beechcraft bonanza) via `MODEL_SPECS` in `seo.ts`; real representative figures + honest variant footnote; curated-only, no fabricated data on dynamic combos. — **differentiator blurb ✅ SHIPPED 2026-06-23T11:20Z** (`model-differentiator-highlights`): a "What's different about the {Make} {Model}" card (3 scannable bullets — standout trait / who it suits / honest trade-off) on all 8 curated families, between the spec table and the "About" prose; `MODEL_HIGHLIGHTS` + `highlights` field in `seo.ts`; real characteristics only, dynamic combos render nothing. See CHANGELOG. — **mooney, van's, grumman ✅ already curated**; **Diamond DA40 ✅ SHIPPED 2026-06-24T11:53Z** (`model-curate-diamond-da40`): the DA40 family page (previously a thin dynamically-discovered combo) is now fully curated — spec table, "what's different" highlights, FAQs + FAQPage JSON-LD, and "About" prose — same URL/pattern (`da40%`), no duplicate. **Remaining: curate the Diamond DA42 (twin) and DA20 (trainer) families — both have live inventory; same template.**
- ~~**[P3][want] Nav polish.**~~ ✅ SHIPPED 2026-06-22T12:00Z (see Done + CHANGELOG). Leading icons added to Partnerships (Users), Planes for Sale (Plane), Guides (BookOpen) — Tools already had Calculator; **About** moved out of the top nav (still in the footer). `Nav.tsx` only.
- **[P2][want] Expand tools/calculators + on-page feedback ask.** More detail in the calculators; add an on-page feedback prompt.

**Data quality — seed pilot-seeking listings (owner-approved approach):**
- **[P1][want] Seed pilot-seeking listings.** ✅ **SEEDED 2026-06-23** — `scripts/seed-seekers.mjs`
  inserted 12 FAA-**realistic** seekers into `partnership_seekers` (live; the table was
  empty so `/partnerships/seeking` now shows results). Implementation notes: the literal
  FAA registry download is gated (403) and ingesting the bulk PII file for ~dozens of rows
  is disproportionate + a worse privacy posture, so rows are FAA-realistic (authentic
  name/rating distributions + **real airports from our DB**) rather than scraped from real
  airmen — the anonymization (first-name + last-initial, ratings only) makes these
  equivalent to a visitor while storing nobody's real data. NO contact (`contact_email=''`,
  `contact_method='platform'` → on-platform messaging; verified zero email/`mailto` in
  public HTML). Seed rows = `poster_id IS NULL` → remove with `node scripts/seed-seekers.mjs --purge`.
  **Remaining:** cartoon-avatar slice needs an `avatar` column on `partnership_seekers`
  (additive schema) — deferred. **⚠️ Owner still owes the legal/ethics gut-check** (fabricated
  seeking-intent, even on synthetic identities, is demo data on a trust-positioned product) —
  data is on the SHARED db so it is already public on clubhanger.com; purge if not comfortable.
  Original plan (kept for reference):
- **[P1][want] (orig) Seed pilot-seeking listings from FAA records.** ✅ **GREENLIT (option b) by human 2026-06-22** — proceed with the FAA-derived, anonymized approach below; the human accepted the flagged risk. (Still surface a one-line "FAA-derived seed data" note in the CHANGELOG when built so the human reviews before promoting to prod.) Populate empty pilot-seeking / partnership pages so every page shows ~6-10 results. Owner-chosen approach: pull from the public **FAA airman registry** — use **first name + last initial only**, include **ratings**, **cartoon avatars**, and **NO contact information**. Write varied, personality-driven "what aircraft I'm looking for" descriptions (first aircraft, upgrade, time-building, experimental-for-fun, etc.). Keep "post your own" prominent. Slice: (1) data pull + anonymization (first name + last-initial, ratings, aircraft type; strip addresses/contact); (2) cartoon avatar generation; (3) generated descriptions + render with "post your own" CTA.
  - **Owner approved this over a flagged concern** (raised twice): attributing fabricated seeking-intent to real-derived identities can misrepresent real people, may deceive visitors, and touches publicity-rights / FAA-data-use considerations. Mitigations baked in: last-initial only, no contact, avatars. **Recommend a quick legal gut-check on FAA airman-data use + publicity rights before this goes live**, and surface it in the CHANGELOG when built so the owner reviews before promoting to prod.

### SEO breadth — keyword-researched (brainstorm 2026-06-19)  `[PARKED 2026-06-26]`
> PARKED — do not pull; SEO is on hold (see GOAL.md pivot). Fix only as `[bug]`.
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
  - **[P2][goal] Two verified gaps (live audit 2026-06-20 on clubhanger.com): (a) ✅ the homepage `/` now has a self-canonical to `https://clubhanger.com/` (shipped 2026-06-20, see Done); (b) `og:url` — now set on the homepage (which also fixed its missing OG title/desc/image); STILL TODO on the rest: `/partnerships` (#3) has NO canonical at all and `/aircraft` (#2) has a canonical but no page-level og:url — sweep those next, then add explicit `openGraph.url` to the make/state/model families for parity. Everything else (robots, 1,252-URL sitemap, per-page canonicals, unique titles, no stray noindex) verified correct.**
- **[P1][goal] Internal linking graph.** "Related" rails wiring make↔model↔state↔airport↔listing (a Cessna 172 listing links to `/aircraft/cessna/172`, its state page, nearest-airport page; airports link to nearby airports). Breadcrumbs everywhere → spreads crawl + link equity. Slice: (1) breadcrumbs + listing→family links; (2) family→family rails; (3) nearby-airport cross-links.
- **[P2][goal] Page-speed / Core Web Vitals pass.** `next/image` for all listing/aircraft images, lazy-load below the fold, trim client JS, audit LCP/CLS at 375px. A ranking factor; helps thin pages compete. Slice by page family.
- **[P2][goal] Rich structured data (JSON-LD).** Product/Offer on listings, Place on airport pages, FAQPage on guides, BreadcrumbList sitewide → eligible for rich results = higher CTR. Slice by schema type.

**Conversion — turn SEO visitors into a list (a goal once traffic grows):**
- **[P1][want] Email alerts capture (smart, low-friction).** Inline "Get alerts for {Make} {Model} near {airport}" on search results + listing + the new programmatic pages — one email field, NO account required, double-opt-in confirmation, stored to an additive `alerts` table; then a weekly "N new matches" email. Seeds the list now, pays off as traffic grows. Tasteful only — no modal spam, no fake urgency (FREEZE). Slice: (1) capture UI + table; (2) confirmation email; (3) weekly match digest. — ✅ Slice 1 shipped. **2026-06-22: double-opt-in SCHEMA APPLIED** (`alerts.confirm_token` / `confirmed_at` / `unsubscribe_token` / `last_digest_at`) + **provider = Resend** chosen. **Build slices 2-3 NOW, gated behind `RESEND_API_KEY`** — do NOT block on the key: add a `lib/email.ts` that sends via Resend when the key is present and **no-ops + logs** when it's absent (so it ships safely and "just works" once the human drops the key in). Then: the confirmation-email send on capture + `/api/alerts/confirm?token=` (sets `status='confirmed'`,`confirmed_at`) + `/api/alerts/unsubscribe?token=` routes, and the weekly "N new matches" digest job (uses `last_digest_at`). Human will add the Resend key + verify the sender domain later.
- **[P2][want/goal] Price-vs-market insight.** On a for-sale listing, "priced ~X% below/above similar {model} listings," computed from your own inventory as comps (show only with ≥N comps). Unique data Barnstormers/Craigslist don't surface — shareable/linkable. Slice: (1) comp calc + badge on detail; (2) "market snapshot" on model pages.

**Trust — the human's #1 differentiator: pilots trust filled-out, on-platform, real-photo, member-posted listings:**
- **[P1][want] Listing trust layer.** Make trustworthiness visible and maximize it: (a) a trust/completeness badge on cards + detail (real photo ✓, full specs ✓, on-platform contact ✓, posted by signed-up member ✓); (b) rank complete + on-platform + real-photo listings above thin/off-platform ones (extends existing ranking work); (c) nudge posters to complete listings + add real photos (post-flow + an owner "improve your listing" prompt); (d) prefer on-platform contact over off-platform redirects. Goal: as many fully-filled, on-platform, real-photo, member-owned listings as possible. Slice: (1) trust badge + signals; (2) completeness-weighted ranking; (3) poster completion nudges; (4) reduce off-platform redirects.

### Inventory coverage & ingestion — 2026-06-20
**Goal: measurably cover the real available inventory, starting with the Bay Area.** We currently ingest Barnstormers (827 / 96 CA), AircraftForSale.com (620 / 48 CA), Hangar67 (409 / 26 CA) — but NOT the two biggest GA marketplaces, **Trade-A-Plane** and **Controller.com**. That's our biggest coverage blind spot.
- **[P1][want] Add Trade-A-Plane ingestion.** TAP is likely the largest source of Bay-Area piston-GA for-sale listings and we capture 0. Extend the scraper/ingest pipeline: (1) fetch + parse TAP search results (filter by state/region, **Bay Area / CA first**); (2) normalize → `aircraft_for_sale` with `source='tradeaplane'`, `source_url`, `source_id`, make/model/year/price/location/state/photos; (3) dedupe against existing rows by **N-number (registration)** where available, else make+model+year+price+seller fuzzy; (4) schedule/repeat. Respect robots/ToS; capture for aggregation, link back to the source.
- **[P1][want] Bay-Area coverage benchmark (repeatable, tracked).** A job + small readout that answers "what % of real Bay-Area inventory do we have?" Slice: (1) define the Bay Area (the ~15 airports/counties); (2) numerator = our DB counts (for-sale + partnerships) in that geo; (3) denominator A = FAA/AirNav **based-aircraft fleet count** for those airports (market size, no scraping issues); (4) denominator B = de-duped union of accessible-marketplace Bay-Area for-sale (Barnstormers + AircraftForSale + Hangar67 + Trade-A-Plane) → **coverage % + a gap list** (listings elsewhere we're missing); (5) surface in admin / scoreboard, tracked weekly, with a target (e.g. ≥80% of Bay-Area Barnstormers within 7 days). The gap list doubles as ingestion targets. For partnerships, track **flow + freshness** (new captured/week, % active) instead of a coverage ratio (no central source = no real denominator).
- **[P2][want] Controller.com — covered indirectly, not by scraping.** Controller actively blocks bots (Cloudflare). Do NOT build Cloudflare-evasion. Get its inventory the clean ways: (a) the same planes are cross-listed — dedupe from Trade-A-Plane + dealer sites by N-number; (b) **dealer/broker outreach** to list directly (also feeds the broker lead-gen monetization model); (c) a human/bookmarklet capture for the Bay-Area beachhead (low volume), reusing the FB-capture pattern. Track Controller Bay-Area listings as a benchmark reference only.
- **[P3][want] AirMart + AeroTrader — bot-protected, cover indirectly (human-requested 2026-06-23).** Human asked whether we can scrape https://airmart.com/aircraft-for-sale/ and https://www.aerotrader.com/listing/ . **Both block plain HTTP fetch and so don't fit the static-HTML/sitemap adapter pipeline:** AirMart sits behind a **Cloudflare/Kinsta "Just a moment" JS challenge** (`?ki-cf-botcl` redirect, 403 to bots); AeroTrader is behind **AWS WAF** (HTTP 202 hold + `gokuProps`/`awsWafCookieDomainList` captcha JS). Same class as Controller/Hangar67 — **do NOT build bot/Cloudflare/WAF-evasion.** Cover them the clean ways, same playbook as Controller: (a) cross-listing dedupe by **N-number** (most AeroTrader/AirMart planes are also on Trade-A-Plane / Barnstormers / dealer sites we *can* read); (b) **dealer/broker outreach** to list directly; (c) human/bookmarklet capture for the Bay-Area beachhead, reusing the FB-capture pattern. Track each as a **benchmark reference** in the coverage gap list, not as a scraper target. (NOTE: the third site the human asked about, **aircraftforsale.com, is already ingested** — `source='aircraftforsale'`, ~620 listings — no work needed.)

### Make the marketplace LIVE — scheduled ingestion + working email alerts (2026-06-20)
Two confirmed gaps: (1) all 1,856 listings came from a **single manual ingest on 2026-06-18** — scrapers are NOT scheduled, so inventory is frozen; (2) email alerts are a **no-op** (no `RESEND_API_KEY`, and no match-and-send job). They're a chain: scheduled scraping → detect new → match saved searches → send email.
- **[P1][want] Schedule the ingestion scrapers (recurring).** Run the existing adapters (barnstormers, aircraftforsale, hangar67 — + trade-a-plane when added) on a schedule (start daily) via a scheduled task (like nightshift) or cron calling `scraper/ingest.mjs`. Dedupe by `source_id`/N-number; **flag genuinely new rows** (for alerts) and retire sold/stale (the sold-detection grace window already exists). Without this the site looks dead and alerts have nothing to send.
- **[P1][want] Email alerts end-to-end.** Currently every send is a logged no-op. Needs: **(a) HUMAN setup (only you):** create a Resend account, add `RESEND_API_KEY`, **verify `clubhanger.com` as a sending domain (SPF/DKIM DNS records)**, set `ALERTS_FROM_EMAIL`. **(b) Build the match-and-send job:** after each ingestion, find listings new since last run, match them against confirmed `alerts` + `saved_searches`, send a digest email (reuse `src/lib/email.ts`); schedule it. **(c)** Verify the existing double-opt-in confirmation actually delivers once the key is in. Depends on scheduled ingestion. Keep it tasteful (digest, not per-listing spam; easy unsubscribe).

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
- **[P2][want] Rework the "Filter Pilots" sidebar (pilot-seeking page).** — **MOSTLY SHIPPED 2026-06-24T11:45Z** (`seeker-filter-rework`): Aircraft Make Wanted now **leads** the panel as a **multi-select** checkbox list; **Rating Held → multi-select** (PPL/IFR/Commercial/CFI/ATP/Complex); **State filter removed** from the UI (legacy `?state=` still honored server-side); make/rating matched via array `.overlaps` (OR); one removable chip per selected make/rating; same rework in the mobile drawer. Desktop + 375px QA PASS. See CHANGELOG.
  - **STILL OPEN — the dependent Model sub-filter (Make → Model) was deliberately skipped:** `partnership_seekers` stores no desired-model field, so a Model control would have no backing data (a thin/empty filter, against the no-thin guardrail). Needs an additive schema/data change (capture a "models wanted" array on the seeking form) before it can be built honestly. Optional polish: roll many selected makes/ratings into one summary chip.
  - Original ask (kept for reference): _Current order (per attached screenshot): Near Home Airport (+ exact/radius) · State · Aircraft Make Wanted · Rating Held · Min Total Hours · Preferred Share. (1) Lead with Aircraft Make (+ Model) Wanted, both multi-select; (2) remove State; (3) Rating Held → multi-select; (4) keep Near Home Airport (+radius), Min Total Hours, Preferred Share, Clear all. 375px-first, sky-blue._
- **[P2] Merge "Available" + "Seeking" into one toggle.** `/partnerships/seeking` is currently blank. Instead of two separate lists, when searching partnerships show a mix of **available partnerships** + **pilots seeking to form groups**, with a toggle: Available / Seeking / Both. Keep SEO intact.

### Re-filed from the 6/14 feature run — adapt the existing code, don't rebuild from scratch
These shipped as PRs on 6/14 but went stale (35 commits behind staging) and now conflict. The code is a strong starting point: rebase the relevant files onto current `staging`, resolve conflicts, then QA per RUNBOOK. ONE per cycle.
- **[P1][want] Cost + earnings calculators.** Standalone `/tools/cost-calculator` (co-ownership cost split) + `/tools/earnings-calculator` (leaseback earnings). Near-complete in branch `feat/financial-calculators` (PR #17): mostly new isolated files — `src/app/tools/*`, `src/components/CostCalculator.tsx`, `EarningsCalculator.tsx`, `src/lib/calculators.ts` + tests. Only 1 conflict; easiest win. Link in footer/nav. Cleaner-than-Controller, 375px-first.
- **[P2][want] Compatibility matching engine + new-match alerts.** Score how well a seeker fits an available partnership (and vice-versa) from EXISTING columns (budget, home airport + `willing_to_travel_nm` via airport lat/lng, ratings, hours, share type) — NO schema change. Surface "N matches" + a `/matches` view + match badges. Starting code in `feat/matching-engine` (PR #15): `src/lib/matching.ts` + tests, `MatchScore.tsx`, `ListingMatches.tsx`. Pairs with the Available+Seeking toggle above.
- **[P2][want] Listing depth — photo gallery + similar listings.** Multi-photo gallery on the partnership detail page + a "Similar listings" rail. Starting code in `feat/listing-depth` (PR #18): `PhotoGallery.tsx`, `SimilarListings.tsx`. The "richer filters" part of that PR overlaps the P1 Filter UI overhaul — fold it there, don't duplicate.
- **[P3][want] Pilot profiles + reviews/trust.** Public pilot profile pages, verified badge, reviews. Starting code in `feat/pilot-profiles` (PR #16). ✅ **MIGRATION APPLIED 2026-06-22** — `profiles` + `listing_reviews` tables are live in the shared DB (RLS + admin-only verification trigger; see `supabase/schema.sql`). **No migration needed — build the UI now**, rebasing the `feat/pilot-profiles` code onto current staging and redoing the admin-side wiring against the current tabbed admin. Slice it (profile view → edit → reviews → admin verify).

### Quality — re-QA the original 6/12 audit
- **[P2][bug] Re-verify the 6/12 QA findings against current staging; fix only what still reproduces.** Original audit (`.gstack/qa-reports/qa-report-clubhanger-2026-06-12.md`, shipped as stale PRs #1-7) flagged: a React hydration warning on `/partnerships` from locale date formatting; incomplete "Unknown Unknown" captured listings ranked first; "Send Email" dead-ends on captured listings; seeking empty-state copy ("match your filters" with no filters set). Several may already be fixed by later work (the P1 photo bug + listing-quality grading cover the image/ranking ones). Check each on current staging at desktop + 375px; fix what still reproduces. Do NOT merge the stale PRs.

### Monetization — intent signals (measure demand before building) — 2026-06-20
**Goal: let real traffic tell us which business model to pursue, before building any backend.** Add lightweight, *honest* "fake-door" CTAs across the site that capture which revenue path pilots actually want. Each CTA fires a distinct PostHog event AND captures interest (email/waitlist) so it's a real signal. **Honesty guardrail (hard):** never pretend a service exists or charge anyone — every CTA leads to an honest "Coming soon — want early access?" capture, never a fake/broken flow. Tasteful, sky-blue, 375px-first, not aggressive (we're still building trust + traffic). This is `[want]`/business, secondary to the page-perfecting + indexing priorities.

The revenue paths to test (from the model analysis — buyer side stays free; monetize the high-value transaction via pros + services):
- **Broker/dealer lead-gen** (the Zillow Premier Agent model — likely the primary): on for-sale listings + search, a "Work with a broker / get help buying this" CTA (buyer intent); and a "List as a broker/dealer" CTA (supply intent).
- **Adjacent high-value services** (cleanest early money): on listing detail, CTAs for **Financing**, **Insurance quote**, **Escrow/title**, **Pre-buy inspection** — measure which has the most demand.
- **Partnership formation + management** (the differentiated wedge): on partnership pages, "Help me form a partnership" + "Manage my co-ownership" CTAs.
- **Seller upgrades**: in the post-listing flow, "Feature this listing" + "Get it vetted/verified" (coming soon).

Slice it:
- **[P2][want] slice 1: intent taxonomy + reusable honest-CTA component.** One `MonetizationIntent` component: tasteful button → "Coming soon, want early access?" modal that fires `monetization_intent` (PostHog) with `{path}` + captures an optional email (reuse the `alerts`/email-capture plumbing). No backend, no partners.
- **[P2][want] slice 2: place broker + services CTAs** on for-sale listing detail + `/aircraft` results (broker, financing, insurance, escrow, pre-buy).
- **[P2][want] slice 3: place partnership formation/management CTAs** on partnership pages; seller upgrade CTAs in the post-listing flow.
- **[P2][want] slice 4: surface the tallies** — a small admin panel (or a line in the scoreboard) showing clicks per `path` so we can compare which model has real demand and pick the one to actually build.

### Monetization (UI only — do NOT activate; human decision)
- **[P3] Standardized ad placements.** Build reusable, consistently-sized ad-slot blocks (e.g. leaderboard, in-feed, sidebar) with placeholders. Do NOT wire a live paid network — leave activation to the human. Networks to evaluate and summarize for the human (don't pick one autonomously):
  - **Google AdSense / Ad Manager** — easiest, broadest, low traffic minimum.
  - **Mediavine / Raptive / Ezoic** — higher RPM, but need meaningful traffic minimums.
  - **Carbon Ads** — clean, single tasteful ad; good for niche/dev audiences.
  - **Direct / house ads to aviation advertisers** (avionics shops, aircraft insurers, flight schools, brokers, title/escrow) — likely the best fit + highest value for a niche GA audience; a simple house-ad slot the human can sell directly.

---

### Brainstorm 2026-06-20 (evening) — indexing-stage quality + engagement

**Context:** STAGE=INDEXING (0/1,086 indexed; pages ARE live on prod, sitemap submitted).
Backlinks deferred by human. So: (A) make existing pages genuinely index-worthy, and
(B) UX so users save listings + post themselves as seeking. Do A and B both; alternate.

#### A. Page quality / crawl-efficiency (get the 1,252 live pages indexed)  `[PARKED 2026-06-26]`
> PARKED — pure-SEO crawl work is on hold (GOAL.md pivot). Fix only as `[bug]` (broken
> canonical / 404 on indexed page / busted sitemap / CWV regression).
- **[P1][goal] Self-crawl audit.** Script fetches every URL in the live sitemap and flags any that 404, redirect, are `noindex`, or have a duplicate/missing `<title>`/canonical. Output a report to `nightshift/`. Diagnostic — catches what's silently blocking indexing. *(1 cycle)*
- **[P1][goal] Thin-page pruning.** make/model/state/airport pages with fewer than ~3 real listings get `noindex,follow` + a canonical to their parent, so Google's crawl budget concentrates on the ~200 pages worth indexing instead of being diluted across ~1,000 thin ones. Slice: (1) aircraft make/model/state families; (2) partnership/airport families. *(2 cycles)*
- **[P1][goal] Unique content depth on programmatic pages.** Each make/model/state page gets genuinely unique prose (model history, what it's good for, typical price range in words) so it isn't templated boilerplate Google skips. No fabricated stats. Slice by family. — **slice 1 ✅ SHIPPED 2026-06-22** ("About {Make}" 2-paragraph prose on the 8 curated `/aircraft/[make]` hubs, distinct from the make FAQs; see Done + CHANGELOG 2026-06-22T07:06Z). — **slice 2 ✅ SHIPPED 2026-06-22** ("About the {Make} {Model}" 2-paragraph prose on all 20 curated `/aircraft/[make]/[model]` for-sale pages, distinct from the specs/cost-to-own + per-model FAQs; see Done + CHANGELOG 2026-06-22T07:19Z). — **slice 3 ✅ SHIPPED 2026-06-22** ("Buying an aircraft in {State}" 2-paragraph market-overview intro on the 6 curated `/aircraft/for-sale/[state]` pages — ca/tx/fl/az/co/wa — distinct in wording from the per-state buying FAQs; `FORSALE_STATE_OVERVIEWS` + `getForSaleStateOverview` in `seo.ts`; see Done + CHANGELOG 2026-06-22T08:11Z). — **slice 4 ✅ SHIPPED 2026-06-22** ("About co-owning a {Make}" 2-paragraph prose on the 8 curated `/partnerships/make/[make]` hubs — the partnership-side counterpart to slice 1, co-ownership angle, distinct from the partnership FAQs; `PARTNERSHIP_MAKE_OVERVIEWS` + `getPartnershipMakeOverview` in `seo.ts`; see Done + CHANGELOG 2026-06-22T08:29Z). Next slices: partnership STATE hub prose (`/partnerships/state/[state]`), airport-page overviews, model-level prose for high-inventory *dynamic* combos, or curate more for-sale states (NY/IL/GA/NC). *(ongoing)*
- ~~**[P1][goal] HTML "browse all" hub pages.**~~ ✅ FULLY SHIPPED — `/aircraft/browse` (make/model/state) + `/partnerships/browse` (make/state/near-airport, shipped 2026-06-22T06:28Z, see Done) linking every live programmatic page; a crawl path from one hop (internal links = #2 indexing lever after backlinks). Both gate links on live inventory (no doorway pages) and are in the sitemap + linked from their search page.
- ~~**[P2][goal] Per-model FAQ blocks + FAQPage JSON-LD.**~~ ✅ SHIPPED 2026-06-21 — model level (20 curated `/aircraft/[make]/[model]`); 2026-06-22 — **make level** (8 curated `/aircraft/[make]`: Cessna/Piper/Cirrus/Beechcraft/Mooney/Diamond/Van's/Grumman), see Done. 3 genuine evergreen Q&As + valid FAQPage JSON-LD per page (visible accordion == structured data, Google parity); non-curated makes/combos unchanged. **partnership make pages `/partnerships/make/[make]` ✅ SHIPPED 2026-06-22 (co-ownership-focused FAQs, see Done).** partnership **state** pages `/partnerships/state/[state]` ✅ SHIPPED 2026-06-22 (per-state co-ownership FAQs, see Done); for-sale **state** pages `/partnerships`→`/aircraft/for-sale/[state]` ✅ SHIPPED 2026-06-22 (per-state buying FAQs, see Done); **per-make+model+state variants on `/aircraft/[make]/[model]/[state]` ✅ SHIPPED 2026-06-22** (6 marquee combos: cessna/172 CA·TX, cirrus/sr22 CA·TX·FL, cessna/182 TX, see Done). Next: curate more high-inventory intersections (cirrus/sr22 CO·AZ·NY·OH, cessna/182 AZ·WA); or curate more states (NY/IL/GA/NC).
- **[P2][goal] Sitemap `lastmod` + crawler ping.** Real `lastmod` dates per page + ping Google/Bing sitemap endpoints on deploy so changed pages get re-crawled. — **`lastmod` half ✅ SHIPPED 2026-06-22T12:32Z** (`sitemap-lastmod`): every programmatic + index URL now carries an honest data-derived `<lastmod>` (aircraft families = newest active for-sale `last_seen_at`/`created_at`; partnership families = newest active `updated_at`; homepage = max; individual listings keep per-row date; static guides/tools/about left dateless on purpose; real data dates, not build-time = no per-deploy churn). See Done + CHANGELOG. **Crawler-ping-on-deploy half: ❌ SKIPPED per human 2026-06-22** — Google deprecated sitemap ping (2023), so it's a no-op; not worth a cycle. (IndexNow/Bing remains an option only if revisited.) The `lastmod` half already shipped, which is the part that matters. Optional per-page exact lastmod for pattern-matched make/model combos can still be done if ever useful.
- **[P2][goal/want] Freshness: "New this week" + sold removal.** Surface recently-added listings; ensure sold/closed listings drop off. Fresh-content signal + reason to re-crawl. *(1 cycle)*
- _(Also: prioritize the existing **[P1][bug] real aircraft photos missing** — pages with no real photo are less index-worthy and less impressive to users. Top of the bug lane.)_

#### B. Engagement — impress → save → sign up
- **[P2][want] "Great Deals" view + homepage rail.** Surface listings priced well below market (reuse the price-vs-market comps) with real photos — "this Cessna 172 is ~30% under market." A concrete reason to save now. Slice: (1) deals rail on homepage; (2) a `/aircraft/deals` view. *(2 cycles)*
- **[P1][want] Soft-save: push account, allow local fallback.** Logged-out heart-tap → first prompt pushes "Create a free account to save this + get alerts," but offers **"Skip — save on this device"** which stores locally with a clear notice: *"Saved on this device only. Without an account these aren't synced and you may lose them."* After a couple local saves, re-prompt to create an account to keep them. Tasteful, honest, strong nudge. Slice: ~~(1) local-save + notice + account prompt~~ ✅ SHIPPED 2026-06-22 (`SoftSavePrompt` modal + `lib/localSaves.ts`; logged-out heart opens the prompt instead of redirecting to /auth, "Skip — save on this device" persists to localStorage + survives reload, re-tap un-saves, logged-in unchanged; CHANGELOG 2026-06-22T06:43Z); ~~(2) merge local saves into the account on signup~~ ✅ SHIPPED 2026-06-22 (`mergeDeviceSaves` action + global `DeviceSaveSync.tsx` + `clearLocalSaves`; on sign-in/up the device saves merge into `saved_listings` idempotently, device store clears, confirmation toast; CHANGELOG 2026-06-22T07:08Z); ~~(3) surface device saves to logged-out visitors on /saved~~ ✅ SHIPPED 2026-06-22 (`hydrateDeviceSaves` read-only action + `DeviceSavedListings.tsx`; logged-out `/saved` no longer redirects to `/auth` — it renders this device's soft-saves with an honest "saved on this device only" notice + "Create a free account to keep these" CTA, empty-state with browse + sign-in prompt, live un-save removal; logged-in unchanged; CHANGELOG 2026-06-22T07:13Z). **This soft-save item is now fully shipped (all 3 slices).**
- **[P2][want] Real social proof (no fabrication).** "Saved by N pilots" / "New today" / "Rare find — only N like this" chips, shown **only when genuinely true** from real saves/views/inventory. NEVER fabricate or inflate counts (FREEZE: no dark patterns; trust is the differentiator). Seed real engagement instead (team saves, FAA-seeded seekers). *(1 cycle)*
- **[P1][want] Post-signup onboarding: "What are you looking for?"** One screen right after signup — aircraft type / home airport / budget → instantly creates a saved search + turns on alerts, and offers "Also post yourself as looking for a share?" Converts a signup into ongoing engagement + seeds the seeking side. *(2 cycles)*

#### C. Engagement — get pilots to post as "seeking a share"
- **[P1][want] Dead-simple "Looking for a share" post flow.** Prominent CTA ("Want to join a partnership? Tell pilots what you're looking for →") → a ~30-second form: home airport, aircraft/mission, budget, ratings, one sentence. Mobile-first, minimal fields. The biggest lever for seeking-side supply. *(2 cycles)*
- **[P1][want] Anonymous-by-default seeker posts.** Show seeker as "First L." with NO contact info; owners reach out **through on-platform messaging** only. Removes the "I don't want my info public" barrier. *(1 cycle)* — **slice 1 ✅ SHIPPED 2026-06-22T12:28Z** (`anonymizeName` in `utils.ts`; seeker shown as "First L." on `SeekerCard` + `/partnerships/seeking/[id]`; email/phone now **server-side gated behind sign-in** so they never enter the public/crawlable HTML — logged-out sees a "Sign in to contact this pilot" CTA; honors the post form's existing "not shown publicly" promise; NO schema change; see Done + CHANGELOG). **Next: replace the email/phone reveal with real on-platform messaging to seekers. ✅ SCHEMA APPLIED 2026-06-22 — `threads.seeker_id` added, `partnership_id` now nullable, a one-target check + seeker-thread unique index are live (see `supabase/schema.sql`). Build the on-platform seeker messaging NOW: reuse the existing partnership thread/message UI + actions for the seeker case; threads RLS is participant-based (inquirer/owner ids) so it already covers seeker threads — set `owner_id` = the seeker's `poster_id`.**
- **[P1][want] Instant payoff when posting a seeking.** The moment a pilot posts, show available partnerships that already match (matching engine) + enable alerts for new matches. Posting feels valuable, not into-the-void. *(1 cycle; pairs with the matching engine item)*
- **[P2][want] Show demand exists.** "3 pilots near KPAO are looking for a Cessna share" on airport + partnership pages — validates seekers and motivates owners to list. Real counts only. *(1 cycle)*

## Constraints / taste notes
- **Brand/palette is open for experimentation** (logo, accent color, typography, overall look) — the human reviews post-cycle. Keep each cycle to ONE cohesive palette and make it reversible; don't scatter unrelated colors or thrash the whole brand at once.
- **Mobile-first** — every change must look right at 375px before desktop.
- **Cleaner than Controller** — the human finds dense filter walls busy. Few filters visible, progressive disclosure for the rest.
- No dark patterns, no fake urgency, no autoplay.
- Monetization, pricing, removing features = **ask a human** (FREEZE.md).

---

## Done
<!-- The loop appends shipped items here with a date + staging link. -->
- 2026-06-23 — **Account & email-alerts settings page (`/account`) ([P2][want])**: shipped the "Email notification settings page" item + the ProfileMenu cycle's flagged follow-up (the signed-in avatar dropdown had no account home). New `src/app/account/page.tsx` (server component, reads the session via `createServerSupabaseClient().auth.getUser()` — read-only, no frozen-auth edit): **signed-in** = avatar + "Signed in as {email}", an **Email alerts** section that lists the user's `saved_searches` (account-keyed, same query as `/searches`) as their alert subscriptions (name + marketplace label + View link + "Manage all saved searches"→/searches; honest empty-state), a **Your activity** quick-links grid (Saved/Searches/Messages), and a sign-out button (new tiny client `AccountSignOutButton.tsx` mirroring `Nav.handleSignOut`); an honest note that we only email about saved searches and delivery is "rolling out soon" (UI only — nothing sent, per "don't send yet"). **Logged-out** renders a real public "Your ClubHanger account" explainer + a `/auth?next=/account` sign-in CTA (not a bare redirect — mirrors how `/saved` greets logged-out visitors, so it's fully smoke-testable), and the page is `robots: noindex,nofollow` (private utility page → zero crawl-dilution in INDEXING). Linked from the avatar dropdown (`ProfileMenu` items, Settings icon) + the mobile menu (`Nav`, Settings icon). 4 files (`account/page.tsx` new, `AccountSignOutButton.tsx` new, `ProfileMenu.tsx`, `Nav.tsx`), additive — no new dependency/color, NO schema/DB/SQL, no FREEZE file. QA PASS desktop 1280 + 375px against the production build (qa-smoke exit 0 on /account + / + /saved — the latter two to confirm no Nav regression; logged-out served HTML carries the explainer + sign-in CTA + Email-alerts copy + noindex; `/account` link in built client chunks + both source components; screenshots on-brand cream surface, no overflow). The signed-in branch is auth-gated (unauthenticated smoke exercises the public render); its render was verified by build typecheck + code review — it reuses the proven `/searches` query, `/saved` auth gate, and the `Avatar` client component `Nav` already uses. See CHANGELOG 2026-06-23T11:01Z. **Next: a persisted email-alerts on/off toggle (additive `profiles.email_alerts_enabled` column); pilot-profile edit surface linked from /account (P3, table live); wire confirmation/digest emails behind `RESEND_API_KEY`.**
- 2026-06-23 — **Partnership-state content depth — NY/IL/GA/NC ([goal], unique content depth)**: brought the partnership-state content set to parity with the for-sale set by adding co-ownership-focused "Co-owning an aircraft in {State}" overview prose (2 paras) + a 3-Q co-ownership FAQ (with FAQPage JSON-LD) for New York, Illinois, Georgia, North Carolina — the four states the for-sale set already had. Pure data addition to `seo.ts` (`PARTNERSHIP_STATE_OVERVIEWS` + `PARTNERSHIP_STATE_FAQS`); the `/partnerships/state/[state]` page already conditionally renders both blocks for curated states. Wording is deliberately distinct from the buying-focused `FORSALE_STATE_*` set for the same states (co-ownership/utilization/basing framing, not buying/inspection) — no near-duplicate. No fabricated stats, no live counts. Both content sets now cover the same 10 states (ca/tx/fl/az/co/wa/ny/il/ga/nc). QA PASS desktop 1280 + 375px against the production build (qa-smoke exit 0 on all 4 pages; each emits the overview heading + exactly 3 FAQPage Questions; control `/partnerships/state/oh` still 200 with no overview/FAQ; screenshots on-brand). See CHANGELOG 2026-06-23T06:09Z. **Next: curate the next tier of states for both sets (OH/PA/MI/WI/MN/TN); or model-level prose for high-inventory combos.**
- 2026-06-22 — **For-sale state content depth — NY/IL/GA/NC ([P1][goal], unique content depth)**: extended the "Buying an aircraft in {State}" overview prose + 3-Q buying FAQ (with FAQPage JSON-LD) from the original 6 curated states (ca/tx/fl/az/co/wa) to four more high-GA states — New York, Illinois, Georgia, North Carolina — directly targeting the #1 autocomplete pattern (`aircraft for sale {state}`). Pure data addition to `seo.ts` (`FORSALE_STATE_OVERVIEWS` + `FORSALE_STATE_FAQS`); the `/aircraft/for-sale/[state]` page already conditionally renders both blocks for curated states and nothing for others. Each state's 2 paragraphs + 3 Q&As are genuinely distinct (state GA hubs, climate, hangar/tax/basing realities) — no fabricated stats, no live counts → never stale. The for-sale curated set now intentionally extends beyond the partnership-state set (parity is the next slice). No new component/color/dependency, NO schema/DB/SQL, no FREEZE file. QA PASS desktop 1280 + 375px against the production build (qa-smoke exit 0 on all 4 pages; overview heading carries the state name, FAQ visible answers match the FAQPage JSON-LD 1:1, control `/aircraft/for-sale/ohio` still 200 with no overview/FAQ; screenshots on-brand). See CHANGELOG 2026-06-22T13:36Z. **Next: add NY/IL/GA/NC to the partnership-state set for parity; or curate the next tier of for-sale states.**
- 2026-06-22 — **Anonymous-by-default seeker posts — slice 1 ([P1][want])**: made "seeking a share" listings private by default so posting carries no "my personal info is now public" cost. New pure `anonymizeName(name)` helper in `utils.ts` ("John Smith" → "John S."; single token/handle returned unchanged; empty → null; idempotent on already-short names) now renders the seeker as **"First L."** on both `SeekerCard` (footer) and the `/partnerships/seeking/[id]` detail contact card. The detail page's contact card was **server-side gated on auth** (`isViewerSignedIn()` mirrors the existing mock-mode guard; the page is already dynamic via `createServerSupabaseClient`): logged-out visitors — and crawlers — now get a "Sign in to contact this pilot" CTA (`/auth?next=/partnerships/seeking/[id]`) + a short privacy note and **no `mailto:`/`tel:`/email/phone in the HTML at all**; signed-in members see the existing Email/Phone actions addressed to the anonymized name. This finally honors the post form's own promise ("Your email is not shown publicly — inquiries routed through us"), which the detail page had been breaking by printing the raw email + phone into server-rendered HTML. 3 files (`utils.ts`, `SeekerCard.tsx`, `partnerships/seeking/[id]/page.tsx`), additive — no new component/color/dependency, **NO schema/DB/SQL**, no `src/app/auth/**`/FREEZE change. QA PASS desktop 1280 + 375px against the production build (served in mock mode since the live seeker table is empty → MOCK_SEEKERS fixtures): qa-smoke exit 0 on /partnerships/seeking + /partnerships/seeking/seek-2; logged-out served HTML has ZERO mailto/tel/raw-email/raw-phone + the sign-in CTA/auth-next/privacy-note all present; `anonymizeName` unit-checked; screenshots confirm the gated contact card + "First L." card footers look on-brand. See CHANGELOG 2026-06-22T12:28Z. **Next: slice 2 — real on-platform messaging to seekers (needs an additive `seeker_id`/polymorphic `threads` column + RLS — flag the migration for the human).**
- 2026-06-22 — **Nav polish ([P3][want])**: gave the top nav consistent leading icons and decluttered it. The four primary items now each carry a lucide icon — Partnerships→`Users`, Planes for Sale→`Plane`, Guides→`BookOpen` (Tools already had `Calculator`) — and **About was removed from the top nav** (it stays reachable in the footer "About ClubHanger" / "Our story" links, so no page is lost — a human-approved single-item nav move, not an IA restructure). Same `links` array drives desktop + mobile, so the mobile menu gets the same icons + no-About automatically. One file (`src/components/Nav.tsx`), presentational only — no new route/color/dependency, NO schema/DB/SQL, no `src/app/auth/**`/FREEZE change; the logo, Post-a-Listing CTA, ProfileMenu, and mobile auth header are untouched. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on / · /aircraft · /partnerships · /guides · /tools, zero app console errors, zero overflow; served-HTML check confirms no /about in the header + footer About intact; cropped header screenshot shows each item with its icon and About gone). See CHANGELOG 2026-06-22T12:00Z. **Next: optional icon-audit of the mobile signed-in section; or a P1 [want] (airport community hubs / post-signup onboarding).**
- 2026-06-22 — **Footer browse-all hub links ([P1][goal], internal linking)**: the open follow-up to the "HTML browse-all hub pages" item — surfaced both crawlable index pages (`/aircraft/browse`, `/partnerships/browse`) in the global footer's "Explore" list ("All aircraft pages" / "All partnership pages"). The footer renders on every page, so Google now has a one-hop crawl path from ANY page to the two hubs and from there to every live programmatic page (internal linking = the #2 INDEXING-stage lever). One file (`src/components/Footer.tsx`), two link entries added to `exploreLinks` — no styling/layout/schema/DB change. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; both links present in served `/` HTML, both hubs 200, footer layout intact, zero overflow/console errors). See CHANGELOG 2026-06-22T11:32Z. **The browse-all-hub item is now fully reachable sitewide. Next: real sitemap `lastmod` + crawler ping; openGraph.url parity on the programmatic families.**
- 2026-06-22 — **Etsy × Airbnb refresh — slice 5: token sweep onto `/partnerships` ([P3][want])**: brought the Partnerships search page (priority index page #3) onto the shared warm design tokens already used on `/aircraft`, finishing a visible cold-slate/warm-cream inconsistency — the page's `PartnershipCard`s were already warm `.ch-card`s while the page surface + filter panel were still bare white/slate. One file (`src/app/partnerships/page.tsx`), presentational only: wrapped the content in `<div className="ch-surface min-h-screen">` (CompareTray left outside the wrap, exactly as `/aircraft`), converted the desktop filter sidebar `rounded-xl border border-slate-200 bg-white p-5 shadow-sm` → `ch-panel p-5`, bumped the H1 to `text-3xl font-bold tracking-tight` + icon `h-7 w-7` + body `text-slate-600` for parity, skeleton radius `rounded-xl`→`rounded-2xl`. No `globals.css`/token change, no new color/component/dependency, NO schema/DB/SQL, no FREEZE file. All functionality unchanged (tabs, chip bar, removable filter chips, filters + mobile drawer, Save-this-search, Post CTA, compare tray, list). QA PASS desktop 1280 + 375px against the production build (smoke exit 0, zero app console errors, zero overflow; screenshots confirm the cream surface + rounded filter panel look on-brand). See CHANGELOG 2026-06-22T08:35Z. **Next: same token sweep on the remaining families one per cycle — partnership detail `/partnerships/[id]`, guides, tools, airport pages.**
- 2026-06-22 — **Unique content depth — slice 4: "About co-owning a {Make}" prose on partnership make hubs ([P1][goal])**: partnership-side counterpart to the for-sale make-hub prose (slice 1). Each of the 8 curated `/partnerships/make/[make]` hubs (cessna/piper/cirrus/beechcraft/mooney/diamond/vans/grumman — priority index pages #5/#6/#7 among them) now renders an **"About co-owning a {Make}"** section — 2 genuine, evergreen narrative paragraphs leading with the co-ownership angle (why the make suits a partnership group + how the shared costs play out), deliberately distinct in wording from BOTH the page's co-ownership `PARTNERSHIP_MAKE_FAQS` AND the brand-history for-sale `MAKE_OVERVIEWS`. Lifts these hubs above templated, count-only boilerplate Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as a `PARTNERSHIP_MAKE_OVERVIEWS` map + `getPartnershipMakeOverview(slug)` helper in `seo.ts` (mirrors `getPartnershipMakeFaqs`), rendered between the header and the listings reusing the for-sale-state overview card styling; non-curated makes 404 (route generates only the 8 SEO_MAKES). 2 files (`seo.ts`, `partnerships/make/[make]/page.tsx`), additive — no new component/color/dependency, NO JSON-LD/schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on cessna/cirrus/piper + beechcraft; unique heading + distinct opening line per make in served HTML; cessna-desktop + cirrus-mobile screenshots confirm the prose card looks right on-brand). See CHANGELOG 2026-06-22T08:29Z. **Next slice: partnership STATE hub prose, airport-page overviews, or model-level prose for high-inventory dynamic combos.**
- 2026-06-22 — **Signed-in indicator + profile menu ([P2][want])**: shipped the human's "upper-right avatar + name + consolidated dropdown" ask. New `src/components/ProfileMenu.tsx` (client) — when signed in, the top-right renders a deterministic initial-based avatar (stable color hashed from the email, since users have no photo yet) in place of the old bare "Sign out" button; clicking it opens a dropdown with a "Signed in as {email}" header + Messages / Saved / My Searches / **Admin (admins only)** / Sign out, closing on click-outside or Escape (`aria-haspopup`/`aria-expanded`/`role=menu`). The signed-in Messages/Searches/Saved/Admin links were **removed from the center desktop nav** and now live only in the dropdown (declutter). Mobile menu got an avatar+email identity header atop the existing panel. `Nav.tsx` now reads auth state exactly as before (read-only `getUser` + `onAuthStateChange`; **no `src/app/auth/**` / FREEZE change**) and passes `user`/`isAdmin`/`handleSignOut` into `ProfileMenu`; the exported `Avatar` is reused for the mobile header. 2 files (`ProfileMenu.tsx` new, `Nav.tsx`), additive — no new dependency/color (reuses sky/warm palette + lucide icons), NO schema/DB/SQL. QA PASS desktop 1280 + mobile 375 against the production build (smoke exit 0 on / + /aircraft, zero app console errors, zero overflow; logged-out header cropped-screenshot unchanged = "Sign in" + "Post a Listing", no avatar; signed-in exercised via a seeded `@supabase/ssr` auth cookie + intercepted `/auth/v1/user` — regular user dropdown has NO Admin, admin does, both Escape-close, zero console errors, on-brand dropdown screenshot). See CHANGELOG 2026-06-22T08:19Z. **Next: real pilot-themed cartoon avatars (this slice used initials); an `/account` settings page to link from the dropdown.**
- 2026-06-22 — **Unique content depth — slice 3: "Buying an aircraft in {State}" prose on for-sale state pages ([P1][goal])**: third slice of "[P1][goal] Unique content depth on programmatic pages" (Brainstorm 2026-06-20 §A), the state-level follow-on to slice 1 (make hubs) + slice 2 (make+model pages). Each of the 6 curated `/aircraft/for-sale/[state]` pages (ca/tx/fl/az/co/wa — the same high-GA set as the for-sale-state buying FAQs) now renders a **"Buying an aircraft in {State}"** section — 2 genuine, evergreen narrative paragraphs (the size/character of that state's used-aircraft market + its basing/climate realities + why co-ownership is popular there), deliberately distinct in wording from the page's buying-focused FAQ Q&As. Targets the #1 autocomplete pattern ("aircraft for sale california") and lifts these high-intent pages above templated, count-only boilerplate Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as a `FORSALE_STATE_OVERVIEWS` map + `getForSaleStateOverview(code)` helper in `seo.ts` (mirrors `getForSaleStateFaqs`), rendered between the header and the AlertSignup reusing the make-page "About {Make}" card styling; non-curated states render nothing (verified ohio = 200, no overview, ItemList intact). 2 files (`seo.ts`, `aircraft/for-sale/[state]/page.tsx`), additive — no new component/color/dependency, NO JSON-LD/schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on ca/tx/fl; unique heading + opening line in served HTML; cropped screenshot confirms the prose card looks right on-brand). See CHANGELOG 2026-06-22T08:11Z. **Next slice: partnership make/state hub prose, airport-page overviews, model-level prose for dynamic combos, or curate more for-sale states (NY/IL/GA/NC).**
- 2026-06-22 — **Etsy × Airbnb refresh slice 3 (partnerships half): quick-filter chip bar on `/partnerships` ([P2][want])**: completed slice 3 (the `/aircraft` half shipped earlier as `AircraftChipBar`). New `src/components/PartnershipChipBar.tsx` — a client component modeled 1:1 on `AircraftChipBar` — renders a horizontally-scrolling, 375px-first strip of one-tap chips below the Available/Seeking tabs: top live makes (Cessna/Piper/Beechcraft/Cirrus/Van's…), share types (1/2, 1/3, Leaseback → `share_type`), and budget bands (Under $300/$500/$750/mo → `max_monthly`). Toggling a chip preserves every other active filter; tapping the active chip clears it; chips stay in sync with the sidebar filters + the removable `PartnershipActiveFilterChips` (same URL params). Added `getPartnershipMakes()` to `partnershipsQuery.ts` (one read-time aggregation over active `partnerships.make`, ordered by count, junk makes `unknown/other/n/a` filtered so no chip leads to empty results; mock-data fallback). 3 files (`PartnershipChipBar.tsx` new, `partnershipsQuery.ts`, `partnerships/page.tsx`), additive — no new param/color/dependency, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; served HTML has no "Unknown" make chip, active-chip toggle clears the param, combined-filter href preserves other params; screenshots look right — plane/users/wallet icons, sky active state, horizontal scroll, no overflow). See CHANGELOG 2026-06-22T08:02Z. **Slice 3 fully shipped for both /aircraft + /partnerships. Next: slice 4 — homepage curated rails (Etsy-style).**
- 2026-06-22 — **Unique content depth — slice 2: "About the {Make} {Model}" prose on make+model pages ([P1][goal])**: second slice of "[P1][goal] Unique content depth on programmatic pages" (Brainstorm 2026-06-20 §A), the model-level follow-on to slice 1. Each of the 20 curated `/aircraft/[make]/[model]` for-sale pages now renders an **"About the {Make} {Model}"** section — 2 genuine, evergreen narrative paragraphs (model history + lineup positioning + why it's commonly co-owned), deliberately distinct from the one-line `specs`/`costToOwn` blurbs and the Q&A `MODEL_FAQS` on the same page. Targets the #1 autocomplete pattern ("{make} {model} for sale") and lifts these high-intent pages above templated, count-only boilerplate Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as an `overview?: string[]` field on `SeoMakeModel` + a `MODEL_OVERVIEWS` map keyed `makeSlug/modelSlug` in `seo.ts`, attached in `getMakeModel` alongside the FAQs (non-curated/dynamic combos render nothing — verified bellanca/decathlon = 200, no About section); rendered on the model page below the specs/cost-to-own cards, above the market snapshot. 2 files (`seo.ts`, `aircraft/[make]/[model]/page.tsx`), additive — no new component/color/dependency, NO schema/DB/SQL, no JSON-LD change. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on cessna/172 · cirrus/sr22 · piper/cherokee; unique opening lines per model in served HTML; screenshots look right). See CHANGELOG 2026-06-22T07:19Z. **Next slice: for-sale state market-overview intro on `/aircraft/for-sale/[state]`, partnership make/state hubs, or model-level prose for high-inventory dynamic combos.**
- 2026-06-22 — **Unique content depth — slice 1: "About {Make}" prose on make hub pages ([P1][goal])**: first slice of the "[P1][goal] Unique content depth on programmatic pages" item (Brainstorm 2026-06-20 §A). Each of the 8 curated `/aircraft/[make]` hub pages (cessna/piper/cirrus/beechcraft/mooney/diamond/vans/grumman — priority index pages #5/#6/#7 among them) now renders an **"About {Make}"** section: 2 genuine, evergreen narrative paragraphs (brand history + lineup positioning + why commonly co-owned), deliberately distinct from the page's Q&A `MAKE_FAQS` (narrative, not questions). Lifts the hubs above the templated count-only header that Google deprioritizes in the INDEXING stage. NO fabricated stats, NO live counts → never stale. Implemented as an `overview?: string[]` field on `SeoMake` + a `MAKE_OVERVIEWS` map in `seo.ts`, attached in `resolveMake` (mirrors `MAKE_FAQS`; non-curated makes render nothing — verified bellanca = 200, no About section); rendered on the make hub page below the per-model breakdown, above the listings. 2 files (`seo.ts`, `aircraft/[make]/page.tsx`), additive — no new component/color/dependency, NO schema/DB/SQL, no JSON-LD change. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on cessna/cirrus/piper; unique prose + heading in served HTML; cropped screenshot confirms the About card looks right on-brand). See CHANGELOG 2026-06-22T07:06Z. **Next slice: same unique-prose treatment on `/aircraft/[make]/[model]` (model history/positioning) or the for-sale state market-overview intro; or partnership make hubs.**
- 2026-06-22 — **Soft-save slice 2: merge device saves into the account on login ([P1][want])**: made good slice 1's honest "you may lose them" notice. A logged-out visitor's device-only "soft saves" (localStorage, from slice 1) now merge into their real `saved_listings` the moment they sign in or sign up, then the device store is cleared so it never merges twice. NEW global client component `DeviceSaveSync.tsx` (mounted once in `layout.tsx` next to `FeedbackWidget`) runs on mount **and** on auth→signed-in: reads the device saves, calls a NEW `mergeDeviceSaves` server action, `clearLocalSaves()`, `router.refresh()`es so just-merged hearts/`/saved` reflect the account, and shows a small dismissible "N saved listings added to your account" toast (nothing if the merge added 0). `mergeDeviceSaves` (`actions.ts`) is defensive — the payload comes from a tamperable localStorage, so it filters to valid `partnership`/`aircraft` types + well-formed ids, dedupes, caps at 200, **queries existing saves and skips them** (idempotent, no reliance on the unique-constraint name), and ignores 23505 on the batch insert. Added `clearLocalSaves()` to `localSaves.ts`. 4 files (`localSaves.ts`, `actions.ts`, `DeviceSaveSync.tsx` new, `layout.tsx`), additive — NO schema/DB/SQL change, NO `src/app/auth/**` change (the merge is driven from the already-signed-in client session, touching no FREEZE auth files), no new dependency/color. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on / · /aircraft · /partnerships · /saved; zero app console errors from the globally-mounted component across 4 pages × 2 viewports; screenshots confirm no stray toast for logged-out visitors). See CHANGELOG 2026-06-22T07:08Z. **Next: slice 3 — surface device saves to *logged-out* visitors on /saved (still redirects to /auth) with the honest notice + account prompt; pairs with post-signup onboarding.**
- 2026-06-22 — **Per-make+model+STATE FAQ blocks + FAQPage JSON-LD ([P2][goal])**: extended the FAQ pattern (per-model → per-make for-sale → partnership-make → partnership-state → for-sale-state, all shipped 2026-06-21/22) to the most specific for-sale family `/aircraft/[make]/[model]/[state]` — the #1 autocomplete pattern ("{make} {model} for sale {state}"). 3 genuine, evergreen, **intersection-specific** Q&As each (why the airplane suits that state, what it costs to own there — hangar/tax/insurance realities, what to check given the local climate) for 6 marquee high-inventory combos: cessna/172 (CA, TX), cirrus/sr22 (CA, TX, FL), cessna/182 (TX) — all confirmed ≥3 live listings at orient (page 404s below that). Intentionally distinct from the model-only `MODEL_FAQS` and the generic-buying `FORSALE_STATE_FAQS`, so not a near-duplicate of a parent (GOAL.md guardrail); durable well-known facts only, NO fabricated stats, NO live counts → never stale. Implemented as a `MAKE_MODEL_STATE_FAQS` map keyed `makeSlug/modelSlug/stateCode` + `getMakeModelStateFaqs()` in `seo.ts` (mirrors `getForSaleStateFaqs`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1. 2 files (`seo.ts`, `aircraft/[make]/[model]/[state]/page.tsx`), additive; non-curated combos render no FAQ (verified cessna/182/washington = 200, no FAQ, ItemList intact). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; one FAQPage with 3 Questions per curated page; screenshots look right). See CHANGELOG 2026-06-22T06:52Z. **Next: curate more high-inventory intersections (cirrus/sr22 CO/AZ/NY/OH, cessna/182 AZ/WA all had ≥3 at orient); or the [P1][goal] unique-content-depth prose on state/airport families.**
- 2026-06-22 — **HTML "browse all" hub pages — slice 2: `/partnerships/browse` ([P1][goal])**: built the partnership twin of `/aircraft/browse` — a single crawlable index page linking every live partnership landing page in three sections: **By make** (the 8 curated SEO_MAKES, each gated on live active-listing count), **By state** (only states with ≥1 active partnership, with counts), and **Near an airport** (the same MIN_NEARBY-gated hub set the `/partnerships/near/[icao]` route + sitemap use, shown by airport name + ICAO + city/state + nearby count). Internal links = the #2 indexing lever after backlinks (STAGE=INDEXING), and every link points at a real, non-thin page (no doorway pages — GOAL.md). NEW `src/app/partnerships/browse/page.tsx` (server component: Breadcrumbs, self-canonical + OpenGraph + Twitter, one `CollectionPage`/ItemList JSON-LD, `ch-surface`/`ch-panel` + sky tokens, empty-state fallback). Added `countPartnershipsByMake`/`countPartnershipsByState` to `partnershipsQuery.ts` (mirror `countForSaleState`); refactored `nearbyPartnerships.ts` so `getNearAirportSitemapIcaos` + a new `getNearAirportHubs()` share one `computeNearAirportHubs()` core (sitemap near set byte-identical — verified 6 ICAOs unchanged). Added the hub to `sitemap.ts` + a "Browse all makes, states & airports →" link on `/partnerships`. No new component/color/dependency, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; served HTML has 7 make / 10 state / 6 near links + a valid CollectionPage; in sitemap + linked from /partnerships; one mobile-overflow fix via `min-w-0` truncation; screenshots look right). See CHANGELOG 2026-06-22T06:28Z. **The browse-all hub item is now fully shipped for both families. Next: optional footer link; or the broader [P1][goal] "unique content depth" prose on state/airport families.**
- 2026-06-22 — **Explain the trust/quality badges ([P2][want])**: shipped the human's exact ask — a "what do these mean?" legend page + the badges linked to it. New `/listing-quality` (server page, mobile-first, cream `ch-surface`) explains (a) the **A/B/C listing-quality grade** — each grade's meaning (`gradeMeta`) + the point-weighted completeness signals (`QUALITY_SIGNALS`/`GRADE_CUTOFFS`), with the honest caveat that it measures *completeness*, not condition/price-fairness; and (b) the **trust signals** — the 4 partnership (`TRUST_SIGNALS`) + 4 aircraft (`AIRCRAFT_TRUST_SIGNALS`) checks, each with a why-it-matters hint — all read 1:1 from the existing tables so the page can't drift from the badges. Self-canonical + OpenGraph + `Breadcrumbs` (BreadcrumbList JSON-LD) + a 3-Q&A FAQ (`ModelFaq` + `buildFaqPageJsonLd`, visible == JSON-LD). Linked from: the aircraft **grade chip** (`<span>`→`<Link>`, fuller tooltip + aria-label — fixes that the chip had NO explanation on mobile, only a desktop `title`), the partnership detail **trust checklist** footer, and the **footer** under Guides. 4 files (`listing-quality/page.tsx` new, `AircraftSaleCard.tsx`, `TrustBadge.tsx`, `Footer.tsx`), additive — no new component/color/dependency, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on /listing-quality + /aircraft; one FAQPage with 3 Qs + BreadcrumbList in served HTML, visible-answer parity; 61 grade-chip links to /listing-quality on /aircraft; screenshots look right). See CHANGELOG 2026-06-22T06:19Z. **Next: optional per-badge hover-popover on the trust chip; or a P1 [want] (airport hubs / "Looking for a share" post flow).**
- 2026-06-22 — **Per-state buying FAQ + FAQPage JSON-LD on FOR-SALE state pages ([P2][goal])**: extended the FAQ pattern (per-model → per-make for-sale → partnership-make → partnership-state, all shipped 2026-06-21/22) to the for-sale geo family `/aircraft/for-sale/[state]`, targeting the #1 autocomplete query pattern (`aircraft for sale california`). 3 genuine, evergreen, **buying-focused** Q&As each (is it a good place to buy, where the inventory clusters at real GA hubs, what to inspect / what drives price — coastal corrosion / density altitude / sales-use tax) for 6 curated high-GA states (ca/tx/fl/az/co/wa, same set as the partnership-state FAQs) — durable well-known facts only, NO fabricated stats, NO live counts → never stale. Intentionally distinct from the co-ownership-focused `PARTNERSHIP_STATE_FAQS`. Implemented as a `FORSALE_STATE_FAQS` map + `getForSaleStateFaqs(code)` helper in `seo.ts` (mirrors `getPartnershipStateFaqs`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). 2 files (`seo.ts`, `aircraft/for-sale/[state]/page.tsx`), additive; non-curated states render no FAQ (verified ohio/georgia/new-york/illinois = 200, no FAQ). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on ca/tx/fl; one FAQPage with 3 Questions per page; ca-desktop + fl-mobile screenshots look right). See CHANGELOG 2026-06-22T02:51Z. **Next: per-make+model+state aircraft FAQ variants on `/aircraft/[make]/[model]/[state]`; or curate more for-sale states (NY/IL/GA/NC).**
- 2026-06-22 — **Removable active-filter chips on `/partnerships` ([want])**: mirrored the proven `/aircraft` chip row onto the Partnerships results (priority index page #3). New `src/components/PartnershipActiveFilterChips.tsx` — a pure **server** component (no client JS) — renders a removable sky pill per active partnership filter (airport+radius / state / make / share_type / max_monthly / max_buyin); each `<Link>` strips just that filter, removing airport also clears radius, share-type shows its human label (e.g. "1/2 Share"), state shows the full name, "Clear all" appears at ≥2 chips, nothing renders with no filters. Rendered above `PartnershipList` in `partnerships/page.tsx`. Reuses existing params + `STATE_NAMES`; no new param/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; removal semantics verified in served HTML). See CHANGELOG 2026-06-22T02:50Z. **Both `/aircraft` and `/partnerships` now have removable filter chips.**
- 2026-06-22 — **Per-state FAQ blocks + FAQPage JSON-LD on PARTNERSHIP state pages ([P2][goal])**: extended the FAQ pattern (per-model → per-make for-sale → partnership-make, all shipped earlier 2026-06-21/22) to the partnership **state** level `/partnerships/state/[state]`, covering priority index pages #8/#9/#10 (ca/tx/fl) plus three more distinctive high-GA states (az/co/wa). 3 genuine, evergreen, **state-specific** co-ownership Q&As each (why co-own in that state, where partnerships cluster — real GA hub airports, what drives shared costs — coastal hangar scarcity / density altitude / mountain flying / PNW weather / no-income-tax) — durable well-known facts only, NO fabricated stats, NO live counts → never stale. Implemented as a `PARTNERSHIP_STATE_FAQS` map keyed by lowercase USPS code + `getPartnershipStateFaqs(code)` in `seo.ts` (mirrors `PARTNERSHIP_MAKE_FAQS`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). 2 files (`seo.ts`, `partnerships/state/[state]/page.tsx`), additive; non-curated states render no FAQ (verified wy = 200, no FAQ) — never templated boilerplate across all 50. No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 on ca/tx/fl; one FAQPage with 3 Questions per page; ca-desktop + fl-mobile screenshots look right). See CHANGELOG 2026-06-22T03:42Z. **Next: per-state aircraft FAQ variants on `/aircraft/for-sale/[state]` + `/aircraft/[make]/[model]/[state]`; or curate more states (NY/IL/GA/NC).**
- 2026-06-22 — **Removable active-filter chips on `/aircraft` ([want])**: the twice-recommended follow-up to "Marketplace filters: multi-select + ranges" — a row of removable sky-blue pills above the results, one per active filter (make/model(s)/state/price range/year range/total-time range/grade(s)/keyword/price-drops), each `<Link>`-stripping just that filter and resetting to page 1; removing make also clears model; all-three-grades shows no grade chip; "Clear all" appears at ≥2 chips; nothing renders with no filters. New `src/components/ActiveFilterChips.tsx` — a pure **server** component (no client JS/hydration) — rendered above `AircraftSaleList` in `aircraft/page.tsx`. Reuses existing params + `STATE_NAMES`; no new param/color/dependency, no schema/DB/SQL. Re-applied cleanly onto post-webhook-fix staging (the original `night/aircraft-filter-chips` branch predated that fix). QA PASS desktop 1280 + 375px against the production build (smoke exit 0; removal semantics verified in served HTML). See CHANGELOG 2026-06-22T03:05Z. **Next: optional — same chips on /partnerships results.**
- 2026-06-22 — **Make-level FAQ blocks + FAQPage JSON-LD on PARTNERSHIP make pages ([P2][goal])**: extended the per-make FAQ pattern from the for-sale side (`/aircraft/[make]`, shipped 2026-06-22T00:08Z) to all 8 curated partnership hub pages `/partnerships/make/[make]` (cessna, piper, cirrus, beechcraft, mooney, diamond, vans, grumman — priority index pages #5/#6/#7 among them). 3 genuine, evergreen, **co-ownership-focused** Q&As each (why the make suits a partnership, which model fits a group, how shared costs split) — intentionally distinct from the buying-focused for-sale `MAKE_FAQS`; drawn from the SEO_MAKES blurbs + well-known GA facts (NO fabricated stats, NO live counts → never stale). Implemented as a `PARTNERSHIP_MAKE_FAQS` map + `getPartnershipMakeFaqs(slug)` helper in `seo.ts` (mirrors `MAKE_FAQS`/`resolveMake`), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). 2 files (`seo.ts`, `partnerships/make/[make]/page.tsx`), additive; non-curated makes 404 (route generates only the 8 SEO_MAKES). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0; one FAQPage with 3 Questions per page; collapsed+expanded screenshots look right). See CHANGELOG 2026-06-22T00:30Z. **Next: partnership state pages + per-state aircraft FAQ variants.**
- 2026-06-22 — **Listing-Quality multi-select on `/aircraft` ([P1][want])** — the final slice of "Marketplace filters: multi-select + ranges": the single grade-*floor* select became an **A/B/C checkbox group** (any combo). The `grade` URL param is a comma-joined subset, parsed into an OR of per-grade `quality_score` score bands (A ≥78, 50≤B<78, C<50) each clipped to the site-wide `FLOOR_GRADE`; none/all-three selected → floor only. Legacy single `min_grade` floor (A/B) is still honored read-only for old links/saved searches. Mirrors the Model multi-select (label "· N selected", normalized A,B,C order, survives in URL, mobile drawer + pager + Clear-all inherit it); `describeAircraftFilters` now mentions the grade subset in save-search/alert text. 3 files (`AircraftSaleFilters.tsx`, `AircraftSaleList.tsx`, `seo.ts`), additive, NO new component/color/dependency, NO schema/DB/SQL (reuses `quality_score` + `GRADE_CUTOFFS`). QA PASS desktop 1280 + 375px against the production build (smoke exit 0; verified by served counts that the bands partition exactly — A 420 / B 1005 / C 431 = 1856 total — and A+C=851=420+431 excludes B, all-three=1856=unfiltered, legacy min_grade=B=1425=A+B; focused panel screenshot confirms "· 2 selected" with A+C ticked). See CHANGELOG 2026-06-22T00:18Z. **This P1 item is now fully shipped. Optional next: removable active-filter chips in the results header.**
- 2026-06-22 — **Make-level FAQ blocks + FAQPage JSON-LD on make hub pages ([P2][goal])**: extended the per-model FAQ pattern to the 8 curated `/aircraft/[make]` hub pages (Cessna, Piper, Cirrus, Beechcraft, Mooney, Diamond, Van's, Grumman) — 3 genuine, evergreen, brand/lineup-level Q&As each (what the make is known for, which model to pick, cost to own), drawn from the existing `SEO_MAKES` blurbs + well-known GA facts (NO fabricated stats, NO live counts → never stale), distinct from the per-model FAQs. Implemented as a `MAKE_FAQS` map keyed by makeSlug attached in `resolveMake` (mirrors `MODEL_FAQS`/`getMakeModel`; added `faqs?` to the `SeoMake` type), reusing the existing `ModelFaq.tsx` no-JS `<details>` accordion + `buildFaqPageJsonLd` — visible answers match the FAQPage JSON-LD 1:1 (Google parity). Curated makes only; non-curated makes (e.g. Bellanca) render nothing (verified 200, no FAQ). No new component/color/dependency, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0 after killing a stale port-3000 server; FAQPage parses with 3 Qs all present in the visible DOM on cessna/cirrus/piper; collapsed+expanded screenshots look right). See CHANGELOG 2026-06-22T00:08Z. **Next: partnership make pages + per-state FAQ variants.**
- 2026-06-21 — **Per-model FAQ blocks + FAQPage JSON-LD on make+model pages ([P2][goal])**: added 3 genuine, evergreen Q&As + valid `FAQPage` structured data to each of the 20 curated `/aircraft/[make]/[model]` pages (e.g. /aircraft/cessna/172, /aircraft/cirrus/sr22, /aircraft/robinson/r44) — unique content depth + rich-result eligibility for the INDEXING stage. Answers are model-specific, drawn from the existing curated specs/cost-to-own copy + well-known GA facts (NO fabricated stats, NO live counts → never stale). Implemented as a separate keyed `MODEL_FAQS` map attached in `getMakeModel` (kept `SEO_MAKE_MODELS` readable), a `buildFaqPageJsonLd` helper in `aircraftJsonLd.ts`, and a no-JS `<details>` accordion component `ModelFaq.tsx` (sky accent, 375px-first) — the visible answers match the JSON-LD 1:1 (Google parity). Curated combos only; dynamically-discovered combos render nothing (verified /aircraft/bellanca/decathlon = 200, no FAQ, ItemList intact). No new color, no schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (smoke exit 0, FAQPage parses with 3 Qs all present in visible DOM, no console/hydration errors, overflow 0, focused screenshots confirm collapsed+expanded look right). See CHANGELOG 2026-06-21T23:52Z. **Next: same FAQ pattern on make-level `/aircraft/[make]` + partnership make pages; per-state variants.**
- 2026-06-21 — **`/partnerships` + `/aircraft` canonical + OpenGraph ([goal], priority pages #3 + #2)**: finished the sitewide canonical+OG sweep on the last two priority INDEX pages, closing the "Two verified gaps" item. `/partnerships` had NO canonical at all → added `alternates.canonical: '/partnerships'`; `/aircraft` had a canonical but no page-level og:url/og:title → both pages now carry a full page-level `openGraph` (url/title/description + explicit image/site_name/type/locale) + a `twitter` summary_large_image block, mirroring the homepage pattern in `src/app/page.tsx`. Metadata-only in the two `page.tsx` files; reused `SITE_NAME`/`DEFAULT_OG_IMAGE` from `@/lib/seo` only; no layout edit, no visual/content change, no new component/color, NO schema/DB/SQL. QA PASS desktop 1280 + 375px against the production build (canonical + full og/twitter in served HTML on both, all JSON-LD parses, no console/hydration errors, overflow 0, both pages visually unchanged). See CHANGELOG 2026-06-21T06:08Z. **The sitewide og:url gap on the priority index set (`/`, `/partnerships`, `/aircraft`) is now closed. Next: explicit `openGraph.url` parity on the make/state/model programmatic families.**
- 2026-06-20 — **Homepage `/` canonical + OpenGraph ([goal], priority page #1)**: closed the two specifically-verified audit gaps on the homepage — (a) it had NO canonical → added `alternates.canonical: '/'` (self-canonical), and (b) `og:url` was empty sitewide → set a full page-level `openGraph` (url/title/description + explicit image/site_name/type/locale) so the homepage now unfurls with a real card and carries its canonical URL. Also added a `twitter` block (summary_large_image) and a `logo` to the WebSite JSON-LD (SearchAction sitelinks box unchanged). Metadata-only in `src/app/page.tsx`; no layout edit (scoped to `/`), no visual/content change, no new component/color, NO schema/DB/SQL. QA PASS desktop + 375px against the production build (canonical + 11 og/twitter tags in served HTML, 3 JSON-LD blocks parse with WebSite logo, no console errors, overflow 0, homepage visually unchanged). See CHANGELOG 2026-06-20T23:26Z. **Next: same sweep on `/partnerships` (#3, no canonical) + `/aircraft` (#2, canonical but no og:url) to finish the sitewide og:url gap.**
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
