#!/usr/bin/env node
// Keep nightshift/CHANGELOG.md small. It grows ~30-50 entries/night and every
// orchestrator orient reads it, so an unbounded file is a per-night token tax.
// This moves entries older than the keep-window into CHANGELOG-archive.md
// (newest-first preserved in both). The live file keeps the recent tail — all
// the orchestrator's `head -N` reads and the morning digest (which only needs
// entries since the last promote) ever touch.
//
//   node nightshift/bin/rotate-changelog.mjs                 # keep last 7 days
//   node nightshift/bin/rotate-changelog.mjs --keep-days 3
//   node nightshift/bin/rotate-changelog.mjs --since 2026-06-20

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const LIVE = join(root, 'nightshift/CHANGELOG.md')
const ARCHIVE = join(root, 'nightshift/CHANGELOG-archive.md')

const args = process.argv.slice(2)
const arg = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : null }
const keepDays = arg('keep-days') ? parseInt(arg('keep-days'), 10) : 7
const since = arg('since') || new Date(Date.now() - keepDays * 864e5).toISOString().slice(0, 10)

const md = readFileSync(LIVE, 'utf8')
// Header = everything before the first "## <date>" entry. Entries split on "## ".
const firstEntry = md.search(/\n## \d{4}-/)
const header = firstEntry < 0 ? md : md.slice(0, firstEntry).replace(/\s+$/, '') + '\n'
const body = firstEntry < 0 ? '' : md.slice(firstEntry + 1)
const entries = body ? body.split(/\n(?=## )/) : []

const dateOf = (e) => (e.match(/^## (\d{4}-\d{2}-\d{2})/) || [])[1] || '0000-00-00'
const keep = entries.filter((e) => dateOf(e) >= since)
const archive = entries.filter((e) => dateOf(e) < since)

if (archive.length === 0) {
  console.log(`Nothing to archive (all ${entries.length} entries are on/after ${since}).`)
  process.exit(0)
}

writeFileSync(LIVE, header + '\n' + keep.join('\n') + '\n')

const archiveHeader = '# Night Shift Changelog — archive\n\nNewest first. Rotated out of CHANGELOG.md to keep the live file small.\n'
const prevArchive = existsSync(ARCHIVE)
  ? readFileSync(ARCHIVE, 'utf8').replace(/^# Night Shift Changelog — archive[\s\S]*?\n\n/, '')
  : ''
writeFileSync(ARCHIVE, archiveHeader + '\n' + archive.join('\n') + (prevArchive ? '\n' + prevArchive : '') + '\n')

console.log(`Kept ${keep.length} entries (>= ${since}) live; archived ${archive.length} older entries → CHANGELOG-archive.md`)
