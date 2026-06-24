# Spec — Inline rename of saved searches on `/searches`

**Lane:** `[want]` (last non-bug cycle `model-curate-diamond-da42-da20` pulled `[goal]` → alternate to `[want]`).
**Backlog item:** `[P2][want] One-click save search: auto-name + skip the naming step` — **slice 2: inline rename on the Saved Searches page** (slice 1, one-click auto-named save, already shipped in `SaveSearchButton`/`autoNameSearch`).

## Goal
Let a signed-in pilot rename any saved search **inline** on `/searches`, since saving now auto-generates the name (slice 1) and there's currently no way to fix or personalize it.

## Scope (small)
- `src/app/actions.ts` — add `renameSavedSearch(id, name)` server action mirroring `deleteSavedSearch` (owner-scoped via `user_id` + RLS; handle the same `23505` duplicate-name collision as `saveSearch`; `revalidatePath('/searches')`).
- `src/components/RenameSavedSearch.tsx` — new client component: shows the name with a pencil edit affordance; clicking opens an inline input with Save/Cancel; calls the action; shows a friendly inline error on a duplicate-name collision; Enter saves, Escape cancels.
- `src/app/searches/page.tsx` — swap the static `<p>{s.name}</p>` for `<RenameSavedSearch id={s.id} name={s.name} />` (badge stays a sibling).

## Acceptance criteria
- A pencil/edit affordance appears next to each saved-search name on `/searches`.
- Clicking it turns the name into a text input pre-filled with the current name + Save/Cancel controls; Enter saves, Escape cancels.
- Saving a valid new name persists it (visible after the page revalidates) and exits edit mode.
- Empty/whitespace-only names are rejected (no-op / disabled save); renaming to a name that already exists for the user shows a friendly inline message, not a crash.
- No schema change. Rename is owner-scoped (cannot rename another user's row). `npx next build` + typecheck green; QA smoke exit 0 on `/searches` at 1280 + 375 with no app-origin console errors and no horizontal overflow.

## Out of scope
- Renaming from anywhere other than `/searches`.
- Editing the search criteria/params themselves (only the display name).
- Any schema/migration, alert-delivery, or the still-open partnership/seeking filter parity items.
- The other (already-shipped) slices of this and neighboring backlog items.
