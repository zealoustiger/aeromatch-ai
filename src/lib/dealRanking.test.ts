/**
 * Run: node --experimental-strip-types --test src/lib/dealRanking.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rankSamplesByDealQuality } from './dealRanking.ts'
import type { CompResult } from './aircraftComps.ts'

function below(pct: number): CompResult {
  return { kind: 'below', pct, count: 5, median: 100_000 }
}
function near(): CompResult {
  return { kind: 'near', pct: 0, count: 5, median: 100_000 }
}
function above(pct: number): CompResult {
  return { kind: 'above', pct, count: 5, median: 100_000 }
}

test('below-market rows sort ahead of near/above/no-comp rows, biggest discount first', () => {
  const rows = ['newest-at-market', 'second-25pct-below', 'third-10pct-below']
  const comps = new Map<string, CompResult | null>([
    ['newest-at-market', near()],
    ['second-25pct-below', below(25)],
    ['third-10pct-below', below(10)],
  ])
  const ranked = rankSamplesByDealQuality(rows, (r) => comps.get(r) ?? null)
  assert.deepEqual(ranked, ['second-25pct-below', 'third-10pct-below', 'newest-at-market'])
})

test('ties on pct keep original (newest-first) relative order', () => {
  const rows = ['newest-20pct-below', 'older-20pct-below']
  const ranked = rankSamplesByDealQuality(rows, () => below(20))
  assert.deepEqual(ranked, ['newest-20pct-below', 'older-20pct-below'])
})

test('rows with no comp data keep their original relative order, appended after below-market rows', () => {
  const rows = ['sparse-family', 'below-market']
  const comps = new Map<string, CompResult | null>([
    ['sparse-family', null],
    ['below-market', below(15)],
  ])
  const ranked = rankSamplesByDealQuality(rows, (r) => comps.get(r) ?? null)
  assert.deepEqual(ranked, ['below-market', 'sparse-family'])
})

test('above-market rows never rank ahead of below-market rows, and keep relative order among themselves', () => {
  const rows = ['newest-above', 'older-above', 'below-market']
  const comps = new Map<string, CompResult | null>([
    ['newest-above', above(30)],
    ['older-above', above(5)],
    ['below-market', below(1)],
  ])
  const ranked = rankSamplesByDealQuality(rows, (r) => comps.get(r) ?? null)
  assert.deepEqual(ranked, ['below-market', 'newest-above', 'older-above'])
})

test('no reordering needed when every row is already below-market and in discount order', () => {
  const rows = ['a', 'b']
  const comps = new Map<string, CompResult | null>([
    ['a', below(30)],
    ['b', below(10)],
  ])
  const ranked = rankSamplesByDealQuality(rows, (r) => comps.get(r) ?? null)
  assert.deepEqual(ranked, ['a', 'b'])
})

test('empty input returns empty output', () => {
  assert.deepEqual(rankSamplesByDealQuality<string>([], () => null), [])
})
