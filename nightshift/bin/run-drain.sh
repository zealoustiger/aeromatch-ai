#!/usr/bin/env bash
# Night Shift drain (VPS / Docker) — bash-controlled loop.
#
# Each cycle is its OWN `claude -p` process running nightshift/CYCLE_TASK.md (pick one
# item + PM→Eng→QA→Land). The loop, time box, stop conditions, MODEL choice, FAIL
# escalation, and code-quality spot-checks all live HERE in bash — NOT in a long-lived
# orchestrator using the Agent tool (that reliably broke in headless containers).
#
# Model policy (token-saving): run cycles on a cheap model; if a cycle FAILs the gate,
# escalate ONCE to the strong model (its blocker-first rule re-attempts the just-failed
# item); and spot-check a random sample of PASS cycles on the strong model to judge code
# quality. Set NS_CYCLE_MODEL=claude-opus-4-8 to put everything back on Opus.
# See nightshift/VPS_RUNBOOK.md.
set -uo pipefail

APP="${NS_APP_DIR:-/app}"
STATE="${NS_STATE_DIR:-/home/night/state}"
RUN_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
RUNDIR="$STATE/runs/$RUN_ID"
mkdir -p "$RUNDIR"
LEDGER="$STATE/usage.jsonl"
STATUS="$STATE/status.json"

# Bounds. NS_FORCE=1 = authorized manual run, ignores the night window + uses a time box.
PER_CYCLE_TIMEOUT="${NS_CYCLE_TIMEOUT:-1200}"     # 20 min hard cap per cycle

# Model policy (override any via env). Aliases resolve to the latest of each tier
# (sonnet→4.6, opus→4.8) and are accepted across CLI versions. Set NS_CYCLE_MODEL=opus
# to put every cycle back on Opus.
CYCLE_MODEL="${NS_CYCLE_MODEL:-sonnet}"      # cheap model for normal cycles
ESCALATE_MODEL="${NS_ESCALATE_MODEL:-opus}"  # strong model, used on a FAIL retry
JUDGE_MODEL="${NS_JUDGE_MODEL:-opus}"         # strong model, used to grade PASSes
JUDGE_PCT="${NS_JUDGE_PCT:-25}"                          # % of PASS cycles to spot-check
mname() { case "$1" in *sonnet*) echo sonnet;; *opus*) echo opus;; *haiku*) echo haiku;; *) echo "$1";; esac; }

if [ "${NS_FORCE:-0}" = "1" ]; then
  MAX_CYCLES="${NS_FORCE_WORKERS:-6}"
  DEADLINE=$(( $(date +%s) + 60 * ${NS_FORCE_MINUTES:-55} ))
else
  MAX_CYCLES="${NS_MAX_CYCLES:-25}"
  DEADLINE=$(( $(date +%s) + 60 * 480 ))           # 8h overall safety
fi

# Night window check (container TZ is America/Los_Angeles): 23:00–06:15 PT. The 06:15
# stop leaves session-limit headroom for the next night; the 07:15 digest is token-free.
in_window() { local hm; hm=$(date +%H%M); [ "$hm" -ge 2300 ] || [ "$hm" -lt 0615 ]; }

cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

# GitHub access for in-container git pull/push (deploy key mounted at ~/.ssh). Exported so
# each cycle's `claude -p` (and its git push on PASS) inherit it.
if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true
git config --global user.email "nightshift@clubhanger.local" 2>/dev/null || true
git config --global user.name  "ClubHanger Night Shift" 2>/dev/null || true
git fetch --quiet origin 2>/dev/null || true
git checkout staging --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# Scheduled run outside the night window → clean no-op.
if [ "${NS_FORCE:-0}" != "1" ] && ! in_window; then
  printf '{"state":"idle","last_run_id":"%s","last_started":"%s","last_ended":"%s","last_outcome":"ok","note":"outside night window — no-op"}\n' \
    "$RUN_ID" "$RUN_TS" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATUS"
  echo "outside night window — no-op"; exit 0
fi

n=0; pass=0; fail=0; abort=0; escalations=0; judged=0; stop_reason="safety cap"
CYCLE_PROMPT="$(cat "$APP/nightshift/CYCLE_TASK.md")"
rm -f "$STATE/stop" 2>/dev/null   # clear any stale stop request from a prior run

