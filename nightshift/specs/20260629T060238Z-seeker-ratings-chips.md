# Spec: seeker-ratings-chips

**Timestamp:** 20260629T060238Z  
**Pillar:** 1 — Frictionless listing posting  
**Branch:** night/seeker-ratings-chips

## Goal
Add one-tap rating/endorsement chips above the "Ratings & Endorsements You Hold" text input on the seeker post form, so pilots can tap their ratings instead of recalling and typing comma-separated abbreviations.

## Scope
- `src/components/PostSeekerListingForm.tsx` — only file touched

## Acceptance criteria
1. A chip row of common ratings (`PPL`, `IFR`, `Complex`, `High Performance`, `Multi-Engine`, `Tailwheel`, `CFI`, `ATP`) renders above the `ratings_held` text input, inside the "Your Pilot Profile" sub-section.
2. Tapping a chip toggles it in the comma-separated `ratings_held` value — active chip shows sky highlight (`aria-pressed=true`), inactive is plain slate.
3. Typing in the text box keeps chips in sync — the highlight follows what's in the field (same pattern as make chips).
4. AI prefill that fills `ratings_held` also syncs the chip highlights (via the existing `fillFormField` → `input` event → `onChange` → mirror state).
5. "Start over" clears both the text input and the chip highlights.
6. No layout regression at desktop 1280 or mobile 375 (chips wrap cleanly).

## Out of scope
- No changes to `createSeekerListing`, the DB schema, or other forms
- No change to the AI draft (`generateSeekerDraft`) — it already fills `ratings_held` as free text; chips reflect whatever it returns automatically
- No change to any other field or section
