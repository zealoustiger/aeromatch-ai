# seeker-contactbar-owner-view

## Goal
Fix `SeekerContactBar` so a seeker-listing owner viewing their own listing sees a neutral
"this is your listing" note instead of a broken, empty sky-blue box (heading + greeting with
zero content below it).

## Scope
- `src/components/SeekerContactBar.tsx` only.
- Add an early-return owner branch (mirroring `AircraftContactButton.tsx`'s existing
  `user?.id === posterId` pattern) right after the auto-contact `useEffect`, before
  `handleSend` is defined.
- Simplify the now-unreachable-for-owner `showEmail`/`showPhone`/`canMessage` guards since the
  owner path returns before they're computed.

## Acceptance criteria
- When the logged-in viewer's `user.id === seekerOwnerId`, the component renders only:
  `<p className="text-sm text-slate-500">This is your listing. Owners with a fitting aircraft
  can message you once they sign in.</p>` — no card, no heading, no empty box.
- Non-owner viewers (logged out, logged in as someone else) see unchanged behavior: message
  box / email / phone exactly as before.
- `npx next build` + typecheck pass.
- QA smoke passes on `/partnerships/seeking/[id]` (an existing seeker listing detail page) at
  desktop 1280 + mobile 375: HTTP 200, no new console errors, no horizontal overflow.
- No schema change, no auth file touched (`SeekerContactBar.tsx` is not in `FREEZE.md`).

## Out of scope
- `ContactBar.tsx` / `ContactButtons.tsx` (partnership contact bar) — flagged as a separate,
  milder smell (owner still sees email/call buttons, not a blank box); a future slice.
- `PartnershipLaunchBanner`'s fabricated visitor-count copy — unrelated, separate scope.
