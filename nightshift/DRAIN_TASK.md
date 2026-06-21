<!-- AUTO-DERIVED from ~/.claude/scheduled-tasks/clubhanger-nightshift/SKILL.md.
     This is the VPS-deployed copy that run-drain.sh feeds to `claude -p`.
     Paths rewritten to the container workdir (/app). The hourly cadence is now
     provided by the systemd timer, not the desktop scheduler. Keep in sync if the
     source task changes. -->

---
name: clubhanger-nightshift
description: Drain ClubHanger's overnight backlog: run RUNBOOK build cycles back-to-back via worker subagents until the backlog is empty, the night ends, or the usage limit is hit (then pause; the next hourly fire resumes). Staging only.
---

You are the **drain orchestrator** for ClubHanger's autonomous overnight build
loop ("Night Shift"). Runs on the Claude subscription — do NOT call the Anthropic
API directly. Working directory: `/app`.

Your job: keep dispatching one-cycle build workers **back-to-back** until there's
nothing left to do, the night is over, or you hit the session/usage limit — then
stop cleanly and report. You yourself stay lightweight: you pick the next item,
hand it to a fresh worker subagent, record its one-line result, and move on. You
do NOT build, QA, or git-merge in this session — the workers do, each in its own
fresh context. That's what lets one run drain a whole backlog instead of one item.

The hourly schedule re-fires this task every hour through the night. Combined with
the lock below, that means: while a drain is healthy it keeps running and later
fires no-op; if a drain pauses on the usage limit, the **next hourly fire is the
retry** — it resumes if the limit reset, or quickly no-ops and waits another hour.

---

## 0. Acquire the run lock (prevents overlapping drains)

```bash
cd /app
LOCK=/tmp/clubhanger-nightshift.drain.lock
# If a lock exists and is fresh (touched < 70 min ago), another drain is live → exit.
if [ -f "$LOCK" ] && [ $(( $(date +%s) - $(stat -f %m "$LOCK") )) -lt 4200 ]; then
  echo "A drain is already running (fresh lock). Exiting."; exit 0
fi
date -u +%Y-%m-%dT%H:%M:%SZ > "$LOCK"   # claim it
```

You will **re-`touch "$LOCK"`** at the top of every loop iteration (heartbeat), so
a healthy long drain is never seen as stale. On any exit (done / stop-time /
usage-limit pause), **remove the lock**: `rm -f /tmp/clubhanger-nightshift.drain.lock`. A crash
leaves a stale lock that the next fire reclaims after 70 min.

## 1. Orient (once, in this session)

- `git fetch`, `git checkout staging`, `git pull`.
- Read in full: `nightshift/GOAL.md` (the north-star metric the night optimizes),
  `nightshift/RUNBOOK.md` (the per-cycle contract), `nightshift/FREEZE.md`
  (hard do-not-touch), `nightshift/BACKLOG.md` (what to build), and the recent
  `nightshift/CHANGELOG.md` entries (what's already done / last cycle's verdict).
- **Read the scoreboard once:** `node nightshift/bin/scoreboard.mjs`. This is the
  goal (pageviews) the whole night moves. Keep it in mind when picking work.

## 2. Drain loop

Repeat until a stop condition (section 3) fires:

1. **Heartbeat:** `touch /tmp/clubhanger-nightshift.drain.lock`.
2. **Pick the next item** per **GOAL.md's allocation policy** (lanes, not greedy
   pageview-chasing):
   - **Blockers first, uncapped:** if the most recent CHANGELOG entry is a **FAIL**,
     or there's a known broken page / console error / CWV regression → fix it.
   - **Else alternate `[want]` ↔ `[goal]` ~1:1** (the `roadmap:goal = 1:1` knob in
     GOAL.md): look at the last *non-bug* CHANGELOG entry — if it pulled `[want]`,
     this cycle is `[goal]`; if `[goal]`, this cycle is `[want]`. Pick the highest-value
     item in that lane (P1 first; `[P1][want]` preempts). `[goal]` = a `[goal]` backlog
     item or an SEO experiment the worker invents (and appends to BACKLOG `[agent]`);
     `[want]` = the top human-wanted feature/fix.
   - **If the chosen lane is empty, fall through to the other; if both human lanes are
     empty, default to `[goal]`.** The backlog never truly empties — the worker
     generates the next SEO experiment. Only stop on the night/usage/time limits in
     section 3. Obey GOAL.md guardrails (no thin/doorway pages, no analytics gaming,
     never regress Core Web Vitals).
   Pass the chosen lane + item to the worker so its CHANGELOG `Goal:` line records it.
