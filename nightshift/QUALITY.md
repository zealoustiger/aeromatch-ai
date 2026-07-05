# Night Shift — Code Quality Log

Newest first. The drain spot-checks ~25% of PASSed cycles on the strong model
(Opus) to grade code quality the automated gate can't see. Scores 1-5.

## 2026-07-05T09:56:33Z — photo-upload-block-submit — score 5/5
- Strengths: Exactly matches spec — single shared `onUploadingChange` prop driven by a `useEffect` on `photos`, wired identically into both forms; correct label precedence, clear comments matching the file's existing token/mountKey idiom, edit forms covered for free.
- Weaknesses / risks: none material (`setUploadingPhotoCount` is a stable setter so the effect dep is safe; disabled button also blocks implicit Enter-submit).
- Follow-up: none

## 2026-07-05T09:48:00Z — photo-mid-upload-recovery — score 4/5
- Strengths: Clean mirror of the existing best-effort-storage pattern — new idbPhotoDraft.ts feature-detects indexedDB and swallows every error (true no-regression), the shared uploadEntry callback removes the old duplicated fetch/setPhotos block, resume is gated identically to the URL restore and respects MAX_PHOTOS across both paths via functional setPhotos, finally-deletes the pending record on settle, clears IDB on the gate-gone "Start over" branch, and even guards StrictMode double-invoke with a cancelled flag.
- Weaknesses / risks: removePhoto (individual X) doesn't delete the pending IDB record, so removing a photo during the ~1-3s in-flight window and reloading before it settles can resurrect it — narrow and self-healing (resume→settle→delete), but a semantic gap vs. the deliberate-remove intent.
- Follow-up: none

## 2026-07-05T09:16:39Z — launch-banner-honest-stats — score 4/5
- Strengths: Cleanly deletes both fabrications (VISITOR_BASE/charCodeAt visitor count and the Math.max floor) exactly per spec, uses raw seekerCount, drops the false location-scoping claim, and correctly guards seekerCount===0 with singular/plural ("1 pilot is" vs "N pilots are"); scope stayed to the one component, no dead code, subscribe form untouched.
- Weaknesses / risks: In the seekerCount===0 case the surviving sentence "Get email alerts when more post" reads with no antecedent ("more" of what) — minor copy smell only in the empty state.
- Follow-up: Reword the zero-seeker fallback so "when more post" has an antecedent (e.g. "when pilots post here").

## 2026-07-05T09:10:32Z — seeker-owner-nudge — score 5/5
- Strengths: Faithful line-for-line mirror of AircraftListingOwnerNudge — reuses evaluateSeekerTrust as the single source of truth (no redefined signals), SIGNAL_ACTIONS keys match the SeekerTrustSignal union exactly and correctly omit intrinsic member_posted, null-returns on complete listings (no nag), isOwner gate uses the exact `!!user && !!s.poster_id && user.id === s.poster_id` pattern, placement above the trust checklist matches convention, a11y icons aria-hidden; copy sensibly adapted to "helps owners trust it".
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-05T08:27:26Z — partnership-contactbar-owner-view — score 5/5
- Strengths: Exact-to-spec, mirrors the established Aircraft/Seeker pattern; early return placed after all hooks (order preserved), handles isSeed, and the mobile note is wrapped in the full sticky-bar container so it renders in position rather than bare inline.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-05T07:12:46Z — seeker-post-analytics-parity — score 4/5
- Strengths: Precise mirror of PostAircraftForm — track() sits in the same spot (inside the try, just before the server action), same `listing_id: listingId` edit shape, and both create props (`home_airport`, `preferred_makes`) are genuinely present FormData fields (names verified at 478 / preferred_makes checkboxes), so no fabricated props; type-prefixed event names match the cleaner convention; single-file, no aircraft/partnership/schema churn.
- Weaknesses / risks: none material — like its siblings the event fires on submit *attempt*, so a server-side validation throw still counts as "submitted"; this is inherited parity behavior, not a regression.
- Follow-up: none

