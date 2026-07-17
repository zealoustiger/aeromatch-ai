# footer-alert-capture-known-subscriber

## Goal
`FooterAlertCapture` (the one alert entry point on every page, via `Footer.tsx`) should stop
re-asking a browser that's already subscribed, and should emit the `alert_capture_viewed`
impression event so its view→subscribe conversion is measurable like every other capture point.

## Scope
- `src/components/FooterAlertCapture.tsx` only.
- (1) On mount, check `isLocallySubscribed('/')` (existing helper, `src/lib/alertLocalSubscriptions.ts`).
  If true (and the visitor hasn't just submitted in this session), render a quiet "You're
  getting alerts — manage them" line with a `/alerts/manage` link instead of the capture
  form/one-tap — mirroring `AlertSignup.tsx`'s existing `!signedInEmail && locallySubscribed`
  branch (same copy pattern, same `CheckCircle2` treatment, kept thin per the component's own
  "no match counts in the footer" design note).
- (2) Fire a one-shot `alert_capture_viewed` (`context: 'all'`, `source_path: '/'`,
  `source: 'footer'`) via an `IntersectionObserver` (threshold 0.5) on the component's root
  element, mirroring `AlertSignup.tsx`'s existing impression-tracking effect. Fires regardless
  of which of the three states (form / one-tap / known-subscriber) is rendering, exactly once
  per mount.

## Acceptance criteria
- A browser with no local subscription still sees the existing form/one-tap capture UI,
  unchanged.
- A browser that has previously subscribed via ANY capture point that calls
  `addLocalSubscription('/')` — i.e. this same footer, since its `SOURCE_PATH` is always `/`
  — sees the new quiet "you're getting alerts" line with a working `/alerts/manage` link, and
  does NOT see the form or one-tap button.
- Right after a fresh submit in the same session, the existing "Check {email} to confirm"
  success state still renders (not the known-subscriber line) — submit takes priority.
- `alert_capture_viewed` fires exactly once when the footer scrolls into view, with
  `context: 'all'`, `source_path: '/'`, `source: 'footer'`.
- No new dependency, no schema/DB change, no change to `Footer.tsx` or any other file.
- `npx tsc --noEmit` and `npx next build` both exit 0.

## Out of scope
- Match counts or digest previews in the footer (explicitly ruled out by the component's own
  design note — keep it thin).
- Any change to the homepage known-subscriber module (separate open `[P2][goal]` item).
- Any change to `AlertSignup.tsx` or other capture components.
