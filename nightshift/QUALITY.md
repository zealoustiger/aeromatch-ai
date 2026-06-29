# Night Shift — Code Quality Log

Newest first. The drain spot-checks ~25% of PASSed cycles on the strong model
(Opus) to grade code quality the automated gate can't see. Scores 1-5.

## 2026-06-29T11:14:12Z — ifr-badge-browse-cards — score 4/5
- Strengths: All 5 ACs met cleanly in the single scoped file — `IfrCardBadge` reuses the shared `computeIfrSuitability`, emerald (full) / sky (capable) colors map correctly, and the `showIfrBadge` gate cleanly routes non-qualifying tiers (equipped/basic/null) back to the unchanged 2-cap chip path, so AC3 no-regression and AC5 empty-caps self-suppression both hold. Naming and `cn`/ring styling mirror the sibling `AvionicsChip`/`EngineTimeChip` chips; honest sub-line copy preserved.
- Weaknesses / risks: `computeIfrSuitability(caps)` runs twice per card (once for `ifrTier` in the body, again inside `IfrCardBadge`) instead of computing once and passing the result down; the `IFR_CARD_CHIP` map carries unreachable `equipped`/`basic` keys (badge returns null for them); and `title={ifr.sub}` adds hover text that the spec listed as explicitly out of scope. All immaterial.
- Follow-up: none

## 2026-06-29T10:32:08Z — avionics-ifr-land — score 4/5
- Strengths: Textbook DRY refactor — lifts `computeIfrSuitability` + `IfrTier`/`IfrSuitability` verbatim into the shared `avionicsClassify.ts` (next to the `AvionicsCap` data it operates on), deletes the aircraft page's now-duplicate copy and re-imports it (behaviour byte-identical), and adds the badge to the partnership `AvionicsPanel` above the chips. Honesty floor intact (empty caps → `null` → no badge; every sub-line defers to the owner for undetected gear). 12 focused unit tests cover tier precedence, the empty-cap self-suppression, and that each tier yields non-empty copy. Tidy comments, naming matches conventions; merge-commit landed cleanly post env-cache fix.
- Weaknesses / risks: The 4-line `IFR_CHIP` color map is now copy-pasted into both detail pages — a deliberate mirror of the existing per-page `CAP_COLORS` pattern, so defensible, but it's a second presentation site that can drift from the shared tier enum. Nothing material.
- Follow-up: none

## 2026-06-29T08:47:46Z — seeker-on-listings-page — score 4/5
- Strengths: All 5 functional ACs met cleanly — the new "Pilots seeking" section reuses the page's own `StatusBadge`/`formatDate` helpers and mirrors the aircraft/partnership section markup, the query correctly filters `poster_id` + active/pending and orders desc, the section self-hides when empty (AC3), and edge cases are handled gracefully (null title → sensible derived label with home airport, null `home_airport` → "Any airport", `preferred_makes` truncated to 2 with an ellipsis). Banner links added identically to both detail pages, matching the aircraft banner.
- Weaknesses / risks: Minor — a local `SeekerRow` type is declared rather than reusing/`Pick`-ing the existing `PartnershipSeeker` interface in `lib/types`, though that interface lacks `title`/`status`/`poster_id` so a narrow local type is defensible; the internal `/partnerships/seeking/[id]` "View" link uses the `ExternalLink` icon, a slight semantic quibble. Nothing material.
- Follow-up: none

## 2026-06-29T08:20:19Z — seeker-airport-or-filter — score 4/5
- Strengths: Tight single-file change that nails the spec — PostgREST `.or(home_airport.in.(…),additional_airports.ov.{…})` correctly expresses the home-OR-additional match, mock path mirrors it with consistent uppercase normalization, and the pre-migration fallback reuses the exact `error.message.includes('additional_airports')` pattern from createSeekerListing. All 6 ACs met; gate green.
- Weaknesses / risks: Fallback path re-builds the makes/ratings/share_type/min_hours chain verbatim (~7 duplicated lines) instead of a shared helper — two sites that can drift; also airport codes are interpolated into the `.or()` string unquoted (safe for A-Z0-9 ICAOs, but no sanitization).
- Follow-up: none