## 2026-07-04T13:28:23Z — partnership-deal-check-card-parity — score 4/5
- Strengths: Clean new `PartnershipCardVerdict` shape with correct dealVerdict-wins/plain-comp-fallback precedence; all 3 callers threaded correctly; browse card honestly labels each source (narrowed "Good deal" chip vs plain "~X% below/above market" pill); genuinely smart separate query/try-catch so the dormant ttaf/smoh migration degrades to the existing pill instead of killing the chip; matches conventions, no dead code.
- Weaknesses / risks: `SimilarListings` deviates from spec's "narrowed-only, mirror SimilarAircraft exactly" by adding a plain-comp fallback while `PartnershipRailCard` copy was relabeled to "Good deal"/"Priced high" on the (now false) premise the value "always comes from the narrowed verdict" — so on live data (ttaf/smoh dormant) every rail chip is a plain whole-family comp mislabeled as a year+hours Deal Check, unlike the aircraft rail which is truly narrowed-only.
- Follow-up: Either make the partnership rail narrowed-only (accept dormancy, true aircraft parity) or keep neutral "Below/Above market" copy on PartnershipRailCard when the chip comes from the plain `partnershipBuyInComp` fallback, so the rail never labels a whole-family comp as a Deal Check verdict.

## 2026-07-04T12:24:00Z — seeker-contactbar-privacy-copy-fix — score 4/5
- Strengths: Correct root-cause fix — verified showEmail/showPhone gate only on contactMethod (never login), so the "signed-in members only" claim was genuinely false; collapses the `!user` conditional to the single `displayName` line, reuses the component's existing "Reach out to" phrasing, leaves auth-gated messaging (handleSend redirect, draft preservation, button labels) and the still-used `user` state untouched. Tightly scoped, no dead code.
- Weaknesses / risks: none material — copy diverges slightly from sibling ContactBar's "Contact {name}" wording, but "Reach out to" matches this component's own prior tone and is arguably better.
- Follow-up: none

