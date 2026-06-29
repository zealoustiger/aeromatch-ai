# Spec: partnership-description-above-fold

**Timestamp:** 2026-06-29T130720Z
**Pillar:** Frictionless listing posting (Pillar 1)
**Slug:** partnership-description-above-fold

## Goal
Move the Description textarea on the Partnership post form (`/partnerships/new`) out of the "More details" collapsible and into a permanently-visible "About this partnership" section — so posters are prompted to write a description without having to discover or expand the accordion.

## Motivation
The aircraft form had the same problem and it was fixed in `aircraft-description-above-fold`. A partnership listing without a description gives buyers almost nothing to evaluate (unlike aircraft listings, there's no scraped description to fall back on — user-posted partnerships are the *only* source). Moving the description above fold directly removes the most common gap in partnership listing quality.

## Scope
- `src/components/PostPartnershipForm.tsx` — move `<textarea name="description">` into a new visible section; remove it from the "More details" accordion; remove `result.description` from the `hasOptional` auto-open check.
- No schema changes, no DB changes, no new dependencies.

## Acceptance criteria
1. On `/partnerships/new`, a "About this partnership" section is visible at page load without expanding "More details" — it contains the description textarea.
2. The description textarea is NOT inside the `<details>` element.
3. Title stays inside "More details" (as it does now — auto-filled from make/model).
4. AI prefill still fills `[name="description"]` correctly (same selector, different DOM position).
5. The `hasOptional` auto-open trigger no longer fires for description alone (it fires for year/TTAF/SMOH/engine/title — optional fields that ARE still inside the accordion).
6. No horizontal overflow at desktop 1280 or mobile 375.
7. No app-origin console errors.

## Out of scope
- Seeker form (separate form, separate cycle if needed)
- Autofill logic beyond the `hasOptional` guard fix
- Any schema or DB changes
