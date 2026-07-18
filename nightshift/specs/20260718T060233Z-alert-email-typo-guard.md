# Email-typo guard at alert capture

## Goal
Catch typo'd domains (`gmial.com`, `gmail.con`, `yaho.com`…) at the `AlertSignup` email
field with a one-tap, suggest-only "Did you mean **name@gmail.com**?" chip, so a visitor
who fat-fingers their address doesn't silently end up with a dead pending alert.

## Scope
- New pure `src/lib/suggestEmailFix.ts` (+ `suggestEmailFix.test.ts`, `node --test` style
  matching `emailProviderLink.ts`/`.test.ts`): `suggestEmailFix(email): string | null`,
  edit-distance-≤1 (Damerau-Levenshtein — covers transpositions like `gmial`) match
  against the top ~10 consumer domains (gmail/yahoo/hotmail/outlook/icloud/aol/live/msn/
  comcast.net/me.com). Returns the corrected full address, or `null` when the domain is
  already an exact top-domain match, unrecognized, or too far off (never a wild guess).
- `src/components/AlertSignup.tsx`: derive a suggestion from the manual email input
  (the `email` state, only populated by the typed-email form branch) and render a small
  one-tap chip below the input that replaces the field value on click. Suggest-only —
  never auto-corrects, never blocks submission.

## Acceptance criteria
- `suggestEmailFix('pilot@gmial.com')` → `'pilot@gmail.com'`; `'pilot@gmail.con'` →
  `'pilot@gmail.com'`; `'pilot@yaho.com'` → `'pilot@yahoo.com'`.
- `suggestEmailFix('pilot@gmail.com')` (already correct) → `null`.
- `suggestEmailFix('pilot@corporate-flight-ops.com')` (unrelated domain) → `null`.
- Malformed input (no `@`, empty string) → `null`.
- Typing a typo'd domain into `AlertSignup`'s email field shows a "Did you mean …?" chip;
  tapping it replaces the field value; the chip never blocks/disables submission of the
  as-typed address.
- `next build` + `tsc --noEmit` clean; QA smoke (HTTP 200 / no console errors / no
  horizontal overflow) passes on a page rendering `AlertSignup` at desktop 1280 + mobile
  375; screenshots read (visual cycle — new UI chip).

## Out of scope
- The remaining-inputs sweep (`FooterAlertCapture`, `WatchAlertButton`, etc.) — separate
  `[P2][goal]` backlog item.
- Auto-correcting or blocking submission on a suspected typo.
