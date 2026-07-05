#!/usr/bin/env node
// Forge VPS headroom report. VENDORED FROM forge/core/bin/headroom-report.mjs.
//
// Turns one drain's headroom samples (headroom-monitor.sh) + its ledger rows into
// the "### VPS headroom" markdown section that run-drain.sh appends to REVIEW.md —
// which sync-admin-docs.mjs then pushes into the admin Daily Report. So resource
// problems (parallel drains starving each other, container hitting its memory cap,
// CPU throttling, OOM kills) surface where the human already looks every morning.
//
// Usage: node headroom-report.mjs --samples <headroom.jsonl> --ledger <usage.jsonl> --run <RUN_ID>
// Always exits 0 with a printable section (an all-clear line when nothing is wrong);
// the drain must never fail because its monitoring did.

import { readFileSync, existsSync } from 'node:fs'

const arg = (name, dflt = '') => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt
}
const samplesFile = arg('samples')
const ledgerFile = arg('ledger')
const runId = arg('run')

const jsonl = (file) =>
  existsSync(file)
    ? readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => {
        try { return [JSON.parse(l)] } catch { return [] }
      })
    : []

const GB = (kb) => (kb / 1024 / 1024).toFixed(1)
const num = (v) => (typeof v === 'number' ? v : parseFloat(v))

const samples = jsonl(samplesFile).filter((s) => num(s.load1) >= 0)
const issues = []
const notes = []

if (samples.length === 0) {
  console.log('### VPS headroom\n- ⚠️ no headroom samples recorded this run (monitor died or run ended before first sample)')
  process.exit(0)
}

// Median sampling interval, for turning "N consecutive samples" into minutes.
const times = samples.map((s) => Date.parse(s.ts)).filter((t) => !isNaN(t))
const deltas = times.slice(1).map((t, i) => (t - times[i]) / 1000).sort((a, b) => a - b)
const intervalS = deltas.length ? deltas[Math.floor(deltas.length / 2)] : 30

const ncpu = Math.max(...samples.map((s) => num(s.ncpu) || 0), 1)

// 1) Host CPU saturation — sustained load1 above ~95% of cores means every process
// on the box (both drains, Juno, the scraper) is queueing for CPU.
let maxStreak = 0, streak = 0, peakLoad = 0
for (const s of samples) {
  const load = num(s.load1)
  peakLoad = Math.max(peakLoad, load)
  if (load > ncpu * 0.95) { streak++; maxStreak = Math.max(maxStreak, streak) } else streak = 0
}
if (maxStreak >= 3) {
  issues.push(`host CPU saturated: load peaked at ${peakLoad.toFixed(1)} on ${ncpu} cores, sustained ~${Math.round((maxStreak * intervalS) / 60)} min — parallel drains are contending; consider more cores or lower --cpus per container`)
}

// 2) Host free memory — the box (not just this container) running out is how a
// parallel build spike OOM-kills a neighbor.
const availSamples = samples.filter((s) => num(s.mem_avail_kb) >= 0)
const minAvailKb = availSamples.length ? Math.min(...availSamples.map((s) => num(s.mem_avail_kb))) : -1
const totalKb = num(samples[0].mem_total_kb)
if (minAvailKb >= 0 && minAvailKb < 800 * 1024) {
  issues.push(`host memory ran low: free memory bottomed at ${GB(minAvailKb)} GB${totalKb > 0 ? ` of ${GB(totalKb)} GB` : ''} — build spikes from parallel drains may OOM; raise box RAM or stagger the heavy phases`)
}

// 3) This container vs its --memory cap.
const cgSamples = samples.filter((s) => num(s.cg_mem_bytes) > 0 && num(s.cg_mem_max) > 0)
let peakPct = 0, peakBytes = 0, capBytes = 0
for (const s of cgSamples) {
  const cur = num(s.cg_mem_bytes), max = num(s.cg_mem_max)
  if (cur / max > peakPct) { peakPct = cur / max; peakBytes = cur; capBytes = max }
}
if (peakPct > 0.9) {
  issues.push(`container neared its memory cap: peak ${(peakBytes / 1e9).toFixed(1)} GB of ${(capBytes / 1e9).toFixed(1)} GB (${Math.round(peakPct * 100)}%) — raise --memory in the env file before it OOM-kills a build`)
}

// 4) OOM kills inside this container (cgroup v2 only) — definite, not a heuristic.
const oomSamples = samples.filter((s) => num(s.oom_kills) >= 0)
if (oomSamples.length) {
  const oomDelta = num(oomSamples[oomSamples.length - 1].oom_kills) - num(oomSamples[0].oom_kills)
  if (oomDelta > 0) issues.push(`🚨 ${oomDelta} OOM kill(s) INSIDE this container tonight — the --memory cap is too low for the build; raise it now`)
}

// 5) CPU throttling against the --cpus quota — cycles run slow and hit timeouts.
const thrSamples = samples.filter((s) => num(s.throttled_usec) >= 0)
if (thrSamples.length >= 2) {
  const thrDeltaS = (num(thrSamples[thrSamples.length - 1].throttled_usec) - num(thrSamples[0].throttled_usec)) / 1e6
  if (thrDeltaS > 60) {
    issues.push(`container CPU-throttled ~${Math.round(thrDeltaS)}s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles`)
  }
}

// 6) Cycle hard-timeouts from the ledger (exit 124) — the symptom that resource
// starvation actually cost us work tonight.
const cycles = jsonl(ledgerFile).filter((r) => r.run_id === runId && r.cycle != null)
const timeouts = cycles.filter((r) => r.exit === 124).length
if (timeouts > 0) {
  notes.push(`${timeouts} of ${cycles.length} cycle(s) hit the hard timeout (exit 124)${issues.length ? ' — likely related to the resource pressure above' : ' — not obviously resource-related (no pressure detected); could be an oversized task'}`)
}

const lines = ['### VPS headroom']
for (const i of issues) lines.push(i.startsWith('🚨') ? `- ${i}` : `- ⚠️ ${i}`)
for (const n of notes) lines.push(`- ${n}`)
if (issues.length === 0) {
  lines.push(
    `- ✅ no headroom issues — peak load ${peakLoad.toFixed(1)}/${ncpu} cores, min free mem ${minAvailKb >= 0 ? GB(minAvailKb) + ' GB' : 'n/a'}${peakPct > 0 ? `, container peaked at ${Math.round(peakPct * 100)}% of its memory cap` : ''} (${samples.length} samples)`
  )
}
console.log(lines.join('\n'))
