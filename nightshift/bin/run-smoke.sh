#!/usr/bin/env bash
# Night Shift SMOKE RUNNER (VPS / Docker), fired every minute by a systemd timer.
# Claims the oldest queued smoke run (from the admin "Run smoke tests" button) and
# executes the production Playwright suite. The Supabase reporter streams per-test
# results back to the /admin/smoke page live. Exits immediately when nothing is
# queued, so the once-a-minute cadence is cheap.
set -uo pipefail
APP="${NS_APP_DIR:-/app}"
cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true

set -a; [ -f "$APP/.env.local" ] && . "$APP/.env.local"; set +a
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/home/night/.cache/ms-playwright}"

# 1) Claim the oldest queued run (atomic: only succeeds if still 'requested').
RUN_ID=$(node -e '
  const { createClient } = require("@supabase/supabase-js")
  const a = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  ;(async () => {
    const { data } = await a.from("smoke_runs").select("id").eq("status","requested").order("created_at").limit(1)
    if (!data || !data.length) return
    const id = data[0].id
    const { data: claimed } = await a.from("smoke_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", id).eq("status", "requested").select("id")
    if (claimed && claimed.length) process.stdout.write(id)
  })().catch(() => {})
' 2>/dev/null)

[ -z "$RUN_ID" ] && { echo "no queued smoke run"; exit 0; }
echo "claimed smoke run $RUN_ID"

# Latest specs/config/reporter.
git fetch --quiet origin 2>/dev/null || true
git checkout staging --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# 2) Ensure deps — install ONLY when missing (the install is slow and can stall on
#    a download, so we never run it unconditionally on the hot path). node_modules
#    lives in the mounted repo; browsers in the mounted cache — both persist.
node -e "require.resolve('@playwright/test')" 2>/dev/null || { echo "installing @playwright/test…"; npm install --no-audit --no-fund >/dev/null 2>&1; }
# Skip the browser install entirely when a chromium binary is already cached.
if ! node -e "const {chromium}=require('@playwright/test'); const fs=require('fs'); const p=chromium.executablePath(); process.exit(p && fs.existsSync(p) ? 0 : 1)" 2>/dev/null; then
  echo "installing chromium…"
  timeout 600 npx playwright install chromium >/dev/null 2>&1 || echo "chromium install failed/timed out — relying on cache"
fi

# 3) Run — the Supabase reporter writes per-test rows + the final run status.
SMOKE_RUN_ID="$RUN_ID" SMOKE_BASE_URL="${SMOKE_BASE_URL:-https://clubhanger.com}" npx playwright test
rc=$?
echo "playwright exit $rc"

# 4) Safety net: if the suite crashed before the reporter finalized, don't leave
#    the run stuck — mark it errored so the admin sees a clear outcome.
RID="$RUN_ID" RC="$rc" node -e '
  const { createClient } = require("@supabase/supabase-js")
  const a = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  ;(async () => {
    const { data } = await a.from("smoke_runs").select("status").eq("id", process.env.RID).single()
    if (data && (data.status === "running" || data.status === "requested")) {
      await a.from("smoke_runs").update({
        status: "error", finished_at: new Date().toISOString(),
        error: `runner exited before completion (exit ${process.env.RC})`,
      }).eq("id", process.env.RID)
    }
  })().catch(() => {})
' 2>/dev/null || true

exit 0
