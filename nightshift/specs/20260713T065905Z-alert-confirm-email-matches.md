# alert-confirm-email-matches

## Goal
Show up to 3 real, currently-matching listings inside the double-opt-in confirm
email (`buildAlertConfirmEmail`) so a subscriber sees what they're confirming
FOR, instead of pure "click to confirm" copy — the confirm email is the
single biggest funnel cliff (every email-only subscriber must click it before
any alert ever fires).

## Scope
- `src/lib/email.ts` — `buildAlertConfirmEmail` gains an optional `preview`
  param (`{ count: number; samples: AlertDigestSample[] } | null`). When
  provided (non-null), render up to 3 sample cards (reusing the existing
  private `sampleCardHtml` renderer) under a "Here's what you'd be watching"
  heading, or an honest "None match right now — you'll be first to know" line
  when `samples` is empty. When `preview` is omitted/null (unrecognized
  source_path shape, e.g. a watch-this-listing alert or a query error),
  render nothing new — byte-for-byte the current template.
- `src/app/actions.ts` — both `subscribeToAlerts` (new signup) and
  `sendConfirmationResend`/`resendAlertConfirmationByEmail` (resend paths)
  compute the preview via the existing `getAlertDigestPreview(sourcePath)`
  (already imported, already used by the "send a sample digest" action) and
  pass it through to `buildAlertConfirmEmail`.
- `src/lib/email.test.ts` — new unit cases for the preview rendering
  (samples present / empty / omitted).

## Out of scope
- No new capture point, no schema/DB change, no new query — `getAlertDigestPreview`
  already exists and is exercised in production ("send a sample digest").
- The "Watch this partnership" buy-in-drop alert item (separate backlog item,
  needs a new capture point + pending column pair).
- Combined multi-alert confirm flows (there is only ever one confirm email
  per new signup today).

## Acceptance criteria
- A new signup for a make/model/state/browse-filter alert with ≥1 live match
  sends a confirm email whose HTML contains up to 3 real sample cards (title,
  price, link) above the "Confirm my alerts" button.
- A new signup for a genuinely zero-match alert renders the honest "None
  match right now — you'll be first to know" line, never a fabricated count.
- A new signup for an unrecognized source_path shape (e.g. a listing watch
  alert `/aircraft/listing/<id>?watch=price`) renders identically to before
  this change (no preview block).
- `npx tsc --noEmit` and `npx next build` both clean.
- `qa-smoke.mjs` passes on the pages that trigger this email (`/aircraft`,
  `/aircraft/[make]/[model]`) — this is a non-visual (email-body) change, so
  the smoke gate is the bar, not screenshots.
