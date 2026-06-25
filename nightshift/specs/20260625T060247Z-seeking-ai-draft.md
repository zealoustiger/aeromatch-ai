# Spec — seeking-ai-draft

## Goal
Add a "Generate with AI" button to the Seeking listing form that drafts a title + description from
the user's stream-of-consciousness notes in one click, reducing the blank-page barrier.

## Why (want lane)
- `[want]` lane — last non-bug cycle `seeker-filter-multi-airport` pulled `[want]`; second-to-last
  was `[goal]`; not 3 consecutive `[want]`, so [want] owed. This is the highest-value cleanly-
  shippable [want] (P2[want] from the "Generate with AI" backlog item), as all P1[want] items are
  either schema-blocked (messaging, optional save-note), data-blocked (airport hubs, map), or
  already shipped (detail page slices, seeking form autosave, PostTypeTabs, cross-sell rail).
- The Anthropic SDK (`@anthropic-ai/sdk`) is already in `package.json` and already called in
  `src/lib/llmParse.ts` — no new dependency. The `ANTHROPIC_API_KEY` env var is already set.
- Directly reduces the known "blank page" friction in posting a seeking listing (identified as
  a recurring pain point in the batch of form-friction items the human submitted).
- Slice 1 only: the seeking form. The backlog explicitly says to start there then reuse on
  partnership + for-sale forms (slices 2-3).

## Scope (files to touch)
- `src/app/actions.ts` — add `generateSeekerDraft(prompt: string)` server action
- `src/components/PostSeekerListingForm.tsx` — add prompt textarea + button + fill logic

## Acceptance criteria
1. The Listing Details section on `/partnerships/seeking/new` contains a **"Generate with AI"**
   affordance: a small "About me in a few sentences" textarea (placeholder) + a
   "Generate with AI ✨" button immediately above the Title and Description fields.
2. Clicking the button (with some text in the prompt box) calls the server action with the
   user's text; the button shows "Generating…" with a spinner while the request is in flight.
3. On success, the **Title** and **Description** fields on the form are **filled** with the
   AI-drafted content (both remain editable — nothing auto-submits).
4. On error (API call fails, key missing, etc.), a brief inline error note appears below the
   button; no crash, no console errors from app code.
5. If the prompt textarea is empty, the button is disabled (no wasted API calls).
6. `npx next build` + typecheck pass (no new errors in touched files).
7. QA smoke exit 0 on `/partnerships/seeking/new` at desktop 1280 + mobile 375.
8. The prompt model is hardcoded server-side (`claude-haiku-4-5-20251001`); no key or model
   is ever exposed to the client.

## Out of scope
- Reuse on partnership form or for-sale form (slice 2 — separate cycle).
- Streaming response (slice 1 = simple `await`; streaming adds complexity for short output).
- Rate limiting / cost cap (slice 3).
- User-settable generation style or custom system prompt.
- Any schema or DB change.