# Run ONE claude cycle. $1 = model, $2 = escalated (0|1). Sets globals: verdict, rline,
# rsafe, slug, apierr. Writes a ledger row (with model + escalated) and bumps counters.
exec_cycle() {
  local model="$1" esc="$2" crc RL vals in_t out_t cr_t cc_t cost
  n=$((n+1))
  CYCLE_OUT="$RUNDIR/cycle-$n.jsonl"
  CYCLE_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  printf '{"state":"running","run_id":"%s","started":"%s","active_worker":"runs/%s/cycle-%s.jsonl","cycle":%s,"model":"%s","escalated":%s,"stop_by":%s}\n' \
    "$RUN_ID" "$RUN_TS" "$RUN_ID" "$n" "$n" "$(mname "$model")" "$esc" "$DEADLINE" > "$STATUS"

  # Feed the prompt via STDIN, not as a -p arg: the prompt begins with "---" (frontmatter).
  printf '%s' "$CYCLE_PROMPT" | timeout --signal=INT "$PER_CYCLE_TIMEOUT" \
    claude --dangerously-skip-permissions --model "$model" --output-format stream-json --verbose -p \
    > "$CYCLE_OUT" 2> "$RUNDIR/cycle-$n.stderr"
  crc=${PIPESTATUS[1]}
  CYCLE_END=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  RL=$(grep -E '"type"[[:space:]]*:[[:space:]]*"result"' "$CYCLE_OUT" 2>/dev/null | tail -1)
  vals=$(printf '%s' "$RL" | jq -r '[(.usage.input_tokens//0),(.usage.output_tokens//0),(.usage.cache_read_input_tokens//0),(.usage.cache_creation_input_tokens//0),(.total_cost_usd//0),(.api_error_status//"")]|@tsv' 2>/dev/null)
  IFS=$'\t' read -r in_t out_t cr_t cc_t cost apierr <<<"${vals:-}"
  in_t=${in_t:-0}; out_t=${out_t:-0}; cr_t=${cr_t:-0}; cc_t=${cc_t:-0}; cost=${cost:-0}; apierr=${apierr:-}
  rline=$(printf '%s' "$RL" | jq -r '.result // ""' 2>/dev/null | grep -oE '(PASS|FAIL|ABORT)[^|]*' | tail -1)
  rsafe=$(printf '%s' "$rline" | tr -d '"\\' | tr '\n' ' ' | head -c 180)
  slug=$(printf '%s' "$rline" | grep -oE '[a-z0-9]+(-[a-z0-9]+)+' | head -1)
  case "$rline" in
    PASS*)  verdict=PASS;  pass=$((pass+1));;
    FAIL*)  verdict=FAIL;  fail=$((fail+1));;
    ABORT*) verdict=ABORT; abort=$((abort+1));;
    *)      verdict=ERROR; fail=$((fail+1)); rsafe="cycle produced no verdict (exit $crc)";;
  esac
  [ "$esc" = "1" ] && escalations=$((escalations+1))

  printf '{"ts":"%s","end":"%s","run_id":"%s","cycle":%s,"model":"%s","escalated":%s,"verdict":"%s","result":"%s","exit":%s,"api_error_status":"%s","input_tokens":%s,"output_tokens":%s,"cache_read_tokens":%s,"cache_creation_tokens":%s,"total_cost_usd":%s}\n' \
    "$CYCLE_TS" "$CYCLE_END" "$RUN_ID" "$n" "$(mname "$model")" "$esc" "$verdict" "$rsafe" "${crc:-1}" "$apierr" "$in_t" "$out_t" "$cr_t" "$cc_t" "$cost" >> "$LEDGER"
  echo "cycle $n [$(mname "$model")$([ "$esc" = "1" ] && echo ' ↑esc')]: $verdict — $rsafe"
}

# Spot-check a PASSed cycle's code quality on the strong model. Read-only on code —
# appends a graded note to nightshift/QUALITY.md and commits it. Never blocks the loop.
run_judge() {
  local jslug="$1"
  judged=$((judged+1))
  echo "  ↳ quality-judging $jslug on $(mname "$JUDGE_MODEL")"
  sed "s/{{SLUG}}/$jslug/g" "$APP/nightshift/JUDGE_TASK.md" | timeout --signal=INT 600 \
    claude --dangerously-skip-permissions --model "$JUDGE_MODEL" --output-format stream-json --verbose -p \
    > "$RUNDIR/judge-$n.jsonl" 2> "$RUNDIR/judge-$n.stderr" || true
}

