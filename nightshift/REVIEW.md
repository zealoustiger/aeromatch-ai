# 🌤️ Afternoon run — June 20 (manual, ~1 hour) — 5 cycles, all ✅ PASS

A short human-triggered Night Shift drain — 5 back-to-back cycles, all landed clean on `staging`. Review below, then drop notes in the **feedback box at the bottom of this page**; Claude reads them and turns them into backlog items.

**By page**

- **`/aircraft` + `/partnerships` — new look (Etsy × Airbnb).** Visual refresh slices 1 & 2: warm cream background, rounded cards, soft hover-lift, friendlier headings; both listing cards (planes-for-sale + partnerships) redesigned to the Airbnb photo-forward style — bold price, heart top-right, minimal borders. · [open /aircraft ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft) · [open /partnerships ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships) · screenshots: `aircraft-visual-tokens/`, `listing-card-redesign/`
  - 👉 **This is the branding experiment to react to** — does the cream / rounded / Airbnb-card direction feel right? Your notes steer slices 3–5 (category chip bar, homepage rails, token sweep).
- **`/partnerships/seeking` — search-engine ready (priority page #4).** Added canonical + social-share tags + breadcrumb & listing structured data + cross-links from the make hubs, bringing it up to the make-page SEO bar. · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/seeking) · screenshots: `seeking-seo-metadata/`
- **`/` homepage — two changes.** SEO (priority page #1): added the homepage's own canonical address + complete social-share tags (were missing/empty) + a logo in its structured data — no visual change. Bug fix: signed-in users clicking the homepage Search no longer get re-prompted to sign up; they go straight to results. · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/) · screenshots: `homepage-canonical-og/`

**Lanes:** 2 design · 2 indexing (priority pages #1 + #4) · 1 bug fix. SEO impact lags weeks — judged on the metadata being live now, not today's traffic. Full per-cycle detail in `nightshift/CHANGELOG.md`.

---

# Overnight review — June 20

## 📊 Traffic (PostHog) — as of 2026-06-20

- **Visitors:** 7 all-time · 7 in the last 7 days
- **Pageviews:** 68 all-time · 68 in the last 7 days
- **Not from Oakland:** 5 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

**By city**

| City | Visitors | Pageviews |
|---|--:|--:|
| Oakland | 2 | 63 |
| Monte Vista | 2 | 2 |
| Wuhan | 1 | 1 |
| (unknown) | 1 | 1 |
| Council Bluffs | 1 | 1 |

**Top pages**

| Page | Pageviews |
|---|--:|
| /aircraft | 18 |
| / | 17 |
| /admin | 9 |
| /partnerships | 8 |
| /admin/review | 3 |
| /partnerships/seeking | 3 |
| /partnerships/07c2245d-6df3-4eeb-b14b-9a45ad618718 | 2 |
| /admin/backlog | 2 |
| /admin/listings | 2 |
| /auth | 2 |

---

**48 build cycles ran overnight, all passed**, across roughly **15 page areas** of the
site. This is a big batch — several nights' worth of SEO and feature work has piled
up on `staging` and is **not yet live** on clubhanger.com. Review the live staging
site (you must be logged into Vercel), then tell Claude which pages to promote to
production — or "promote everything."

The headline themes: a lot of **new "planes for sale" pages built for Google**
(make pages, make+model pages, by-state pages, model-in-state pages), a brand-new
**7-guide content library**, **Save/favorite + compare** tools for shoppers, a
**listing trust layer**, and two **cost/earnings calculators** with their own hub.

Staging site: https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app

---

## /aircraft/cessna/172 — Make + Model "for sale" pages (most-changed) · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/cessna/172)
These are the auto-built "{Make} {Model} for sale" pages (e.g. Cessna 172, Cirrus SR22). They got the most attention all night.
- **The pages now exist and cover real inventory** — started at the top 20 make/model combos, then expanded to **42** families (every make/model with real listings) (cycles: aircraft-make-model-pages, make-model-expand)
- **Market snapshot block** — shows the median, average, low and high asking price for that exact model, only when there are enough priced listings to be honest (forsale-market-snapshot)
- **"vs market" price pill on each card** — e.g. "~42% below average" / "~160% above average," so a buyer sees value at a glance (forsale-vs-market-pill)
- **Save (heart) button** and **Compare toggle** on each plane card (aircraft-favorites, compare-make-model)
- **Trust signal chip** on each card — "N/4 trust signals" showing how complete a listing is (aircraft-trust-badge)
- **Email-alert signup** — "Get alerts for new Cessna 172 listings" (email-alerts)
- **"Buying a plane?" guide links** and a **"Estimate your cost to own a Cessna 172 →"** link into the calculator (forsale-guide-crosslinks, forsale-cost-calc-crosslink)
- **Cross-link rails** to other models of the same make and to the same model in other states (family-rails, model-in-state-pages)
- **Behind-the-scenes Google data** — breadcrumbs, product/price-range structured data, and social share cards (internal-linking, aircraft-jsonld, aggregate-offer-jsonld, forsale-og-cards)

## /aircraft — Planes for Sale (main marketplace) · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft)
The busiest page on the site (the #1-traffic section). It picked up the shopper tools.
- **Save (heart) buttons** and a **Compare** tool (pick 2–3 planes → side-by-side table) (aircraft-favorites, compare-aircraft)
- **Trust signal chip** and **"vs market" price pill** on every card (aircraft-trust-badge, forsale-vs-market-pill)
- **Filter-aware email alerts** — reads your active search and offers "Get alerts for new Cessna 172 in California under $50,000 listings" (aircraft-alerts-capture)
- **"Buying a plane?" guide links** and a crawlable **"by state" rail** linking out to all 50 state pages (forsale-guide-crosslinks, aircraft-state-pages)
- **Breadcrumbs + listing→model links** so Google can reach the deeper pages (internal-linking)

## /guides — New content library (7 guides + hub) · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/guides)
Brand-new from-scratch content section aimed at search traffic. Built one guide at a time.
- **Seven full guides** written overnight: How Co-Ownership Works, Cost of Co-Ownership, Partnership Agreement, Leaseback vs. Co-Ownership, How to Find Partners, Pre-Purchase Inspection, and Title/Escrow/Closing (guide-coownership, guide-cost, guide-agreement, guide-leaseback, guide-find-partners, guide-pre-purchase-inspection, guide-title-escrow-closing)
- **A /guides hub page** listing them all, with guides cross-linked to each other (guides-hub)
- **"Guides" added to the top navigation** (desktop + mobile) so the section is reachable from every page (guides-nav-link)
- Each guide carries a standard "general info, not legal/tax advice" disclaimer; no fabricated figures or statistics.

## /aircraft/for-sale/california — Planes for sale by state (NEW) · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/for-sale/california)
A new page for every state that has inventory (targets searches like "aircraft for sale california").
- **The pages now exist** for all 50 states, each listing planes located there with a unique intro (aircraft-state-pages)
- Same shopper features as the main marketplace: **Save buttons, "vs market" pill, trust chip, email alerts** (aircraft-favorites, forsale-vs-market-pill, aircraft-trust-badge, email-alerts)
- **"Buying a plane?" guide links**, **"popular aircraft in {state}" rail**, and **social share cards** (state-forsale-guide-crosslinks, family-rails, forsale-og-cards)

## Partnership detail pages · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships)
The individual partnership listing pages (`/partnerships/[id]`). Open any listing from the partnerships index to see these.
- **Photo gallery + full-screen lightbox** and a **"Similar partnerships" rail** at the bottom (listing-depth)
- **Built-in cost estimator card** pre-filled from that listing's real numbers — tweak hours/rate, see your true cost per hour (partnership-cost-calc)
- **Share / copy-link button** and rich social-media preview cards when the link is shared (listing-og-share)
- **"Listing trust" checklist**, plus an owner-only **"Improve your listing"** prompt that names exactly what's missing (trust-badge, trust-nudges)

## /partnerships — Browse partnerships · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships)
- **Trust signal chips** on cards, and **listings now sort by completeness** — fuller, on-platform, real-photo listings float to the top (trust-badge, trust-ranking)
- **Compare** tool (pick 2–3 partnerships → side-by-side) (compare)
- **Color cleanup** — stray green accents standardized to the site's sky-blue (accent-sky)

## /tools — Calculators + hub · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/tools)
- **Two calculators built**: a cost-of-ownership calculator and an owner earnings/leaseback calculator (financial-calculators)
- **A /tools hub page** listing both, plus a **"Tools" link in the top nav** (was footer-only before) (calculators-nav-jsonld, partnership-cost-calc)
- Breadcrumbs and rich-result data added so Google can show them (tools-sitemap-seo)

## New SEO page families (auto-built for inventory)
- **/aircraft/cessna — make-level pages** with a per-model breakdown ("Cessna 182 — 45 for sale"…) · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/cessna) (aircraft-make-pages)
- **/aircraft/cessna/172/california — model-in-state pages** ("Cessna 172 for sale in California") · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/cessna/172/california) (model-in-state-pages)
- **/partnerships/near/kpao — "partnerships near {airport}" pages**, distance-ranked within 100 nm · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/near/kpao) (partnerships-near-airport, airport-near-crosslink)

## /saved — My saved listings · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/saved)
- Now shows **saved aircraft** alongside saved partnerships, in two labeled sections (saved-aircraft-view)

## /airports/kpao — Airport pages · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/airports/kpao)
- **Structured airport data** for Google, plus a **"partnerships near this airport"** link card (structured-data, airport-near-crosslink)

## /partnerships/seeking — Pilots seeking partnerships · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/seeking)
- This page was rendering **blank** (the database has no seeker listings yet). It now shows a helpful empty state that explains why and **surfaces real available partnerships** instead of dead-ending (seeking-fallback)

## /compare — Side-by-side comparison (NEW utility) · [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/compare)
- New comparison view for both partnerships and planes-for-sale; deliberately hidden from Google (compare, compare-aircraft, compare-make-model)

## Site-wide / other
- **robots.txt hardened** so Google stops wasting crawl budget on admin/API/login/private pages and focuses on the real content pages (robots-hardening)
- **Sitemap expanded** to include all the new page families and tools (sitemap-sweep + each new-page cycle)
- **Default social-share image** added site-wide (listing-og-share)
- **"Guides" and "Tools" added to the top nav** (guides-nav-link, partnership-cost-calc)

---

## Anything that needs your attention
- **One database change is included (the only schema change in this batch).** The email-alert signups write to a new `alerts` table, which was added to `supabase/schema.sql`. Staging and production **share one database**, so before/when you promote the email-alerts work, confirm that `alerts` table actually exists in the live database — otherwise the "Get alerts" buttons will fail to save. Ask Claude to verify this before promoting the email-alerts pages. (Everything else in this batch is additive UI/content/SEO with **no** database changes.)
- **One flow could not be tested automatically: the owner "Improve your listing" prompt** on partnership detail pages. It only appears when you're signed in as the member who posted that listing, which the overnight QA couldn't do headlessly. Please spot-check it manually: sign in on staging as a member who has posted a listing, open your own incomplete listing (should show the sky-blue "Improve your listing" card naming the missing items), then open someone else's listing or view logged-out (should show nothing).
- **The "Pilots seeking partnerships" feature is still data-empty.** The new empty-state fallback is a good stopgap, but the seeking pages, partner-matching, and "available + seeking" views stay thin until real seeker data is loaded into the database — a human task, not something the night shift can do.
- **Email alerts are capture-only for now.** Slice 1 collects emails; actually sending confirmation/alert emails needs transactional-email infrastructure that isn't set up yet. So the signup works, but no emails go out until that's wired up.
- **This is a large promote.** 48 cycles is far more than a typical night — consider promoting in a few logical groups (e.g. the for-sale SEO pages, then the guides, then the shopper tools) rather than all at once, so anything that needs a closer look is easier to isolate.

## To ship
Tell Claude which pages to promote — for example: **"promote the guides and the calculators,"** or **"promote the for-sale pages,"** or **"promote everything."** Claude merges the chosen work from `staging` into `main`, which deploys it to clubhanger.com. (Before promoting the **email-alerts** pages, ask Claude to confirm the `alerts` table exists in the live database.)
