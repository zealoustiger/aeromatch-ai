# seeker-edit-additional-airports-fallback

## Goal
Fix the seeker "Edit Your Seeking Listing" page (`/partnerships/seeking/[id]/edit`), which currently 404s for every existing seeker listing on today's unmigrated DB because its `.select()` explicitly names the not-yet-applied `additional_airports` column with no fallback.

## Scope
- `src/app/partnerships/seeking/[id]/edit/page.tsx` — add the same graceful column-fallback pattern already used by `src/app/aircraft/listing/[id]/edit/page.tsx` (single optional column) and `src/app/partnerships/[id]/edit/page.tsx` (retry-on-named-column-error): try the select with `additional_airports`, and on an error naming that column, retry without it, treating `additional_airports` as `null`/absent for `initialValues`.
- No other files. No schema/migration change (the migration itself stays pending on the human).

## Acceptance criteria
- Visiting `/partnerships/seeking/[id]/edit` as the owner of an existing seeker listing loads the form successfully (no `notFound()`) whether or not `additional_airports` exists on the DB today.
- If the column is absent, the form still loads with every other field prefilled correctly; `additional_airport_2` is simply left blank (matches the create-path's existing graceful degradation).
- If the column is present (future, once migrated), behavior is unchanged from today — `additional_airport_2` prefills from `listing.additional_airports?.[0]`.
- Non-owner / logged-out / missing-listing behavior is unchanged (still `notFound()` / redirect to `/auth`).
- `npx next build` + typecheck clean.
- QA smoke passes on `/partnerships/seeking/new` and a seeker edit URL (or `/partnerships/seeking` list + a real seeker detail page as a proxy, since edit requires an authenticated owner session) at desktop 1280 + mobile 375.

## Out of scope
- Applying the `seeker_additional_airports` migration itself (human action).
- Any other seeker-form field or the create-path (already has the correct fallback).
