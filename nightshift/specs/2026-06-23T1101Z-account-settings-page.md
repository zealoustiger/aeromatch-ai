# Account & email-alerts settings page (`/account`)

**Lane:** `[want]` (last non-bug cycle `airport-hub-overview-prose` pulled `[goal]`; last
cycle PASS → no blocker → `[want]` owed per the 1:1). Scoreboard at orient: 148 pageviews
last 7d; GSC not configured; STAGE=INDEXING.

**Item:** `[P2][want] Email notification settings page` + the ProfileMenu cycle's flagged
follow-up ("Next: an `/account` settings page to link from the dropdown"). The signed-in
avatar dropdown (Messages / Saved / My Searches / Admin / Sign out) has no account home —
this fills that gap and starts the notification-settings surface the backlog asks for
("Start a settings page for notification preferences — don't send yet").

## Goal (one sentence)
Add a `/account` page that gives a signed-in pilot one place to see who they're signed in
as, manage their email-alert subscriptions (their saved searches) and reach their activity
(saved listings, searches, messages) — with an honest "email delivery coming soon" note —
and link it from the avatar dropdown + mobile menu.

## Scope (files)
- NEW `src/app/account/page.tsx` — server component. Reads the session via
  `createServerSupabaseClient().auth.getUser()` (read-only; does NOT edit any frozen auth file).
  - **Logged-out:** a real, public "Your ClubHanger account" explainer with a Sign-in CTA
    (`/auth?next=/account`) + browse links (mirrors how `/saved` now renders for logged-out
    visitors — so it's a clean 200, never a bare redirect, and is fully smoke-testable).
  - **Signed-in:** account home — avatar + "Signed in as {email}"; an **Email alerts**
    section listing the user's saved searches (`saved_searches`, account-keyed, like
    `/searches`) as their alert subscriptions (name + marketplace label + View link +
    "Manage all" → `/searches`), with an honest note that we only email about searches you
    save and email delivery is rolling out soon; an empty-state when none; a **Your activity**
    quick-links grid (Saved / My Searches / Messages); and a Sign-out button.
  - `metadata`: title + `robots: { index: false }` (private per-user utility page — keep it
    out of the index; it carries no SEO value and shouldn't dilute crawl in INDEXING stage).
- NEW `src/components/AccountSignOutButton.tsx` — tiny client sign-out button reusing
  `createClient()` from `@/lib/supabase` (same pattern as `Nav.handleSignOut`).
- EDIT `src/components/ProfileMenu.tsx` — add an "Account" item (Settings icon) at the top
  of the signed-in dropdown items linking to `/account`.
- EDIT `src/components/Nav.tsx` — add an "Account" link (Settings icon) in the mobile
  signed-in section.

## Acceptance criteria
1. `npx next build` (compiles + typechecks) passes.
2. `/account` returns HTTP 200 at desktop 1280 + mobile 375 with **zero** app-origin console
   errors and **zero** horizontal overflow (qa-smoke gate). Logged-out it renders the public
   account/alerts explainer with a working "Sign in" CTA (`/auth?next=/account`).
3. Nav still renders cleanly on `/`, `/saved`, `/account` (no regression from the
   ProfileMenu/Nav edits) — smoke those paths too.
4. The signed-in dropdown (ProfileMenu) and the mobile menu both contain an "Account" link
   to `/account` (verified in source + built output).
5. No schema/DB/SQL change; no edit to any `FREEZE.md` file (auth/secrets/admin/harness);
   no new dependency; sky/warm palette only.
6. Screenshots at both viewports look on-brand (cream `ch-surface`, no broken layout).

## Out of scope
- Actually sending any email (digest/confirmation) — build UI only, per the backlog.
- Persisting a new notification-preference toggle (would need an additive `profiles` column;
  deferred to keep this a no-schema, low-risk single cycle — the page surfaces existing
  saved-search subscriptions instead).
- Editing the pilot profile (name/home-airport/bio) — that's the separate P3 pilot-profiles
  item; this page is account/alerts only.
- Any change to the auth flow, callback, or `src/lib/supabase*.ts` / `src/app/auth/**`.
