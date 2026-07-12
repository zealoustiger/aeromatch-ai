# Footer alerts entry point

## Goal
Add an "Email alerts" link to the site-wide footer — the one piece of global chrome
(present on every page) that currently has zero alert entry point — per GOAL.md's
"alert entry points everywhere" mandate.

## Scope
- `src/components/Footer.tsx` — add a `/alerts` link to the `exploreLinks` list (top
  of the "Explore" column, alongside the other core actions).
- Audit `src/app/alerts/page.tsx` + `src/components/AlertsLanding.tsx` copy against the
  current feature set (daily/weekly frequency, price-drop opt-in, no-account
  manage-by-token unsubscribe). Confirmed by code read: `AlertSignup.tsx` already
  renders both the frequency `<select>` (weekly/daily) and the price-drop checkbox
  inline in the form, and the trust row already states "no account needed," "we flag
  price drops too," and "one-click unsubscribe in every email." No copy changes
  needed — documenting the audit outcome, not a silent skip.

## Acceptance criteria
- [ ] The footer (rendered on every page via the root layout) contains a working link
      to `/alerts` with visible label text (not icon-only).
- [ ] Link is present in both the desktop and mobile (375px) footer render.
- [ ] No other footer links/sections change.
- [ ] `npx next build` + typecheck pass.
- [ ] QA smoke passes (HTTP 200, no console errors, no horizontal overflow at 1280 +
      375) on a page that renders the footer (e.g. `/`) plus `/alerts` itself.

## Out of scope
- Any change to `/alerts` landing copy (audited, found accurate — see above).
- Any change to footer IA/reordering beyond appending this one link.
- `/alerts/manage` or `/alerts/status` pages.
