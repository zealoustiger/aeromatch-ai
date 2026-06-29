# Start over — cancel in-flight autofill on the partnership & seeker post forms

**Slug:** start-over-autofill-guard-siblings
**Pillar:** 1 — Frictionless listing posting (data-integrity guardrail)
**Date:** 2026-06-29

## Goal
Make "Start over" reliably clear the draft on the **partnership** and **seeking** post
forms, even mid-autofill — mirroring the guard already shipped on the aircraft form
(`start-over-cancels-autofill`, 2026-06-28). Today, a resolving FAA N-number lookup or AI
"Prefill from your notes" can re-populate the just-cleared form and silently re-arm the
autosaved draft, so a seller who hits "Start over" can have their wiped listing reappear.

## Background / the bug
`PostAircraftForm` was hardened with a monotonic `fillTokenRef`: `handleStartOver` bumps the
token before `reset()`, and each async fill (`handleLookup`, `handleGenerate`) captures the
token before its `await` and **bails on resolve** if the token advanced (no field writes, no
status, no auto-open, no autosave re-arm). The two sibling forms never got this:
- `PostPartnershipForm` has BOTH `handleLookup` (FAA lookup, onBlur of the N-number field)
  and `handleGenerate` (AI prefill) that write to the form after an `await`, but
  `handleStartOver` only calls `reset()`. Same race. It also never remounts its photo
  uploader, so uploaded thumbnails persist past "Start over".
- `PostSeekerListingForm` has `handleGenerate` (AI prefill) with the same gap; `handleStartOver`
  only calls `reset()`. (No N-number lookup, no photo uploader on this form.)

## Scope (files)
- `src/components/PostPartnershipForm.tsx` — add `fillTokenRef`; bump it in `handleStartOver`
  (+ clear stale `lookupStatus`/`aiError` + remount the photo uploader); capture+check the
  token in `handleLookup` and `handleGenerate`.
- `src/components/PostSeekerListingForm.tsx` — add `fillTokenRef`; bump it in `handleStartOver`
  (+ clear stale `aiError`); capture+check the token in `handleGenerate`.

Mirror the proven aircraft-form implementation exactly; no new dependencies.

## Acceptance criteria
1. `npx tsc --noEmit` and `npx next build` pass clean.
2. On the partnership form: starting a draft, triggering an FAA lookup (or AI prefill), then
   clicking "Start over" while it's in flight → after the async resolves, make/model/year are
   blank, no "Found: …" status, "More details" is not force-opened, and the autosaved draft
   (`localStorage['ch:draft:partnership-new']`) is cleared (not re-written).
3. Partnership "Start over" also clears the photo uploader's thumbnails (uploader remounts).
4. On the seeker form: starting a draft, triggering AI prefill, then "Start over" mid-flight
   → fields stay blank and `localStorage['ch:draft:seeker-new']` is cleared.
5. Positive control unchanged: a normal lookup / prefill (no "Start over") still fills the
   form on both sibling forms.
6. No change to server actions, validation, the FAA route, upload endpoints, the data model,
   or any copy/layout; the aircraft form is untouched.
7. QA smoke (production build) green on `/partnerships/new`, `/partnerships/seeking/new`:
   HTTP 200, no app-origin console errors, no horizontal overflow at 1280 + 375.

## Out of scope
- Cancelling the in-flight network request itself (we only ignore its result — same as the
  aircraft form).
- Any required-field / form-structure changes; any change to the aircraft form.
- Touching `/auth` or any Pillar 2 work.
