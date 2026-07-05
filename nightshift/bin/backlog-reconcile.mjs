#!/usr/bin/env node
/**
 * Reconcile nightshift/BACKLOG.md against nightshift/CHANGELOG.md.
 *
 * The build loop ships work (CHANGELOG entries) but rarely goes back to mark the
 * corresponding backlog row done, so the "X items / ~Y nights" burn-down counter
 * misrepresents reality — items show as open even after they've shipped. This
 * script scans every PASSed cycle in CHANGELOG.md, looks for the backlog item it
 * most plausibly satisfies, and prepends a "✅ SHIPPED" marker to that item so
 * estimateBacklog() / the admin burn-down ignore it.
 *
 * Matching is intentionally conservative — false positives erase real work from
 * the burn-down. We require strong keyword overlap between the backlog item's
 * bold title and the cycle's slug + first sentence of "What:".
 *
 * Usage:
 *   node nightshift/bin/backlog-reconcile.mjs                 # dry-run; prints matches
 *   node nightshift/bin/backlog-reconcile.mjs --apply         # write BACKLOG.md
 *   node nightshift/bin/backlog-reconcile.mjs --apply --quiet # for the cron job
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BACKLOG_PATH = join(ROOT, 'nightshift/BACKLOG.md')
const CHANGELOG_PATH = join(ROOT, 'nightshift/CHANGELOG.md')

const APPLY = process.argv.includes('--apply')
const QUIET = process.argv.includes('--quiet')
const log = (...a) => { if (!QUIET) console.log(...a) }

// Words too generic to count toward overlap — Jaccard would otherwise match on
// "the listing" alone. Keeping this list narrow because backlog items DO have
// concise titles ("Engine-life panel on partnerships"); over-stripping kills
// legitimate matches.
const STOP = new Set([
  // English filler
  'a','an','the','of','for','on','in','to','and','or','with','from','at','by','as','is','are','be',
  'this','that','it','its','our','their','your','my','any','all','new','add','adds','show','shows',
  'when','where','what','how','via','vs','etc','use','using','make','makes','made','do','does','done',
  'fix','fixes','fixed','update','updates','build','built','ship','ships','shipped',
  'flow','flows','one','two','small','more','also','already','just','than',
  'into','onto','until','after','before','then','so','if','not','no','yes','can','will','should',
  'p1','p2','p3','want','bug','goal',
  // Domain words too generic to anchor a match — most cycles + items contain
  // at least one of these, so they create false-positive token overlap.
  'aircraft','listing','listings','partnership','partnerships','plane','planes',
  'post','posting','page','pages','site','user','users','form','forms',
  'sale','sell','seller','buyer','search','results',
])

const tokenize = (s) =>
  new Set(
    (s || '')
      .toLowerCase()
      .replace(/[`*_~"'()[\]<>{},.;:!?—–\-/\\|+=&^%$#@]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP.has(t) && !/^\d+$/.test(t)),
  )

// ── Parse the CHANGELOG ─────────────────────────────────────────────────────
// Block = "## TIMESTAMP — PASS|FAIL — SLUG" plus its sub-lines until the next
// such header. We only care about PASS blocks.
function parseChangelog(md) {
  const lines = md.split('\n')
  const cycles = []
  let cur = null
  for (const line of lines) {
    const h = line.match(/^## (\S+)\s+—\s+(PASS|FAIL)\s+—\s+(\S+)/)
    if (h) {
      if (cur) cycles.push(cur)
      cur = { ts: h[1], status: h[2], slug: h[3], what: '', date: h[1].slice(0, 10) }
    } else if (cur && /^- What:/i.test(line)) {
      cur.what = line.replace(/^- What:\s*/i, '').slice(0, 600)
    }
  }
  if (cur) cycles.push(cur)
  return cycles.filter((c) => c.status === 'PASS')
}

// ── Parse the BACKLOG's open Ideas section ──────────────────────────────────
// Each open item is a markdown bullet that starts with "- **[P1|P2|P3][tag]"
// somewhere in the first line; we collect the whole multi-line block (bullet +
// continuation lines that don't start a new bullet at the same indent).
function parseBacklog(md) {
  const lines = md.split('\n')
  let start = lines.findIndex((l) => /^## Ideas/.test(l))
  let end = lines.findIndex((l, i) => i > start && /^## (Constraints|Done)/.test(l))
  if (start < 0) start = 0
  if (end < 0) end = lines.length

  const items = []
  let cur = null
  const flush = () => { if (cur) items.push(cur) }
  for (let i = start; i < end; i++) {
    const l = lines[i]
    // Item starter — bullet at ≤3 spaces of indent, starts with `- **[P`.
    if (/^\s{0,3}- \*\*\[P[123]\]/.test(l)) {
      flush()
      // Extract the title: bold phrase between `**[Pn][tag…]` and the closing
      // `**`. Some bullets use just `[Pn]` (no tag) or list multiple tags
      // (`[want/goal]`), so the tag piece is optional. Falls back to the rest
      // of the first line when bold delimiters are absent.
      const m1 = l.match(/\*\*\[P[123]\](?:\[[\w/]+\])?\s*([^*]+?)\*\*/i)
      const title = m1 ? m1[1] : l.replace(/^\s{0,3}- \*\*\[P[123]\][^\]]*\]\s*/i, '')
      cur = {
        startLine: i,
        firstLine: l,
        title: title.trim(),
        body: l,
        shipped: /✅|~~|SHIPPED|RESOLVED|DONE/i.test(l),
      }
    } else if (cur) {
      cur.body += '\n' + l
      if (!cur.shipped && /✅|~~|SHIPPED|RESOLVED|DONE/i.test(l)) cur.shipped = true
    }
  }
  flush()
  return { items, sectionStart: start, sectionEnd: end }
}

