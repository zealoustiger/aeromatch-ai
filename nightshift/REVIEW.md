# Overnight review — 2026-06-26

## 📊 Traffic (PostHog) — as of 2026-06-26

- **Visitors:** 13 all-time · 13 in the last 7 days
- **Pageviews:** 435 all-time · 404 in the last 7 days
- **Not from Oakland:** 12 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

**By city**

| City | Visitors | Pageviews |
|---|--:|--:|
| Oakland | 3 | 413 |
| Monte Vista | 2 | 2 |
| (unknown) | 2 | 2 |
| San Francisco | 1 | 8 |
| Seattle | 1 | 3 |
| El Cerrito | 1 | 2 |
| Houston | 1 | 1 |
| Wuhan | 1 | 1 |
| Vancouver | 1 | 1 |
| Council Bluffs | 1 | 1 |
| Singapore | 1 | 1 |

**Top pages**

| Page | Pageviews |
|---|--:|
| / | 93 |
| /aircraft | 78 |
| /partnerships | 61 |
| /admin | 43 |
| /partnerships/seeking | 20 |
| /admin/listings | 13 |
| /tools | 11 |
| /saved | 8 |
| /guides | 8 |
| /searches | 8 |

---

**13 cycles landed on staging across 9 pages.** Review the live staging site (you must be logged into Vercel), then tell Claude which pages to promote — or "promote everything."

Staging site: https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app

---

## /aircraft — Planes for Sale (marketplace)  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft)

- **New "Aerobatic Aircraft for Sale" mission landing page added.** `/aircraft/mission/aerobatic` is the 10th curated mission page in the family, targeting "aerobatic aircraft for sale", "Pitts Special for sale", "Extra 300 for sale", and related buyer queries. It has a unique H1, three paragraphs of editorial buyer guidance (aerobatic certification and popular types — Pitts, Extra 300/330, Decathlon, Citabria, Great Lakes, Edge 540; training requirements including FAR 91.303/91.307 and IAC; pre-purchase inspection considerations including G-log, airframe stress history, control rigging, prop strikes), a 4-question FAQ accordion with matching FAQPage JSON-LD (what makes an aircraft aerobatic certified, FAA rating requirements, popular used types, pre-purchase inspection), and the live listing grid filtered by `q=aerobatic` (honest empty-state if no matching inventory, though several listings DID match on production data). An "Aerobatic" chip was also added to `AircraftChipBar` on `/aircraft`, providing an internal link from the hub into the new page. 2 files: `src/lib/missions.ts` + `src/components/AircraftChipBar.tsx`. Mission family now has 10 members. _(cycle: aerobatic-mission-page)_
- **Buyers no longer need to memorize ICAO codes to filter by airport.** The "Near airport (ICAO)" input on `/aircraft` and the "Home Airport" chip input on `/partnerships` now show a smart autocomplete dropdown as you type — accepting city names ("Oakland"), IATA codes ("SFO"), ICAO codes ("KSFO"), or airport names. Suggestions are ranked by airport size (large → small) then commercial status; heliports, seaplane bases, and closed airports are filtered out. Selecting a suggestion sets the filter to the correct ICAO and closes the dropdown. Keyboard navigation (↑/↓ to move, Enter to pick, Escape to close) works on both inputs. New reusable `AirportAutocompleteInput` component (debounced 200ms Supabase query, onMouseDown+preventDefault keeps focus during selection); 3 files: new component + wired into `AircraftSaleFilters.tsx` + `PartnershipFilters.tsx` (removed now-redundant `airportDraft` state + `commitAirportDraft`). _(cycle: airport-autocomplete-filter)_
- **Buyers can now filter aircraft for sale by airport.** A new "Near airport (ICAO)" text input appears in the "More filters" section on `/aircraft`. Type a 4-letter ICAO code (e.g. KSFO, KHWD, KPAO) and press Enter or blur the field — the page reloads showing only aircraft based in that airport's state (KSFO → California). An active "Near KSFO" chip appears above the results with an × to clear it. "More filters" auto-expands when an airport filter is already in the URL (e.g. from a saved search). Server-side: the ICAO is looked up against the `airports` table, resolved to a US state, then applied as `.eq('state', …)` on the listing query. Falls back gracefully when the code isn't in our table (shows all listings, no crash). 3 files: `AircraftSaleList.tsx` (Filters interface + fetchAircraftPage airport→state lookup), `AircraftSaleFilters.tsx` (Near airport input + SECONDARY_KEYS), `ActiveFilterChips.tsx` (Near KSFO chip). _(cycle: aircraft-airport-filter)_
- **New "Floatplane & Amphib Aircraft for Sale" mission landing page added.** `/aircraft/mission/floatplane` is the 9th curated mission page in the family, targeting "floatplane for sale", "seaplane for sale", and "amphibious aircraft for sale" buyer queries. It has a unique H1, three paragraphs of editorial buyer guidance (straight floats vs amphib vs flying boats, popular types like Cessna 180/185 on floats, Super Cub, Beaver, Lake Amphibian; the SES rating and where float flying is popular; float-specific pre-purchase inspection considerations), a 4-question FAQ accordion with matching FAQPage JSON-LD (floatplane vs amphib, SES rating, maintenance concerns, US geography), and the live listing grid filtered by `q=float` (honest empty-state if no matching inventory). A "Floatplane" chip was also added to `AircraftChipBar` on `/aircraft`, providing an internal link from the hub into the new page. 2 files: `src/lib/missions.ts` + `src/components/AircraftChipBar.tsx`. Mission family now has 9 members. _(cycle: floatplane-mission-page)_
- **New "Turboprop Aircraft for Sale" mission landing page added.** `/aircraft/mission/turboprop` is the 8th curated mission page in the family, targeting "turboprop aircraft for sale" and "turbine aircraft for sale" buyer queries. It has a unique H1, three paragraphs of editorial guidance (what turboprops are, the financial reality of acquisition + engine overhaul costs + type ratings, and what to check in a pre-purchase), a 4-question FAQ accordion with matching FAQPage JSON-LD, the live turboprop listing grid (currently no DB inventory matches the `q=turboprop` keyword — honest empty state), alert signup, and cross-links to the mission family and make pages. A "Turboprop" chip was also added to `AircraftChipBar` on `/aircraft` for an internal link from the hub. 2 files: `src/lib/missions.ts` + `src/components/AircraftChipBar.tsx`. _(cycle: turboprop-mission-page)_

