#!/usr/bin/env bash
# Night Shift status reader. Run on the HOST. Shows: is it running / when it last ran /
# today's token + cost totals / recent runs. Source of truth = the JSONL ledger that
# run-drain.sh appends. See nightshift/VPS_RUNBOOK.md (Part 8).
set -uo pipefail
STATE="${NS_STATE_DIR:-/opt/nightshift/state}"
LEDGER="$STATE/usage.jsonl"
STATUS="$STATE/status.json"
today=$(date -u +%Y-%m-%d)

echo "== Night Shift =="
if command -v systemctl >/dev/null 2>&1; then
  echo "service : $(systemctl is-active nightshift-drain.service 2>/dev/null || echo unknown)"
  nextfire=$(systemctl list-timers nightshift-drain.timer --no-pager 2>/dev/null | awk 'NR==2{print $1,$2,$3}')
  [ -n "${nextfire:-}" ] && echo "next    : $nextfire"
fi

if [ -f "$STATUS" ]; then
  echo "--- last status ---"
  jq -r '"state: \(.state)  last_outcome: \(.last_outcome // "n/a")  last_ended: \(.last_ended // "n/a")"' "$STATUS" 2>/dev/null || cat "$STATUS"
fi

if [ -f "$LEDGER" ]; then
  echo "--- today ($today UTC) ---"
  jq -s --arg d "$today" '
    map(select(.ts|startswith($d)))
    | {runs:length,
       input_tokens:(map(.input_tokens // 0)|add // 0),
       output_tokens:(map(.output_tokens // 0)|add // 0),
       cache_read_tokens:(map(.cache_read_tokens // 0)|add // 0),
       cost_usd:((map(.total_cost_usd // 0)|add // 0)*100|round/100),
       errors:(map(select(.exit!=0))|length)}' "$LEDGER" 2>/dev/null
  echo "--- last 5 runs ---"
  tail -5 "$LEDGER" | jq -c '{ts,exit,outcome,in:.input_tokens,out:.output_tokens,cost:.total_cost_usd}' 2>/dev/null
else
  echo "(no ledger yet at $LEDGER)"
fi