## 2026-06-29T08:11:51Z — listing-age-context — score 4/5
- Strengths: Correct, well-scoped single-file change — reuses already-computed `listed`/`domContext` and `familyComps` (no new queries), self-suppresses via `listed && domContext &&`, and correctly gates the "seller may have flexibility" inference behind the same `daysOnMarket >= 30` dual-threshold the Deal Score tally uses, so the honesty floor holds. All 7 ACs met; build + tsc clean per gate.
- Weaknesses / risks: The relative-recency phrasing is hand-rolled a second time as an inline JSX ternary, duplicating `domDetail`'s longer/shorter/typical branching with slightly reworded copy ("seller may have flexibility" vs "a seller-flexibility signal"; "similar … for sale now" vs "comparable … still for sale") — two render sites that can drift, and AC#2's "matching the language already used in the tally" is only loosely honored.
- Follow-up: none
- Strengths: Tight, well-scoped change — adds two optional props and one reactive `reserveAnnual` line; correctly uses the flat `reservePerHour` (overhaulCostUsd/tboHours) so `× hrsPerYear` is dimensionally sound and immune to the beyond-TBO branch; deliberately kept OUT of `annualTotal` (with an explanatory comment) to avoid double-counting; null/0 self-suppresses; reuses the dl/dt/dd + `money()` conventions and signals "estimate" via amber + dashed divider. All 7 ACs met; page passes `engineLife?.reservePerHour`/`?.family` correctly.
- Weaknesses / risks: Caveat subtext uses `text-slate-300` (very light grey on white) — fails WCAG AA contrast for the one line buyers most need to read; label wording ("Engine reserve est.") also drifts slightly from the spec's literal "Engine reserve (est.)" — both cosmetic.
- Follow-up: Bump the "Verify if included in monthly fixed above" subtext from `text-slate-300` to at least `text-slate-500` for readable contrast.

## 2026-06-29T07:32:15Z — partnership-buyin-optional — score 5/5
- Strengths: Tight 4-line diff that does exactly what the spec asked — drops `required`, adds "(optional)" using the *identical* `text-xs font-normal text-slate-400` span the form already uses for Title/Phone optionals, plus clear helper text; server action (actions.ts:97) already coerced empty → null, so no over-reach into backend/schema.
- Weaknesses / risks: none material — helper text + updated tooltip both mention the negotiable path (minor copy overlap, intentional progressive-disclosure).
- Follow-up: none

## 2026-06-29T06:20:59Z — partnership-implied-value — score 5/5
- Strengths: Clean pure helper mirroring aircraftComps/partnershipComps honesty philosophy — guards (buyIn>0, shares>=2, >=4 comps, median>0), ±10% dead-band, 14 unit tests; page fail-soft try/catch + pre-DB share guard avoids needless query; component renders all three kinds with "ask what's included" caveats exactly as spec'd; existing rows untouched.
- Weaknesses / risks: none material — detail copy says "comparable {make} aircraft" (make-only) though comps are model-family-filtered, so the label slightly understates specificity; cosmetic, not misleading.
- Follow-up: none

## 2026-06-29T02:29:10Z — partnership-airframe-time — score 5/5
- Strengths: Exact-to-spec port — byte-identical AirframeUsagePanel + USAGE_META, reuses the unit-tested pure computeAirframeUsage, honesty-gating self-suppresses correctly; clear comments, tight 53-line diff.
- Weaknesses / risks: none material — panel/USAGE_META are now duplicated across two pages, but that mirrors the existing EngineLifePanel convention so drift risk is pre-existing, not introduced.
- Follow-up: none

## 2026-06-29T01:42:29Z — aircraft-post-engine-type — score 5/5
- Strengths: Exact spec match across all three touchpoints (action persist, draft schema/prompt, form field + AI-prefill + hasOptional gate); idiomatic — reuses the `title` `.trim() || null` pattern, fits cleanly as the 4th cell of the existing 2×2 grid, and adds an honest value-explaining helper line; verified the detail-page panel renders on `{engineLife && …}` with no `source` gate, so the user-listing reachability the spec promises actually holds.
- Weaknesses / risks: none material — depends on free-text matching engineLife's TBO families, but the panel self-suppresses on no-match, so a bad entry shows nothing rather than a wrong number.
- Follow-up: none

