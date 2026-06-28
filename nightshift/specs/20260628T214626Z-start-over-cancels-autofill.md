# Start over cancels in-flight autofill (aircraft post form)

**Pillar:** 1 — Frictionless listing posting (data-integrity bug in the post flow).

## Goal
Clicking "Start over" on the Sell-Your-Aircraft form must truly clear the draft —
an in-flight FAA N-number lookup (or AI "Prefill from notes") that resolves *after*
the reset must NOT re-populate the just-cleared form or re-persist the draft.

## The bug (today)
`handleLookup()` (onBlur of the N-number field) and `handleGenerate()` (AI prefill)
both fetch asynchronously, then write make/model/year/etc. into the form on resolve.
If the user clicks **Start over** while one is in flight, `reset()` clears the form,
but the pending async fill then:
- re-fills make/model/year back into the cleared form,
- sets a stale "Found: …" status and force-opens "More details",
- dispatches `input`/`change` events that re-arm autosave → the cleared draft is
  written back to localStorage.
Clicking "Start over" also blurs the registration input, which can itself kick off
the lookup. Net effect: "Start over" appears not to work.

## Scope (one file)
- `src/components/PostAircraftForm.tsx`:
  - Add a monotonic `fillTokenRef` (incremented on Start over).
  - `handleLookup` / `handleGenerate`: capture the token before the await; after it
    resolves, bail out (no field writes, no status, no auto-open) if the token has
    advanced — i.e. a reset happened meanwhile.
  - `handleStartOver`: bump the token and clear stale lookup/AI status so the UI
    reflects the cleared state.

## Acceptance criteria
- `npx next build` + typecheck pass.
- Start over while an FAA lookup is in flight leaves the form empty: make/model/year
  stay blank, no "Found: …" message, "More details" not force-opened, and no draft is
  re-written to localStorage.
- Same guarantee for the AI "Prefill from notes" path.
- A normal lookup / AI prefill (no Start over) still fills the form exactly as before.
- No new console errors; no horizontal overflow at 1280 + 375; HTTP 200 on `/aircraft/new`.

## Out of scope
- Aborting the underlying `fetch` (the token guard is sufficient; cancelling the
  network call is a nice-to-have, not required).
- Any change to `useFormDraft`, the FAA route, the data model, or other forms.
- Partnership/seeker forms (they have no N-number lookup race on a Start-over control).
