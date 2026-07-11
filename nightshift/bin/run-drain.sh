#!/usr/bin/env bash
# Forge Night Shift drain (VPS / Docker) — bash-controlled loop. VENDORED FROM forge:
# canonical source is forge/core/bin/run-drain.sh — fix bugs THERE, then re-run
# `forge-init --update` in each project. Do not hand-edit per-project copies.
#
# Each cycle is its OWN `claude -p` process running nightshift/CYCLE_TASK.md (pick one
# item + PM→Eng→QA→Land). The loop, time box, stop conditions, MODEL choice, FAIL
# escalation, and code-quality spot-checks all live HERE in bash — NOT in a long-lived
# orchestrator using the Agent tool (that reliably broke in headless containers).
#
# Project-specific knobs come from nightshift/config.json (jq); every knob is also
# overridable via NS_* env. With no config file the defaults match the original
# ClubHanger behavior, so this script is a drop-in replacement.
#
# Model policy (token-saving): run cycles on a cheap model; if a cycle FAILs the gate,
# escalate ONCE to the strong model (its blocker-first rule re-attempts the just-failed
# item); and spot-check a random sample of PASS cycles on the strong model to judge code
# quality.
#
# Parallel-drain support (multiple projects, one subscription, one box):
#   - NS_MAX_NIGHT_COST_USD / budget.maxNightCostUsd: hard per-night spend cap so one
#     project cannot starve the others. 0 = uncapped.
#   - headroom-monitor.sh samples host load / memory / cgroup pressure in the
#     background; headroom-report.mjs turns the samples into a "VPS headroom" section
#     appended to the morning report (REVIEW.md → admin_content.daily_report).
set -uo pipefail

APP="${NS_APP_DIR:-/app}"
STATE="${NS_STATE_DIR:-/home/night/state}"
CFG="$APP/nightshift/config.json"
# cfgd <jq-path> <default>: read a knob from config.json, else default.
cfgd() { local v=""; [ -f "$CFG" ] && v=$(jq -r "$1 // empty" "$CFG" 2>/dev/null); [ -n "$v" ] && printf '%s' "$v" || printf '%s' "$2"; }

PROJECT="${NS_PROJECT:-$(cfgd '.project' nightshift)}"
DISPLAY_NAME="$(cfgd '.displayName' "$PROJECT")"
WORK_BRANCH="${NS_WORK_BRANCH:-$(cfgd '.workBranch' staging)}"

RUN_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
RUNDIR="$STATE/runs/$RUN_ID"
mkdir -p "$RUNDIR"
LEDGER="$STATE/usage.jsonl"
STATUS="$STATE/status.json"

# Model policy (env > config > default). Aliases resolve to the latest of each tier
# and are accepted across CLI versions.
CYCLE_MODEL="${NS_CYCLE_MODEL:-$(cfgd '.models.cycle' sonnet)}"
ESCALATE_MODEL="${NS_ESCALATE_MODEL:-$(cfgd '.models.escalate' opus)}"
JUDGE_MODEL="${NS_JUDGE_MODEL:-$(cfgd '.models.judge' opus)}"
JUDGE_PCT="${NS_JUDGE_PCT:-$(cfgd '.models.judgePct' 25)}"
# Planner: when the backlog drains, generate more [goal] tasks (PLAN_TASK.md) instead of
# stopping. Task ideation is where model quality matters most, so this runs on Fable by
# default; a Fable pass that errors falls back to the escalate-tier model once.
PLAN_MODEL="${NS_PLAN_MODEL:-$(cfgd '.models.plan' claude-fable-5)}"
PLAN_FALLBACK_MODEL="${NS_PLAN_FALLBACK_MODEL:-$ESCALATE_MODEL}"
MAX_PLANS="${NS_MAX_PLANS:-2}"   # planner refills allowed per run — runaway guard
mname() { case "$1" in *sonnet*) echo sonnet;; *opus*) echo opus;; *haiku*) echo haiku;; *fable*) echo fable;; *) echo "$1";; esac; }

# Bounds. NS_FORCE=1 = authorized manual run, ignores the night window + uses a time box.
# The per-cycle hard cap is MODEL-AWARE: a strong model reasons ~2-3x slower per turn
# than a cheap one, so one flat cap either kills strong-model cycles mid-work (exit 124,
# wasted spend) or lets cheap-model cycles thrash. An explicit NS_CYCLE_TIMEOUT overrides.
cycle_timeout() {
  [ -n "${NS_CYCLE_TIMEOUT:-}" ] && { echo "$NS_CYCLE_TIMEOUT"; return; }
  case "$(mname "$1")" in opus) echo 2400;; haiku) echo 900;; *) echo 1200;; esac
}

