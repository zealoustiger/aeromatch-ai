# Night Shift — Code Quality Log

Newest first. The drain spot-checks ~25% of PASSed cycles on the strong model
(Opus) to grade code quality the automated gate can't see. Scores 1-5.

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
