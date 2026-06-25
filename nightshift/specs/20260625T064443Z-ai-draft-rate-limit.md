# Spec: AI draft generation — auth check + rate limiting

**Timestamp:** 20260625T064443Z  
**Slug:** ai-draft-rate-limit  
**Lane:** [want] (slice 3 of "[P2][want] Generate with AI" — explicit next step from `partnership-ai-draft` CHANGELOG)

## Goal
Add an authentication check and a simple per-user rate limit to the two AI draft generation server actions (`generatePartnershipDraft`, `generateSeekerDraft`) so that unauthenticated callers are rejected and logged-in users are throttled to a reasonable limit. Prevents accidental or malicious cost overruns before wide traffic.

## Scope
- `src/app/actions.ts` — two functions modified, one helper added

## Acceptance criteria
1. Both `generatePartnershipDraft` and `generateSeekerDraft` reject unauthenticated callers with a clear error (`"Not authenticated."`)
2. Both enforce a per-user rate limit (10 AI draft calls per hour); a 11th call within the same hour returns `"Too many AI draft requests — please wait a bit before trying again."`
3. Authenticated users within the limit still receive drafts normally
4. `npx next build` passes with zero new TypeScript errors in touched files
5. QA smoke: `/partnerships/new` and `/partnerships/seeking/new` at desktop 1280 + mobile 375 — HTTP 200, zero app-origin console errors, zero horizontal overflow

## Out of scope
- Redis/KV-backed distributed rate limiting (not needed at current traffic)
- Schema changes or new DB tables
- UI changes to the form components
- Rate limiting other non-AI server actions