---

## /aircraft/[make]/[model] — Make + Model "for sale" pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/mission/aerobatic)

- **New "Aerobatic Aircraft for Sale" mission landing page added.** `/aircraft/mission/aerobatic` is the 10th curated mission page in the family, targeting "aerobatic aircraft for sale", "Pitts Special for sale", "Extra 300 for sale", and related buyer queries. It has a unique H1, three paragraphs of editorial buyer guidance (aerobatic certification and popular types — Pitts, Extra 300/330, Decathlon, Citabria, Great Lakes, Edge 540; training requirements including FAR 91.303/91.307 and IAC; pre-purchase inspection considerations including G-log, airframe stress history, control rigging, prop strikes), a 4-question FAQ accordion with matching FAQPage JSON-LD (what makes an aircraft aerobatic certified, FAA rating requirements, popular used types, pre-purchase inspection), and the live listing grid filtered by `q=aerobatic` (honest empty-state if no matching inventory, though several listings DID match on production data). An "Aerobatic" chip was also added to `AircraftChipBar` on `/aircraft`, providing an internal link from the hub into the new page. 2 files: `src/lib/missions.ts` + `src/components/AircraftChipBar.tsx`. Mission family now has 10 members. _(cycle: aerobatic-mission-page)_
- **New "Floatplane & Amphib Aircraft for Sale" mission landing page added.** `/aircraft/mission/floatplane` is the 9th curated mission page in the family, targeting "floatplane for sale", "seaplane for sale", and "amphibious aircraft for sale" buyer queries. It has a unique H1, three paragraphs of editorial buyer guidance (straight floats vs amphib vs flying boats, popular types like Cessna 180/185 on floats, Super Cub, Beaver, Lake Amphibian; the SES rating and where float flying is popular; float-specific pre-purchase inspection considerations), a 4-question FAQ accordion with matching FAQPage JSON-LD (floatplane vs amphib, SES rating, maintenance concerns, US geography), and the live listing grid filtered by `q=float` (honest empty-state if no matching inventory). A "Floatplane" chip was also added to `AircraftChipBar` on `/aircraft`, providing an internal link from the hub into the new page. 2 files: `src/lib/missions.ts` + `src/components/AircraftChipBar.tsx`. Mission family now has 9 members. _(cycle: floatplane-mission-page)_
- **User-posted aircraft listings now have a "Message seller" button.** On any `/aircraft/listing/[id]` detail page where the listing was posted directly on ClubHanger (`source='user'`), the sidebar now shows a "Contact the seller" card with a dark "Message seller" button — replacing the dead "No source link available" text. Clicking it when signed in creates or retrieves a thread and navigates to `/messages/[threadId]` (reusing the existing on-platform messaging infra). Not signed in → redirected to `/auth?next=/aircraft/listing/[id]`. Viewing your own listing → shows "This is your listing" note instead. All scraped listings (Barnstormers, AircraftForSale, etc.) continue to show the unchanged "View on {source}" external link card. 4 files: new `AircraftContactButton` client component; `getOrCreateAircraftThread` server action in `actions.ts`; detail page wired; `AircraftForSale` type adds `poster_id`; additive `aircraft_for_sale_id` column + partial unique index on `threads` in `schema.sql`. **⚠️ Human: apply migration in Supabase SQL editor** — `alter table threads add column if not exists aircraft_for_sale_id uuid references aircraft_for_sale(id) on delete cascade;` + `create unique index if not exists threads_aircraft_inquirer_uniq on threads (aircraft_for_sale_id, inquirer_id) where aircraft_for_sale_id is not null;` — until then, the Message button appears but thread creation will fail gracefully (inline error, no crash). _(cycle: aircraft-listing-contact)_
- **New "Turboprop Aircraft for Sale" mission landing page added.** `/aircraft/mission/turboprop` is the 8th curated mission page in the family, targeting "turboprop aircraft for sale" and "turbine aircraft for sale" buyer queries. It has a unique H1, three paragraphs of editorial guidance (what turboprops are, the financial reality of acquisition + engine overhaul costs + type ratings, and what to check in a pre-purchase), a 4-question FAQ accordion with matching FAQPage JSON-LD, the live turboprop listing grid (currently no DB inventory matches the `q=turboprop` keyword — honest empty state), alert signup, and cross-links to the mission family and make pages. A "Turboprop" chip was also added to `AircraftChipBar` on `/aircraft` for an internal link from the hub. 2 files: `src/lib/missions.ts` + `src/components/AircraftChipBar.tsx`. _(cycle: turboprop-mission-page)_

