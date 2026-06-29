# ai-prefill-faa-backfill

## Goal
On the **Sell an aircraft** post form (`/aircraft/new`), when the AI "Prefill from your
notes" step extracts an N-number but can't determine make/model/year from the text,
automatically run the existing authoritative FAA registry lookup to backfill those
fields — so a seller who pastes almost nothing ("Selling N739WL, hangared at KAUS,
$180k") still gets a near-complete, registry-accurate listing in one click.

## Pillar / rotation
Pillar 1 (frictionless listing posting). Advances the BACKLOG `[P1][goal]` "Paste &
prefill the whole form" item by fusing AI extraction with FAA-registry truth. Last
cycle was Pillar 3 (partnership-airframe-time); the one before Pillar 1 — most recent
was P3, so Pillar 1 is due. Pillar 2's headline items (Google OAuth, email-only signup)
remain human-blocked behind the frozen `/auth`.

## Scope (small)
- `src/components/PostAircraftForm.tsx` only.
  - Give `handleLookup` an optional `{ onlyEmpty }` mode that fills make/model/year
    **only when those fields are currently blank** (the manual "Look up →" button / blur
    path keeps its existing authoritative-overwrite behavior).
  - At the end of `handleGenerate` (after the AI fills fields, still inside the same
    in-flight token guard), if the AI returned a `registration` **and** at least one of
    make/model/year is still empty, `await` a chained `handleLookup({ onlyEmpty: true })`
    so the registry backfills the gaps. The button keeps showing "Prefilling…" until both
    finish.

## Acceptance criteria
- [ ] `npx next build` + typecheck pass.
- [ ] `/aircraft/new` renders at desktop 1280 + mobile 375 with HTTP 200, no app-origin
      console errors, no horizontal overflow (qa-smoke exit 0).
- [ ] The manual "Look up →" button / N-number blur path is unchanged (still fills/over-
      writes make/model/year from the registry).
- [ ] The chained backfill only runs when a registration was extracted AND at least one of
      make/model/year is empty; it never overwrites a value the AI already set.
- [ ] Honesty/data-integrity: backfilled values come only from the existing
      `/api/faa-lookup` registry route (never fabricated); if the registry returns
      not-found/unavailable, the AI's values are left intact and nothing is invented.
- [ ] The "Start over" in-flight guard (`fillTokenRef`) still cancels a chained lookup
      (no re-population of a cleared form).

## Out of scope
- The partnership form (`PostPartnershipForm`) — same pattern, queued as the next slice.
- Any change to the FAA route, the AI draft action, the data model, or required fields.
- Surfacing `registrantType` (separate idea).
