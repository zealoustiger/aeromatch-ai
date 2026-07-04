# guest-saved-nav-link

## Goal
Give logged-out visitors who've hearted listings (device-only "soft save") a way back
to `/saved` from the nav — today there is none, so the value the soft-save feature is
meant to preserve is undiscoverable once the save prompt closes.

## Scope
- `src/components/Nav.tsx` only:
  - Desktop right-actions row: when there's no `user` AND `localSaveCount() > 0`, show
    a small "Saved" link/icon (heart) to `/saved`, next to the existing "Sign in" link.
  - Mobile menu: when there's no `user` AND `localSaveCount() > 0`, show the same
    "Saved" row that logged-in users already get (mirrors the existing `{user && (...)}`
    Saved block, same icon/label/active-state styling), instead of hiding it entirely.
  - Track the local-save count reactively via the existing `getLocalSaves`/
    `localSaveCount`/`LOCAL_SAVES_EVENT` pattern already used in `SaveListingButton.tsx`
    (mount-time read + `LOCAL_SAVES_EVENT` listener), so the link appears the moment a
    guest hearts their first listing without a page reload, and disappears if they
    un-save everything.
- No change to `/saved/page.tsx`, `SoftSavePrompt.tsx`, `localSaves.ts`, or any auth file.

## Acceptance criteria
- A guest with zero local saves sees no "Saved" nav entry (desktop or mobile) — matches
  today's behavior, no new clutter for the common first-visit case.
- A guest who hearts a listing (soft-save) sees a "Saved" link appear in both the
  desktop nav and the mobile menu without reloading the page, linking to `/saved`.
- Clicking it lands on `/saved`, which already renders `DeviceSavedListings` correctly
  for guests (no change needed there).
- Un-saving the last local save removes the nav entry (reactive, same event).
- Logged-in user's nav (ProfileMenu, mobile "Saved" row) is completely unchanged.
- `npx next build` + typecheck clean; QA smoke passes on `/`, `/aircraft`, `/partnerships`,
  `/saved` at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero
  horizontal overflow).

## Out of scope
- Merging device saves into the account on signup (already shipped, `mergeDeviceSaves`).
- Any change to `SoftSavePrompt`'s copy or behavior.
- A footer `/saved` link (not needed once nav has one; avoids redundant clutter).
