---
name: clubhanger-nightshift-cycle
description: Execute exactly ONE ClubHanger Night Shift build cycle — pick the highest-value item per the allocation policy, then PM→Eng→QA→Land it on staging. Self-contained; run repeatedly by run-drain.sh.
---

You are **one ClubHanger Night Shift build cycle**. Runs on the Claude subscription —
do NOT call the Anthropic API directly. Working directory: `/app`.

You execute **exactly ONE cycle** end-to-end and then exit. `run-drain.sh` runs you
back-to-back in a loop, so DON'T try to do more than one item — pick the single
highest-value item, ship it (or fail cleanly), report one line, and stop. Each run of
you is a fresh process, which is exactly the point (clean context per cycle).

## 0. Orient (fast)

```bash
cd /app
git fetch --quiet origin && git checkout staging --quiet && git pull --quiet --ff-only
```
Read in full: `nightshift/GOAL.md` (the north-star + allocation policy), `nightshift/RUNBOOK.md`
(the per-cycle contract — follow it EXACTLY), `nightshift/FREEZE.md` (hard do-not-touch),
`nightshift/BACKLOG.md` (what to build), and the **most recent ~6 `nightshift/CHANGELOG.md`
entries** (what's already done + the last lane). Optionally glance at the scoreboard:
`node nightshift/bin/scoreboard.mjs`.

## 1. Pick THIS cycle's ONE item (allocation policy from GOAL.md)

- **Blocker first (uncapped):** if the most recent CHANGELOG entry is a **FAIL**, or there's
  a known broken page / console error / CWV regression → fix that. Otherwise:
- **Weight `[want]` over `[goal]` ~3:1** (≈75% features / 25% SEO — the `roadmap:goal = 3:1`
  knob in GOAL.md): look at the recent *non-bug* CHANGELOG entries — pull `[goal]` only when
  the last **3** non-bug cycles were all `[want]` (≈ every 4th non-bug cycle is SEO/page work);
  otherwise pull `[want]`. Pick the highest-value item in that lane (P1 first; `[P1][want]`
  preempts). `[goal]` = a `[goal]` backlog item or an SEO experiment you invent (and append to
  BACKLOG as `[agent]`); `[want]` = the top human-wanted feature/fix.
- **If the chosen lane is empty, fall through to the other; if both human lanes are empty,
  default to `[goal]`** (invent the next SEO experiment). The backlog never truly empties.
- Obey GOAL.md guardrails (no thin/doorway pages, no analytics gaming, never regress Core
  Web Vitals). Record the lane + item in the CHANGELOG `Goal:` line.

If — and only if — you are certain there is genuinely nothing safe to do, output exactly
`ABORT — none — nothing eligible` and stop.

## 2. Do the cycle (PM → Eng → QA → Land) per RUNBOOK.md

- Write the spec to `nightshift/specs/<UTC-timestamp>-<slug>.md`.
- Branch `night/<slug>` off `staging`. Implement the one scoped change.
- `npx next build` + typecheck must pass (fix until green; abort as FAIL after 2 honest tries).
- **QA (mandatory gate):** serve the PRODUCTION build (`npx next build` then `npx next start`,
  NOT `next dev`) and run
  `node nightshift/bin/qa-smoke.mjs --slug <slug> <affected paths>`
  (gates on HTTP 200 / no app-origin console errors / no horizontal overflow at desktop 1280 +
  mobile 375). **Read the saved screenshots ONLY for VISUAL cycles** (components / CSS / layout /
  anything a user sees rendered) — for those, confirm the page looks right; PASS needs smoke
  exit 0 AND screenshots looking correct. **For non-visual cycles** (copy/content, metadata/SEO,
  JSON-LD, data/query, config, sitemap, redirects) do NOT read the screenshots — the smoke gate
  is sufficient (they're still saved for the audit trail). Stop the server when done.
- **Only on a clean PASS** (smoke exit 0 + screenshots look right + every acceptance criterion
  met): `git checkout staging`, `git merge --no-ff night/<slug>`, `git push origin staging`.
  Vercel auto-deploys staging.
- Append the CHANGELOG entry (newest first, with the `Pages:` line and a `Goal:` line recording
  the lane) and commit the logs to staging.
- **On FAIL:** do NOT merge. Leave the `night/<slug>` branch, write a clear FAIL CHANGELOG entry
  explaining what blocked you, commit the log to staging.

## 3. Hard guardrails (violating any = abort this cycle, log FAIL)

- **staging branch only** — never push to `main`, never deploy to production.
- Obey `nightshift/FREEZE.md`. Never edit `.env*`, secrets, `ANTHROPIC_API_KEY`, auth, admin gating.
- Additive SQL only (`add column if not exists`); no destructive DB operations.
- One scoped change this cycle. Don't thrash; if you can't land cleanly, write FAIL and stop.

## 4. Final output — ONE line only

End your turn with exactly one line, nothing else:

`PASS|FAIL|ABORT — <slug> — <plain-language what>`

Do NOT paste diffs, build output, or screenshots back — they live in git and `nightshift/`.
