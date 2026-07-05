#!/usr/bin/env bash
# Night Shift LISTINGS-HEALTH entrypoint (VPS / Docker).
# Verifies each public scraper actually did its job overnight (new inventory,
# re-seen rate, last-scrape age, photo coverage) and writes a markdown verdict
# to admin_content.listings_health_report — the admin sees it as a panel at
# the top of /admin/listings. Posts to Slack #alerts on ANY failing check.
# Fired by a 07:30 PT systemd timer, after the 06:40 daily scrape.
set -uo pipefail
APP="${NS_APP_DIR:-/app}"
cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

# GitHub deploy key so the container can pull the latest health-check code.
if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true
git fetch --quiet origin 2>/dev/null || true
git checkout staging --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# Creds (Supabase service role, Slack) come from .env.local, which the node
# script self-loads. BrightData token is read the same way.
node nightshift/bin/check-listings-health.mjs
rc=$?
echo "listings-health exit $rc"
exit "$rc"
