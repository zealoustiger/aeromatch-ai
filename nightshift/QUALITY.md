# Night Shift — Code Quality Log

Newest first. The drain spot-checks ~25% of PASSed cycles on the strong model
(Opus) to grade code quality the automated gate can't see. Scores 1-5.

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
