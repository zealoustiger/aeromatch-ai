# auth-savesearch-concrete-copy

**Goal:** Make `/auth`'s copy concrete about what's waiting when a visitor arrives via the
"Save this search" round-trip, so a distracted/interrupted visitor has a stronger reason to
come back and click the magic link.

**Background:** BACKLOG.md `[P1][want]` (added 2026-07-11, real PostHog session data): a
visitor filtered `/partnerships`, clicked "Save this search," landed on generic `/auth` copy
("Sign in to ClubHanger" / "no password needed"), and never returned. `SaveSearchButton.tsx`
already appends `?...&saveSearch=1` to the post-auth `next=` URL, but `deriveAuthContext()` in
`src/app/auth/page.tsx` has no case for it, so this path falls through to the generic default.
Scoped to sub-item (2) from the backlog entry — copy-only, lowest risk. Sub-item (1) (whether
to also surface the lighter `AlertSignup` next to "Save this search") is a bigger product call
left for a human/future cycle.

**Scope:**
- `src/app/auth/page.tsx` — `deriveAuthContext()`: detect `saveSearch=1` in the `next` query
  string, strip it, and build a concrete heading/subtext naming the actual search using the
  existing `autoNameSearch()` helper (`src/lib/savedSearchName.ts`) — e.g. "Your Cessna 172
  search is saved as soon as you click the link."
- No change to `SaveSearchButton.tsx`, `savedSearchName.ts`, or the auto-save-on-return logic.

**Acceptance criteria:**
- Visiting `/auth?next=%2Fpartnerships%3Fmake%3DCessna%26saveSearch%3D1` shows a heading/subtext
  naming the Cessna partnership search (not the generic "Sign in to ClubHanger" copy).
- Same for an `/aircraft` and `/partnerships/seeking` save-search round-trip.
- All pre-existing `deriveAuthContext` cases (listing contact, post flows, `/saved`, generic
  default) are unchanged.
- `next build` + typecheck pass; QA smoke passes on `/auth` (desktop 1280 + mobile 375, no
  console errors, no overflow).
- No schema/action/component-signature change — pure copy logic in one file.

**Out of scope:** whether `/partnerships`/`/aircraft` should also show the lighter `AlertSignup`
next to "Save this search" (sub-item 1, a bigger product call); any change to the save-on-return
auto-trigger behavior itself.
