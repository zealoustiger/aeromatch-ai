/**
 * Run: node --experimental-strip-types --test src/lib/alertFrequency.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  describeLastDigest,
  intervalDaysFor,
  isDigestDue,
  normalizeDigestDay,
  normalizeFrequency,
  shouldOfferDailyUpgrade,
} from './alertFrequency.ts'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 6, 11) // fixed "now" so the math is deterministic
const nowIso = new Date(NOW).toISOString()
const daysAgo = (d: number) => new Date(NOW - d * DAY_MS).toISOString()

test('normalizeFrequency: "daily" stays daily, anything else falls back to weekly', () => {
  assert.equal(normalizeFrequency('daily'), 'daily')
  assert.equal(normalizeFrequency('weekly'), 'weekly')
  assert.equal(normalizeFrequency(null), 'weekly')
  assert.equal(normalizeFrequency(undefined), 'weekly')
  assert.equal(normalizeFrequency('bogus'), 'weekly')
})

test('intervalDaysFor: daily=1, weekly=7', () => {
  assert.equal(intervalDaysFor('daily'), 1)
  assert.equal(intervalDaysFor('weekly'), 7)
})

test('never sent before (null last_digest_at) → always due, regardless of frequency', () => {
  assert.equal(isDigestDue(null, 'daily', nowIso), true)
  assert.equal(isDigestDue(null, 'weekly', nowIso), true)
})

test('daily alert sent 2 days ago → due', () => {
  assert.equal(isDigestDue(daysAgo(2), 'daily', nowIso), true)
})

test('daily alert sent 12 hours ago → not due', () => {
  const twelveHoursAgo = new Date(NOW - 12 * 60 * 60 * 1000).toISOString()
  assert.equal(isDigestDue(twelveHoursAgo, 'daily', nowIso), false)
})

test('weekly alert sent 2 days ago → not due yet', () => {
  assert.equal(isDigestDue(daysAgo(2), 'weekly', nowIso), false)
})

test('weekly alert sent 8 days ago → due', () => {
  assert.equal(isDigestDue(daysAgo(8), 'weekly', nowIso), true)
})

test('exactly at the interval boundary counts as due', () => {
  assert.equal(isDigestDue(daysAgo(7), 'weekly', nowIso), true)
  assert.equal(isDigestDue(daysAgo(1), 'daily', nowIso), true)
})

test('normalizeDigestDay: valid 0-6 integers pass through, everything else → null', () => {
  assert.equal(normalizeDigestDay(0), 0)
  assert.equal(normalizeDigestDay(6), 6)
  assert.equal(normalizeDigestDay(3), 3)
  assert.equal(normalizeDigestDay(-1), null)
  assert.equal(normalizeDigestDay(7), null)
  assert.equal(normalizeDigestDay(1.5), null)
  assert.equal(normalizeDigestDay(null), null)
  assert.equal(normalizeDigestDay(undefined), null)
})

test('isDigestDue: weekly with no digestDay preference → same plain elapsed-days behavior', () => {
  assert.equal(isDigestDue(daysAgo(8), 'weekly', nowIso, null), true)
  assert.equal(isDigestDue(daysAgo(8), 'weekly', nowIso, undefined), true)
  assert.equal(isDigestDue(daysAgo(2), 'weekly', nowIso, null), false)
})

test('isDigestDue: weekly with digestDay set — due only on the matching UTC weekday', () => {
  // NOW (2026-07-11T00:00:00Z) is a Saturday, getUTCDay() === 6.
  assert.equal(new Date(nowIso).getUTCDay(), 6)
  // Day matches, plenty of elapsed time → due.
  assert.equal(isDigestDue(daysAgo(8), 'weekly', nowIso, 6), true)
  // Elapsed time is fine but the chosen day (Monday) doesn't match today (Saturday) → not due.
  assert.equal(isDigestDue(daysAgo(8), 'weekly', nowIso, 1), false)
})

test('isDigestDue: weekly with digestDay set — 6-day-elapsed floor prevents a same-week re-send', () => {
  // daysAgo(2) lands on a Thursday (getUTCDay() === 4), so pick a day that
  // matches NOW's Saturday but hasn't actually been 6 days since the last send.
  const recentSaturday = daysAgo(0) // "now" itself is a Saturday
  assert.equal(isDigestDue(recentSaturday, 'weekly', nowIso, 6), false)
})

test('isDigestDue: weekly with digestDay — exactly 6 days elapsed AND day matches → due', () => {
  // The day check is against TODAY's (nowIso's) UTC weekday, which is 6
  // (Saturday) — the last-send date's own weekday is irrelevant.
  assert.equal(isDigestDue(daysAgo(6), 'weekly', nowIso, 6), true)
})

test('isDigestDue: digestDay is ignored for daily-cadence alerts', () => {
  assert.equal(isDigestDue(daysAgo(1), 'daily', nowIso, 1), true) // digestDay=Monday, NOW=Saturday, still due
  assert.equal(isDigestDue(daysAgo(0), 'daily', nowIso, 6), false)
})

test('isDigestDue: never sent before → always due even with a digestDay set', () => {
  assert.equal(isDigestDue(null, 'weekly', nowIso, 1), true)
})

test('describeLastDigest: never sent → honest "nothing sent yet" for either cadence', () => {
  assert.equal(describeLastDigest(null, 'weekly'), 'Nothing sent yet — checks weekly')
  assert.equal(describeLastDigest(null, 'daily'), 'Nothing sent yet — checks daily')
})

test('describeLastDigest: sent → short date + cadence', () => {
  assert.equal(describeLastDigest(daysAgo(2), 'daily'), 'Last email Jul 9 · checks daily')
  assert.equal(describeLastDigest(daysAgo(8), 'weekly'), 'Last email Jul 3 · checks weekly')
})

test('describeLastDigest: malformed date string falls back to "nothing sent yet"', () => {
  assert.equal(describeLastDigest('not-a-date', 'weekly'), 'Nothing sent yet — checks weekly')
})

test('describeLastDigest: digestDay set on a weekly alert names the day instead of the bare cadence', () => {
  assert.equal(describeLastDigest(daysAgo(8), 'weekly', 6), 'Last email Jul 3 · checks weekly, Saturdays')
  assert.equal(describeLastDigest(null, 'weekly', 0), 'Nothing sent yet — checks weekly, Sundays')
})

test('describeLastDigest: digestDay is ignored for daily alerts and invalid values', () => {
  assert.equal(describeLastDigest(daysAgo(2), 'daily', 6), 'Last email Jul 9 · checks daily')
  assert.equal(describeLastDigest(daysAgo(8), 'weekly', 9), 'Last email Jul 3 · checks weekly')
})

test('shouldOfferDailyUpgrade: weekly alert at/above the threshold → true', () => {
  assert.equal(shouldOfferDailyUpgrade('weekly', 5), true)
  assert.equal(shouldOfferDailyUpgrade('weekly', 9), true)
})

test('shouldOfferDailyUpgrade: weekly alert below the threshold → false', () => {
  assert.equal(shouldOfferDailyUpgrade('weekly', 4), false)
  assert.equal(shouldOfferDailyUpgrade('weekly', 0), false)
})

test('shouldOfferDailyUpgrade: daily alert never offered (no faster cadence to switch to)', () => {
  assert.equal(shouldOfferDailyUpgrade('daily', 10), false)
  assert.equal(shouldOfferDailyUpgrade('daily', 0), false)
})
