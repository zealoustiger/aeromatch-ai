#!/usr/bin/env bash
# Night Shift drain entrypoint (VPS / Docker).
# Runs ONE drain headlessly via `claude -p`, records token usage + status to the
# mounted state volume, then exits. A host systemd timer fires this hourly; systemd's
# oneshot semantics guarantee two drains never overlap. See nightshift/VPS_RUNBOOK.md.
set -uo pipefail

APP="${NS_APP_DIR:-/app}"
STATE="${NS_STATE_DIR:-/home/night/state}"
RUN_TIMEOUT="${NS_RUN_TIMEOUT:-4200}"     # 70 min hard cap (matches the lock staleness window)
mkdir -p "$STATE/runs"
LEDGER="$STATE/usage.jsonl"
STATUS="$STATE/status.json"

RUN_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$STATE/runs/$RUN_ID.json"
ERRLOG="$STATE/runs/$RUN_ID.stderr"

cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

# GitHub access for the in-container git pull/push (deploy key mounted at ~/.ssh).
# Exported so the worker subagents' git push (on PASS) use it too.
if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true
git config --global user.email "nightshift@clubhanger.local" 2>/dev/null || true
git config --global user.name  "ClubHanger Night Shift" 2>/dev/null || true

git fetch --quiet origin 2>/dev/null || true
git checkout staging --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# Mark "running" so the status reader / alerter can see liveness.
printf '{"state":"running","run_id":"%s","started":"%s"}\n' "$RUN_ID" "$RUN_TS" > "$STATUS"

# --dangerously-skip-permissions is REQUIRED for unattended ops and acceptable ONLY
# because this container is isolated (no other apps' secrets share it).
set +e
timeout --signal=INT "$RUN_TIMEOUT" \
  claude --dangerously-skip-permissions \
         --output-format json \
         -p "$(cat "$APP/nightshift/DRAIN_TASK.md")" \
  > "$OUT" 2> "$ERRLOG"
rc=$?
set -e
END_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Pull usage from the result JSON. SINGLE-LINE jq filter on purpose — a multi-line
# filter reached jq as only its first line in this exec path and failed the compile.
vals=$(jq -r '[(.usage.input_tokens//0),(.usage.output_tokens//0),(.usage.cache_read_input_tokens//0),(.usage.cache_creation_input_tokens//0),(.total_cost_usd//0),(.duration_ms//0),(.api_error_status//"")]|@tsv' "$OUT" 2>/dev/null)
IFS=$'\t' read -r in_t out_t cr_t cc_t cost durms apierr <<<"${vals:-}"
in_t=${in_t:-0}; out_t=${out_t:-0}; cr_t=${cr_t:-0}; cc_t=${cc_t:-0}
cost=${cost:-0}; durms=${durms:-0}; apierr=${apierr:-}

# Classify outcome for the alerter.
outcome="ok"
[ "${rc}" -ne 0 ] && outcome="error"
[ "${rc}" = "124" ] && outcome="timeout"          # `timeout` kill
[ "${apierr}" = "401" ] && outcome="auth_expired" # token logged out
[ "${apierr}" = "429" ] && outcome="rate_limited"

# Append one ledger line — single jq pass over the result JSON, SINGLE-LINE filter
# (the source of truth for Forge's token monitoring).
jq -c --arg ts "$RUN_TS" --arg end "$END_TS" --arg rid "$RUN_ID" --argjson exit "${rc:-1}" --arg outcome "$outcome" '{ts:$ts,end:$end,run_id:$rid,exit:$exit,outcome:$outcome,api_error_status:(.api_error_status//""),input_tokens:(.usage.input_tokens//0),output_tokens:(.usage.output_tokens//0),cache_read_tokens:(.usage.cache_read_input_tokens//0),cache_creation_tokens:(.usage.cache_creation_input_tokens//0),total_cost_usd:(.total_cost_usd//0),duration_ms:(.duration_ms//0)}' "$OUT" >> "$LEDGER" 2>>"$ERRLOG" || printf '{"ts":"%s","exit":%s,"outcome":"%s","parse":"failed"}\n' "$RUN_TS" "${rc:-1}" "$outcome" >> "$LEDGER"

# Final status (idle + last outcome) for the reader / alerter.
printf '{"state":"idle","last_run_id":"%s","last_started":"%s","last_ended":"%s","last_exit":%s,"last_outcome":"%s","last_api_error":"%s","input_tokens":%s,"output_tokens":%s}\n' \
  "$RUN_ID" "$RUN_TS" "$END_TS" "$rc" "$outcome" "$apierr" "$in_t" "$out_t" > "$STATUS"

exit "$rc"