## 2026-06-28T21:44:47Z — airframe-utilization-read — score 4/5
- Strengths: Faithfully meets every acceptance criterion — pure honesty-gated helper (null on missing ttaf/year, ttaf≤0, age<1), genuinely two-sided copy (low-time surfaces sitting/corrosion risk in amber, not a green win), distinct from the SMOH Engine Life panel, and mirrors its `ch-panel`/Plane-icon style; solid unit tests cover gating, all three bands, rounding, and ttaf echo.
- Weaknesses / risks: Minor — the chip `label` ("Low time") and band `headline` ("Low-time for its age") are near-duplicate strings shown together; band thresholds (40/120) are reasonable but un-sourced magic constants. None material.
- Follow-up: none

## 2026-06-28T12:36:51Z — deal-score-signal-tally — score 4/5
- Strengths: Exactly to spec — counts positive/negative only, neutral excluded, honest descriptive copy, chip colors match existing SIGNAL_COLORS palette, all-neutral/empty cases render no header, suppression unchanged; well-scoped single-file additive change.
- Weaknesses / risks: Chip color tokens are hardcoded literals rather than derived from the central SIGNAL_COLORS map (minor duplication); two filter passes over rows (negligible).
- Follow-up: none

## 2026-06-27T14:52:00Z — crosssell-model-level — score 3/5
- Strengths: Clean two-query fallback pattern (model-first, make fallback) with correct mock/live parity; `modelLevel` flag cleanly decouples data-level from display logic; scoped to exactly the two files the spec named; TypeScript return type updated correctly.
- Weaknesses / risks: AC#1 explicitly states CTA must link to `/partnerships?make=Cessna&model=172` when model-level, but the link always stays at `/partnerships?make=Cessna` — so a buyer clicking "Browse Cessna 172 partnerships" lands on all-Cessna results, the same friction the spec was trying to fix; the comment rationalizes this as "not supported yet" but that's a spec deviation, not a scoping judgment.
- Follow-up: Either add `model` query param support to the `/partnerships` page (so the CTA URL works as specified) or change the CTA label back to make-only when `model` param can't be honored — the current label/URL mismatch is the worse outcome.

## 2026-06-27T14:23:57Z — partnership-crosssell-listing — score 4/5
- Strengths: Clean self-suppression logic, correct mock/live parity, graceful catch→null DB error handling, make properly encoded in CTA URL, co-located component as spec required.
- Weaknesses / risks: CTA text reads "Browse {make} partnerships" instead of spec's "Browse N [Make] partnerships" (count N missing); `.limit(200)` on the count query means both count displayed and minBuyIn could be wrong if a popular make ever exceeds 200 active shares (no ORDER BY, so cheapest rows not guaranteed to be in the result set).
- Follow-up: Add count to CTA label (`Browse ${count} ${make} partnerships →`) and replace `.limit(200)` with a `.select('id, buy_in_price').limit(500)` or use a separate aggregate query for count.

## 2026-06-27T13:45:31Z — share-cost-toggle — score 4/5
- Strengths: All 7 spec ACs met; clean Client Component extraction; `?? rows[0]` fallback is good defensive coding; `flex-wrap` on button strip and links section handles mobile overflow correctly.
- Weaknesses / risks: `TOGGLE_LABELS` duplicates labels already carried in `row.label` from the calculator (parallel map with no single source of truth); toggle buttons missing `type="button"` and `aria-pressed` (a11y gap — could misfire as submit inside any future form wrapper); `money()` copied from page.tsx rather than moved to a shared util.
- Follow-up: Add `type="button"` and `aria-pressed={selected === row.shares}` to toggle buttons; replace `TOGGLE_LABELS` map with `row.label` directly so the calculator is the sole label authority.

