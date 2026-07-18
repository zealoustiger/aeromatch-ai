# post-success-alert-crosssell

## Goal
Make the post-success banners on `/partnerships/[id]` and `/partnerships/seeking/[id]`
offer the right-noun counterpart alert (seeker alert for a partnership poster, partnership
alert for a seeking poster) instead of a same-noun/no alert box, at peak poster intent.

## Scope
- `src/app/partnerships/[id]/page.tsx` — the `justPosted` banner's existing `AlertSignup`
  (currently `noun="partnership"`, `sourcePath="/partnerships?make=..."`,
  `source="post_success"`) is the WRONG noun (it re-offers the poster their own market).
  Change it to the demand-side seeker cross-sell: `noun="seeker"`,
  `sourcePath="/partnerships/seeking?make=...&model=..."`, `source="post_success_partnership"`.
- `src/app/partnerships/seeking/[id]/page.tsx` — the `justPosted` banner has no `AlertSignup`
  today. Add one reusing the page's own already-computed `alertContext`/`alertSourcePath`
  (same values the existing `isOwner` box at the bottom of the page uses), with
  `noun="partnership"`, `source="post_success_seeking"`.
- No schema change. No new component. Both edits reuse the existing `AlertSignup` component
  and existing prefill patterns already live elsewhere on each page.

## Acceptance criteria
- `/partnerships/[id]?posted=1` (a real just-posted partnership) shows an `AlertSignup` box
  in the green confirmation banner offering "email me when a pilot seeking a {make/model}
  share appears" — `noun="seeker"`, pointed at `/partnerships/seeking?make=...`.
- `/partnerships/seeking/[id]?posted=1` (a real just-posted seeking listing) shows an
  `AlertSignup` box in its green confirmation banner offering "email me when a new
  {make} partnership lists" — `noun="partnership"`, pointed at `/partnerships?make=...`.
- Each placement passes a distinct `source` (`post_success_partnership` /
  `post_success_seeking`) so `alert_subscribed` events are attributable per-placement.
- Since posters are always signed in when `justPosted` renders (server action redirects to
  `/auth` before any insert), the box renders the one-tap signed-in subscribe state, not the
  anonymous email form.
- `npx next build` + typecheck clean; QA smoke on both detail pages at desktop 1280 + mobile
  375 (0 console errors, 0 horizontal overflow).
- No regression to the existing non-`justPosted` `AlertSignup` boxes already on both pages.

## Out of scope
- `/aircraft/listing/[id]?posted=1` (explicit follow-up slice per the backlog item).
- Any schema/DB change.
- Match-count wiring (`getAlertMatchCount`) for the new boxes — optional polish, not required
  for the cross-sell itself.
