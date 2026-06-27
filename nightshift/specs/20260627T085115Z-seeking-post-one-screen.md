# Spec: seeking-post-one-screen

**Goal:** Collapse the seeking posting form to one smart screen — AI prefill at the very top, required fields in a compact "The basics" section, everything optional behind a collapsible "More details" disclosure. Mirrors what `partnership-post-one-screen` did for `/partnerships/new`.

**Scope:**
- `src/components/PostSeekerListingForm.tsx` — restructure JSX (move AI prefill to top, create "The basics" section, collapse everything else into "More details" disclosure)
- `src/app/actions.ts` — make `title` optional (auto-generate from home_airport + preferred_makes) and `contact_email` optional (fall back to `user.email`)

**Acceptance criteria:**
1. AI prefill box ("Prefill from your notes ✨") is the FIRST visible element at the top of the form, above any section cards — the fastest path is the most prominent.
2. A single compact "The basics" section shows only: Home Airport (required) + Max Buy-In (optional but prominently placed) + Title (optional label, with "Leave blank to auto-fill" hint).
3. A "More details (optional)" `<details>` disclosure is immediately below, **closed by default**, containing: Aircraft Preferences, Budget (max monthly + wet), Pilot Profile, Partnership Preferences, Description, Contact Info.
4. When AI prefill populates fields inside the closed "More details" section, the disclosure auto-opens.
5. `contact_email` is no longer required: the server action falls back to `user.email` so logged-in users don't need to type it.
6. `title` is no longer required: the server action auto-generates "Pilot seeking [makes] partnership near [ICAO]" when the field is left blank.
7. No visual regressions at 375px or 1280px. All form controls still submit values correctly.
8. `npx next build` passes with no TypeScript errors.

**Out of scope:**
- `/partnerships/new` or `/aircraft/new` (already done)
- DB schema changes
- Autosave changes (already wired via `useFormDraft`)
