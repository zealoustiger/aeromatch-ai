# How the Night Shift build loop works

_This is the operator's-eye view of one overnight run. It's synced to the admin
dashboard so you can always see exactly what the loop does — including the steps
that are easy to forget (like checking work off the backlog). Source of truth:
`nightshift/RUNBOOK.md`, `CYCLE_TASK.md`, `GOAL.md`, `config.json`._

## The nightly schedule (VPS, America/Los_Angeles)
| Time (PT) | Job | What it does |
|---|---|---|
| 23:00–06:15 | **drain** (`run-drain.sh`) | Runs build cycles back-to-back until the night ends or a stop condition fires. Each cycle is its own `claude -p` process. |
| 06:40 | **scrape** | Refreshes inventory + sends alert digests. |
| 07:15 | **digest** (`run-digest.sh`) | Token-free morning report → the admin Daily Report, **and reconciles the backlog** (marks shipped items ✅). |
| 14:45 | **harvest** | Residential hangar67 photo harvest (Bright Data). |

## What ONE cycle does (the 8 steps)
Each cycle picks exactly one item and takes it all the way to shipped-on-staging:

1. **Orient.** `git fetch` → checkout `staging` → pull. Read `GOAL.md`, `BACKLOG.md`, the
   recent `CHANGELOG.md`, `FREEZE.md`, and the scoreboard.
2. **Pick ONE item — STRICT priority cascade** (finish a tier before the next):
   1. **`[bug]`** — fix bugs first (broken page, console error, CWV/mobile regression, a
      FAILed prior cycle). A broken alert/signup/post flow is a P0 bug.
   2. **`[want]`** — then any task **the human put in the backlog**. These outrank all
      AI-invented work; clear the highest `[P1][want]` first.
   3. **`[goal]`** — then AI-generated work toward the current goal (**the alert
      experience** — see the Goal & Allocation tab).
   - If all tiers are empty, the loop runs a **plan pass on the smart model** (Opus/Fable)
     to generate the next batch of goal tasks — it never invents them on the cheap model.
3. **Spec.** Write a short spec to `nightshift/specs/…` (scope, acceptance criteria).
4. **Build.** Implement the smallest valuable slice on a `night/<slug>` branch.
5. **QA.** `next build` + typecheck must be green; headless smoke on the real `next start`
   build (desktop 1280 + mobile 375) — no console errors, no horizontal overflow.
6. **Land (only on PASS).** Merge the branch into `staging` and push. (Staging deploys to a
   preview; **production only ships when a human says "promote."**)
7. **✅ Check it off the backlog.** Mark the backlog item it just finished
   `~~struck~~ ✅ SHIPPED via <slug>` **in the same cycle** — and do NOT add a duplicate
   item for the work just done. _(This is the step that was missing before 2026-07-05, which
   is why the backlog wasn't shrinking. It's now mandatory; the morning digest also runs
   `backlog-reconcile.mjs` as a backstop.)_
8. **Log.** Append a `## <ts> — PASS|FAIL — <slug>` entry to `CHANGELOG.md` with What / Goal
   / Verdict / Screenshots, and record which tier it pulled.

A genuine **FAIL** re-attempts the same item once on the escalate model; ~25% of PASSes get
a code-quality spot-check on the judge model.

## Which model runs what (`config.json.models`)
| Step | Model | Why |
|---|---|---|
| Execution cycles | **Sonnet** | Cheap, fast — most cycles are mechanical. |
| Escalate (retry a FAIL) | Sonnet | Cost-controlled retry. |
| Judge (spot-check quality) | Sonnet | Read-only quality note. |
| **Plan (generate new goal tasks)** | **Opus** (or Fable) | Task ideation is where model quality matters most — never done on the cheap model. |

## Stop conditions
The night ends at the window close (~06:15 PT), an 8h safety cap, a cost/cycle cap, a human
Stop, a rate-limit/auth stop, or the backlog draining (after a plan pass tops it up).

## Where to look
- **Daily Report** tab — what shipped last night + what's waiting to promote.
- **Backlog** tab — the queue (✅ items are done).
- **Goal & Allocation** tab — the current goal + the full priority policy.
- **Engineering health ↗** (Juno/Forge) — token usage, cost, run health.
