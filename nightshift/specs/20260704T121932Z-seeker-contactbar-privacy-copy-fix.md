# seeker-contactbar-privacy-copy-fix

## Goal
Fix a misleading privacy claim in `SeekerContactBar` (rendered on `/partnerships/seeking/[id]`): the copy shown to logged-out visitors says "contact details are only shown to signed-in members," but the component's own `showEmail`/`showPhone` logic never checks login state — the email/phone reveal buttons render for everyone, logged in or not. Bring the copy in line with the actual (correct, intentional, and consistent with the sibling aircraft/partnership `ContactBar`) behavior instead of over-promising a gate that doesn't exist.

## Scope
- `src/components/SeekerContactBar.tsx` — replace the `!user` conditional paragraph (lines ~128-135) with copy that doesn't claim a signed-in-only gate. Match the sibling `ContactBar.tsx` pattern (aircraft/partnership), which makes no such privacy claim at all and just shows "Contact {name}."
- No change to `showEmail`/`showPhone`/`canMessage` logic, no change to the actual messaging auth-gate (`handleSend`'s `!user` → `/auth?next=...` redirect, which is correct and unrelated to this bug).
- No schema/query change.

## Acceptance criteria
- Logged-out visitors on a real `/partnerships/seeking/[id]` no longer see the false "contact details are only shown to signed-in members" claim.
- The email/phone reveal buttons' actual visibility/behavior is unchanged (still governed only by `contactMethod`, matching `ContactBar.tsx`'s pattern) — this is a copy-only fix, not a new gate.
- The "Send Message" button's existing sign-in-and-return behavior (`?next=...&contact=1`, draft preserved) is unchanged.
- `npx next build` + typecheck pass clean.
- QA smoke passes on `/partnerships/seeking/[id]` (a real listing) at desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow.
- Screenshots (visual/copy cycle) confirm the new copy renders cleanly with no layout regression.

## Out of scope
- Do NOT add real login-gated contact-info hiding (would be a bigger, riskier behavior change and isn't what any other listing type does — the reveal-to-everyone behavior is the intentional, existing design).
- Do NOT touch `src/app/auth/**` or any other frozen file.
- Do NOT touch the `/saved` / `DeviceSavedListings` empty-state copy gap (a separate, smaller finding from this cycle's audit) — left as a `Next` note for a future cycle.
