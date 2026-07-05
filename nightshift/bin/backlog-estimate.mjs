#!/usr/bin/env node
// Estimate how much work remains in nightshift/BACKLOG.md and how long the Night
// Shift will take to clear it — in cycles, hours, and nights. Heuristic (the
// backlog grows as the loop invents SEO experiments, so treat this as a snapshot,
// not a deadline). Exports estimateBacklog(md) for the admin sync; prints when run.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Empirical throughput from recent drains (~34 cycles over a 23:00→06:15 night,
// each PM→Eng→QA→Land cycle ~13 min serial). Tune here if the loop speeds up.
const MIN_PER_CYCLE = 13
const CYCLES_PER_NIGHT = 34
const DEFAULT_CYCLES_PER_ITEM = 2 // an unsliced feature ≈ 2-3 cycles
const MAX_CYCLES_PER_ITEM = 8

const SHIPPED = /✅|~~|\bSHIPPED\b|\bRESOLVED\b|\bDONE\b|\bGREENLIT\b.*✅/i
const ITEM = /^\s{0,3}- \*\*\[P([123])\]/

/** Estimate remaining work from the BACKLOG.md markdown. */
export function estimateBacklog(md) {
  const lines = md.split('\n')
  // Only the open "## Ideas" region — stop at Constraints / Done (shipped log).
  let start = lines.findIndex((l) => /^## Ideas/.test(l))
  let end = lines.findIndex((l, i) => i > start && /^## (Constraints|Done)/.test(l))
  if (start < 0) start = 0
  if (end < 0) end = lines.length

  const items = [] // { priority, cycles }
  let block = null
  const flush = () => {
    if (!block) return
    const text = block.lines.join('\n')
    if (!SHIPPED.test(block.lines[0])) {
      // cycles: explicit "(N cycle…)" wins; else count slice markers "(1) (2) …"; else default.
      const explicit = text.match(/\((\d+)\s*cycles?\)/i)
      const sliceNums = [...text.matchAll(/\((\d)\)/g)].map((m) => +m[1])
      let cycles = explicit ? +explicit[1] : sliceNums.length ? Math.max(...sliceNums) : DEFAULT_CYCLES_PER_ITEM
      cycles = Math.min(Math.max(cycles, 1), MAX_CYCLES_PER_ITEM)
      items.push({ priority: block.priority, cycles })
    }
    block = null
  }
  for (let i = start; i < end; i++) {
    const m = lines[i].match(ITEM)
    if (m) { flush(); block = { priority: +m[1], lines: [lines[i]] } }
    else if (block) block.lines.push(lines[i])
  }
  flush()

  const openItems = items.length
  const cycles = items.reduce((s, it) => s + it.cycles, 0)
  const hours = (cycles * MIN_PER_CYCLE) / 60
  const nights = cycles / CYCLES_PER_NIGHT
  const byPriority = { P1: 0, P2: 0, P3: 0 }
  for (const it of items) byPriority['P' + it.priority]++
  return { openItems, cycles, hours, nights, byPriority }
}

/** A compact markdown block to prepend to the admin Backlog page. */
export function estimateMarkdown(md) {
  const e = estimateBacklog(md)
  const h = Math.round(e.hours)
  const nights = e.nights < 1 ? '<1' : e.nights.toFixed(1)
  return [
    `> **📦 Backlog burn-down (estimate):** ~**${e.openItems} open items** · ~**${e.cycles} cycles** · ~**${h} hours** · ~**${nights} night${nights === '1.0' ? '' : 's'}** to clear.`,
    `> _By priority: ${e.byPriority.P1} P1 · ${e.byPriority.P2} P2 · ${e.byPriority.P3} P3. Assumes ~${MIN_PER_CYCLE} min/cycle and ~${CYCLES_PER_NIGHT} cycles/night (recent drain rate). Rough — the loop also invents new SEO items, so the backlog rarely hits zero._`,
  ].join('\n')
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const md = readFileSync(join(root, 'nightshift/BACKLOG.md'), 'utf8')
  const e = estimateBacklog(md)
  console.log(`Open items: ${e.openItems}  (P1:${e.byPriority.P1} P2:${e.byPriority.P2} P3:${e.byPriority.P3})`)
  console.log(`Est. cycles: ${e.cycles}`)
  console.log(`Est. hours:  ${e.hours.toFixed(1)}`)
  console.log(`Est. nights: ${e.nights.toFixed(1)}  (~${CYCLES_PER_NIGHT} cycles/night)`)
  console.log('\n--- admin block ---\n' + estimateMarkdown(md))
}
