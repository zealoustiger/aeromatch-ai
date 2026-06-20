# Overnight review — night of June 18→19

8 cycles ran, all passed, across **4 pages** + the nav. This work is already
**live in production** (promoted the morning of June 19), so the links below go
to the real site — no login needed.

Live site: https://clubhanger.com

---

## /aircraft — Planes for Sale  ·  [open ↗](https://clubhanger.com/aircraft)
The biggest focus — 6 of 8 cycles. The filter overhaul (your P1) plus the plumbing it needed.
- **Make + Model filters** — real dropdowns now lead the panel; Model options follow the selected Make (replaced the old free-text box).
- **"More filters" disclosure** — State, Max Price, Min Year, and a new **Max Total Time (hrs)** filter, tucked behind a collapsible section that's collapsed by default (cleaner than Controller).
- **True match count** — header shows the real total (e.g. "1,856 aircraft for sale") instead of capping at "60+", which had made filtering look broken.
- **Pagination** — the full result set is now paged ("Showing 61–120 of 1,856") instead of only ever showing the first 60.
- **Numbered page buttons** — 1 2 … 31 with the current page highlighted, not just Prev/Next.
- **"Save this search"** button — appears once a filter is active (logged-out → sign-up gate).

## /partnerships  ·  [open ↗](https://clubhanger.com/partnerships)
- **Heart / Save button** on every partnership card (top-right of the photo) and a "Save" button on each listing's detail page. Logged-out click → registration gate; logged-in → saves it. (Save/Favorite slice 1.)

## /saved — My Saved Listings  ·  [open ↗](https://clubhanger.com/saved)
- **New page.** Lists every partnership you've hearted, newest first. (Sign in to see it — it redirects to login when logged out, which is intended.)

## /searches  ·  [open ↗](https://clubhanger.com/searches)
- Saved searches are now **marketplace-aware**: an aircraft search you save replays against `/aircraft` (not `/partnerships`), with a "Planes for Sale" label.

## Site-wide
- **"Saved" nav link** (heart icon) added to the desktop nav and mobile menu, for logged-in users.

---

## Needs your attention
- **Database changes** (both additive, owner-only access — I verified the security): a new `saved_listings` table (your hearts) and a `path` column on saved searches. Note prod + staging share one DB.
- **Two things to click-test yourself:** the logged-in heart → `/saved` round trip, and the logged-out sign-up gate. I verified the code and security, but not a live click-through with a real account.
- **NOT done (blocked overnight):** the "real plane photos missing" bug — `/aircraft` cards still show placeholder photos. It overlapped the scraper work that's now unblocked. **Aircraft favorites** (a heart on plane-for-sale cards) also not built yet — only partnerships have hearts.
- **Untouched backlog:** AI natural-language search, the map view, listing comparison, and the partnerships Available/Seeking toggle. The loop went deep on `/aircraft` filters rather than broad.

## To ship / next
Already shipped. The obvious next target is the **photos bug** — and I'd suggest we do that one together (it's a data-pipeline diagnosis, not a good overnight-guess task).
