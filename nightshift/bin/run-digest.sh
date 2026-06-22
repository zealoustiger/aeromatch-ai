#!/usr/bin/env bash
# Night Shift MORNING DIGEST entrypoint (VPS / Docker).
# A `claude -p` reads the night's CHANGELOG, writes a narrative overnight review to
# nightshift/REVIEW.md, and syncs it to the admin Daily Report tab. Fired by a 07:15 PT
# systemd timer, after the drain's 06:50 stop. Read-and-summarize only — builds nothing.
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

# Feed the prompt via STDIN (with `-p` and no arg): the prompt begins with `---`
# frontmatter, which breaks claude when passed as a -p argument (it exits 1 with no
# output). Same fix the per-cycle drain uses. Persist output to the state dir.
STATE="${NS_STATE_DIR:-/home/night/state}"
printf '%s' "$(cat "$APP/nightshift/DIGEST_TASK.md")" | \
  timeout --signal=INT "${NS_DIGEST_TIMEOUT:-600}" \
    claude --dangerously-skip-permissions --output-format json -p \
    > "$STATE/digest.out" 2> "$STATE/digest.err"
rc=${PIPESTATUS[1]}
echo "digest exit $rc"
exit "$rc"
