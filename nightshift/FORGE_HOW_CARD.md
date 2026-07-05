# One cycle, start to finish

Each cycle picks **one** item and ships it to staging.

1. **Orient** — pull staging, read goal + backlog.
2. **Pick one** — by priority: bugs → your tasks → AI goal.
3. **Spec** — a short spec of the change.
4. **Build** — smallest useful slice, on a branch.
5. **QA** — build + typecheck green; headless smoke on desktop & mobile, no console errors.
6. **Land** — merge to staging on PASS.
7. **✅ Check it off** — mark the backlog item shipped **this cycle**. _(The step that was missing — why the backlog wasn't shrinking.)_
8. **Log** — one CHANGELOG line.

> Prod ships only when you say **"promote"** — the loop never touches production on its own.

## Nightly schedule · PT

| Time | Job |
|---|---|
| 11pm–6am | Build cycles |
| 6:40am | Scrape + send alerts |
| 7:15am | Morning report + backlog reconcile |

_Full detail lives in `nightshift/HOW_IT_WORKS.md`._
