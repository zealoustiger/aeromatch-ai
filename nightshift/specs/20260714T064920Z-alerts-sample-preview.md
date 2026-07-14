# alerts-sample-preview

## Goal
Show a real, live-data sample of what an alert email actually contains directly on
the `/alerts` landing page, so a visitor can see proof before handing over their
email — instead of asking for an email on faith alone.

## Scope
- `src/app/alerts/page.tsx` — switch the popular-chip lookup from `getAlertMatchCount`
  to `getAlertDigestPreview` (superset: count + up to 3 real sample listings, same
  single query), and fetch the same preview for the 3 base interests (all aircraft,
  partnerships, seekers) so every chip — not just the honesty-gated popular ones —
  can show a sample. Pass a `samplesByPath` map down to `AlertsLanding`.
- `src/components/AlertsLanding.tsx` — export the base interests' source paths so
  `page.tsx` can fetch previews for them without duplicating the path list. Render a
  small "What you'll get" preview strip (up to 3 real listing cards: photo, title,
  price/share, location) for the currently-selected chip, sourced from
  `samplesByPath[active.sourcePath]`.
- No schema change, no new server action, no new DB writes.

## Acceptance criteria
- `/alerts` renders a live sample-listing preview (photo + title + price + location)
  for the default-selected chip when it has ≥1 real live match.
- Switching chips (clicking a different interest) swaps the preview to that chip's
  own real samples — never shows another chip's data.
- Honesty gate: a chip with 0 live matches renders NO preview section at all (never
  a fake/placeholder sample) — matches the existing zero-match copy already in
  `AlertSignup`.
- `alert_subscribed` event / existing subscribe flow is unchanged.
- `npx tsc --noEmit` and `npx next build` both pass.
- No console errors, no horizontal overflow at 1280 or 375px.

## Out of scope
- The digest EMAIL content itself (market-pulse line — separate backlog item).
- The Resend bounce webhook (separate backlog item, needs human action).
- Any change to `AlertSignup`'s own copy/behavior beyond adding the new sibling
  preview section.