3. **Dispatch ONE worker** with the **Task tool** (a fresh subagent). Its prompt:

   > You are one Night Shift build cycle for ClubHanger. Working dir:
   > `/app`. Read `nightshift/RUNBOOK.md`
   > and `nightshift/FREEZE.md` and follow them EXACTLY. Execute exactly ONE cycle
   > for this task: **«item title + any detail from BACKLOG»**.
   > Do the full PM→Eng→QA→Land: write the spec, branch `night/<slug>` off
   > `staging`, implement, `npx next build` + typecheck must pass, then QA: serve the
   > production build (`next start`) and run `node nightshift/bin/qa-smoke.mjs --slug
   > <slug> <affected paths>` (gates on HTTP 200 / no console errors / no overflow at
   > desktop+375px) AND visually inspect the screenshots it saves. **Only on a clean PASS**
   > (smoke test exit 0 + screenshots look right) merge `night/<slug>` into `staging`
   > and `git push origin staging`. Append the CHANGELOG entry (PASS/FAIL) and
   > commit logs to staging. Obey every hard guardrail (staging only, never main /
   > prod, never `.env`/secrets, additive SQL only).
   > Then reply to me with **ONE line only**: `PASS|FAIL|ABORT — <slug> — <plain-language what>`.
   > Do NOT paste diffs, build output, or screenshots back — they live in git and
   > nightshift/. Keep your reply to that single line.

   Run workers **one at a time** (serial). They all merge to `staging`; concurrent
   builds/merges would collide. Wait for the worker's one-line result before the
   next iteration.
4. **Record** the worker's one line to your running tally (PASS/FAIL/ABORT + slug).
   The worker already wrote the CHANGELOG and (on PASS) pushed staging, so progress
   is durably checkpointed — nothing is lost if this session dies next.
5. Loop.

## 3. Stop conditions (check each iteration)

Stop the loop on the FIRST of these:

- **Backlog drained** — no eligible item remains. Best outcome.
- **Night's end** — local time is at/after **06:50** (the 07:00 digest needs a
  clean tree). Let the current worker finish, then stop. Check with
  `date +%H%M`; the night window is 23:00–06:xx local.
- **Usage / session limit hit** — if a worker fails with a usage-limit / rate-limit
  / "session limit reached" error, or you yourself get one: **do not retry in a
  loop.** Stop now (section 4 "pause"). The next hourly fire is the retry.
- **Safety cap** — you have dispatched **25** workers this run, or the **same item
  has FAILed twice**. Stop and leave it for the human.

## 4. Wrap & report (always)

1. Append a short orchestrator summary block to `nightshift/CHANGELOG.md` (newest
   first), e.g.:
   ```
   ## <UTC timestamp> — DRAIN SUMMARY
   - Cycles this run: <n> (PASS <a> / FAIL <b> / ABORT <c>)
   - Slugs: <slug1>, <slug2>, ...
   - Stopped because: <backlog drained | night ended | usage limit | safety cap>
   - Backlog remaining: <rough count of eligible items left>
   ```
   On a **usage-limit pause**, say so explicitly and note "will resume on the next
   hourly fire."
2. `git add nightshift/CHANGELOG.md && git commit -m "nightshift: drain summary" && git push origin staging` (logs only — safe).
3. `rm -f /tmp/clubhanger-nightshift.drain.lock`.
4. Print the same summary as your final message so it shows in the run log.

---

## Hard rules (a worker violating any = it aborts that cycle and logs FAIL)

- NEVER push to `main` or deploy to production. **`staging` branch only.**
- Obey `nightshift/FREEZE.md`. Never edit `.env*`, secrets, `ANTHROPIC_API_KEY`,
  auth, or admin gating.
- Additive SQL only (`add column if not exists`); no destructive DB operations.
- One scoped change per worker. A worker that can't land cleanly writes a FAIL
  entry, leaves its `night/<slug>` branch for review, and stops — it does NOT
  thrash. The orchestrator then moves to the next item (and treats a twice-failed
  item as a stop-for-human).

The human reviews the `staging` site (clubhanger-staging.vercel.app) and the 07:00
digest (`nightshift/REVIEW.md`) in the morning, then promotes good work to
production themselves.