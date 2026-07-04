## 2026-07-04T13:28:50Z — Night Shift run: 1 cycles (PASS 1 / FAIL 0) — night ended
- Models: cycles on sonnet; 0 escalated to opus; 1 quality-judged on opus

- PASS — partnership-deal-check-card-parity — Partnership cards on `/partnerships`, `/saved`, near/[icao], and the detail-page Similar partnerships rail now show the narrowed Goo


# Overnight review — 2026-07-03

## 📊 Traffic (PostHog) — as of 2026-07-03

- **Visitors:** 35 all-time · 23 in the last 7 days
- **Pageviews:** 714 all-time · 270 in the last 7 days
- **Not from Oakland:** 33 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

---

## 🧭 Visitors — day-over-day & week-over-week

_Real visitors (bots excluded), first-party, Pacific-day windows — matches the live `/admin` card._

- **Totals:** 0 yesterday _(vs 6 the day before)_ · 28 last 7 days _(vs 4 the prior 7)_

**Visitors by city**  ·  _Δ d/d = yesterday vs. the day before · Δ w/w = last 7 days vs. the prior 7_

| City | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| CA | 0 | ▼ −3 | 3 | ▲ +2 |
| Unknown | 0 | — | 3 | ▲ +3 |
| US | 0 | — | 3 | ▲ +3 |
| Fishkill, NY | 0 | — | 2 | ▲ +2 |
| Memphis, TN | 0 | — | 2 | ▲ +2 |
| Arlington, VA | 0 | — | 1 | ▲ +1 |
| Ashburn, VA | 0 | — | 1 | ▲ +1 |
| Bethel, ME | 0 | — | 1 | ▲ +1 |
| Boulder, CO | 0 | ▼ −1 | 1 | ▲ +1 |
| Canary Wharf, ENG | 0 | ▼ −1 | 1 | ▲ +1 |

**Top landing pages**

| Page | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| / | 0 | ▼ −2 | 9 | ▲ +6 |
| /aircraft/listing/1350cd7e-6fa5-4c4d-bbb8-d5d6c1f77389 | 0 | — | 6 | ▲ +6 |
| /aircraft/for-sale/arkansas | 0 | — | 4 | ▲ +4 |
| /aircraft/listing/b7f5200a-6b6f-4077-b4cc-3d3471bf5b27 | 0 | ▼ −2 | 2 | ▲ +2 |
| /aircraft/listing/119eac1e-1ea0-4a77-8ef7-cf8417bc7f6a | 0 | — | 1 | ▲ +1 |
| /partnerships | 0 | — | 1 | ▲ +1 |
| /partnerships/browse | 0 | — | 1 | ▲ +1 |
| /partnerships/dcd64d61-0bce-4992-86c8-dc3bebfea2ed | 0 | ▼ −1 | 1 | ▲ +1 |
| /partnerships/make/cirrus | 0 | ▼ −1 | 1 | ▲ +1 |
| /partnerships/seeking | 0 | — | 1 | ▲ +1 |

---

**7 cycles landed on staging across 13 pages.** Review the live staging site (you must be logged into Vercel), then tell Claude which pages to promote — or "promote everything."

Staging site: https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app

---

## /aircraft/[make] — Make-level for-sale pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/new)

