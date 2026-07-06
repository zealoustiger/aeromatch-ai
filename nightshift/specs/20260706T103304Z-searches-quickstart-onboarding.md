# Spec: Quick-start onboarding on `/searches` (empty state)

## Tier
`[P1][want]` — "Post-signup onboarding: 'What are you looking for?'" (BACKLOG.md,
Pillar 2 section). Human-requested backlog item, outranks `[goal]` alert work this
cycle per the strict allocation cascade.

## Goal
When a signed-in user has zero saved searches, `/searches` currently shows a static
dashed "No saved searches yet — go set filters elsewhere" dead end. Replace it with a
one-screen quick-start form (marketplace + make + optional home airport/budget) that
instantly creates a real saved search AND turns on email alerts for it — converting a
raw signup into an engaged, alerted user in one step, with zero new friction (the
user's account email is already known, so no email field is needed).

## Scope
- New client component `src/components/QuickStartSearchForm.tsx`:
  - Marketplace toggle: "Aircraft for sale" (`/aircraft`) / "Partnerships" (`/partnerships`).
  - Make (free-text, optional) → `make` param (both marketplaces).
  - Home airport (optional, partnerships only) → reuse `AirportFormInput` → `airport` param.
  - Max budget (optional, numeric) → `max_price` (aircraft) / `max_monthly` (partnerships).
  - On submit: build the query string in the exact shape `autoNameSearch`/the browse
    pages/`alert-digest`'s `parseSourcePath` already expect (no new param names), call
    `saveSearch(name, params, path)` then `subscribeToAlerts(userEmail, context, sourcePath)`,
    fire `track('alert_subscribed', { context, source_path })`, then `router.refresh()`.
  - Treat a same-name save collision / duplicate alert row as idempotent success
    (mirrors `SaveSearchButton`'s existing handling).
- Edit `src/app/searches/page.tsx`: pass the signed-in user's email into the new
  component and render it in place of the dashed "No saved searches yet" block
  (only in the zero-saved-searches branch); keep the existing 3-tile welcome card as-is.
- No schema change. No edits to `src/app/auth/**` (frozen) — entry point is the
  existing zero-state on `/searches`, not a new post-auth redirect hook.

## Acceptance criteria
- [ ] A signed-in user with 0 saved searches sees the new quick-start form on `/searches`
      instead of the old static dead-end box.
- [ ] Submitting (with or without optional fields filled) creates one `saved_searches`
      row visible in the list after refresh, and one `alerts` row for the user's account
      email with a matching `source_path`/context.
- [ ] `alert_subscribed` fires with `{context, source_path}` on successful submit.
- [ ] Works correctly for both the Aircraft and Partnerships toggle states, producing
      param shapes that `autoNameSearch` and `alert-digest`'s `parseSourcePath` parse
      correctly (verified by code read, not just runtime).
- [ ] A user who already has ≥1 saved search never sees this form (existing populated
      view unchanged).
- [ ] No console errors, no horizontal overflow at 375px or 1280px; QA smoke passes.

## Out of scope
- The "Also post yourself as looking for a share?" seeker cross-post offer mentioned
  in the original backlog line (separate slice).
- Any change to the auth callback / post-signup redirect (frozen file) — this ships as
  an improvement to the existing `/searches` zero-state, which is where a fresh signup
  already lands by default (`/auth`'s no-`next` fallback).
- Model-level filtering (only `make`, not `model`) — kept to one field to avoid a
  make/model substring-matching bug (the `make` column is ILIKE-matched, so free text
  like "Cessna 172" would silently zero-match).