---

## /aircraft/[make] — Make-level for-sale pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/new)

- **Sellers can now autofill an aircraft listing from its FAA tail number.** On the "Post an Aircraft for Sale" form, the N-Number (Registration) field now has a "Look up →" button. Type a tail number (e.g. N12345) and click it — ClubHanger queries the public FAA Aircraft Registry and fills in Make (matched to the dropdown), Model, and Year, then shows a green "Found: 2006 Cessna 182T" confirmation. If the tail number isn't found or the FAA registry is unreachable, a quiet "Not found — fill in manually" hint appears and every field stays editable. One-click, accurate listings from public data; no owner names/emails are shown (FAA has none). 2 files: new `/api/faa-lookup` route (parses the FAA inquiry HTML for Mfr/Model/Year/registrant type, fails soft to HTTP 200 on any error — never 500); `PostAircraftForm.tsx` gains the Look-up button + handler (same DOM-fill pattern as the existing AI-draft autofill). _(cycle: nnumber-autofill)_
- **Aircraft for-sale listings can now include real photos.** The "Post an Aircraft for Sale" form has a new Photos section (between Aircraft Details and Listing Details) with the same drag-and-drop upload zone just shipped for partnerships: select up to 5 images (JPEG/PNG/WebP/AVIF, max 5 MB each), see thumbnail previews with a spinner while uploading, and remove any before submitting. On submit, uploaded URLs populate `aircraft_for_sale.images[]` and `image_is_placeholder` clears to `false`; submitting without photos preserves existing behavior (`images: []`, `image_is_placeholder: true`). 4 files: `PartnershipPhotoUpload.tsx` gains an optional `endpoint` prop (default `/api/upload-partnership-photo` — partnership form unaffected); new `/api/upload-aircraft-photo` route (auth-gated, validates type + size, uploads to `listing-images/aircraft-photos/`); `PostAircraftForm.tsx` adds the Photos section; `actions.ts` `createAircraftListing` reads `photo_url` fields. _(cycle: aircraft-photo-upload)_
- **The aircraft for-sale post form now has "Generate with AI ✨".** On `/aircraft/new`, a violet card above the Title/Description fields lets the seller jot stream-of-consciousness notes about their aircraft; Claude Haiku drafts a concise title (≤120 chars) and 150–300 word listing description, filling both fields for editing (not auto-submitted). Loading shows "Generating…"; errors surface inline. Rate-limited at 10/hr per user by the existing `checkAiDraftAccess()` guard. Completes feature parity with the partnership and seeking forms. 2 files: new `generateAircraftDraft` server action in `actions.ts` (same shape as `generatePartnershipDraft`/`generateSeekerDraft`); `PostAircraftForm.tsx` gains `useState`/`useTransition`/`handleGenerate` + the violet AI box. Also applies `p-4 sm:p-6` responsive padding to the form's three section cards (matches the polish already done on the partnership/seeking forms in the prior cycle). _(cycle: aircraft-for-sale-ai-draft)_

