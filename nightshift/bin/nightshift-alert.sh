#!/usr/bin/env bash
# Night Shift silent-death alerter. Run on the HOST from cron (e.g. every 30 min during
# the active window). Pings $NS_ALERT_WEBHOOK if the last run failed or no drain has
# landed in too long — this is the piece that catches the exact failure that hid the
# 2026-06-20 stall until it was checked by hand. See nightshift/VPS_RUNBOOK.md (Part 8).
set -uo pipefail
STATE="${NS_STATE_DIR:-/opt/nightshift/state}"
LEDGER="$STATE/usage.jsonl"
HOOK="${NS_ALERT_WEBHOOK:-}"               # ntfy topic URL, Slack/Discord webhook, etc.
MAX_SILENCE_H="${NS_MAX_SILENCE_HOURS:-3}" # alert if no drain in this many hours

notify() {
  echo "ALERT: $1" >&2
  [ -n "$HOOK" ] && curl -fsS --max-time 10 -d "ClubHanger Night Shift — $1" "$HOOK" >/dev/null 2>&1 || true
}

[ -f "$LEDGER" ] || { notify "no usage ledger at $LEDGER (drain never ran?)"; exit 0; }

last=$(tail -1 "$LEDGER")
lts=$(jq -r '.ts // empty' <<<"$last")
lexit=$(jq -r '.exit // 1' <<<"$last")
lout=$(jq -r '.outcome // "unknown"' <<<"$last")
[ -z "$lts" ] && { notify "ledger unreadable"; exit 0; }

# Linux `date -d`; the alerter runs on the host, not in the container.
last_epoch=$(date -u -d "$lts" +%s 2>/dev/null || echo 0)
age_h=$(( ( $(date -u +%s) - last_epoch ) / 3600 ))

[ "$lexit" != "0" ] && notify "last drain FAILED ($lout, exit $lexit) at $lts"
[ "$age_h" -ge "$MAX_SILENCE_H" ] && notify "no drain in ${age_h}h (last $lts)"
exit 0
