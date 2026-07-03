# Draft resume banner

## Goal
A visitor who starts (and autosaves) a "Post a…" draft — partnership, aircraft-for-sale,
or seeking listing — but navigates away before publishing currently has no way to know
their progress is safe or find their way back, other than remembering to return to the
exact post URL. Add a small, dismissible, site-wide banner that surfaces "you have an
unfinished listing — continue" and links straight back to it.

## Scope
- New client component `src/components/DraftResumeBanner.tsx`:
  - On mount and on every pathname change, checks `localStorage` for the three existing
    autosave keys (`ch:draft:partnership-new`, `ch:draft:aircraft-new`,
    `ch:draft:seeker-new`, written by the existing `useFormDraft` hook — no new storage
    format).
  - If a draft exists (non-empty JSON object) and the current route is NOT that draft's
    own post page (which already shows its own "Draft restored" indicator), render a
    small fixed-position card: "Unfinished listing — you started a(n) {type} listing —
    Continue draft →" + a dismiss (×) button. Dismiss hides it for the rest of the
    client-side session (in-memory state) without touching the saved draft.
  - Positioned bottom-left (`fixed bottom-20 sm:bottom-5 left-5 sm:w-80 z-40`) so it never
    overlaps the existing bottom-right `FeedbackWidget` floating button.
  - If multiple drafts exist simultaneously, show one (priority order: partnership →
    aircraft → seeker) — acceptable simplification, noted as a known limit.
- Mount it once in `src/app/layout.tsx` alongside the existing `<DeviceSaveSync />` /
  `<FeedbackWidget />` pattern (site-wide, one instance).
- Purely client-side, read-only against existing localStorage keys. No new schema, no
  new server action, no change to `useFormDraft` or any of the three post forms.

## Acceptance criteria
- With a draft manually seeded in `localStorage` under any of the three keys, the banner
  appears on an unrelated page (e.g. `/`) and links to the correct post page.
- The banner does NOT render when the current path is that draft's own post page.
- Dismissing the banner hides it; it does not delete the underlying localStorage draft.
- With no draft present in any of the three keys, nothing renders (no DOM at all —
  verified no extra empty wrapper).
- `npx next build` + `tsc --noEmit` pass; QA smoke passes at desktop 1280 + mobile 375 with
  zero console errors and zero horizontal overflow on `/` (and one post page) both with
  and without a seeded draft.
- Visual cycle — screenshots reviewed for correct placement/no overlap with the
  FeedbackWidget button.

## Out of scope
- Cross-tab/storage-event live sync (only re-checks on route change).
- Showing more than one unfinished draft at a time.
- Any change to the drafts' own autosave/restore behavior on their post pages.