---

## /partnerships — Browse partnerships  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships)

- **Buyers no longer need to memorize ICAO codes to filter by airport.** The "Near airport (ICAO)" input on `/aircraft` and the "Home Airport" chip input on `/partnerships` now show a smart autocomplete dropdown as you type — accepting city names ("Oakland"), IATA codes ("SFO"), ICAO codes ("KSFO"), or airport names. Suggestions are ranked by airport size (large → small) then commercial status; heliports, seaplane bases, and closed airports are filtered out. Selecting a suggestion sets the filter to the correct ICAO and closes the dropdown. Keyboard navigation (↑/↓ to move, Enter to pick, Escape to close) works on both inputs. New reusable `AirportAutocompleteInput` component (debounced 200ms Supabase query, onMouseDown+preventDefault keeps focus during selection); 3 files: new component + wired into `AircraftSaleFilters.tsx` + `PartnershipFilters.tsx` (removed now-redundant `airportDraft` state + `commitAirportDraft`). _(cycle: airport-autocomplete-filter)_

---

## /messages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/messages)

- **Aircraft "Message seller" conversations now appear in the messages inbox.** The `/messages` inbox and `/messages/[threadId]` thread view were not querying the `aircraft_for_sale` relationship — so any thread created by the "Message seller" button (shipped in `aircraft-listing-contact`) was invisible in the inbox and showed "Deleted listing" in the thread header. Both pages now include `aircraft:aircraft_for_sale(id, title, year, make, model, registration)` in the thread select. The inbox row shows the aircraft listing title with year/make/model/registration as a subtitle. The thread view header shows the listing title linked back to `/aircraft/listing/[id]`. Partnership and seeker thread rendering is unchanged. 2 files: `src/app/messages/page.tsx`, `src/app/messages/[threadId]/page.tsx`. _(cycle: aircraft-threads-in-inbox)_

---

## /messages/[threadId]

