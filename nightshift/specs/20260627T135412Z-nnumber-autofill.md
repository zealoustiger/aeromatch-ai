# Spec: nnumber-autofill

**UTC:** 2026-06-27T135412Z  
**Pillar:** 1 — Frictionless listing posting  
**Slug:** nnumber-autofill

## Goal
Surface the N-number field at the top of the aircraft post form and auto-trigger the FAA lookup on blur, so typing a tail number automatically fills Make, Model, and Year — no button click, no accordion expansion required.

## Problem
The `/api/faa-lookup` route exists and the "Look up →" button is wired up, but the N-number field is buried in the collapsed "More details" accordion. Users posting an aircraft still have to manually type Make, Model, and Year even though the FAA registry can fill them in instantly. Three required/frequent fields replaced by one — but only if the user discovers the lookup.

## Scope
One file changed: `src/components/PostAircraftForm.tsx`

- Move the N-number (Registration) row OUT of "More details" INTO "The basics" section, above the Make/Model grid.
- Add `onBlur` auto-trigger: when the field loses focus (and has a non-empty value), call `handleLookup()` automatically — no button press needed.
- Keep the "Look up →" button for explicit re-triggering (e.g. user changes the N-number).
- Show an inline status message ("Searching…" / "Found: 2006 Cessna 182T" / "Not found — fill in manually") below the N-number input.
- After a successful lookup, auto-open "More details" (already exists) so Year is visible + pre-filled.
- Remove the N-number input from "More details" to avoid duplication.

## Acceptance criteria
1. On `/aircraft/new`, the N-number field is visible without expanding the accordion.
2. Typing a valid N-number (e.g. N12345) and pressing Tab triggers the FAA lookup automatically — no button click needed.
3. A successful lookup fills the Make dropdown and Model input in "The basics" section, and fills Year in "More details" (which auto-opens).
4. The status message shows "Found: <year> <make> <model>" in green on success, and "Not found — fill in manually" in slate on failure.
5. The "Look up →" button still works for explicit re-lookup (e.g. after changing the N-number).
6. Make and Model remain required fields (pre-filled by lookup, still editable).
7. The N-number field does NOT appear twice (removed from "More details").

## Out of scope
- Serial number lookup (FAA doesn't return serial)
- Changing the Make dropdown options
- Any schema or server-action changes
- Changes to any other file
