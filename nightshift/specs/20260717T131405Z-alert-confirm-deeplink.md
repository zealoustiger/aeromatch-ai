# Spec: "Open Gmail/Outlook" deep link + spam-folder line on the pending-confirm panel

## Goal
Reduce drop-off during the double-opt-in email round trip by giving a subscriber who just
submitted their email a one-tap link straight into their inbox provider, plus an honest
spam-folder nudge — instead of leaving them with only a resend button.

## Scope
- New `src/lib/emailProviderLink.ts`: pure `getEmailProviderLink(email: string): { label: string; url: string } | null`.
  Maps common consumer domains (gmail.com/googlemail.com, outlook.com/hotmail.com/live.com/msn.com,
  yahoo.com/yahoo.co.uk/ymail.com, icloud.com/me.com/mac.com, aol.com) to their webmail inbox URL.
  Returns `null` for anything unrecognized — never a guessed link.
- New `src/lib/emailProviderLink.test.ts` — unit tests (node:test) covering each mapped provider,
  case-insensitivity, subdomain/plus-addressing edge cases, and the unrecognized-domain → null case.
- `src/components/AlertSignup.tsx`: in the `submitted && !confirmedImmediately` ("Almost there —
  check your inbox") branch, render an "Open {Provider}" button/link (when `getEmailProviderLink`
  resolves) and an always-present "Can't find it? Check your spam folder." line, alongside the
  existing resend control.
- No change to `/alerts/status` — verified it has no "pending" state to render this on (confirm/
  unsubscribe links are terminal actions, not a capture form), so this cycle scopes to
  `AlertSignup` only, which every capture surface funnels through.

## Acceptance criteria
- `getEmailProviderLink` resolves the 5 mapped provider families case-insensitively and returns
  `null` for unmapped/unknown domains and malformed input (no `@`).
- After a real (non-signed-in) `AlertSignup` submission, the confirm panel shows an "Open Gmail"
  (or matching provider) link that opens the correct webmail URL in a new tab, only when the
  submitted address resolves to a known provider.
- The "Check your spam folder" line renders in the confirm panel regardless of provider.
- Existing resend-confirmation button/copy is unchanged and still works.
- `npx tsc --noEmit` and `npx next build` both pass.
- No new console errors on `/`, `/aircraft` in production-build QA at desktop 1280 + mobile 375.

## Out of scope
- `/alerts/status` (no pending state exists there to attach this to).
- The typo-guard ("Did you mean gmail.com?") and mobile-keyboard-attribute sweep — separate
  backlog items.
- Weekly→daily upgrade nudge in digests — separate backlog item.
