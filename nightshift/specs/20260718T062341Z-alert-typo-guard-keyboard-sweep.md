# Typo-guard + mobile-keyboard attribute sweep on remaining alert email inputs

## Goal
Extend the "did you mean gmail.com?" typo-guard chip and the mobile-keyboard-friendly
input attributes (`inputMode="email"`, `spellCheck={false}`, `enterKeyHint="send"`,
`autoComplete="email"`) from `AlertSignup` (shipped last cycle) to every other real
email-entry input in the alert flow, so fat-finger typos and clunky mobile keyboards
aren't a silent capture-failure risk anywhere a visitor types their own email for alerts.

## Scoping note (verified by direct code read before writing this spec)
BACKLOG.md's item named `FooterAlertCapture`, `WatchAlertButton`, `ContactBarWatchButton`,
`SavedListingWatchButton`, `SaveListingButton`'s cross-sell field, `NewAlertForm`, and
`MobileStickyAlertBar` as "remaining capture inputs." Reading each: only
**`FooterAlertCapture`** actually renders its own `<input type="email">`. The other five
have NO email input of their own — `WatchAlertButton`/`SavedListingWatchButton`/
`SaveListingButton`/`ContactBarWatchButton` are signed-in one-tap or remembered-email
one-tap buttons that defer to `AlertSignup`'s field (via scroll+focus) when no email is
known; `NewAlertForm` is a criteria-only form (make/model/state/price) for
already-identified owners/tokens, no email field; `MobileStickyAlertBar` never renders an
inline field either (also just scrolls+focuses `#alert-email` or one-taps). So there is
nothing to change in those six components.

A grep for every `type="email"` input in `src/` also surfaced **`UpdateAlertEmailForm`**
(`/alerts/manage`'s "change the email these alerts go to" flow) — not named in the
backlog item, but the exact same class of typo risk (silently misroutes every future
alert to a fat-fingered new address) and the same alert-management surface, so it's
included in this sweep. Non-alert email inputs elsewhere (post-listing contact email,
auth, feedback widget, admin lookup) are out of scope — this item is specifically about
the alert-capture/alert-management flow.

## Scope
- `src/components/AlertSignup.tsx` — its email input already has `autoComplete="email"`
  and the typo-guard chip (shipped in `alert-email-typo-guard`); add the 3 missing
  attributes (`inputMode`, `spellCheck`, `enterKeyHint`).
- `src/components/FooterAlertCapture.tsx` — add the typo-guard chip (reusing
  `suggestEmailFix`) plus all 4 attributes to its email input.
- `src/components/UpdateAlertEmailForm.tsx` — add the typo-guard chip plus all 4
  attributes to its email input.

## Acceptance criteria
- All three email inputs render `inputMode="email"`, `spellCheck={false}`,
  `enterKeyHint="send"`, `autoComplete="email"`.
- `FooterAlertCapture` and `UpdateAlertEmailForm` show the same suggest-only "Did you
  mean pilot@gmail.com?" chip as `AlertSignup` when a near-miss domain is typed; clicking
  it fills the corrected address without submitting; the chip never blocks submission of
  the as-typed address.
- No change to `AlertSignup`'s existing chip behavior (already shipped/tested).
- `npx tsc --noEmit` and `npx next build` both exit 0; existing `suggestEmailFix` unit
  tests still pass unmodified (pure function, no changes to its logic).
- QA: production build smoke pass (HTTP 200, 0 console errors, 0 horizontal overflow at
  1280/375) on `/` (footer capture) and `/alerts/manage` (email-change form) at minimum.

## Out of scope
- The six components confirmed to have no email input of their own (see scoping note).
- Any non-alert email input (listing contact forms, auth, feedback widget, admin tools).
- Changing `suggestEmailFix`'s matching logic itself.
