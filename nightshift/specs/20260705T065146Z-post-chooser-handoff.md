# Post chooser → auto-routed paste handoff

## Goal
Let a poster paste their notes/link on the `/post` chooser page — before they've picked
a listing type — and have the site guess the right form and carry the pasted text
straight into that form's existing "Prefill from your notes ✨" box (auto-running it when
logged in), instead of forcing them to guess the type first and re-discover the paste box.

## Why (Pillar 1 — frictionless posting)
GOAL.md's stated ideal is "paste what you have → we draft the rest → publish in one
screen." Today that's only true *after* landing on the right form — `/post` is a plain
3-card chooser with no paste path, so a poster who already has text/a link in hand must
still guess aircraft-for-sale vs. partnership vs. seeking, land on that page, then find
the AI box. Rotation: Pillar 1 is due (last 1-2 cycles were Pillar 3 then Pillar 2-adjacent
alerts work); Pillar 1's explicit BACKLOG checklist is fully shipped, so this is an
invented `[agent][goal]` slice per RUNBOOK's "queue empty → invent" fallback.

## Scope
- `src/lib/postHandoff.ts` (new): a small heuristic `classifyPostText(text)` →
  `'aircraft' | 'partnership' | 'seeker'` (keyword/pattern based — no new AI call, no new
  cost), plus `stashPostHandoff(text)` / `consumePostHandoff()` (sessionStorage, read-once).
- `src/components/PostHandoffBox.tsx` (new, client): textarea + "Continue →" button on
  `/post`, above the 3 choice cards. Classifies on submit, stashes the text, routes to the
  matching form.
- `src/app/post/page.tsx`: render `<PostHandoffBox />` above the existing cards. Stays a
  server component (metadata unchanged).
- `PostAircraftForm.tsx` / `PostPartnershipForm.tsx` / `PostSeekerListingForm.tsx`: one new
  mount-time effect that calls `consumePostHandoff()`; if present, fills the existing
  `aiPromptRef` textarea (dispatching `input` so autosave/`hasAiPrompt` pick it up) and,
  only when `isLoggedIn`, calls the form's own existing `handleGenerate()`. Also add a
  small "Not the right type? Choose again →" link (to `/post`) next to the AI-prefill box
  on all three forms, as a recovery path if the guess was wrong.
- No schema change, no new server action, no new AI prompt — reuses each form's existing
  `generate*Draft`/`generate*DraftFromUrl` action untouched.

## Acceptance criteria
- On `/post`, pasting a partnership-flavored note (e.g. "selling a 1/4 share in our
  Cirrus...") and hitting Continue lands on `/partnerships/new` with the AI box already
  containing that text; when logged in, the draft auto-generates without another click.
- Pasting a seeker-flavored note ("looking to join a partnership near KAUS...") routes to
  `/partnerships/seeking/new`; pasting a bare URL never routes to the seeker form (it has
  no URL-fetch path); anything else (or ambiguous text) defaults to `/aircraft/new`.
- When logged out, the handoff still fills the target form's AI textarea (visible, ready)
  but does NOT auto-click generate (that would immediately bounce to `/auth`, which is
  needlessly jarring) — the user clicks "Prefill from your notes ✨" themselves.
- The handoff fires once: reloading the target page or navigating back to it a second time
  does not re-fill or re-generate.
- All three forms show a small "Not the right type? Choose again →" link back to `/post`.
- `npx next build` + typecheck clean; QA smoke passes on `/post`, `/aircraft/new`,
  `/partnerships/new`, `/partnerships/seeking/new` at desktop 1280 + mobile 375 (HTTP 200,
  no console errors, no horizontal overflow).

## Out of scope
- No new AI/LLM call for classification — pure keyword heuristic, kept deliberately simple
  and reviewable.
- No attempt to preserve the pasted text if the user clicks "Choose again" back to `/post`.
- No change to the existing per-form AI-draft extraction logic itself.
