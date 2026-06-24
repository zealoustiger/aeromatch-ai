# Post-a-Partnership form — autosave + "Saving…/Saved" indicator

**Slug:** `post-partnership-autosave`
**Lane:** `[want]` (last non-bug cycle `aircraft-hub-compare-links` pulled `[goal]`; last cycle PASS → no blocker → `[want]` owed per the 1:1).
**Item:** slice 2 of the human-set `[P1][want] "Post-a-partnership form: make posting frictionless"` (slice 1 — field changes 1–5 — shipped 2026-06-24T06:24Z).

## Goal
Stop users fearing they'll lose progress on the multi-section "Post a Partnership" form: autosave their entries locally as they type and show a clear "Saving… / Draft saved" indicator, restoring the draft if they leave and come back.

## Scope (small, additive, client-only — no schema, no server change)
- **New** `src/components/useFormDraft.ts` — a reusable client hook that snapshots a form's named text/number/select/textarea fields to `localStorage` (debounced), restores them on mount, and exposes a save `status`. Built to be reused by the parallel Post-a-Seeking form later.
- **Edit** `src/components/PostPartnershipForm.tsx` — wire the hook to the existing form: `ref` on the `<form>`, an autosave status indicator near the top, clear the draft on submit, and re-restore the draft if the submit comes back with an error.

## Acceptance criteria
1. Typing into the form persists the entered values to `localStorage` (debounced ~600ms); a visible indicator shows "Saving…" then "Draft saved".
2. Reloading the page (or navigating away and back) restores the previously-entered values into the fields, with a "Draft restored" hint.
3. On a successful post (server redirect to the new listing) the saved draft is cleared, so a fresh visit to `/partnerships/new` starts empty.
4. If a submit returns an error (form not navigated away), the user's typed values are NOT lost — they remain in the fields and the draft is retained.
5. No console errors; no horizontal overflow at desktop 1280 + mobile 375; `next build` + typecheck green.
6. Fails soft when `localStorage` is unavailable/full (wrapped in try/catch) — the form still works exactly as before.

## Out of scope
- The Post-a-Seeking form (separate item/slice) — the hook is written reusably but only wired into the partnership form this cycle.
- 375px micro-polish beyond confirming no overflow (that's slice 3).
- Server-side drafts / cross-device sync (local only).
- Any change to the submit/redirect server action (`createPartnership`) or DB schema.