## 2026-06-27T13:19:33Z — homerails-deal-chips — score 5/5
- Strengths: All 6 ACs met; single Promise.all over unique families is correct, no N+1; self-exclusion, null-price guard, and 'fair' suppression all handled; local types declared at module scope (avoids the style nit from similar-aircraft cycle); exactly 1 file changed as scoped.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-06-27T11:30:00Z — engine-time-rail-chips — score 4/5
- Strengths: All 7 ACs met cleanly — ternary chain correctly handles placeholder/null/chip ordering, color thresholds match browse-card spec exactly, avionics chip unaffected, zero TypeScript errors.
- Weaknesses / risks: Three helpers (`formatHrsRemaining`, `engineChipStyle`, `EngineOverlayChip`) are near-verbatim copies of `AircraftSaleCard`'s equivalents with a different component name than the spec dictated (`EngineTimeChip`); duplication is spec-acknowledged but will compound if a third card type ever gains engine data.
- Follow-up: Extract the three helpers into a shared util (e.g. `src/lib/engineChip.tsx`) so future card types import rather than copy.

## 2026-06-27T10:30:00Z — avionics-partnership-detail — score 3/5
- Strengths: Core chips render correctly on both detail page and RailCard, self-suppression works, placement is right, description-split workaround is pragmatic (Partnership type has no `avionics` column despite spec claiming otherwise).
- Weaknesses / risks: AC1's "raw equipment list in a 2-column bullet grid" is entirely absent from AvionicsPanel — only chips render; `CAP_COLORS`/`AVIONICS_CHIP_STYLE` maps are duplicated across `page.tsx` and `PartnershipRailCard.tsx` (with a minor `gps` shade mismatch); description-split regex is copied verbatim into both files instead of living in the shared lib.
- Follow-up: Add the 2-column equipment bullet grid to `AvionicsPanel` (missed AC); extract the color map and description-split helper into `avionicsClassify.ts` to eliminate the duplication.

