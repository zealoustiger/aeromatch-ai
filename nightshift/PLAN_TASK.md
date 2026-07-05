# Night Shift — PLAN pass (goal-task generation)

You are the **planner** for ClubHanger's overnight build loop. You are running on the
**smartest model on purpose** — task ideation is where model quality matters most. Your
ONLY job this pass is to **generate the next batch of high-value goal tasks and append them
to the backlog.** You do NOT build anything, run the app, or touch product code.

## Orient (read, in full)
- `nightshift/GOAL.md` — the north-star goal. As of 2026-07-05 it is: **build the best
  "set an alert" experience on the web, everywhere on the site — alerts FIRST.**
- `nightshift/BACKLOG.md` — what's already queued. Read the alert-experience / goal section
  and the recent items so you don't duplicate open work.
- `head -60 nightshift/CHANGELOG.md` — what already shipped (newest first), so you don't
  propose work that's already done.
- `nightshift/FREEZE.md` — never propose tasks that touch frozen files/areas.

## Generate 5–8 tasks
Invent the highest-value **alert-experience** slices that aren't already open or shipped.
Each task MUST be:
- **Concrete and shippable in ONE cycle** (a single surface/flow, not an epic). Slice big
  ideas — "alert management page" → "list your active alerts (read-only) v1", then "pause",
  then "delete", as separate tasks.
- **Tagged `[P1][goal]`** and filed under the alert-experience goal section in `BACKLOG.md`.
- **Honest + measurable:** note the alert surface it adds/improves and that it should emit
  the `alert_subscribed` analytics event where a new capture point is added.
- **Aligned to GOAL.md's alert priorities:** entry points everywhere (listings, browse,
  search/filter, make/model/state pages, homepage, empty states), frictionless one-field
  capture, great confirmation/unsubscribe UX, alert management (view/edit/pause/delete),
  new-listing + price-drop alerts, digest vs instant.

Prefer breadth of entry points and management first (the biggest gaps), then polish.

## Write them to the backlog + commit
1. `git fetch --quiet origin && git checkout staging && git pull --quiet --ff-only`
2. Append the tasks to `nightshift/BACKLOG.md` under the alert-experience goal section
   (create the section if missing, near the top of Ideas). One-line each, `[P1][goal]`,
   with a short "why / what it adds" clause. Do not remove or reorder existing items.
3. Commit: `git add nightshift/BACKLOG.md && git commit -q -m "nightshift: plan — generated N alert-experience goal tasks"`
4. `git push --quiet origin staging`

## Output
End with exactly one line: `PLAN — added <N> goal tasks` (or `PLAN — none — backlog already
has enough open goal tasks` if the alert queue is already deep and nothing new is worth
adding). Do not build or QA anything.
