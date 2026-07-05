#!/usr/bin/env bash
# Night Shift MORNING DIGEST entrypoint (VPS / Docker).
# Runs the TOKEN-FREE digest builder (no `claude` turn) so the morning report is
# immune to the Claude subscription rate limit — the one thing that should never be
# blocked by usage. `build-digest.mjs` reads the night's CHANGELOG + live traffic,
# writes nightshift/REVIEW.md, and syncs it to the admin Daily Report tab.
# Fired by a 07:15 PT systemd timer, after the drain's stop. Read-and-summarize only.
set -uo pipefail
APP="${NS_APP_DIR:-/app}"
cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

# GitHub access for the in-container pull/push (deploy key mounted at ~/.ssh).
if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true
git config --global user.email "nightshift@clubhanger.local" 2>/dev/null || true
git config --global user.name  "ClubHanger Night Shift" 2>/dev/null || true

# Latest staging — the night's CHANGELOG, plus this script itself for the next run.
git fetch --quiet origin 2>/dev/null || true
git checkout staging --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# Creds for the sub-scripts (traffic-report → PostHog, sync-admin-docs → Supabase).
set -a; [ -f "$APP/.env.local" ] && . "$APP/.env.local"; set +a

# Keep the CHANGELOG small (it grows every night and the orchestrator reads it
# each orient) — archive entries older than a week. Token discipline, not deletion.
node nightshift/bin/rotate-changelog.mjs --keep-days 7 2>/dev/null || true

# Reconcile the backlog: mark items ✅ SHIPPED whose work has already landed, so the
# burn-down actually shrinks (the human noticed it wasn't — 2026-07-05). Backstop to the
# deterministic per-cycle check-off; conservative matcher, safe to run daily.
node nightshift/bin/backlog-reconcile.mjs --apply --quiet 2>/dev/null || true

# Build the report (writes nightshift/REVIEW.md + syncs the admin Daily Report).
# NO `claude` → zero tokens → not blocked by the subscription rate limit.
STATE="${NS_STATE_DIR:-/home/night/state}"

# Expose the loop's Goal + How-it-works docs to the Juno Forge dashboard. Juno mounts
# this state dir read-only, so writing the docs here lets its /forge/docs endpoint serve
# them — refreshed every morning so the dashboard never drifts from the real files.
mkdir -p "$STATE/forge-docs" 2>/dev/null || true
cp nightshift/GOAL.md "$STATE/forge-docs/goal.md" 2>/dev/null || true
cp nightshift/HOW_IT_WORKS.md "$STATE/forge-docs/how-it-works.md" 2>/dev/null || true

node nightshift/bin/build-digest.mjs > "$STATE/digest.out" 2> "$STATE/digest.err"
rc=$?
cat "$STATE/digest.out" 2>/dev/null

# Commit the regenerated report + rotated changelog to staging (logs only — safe).
git add nightshift/REVIEW.md nightshift/CHANGELOG.md nightshift/CHANGELOG-archive.md nightshift/BACKLOG.md 2>/dev/null || true
git commit -q -m "nightshift: morning digest + backlog reconcile (VPS, token-free)" 2>/dev/null || true
git push --quiet origin staging 2>/dev/null || true

echo "digest exit $rc"
exit "$rc"