while : ; do
  # Graceful stop request ($STATE/stop, e.g. Forge's Stop button) ends cleanly at the boundary.
  [ -f "$STATE/stop" ] && { stop_reason="stopped by Brian"; rm -f "$STATE/stop"; break; }
  [ "$n" -ge "$MAX_CYCLES" ] && { stop_reason="safety cap ($MAX_CYCLES)"; break; }
  if [ "${NS_FORCE:-0}" = "1" ]; then
    [ "$(date +%s)" -ge "$DEADLINE" ] && { stop_reason="time box"; break; }
  else
    in_window || { stop_reason="night ended"; break; }
    [ "$(date +%s)" -ge "$DEADLINE" ] && { stop_reason="8h safety"; break; }
  fi

  exec_cycle "$CYCLE_MODEL" 0

  # Escalate a genuine FAIL (not an abort / rate-limit / auth stop) to the strong model
  # ONCE — its blocker-first rule re-attempts the just-failed item with more capability.
  if { [ "$verdict" = "FAIL" ] || [ "$verdict" = "ERROR" ]; } && [ "$apierr" != "429" ] && [ "$apierr" != "401" ] && [ "$n" -lt "$MAX_CYCLES" ]; then
    exec_cycle "$ESCALATE_MODEL" 1
  fi

  # Spot-check ~JUDGE_PCT% of PASS cycles for code quality on the strong model.
  if [ "$verdict" = "PASS" ] && [ -n "${slug:-}" ] && [ $((RANDOM % 100)) -lt "$JUDGE_PCT" ]; then
    run_judge "$slug"
  fi

  # Stop conditions surfaced by the most recent cycle.
  case "$rline" in ABORT*none*|ABORT*nothing*) stop_reason="backlog drained"; break;; esac
  [ "$apierr" = "429" ] && { stop_reason="rate limited"; break; }
  [ "$apierr" = "401" ] && { stop_reason="auth expired"; break; }
done

# ── Wrap: DRAIN SUMMARY to the CHANGELOG (logs only, safe) ──────────────────────
END_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MODEL_LINE="- Models: cycles on $(mname "$CYCLE_MODEL"); ${escalations} escalated to $(mname "$ESCALATE_MODEL"); ${judged} quality-judged on $(mname "$JUDGE_MODEL")"
CL="$APP/nightshift/CHANGELOG.md"
if [ -f "$CL" ] && [ "$n" -gt 0 ]; then
  git checkout staging --quiet 2>/dev/null || true
  git pull --quiet --ff-only 2>/dev/null || true
  SUMMARY="## ${END_TS} — DRAIN SUMMARY
- Cycles this run: ${n} (PASS ${pass} / FAIL ${fail} / ABORT ${abort})
${MODEL_LINE}
- Stopped because: ${stop_reason}
- Run: ${RUN_ID}$( [ "${NS_FORCE:-0}" = "1" ] && echo ' (manual NS_FORCE)' )
"
  { head -4 "$CL"; echo "$SUMMARY"; tail -n +5 "$CL"; } > "$CL.tmp" && mv "$CL.tmp" "$CL"
  git add "$CL" 2>/dev/null && git commit -q -m "nightshift: drain summary ($n cycles, PASS $pass/FAIL $fail, $(mname "$CYCLE_MODEL"))" 2>/dev/null

  # Refresh the admin Daily Report after EVERY run.
  RV="$APP/nightshift/REVIEW.md"
  RUN_BLOCK="## ${END_TS} — Night Shift run: ${n} cycles (PASS ${pass} / FAIL ${fail}) — ${stop_reason}$( [ "${NS_FORCE:-0}" = "1" ] && echo ' · manual' )
${MODEL_LINE}

$(jq -r --arg rid "$RUN_ID" 'select(.run_id==$rid and .cycle!=null) | "- " + (.result // (.verdict + " — cycle " + (.cycle|tostring)))' "$LEDGER" 2>/dev/null)
"
  { printf '%s\n\n' "$RUN_BLOCK"; [ -f "$RV" ] && cat "$RV"; } > "$RV.tmp" && mv "$RV.tmp" "$RV"
  ( cd "$APP" && node scripts/sync-admin-docs.mjs >/dev/null 2>&1 ) || true
  git add "$RV" nightshift/QUALITY.md 2>/dev/null && git commit -q -m "nightshift: run report → admin Daily Report" 2>/dev/null

  git push origin staging 2>/dev/null || true
fi

# Final status.
overall="ok"; [ "$fail" -gt 0 ] && [ "$pass" -eq 0 ] && overall="error"
printf '{"state":"idle","last_run_id":"%s","last_started":"%s","last_ended":"%s","last_outcome":"%s","cycles":%s,"pass":%s,"fail":%s,"abort":%s,"escalations":%s,"judged":%s,"cycle_model":"%s","stop_reason":"%s"}\n' \
  "$RUN_ID" "$RUN_TS" "$END_TS" "$overall" "$n" "$pass" "$fail" "$abort" "$escalations" "$judged" "$(mname "$CYCLE_MODEL")" "$stop_reason" > "$STATUS"
echo "DONE: $n cycles (PASS $pass / FAIL $fail / ABORT $abort) — $stop_reason — $(mname "$CYCLE_MODEL"), $escalations escalated, $judged judged"
exit 0
