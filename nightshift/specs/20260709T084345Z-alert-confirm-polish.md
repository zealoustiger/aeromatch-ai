# alert-confirm-polish

## Goal
Make the double-opt-in alert confirmation email and the `/alerts/status`
confirm/unsubscribe landing page warm and on-brand (Etsy×Airbnb cream tokens),
instead of their current plain white/slate look — the last open `[P2][goal]`
item in BACKLOG.md's alert-experience section.

## Scope
- `src/lib/email.ts` — restyle `buildAlertConfirmEmail()`'s HTML: warm cream
  body background (`#faf7f2`), a rounded white card (16px radius, soft warm
  border `#ece6dc`), a small "ClubHanger" wordmark header, friendlier copy.
  Keep the sky-600 CTA button, the same subject-line logic, and the same
  `confirmUrl`/`unsubscribeUrl` plumbing — text-version copy only, no
  structural/logic change.
- `src/app/alerts/status/page.tsx` — wrap the page in `ch-surface`, restyle the
  icon+message block as a `ch-panel` card instead of a bare white page. No
  change to the `STATES` content, routing, or `UnsubscribeRecover` usage.
- `src/components/UnsubscribeRecover.tsx` — swap its cold `slate-200/slate-50`
  box for the warm `ch-surface-2`/`ch-border` tones so it reads as part of the
  same card, not a jarring gray insert. No logic change.

## Out of scope
- The alert digest email, new-message email, or seed-inquiry email (separate
  templates, not part of this backlog item).
- Any change to the confirm/unsubscribe/pause server actions or token logic.
- The `/alerts` landing page or `/alerts/manage` page (already on-brand).

## Acceptance criteria
- `buildAlertConfirmEmail()` renders on a warm cream background with a
  rounded white card, ClubHanger header text, and the same confirm/unsubscribe
  links working exactly as before (verified via a unit script, not a real send).
- `/alerts/status?state=confirmed|unsubscribed|invalid` all render on the
  `ch-surface` cream background with a `ch-panel` card, at desktop 1280 and
  mobile 375, with no console errors or horizontal overflow.
- `/alerts/status?state=unsubscribed&token=...` still shows the
  "Changed your mind?" recovery box, now in warm tones, functionally unchanged.
- `npx tsc --noEmit` and `npx next build` stay clean.
