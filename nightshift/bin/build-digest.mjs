#!/usr/bin/env node
// Deterministic morning digest — assembles the by-page review from the CHANGELOG
// (whose Pages/What lines are authored by the build workers) and the live traffic
// numbers, then writes nightshift/REVIEW.md and syncs it to the admin dashboard.
//
// Uses ZERO Claude tokens, so it always runs even when the overnight drain has
// exhausted the subscription limit. Run: node nightshift/bin/build-digest.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASE = 'https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app'

// Promote boundary: cycles newer than main's last commit are the unpromoted batch.
let boundary = new Date(Date.now() - 18 * 3600e3)
try {
  boundary = new Date(execSync('git log -1 --format=%cI origin/main', { cwd: root }).toString().trim())
} catch {}

// Parse per-cycle CHANGELOG entries (skip DRAIN SUMMARY and anything pre-boundary).
const changelog = readFileSync(join(root, 'nightshift/CHANGELOG.md'), 'utf8')
const blocks = changelog.split(/\n(?=## )/)
const field = (block, name) => {
  const m = block.match(new RegExp(`^- ${name}:\\s*(.+)$`, 'im'))
  return m ? m[1].trim() : ''
}
const cycles = []
for (const b of blocks) {
  const h = b.match(/^## (\S+) — (PASS|FAIL) — (\S+)/m)
  if (!h) continue
  const ts = new Date(h[1])
  if (isNaN(ts) || ts <= boundary) continue
  cycles.push({ ts, status: h[2], slug: h[3], pages: field(b, 'Pages'), what: field(b, 'What') })
}

// Collapse dynamic route families so the digest groups (e.g. all
// /aircraft/{make}/{model} pages) read as one section, not 90 rows.
// [regex, family-key, friendly-label]. First match wins; order specific→general.
const FAMILIES = [
  [/^\/aircraft\/[^/]+\/[^/]+\/[^/]+$/, '/aircraft/[make]/[model]/[state]', 'Model-in-state for-sale pages'],
  [/^\/aircraft\/[^/]+\/[^/]+$/, '/aircraft/[make]/[model]', 'Make + Model "for sale" pages'],
  [/^\/aircraft\/for-sale\/[^/]+$/, '/aircraft/for-sale/[state]', 'Planes for sale by state'],
  [/^\/aircraft\/[^/]+$/, '/aircraft/[make]', 'Make-level for-sale pages'],
  [/^\/partnerships\/near\/[^/]+$/, '/partnerships/near/[airport]', 'Partnerships near an airport'],
  [/^\/partnerships\/state\/[^/]+$/, '/partnerships/state/[state]', 'Partnerships by state'],
  [/^\/partnerships\/make\/[^/]+$/, '/partnerships/make/[make]', 'Partnerships by make'],
  [/^\/partnerships\/[0-9a-f-]{16,}$/, '/partnerships/[id]', 'Partnership detail pages'],
  [/^\/airports\/[^/]+$/, '/airports/[icao]', 'Airport pages'],
  [/^\/guides\/.+$/, '/guides/[guide]', 'Guide pages'],
]
const STATIC = {
  '/aircraft': 'Planes for Sale (marketplace)',
  '/partnerships': 'Browse partnerships',
  '/partnerships/seeking': 'Pilots seeking shares',
  '/guides': 'Guides hub',
  '/tools': 'Calculators',
  '/saved': 'My saved listings',
  '/': 'Homepage',
  '/aircraft/browse': 'Browse-all hub',
}
function classify(route) {
  for (const [re, key, label] of FAMILIES) if (re.test(route)) return { key, label, example: route }
  return { key: route, label: STATIC[route] || '', example: route }
}

// Pull only real route tokens out of a (possibly messy, prose-laden) Pages line.
const KNOWN = /^\/(aircraft|partnerships|airports|guides|tools|saved|messages|searches|sitemap|robots)(\/|$|\.)/i
function extractRoutes(line) {
  const toks = (line || '').match(/\/[A-Za-z0-9_\-[\].]+(?:\/[A-Za-z0-9_\-[\]]+)*/g) || []
  const out = new Set()
  for (let t of toks) {
    t = t.replace(/[).,]+$/, '')
    if (KNOWN.test(t)) out.add(t)
  }
  if (/(^|[\s,])\/($|[\s,)])/.test(line || '')) out.add('/') // bare homepage token
  return out.size ? [...out] : ['(site-wide)']
}

// Group cycles by page family. Dedup families within a cycle; prefer a concrete
// example route (no [param]) for the section's open-link.
const groups = new Map() // key → { label, example, cycles:Set }
const fails = []
for (const c of cycles) {
  if (c.status === 'FAIL') fails.push(c)
  const fams = new Map()
  for (const r of extractRoutes(c.pages)) {
    const { key, label, example } = r.startsWith('/') ? classify(r) : { key: r, label: '', example: null }
    if (!fams.has(key)) fams.set(key, { label, example })
  }
  for (const [key, { label, example }] of fams) {
    if (!groups.has(key)) groups.set(key, { label, example, cycles: new Set() })
    const g = groups.get(key)
    if ((!g.example || g.example.includes('[')) && example && !example.includes('[')) g.example = example
    g.cycles.add(c)
  }
}
const pagesSorted = [...groups.entries()]
  .map(([key, g]) => [key, g.label, g.example, [...g.cycles]])
  .sort((a, b) => b[3].length - a[3].length)

// Fresh traffic block (its own script; prints markdown, no Slack post).
let traffic = ''
try {
  traffic = execSync('node nightshift/bin/traffic-report.mjs', { cwd: root }).toString().trim()
} catch {
  traffic = '## 📊 Traffic\n\n_Traffic numbers unavailable this run._'
}

const today = new Date().toISOString().slice(0, 10)
const pageCount = groups.size
const out = []
out.push(`# Overnight review — ${today}`)
out.push('')
out.push(traffic)
out.push('')
out.push('---')
out.push('')
out.push(
  `**${cycles.length} cycle${cycles.length === 1 ? '' : 's'} landed on staging across ${pageCount} page${pageCount === 1 ? '' : 's'}.** Review the live staging site (you must be logged into Vercel), then tell Claude which pages to promote — or "promote everything."`
)
out.push('')
out.push(`Staging site: ${BASE}`)
out.push('')

const pageCountTotal = pagesSorted.length
for (const [key, label, example, cs] of pagesSorted) {
  const heading = label ? `${key} — ${label}` : key
  // Only link when we have a real (non-placeholder) example URL.
  const link = example && !example.includes('[') ? `  ·  [open ↗](${BASE}${example})` : ''
  out.push('---')
  out.push('')
  out.push(`## ${heading}${link}`)
  out.push('')
  for (const c of cs) {
    const flag = c.status === 'FAIL' ? '⚠️ FAILED — ' : ''
    out.push(`- ${flag}${c.what || c.slug} _(cycle: ${c.slug})_`)
  }
  out.push('')
}
void pageCountTotal

if (fails.length) {
  out.push('---')
  out.push('')
  out.push('## ⚠️ Needs your attention')
  for (const f of fails) out.push(`- **${f.slug}** failed QA — left as a branch for review. ${f.what || ''}`.trim())
  out.push('')
}

// Code-quality spot-checks — Opus judged a sample of PASSed cycles (since the last
// promote). Surface the recent grades + any flagged weaknesses.
try {
  const ql = readFileSync(join(root, 'nightshift/QUALITY.md'), 'utf8')
  const qBlocks = ql.split(/\n(?=## )/).filter((b) => /^## \d{4}-/.test(b.trimStart()))
  const recent = qBlocks
    .map((b) => {
      const h = b.match(/^## (\S+) — (\S+) — score (\d)\/5/m)
      return h && new Date(h[1]) > boundary ? { ts: h[1], slug: h[2], score: +h[3], body: b } : null
    })
    .filter(Boolean)
  if (recent.length) {
    const avg = (recent.reduce((s, r) => s + r.score, 0) / recent.length).toFixed(1)
    out.push('---', '', `## 🧪 Code-quality spot-checks — ${recent.length} judged, avg ${avg}/5`, '')
    for (const r of recent.sort((a, b) => a.score - b.score)) {
      const weak = (r.body.match(/^- Weaknesses[^\n]*$/im) || [''])[0].replace(/^- Weaknesses\s*\/?\s*risks:\s*/i, '').trim()
      const flag = r.score < 4 ? ' ⚠️' : ''
      out.push(`- **${r.slug} — ${r.score}/5**${flag}${weak && weak.toLowerCase() !== 'none material' ? ` — ${weak}` : ''}`)
    }
    out.push('')
  }
} catch {}

out.push('---')
out.push('')
out.push('## To ship')
out.push(`Tell Claude "promote /aircraft" (or any pages above), or "promote everything." Claude merges the chosen work staging→main, which deploys to clubhanger.com.`)
out.push('')

if (cycles.length === 0) {
  out.length = 0
  out.push(`# Overnight review — ${today}`, '', traffic, '', '---', '', '_No new cycles landed on staging since the last promote._', '')
}

writeFileSync(join(root, 'nightshift/REVIEW.md'), out.join('\n'))
console.log(`Wrote REVIEW.md — ${cycles.length} cycles, ${pagesSorted.length} pages, ${fails.length} fails.`)

// Push to the admin dashboard (backlog + daily report).
try {
  execSync('node scripts/sync-admin-docs.mjs', { cwd: root, stdio: 'inherit' })
} catch (e) {
  console.error('sync-admin-docs failed:', e.message)
}
