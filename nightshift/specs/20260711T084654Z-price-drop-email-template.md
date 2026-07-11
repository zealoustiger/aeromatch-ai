# Price-drop alert email template

## Goal
Build a dedicated, on-brand price-drop notification email (single listing, photo,
old-vs-new price, percent off) plus a dev-only preview route to eyeball it —
closing the `[P1][goal]` "Price-drop alert email template" item in BACKLOG.md's
🔔 alert-experience section.

## Scope
- `src/lib/email.ts` — new `buildPriceDropEmail()` builder (subject/html/text),
  matching the warm cream/sky visual language the other builders in this file
  already use (`buildAlertConfirmEmail` etc.).
- `src/lib/email.test.ts` (new) — unit tests for the percent-off math, price
  formatting, and the photo-present vs photo-absent HTML branch.
- `src/app/api/dev/email-preview/price-drop/route.ts` (new) — GET route that
  renders the built email HTML against one static fixture listing, for visual
  QA/eyeballing. Already excluded from crawling via `robots.ts`'s blanket
  `/api` disallow; not linked from any nav/sitemap.

## Acceptance criteria
- [ ] `buildPriceDropEmail()` renders a percent-off badge, a struck-through old
      price next to a bold new price, an optional listing photo (renders
      nothing extra when there's no photo — no broken `<img>`), a "View
      listing" CTA, and manage-alerts + unsubscribe footer links.
- [ ] Unit tests cover: percent-off calculation, USD price formatting in the
      subject/text, and the photo/no-photo HTML branches.
- [ ] `/api/dev/email-preview/price-drop` returns HTTP 200 `text/html` built
      from a static fixture (no DB read, no email sent).
- [ ] `npx next build` + typecheck clean.
- [ ] QA smoke passes on the new preview route (treated as visual — read the
      screenshot).

## Out of scope
- The price-drop opt-in/opt-out toggle + its migration (separate `[P1][goal]`
  backlog item — the previous cycle's Next note explicitly sequences this
  template before that toggle).
- Digest-vs-instant frequency choice (separate item, needs its own migration).
- Wiring this template into any live send path (`alert-digest` cron). It
  depends on the not-yet-built opt-in toggle so a matching alert can't yet be
  distinguished from one that doesn't want price-drop emails; wiring it now
  would either spam everyone or require inventing the toggle inline, which is
  its own scoped item.
- Rebuilding the existing aggregate weekly digest template (separate P2 item).
