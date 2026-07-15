# Dark-mode-safe alert emails

## Goal
Make every transactional/alert email render correctly in dark-mode inboxes (Gmail,
Apple Mail, Outlook.com) instead of relying on client auto-inversion, which can mangle
the cream/white brand panels and low-contrast slate text unpredictably.

## Scope
- `src/lib/email.ts`: add one shared `emailColorSchemeHead()` helper (meta
  `color-scheme`/`supported-color-schemes` tags + a `@media (prefers-color-scheme:
  dark)` block using new `.ch-body`/`.ch-card`/`.ch-heading`/`.ch-text`/`.ch-muted`/
  `.ch-brand` classes) and wire it into all 11 HTML email builders (confirm, manage
  link, email-change confirm, new message, seed inquiry, price drop, listing
  unavailable, widen suggestion, digest, combined digest, match alert). CTA buttons
  and colored status badges are deliberately left unclassed — their explicit
  background+text pairs already carry their own fixed contrast in both schemes.
- `src/lib/email.test.ts`: unit tests asserting the color-scheme meta + dark media
  query render in every builder's HTML output.
- No schema/DB change, no new capture point, no `src/app/auth/**` change.

## Acceptance criteria
- Every `build*Email` function's `html` output contains
  `<meta name="color-scheme" content="light dark">` and a `@media
  (prefers-color-scheme: dark)` block.
- Plain-text email bodies are byte-identical to before (no `text` field changes).
- `npx next build` + typecheck pass.
- `node --experimental-strip-types --test src/lib/email.test.ts` passes.
- `/api/dev/email-preview/*` routes still render the emails correctly (visual smoke
  via qa-smoke + screenshot review).
- No visual regression to the light-mode (default) rendering of any email.

## Out of scope
- Per-builder bespoke dark palettes beyond the shared classes.
- Dark-mode styling for status badges / CTA buttons (already legible in both modes).
- Any change to send logic, subject lines, or unsubscribe/token handling.
