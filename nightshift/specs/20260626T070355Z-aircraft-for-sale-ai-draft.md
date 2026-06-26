# Spec: aircraft-for-sale-ai-draft

**UTC:** 2026-06-26T07:03:55Z
**Slug:** aircraft-for-sale-ai-draft
**Lane:** [want] (last 3 non-bug cycles: post-form-375-cream-polish [want], experimental-aircraft-mission [goal], searches-page-seeker-label [want] — not all 3 [want], so [want] owed per 3:1 policy)

## Goal
Add "Generate with AI ✨" to the aircraft for-sale post form (`/aircraft/new`), completing feature parity with the partnership form. Users type stream-of-consciousness notes about their aircraft; Claude Haiku drafts a title and description.

## Scope
- `src/app/actions.ts` — new `generateAircraftDraft` server action (same shape as `generatePartnershipDraft` / `generateSeekerDraft`; calls `checkAiDraftAccess()` + Claude Haiku with `draft_listing` tool)
- `src/components/PostAircraftForm.tsx` — add AI draft box (violet card above the Title/Description fields); add `useState`, `useTransition`, `handleGenerate` wired to the new action; fill `[name="title"]` and `[name="description"]` via DOM refs

## Acceptance criteria
1. `/aircraft/new` renders a "Generate with AI ✨" violet box above the Title field in the "Listing Details" section.
2. Entering text and clicking "Generate with AI ✨" calls the server action and fills Title + Description fields with the draft (editable, not auto-submitted).
3. Loading state shows "Generating…"; error state surfaces an inline message.
4. Rate limit (10/hr per user, already guarded by `checkAiDraftAccess()`) applies — no new rate limit code needed.
5. No regression on `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`.
6. `npx next build` exits 0 with no TypeScript errors.

## Out of scope
- Slice 3 (server-side cost cap / usage telemetry) — already covered by the in-process rate limiter
- Aircraft for-sale AI draft on any other page
- Changes to the partnership or seeker forms (already have AI draft)
