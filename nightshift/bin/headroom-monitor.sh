#!/usr/bin/env bash
# Forge VPS headroom sampler. VENDORED FROM forge/core/bin/headroom-monitor.sh.
#
# Runs in the BACKGROUND for the lifetime of one drain (started/killed by
# run-drain.sh) and appends one JSON line per interval to $1. Two vantage points:
#   - HOST: /proc/loadavg and /proc/meminfo are NOT namespaced, so even inside the
#     container they report whole-box load and free memory — exactly what we need
#     to detect two parallel drains starving each other (or Juno).
#   - THIS CONTAINER: cgroup files report our own memory use vs the --memory cap,
#     OOM kills, and CPU throttling vs the --cpus quota.
# headroom-report.mjs turns these samples into the morning-report section.
#
# Usage: headroom-monitor.sh <out.jsonl> [interval-seconds=30]
set -uo pipefail
OUT="${1:?usage: headroom-monitor.sh <out.jsonl> [interval]}"
INTERVAL="${2:-30}"

# cgroup v2 (unified) vs v1 file locations; -1 = metric unavailable on this host.
if [ -f /sys/fs/cgroup/memory.current ]; then
  MEM_CUR=/sys/fs/cgroup/memory.current; MEM_MAX=/sys/fs/cgroup/memory.max
  MEM_EVENTS=/sys/fs/cgroup/memory.events; CPU_STAT=/sys/fs/cgroup/cpu.stat
else
  MEM_CUR=/sys/fs/cgroup/memory/memory.usage_in_bytes
  MEM_MAX=/sys/fs/cgroup/memory/memory.limit_in_bytes
  MEM_EVENTS=""; CPU_STAT=/sys/fs/cgroup/cpu/cpu.stat
fi

rd() { [ -n "$1" ] && [ -f "$1" ] && cat "$1" 2>/dev/null || echo -1; }
NCPU=$(nproc 2>/dev/null || echo -1)
MEM_TOTAL_KB=$(awk '/^MemTotal/{print $2}' /proc/meminfo 2>/dev/null || echo -1)

while : ; do
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  load1=$(cut -d' ' -f1 /proc/loadavg 2>/dev/null || echo -1)
  mem_avail_kb=$(awk '/^MemAvailable/{print $2}' /proc/meminfo 2>/dev/null || echo -1)
  cg_cur=$(rd "$MEM_CUR")
  cg_max=$(rd "$MEM_MAX")                      # "max" (v2, uncapped) stays a string
  oom_kills=-1
  [ -n "$MEM_EVENTS" ] && oom_kills=$(awk '/^oom_kill /{print $2}' "$MEM_EVENTS" 2>/dev/null || echo -1)
  nr_throttled=-1; throttled_usec=-1
  if [ -f "$CPU_STAT" ]; then
    nr_throttled=$(awk '/^nr_throttled /{print $2}' "$CPU_STAT" 2>/dev/null || echo -1)
    throttled_usec=$(awk '/^throttled_usec|^throttled_time/{print $2}' "$CPU_STAT" 2>/dev/null || echo -1)
  fi
  printf '{"ts":"%s","load1":%s,"ncpu":%s,"mem_total_kb":%s,"mem_avail_kb":%s,"cg_mem_bytes":"%s","cg_mem_max":"%s","oom_kills":%s,"nr_throttled":%s,"throttled_usec":%s}\n' \
    "$ts" "${load1:--1}" "$NCPU" "$MEM_TOTAL_KB" "${mem_avail_kb:--1}" "$cg_cur" "$cg_max" "${oom_kills:--1}" "${nr_throttled:--1}" "${throttled_usec:--1}" >> "$OUT"
  sleep "$INTERVAL"
done
