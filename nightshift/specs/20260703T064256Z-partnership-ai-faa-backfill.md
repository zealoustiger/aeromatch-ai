# Spec: partnership-ai-faa-backfill

## Goal
Close the paste-and-prefill parity gap between the two post forms: when a pasted
partnership listing mentions an N-number but the AI draft can't pin down make/model/year,
auto-chain an FAA registry lookup to backfill just the missing fields — the same pattern
`/aircraft/new` already ships, but `/partnerships/new` currently only does this on a
manual "Look up →" click.

## Scope
- `src/components/PostPartnershipForm.tsx`:
  - `handleLookup` — add an `{ onlyEmpty?: boolean }` option (mirrors
    `PostAircraftForm.tsx`'s existing implementation): when `onlyEmpty` is true, only fill
    make/model/year fields that are currently blank, never clobber a value the AI already
    extracted.
  - `handleGenerate` — after filling the AI draft's fields, if `result.registration` is
    present and make/model/year are still incomplete, call `handleLookup({ onlyEmpty: true })`.
- No changes to `src/app/actions.ts` (the extraction schema is untouched — this is purely
  UI-side chaining, reusing the existing `/api/faa-lookup` route).
- No schema change, no DB migration.

## Acceptance criteria
- Pasting text that mentions an N-number but omits make/model/year (e.g. "1/3 share
  available in N739WL, based at KAUS, $15k buy-in") triggers the AI draft, then
  auto-backfills make/model/year from the FAA registry without user action.
- Pasting text where the AI already extracted make/model/year does NOT trigger a
  registry call that clobbers those values (onlyEmpty semantics preserved).
- The manual "Look up →" button and blur-triggered lookup continue to work exactly as
  before (default `onlyEmpty: false`, authoritative overwrite).
- `npx next build` + typecheck pass clean.
- QA smoke passes on `/partnerships/new` at desktop 1280 + mobile 375: HTTP 200, zero
  app-origin console errors, zero horizontal overflow.

## Out of scope
- Any change to the aircraft or seeker forms (already correct / not applicable).
- The "paste a source URL" variant of paste-and-prefill (requires new server-side fetch
  infra with SSRF mitigations — too large/risky for a single unattended cycle; left as a
  BACKLOG follow-up).
- Any change to the extraction schema/prompt in `src/app/actions.ts`.
