#!/usr/bin/env bash
# Night Shift DAILY SCRAPE entrypoint (VPS / Docker).
# Refreshes the planes-for-sale inventory every morning so new listings land
# daily and the 7-day sold-detection window actually ticks. Runs the ingestion
# orchestrator (all default adapters), then the alert match-and-send (a no-op
# until RESEND_API_KEY is set). Token-free: no `claude` turn, so it is never
# blocked by the subscription rate limit.
# Fired by a 06:40 PT systemd timer — after the drain's stop, before the 07:15
# digest, so the morning report can include the fresh inventory.
set -uo pipefail
APP="${NS_APP_DIR:-/app}"
cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

# GitHub access for the in-container pull (deploy key mounted at ~/.ssh).
if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true

# Latest staging — picks up adapter coverage fixes without a redeploy.
git fetch --quiet origin 2>/dev/null || true
git checkout staging --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# Creds for the scraper + alerts (Supabase service role, Resend, site URL).
set -a; [ -f "$APP/.env.local" ] && . "$APP/.env.local"; set +a

STATE="${NS_STATE_DIR:-/home/night/state}"

# 1) Ingest — upsert listings, update last_seen_at, detect price changes + sold.
echo "=== daily scrape: ingest ==="
node scraper/ingest.mjs > "$STATE/scrape.out" 2> "$STATE/scrape.err"
ingest_rc=$?
cat "$STATE/scrape.out" 2>/dev/null
[ "$ingest_rc" -ne 0 ] && { echo "ingest stderr:"; tail -20 "$STATE/scrape.err" 2>/dev/null; }

# 2) Match-and-send alert digests for any NEW listings (skips sends if no
#    RESEND_API_KEY — baseline-first, so it never blasts the back-catalog).
echo "=== daily scrape: alerts ==="
node scraper/send-alerts.mjs >> "$STATE/scrape.out" 2>> "$STATE/scrape.err" || true
tail -8 "$STATE/scrape.out" 2>/dev/null

echo "scrape exit $ingest_rc"
exit "$ingest_rc"
