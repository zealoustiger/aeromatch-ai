# Night Shift Backlog

This is the steering wheel. The overnight loop reads this file every cycle and
picks the highest-value unblocked item. Keep it current — what's here is what
gets built while you sleep.

## How to add an idea
- Drop it under **Ideas** with a one-line description.
- For design/UX work, add an **Inspiration** entry: a URL + 2-3 bullets of
  *exactly what you like*. Specific likes → on-brand results; "make it nicer" → slop.
- Mark priority with `[P1]` (do first) / `[P2]` / `[P3]`.
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

---

## Ideas

### Planes for Sale
- **[P1] Filter UI overhaul.** Lead with **Make + Model** (the primary search path — Model options depend on selected Make). Then secondary filters: **avionics, total time (tach/Hobbs), engine time (SMOH), year, price, state.** Cleaner than Controller — surface the few that matter, progressive-disclose the rest. Must work at 375px.
- **[P1] BUG: real aircraft photos missing.** None of the sale listings show the actual plane photo. Diagnose the whole path: is the Barnstormers ingest capturing image URLs? Are they being re-hosted / stored on `aircraft_for_sale`? Is the card falling back to a placeholder when a real image exists? Fix so real photos render, with the "Not actual plane photo" badge only when genuinely a placeholder.

### Search & discovery
- **[P2] AI natural-language search (beta).** A search box that takes "low-time IFR Cirrus under $400/mo near the Bay Area" → translates to structured filters via Claude (reuse the app's existing LLM/parse layer + `ANTHROPIC_API_KEY` — do not hardcode keys) → runs the query. Label clearly as **beta**. Slice it: (1) NL→filters endpoint, (2) wire to results, (3) polish.
- **[P2] Map view (Yelp-style).** Pannable map; results update as you move the map, keyed to airport lat/lng (already in the `airports` table). **More valuable for partnerships than planes-for-sale.** Big — slice it: (1) static map of current results, (2) markers + popovers, (3) pan-to-search ("search this area").

### Engagement & accounts
- **[P2] Save / favorite listings.** Heart button on cards + detail pages (partnerships AND planes-for-sale). Logged-out click → **registration gate** (sign in/up), then saves to the user's account. New `saved_listings` table; a "Saved" view. Reuse existing auth.
- **[P2] Listing comparison.** Select 2-3 listings → side-by-side spec/cost/requirements comparison. A compare tray + a `/compare` view. Works for planes-for-sale (specs) and partnerships (costs/requirements).

### Partnerships
- **[P2] Merge "Available" + "Seeking" into one toggle.** `/partnerships/seeking` is currently blank. Instead of two separate lists, when searching partnerships show a mix of **available partnerships** + **pilots seeking to form groups**, with a toggle: Available / Seeking / Both. Keep SEO intact.

### Monetization (UI only — do NOT activate; human decision)
- **[P3] Standardized ad placements.** Build reusable, consistently-sized ad-slot blocks (e.g. leaderboard, in-feed, sidebar) with placeholders. Do NOT wire a live paid network — leave activation to the human. Networks to evaluate and summarize for the human (don't pick one autonomously):
  - **Google AdSense / Ad Manager** — easiest, broadest, low traffic minimum.
  - **Mediavine / Raptive / Ezoic** — higher RPM, but need meaningful traffic minimums.
  - **Carbon Ads** — clean, single tasteful ad; good for niche/dev audiences.
  - **Direct / house ads to aviation advertisers** (avionics shops, aircraft insurers, flight schools, brokers, title/escrow) — likely the best fit + highest value for a niche GA audience; a simple house-ad slot the human can sell directly.

---

## Constraints / taste notes
- Keep the **sky-blue accent**; one accent color, no new palettes.
- **Mobile-first** — every change must look right at 375px before desktop.
- **Cleaner than Controller** — the human finds dense filter walls busy. Few filters visible, progressive disclosure for the rest.
- No dark patterns, no fake urgency, no autoplay.
- Monetization, pricing, removing features, brand/logo/nav-identity changes = **ask a human** (FREEZE.md).

---

## Done
<!-- The loop appends shipped items here with a date + staging link. -->
- 2026-06-19 — Filter overhaul **polish**: /aircraft results header shows the true total match count (e.g. "1,856 … — showing first 60") instead of capping at "60+", so filtering visibly works above 60 matches (staging). See CHANGELOG 2026-06-19T08:03Z. Follow-up: real pagination.
- 2026-06-19 — Filter overhaul **slice 2**: Max Total Time filter + progressive-disclosure "More filters" on /aircraft (staging). Avionics/SMOH filters deferred — those columns are 0% populated in the DB (ingest gap). See CHANGELOG 2026-06-19T07:03Z.
- 2026-06-19 — Filter overhaul **slice 1**: Make + Model dependent dropdowns on /aircraft (staging). See CHANGELOG 2026-06-19T06:04Z.
