# Admin email-template preview gallery

## Goal
Give admins a read-only page (`/admin/alerts/emails`) that renders every alert email
builder in `src/lib/email.ts` with honest sample data, so email design/copy changes are
QA-able without triggering a real send.

## Scope
- New file: `src/app/admin/alerts/emails/page.tsx` (server component; gating inherited
  from the existing `src/app/admin/layout.tsx` — not modified).
- Renders each of the 11 exported builders in `email.ts`: `buildAlertConfirmEmail`,
  `buildManageLinkEmail`, `buildAlertEmailChangeConfirmEmail`, `buildNewMessageEmail`,
  `buildSeedInquiryEmail`, `buildPriceDropEmail`, `buildListingUnavailableEmail`,
  `buildWidenSuggestionEmail`, `buildAlertDigestEmail`, `buildCombinedAlertDigestEmail`,
  `buildMatchAlertEmail`.
- For the 3 builders that take real matching-listing samples (`buildAlertConfirmEmail`,
  `buildAlertDigestEmail`, `buildCombinedAlertDigestEmail`), fetch honest live samples via
  the existing `getAlertDigestPreview('/aircraft', 3)` / `getAlertDigestPreview('/partnerships', 3)`
  / `getAlertDigestPreview('/partnerships/seeking', 3)` (same fetcher `/alerts` and the
  "send me a sample" action already use) — never fabricate a listing. If a fetch returns
  null/empty (e.g. no live rows), the section still renders with the builder's own
  no-samples fallback copy — same honesty floor as the real callers.
- Each builder section shows: function name, one-line purpose (from its own JSDoc intent),
  the rendered `subject`, the HTML rendered in a sandboxed `<iframe srcDoc>` (no scripts,
  isolates the email's inline styles from the admin page's Tailwind), and the plain-text
  part in a `<pre>` block below it.
- Add one small link from the existing `/admin/alerts` page (`src/app/admin/alerts/page.tsx`)
  to `/admin/alerts/emails` — same "drill-down not in the tab bar" precedent as
  `/admin/listings/sample`. No new `AdminTabs` entry (mirrors that precedent).
- No schema change, no new dependency, no new color token — reuses `ch-panel`/`rounded-xl
  border border-slate-200 bg-white p-6 shadow-sm` card styling already used on
  `/admin/alerts`.

## Acceptance criteria
- `/admin/alerts/emails` is unreachable (renders the layout's "Admin only" gate) without
  an authorized session — verified by the existing layout, no new auth code written.
- All 11 builders render without throwing, each showing a real subject line + HTML preview
  + text preview.
- The 3 sample-fed builders show REAL current listings when any exist (title/price
  pulled from the live DB, not fabricated) and degrade to the builder's own honest
  zero-match copy when none do.
- No email is actually sent — `sendEmail`/Resend is never called from this page.
- `/admin/alerts` gains a visible link to the new gallery page.
- `npx tsc --noEmit` and `npx next build` both exit 0; qa-smoke passes on `/admin/alerts`
  and `/admin/alerts/emails` at desktop 1280 + mobile 375 (expect the anonymous "Admin
  only" gate to render cleanly at both, since QA runs unauthenticated).

## Out of scope
- Sending a real test email from the gallery (explicitly listed as a future follow-up in
  BACKLOG, not this slice).
- The sibling `[P1][goal]` "Email engagement stats" webhook item (needs a human Resend
  dashboard action) — untouched.
- Editing any builder's copy/HTML — this is a read-only preview surface.
