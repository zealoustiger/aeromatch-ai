# partnership-url-prefill

## Goal
Extend the "paste a link to your listing" AI-prefill path (already live on `/aircraft/new`) to the partnership post form (`/partnerships/new`), so a co-owner posting a share can paste a URL to an existing listing instead of retyping it.

## Scope
- `src/app/actions.ts`: extract `draftPartnershipFromText(text)` from the body of `generatePartnershipDraft` (mirrors the existing `draftAircraftFromText` extraction), add `generatePartnershipDraftFromUrl(rawUrl)` that reuses `assertSafePublicUrl` + `htmlToReadableText` (already imported) and shares the existing `checkAiDraftAccess` per-user rate limit — same shape as `generateAircraftDraftFromUrl`.
- `src/components/PostPartnershipForm.tsx`: `handleGenerate` detects a bare URL (same `^https?:\/\/\S+$` regex as the aircraft form) and calls the new action instead of the text-draft action; update the AI-prefill helper copy/placeholder to mention pasting a link.

## Acceptance criteria
- `generatePartnershipDraftFromUrl` exists, is SSRF-guarded via `assertSafePublicUrl`, and shares the same 10/hr `checkAiDraftAccess` quota as the text path (no way to bypass the rate limit via the URL path).
- `draftPartnershipFromText` is a straight extraction of the existing prompt/tool-call logic — no behavior change to the pasted-text path (same fields extracted, same limits).
- `/partnerships/new`'s AI-prefill textarea accepts either free text or a bare URL and routes to the correct action client-side, matching the aircraft form's existing UX.
- `npx next build` + `tsc --noEmit` pass clean.
- qa-smoke passes on `/partnerships/new` (and `/aircraft/new` as a regression check) at desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow.
- No schema change, no new dependency, no change to `/auth` or any frozen path.

## Out of scope
- The seeker form (`/partnerships/seeking/new`) — no external "seeking" listings exist to link to, so a URL-paste path there has no real use case.
- Any change to the FAA N-number lookup, autosave, or edit flows (all untouched).
