# Spec — partnership-ai-draft

## Goal
Add a "Generate with AI ✨" box to the "Post a Partnership" form (`/partnerships/new`)
so aircraft owners can jot a few sentences about their plane and group, then get a
polished title + description drafted by Claude Haiku — reducing the blank-page barrier
for owners listing their aircraft partnerships.

## Why (want lane)
- `[want]` lane (last 3 non-bug cycles: seeking-ai-draft [want], seeker-filter-multi-airport
  [want], guide-flying-club-vs-co-ownership [goal] — not all 3 [want], so [want] owed).
- Slice 2 of the "Generate with AI" backlog item — the seeking form got slice 1 last
  cycle (`seeking-ai-draft`); partnership form is the natural next target.
- High owner friction: the partnership description box is blank and most owners don't know
  what to write. AI assist on the owner side mirrors the seeker-side benefit.

## Scope (two files)
- `src/app/actions.ts`: add `generatePartnershipDraft(prompt)` — same pattern as
  `generateSeekerDraft`, different system prompt (owner voice: describe the aircraft,
  the partnership structure, what makes a good partner).
- `src/components/PostPartnershipForm.tsx`: add `useState` + `useTransition` imports,
  aiPrompt/aiError state, `handleGenerate` function, and the violet "Generate with AI ✨"
  box inside the Listing Details section (above the Title field) — exact same UI pattern
  as the seeking form.

## Acceptance criteria
- `npx next build` + typecheck pass (no new errors in touched files).
- `/partnerships/new` renders the violet AI Generate box above the Title + Description fields.
- Typing a prompt and clicking "Generate with AI ✨" calls `generatePartnershipDraft`
  server-side, fills both Title and Description (editable), and shows "Generating…" + spinner while in flight.
- Button is disabled when the prompt textarea is empty; shows an inline error if generation fails.
- Nothing auto-submits; all other form fields are unchanged.
- QA smoke exit 0 on `/partnerships/new` at desktop 1280 + mobile 375 (HTTP 200, zero
  app-origin console errors, zero horizontal overflow).

## Out of scope
- No change to `createPartnership` action, no schema change.
- No rate limiting (slice 3, deferred).
- No AI assist on the aircraft for-sale post form (slice 3, also deferred).
- No changes to the seeking form.
