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

# Build the prompt. NS_FORCE=1 = authorized manual run OUTSIDE the night window
# (e.g. a daytime test): prepend an override that ignores the "night's end" stop and
# time-boxes the run. NS_FORCE_MINUTES (default 70) sets the soft wrap target.
PROMPT="$(cat "$APP/nightshift/DRAIN_TASK.md")"
if [ "${NS_FORCE:-0}" = "1" ]; then
  PROMPT="MANUAL RUN — AUTHORIZED, OUTSIDE THE NIGHT WINDOW. Override the task below:
- IGNORE Section 3's \"Night's end\" (06:50) stop condition entirely; proceed as if inside the night window.
- TIME BOX: stop cleanly after ~${NS_FORCE_MINUTES:-70} minutes of wall-clock — let the current worker finish, then write the DRAIN SUMMARY and push, so the tree is clean.
- SAFETY CAP: at most ${NS_FORCE_WORKERS:-6} workers this run.
- Everything else applies verbatim: lock, blockers-first, lane alternation, QA via nightshift/bin/qa-smoke.mjs, land-on-clean-PASS-only, CHANGELOG entry, push to staging.

--- TASK ---
${PROMPT}"
fi

# --dangerously-skip-permissions is REQUIRED for unattended ops and acceptable ONLY
# because this container is isolated (no other apps' secrets share it).
set +e
timeout --signal=INT "$RUN_TIMEOUT" \
  claude --dangerously-skip-permissions \
         --output-format stream-json --verbose \
         -p "$PROMPT" \
  > "$OUT" 2> "$ERRLOG"
rc=$?
set -e
END_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# With stream-json, $OUT is JSONL; the final {"type":"result"} event carries usage/cost.
# Pull just that line, then extract with the SINGLE-LINE @tsv jq (multi-line filters
# reach jq as only their first line in this exec path and fail to compile).
RESULT_LINE=$(grep -E '"type"[[:space:]]*:[[:space:]]*"result"' "$OUT" 2>/dev/null | tail -1)
vals=$(printf '%s' "$RESULT_LINE" | jq -r '[(.usage.input_tokens//0),(.usage.output_tokens//0),(.usage.cache_read_input_tokens//0),(.usage.cache_creation_input_tokens//0),(.total_cost_usd//0),(.duration_ms//0),(.api_error_status//"")]|@tsv' 2>/dev/null)
IFS=$'\t' read -r in_t out_t cr_t cc_t cost durms apierr <<<"${vals:-}"
in_t=${in_t:-0}; out_t=${out_t:-0}; cr_t=${cr_t:-0}; cc_t=${cc_t:-0}
cost=${cost:-0}; durms=${durms:-0}; apierr=${apierr:-}

# Classify outcome for the alerter.
outcome="ok"
[ "${rc}" -ne 0 ] && outcome="error"
[ "${rc}" = "124" ] && outcome="timeout"          # `timeout` kill
[ "${apierr}" = "401" ] && outcome="auth_expired" # token logged out
[ "${apierr}" = "429" ] && outcome="rate_limited"

# Append one ledger line via printf from the extracted values (source of truth for
# Forge's token monitoring). The @tsv jq above works on the box, but jq OBJECT
# construction does not in this exec path — so build the line with printf, exactly like
# the status.json write below (proven to work). All values are pre-defaulted, so the
# output is always valid JSON.
printf '{"ts":"%s","end":"%s","run_id":"%s","exit":%s,"outcome":"%s","api_error_status":"%s","input_tokens":%s,"output_tokens":%s,"cache_read_tokens":%s,"cache_creation_tokens":%s,"total_cost_usd":%s,"duration_ms":%s}\n' \
  "$RUN_TS" "$END_TS" "$RUN_ID" "${rc:-1}" "$outcome" "$apierr" "${in_t:-0}" "${out_t:-0}" "${cr_t:-0}" "${cc_t:-0}" "${cost:-0}" "${durms:-0}" >> "$LEDGER"

# Final status (idle + last outcome) for the reader / alerter.
printf '{"state":"idle","last_run_id":"%s","last_started":"%s","last_ended":"%s","last_exit":%s,"last_outcome":"%s","last_api_error":"%s","input_tokens":%s,"output_tokens":%s}\n' \
  "$RUN_ID" "$RUN_TS" "$END_TS" "$rc" "$outcome" "$apierr" "$in_t" "$out_t" > "$STATUS"

exit "$rc"