- **Aircraft "Message seller" conversations now appear in the messages inbox.** The `/messages` inbox and `/messages/[threadId]` thread view were not querying the `aircraft_for_sale` relationship — so any thread created by the "Message seller" button (shipped in `aircraft-listing-contact`) was invisible in the inbox and showed "Deleted listing" in the thread header. Both pages now include `aircraft:aircraft_for_sale(id, title, year, make, model, registration)` in the thread select. The inbox row shows the aircraft listing title with year/make/model/registration as a subtitle. The thread view header shows the listing title linked back to `/aircraft/listing/[id]`. Partnership and seeker thread rendering is unchanged. 2 files: `src/app/messages/page.tsx`, `src/app/messages/[threadId]/page.tsx`. _(cycle: aircraft-threads-in-inbox)_

---

## /partnerships/new  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/new)

- **Partnership listings can now include real photos.** The "Post a Partnership" form has a new Photos section with a drag-and-drop zone (click-to-browse fallback): select up to 5 images (JPEG/PNG/WebP/AVIF, max 5 MB each), see thumbnail previews with a spinner while uploading, and remove any before submitting. On submit, the uploaded URLs write into `partnerships.images[]` and `image_is_placeholder` is cleared, so the PhotoGallery on the listing detail page shows the real photos immediately. 4 new/modified files: `/api/upload-partnership-photo` route (auth-gated, validates type + size, uploads to `listing-images` bucket); `PartnershipPhotoUpload` client component (DnD zone, thumbnail row, add-more tile, inline errors); `PostPartnershipForm.tsx` (Photos section above Listing Details); `actions.ts` `createPartnership` (reads `photo_url` fields, sets `images` + clears placeholder flag). _(cycle: partnership-photo-upload)_

---

## /partnerships/[id]

- **Desktop users can now message a partnership owner directly from the listing page.** Previously, the desktop "Interested?" sidebar card showed only "Send Email" + phone. Mobile had the "Message" button in the sticky bar. Now the desktop sidebar card also shows a dark "Message" button (above Email/phone) — clicking it creates or opens a thread at `/messages/[threadId]` when signed in, redirects to auth when not. The button is hidden when viewing your own listing or when the listing has no `poster_id` (scraped listings without a ClubHanger account), matching mobile behavior exactly. 2 files: `ContactButtons.tsx` (add `posterId` prop, auth state, message handler — mirrors `ContactBar`); `partnerships/[id]/page.tsx` (pass `posterId={p.poster_id}` to `ContactButtons`). _(cycle: partnership-desktop-message-button)_

---

## /searches  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/searches)

- **Saved Searches now has a clear link to email notification settings.** A "Manage email notification settings" link with a Bell icon appears in the `/searches` page header, below the subheading — visible whether the user has any saved searches or not. Clicking it goes to `/account` (the email-alerts hub). Closes the `[P3][want]` backlog item. _(cycle: searches-email-settings-link)_

---

## 🧪 Code-quality spot-checks — 3 judged, avg 4.0/5

- **aerobatic-mission-page — 4/5** — `filters: { q: 'aerobatic' }` is a literal keyword match, but real listings advertise the model name ("Pitts", "Extra 300", "Decathlon") not the word "aerobatic", so the live grid will likely be sparse/empty — the editorial names those types richly but the filter doesn't search for them; same soft spot flagged on twin-stol. Minor substance overlap between intro para 2 and FAQ 2 (both cover 91.303/91.307/IAC), though wording is distinct as the interface requires.
- **partnership-desktop-message-button — 4/5** — Message button omits the `track('contact_initiated', { method: 'message' })` analytics call that the sibling email/phone buttons in the SAME component fire — so desktop message intents go uncounted; also duplicates the ~15-line auth-effect + handler verbatim from ContactBar rather than a shared hook (consistent with existing codebase pattern, but debt compounds).
- **aircraft-mission-twin-stol — 4/5** — `filters: { q: 'stol' }` keyword match likely yields a sparse/empty live grid (few listings literally say "STOL"), and `q: 'twin'` is broad enough to admit some false positives; both are honestly disclosed in the editorial so neither reads as a doorway page, but grid quality on /stol is the soft spot.

---

## To ship
Tell Claude "promote /aircraft" (or any pages above), or "promote everything." Claude merges the chosen work staging→main, which deploys to clubhanger.com.