if [ -n "${NS_RUN_UNTIL:-}" ]; then
  # Run from NOW until an absolute epoch deadline (e.g. 8am), ignoring the nightly
  # window + cycle cap — used for a manual "keep going until X" drain.
  MAX_CYCLES="${NS_MAX_CYCLES:-1000}"
  DEADLINE="$NS_RUN_UNTIL"
elif [ "${NS_FORCE:-0}" = "1" ]; then
  MAX_CYCLES="${NS_FORCE_WORKERS:-6}"
  DEADLINE=$(( $(date +%s) + 60 * ${NS_FORCE_MINUTES:-55} ))
else
  MAX_CYCLES="${NS_MAX_CYCLES:-$(cfgd '.budget.maxCycles' 25)}"
  DEADLINE=$(( $(date +%s) + 60 * 480 ))           # 8h overall safety
fi

# Night window (container TZ set by the systemd unit). Crossing midnight (start > end)
# is the normal overnight case; start < end supports a daytime window.
WIN_START=$(( 10#$(cfgd '.window.start' 2300) ))
WIN_END=$(( 10#$(cfgd '.window.end' 0615) ))
in_window() {
  local hm; hm=$(( 10#$(date +%H%M) ))
  if [ "$WIN_START" -gt "$WIN_END" ]; then [ "$hm" -ge "$WIN_START" ] || [ "$hm" -lt "$WIN_END" ]
  else [ "$hm" -ge "$WIN_START" ] && [ "$hm" -lt "$WIN_END" ]; fi
}

# Per-night budget cap. The "night key" is the calendar date the night STARTED (an
# 01:00 fire belongs to yesterday's night), so all fires of one night share one total.
MAX_NIGHT_COST="${NS_MAX_NIGHT_COST_USD:-$(cfgd '.budget.maxNightCostUsd' 0)}"
NIGHT_KEY=$(date -d '7 hours ago' +%F 2>/dev/null || date +%F)
COSTF="$STATE/night-$NIGHT_KEY.cost"
spent=$(cat "$COSTF" 2>/dev/null || echo 0)
over_budget() {
  [ "$MAX_NIGHT_COST" = "0" ] && return 1
  awk -v s="$spent" -v c="$MAX_NIGHT_COST" 'BEGIN{exit !(s>=c)}'
}

cd "$APP" || { echo "no app dir $APP" >&2; exit 1; }

# GitHub access for in-container git pull/push (deploy key mounted at ~/.ssh). Exported so
# each cycle's `claude -p` (and its git push on PASS) inherit it.
if [ -f /home/night/.ssh/nightshift_ed25519 ]; then
  export GIT_SSH_COMMAND="ssh -i /home/night/.ssh/nightshift_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=/home/night/.ssh/known_hosts -o StrictHostKeyChecking=yes"
fi
git config --global --add safe.directory "$APP" 2>/dev/null || true
git config --global user.email "$(cfgd '.gitEmail' "nightshift@$PROJECT.local")" 2>/dev/null || true
git config --global user.name  "$(cfgd '.gitName' "$DISPLAY_NAME Night Shift")" 2>/dev/null || true
git fetch --quiet origin 2>/dev/null || true
# Self-heal a wedged tree before switching branches. A prior cycle killed mid-edit
# (systemd timeout → SIGTERM) can leave the working tree dirty; with dirty tracked
# files the checkout refuses to switch, the `|| true` swallows the error, and the
# drain silently runs on a stale night/* branch so nothing ever lands.
git reset --hard --quiet 2>/dev/null || true
git clean -fdq 2>/dev/null || true
git checkout "$WORK_BRANCH" --quiet 2>/dev/null || true
git pull --quiet --ff-only 2>/dev/null || true

# Scheduled run outside the night window → clean no-op. (NS_RUN_UNTIL / NS_FORCE bypass.)
if [ -z "${NS_RUN_UNTIL:-}" ] && [ "${NS_FORCE:-0}" != "1" ] && ! in_window; then
  printf '{"state":"idle","project":"%s","last_run_id":"%s","last_started":"%s","last_ended":"%s","last_outcome":"ok","note":"outside night window — no-op"}\n' \
    "$PROJECT" "$RUN_ID" "$RUN_TS" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATUS"
  echo "outside night window — no-op"; exit 0
fi
if over_budget; then
  printf '{"state":"idle","project":"%s","last_run_id":"%s","last_started":"%s","last_ended":"%s","last_outcome":"ok","note":"night budget cap reached ($%s of $%s) — no-op"}\n' \
    "$PROJECT" "$RUN_ID" "$RUN_TS" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$spent" "$MAX_NIGHT_COST" > "$STATUS"
  echo "night budget cap reached (\$$spent of \$$MAX_NIGHT_COST) — no-op"; exit 0
fi

# Headroom sampler: background, host-level (load/mem are host-wide in /proc even inside
# the container) + this container's own cgroup pressure. Report generated at wrap.
HRM="$RUNDIR/headroom.jsonl"
"$APP/nightshift/bin/headroom-monitor.sh" "$HRM" "${NS_HEADROOM_INTERVAL:-30}" &
HM_PID=$!
trap 'kill "$HM_PID" 2>/dev/null' EXIT

n=0; pass=0; fail=0; abort=0; escalations=0; judged=0; planned=0; stop_reason="safety cap"
CYCLE_PROMPT="$(cat "$APP/nightshift/CYCLE_TASK.md")"
rm -f "$STATE/stop" 2>/dev/null   # clear any stale stop request from a prior run

# Run ONE claude cycle. $1 = model, $2 = escalated (0|1). Sets globals: verdict, rline,
# rsafe, slug, apierr. Writes a ledger row (with model + escalated), bumps counters,
# and adds the cycle's cost to tonight's budget total.
exec_cycle() {
  local model="$1" esc="$2" crc RL vals in_t out_t cr_t cc_t cost tmo
  n=$((n+1))
  tmo=$(cycle_timeout "$model")   # cap fits the model actually being run this cycle
  CYCLE_OUT="$RUNDIR/cycle-$n.jsonl"
  CYCLE_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  printf '{"state":"running","project":"%s","run_id":"%s","started":"%s","active_worker":"runs/%s/cycle-%s.jsonl","cycle":%s,"model":"%s","escalated":%s,"stop_by":%s,"night_spend_usd":%s}\n' \
    "$PROJECT" "$RUN_ID" "$RUN_TS" "$RUN_ID" "$n" "$n" "$(mname "$model")" "$esc" "$DEADLINE" "$spent" > "$STATUS"

  # Feed the prompt via STDIN, not as a -p arg: the prompt begins with "---" (frontmatter).
  printf '%s' "$CYCLE_PROMPT" | timeout --signal=INT "$tmo" \
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

  printf '{"ts":"%s","end":"%s","project":"%s","run_id":"%s","cycle":%s,"model":"%s","escalated":%s,"verdict":"%s","result":"%s","exit":%s,"api_error_status":"%s","input_tokens":%s,"output_tokens":%s,"cache_read_tokens":%s,"cache_creation_tokens":%s,"total_cost_usd":%s}\n' \
    "$CYCLE_TS" "$CYCLE_END" "$PROJECT" "$RUN_ID" "$n" "$(mname "$model")" "$esc" "$verdict" "$rsafe" "${crc:-1}" "$apierr" "$in_t" "$out_t" "$cr_t" "$cc_t" "$cost" >> "$LEDGER"
  spent=$(awk -v s="$spent" -v c="$cost" 'BEGIN{printf "%.4f", s + c}')
  printf '%s' "$spent" > "$COSTF"
  echo "cycle $n [$(mname "$model")$([ "$esc" = "1" ] && echo ' ↑esc')]: $verdict — $rsafe (night \$$spent)"
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

# Refill the goal queue when the backlog drains. Runs PLAN_TASK.md — task ideation ONLY,
# never touches product code; it appends [goal] tasks to BACKLOG.md and pushes staging
# itself. $1 = model, $2 = attempt tag. Sets global: plan_result (the planner's "PLAN — …"
# line, or "" if the pass produced none). Syncs the working tree to whatever it pushed so
# the next cycle sees the new tasks.
run_plan() {
  local model="$1" tag="$2" out="$RUNDIR/plan-$2.jsonl"
  echo "  ↳ backlog drained — generating goal tasks on $(mname "$model") (refill $tag)"
  cat "$APP/nightshift/PLAN_TASK.md" | timeout --signal=INT 900 \
    claude --dangerously-skip-permissions --model "$model" --output-format stream-json --verbose -p \
    > "$out" 2> "$RUNDIR/plan-$tag.stderr" || true
  plan_result=$(grep -E '"type"[[:space:]]*:[[:space:]]*"result"' "$out" 2>/dev/null | tail -1 \
    | jq -r '.result // ""' 2>/dev/null | grep -oE 'PLAN[^|]*' | tail -1)
  git -C "$APP" fetch -q origin 2>/dev/null && git -C "$APP" reset -q --hard origin/staging 2>/dev/null || true
  echo "  ↳ planner ($(mname "$model")): ${plan_result:-(no result)}"
}

while : ; do
  # Graceful stop request ($STATE/stop, e.g. a dashboard Stop button) ends cleanly here.
  [ -f "$STATE/stop" ] && { stop_reason="stopped by human"; rm -f "$STATE/stop"; break; }
  [ "$n" -ge "$MAX_CYCLES" ] && { stop_reason="safety cap ($MAX_CYCLES)"; break; }
  over_budget && { stop_reason="night budget cap (\$$MAX_NIGHT_COST)"; break; }
  if [ -n "${NS_RUN_UNTIL:-}" ]; then
    [ "$(date +%s)" -ge "$DEADLINE" ] && { stop_reason="reached run-until"; break; }
  elif [ "${NS_FORCE:-0}" = "1" ]; then
    [ "$(date +%s)" -ge "$DEADLINE" ] && { stop_reason="time box"; break; }
  else
    in_window || { stop_reason="night ended"; break; }
    [ "$(date +%s)" -ge "$DEADLINE" ] && { stop_reason="8h safety"; break; }
  fi

  exec_cycle "$CYCLE_MODEL" 0

  # Escalate a genuine FAIL (not an abort / rate-limit / auth stop) to the strong model
  # ONCE — its blocker-first rule re-attempts the just-failed item with more capability.
  if { [ "$verdict" = "FAIL" ] || [ "$verdict" = "ERROR" ]; } && [ "$apierr" != "429" ] && [ "$apierr" != "401" ] && [ "$n" -lt "$MAX_CYCLES" ] && ! over_budget; then
    exec_cycle "$ESCALATE_MODEL" 1
  fi

  # Spot-check ~JUDGE_PCT% of PASS cycles for code quality on the strong model.
  if [ "$verdict" = "PASS" ] && [ -n "${slug:-}" ] && [ $((RANDOM % 100)) -lt "$JUDGE_PCT" ]; then
    run_judge "$slug"
  fi

  # Backlog drained: instead of quitting, run the planner to invent more goal tasks and
  # keep cycling. Bounded by MAX_PLANS per run + the night budget cap. Only actually stop
  # if the planner (and its fallback) find nothing new, or the refill cap is hit.
  case "$rline" in
    ABORT*none*|ABORT*nothing*)
      [ "$planned" -ge "$MAX_PLANS" ] && { stop_reason="backlog drained (planner cap $MAX_PLANS)"; break; }
      over_budget && { stop_reason="night budget cap (\$$MAX_NIGHT_COST)"; break; }
      planned=$((planned+1))
      run_plan "$PLAN_MODEL" "$planned"
      case "$plan_result" in ""|*rror*) run_plan "$PLAN_FALLBACK_MODEL" "${planned}f";; esac
      case "$plan_result" in
        *none*|"") stop_reason="backlog drained (planner: nothing to add)"; break;;
        *)         continue;;   # new [goal] tasks are on staging — loop and build them
      esac
      ;;
  esac
  [ "$apierr" = "429" ] && { stop_reason="rate limited"; break; }
  [ "$apierr" = "401" ] && { stop_reason="auth expired"; break; }
done

# ── Wrap: headroom report + DRAIN SUMMARY to the CHANGELOG (logs only, safe) ─────
kill "$HM_PID" 2>/dev/null || true
wait "$HM_PID" 2>/dev/null || true
HEADROOM_MD="$(node "$APP/nightshift/bin/headroom-report.mjs" --samples "$HRM" --ledger "$LEDGER" --run "$RUN_ID" 2>"$RUNDIR/headroom.stderr")" \
  || HEADROOM_MD="### VPS headroom
- ⚠️ headroom report failed to generate — see runs/$RUN_ID/headroom.stderr"
printf '%s\n' "$HEADROOM_MD" > "$RUNDIR/headroom.md"

END_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MODEL_LINE="- Models: cycles on $(mname "$CYCLE_MODEL"); ${escalations} escalated to $(mname "$ESCALATE_MODEL"); ${judged} quality-judged on $(mname "$JUDGE_MODEL")"
BUDGET_LINE="- Night spend so far: \$${spent}$( [ "$MAX_NIGHT_COST" != "0" ] && echo " of \$${MAX_NIGHT_COST} cap" )"
CL="$APP/nightshift/CHANGELOG.md"
if [ -f "$CL" ] && [ "$n" -gt 0 ]; then
  git checkout "$WORK_BRANCH" --quiet 2>/dev/null || true
  git pull --quiet --ff-only 2>/dev/null || true
  SUMMARY="## ${END_TS} — DRAIN SUMMARY
- Cycles this run: ${n} (PASS ${pass} / FAIL ${fail} / ABORT ${abort})
${MODEL_LINE}
${BUDGET_LINE}
- Stopped because: ${stop_reason}
- Run: ${RUN_ID}$( [ "${NS_FORCE:-0}" = "1" ] && echo ' (manual NS_FORCE)' )
"
  { head -4 "$CL"; echo "$SUMMARY"; tail -n +5 "$CL"; } > "$CL.tmp" && mv "$CL.tmp" "$CL"
  git add "$CL" 2>/dev/null && git commit -q -m "nightshift: drain summary ($n cycles, PASS $pass/FAIL $fail, $(mname "$CYCLE_MODEL"))" 2>/dev/null

  # Refresh the admin Daily Report after EVERY run — including the headroom section,
  # so resource problems on the box surface where the human already looks each morning.
  RV="$APP/nightshift/REVIEW.md"
  RUN_BLOCK="## ${END_TS} — Night Shift run: ${n} cycles (PASS ${pass} / FAIL ${fail}) — ${stop_reason}$( [ "${NS_FORCE:-0}" = "1" ] && echo ' · manual' )
${MODEL_LINE}
${BUDGET_LINE}

$(jq -r --arg rid "$RUN_ID" 'select(.run_id==$rid and .cycle!=null) | "- " + (.result // (.verdict + " — cycle " + (.cycle|tostring)))' "$LEDGER" 2>/dev/null)

${HEADROOM_MD}
"
  { printf '%s\n\n' "$RUN_BLOCK"; [ -f "$RV" ] && cat "$RV"; } > "$RV.tmp" && mv "$RV.tmp" "$RV"
  if [ -f "$APP/nightshift/bin/sync-admin-docs.mjs" ]; then
    ( cd "$APP" && node nightshift/bin/sync-admin-docs.mjs >/dev/null 2>&1 ) || true
  elif [ -f "$APP/scripts/sync-admin-docs.mjs" ]; then
    ( cd "$APP" && node scripts/sync-admin-docs.mjs >/dev/null 2>&1 ) || true
  fi
  # Add separately: a combined `git add` is atomic, so a missing QUALITY.md (fresh
  # project, nothing judged yet) would silently un-stage REVIEW.md too — and the next
  # fire's `git reset --hard` would then wipe the uncommitted run report.
  git add "$RV" 2>/dev/null || true
  git add nightshift/QUALITY.md 2>/dev/null || true
  git commit -q -m "nightshift: run report → admin Daily Report" 2>/dev/null

  git push origin "$WORK_BRANCH" 2>/dev/null || true
fi

# Final status.
overall="ok"; [ "$fail" -gt 0 ] && [ "$pass" -eq 0 ] && overall="error"
printf '{"state":"idle","project":"%s","last_run_id":"%s","last_started":"%s","last_ended":"%s","last_outcome":"%s","cycles":%s,"pass":%s,"fail":%s,"abort":%s,"escalations":%s,"judged":%s,"cycle_model":"%s","night_spend_usd":%s,"stop_reason":"%s"}\n' \
  "$PROJECT" "$RUN_ID" "$RUN_TS" "$END_TS" "$overall" "$n" "$pass" "$fail" "$abort" "$escalations" "$judged" "$(mname "$CYCLE_MODEL")" "$spent" "$stop_reason" > "$STATUS"
echo "DONE: $n cycles (PASS $pass / FAIL $fail / ABORT $abort) — $stop_reason — $(mname "$CYCLE_MODEL"), $escalations escalated, $judged judged, night \$$spent"
exit 0