- **The "Prefill from your notes ✨" box on the Sell Your Aircraft form now also accepts a link.** Instead of copy-pasting the text of an existing listing (Barnstormers, Controller, TradeAPlane, etc.), a seller can just paste the URL — the server fetches that page, reads it, and fills make/model/year/hours/price/airport/title/description exactly like pasted text already did. Paste-a-URL was the one piece of the "paste & prefill the whole form" backlog item that wasn't shipped yet (the pasted-text half, mapping nearly every field, was already live). _(cycle: aircraft-url-prefill)_
- **Aircraft-for-sale posters can now fix a typo or update the price/specs on a listing they already published** — before, posting was a one-way door: no `update*Listing` action existed for any of the three post types, and `/listings` only offered View / Mark as sold. Adds a new "Edit" link on each active aircraft listing in `/listings` → `/aircraft/listing/[id]/edit`, which renders the same aircraft form prefilled with the listing's current make/model/year/registration/ttaf/smoh/engine_type/price/title/description/photos. Saving updates the row in place and redirects back to the listing with a "Your changes are saved" banner (mirrors the existing "Your listing is live!" post-publish banner). Ownership-scoped exactly like `deactivateListing`/`relistListing` (`.eq('poster_id', user.id)`); visiting someone else's edit URL or a nonexistent one 404s (same response either way — never reveals a listing exists to a non-owner); visiting while logged out redirects to `/auth?next=...`. **Data-integrity catch during build:** the row only ever stored the airport's *derived* city/state, never the raw ICAO the poster typed at post time — so the edit form can't prefill the "Based at" field, and naively wiping location/state on every save (since the field would load empty) would have silently destroyed real listings' location data on their first edit. Fixed by only touching `location`/`state` in the update when the poster actually re-supplies an airport; otherwise the stored value is left untouched, and a "Currently: Austin, TX" hint is shown next to the blank field for context. The 3-post-type create flow (`/aircraft/new`) is untouched — same draft key, same behavior, verified via smoke + screenshot. _(cycle: aircraft-listing-edit)_
- **A visitor who starts filling out a "Post a…" form and navigates away before publishing now gets reminded where to pick back up.** All three post forms (`/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new`) already autosave the in-progress form to the browser via `useFormDraft` — but until now, that saved progress was invisible anywhere except the exact post page itself, so a distracted or interrupted poster had no cue to return and finish. A new small, dismissible card now floats bottom-left on every page ("Unfinished listing — Draft in progress: {aircraft partnership listing / aircraft for sale listing / pilot-seeking listing} — Continue draft →") whenever a draft exists in `localStorage`, linking straight back to the right form. It self-suppresses on the draft's own post page (which already shows its own "Draft restored" indicator) and, once dismissed, stays hidden for the rest of that browsing session — dismissing does not delete the saved draft. Positioned to never overlap the existing bottom-right Feedback button. Pure client-side read of the existing autosave keys; no new storage format, no schema change, no change to the three post forms themselves. _(cycle: draft-resume-banner)_

---

## /partnerships/new  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/new)