// ── Match a cycle to a backlog item ─────────────────────────────────────────
// Two coverage ratios, OR'd together. Ratios beat absolute counts because slug
// length varies — a 2-token slug with 2 overlaps is a strong match, while a
// 6-token slug with 2 overlaps is weak. Tuned conservatively: false positives
// erase real open work from the burn-down, which is worse than missing a true
// match (the item just stays visible until tomorrow night).
//
//   slugCoverage  = matching tokens in slug ÷ significant slug tokens
//   titleCoverage = significant title tokens appearing in cycle's What ÷ title tokens
//
// Hard floor of 2 matching tokens on either signal so a single shared word
// never produces a match.
const SLUG_COVERAGE_MIN = 0.5
const TITLE_COVERAGE_MIN = 0.5
const HARD_OVERLAP_FLOOR = 2

function score(cycle, item) {
  const titleToks = tokenize(item.title)
  if (titleToks.size < 3) return 0
  const slugToks = tokenize(cycle.slug.replace(/-/g, ' '))
  const whatToks = tokenize(cycle.what.slice(0, 320))
  const slugOverlap = [...slugToks].filter((t) => titleToks.has(t)).length
  const titleInWhat = [...titleToks].filter((t) => whatToks.has(t)).length
  const slugCoverage = slugToks.size ? slugOverlap / slugToks.size : 0
  const titleCoverage = titleToks.size ? titleInWhat / titleToks.size : 0
  let s = 0
  if (slugOverlap >= HARD_OVERLAP_FLOOR && slugCoverage >= SLUG_COVERAGE_MIN) {
    s = Math.max(s, 2 + slugCoverage)
  }
  if (titleInWhat >= HARD_OVERLAP_FLOOR + 1 && titleCoverage >= TITLE_COVERAGE_MIN) {
    s = Math.max(s, 2 + titleCoverage)
  }
  return s
}

// ── Run ─────────────────────────────────────────────────────────────────────
const backlogMd = readFileSync(BACKLOG_PATH, 'utf8')
const changelogMd = readFileSync(CHANGELOG_PATH, 'utf8')
const cycles = parseChangelog(changelogMd)
const { items } = parseBacklog(backlogMd)

const matches = [] // { item, cycle, score }
for (const item of items) {
  if (item.shipped) continue
  let best = null
  for (const cycle of cycles) {
    const s = score(cycle, item)
    if (s > 0 && (!best || s > best.score)) best = { cycle, score: s }
  }
  if (best) matches.push({ item, ...best })
}

log(`Scanned ${items.length} open backlog items vs ${cycles.length} PASSed cycles.`)
log(`Found ${matches.length} reconcilable items.\n`)
for (const m of matches.slice(0, 30)) {
  log(`  ✅  ${m.item.title.slice(0, 80)}`)
  log(`      ← ${m.cycle.slug}  (${m.cycle.date})  score=${m.score.toFixed(2)}`)
}
if (matches.length > 30) log(`  …and ${matches.length - 30} more.`)

if (!APPLY) {
  log('\nDry-run only. Pass --apply to write BACKLOG.md.')
  process.exit(0)
}

// ── Apply: prepend a "✅ SHIPPED via <slug>" line under each matched item. ──
// Editing the first line preserves the entire body (sub-bullets, notes); the
// burn-down counter recognizes ✅/SHIPPED on the first line and skips the item.
const lines = backlogMd.split('\n')
const matchByStart = new Map(matches.map((m) => [m.item.startLine, m]))
const out = []
for (let i = 0; i < lines.length; i++) {
  const m = matchByStart.get(i)
  if (m) {
    // Strikethrough the bold title and append the marker; keep everything else.
    const before = lines[i]
    const marked = before.replace(
      /(- \*\*\[P[123]\]\[[a-z]+\][^*]*\*\*)/i,
      (full) => `~~${full}~~ ✅ SHIPPED via \`${m.cycle.slug}\` (${m.cycle.date})`,
    )
    out.push(marked)
  } else {
    out.push(lines[i])
  }
}
writeFileSync(BACKLOG_PATH, out.join('\n'))
log(`\nApplied ${matches.length} reconciliations to BACKLOG.md.`)
