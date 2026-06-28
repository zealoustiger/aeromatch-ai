# Night Shift — Morning Digest

You run ONCE, after the night's build cycles finish. You build nothing. Your only
job: compile everything that landed on `staging` overnight into a single,
**by-page** review document a non-engineer can skim over coffee — with a clickable
staging link for every page that changed.

Output: overwrite `nightshift/REVIEW.md` and commit it to `staging`.

Stable staging base URL (always serves the latest `staging` commit):
`https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app`

## Steps

1. `git fetch`, `git checkout staging`, `git pull`.
2. Find the work to review = everything on `staging` not yet promoted to `main`:
   - `git log --oneline main..staging`
   - Read the matching `nightshift/CHANGELOG.md` entries (the cycles since the last promote). Each has a `Pages:` line and a `What:` line.
   - If `main..staging` is empty, write a REVIEW.md that says "Nothing new to review since the last promote" and stop.
3. **Reconcile the backlog against last night's cycles.** Run `node nightshift/bin/backlog-reconcile.mjs --apply --quiet`. This scans `CHANGELOG.md` for every PASSed cycle, finds the open `BACKLOG.md` items whose titles match (slug + What keyword overlap), and prepends a `✅ SHIPPED via <slug>` marker so the burn-down counter ignores them. Conservative by design — false positives erase real open work, so only high-confidence matches land; the rest stay visible. Commit any change to BACKLOG.md as part of the digest commit at step 7.
4. **Pull the traffic numbers.** Run `node nightshift/bin/traffic-report.mjs` and capture its markdown output. This becomes the **first section** of the report (traffic is the headline the founder cares about most). It fails soft — if it prints an "unavailable" notice, include that as-is.
5. **Group by page.** Build a map of `route → [changes]` from the cycles' `Pages` + `What` lines. One cycle can touch several pages (list it under each). Sort pages by how many changes they got (most-changed first). Keep a "Site-wide / other" bucket for nav, layout, SEO, infra.
6. Write `nightshift/REVIEW.md` — **lead with the Traffic block from step 4**, then the by-page build summary:

   ```
   # Overnight review — <local date>

   <-- paste the Traffic markdown block from `node nightshift/bin/traffic-report.mjs` here -->

   ---


   <N> changes landed on staging across <M> pages last night. Review the live
   staging site (you must be logged into Vercel), then tell Claude which pages
   to promote to production — or "promote everything."

   Staging site: https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app

   ---

   ## /aircraft — Planes for Sale  ·  [open ↗](<base>/aircraft)
   - <plain-language change 1>  (cycle: <slug>)
   - <plain-language change 2>
   _Screenshots: nightshift/screenshots/<slug>/_

   ## /partnerships  ·  [open ↗](<base>/partnerships)
   - ...

   ## /saved  ·  [open ↗](<base>/saved)
   - ...

   ## Site-wide / other
   - <nav, layout, SEO, schema, infra changes>

   ---

   ## Anything that needs your attention
   - <schema changes, FAILs left as branches, untested flows, risks pulled from CHANGELOG>

   ## To ship
   Tell Claude: "promote /aircraft and /saved" (or "promote everything"). Claude
   merges the chosen work staging→main, which deploys it to clubhanger.com.
   ```
   - Use the real stable base URL above for every `[open ↗]` link, with the page's route appended. For dynamic routes (e.g. a listing detail), link to a representative real URL if you can find one, else the index page.
   - Keep bullets plain-language and user-facing — the reader is the founder, not an engineer.
   - Pull risks/schema notes from the cycles' `Verdict`/`Next` lines into "needs your attention."
7. `git add nightshift/REVIEW.md nightshift/BACKLOG.md && git commit -m "nightshift: morning review digest + backlog reconcile" && git push origin staging`. BACKLOG.md is added because step 3 may have updated it.
8. **Sync the on-site admin dashboard:** run `node scripts/sync-admin-docs.mjs`. This upserts the current `nightshift/BACKLOG.md` and `nightshift/REVIEW.md` into the shared `admin_content` table so the production admin page (`/admin`) shows today's report + backlog. (Prod and staging share one DB, so this is how the report reaches the live dashboard without promoting to main.)
9. Stop.

## Rules
- Build nothing, change no app code, run no migrations. This is a read-and-summarize job only.
- Never push to `main`. Never deploy. You only write `REVIEW.md` to `staging`.
- If something is ambiguous, say so in "needs your attention" rather than guessing.
