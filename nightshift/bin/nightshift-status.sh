#!/usr/bin/env bash
# Forge Night Shift status reader. Run on the HOST. VENDORED FROM forge.
# Shows: is it running / when it last ran / today's token + cost totals / recent runs.
# Source of truth = the JSONL ledger that run-drain.sh appends.
#
# Usage: nightshift-status.sh [project]     (default: all projects under /opt/nightshift)
set -uo pipefail
BASE="${NS_BASE_DIR:-/opt/nightshift}"
today=$(date -u +%Y-%m-%d)

show_project() {
  local p="$1" STATE="$BASE/$1/state"
  local LEDGER="$STATE/usage.jsonl" STATUS="$STATE/status.json"
  echo "== Night Shift: $p =="
  if command -v systemctl >/dev/null 2>&1; then
    echo "service : $(systemctl is-active "nightshift@$p.service" 2>/dev/null || echo unknown)"
    nextfire=$(systemctl list-timers "nightshift@$p.timer" --no-pager 2>/dev/null | awk 'NR==2{print $1,$2,$3}')
    [ -n "${nextfire:-}" ] && echo "next    : $nextfire"
  fi
  if [ -f "$STATUS" ]; then
    echo "--- last status ---"
    jq -r '"state: \(.state)  last_outcome: \(.last_outcome // "n/a")  last_ended: \(.last_ended // "n/a")  night_spend: $\(.night_spend_usd // 0)"' "$STATUS" 2>/dev/null || cat "$STATUS"
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
    echo "--- last 5 cycles ---"
    tail -5 "$LEDGER" | jq -c '{ts,verdict,exit,in:.input_tokens,out:.output_tokens,cost:.total_cost_usd}' 2>/dev/null
  else
    echo "(no ledger yet at $LEDGER)"
  fi
  echo
}

if [ -n "${1:-}" ]; then
  show_project "$1"
else
  for d in "$BASE"/*/state; do
    [ -d "$d" ] || continue
    show_project "$(basename "$(dirname "$d")")"
  done
fi
