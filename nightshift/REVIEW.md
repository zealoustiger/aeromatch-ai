## 2026-07-05T13:23:43Z — Night Shift run: 18 cycles (PASS 18 / FAIL 0) — night ended
- Models: cycles on sonnet; 0 escalated to opus; 5 quality-judged on opus

- PASS — seeker-cost-panel — Added a flying-cost estimate panel (annual/per-hour cost, break-even vs. renting) to the seeker detail page (`/partnerships/seeking/[id]`), reusing t
- PASS — nav-signin-homepage-next — fixed homepage Sign in landing on Saved Searches instead of the homepage after auth, by passing `next=/` explicitly instead of omitting it.
- PASS — seeker-edit-additional-airports-fallback — Fixed a live bug where `/partnerships/seeking/[id]/edit` 404'd for every owner (its query explicitly selected the not-yet-migr
- PASS — partnership-market-check-range-bar — Partnership listing pages now show a visual price-range bar (low–high spread, median tick, this listing marker) and percentile fra
- PASS — aircraft-edit-redirect-fix — fixed the aircraft edit form's auth redirect so a logged-out/session-expired edit now returns you to your edit page instead of a blank new-p
- PASS — airport-input-invalid-scroll-focus — Fixed the shared airport-code field (used on all 3 post/edit forms) so an invalid submit scrolls the field into view and focuses it 
- PASS — partnership-deal-signals-tally — added favor/watch-out summary chips to the partnership detail page's How this partnership stacks up panel, matching the aircraft listing
- PASS — aircraft-form-live-auth-state — PostAircraftForm now tracks live auth state (mirroring Nav.tsx's getUser/onAuthStateChange) instead of a stale SSR snapshot, so a session
- PASS — airport-input-combobox-aria — added missing ARIA combobox attributes (`role`, `aria-expanded`, `aria-controls`, `aria-activedescendant`) to the shared `AirportFormInput`
- PASS — seeker-budget-check-range-bar — Ported the aircraft/partnership-side low–high spread bar onto the seeker detail page's Budget Check panel, since it already received `l
- PASS — partnership-form-live-auth-state — gave PostPartnershipForm.tsx a live client-side auth-state listener (mirrors the aircraft form's fix), so a session that expires mid-e
- PASS — post-form-details-contact-autoopen — Fixed the aircraft and partnership post/edit forms' More details section so it auto-expands in edit mode when a saved contact field 
- PASS — seeker-deal-signals-panel — added a how this seeker profile stacks up synthesis panel to `/partnerships/seeking/[id]` (budget-vs-market, preference specificity, experien
- PASS — airport-input-start-over-reset — fixed all 3 post/edit forms (aircraft, partnership, seeker) so clicking Start over/Revert changes now clears the airport field's stale i
- PASS — seeker-form-live-auth-state — Ported the live client-side auth-state listener (already on the aircraft/partnership post forms) onto `PostSeekerListingForm.tsx`, closing 
- PASS — saved-seeker-budget-verdict — /saved's seeker-listing section now shows the same honest budget vs. market chip its partnership and aircraft sections already show, closin
- PASS — seeker-details-contact-autoopen — Fixed the seeking-a-partnership edit form so More details auto-expands when a saved contact name or email exists, not just phone, match
- PASS — airport-hub-comp-verdicts — /airports/[icao]'s partnership and seeker cards now show the same honest below/above-market comp chips every sibling browse page already show


## 2026-07-05T09:56:50Z — Night Shift run: 25 cycles (PASS 24 / FAIL 1) — safety cap (25)
- Models: cycles on sonnet; 1 escalated to opus; 6 quality-judged on opus

- PASS — alert-digest-query-filter-parse — Fixed a silent bug where the scheduled alert-digest cron dropped the make/model/state/price filters from any query-parameterized alert 
- PASS — seeker-alert-support — Extended the Get alerts pipeline (digest cron + `/alerts` landing chip + inline browse-page signup) to cover pilots-seeking-a-partnership listings
- PASS — seeker-detail-relative-freshness — Fixed the pilots-seeking-a-partnership detail page to show relative Listed N days ago freshness instead of an absolute date, matching 
- cycle produced no verdict (exit 124)
- PASS — seeker-post-analytics-parity — the pilots-seeking-a-partnership post form now fires submit/edit analytics events (like the aircraft & partnership forms already do), maki
- PASS — seeker-alert-make-filter — Seeker-listing email alerts on `/partnerships/seeking` now respect an active make filter (e.g. `?make=Cessna`) instead of always alerting on a
- PASS — aircraft-trust-checklist-detail — Replaced the aircraft-for-sale detail page's disconnected Listing info completeness panel with the canonical trust checklist (same sign
- PASS — post-form-numeric-keypad — All numeric fields (price, year, hours, shares) across the three post forms (aircraft, partnership, seeker) now trigger a numeric mobile keypa
- PASS — partnerships-hub-alert-signup — added the filter-aware, no-account get alerts email signup to the `/partnerships` browse hub (Pillar 2/signup), the one major browse page
- PASS — aircraft-owner-nudge — Aircraft-for-sale listing owners now see an Improve your listing nudge on `/aircraft/listing/[id]` naming exactly which trust signals to complete 
- PASS — post-form-error-alert-role — Added `role=alert` to the submission-error message on all 3 post forms (aircraft/partnership/seeker) so screen-reader users learn why a list
- PASS — seeker-contactbar-owner-view — a seeker-listing owner viewing their own listing now sees a neutral This is your listing note instead of a broken empty contact box`
- PASS — seeker-trust-badge — Added an honest N/4 trust signals completeness chip to seeker (pilot-seeking-a-partnership) listings, closing the last Pillar-3 gap where seeker lis
- PASS — post-form-autocomplete-hints — added `autoComplete=name/email/tel` to the 7 contact-info fields across all 3 post forms (aircraft/partnership/seeker), so browser/phone s
- PASS — partnership-contactbar-owner-view — Partnership owners viewing their own listing now see This is your listing... instead of Email/Call buttons that would contact themsel
- PASS — airport-icao-inline-validation — post forms (aircraft/partnership/seeker) now flag a mistyped/nonexistent airport code inline within ~1s instead of only after a full-for
- PASS — seeker-trust-checklist-detail — Added the expanded Listing trust checklist to the seeker detail page (`/partnerships/seeking/[id]`), the last of the 3 listing types miss
- PASS — account-page-seeker-parity — fixed `/account`'s stale 2-way listing-type logic (mislabeled seeker saved searches as Partnerships) and copy gaps to match `/searches`'s al
- PASS — photo-reorder-cover — Added move-earlier/move-later buttons and a Cover badge to the shared photo uploader on the aircraft and partnership post/edit forms, so posters ca
- PASS — seeker-owner-nudge — Added an Improve your listing owner nudge to the pilot-seeking-a-partnership detail page (mirroring the existing aircraft/partnership nudges, driven
- PASS — launch-banner-honest-stats — removed a fabricated 1,247+ pilot visitors stat and an artificial floor padding the real seeker count on the `/partnerships` beta-signup ban
- PASS — seeker-ai-draft-url-guard — Fixed a Pillar-1 posting-friction gap: the seeker post form's AI Prefill from your notes box now detects a pasted URL and shows a clear messa
- PASS — listing-quality-seeker-parity — /listing-quality now documents seeker (pilots-seeking-a-partnership) trust signals in a third column matching the existing partnership/ai
- PASS — photo-mid-upload-recovery — a photo you were mid-uploading on the aircraft/partnership post or edit forms no longer vanishes if the page reloads or you navigate away dur
- PASS — photo-upload-block-submit — aircraft/partnership post forms now block Post/Save Changes while any photo is still mid-upload (showing Uploading photos…), so a slow uplo


# Overnight review — 2026-07-04

## 📊 Traffic (PostHog) — as of 2026-07-04

- **Visitors:** 35 all-time · 19 in the last 7 days
- **Pageviews:** 721 all-time · 195 in the last 7 days
- **Not from Oakland:** 33 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

---

## 🧭 Visitors — day-over-day & week-over-week

_Real visitors (bots excluded), first-party, Pacific-day windows — matches the live `/admin` card._

- **Totals:** 0 yesterday _(vs 0 the day before)_ · 24 last 7 days _(vs 8 the prior 7)_

**Visitors by city**  ·  _Δ d/d = yesterday vs. the day before · Δ w/w = last 7 days vs. the prior 7_

| City | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| CA | 0 | — | 3 | ▲ +2 |
| Unknown | 0 | — | 3 | ▲ +3 |
| US | 0 | — | 3 | ▲ +3 |
| Memphis, TN | 0 | — | 2 | ▲ +2 |
| Arlington, VA | 0 | — | 1 | ▲ +1 |
| Ashburn, VA | 0 | — | 1 | ▲ +1 |
| Boulder, CO | 0 | — | 1 | ▲ +1 |
| Canary Wharf, ENG | 0 | — | 1 | ▲ +1 |
| Cedar Park, TX | 0 | — | 1 | ▲ +1 |
| Denver, CO | 0 | — | 1 | ▲ +1 |

**Top landing pages**

| Page | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| / | 0 | — | 6 | — |
| /aircraft/listing/1350cd7e-6fa5-4c4d-bbb8-d5d6c1f77389 | 0 | — | 6 | ▲ +6 |
| /aircraft/for-sale/arkansas | 0 | — | 4 | ▲ +4 |
| /aircraft/listing/b7f5200a-6b6f-4077-b4cc-3d3471bf5b27 | 0 | — | 2 | ▲ +2 |
| /partnerships | 0 | — | 1 | ▲ +1 |
| /partnerships/browse | 0 | — | 1 | ▲ +1 |
| /partnerships/dcd64d61-0bce-4992-86c8-dc3bebfea2ed | 0 | — | 1 | ▲ +1 |
| /partnerships/make/cirrus | 0 | — | 1 | ▲ +1 |
| /partnerships/seeking | 0 | — | 1 | ▲ +1 |
| /partnerships/state/tx | 0 | — | 1 | ▲ +1 |

---

_No new cycles landed on staging since the last promote._
