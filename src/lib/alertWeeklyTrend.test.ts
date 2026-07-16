/**
 * Run: node --experimental-strip-types --test src/lib/alertWeeklyTrend.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildWeeklyTrend } from './alertWeeklyTrend.ts'

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS
const NOW = Date.UTC(2026, 6, 16) // fixed "now" so the math is deterministic
const weeksAgo = (w: number, offsetDays = 0) => new Date(NOW - w * WEEK_MS - offsetDays * DAY_MS).toISOString()

test('buildWeeklyTrend: no rows → 8 empty weeks, oldest first', () => {
  const trend = buildWeeklyTrend([], NOW)
  assert.equal(trend.length, 8)
  for (const week of trend) {
    assert.equal(week.subscribedCount, 0)
    assert.equal(week.confirmedCount, 0)
  }
})

test('buildWeeklyTrend: a row created this week lands in the last bucket', () => {
  const trend = buildWeeklyTrend([{ created_at: weeksAgo(0, 1), confirmed_at: null }], NOW)
  assert.equal(trend[7].subscribedCount, 1)
  assert.equal(trend.slice(0, 7).every((w) => w.subscribedCount === 0), true)
})

test('buildWeeklyTrend: a row created 7 weeks ago lands in the first (oldest) bucket', () => {
  const trend = buildWeeklyTrend([{ created_at: weeksAgo(7, 1), confirmed_at: null }], NOW)
  assert.equal(trend[0].subscribedCount, 1)
  assert.equal(trend.slice(1).every((w) => w.subscribedCount === 0), true)
})

test('buildWeeklyTrend: a row older than 8 weeks is excluded entirely', () => {
  const trend = buildWeeklyTrend([{ created_at: weeksAgo(8, 1), confirmed_at: null }], NOW)
  assert.equal(
    trend.every((w) => w.subscribedCount === 0),
    true,
  )
})

test('buildWeeklyTrend: subscribed and confirmed are bucketed independently by their own timestamp', () => {
  const trend = buildWeeklyTrend(
    [{ created_at: weeksAgo(3, 1), confirmed_at: weeksAgo(1, 1) }],
    NOW,
  )
  assert.equal(trend[4].subscribedCount, 1) // 3 weeks ago
  assert.equal(trend[6].confirmedCount, 1) // 1 week ago
  assert.equal(trend[4].confirmedCount, 0)
  assert.equal(trend[6].subscribedCount, 0)
})

test('buildWeeklyTrend: null/invalid dates are ignored, not crashed on', () => {
  const trend = buildWeeklyTrend(
    [
      { created_at: null, confirmed_at: null },
      { created_at: 'not-a-date', confirmed_at: undefined as unknown as string | null },
    ],
    NOW,
  )
  assert.equal(
    trend.every((w) => w.subscribedCount === 0 && w.confirmedCount === 0),
    true,
  )
})

test('buildWeeklyTrend: multiple rows in the same week accumulate', () => {
  const trend = buildWeeklyTrend(
    [
      { created_at: weeksAgo(2, 1), confirmed_at: null },
      { created_at: weeksAgo(2, 3), confirmed_at: null },
      { created_at: weeksAgo(2, 5), confirmed_at: null },
    ],
    NOW,
  )
  assert.equal(trend[5].subscribedCount, 3)
})

test('buildWeeklyTrend: weekLabel is a short human date, oldest-to-newest order', () => {
  const trend = buildWeeklyTrend([], NOW)
  assert.equal(trend.length, 8)
  // Each label should parse as a valid short date string, e.g. "May 21"
  for (const week of trend) {
    assert.match(week.weekLabel, /^[A-Z][a-z]{2} \d{1,2}$/)
  }
})
