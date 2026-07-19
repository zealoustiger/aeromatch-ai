/**
 * Run: node --experimental-strip-types --test src/lib/alertUnsubscribeReasons.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  summarizeUnsubscribeReasons,
  UNSUBSCRIBE_REASONS,
  UNSUBSCRIBE_REASON_KEYS,
} from './alertUnsubscribeReasons.ts'

const NOW = Date.UTC(2026, 6, 19, 8, 0, 0) // 2026-07-19T08:00:00Z, fixed "now"
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString()

test('empty input returns an empty list', () => {
  assert.deepEqual(summarizeUnsubscribeReasons([], NOW), [])
})

test('null reasons are skipped, not counted as a bucket', () => {
  const rows = [
    { reason: null, unsubscribedAt: daysAgo(1) },
    { reason: null, unsubscribedAt: null },
  ]
  assert.deepEqual(summarizeUnsubscribeReasons(rows, NOW), [])
})

test('groups by reason with the canonical label, counting this-week and all-time separately', () => {
  const rows = [
    { reason: 'not_relevant', unsubscribedAt: daysAgo(1) },
    { reason: 'not_relevant', unsubscribedAt: daysAgo(3) },
    { reason: 'not_relevant', unsubscribedAt: daysAgo(20) }, // outside the 7-day window
    { reason: 'too_many_emails', unsubscribedAt: daysAgo(2) },
  ]
  const result = summarizeUnsubscribeReasons(rows, NOW)
  assert.deepEqual(result, [
    { reason: 'not_relevant', label: 'Not relevant', countThisWeek: 2, countAllTime: 3 },
    { reason: 'too_many_emails', label: 'Too many emails', countThisWeek: 1, countAllTime: 1 },
  ])
})

test('a row with no unsubscribedAt (timestamp column unmigrated) counts toward all-time but never this-week', () => {
  const rows = [
    { reason: 'just_done', unsubscribedAt: null },
    { reason: 'just_done', unsubscribedAt: null },
  ]
  const result = summarizeUnsubscribeReasons(rows, NOW)
  assert.deepEqual(result, [{ reason: 'just_done', label: 'Just done', countThisWeek: 0, countAllTime: 2 }])
})

test('an unrecognized reason string still shows up, falling back to the raw key as its label', () => {
  const rows = [{ reason: 'some_future_reason', unsubscribedAt: daysAgo(1) }]
  const result = summarizeUnsubscribeReasons(rows, NOW)
  assert.deepEqual(result, [{ reason: 'some_future_reason', label: 'some_future_reason', countThisWeek: 1, countAllTime: 1 }])
})

test('sorted by all-time count, descending', () => {
  const rows = [
    { reason: 'just_done', unsubscribedAt: daysAgo(1) },
    { reason: 'not_relevant', unsubscribedAt: daysAgo(1) },
    { reason: 'not_relevant', unsubscribedAt: daysAgo(2) },
    { reason: 'not_relevant', unsubscribedAt: daysAgo(3) },
  ]
  const result = summarizeUnsubscribeReasons(rows, NOW)
  assert.deepEqual(
    result.map((r) => r.reason),
    ['not_relevant', 'just_done']
  )
})

test('the canonical reason list and key set stay in sync', () => {
  for (const { key } of UNSUBSCRIBE_REASONS) {
    assert.ok(UNSUBSCRIBE_REASON_KEYS.has(key))
  }
  assert.equal(UNSUBSCRIBE_REASON_KEYS.size, UNSUBSCRIBE_REASONS.length)
})
