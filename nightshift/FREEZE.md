# Freeze list — DO NOT TOUCH

The overnight loop must never modify these. They're either security-sensitive,
human-only decisions, or the harness itself.

## Never edit
- `.env*` and any secrets or API keys (esp. `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Auth: `src/app/auth/**`, `src/lib/supabase-server.ts`, `src/lib/supabase.ts`, the magic-link / Google OAuth flow
- Admin gating: `src/app/admin/**` auth checks, `ADMIN_EMAILS` logic
- The ingest endpoint's auth: `src/app/api/ingest/route.ts` (the auth block)
- Billing / payments (none yet — if added later, freeze them)
- This harness: anything under `nightshift/` except appending to `CHANGELOG.md`, `BACKLOG.md` Done section, and writing new `specs/` + `screenshots/`
- The browser extension under `extension/` (human ships that manually)

## Never do
- Push to `main` or deploy to production
- Destructive SQL (`drop`, `delete`, `truncate`, `alter ... drop column`, data deletes)
- Rotate, print, or commit any credential
- Bulk-delete or rewrite existing listings/drafts in the database
- Change the Supabase project, Vercel project, or DNS

## Ask-a-human (don't decide autonomously)
- Pricing, monetization, or anything that charges users
- Removing existing features or pages
- Major IA / navigation restruct:contentReference changes (a new top-level nav item is fine; reordering everything is not)

## Open for experimentation (human reviews post-cycle)
- **Brand identity is fair game** — logo, name treatment, accent color(s), typography, overall look. The human explicitly wants you to experiment and will give feedback after the cycle. Keep each cycle cohesive and reversible; don't thrash the whole brand in one cycle.
