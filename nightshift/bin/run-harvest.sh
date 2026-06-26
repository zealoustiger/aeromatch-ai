#!/usr/bin/env bash
# Night Shift PHOTO HARVEST entrypoint (VPS / Docker).
# Recovers photos for hidden hangar67 listings via the Bright Data Web Unlocker
# (Cloudflare solved server-side; no local browser needed). Runs after the daily
# scrape so the day's newly-scraped hidden listings get photos automatically.
# Only touches rows still at images=[], so daily deltas are tiny + cheap.
set -uo pipefail
APP="${NS_APP_DIR:-/app}"
cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true

# Latest harvester code.
git fetch --quiet origin 2>/dev/null || true
git checkout staging --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# Creds (Supabase service role + BRIGHTDATA_API_TOKEN/ZONE) come from .env.local,
# which the node script self-loads; we don't need to source it for the shell.
if ! grep -q '^BRIGHTDATA_API_TOKEN=' "$APP/.env.local" 2>/dev/null; then
  echo "no BRIGHTDATA_API_TOKEN in .env.local — skipping harvest"
  exit 0
fi

# All grades, quality-ordered. Web Unlocker handles IPs/Cloudflare, so no local
# browser and no ms-playwright cache are required.
node scraper/harvest-hangar67-photos.mjs --grade=all --concurrency=4 --delay=400
rc=$?
echo "harvest exit $rc"
exit "$rc"
