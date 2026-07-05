# seeker-ai-draft-url-guard

## Goal
Stop the seeker post form's "Prefill from your notes ✨" box from silently mis-extracting a
pasted URL as if it were personal notes, closing a Pillar-1 (frictionless posting) parity gap
against the aircraft/partnership forms.

## Context
The aircraft and partnership post forms both detect a bare URL pasted into their AI-prefill box
and route it through a dedicated URL-fetch extraction path (`generateAircraftDraftFromUrl`,
`generatePartnershipDraftFromUrl`) — their placeholder copy explicitly invites "paste a link to
your listing on another site." The seeker form's AI box has no such branch: `handleGenerate`
(`src/components/PostSeekerListingForm.tsx`) always calls `generateSeekerDraft(text)`, which ships
the raw string straight to Claude as free-text notes. This is intentional — seeker listings (a
pilot describing themselves) have no analogous external source page to fetch, unlike a for-sale
listing. But a user who's seen the paste-a-link pattern work on the other two post types may try
it here too, and instead of a clear "that's not supported here" message, they silently get a
low-quality/misleading draft: Claude will still produce a title+description (required by the tool
schema) and may extract structured fields (make/model/etc.) from words present in the URL's own
slug (e.g. a link to a for-sale "cessna-172" listing could get treated as the pilot's own aircraft
preference) — backwards and confusing, with no error shown.

## Scope
- `src/components/PostSeekerListingForm.tsx`: in `handleGenerate`, detect a bare-URL paste (same
  `/^https?:\/\/\S+$/i` check the other two forms use) before calling `generateSeekerDraft`. When
  detected, skip the API call entirely and show an inline explanatory message via the existing
  `aiError` state (no new UI element) — something like: "This works from your own notes about
  yourself — not a link. Seeker posts don't have a listing page to read from; try describing your
  experience, budget, and what you're looking for instead."
- No server action, schema, or route change. No change to `generateSeekerDraft` itself.

## Acceptance criteria
- Pasting a bare URL (e.g. `https://www.barnstormers.com/aircraft-for-sale/12345`) into the
  seeker form's AI-prefill textarea and clicking "Prefill from your notes ✨" shows the new
  inline message and does NOT call the Claude API or touch any form field.
- Pasting normal free-text notes (the existing supported path) still calls `generateSeekerDraft`
  and fills the form exactly as before — no behavior change for the common case.
- A URL embedded in a longer sentence (not a bare URL on its own) still goes through the normal
  extraction path unchanged — only an exact bare-URL match is intercepted, matching the other two
  forms' own detection regex.
- `npx next build` + typecheck pass.
- QA smoke (`/partnerships/seeking/new`) passes: HTTP 200, no console errors, no horizontal
  overflow, at desktop 1280 + mobile 375.
- No schema change, no change to `src/app/actions.ts`, no auth/admin files touched.

## Out of scope
- Building an actual URL-fetch extraction path for the seeker form (no analogous external source
  page exists for a "pilot seeking a partnership" post — this was already decided against).
- Any change to the aircraft/partnership forms' existing URL-fetch behavior.
