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
3. **Group by page.** Build a map of `route → [changes]` from the cycles' `Pages` + `What` lines. One cycle can touch several pages (list it under each). Sort pages by how many changes they got (most-changed first). Keep a "Site-wide / other" bucket for nav, layout, SEO, infra.
4. Write `nightshift/REVIEW.md`:

   ```
   # Overnight review — <local date>

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
5. `git add nightshift/REVIEW.md && git commit -m "nightshift: morning review digest" && git push origin staging`.
6. **Sync the on-site admin dashboard:** run `node scripts/sync-admin-docs.mjs`. This upserts the current `nightshift/BACKLOG.md` and `nightshift/REVIEW.md` into the shared `admin_content` table so the production admin page (`/admin`) shows today's report + backlog. (Prod and staging share one DB, so this is how the report reaches the live dashboard without promoting to main.)
7. Stop.

## Rules
- Build nothing, change no app code, run no migrations. This is a read-and-summarize job only.
- Never push to `main`. Never deploy. You only write `REVIEW.md` to `staging`.
- If something is ambiguous, say so in "needs your attention" rather than guessing.
