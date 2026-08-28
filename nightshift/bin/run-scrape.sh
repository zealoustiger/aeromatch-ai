#!/usr/bin/env bash
# Night Shift DAILY SCRAPE entrypoint (VPS / Docker).
# Refreshes the planes-for-sale inventory every morning so new listings land
# daily and the 7-day sold-detection window actually ticks. Runs the ingestion
# orchestrator (all default adapters), then the saved-search → alert sync.
# Sends no email of its own: alert digests belong to the Vercel cron
# `/api/cron/alert-digest`. Token-free: no `claude` turn, so it is never
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

# Creds for the scraper + alert sync (Supabase service role, site URL).
set -a; [ -f "$APP/.env.local" ] && . "$APP/.env.local"; set +a

STATE="${NS_STATE_DIR:-/home/night/state}"

# 1) Ingest — upsert listings, update last_seen_at, detect price changes + sold.
echo "=== daily scrape: ingest ==="
node scraper/ingest.mjs > "$STATE/scrape.out" 2> "$STATE/scrape.err"
ingest_rc=$?
cat "$STATE/scrape.out" 2>/dev/null
[ "$ingest_rc" -ne 0 ] && { echo "ingest stderr:"; tail -20 "$STATE/scrape.err" 2>/dev/null; }

# 2) Controller aircraft — its own ingester (not an ingest.mjs adapter): needs the
#    Web Unlocker and dedups against every registration we already hold, so it only
#    adds aircraft no other source carries. Rows land status='admin', same as the
#    partnership scrapers, until the extraction is trusted for public display.
#    Page depth is kept modest so it can't crowd out the rest of the run.
echo "=== daily scrape: controller aircraft ==="
node scraper/ingest-controller.mjs --max-pages=25 >> "$STATE/scrape.out" 2>> "$STATE/scrape.err" || true
tail -12 "$STATE/scrape.out" 2>/dev/null

# 3) Partnership scrape — Barnstormers + Controller (+ TAP if non-empty). All
#    rows land status='admin' so nothing leaks publicly until extraction is trusted.
echo "=== daily scrape: partnerships ==="
node scraper/ingest-partnerships.mjs --max-pages=3 >> "$STATE/scrape.out" 2>> "$STATE/scrape.err" || true
tail -20 "$STATE/scrape.out" 2>/dev/null

# 4) Mirror logged-in users' saved searches into confirmed alert rows. This
#    step does NOT send email: `/api/cron/alert-digest` (Vercel cron) is the
#    single owner of alert digests. This script used to send its own digests
#    off the same rows and the same `last_digest_at` cursor, so the two senders
#    raced and whichever ran first each day silenced the other.
echo "=== daily scrape: saved-search sync ==="
node scraper/sync-saved-searches.mjs >> "$STATE/scrape.out" 2>> "$STATE/scrape.err" || true
tail -8 "$STATE/scrape.out" 2>/dev/null

echo "scrape exit $ingest_rc"
exit "$ingest_rc"