- **Partnership posters can now fix a typo or update terms/price/specs on a listing they already published** — extends last cycle's aircraft-listing edit flow to the second post type. Adds a new "Edit" link on each active partnership listing in `/listings` → `/partnerships/[id]/edit`, which renders the same partnership form (`PostPartnershipForm`, now with a `mode="edit"`) prefilled with the listing's current make/model/year/registration/home airport/share type/buy-in/costs/specs/title/description/photos/contact info. Saving updates the row in place and redirects back to the listing with a "Your changes are saved" banner (mirrors the aircraft edit flow's banner). Ownership-scoped exactly like `updateAircraftListing`/`deactivateListing` (`.eq('poster_id', user.id)`); visiting someone else's edit URL or a nonexistent one 404s (same response either way); visiting while logged out redirects to `/auth?next=...`. **Simpler than the aircraft case:** `partnerships.home_airport` stores the raw ICAO directly (not just the derived city/state, unlike `aircraft_for_sale`), so the edit form can always prefill "Home Airport" and the action always safely re-derives `airport_name`/`city`/`state` on save — no "only touch if resupplied" special-case was needed here. The 3-post-type create flow (`/partnerships/new`) is untouched — same draft key, same behavior for a logged-out or first-time poster. _(cycle: partnership-listing-edit)_
- **A visitor who starts filling out a "Post a…" form and navigates away before publishing now gets reminded where to pick back up.** All three post forms (`/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new`) already autosave the in-progress form to the browser via `useFormDraft` — but until now, that saved progress was invisible anywhere except the exact post page itself, so a distracted or interrupted poster had no cue to return and finish. A new small, dismissible card now floats bottom-left on every page ("Unfinished listing — Draft in progress: {aircraft partnership listing / aircraft for sale listing / pilot-seeking listing} — Continue draft →") whenever a draft exists in `localStorage`, linking straight back to the right form. It self-suppresses on the draft's own post page (which already shows its own "Draft restored" indicator) and, once dismissed, stays hidden for the rest of that browsing session — dismissing does not delete the saved draft. Positioned to never overlap the existing bottom-right Feedback button. Pure client-side read of the existing autosave keys; no new storage format, no schema change, no change to the three post forms themselves. _(cycle: draft-resume-banner)_
- **Pasting a partnership listing that names an N-number but omits make/model/year now auto-completes the aircraft identity from the FAA registry — no extra click.** Before, `/partnerships/new`'s AI draft would fill whatever it could extract from the pasted text, but if the text said e.g. "1/3 share available in N739WL, based at KAUS, $15k buy-in" (N-number present, make/model/year absent), the poster was left to press "Look up →" manually to fill the aircraft. Now, after the AI draft populates, if `result.registration` is present and make/model/year are still incomplete, the form auto-chains an FAA registry lookup and backfills **only the empty fields** — a `{ onlyEmpty: true }` option added to `handleLookup` so the registry never clobbers a make/model/year the AI already extracted. The manual "Look up →" button and blur-triggered lookup are unchanged (default `onlyEmpty: false`, authoritative overwrite). This is a byte-for-byte mirror of the chained backfill `PostAircraftForm` already ships, closing the last paste-and-prefill parity gap between the two post forms. Purely UI-side chaining — reuses the existing `/api/faa-lookup` route; no extraction-schema change, no DB migration, additive only. _(cycle: partnership-ai-faa-backfill)_

---

## /aircraft/[make]/[model] — Make + Model "for sale" pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/cessna/182)

- **Aircraft-for-sale posters can now fix a typo or update the price/specs on a listing they already published** — before, posting was a one-way door: no `update*Listing` action existed for any of the three post types, and `/listings` only offered View / Mark as sold. Adds a new "Edit" link on each active aircraft listing in `/listings` → `/aircraft/listing/[id]/edit`, which renders the same aircraft form prefilled with the listing's current make/model/year/registration/ttaf/smoh/engine_type/price/title/description/photos. Saving updates the row in place and redirects back to the listing with a "Your changes are saved" banner (mirrors the existing "Your listing is live!" post-publish banner). Ownership-scoped exactly like `deactivateListing`/`relistListing` (`.eq('poster_id', user.id)`); visiting someone else's edit URL or a nonexistent one 404s (same response either way — never reveals a listing exists to a non-owner); visiting while logged out redirects to `/auth?next=...`. **Data-integrity catch during build:** the row only ever stored the airport's *derived* city/state, never the raw ICAO the poster typed at post time — so the edit form can't prefill the "Based at" field, and naively wiping location/state on every save (since the field would load empty) would have silently destroyed real listings' location data on their first edit. Fixed by only touching `location`/`state` in the update when the poster actually re-supplies an airport; otherwise the stored value is left untouched, and a "Currently: Austin, TX" hint is shown next to the blank field for context. The 3-post-type create flow (`/aircraft/new`) is untouched — same draft key, same behavior, verified via smoke + screenshot. _(cycle: aircraft-listing-edit)_
- **Aircraft-for-sale listing pages now show the same "save $X/yr vs. renting" comparison that partnership listings already had.** Before, a buyer looking at a plane's "Cost to own" panel saw the monthly/annual cost to own but had no anchor for whether that beat renting the equivalent aircraft. Now, for whichever ownership split is selected (sole / 1/2 / 1/3 / 1/4 share), a callout shows either "Save $X/yr vs. renting at $150/hr — the $Y buy-in recouped in ≈N yrs at this rate" (emerald, when ownership is cheaper) or an honest inverse note ("renting would be $X cheaper annually — fly more to see ownership savings") when it isn't — never hides the module, never fabricates a number. Verified both branches: a $52,000 Cessna 172 at sole-owner share shows the honest "renting is cheaper" note; the same listing at a 1/4 share flips to "Save $370/yr... recouped in ≈35.1 yrs." _(cycle: aircraft-cost-vs-renting)_

---

## /partnerships — Browse partnerships  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships)

- **Partnership listing cards now show how fresh they are** — a "Listed N days ago" line (with a calendar icon) in the card footer, plus a green-ish amber **"New"** badge on shares posted in the last 7 days. A shopper scanning `/partnerships` can now tell a just-opened share from one that's been sitting for months, without clicking in. Mirrors the exact freshness treatment aircraft-for-sale cards already had (`AircraftSaleCard`), closing a browse-surface parity gap between the two marketplaces. _(cycle: partnership-card-freshness)_

---

## /partnerships/make/[make] — Partnerships by make  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/make/cessna)

- **Partnership listing cards now show how fresh they are** — a "Listed N days ago" line (with a calendar icon) in the card footer, plus a green-ish amber **"New"** badge on shares posted in the last 7 days. A shopper scanning `/partnerships` can now tell a just-opened share from one that's been sitting for months, without clicking in. Mirrors the exact freshness treatment aircraft-for-sale cards already had (`AircraftSaleCard`), closing a browse-surface parity gap between the two marketplaces. _(cycle: partnership-card-freshness)_

---

## /partnerships/near/[airport] — Partnerships near an airport  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/near/khwd)

- **Partnership listing cards now show how fresh they are** — a "Listed N days ago" line (with a calendar icon) in the card footer, plus a green-ish amber **"New"** badge on shares posted in the last 7 days. A shopper scanning `/partnerships` can now tell a just-opened share from one that's been sitting for months, without clicking in. Mirrors the exact freshness treatment aircraft-for-sale cards already had (`AircraftSaleCard`), closing a browse-surface parity gap between the two marketplaces. _(cycle: partnership-card-freshness)_

---

## /partnerships/state/[state] — Partnerships by state  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/state/ca)

- **Partnership listing cards now show how fresh they are** — a "Listed N days ago" line (with a calendar icon) in the card footer, plus a green-ish amber **"New"** badge on shares posted in the last 7 days. A shopper scanning `/partnerships` can now tell a just-opened share from one that's been sitting for months, without clicking in. Mirrors the exact freshness treatment aircraft-for-sale cards already had (`AircraftSaleCard`), closing a browse-surface parity gap between the two marketplaces. _(cycle: partnership-card-freshness)_

---

## /saved — My saved listings  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/saved)

- **Partnership listing cards now show how fresh they are** — a "Listed N days ago" line (with a calendar icon) in the card footer, plus a green-ish amber **"New"** badge on shares posted in the last 7 days. A shopper scanning `/partnerships` can now tell a just-opened share from one that's been sitting for months, without clicking in. Mirrors the exact freshness treatment aircraft-for-sale cards already had (`AircraftSaleCard`), closing a browse-surface parity gap between the two marketplaces. _(cycle: partnership-card-freshness)_

---

## /partnerships/[id]/edit

- **Partnership posters can now fix a typo or update terms/price/specs on a listing they already published** — extends last cycle's aircraft-listing edit flow to the second post type. Adds a new "Edit" link on each active partnership listing in `/listings` → `/partnerships/[id]/edit`, which renders the same partnership form (`PostPartnershipForm`, now with a `mode="edit"`) prefilled with the listing's current make/model/year/registration/home airport/share type/buy-in/costs/specs/title/description/photos/contact info. Saving updates the row in place and redirects back to the listing with a "Your changes are saved" banner (mirrors the aircraft edit flow's banner). Ownership-scoped exactly like `updateAircraftListing`/`deactivateListing` (`.eq('poster_id', user.id)`); visiting someone else's edit URL or a nonexistent one 404s (same response either way); visiting while logged out redirects to `/auth?next=...`. **Simpler than the aircraft case:** `partnerships.home_airport` stores the raw ICAO directly (not just the derived city/state, unlike `aircraft_for_sale`), so the edit form can always prefill "Home Airport" and the action always safely re-derives `airport_name`/`city`/`state` on save — no "only touch if resupplied" special-case was needed here. The 3-post-type create flow (`/partnerships/new`) is untouched — same draft key, same behavior for a logged-out or first-time poster. _(cycle: partnership-listing-edit)_

---

## /partnerships/[id]

- **Partnership posters can now fix a typo or update terms/price/specs on a listing they already published** — extends last cycle's aircraft-listing edit flow to the second post type. Adds a new "Edit" link on each active partnership listing in `/listings` → `/partnerships/[id]/edit`, which renders the same partnership form (`PostPartnershipForm`, now with a `mode="edit"`) prefilled with the listing's current make/model/year/registration/home airport/share type/buy-in/costs/specs/title/description/photos/contact info. Saving updates the row in place and redirects back to the listing with a "Your changes are saved" banner (mirrors the aircraft edit flow's banner). Ownership-scoped exactly like `updateAircraftListing`/`deactivateListing` (`.eq('poster_id', user.id)`); visiting someone else's edit URL or a nonexistent one 404s (same response either way); visiting while logged out redirects to `/auth?next=...`. **Simpler than the aircraft case:** `partnerships.home_airport` stores the raw ICAO directly (not just the derived city/state, unlike `aircraft_for_sale`), so the edit form can always prefill "Home Airport" and the action always safely re-derives `airport_name`/`city`/`state` on save — no "only touch if resupplied" special-case was needed here. The 3-post-type create flow (`/partnerships/new`) is untouched — same draft key, same behavior for a logged-out or first-time poster. _(cycle: partnership-listing-edit)_

---

## /aircraft/[make]/[model]/[state] — Model-in-state for-sale pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/cessna/182/ca)

- **Aircraft-for-sale posters can now fix a typo or update the price/specs on a listing they already published** — before, posting was a one-way door: no `update*Listing` action existed for any of the three post types, and `/listings` only offered View / Mark as sold. Adds a new "Edit" link on each active aircraft listing in `/listings` → `/aircraft/listing/[id]/edit`, which renders the same aircraft form prefilled with the listing's current make/model/year/registration/ttaf/smoh/engine_type/price/title/description/photos. Saving updates the row in place and redirects back to the listing with a "Your changes are saved" banner (mirrors the existing "Your listing is live!" post-publish banner). Ownership-scoped exactly like `deactivateListing`/`relistListing` (`.eq('poster_id', user.id)`); visiting someone else's edit URL or a nonexistent one 404s (same response either way — never reveals a listing exists to a non-owner); visiting while logged out redirects to `/auth?next=...`. **Data-integrity catch during build:** the row only ever stored the airport's *derived* city/state, never the raw ICAO the poster typed at post time — so the edit form can't prefill the "Based at" field, and naively wiping location/state on every save (since the field would load empty) would have silently destroyed real listings' location data on their first edit. Fixed by only touching `location`/`state` in the update when the poster actually re-supplies an airport; otherwise the stored value is left untouched, and a "Currently: Austin, TX" hint is shown next to the blank field for context. The 3-post-type create flow (`/aircraft/new`) is untouched — same draft key, same behavior, verified via smoke + screenshot. _(cycle: aircraft-listing-edit)_

---

## /partnerships/seeking/new  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/seeking/new)

- **A visitor who starts filling out a "Post a…" form and navigates away before publishing now gets reminded where to pick back up.** All three post forms (`/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new`) already autosave the in-progress form to the browser via `useFormDraft` — but until now, that saved progress was invisible anywhere except the exact post page itself, so a distracted or interrupted poster had no cue to return and finish. A new small, dismissible card now floats bottom-left on every page ("Unfinished listing — Draft in progress: {aircraft partnership listing / aircraft for sale listing / pilot-seeking listing} — Continue draft →") whenever a draft exists in `localStorage`, linking straight back to the right form. It self-suppresses on the draft's own post page (which already shows its own "Draft restored" indicator) and, once dismissed, stays hidden for the rest of that browsing session — dismissing does not delete the saved draft. Positioned to never overlap the existing bottom-right Feedback button. Pure client-side read of the existing autosave keys; no new storage format, no schema change, no change to the three post forms themselves. _(cycle: draft-resume-banner)_

---

## / — Homepage  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/)

- **A visitor who starts filling out a "Post a…" form and navigates away before publishing now gets reminded where to pick back up.** All three post forms (`/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new`) already autosave the in-progress form to the browser via `useFormDraft` — but until now, that saved progress was invisible anywhere except the exact post page itself, so a distracted or interrupted poster had no cue to return and finish. A new small, dismissible card now floats bottom-left on every page ("Unfinished listing — Draft in progress: {aircraft partnership listing / aircraft for sale listing / pilot-seeking listing} — Continue draft →") whenever a draft exists in `localStorage`, linking straight back to the right form. It self-suppresses on the draft's own post page (which already shows its own "Draft restored" indicator) and, once dismissed, stays hidden for the rest of that browsing session — dismissing does not delete the saved draft. Positioned to never overlap the existing bottom-right Feedback button. Pure client-side read of the existing autosave keys; no new storage format, no schema change, no change to the three post forms themselves. _(cycle: draft-resume-banner)_

---

## 🧪 Code-quality spot-checks — 6 judged, avg 4.2/5

- **seeker-message-draft-persist — 4/5** — Inherits the exact weakness the sibling `aircraft-message-draft-persist` cycle was flagged for — both send paths `await sendMessage(...)` but discard its `{ error }` return and `clearMessageDraft` + navigate unconditionally, so a failed insert or an over-length body (textarea has no `maxLength`; action rejects >2000 chars) silently drops the very message the feature exists to preserve and lands the user on an empty thread. This was a known issue at port time and should ideally have been fixed here rather than duplicated.
- **aircraft-message-draft-persist — 4/5** — Both send paths `await sendMessage(...)` but discard its `{ error }` return and clear the draft + navigate unconditionally — so a failed insert or an over-length body (textarea has no `maxLength`; the action rejects >2000 chars as "Invalid message.") silently drops the exact message the feature exists to preserve, landing the user on an empty thread with no error. Minor: spec says "sessionStorage" but impl uses localStorage (arguably the better call for redirect durability; just a doc/impl mismatch).
- **airport-icao-server-validation — 4/5** — The identical error-message string is copy-pasted across all 6 actions (2 wording variants) rather than a shared constant — minor DRY smell, though consistent with this file's already-heavily-duplicated action bodies.
- **saved-aircraft-comp-verdict — 4/5** — comp query is scoped broadly by `make` with `.limit(2000)` whereas browse surfaces query make+model at `.limit(5000)` — for a very high-volume make a family could be under-sampled (or arbitrarily truncated), so the chip could differ from or drop vs. the browse page; low-probability on `/saved` (few saved makes) but not "exactly like" in that edge.
- **partnership-ai-faa-backfill — 4/5** — none material — minor: make/model/year inputs are re-queried both in handleGenerate and again inside handleLookup, and the whole flow leans on DOM querying over React state, but both match the sibling form's established convention exactly.
- **aircraft-deals-candidate-scan-fix — 5/5** — none material — inherits the file-wide pattern of a full-population `select('*')` scan per render (uncached), fine at ~2121 rows but worth watching as the table grows; pre-existing, out of scope here.

---

## To ship
Tell Claude "promote /aircraft" (or any pages above), or "promote everything." Claude merges the chosen work staging→main, which deploys to clubhanger.com.
