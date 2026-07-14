/**
 * Unit tests for the pure partnership-model matching helpers shared by
 * `alertMatchCounts.ts` (`/alerts/manage` live match counts) and the
 * alert-digest cron — mirrors the exact-match OR semantics
 * `partnershipsQuery.ts`'s real-Supabase branch uses for `/partnerships`'s
 * own `model` filter, so an alert never over- or under-matches relative to
 * what the browse page itself would show.
 * Run: node --experimental-strip-types --test src/lib/partnershipModelFilter.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePartnershipModelList, applyPartnershipModelFilter } from './partnershipModelFilter.ts'

test('parsePartnershipModelList: undefined/empty → []', () => {
  assert.deepEqual(parsePartnershipModelList(undefined), [])
  assert.deepEqual(parsePartnershipModelList(''), [])
})

test('parsePartnershipModelList: single value', () => {
  assert.deepEqual(parsePartnershipModelList('172'), ['172'])
})

test('parsePartnershipModelList: comma-joined multi-select, trims whitespace', () => {
  assert.deepEqual(parsePartnershipModelList('172, 182 ,  206'), ['172', '182', '206'])
})

test('parsePartnershipModelList: drops empty tokens (trailing/double commas)', () => {
  assert.deepEqual(parsePartnershipModelList('172,,182,'), ['172', '182'])
})

// Fake Supabase query-builder: records which filter method was called with
// which args instead of hitting a real database.
function fakeQuery() {
  const calls: { method: string; args: unknown[] }[] = []
  const q: any = {
    eq: (...args: unknown[]) => {
      calls.push({ method: 'eq', args })
      return q
    },
    in: (...args: unknown[]) => {
      calls.push({ method: 'in', args })
      return q
    },
  }
  return { q, calls }
}

test('applyPartnershipModelFilter: no model → query untouched', () => {
  const { q, calls } = fakeQuery()
  const result = applyPartnershipModelFilter(q, undefined)
  assert.equal(result, q)
  assert.deepEqual(calls, [])
})

test('applyPartnershipModelFilter: one model → single .eq (matches browse page)', () => {
  const { q, calls } = fakeQuery()
  applyPartnershipModelFilter(q, '172')
  assert.deepEqual(calls, [{ method: 'eq', args: ['model', '172'] }])
})

test('applyPartnershipModelFilter: multiple models → .in with the full list (OR match)', () => {
  const { q, calls } = fakeQuery()
  applyPartnershipModelFilter(q, '172, 182')
  assert.deepEqual(calls, [{ method: 'in', args: ['model', ['172', '182']] }])
})