## 2026-06-27T09:15:00Z — seeking-post-one-screen — score 4/5
- Strengths: All 8 AC delivered cleanly — AI prefill elevated to top, 3-field "The basics" section, native `<details>` disclosure closed by default, comprehensive auto-open heuristic (broader than the partnership cycle's, now includes contact/travel fields), server action auto-generates title and falls back to `user.email`; faithful mirror of the partnership-post-one-screen pattern with dead constants (`RATINGS`, `MAKES`) correctly removed.
- Weaknesses / risks: `result.title` remains in the `hasMoreDetails` auto-open guard even though `title` moved to "The basics" (outside the disclosure) — AI filling only a title triggers the disclosure to open for no reason; `contact_email: ... || ''` could persist an empty string to the DB if `user.email` is also null/undefined on an incomplete account.
- Follow-up: none

## 2026-06-27T08:42:11Z — partnership-post-one-screen — score 4/5
- Strengths: Spec delivered cleanly — AI prefill elevated to top, five-field Essentials section, native `<details>` collapsible with ref-based auto-open on AI fill, `user.email` server-side fallback in actions.ts; net −170 line restructure that makes the form genuinely less intimidating without losing any required-field functionality.
- Weaknesses / risks: `scheduling_system` field silently dropped — it was in the old form, absent from the spec's more-details list AND the out-of-scope list, so it's an unacknowledged regression; auto-open heuristic also misses AI-filled contact fields (only checks year/registration/title/description/costs), so the drawer stays closed if only those populate.
- Follow-up: none

## 2026-06-27T07:20:32Z — similar-aircraft-deal-chips — score 4/5
- Strengths: All 5 acceptance criteria met cleanly; parallel family-price fetch avoids N+1 (1-3 unique families in practice); honesty floors (≥4 comps, ±5% dead band, 'around' filtered) correctly delegated to `clubHangerEstimate` rather than re-implemented; backward-compat for homepage deals rail preserved via `discountPct != null` taking precedence.
- Weaknesses / risks: Emerald chip markup is copy-pasted verbatim between the `discountPct` and `compVerdict='below'` branches — minor DRY miss that will drift if the deal-chip style is ever updated; `interface FamilySpec` and `type FamilyKey` are declared inside the async function body instead of at module scope (style nit).
- Follow-up: none

## 2026-06-27T06:30:00Z — partnership-post-prefill-all-fields — score 4/5
- Strengths: Clean port of the established aircraft-post-prefill pattern — `PartnershipDraft` interface, extended tool schema, and `fillFormField` helper all mirror the sibling feature exactly; system prompt is well-structured (extraction rules separated from description rules, enum-constrained fields, explicit no-fabrication instruction); all spec acceptance criteria met including registration, total_shares, shares_available beyond the explicit AC1 list; `home_airport.toUpperCase().slice(0, 4)` normalization is a nice defensive touch.
- Weaknesses / risks: Outer `if (result.buy_in_price)` / `if (result.total_shares)` etc. guards before `fillFormField` calls introduce a falsy-0 bug — a numeric field set to 0 would be silently skipped; `fillFormField` already handles `undefined`/`null` internally, making the outer guards redundant and harmful for integers; low practical risk (a $0 buy-in is nonsensical) but it's a latent trap if the pattern is copied to a domain where 0 is meaningful.
- Follow-up: Replace numeric-field `if (result.x) fillFormField(...)` with direct `fillFormField(form, ..., result.x)` calls — let the helper's null/undefined guard do the work and eliminate the falsy-0 trap.

## 2026-06-26T13:15:58Z — aerobatic-mission-page — score 4/5
- Strengths: Textbook data-only extension — one `Mission` entry appended to `MISSIONS[]` plus one chip, no new route code, exactly as scoped; conforms 1:1 to the `Mission` interface and the established editorial formula (unique H1/meta, 3 substantive intro paragraphs covering certification / training+IAC / pre-purchase as the spec required, 4 evergreen FAQs); content is unusually accurate and specific (TCDS Aerobatic category +6/−3 G, FAR 91.303 & 91.307, real type designations Pitts S-1S/S-2C, Extra 300/330, Decathlon, Su-26, Edge 540); FAQ JSON-LD and the visible accordion both render from the same `m.faqs` array, so the 1:1 match is structural rather than hand-maintained.
- Weaknesses / risks: `filters: { q: 'aerobatic' }` is a literal keyword match, but real listings advertise the model name ("Pitts", "Extra 300", "Decathlon") not the word "aerobatic", so the live grid will likely be sparse/empty — the editorial names those types richly but the filter doesn't search for them; same soft spot flagged on twin-stol. Minor substance overlap between intro para 2 and FAQ 2 (both cover 91.303/91.307/IAC), though wording is distinct as the interface requires.
- Follow-up: none (DB/filter changes were explicitly out of scope; grid-keyword breadth is a backlog-level mission-family concern, not specific to this cycle).
## 2026-06-26T10:24:10Z — partnership-desktop-message-button — score 4/5
- Strengths: Faithful parity port of mobile `ContactBar`'s messaging flow into the desktop `ContactButtons` card — identical auth-state effect, `handleMessage`, `getOrCreateThread` contract handling, `showMessage` self-exclusion guard, and slate-900 styling; all 7 acceptance criteria met (auth redirect, self-poster hide, email/phone retained as secondary), scoped to exactly the two files the spec named.
- Weaknesses / risks: Message button omits the `track('contact_initiated', { method: 'message' })` analytics call that the sibling email/phone buttons in the SAME component fire — so desktop message intents go uncounted; also duplicates the ~15-line auth-effect + handler verbatim from ContactBar rather than a shared hook (consistent with existing codebase pattern, but debt compounds).
- Follow-up: Add `track('contact_initiated', { listing_id, method: 'message' })` to `handleMessage` in both ContactButtons and ContactBar so message-initiation parity-matches email/phone analytics.
## 2026-06-26T07:50:33Z — aircraft-mission-twin-stol — score 4/5
- Strengths: Pure data-driven extension — two `Mission` entries appended to `MISSIONS[]` with no new route code, exactly as spec intended; entries conform 1:1 to the `Mission` interface and mirror the established editorial formula (unique H1/meta, 3 substantive intro paragraphs, 4 evergreen FAQs, "the listings below are…" closer); chip slugs `twin-engine`/`stol` correctly resolve to the new missions; the STOL intro honestly cross-links to experimental/tailwheel pages, acknowledging its own filter won't catch every backcountry type — exactly the "keep these honest" judgment the file header asks for.
- Weaknesses / risks: `filters: { q: 'stol' }` keyword match likely yields a sparse/empty live grid (few listings literally say "STOL"), and `q: 'twin'` is broad enough to admit some false positives; both are honestly disclosed in the editorial so neither reads as a doorway page, but grid quality on /stol is the soft spot.
- Follow-up: none
## 2026-06-26T07:17:56Z — aircraft-for-sale-ai-draft — score 5/5
- Strengths: Textbook parity feature — `generateAircraftDraft` mirrors `generatePartnershipDraft`/`generateSeekerDraft` (same `checkAiDraftAccess()` gate, empty/length guards, `draft_listing` tool with `tool_choice`, Haiku model id, incomplete-draft check), and the form's `handleGenerate` is byte-for-byte aligned with the sibling forms' `useTransition` + DOM-ref `dispatchEvent('input')` fill; aircraft-tailored system prompt is well-crafted; all 6 acceptance criteria met with inline error + "Generating…" loading state; bonus `p-4 sm:p-6` tightening applied consistently across all three sections.
- Weaknesses / risks: none material — minor: `title.slice(0, 200)` exceeds the prompt's 120-char guidance, but this faithfully copies the sibling convention so consistency wins.
- Follow-up: none

## 2026-06-26T06:53:18Z — post-form-375-cream-polish — score 4/5
- Strengths: Clean, on-spec diff; meets all 5 acceptance criteria; `.ch-surface min-h-screen` wrapper matches the idiom already used across /aircraft and /partnerships, and the AI button gains a thoughtful `justify-center` so the full-width mobile tap target reads centered.
- Weaknesses / risks: `partnerships/new/page.tsx` wraps the existing div without re-indenting the inner JSX (misaligned markup), inconsistent with `seeking/new` which was re-indented; spec scope also listed a "DraftIndicator wrap long text" tweak that wasn't implemented (not in acceptance criteria).
- Follow-up: none

## 2026-06-25T13:35:39Z — searches-page-seeker-label — score 4/5
- Strengths: Tight, on-spec single-file diff; new `describeSeekerSearch` mirrors the existing aircraft/partnership helpers' structure and the early-return branching in `marketplaceLabel`/`describeSearch` is clean; meets all badge + description acceptance criteria, and the View link already passes for `/partnerships/seeking`.
- Weaknesses / risks: `state` is a real seeker filter (it's in the page's `activeFilterCount` list) but `describeSeekerSearch` omits it, so a state-only seeker search renders the misleading "All seeker listings" fallback.
- Follow-up: add a `state` branch to `describeSeekerSearch` so state-filtered seeker searches describe themselves.

## 2026-06-25T10:03:39Z — seeking-drive-time — score 4/5
- Strengths: Tight, on-spec diff; new `travelLabel` helper matches utils.ts conventions/doc style, is the single source of truth across both display sites, and gracefully clamps legacy nm values (150/200) into the top bucket so no schema change is needed.
- Weaknesses / risks: none material — spec asked for "~2+ hr drive" but ships "~2 hr drive", so legacy 150/200 nm listings read as a flat "~2 hr drive" (understated); detail-page copy "willing to commute ~30 min drive" doubles up commute+drive and reads slightly awkward.
- Follow-up: none

## 2026-06-25T08:58:18Z — saved-listing-note — score 4/5
- Strengths: All 7 acceptance criteria met; owner-scoped action, dual char-cap, ⌘/Ctrl+Enter & Esc, a11y labels, and a real graceful-degradation path when the note column is unmigrated.
- Weaknesses / risks: none material — `displayNote` comment mislabels post-confirm update as "optimistic"; redundant `?? []` on an always-array `savedRows`.
- Follow-up: none