## 2026-07-04T12:14:33Z — edit-page-contact-prefill-parity — score 5/5
- Strengths: Exact parity with the three `new` pages — correct prop names/values, forms already consume them via `initialValues?.contact_* ?? user*` (listing's own value still wins), and edit pages correctly use non-optional `user.` since the auth gate guarantees presence. Minimal, well-scoped, no form/schema churn.
- Weaknesses / risks: none material — three-prop change duplicates the `new`-page wiring, but that mirror pattern is the existing convention.
- Follow-up: none

## 2026-07-04T12:03:53Z — partnership-dealsignals-annual-damage — score 4/5
- Strengths: Exact spec match — copy mirrors aircraft DealSignals verbatim, reuses the already-computed honesty-gated annual/damage reads, self-suppresses on null, and updates the panel doc comment (six→eight signals).
- Weaknesses / risks: Signal-row copy is now duplicated across `computeDealSignals` and `computeSignals` (two files to keep in sync) — intentional per spec and consistent with the existing mirror pattern, but a real drift risk over time.
- Follow-up: none

## 2026-07-04T11:31:43Z — seeker-card-budget-chip-severity-fix — score 5/5
- Strengths: Exact-target fix that resolves a real trust/honesty inversion — `below` now renders amber "Budget may be tight" and `above` emerald "Comfortably above typical", byte-for-byte matching `SeekerBudgetCheck`'s `VERDICT_META` colors and label intent; copy was rewritten to drop the borrowed "% below/above market" deal/no-deal framing that caused the miswrite, severity is carried in words (not color alone, so a11y holds), and scope stayed to the one file with the comp math / detail panel / partnership card correctly untouched.
- Weaknesses / risks: none material — card keeps its static `LineChart` icon for both verdicts where the panel uses directional `TrendingDown`/`TrendingUp`, so the icon doesn't reinforce direction, but that matches the card's own existing convention and color+copy already carry severity.
- Follow-up: none
- Strengths: Textbook parity port — `DraftIndicator` is a verbatim copy of the partnership/seeker version, `type DraftStatus` imported cleanly, all four status states handled with an `idle` default fallback, `aria-live="polite"` on the live states; scope held to the one file, purely additive/presentational exactly as spec'd, and the two lower-value audit runner-ups were correctly deferred.
- Weaknesses / risks: none material — the indicator is now triplicated across three forms rather than extracted to a shared component, but that matches the codebase's own established pattern and the spec explicitly chose verbatim copy.
- Follow-up: none

## 2026-07-04T09:23:45Z — photo-upload-signin-redirect — score 4/5
- Strengths: Clean, correctly-scoped fix that reuses the form's proven save-draft-and-redirect flow — factors `redirectToAuth()` out of `onFormSubmit` and threads it into the shared uploader via `isLoggedIn`/`onRequireAuth`; single `addFiles` guard covers browse/drop/paste, `openPicker` gates both click targets, and a11y label + empty-state copy update for the logged-out case; out-of-scope (photo-byte persistence, seeker form, API auth) is thoughtfully documented.
- Weaknesses / risks: `redirectToAuth` isn't memoized in either parent, so it's a fresh identity each render and churns the `addFiles` useCallback (harmless, just defeats the memo); logged-out empty-state keeps its drag/paste handlers, which is correct (they funnel to onRequireAuth) but slightly redundant with the copy change.
- Follow-up: none

## 2026-07-04T08:19:23Z — partnership-edit-placeholder-reset — score 5/5
- Strengths: One-line fix that makes the payload unconditional (`image_is_placeholder: photoUrls.length === 0`), exactly matching the proven `updateAircraftListing` pattern; correctly leaves the insert path out of scope.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-04T07:45:55Z — partnership-card-ifr-badge — score 4/5
- Strengths: Faithful verbatim port of AircraftSaleCard's `IFR_CARD_CHIP`/`IfrCardBadge`/`showIfrBadge` recipe — same tier gate (`full`/`capable`), same conditional-vs-raw-chip branch, type import folded cleanly onto the existing `classifyAvionics` import; matches surrounding conventions with no dead code and correct spec-scoped behavior (equipped/basic/none still render raw chips).
- Weaknesses / risks: `computeIfrSuitability(avionicsCaps)` is called twice per card (once for `ifrTier`, again inside `IfrCardBadge`), and `IfrCardBadge` re-guards the tier already gated by `showIfrBadge` — a minor redundancy, but inherited verbatim from the AircraftSaleCard reference so it's consistent, not a regression.
- Follow-up: none

## 2026-07-04T07:20:22Z — partnership-ai-draft-partner-reqs — score 4/5
- Strengths: Faithful, correctly-scoped parity mirror — prompt/`input_schema`/return-mapping all add `min_hours` (integer) + `ratings_required`, `handleGenerate` fill + `hasOptional` auto-open both updated, `'never invent — omit'` wording preserved, matches surrounding one-liner style with no dead code.
- Weaknesses / risks: Chip highlight on AI-fill of `ratings_required` relies on the native `input` dispatch firing React's onChange mirror (no explicit `setRatingsRequired` on the fill path, unlike `toggleRatingRequired`) — inherited from the seeker `ratings_held` reference and presumably works, but the chip-state sync is the one path not directly verifiable from the diff.
- Follow-up: none

## 2026-07-04T06:34:13Z — partnership-ai-draft-annual-damage — score 5/5
- Strengths: Precise mirror of existing extraction pattern; defensive `YYYY-MM` regex guard on `annual_due`, correct `!== undefined` boolean handling, and `'change'` event matching the Select's `true`/`false` option values.
- Weaknesses / risks: none material
- Follow-up: none

## 2026-07-03T12:52:45Z — seeker-message-draft-persist — score 4/5
- Strengths: Faithful, disciplined port of the reviewed `AircraftContactButton` pattern to `SeekerContactBar` — reuses the generic `messageDraft.ts` (seeker-scoped `seeker:<id>` key) and the existing `getOrCreateSeekerThread`/`sendMessage` server actions with zero duplication or schema change; full spec coverage (draft persisted across `/auth`, auto-sent+cleared on `?contact=1` return guarded by `didAutoContact`, one-step send when already logged in, owner guard + email/phone paths untouched); tasteful extras carried over — Enter-to-send/Shift+Enter, focus-on-expand, `errorMsg` surface, disabled empty-send, and a context-aware "Send" vs "Sign in & send" label; the two logged-in/out branches were cleanly merged into one return without dead code.
- Weaknesses / risks: Inherits the exact weakness the sibling `aircraft-message-draft-persist` cycle was flagged for — both send paths `await sendMessage(...)` but discard its `{ error }` return and `clearMessageDraft` + navigate unconditionally, so a failed insert or an over-length body (textarea has no `maxLength`; action rejects >2000 chars) silently drops the very message the feature exists to preserve and lands the user on an empty thread. This was a known issue at port time and should ideally have been fixed here rather than duplicated.
- Follow-up: none

## 2026-07-03T12:23:57Z — aircraft-message-draft-persist — score 4/5
- Strengths: Delivers the full spec cleanly — CTA now expands to an inline compose box, draft is persisted across the `/auth` redirect and auto-sent + cleared the moment the thread is created on return (guarded by `didAutoContact` against double-fire, and cleared-after-send prevents double-send on later visits), immediate one-step send when already logged in, empty send blocked at both the `trim()` guard and the disabled button; the new `messageDraft.ts` faithfully mirrors `localSaves.ts` (SSR `hasWindow` guard, try/catch, single-key store, `satisfies PendingMessage`); nice touches — Enter-to-send with Shift+Enter newline, focus-on-expand, and a context-aware "Sign in & send" vs "Send" label; scope is disciplined (out-of-scope contact bars untouched, server actions reused as-is).
- Weaknesses / risks: Both send paths `await sendMessage(...)` but discard its `{ error }` return and clear the draft + navigate unconditionally — so a failed insert or an over-length body (textarea has no `maxLength`; the action rejects >2000 chars as "Invalid message.") silently drops the exact message the feature exists to preserve, landing the user on an empty thread with no error. Minor: spec says "sessionStorage" but impl uses localStorage (arguably the better call for redirect durability; just a doc/impl mismatch).
- Follow-up: none

## 2026-07-03T11:03:26Z — airport-icao-server-validation — score 4/5
- Strengths: Closes the exact server-side gap the spec targeted — all 6 actions covered (4 required home_airport, 2 optional aircraft), throwing a clear user-facing Error right after the existing lookup so the established `useActionState` inline-error box surfaces it with zero new client UI; scope is disciplined (respects out-of-scope: no `AirportFormInput`, no `additional_airport_2`, no backfill), aircraft stays optional via the `if (homeAirportRaw)` guard, comments updated to match new behavior, and it quietly fixes a latent bug by switching the aircraft lookups from `.single()` (which throws a raw PostgREST error on 0 rows) to `.maybeSingle()` for a controlled, friendly message.
- Weaknesses / risks: The identical error-message string is copy-pasted across all 6 actions (2 wording variants) rather than a shared constant — minor DRY smell, though consistent with this file's already-heavily-duplicated action bodies.
- Follow-up: none

## 2026-07-03T10:05:08Z — aircraft-deals-candidate-scan-fix — score 5/5
- Strengths: Both confirmed bugs fixed exactly as spec'd — replaces the silently-truncated `.limit(2000)` with the file's own `fetchAllRows`/`.range()` pagination helper (identical idiom to `fetchFamilyPriceMap`/`fetchFamilyCompMap`), and unwinds the statement-continuation bug by hoisting `.gte('asking_price', DEAL_MIN_PRICE)` onto the unconditional chain so the $50k floor now applies on the `photoOnly=false` `/aircraft/deals` path too, while `image_is_placeholder` stays correctly gated on `photoOnly`; clean scope (one function, no signature/schema/dep change), stale "Cap the candidate scan" comment removed, `data.length === 0` guard preserves the empty-state short-circuit, error/exception paths still fail soft to `[]`.
- Weaknesses / risks: none material — inherits the file-wide pattern of a full-population `select('*')` scan per render (uncached), fine at ~2121 rows but worth watching as the table grows; pre-existing, out of scope here.
- Follow-up: none
- Strengths: Faithful mirror of the established `full_name` lazy-save (trimmed value, `!user.user_metadata?.contact_phone` "only if not set" guard, same `updateUser({ data })` shape) across all 3 create actions; prefill threads `user?.user_metadata?.contact_phone` → new optional `userPhone` prop with correct `initialValues?.contact_phone ?? userPhone ?? ''` precedence so edit mode is untouched; nice extra judgment auto-opening the collapsed `<details>` on `(!isEdit && userPhone)` so a prefilled phone isn't hidden; optional chaining means no crash on missing metadata; suffixed var names (`contactPhoneSeeker`) match sibling conventions.
- Weaknesses / risks: Inconsistent hint copy — spec asked for a "we'll save it for future listings" cue on all 3 forms, but only PostAircraftForm got the dual-branch hint; PostPartnershipForm/PostSeekerListingForm show only a bare "Pre-filled from a previous listing." with no save-notice, so the UX cue differs across the three otherwise-parallel forms.
- Follow-up: Unify the phone-field hint copy across the 3 post forms (add the aircraft form's "We'll save it for future listings." save-notice to the partnership + seeker forms).

## 2026-07-03T09:32:27Z — saved-aircraft-comp-verdict — score 4/5
- Strengths: Faithful mirror of `AircraftSaleList.tsx`'s per-card precedence (self-excluded `compsWithoutSelf`, narrowed `clubHangerDealVerdict` wins, plain `compVsMarket` fallback, chip only when one exists) and of `getPartnershipCompVerdicts`'s shape; one make-scoped query (not a full-table scan) reusing the exact `50_000` floor + `status='active'`, honesty-gated so thin/unpriced families render nothing; fails soft to an empty map; type-only supabase import, tidy comments, `/saved` wiring minimal (empty-array short-circuit, `?? null` threading into props the card already accepts).
- Weaknesses / risks: comp query is scoped broadly by `make` with `.limit(2000)` whereas browse surfaces query make+model at `.limit(5000)` — for a very high-volume make a family could be under-sampled (or arbitrarily truncated), so the chip could differ from or drop vs. the browse page; low-probability on `/saved` (few saved makes) but not "exactly like" in that edge.
- Follow-up: none

## 2026-07-03T06:55:57Z — partnership-ai-faa-backfill — score 4/5
- Strengths: Faithful, line-for-line mirror of PostAircraftForm's proven chained-backfill — `handleLookup({ onlyEmpty })` guards each of make/model/year with `!(onlyEmpty && input?.value)`, so a registry hit never clobbers an AI-extracted value; `missingCore` gate + `result.registration` condition scope the auto-call tightly; button/blur call sites correctly rewrapped to `() => handleLookup()`; `fillTokenRef` stale-fill guard preserved; comments explain the onlyEmpty rationale; actions.ts/schema untouched as scoped.
- Weaknesses / risks: none material — minor: make/model/year inputs are re-queried both in handleGenerate and again inside handleLookup, and the whole flow leans on DOM querying over React state, but both match the sibling form's established convention exactly.
- Follow-up: none

## 2026-06-29T13:02:41Z — partner-buyin-inline-market — score 5/5
- Strengths: Textbook minimal slice — 14 lines, single file, reuses the already-computed `partnerComp` with zero new queries/components; the emerald/amber/slate variant ternary and `formatPriceK` helper match existing file conventions exactly, copy reads naturally for all three `kind` branches, and self-suppression falls out of `partnerComp && (...)` for free. PartnershipMarketCheck panel untouched as scoped.
- Weaknesses / risks: none material — slight semantic redundancy with the full market panel below, but that proximity-at-the-price-moment is precisely the spec's stated intent; the colored label is also backed by literal "below/above/Around market" text, so it's not color-only for a11y.
- Follow-up: none

## 2026-06-29T12:43:03Z — partnership-comp-pill-enriched — score 4/5
- Strengths: Clean, minimal parity wire-through — `median`/`count` threaded consistently through the prop type, the verdicts `Map`, and the `renderList` default param; both below/above branches gain the `· $Xk · N comps` suffix via the shared `formatPriceK` helper plus a full-figure `title` tooltip; honesty floor and ±5% dead-band suppression untouched, `partnershipComps.ts` math left alone exactly as scoped.
- Weaknesses / risks: none material — the below/above chip markup is duplicated rather than factored, but that duplication pre-existed this cycle and matches the file convention.
- Follow-up: none

## 2026-06-29T12:17:18Z — platform-contact-email-hide — score 5/5
- Strengths: Hits all 7 ACs precisely with a minimal, idiomatic diff — `contactMethod` state defaults to `'platform'` so email is hidden by default, the `Select`'s `onChange` toggles it, and the field uses the CSS `hidden` class (not conditional mount) so the value survives method switches (AC5); the post-mount `useEffect` draft-sync correctly mirrors the existing `selectedMake` pattern and reads `[name="contact_method"]` (AC6); applied identically to both forms; the local `Select` spreads `...props`, so `onChange` forwards cleanly.
- Weaknesses / risks: none material — select stays uncontrolled (relies on first option being the default), but that matches the file's established convention.
- Follow-up: none

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
