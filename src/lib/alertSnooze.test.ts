/**
 * Run: node --experimental-strip-types --test src/lib/alertSnooze.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveSnoozeUntil, isSnoozeExpired, formatResumeDate } from './alertSnooze.ts'

const NOW = Date.UTC(2026, 6, 13) // 2026-07-13, fixed "now" so the math is deterministic
const nowIso = new Date(NOW).toISOString()

test('resolveSnoozeUntil: exactly 30 days out from nowIso', () => {
  const until = resolveSnoozeUntil(nowIso)
  const diffDays = (new Date(until).getTime() - NOW) / 86_400_000
  assert.equal(diffDays, 30)
})

test('isSnoozeExpired: null paused_until is never expired (indefinite pause)', () => {
  assert.equal(isSnoozeExpired(null, nowIso), false)
})

test('isSnoozeExpired: a future paused_until is not expired', () => {
  const future = new Date(NOW + 10 * 86_400_000).toISOString()
  assert.equal(isSnoozeExpired(future, nowIso), false)
})

test('isSnoozeExpired: a past paused_until is expired', () => {
  const past = new Date(NOW - 1 * 86_400_000).toISOString()
  assert.equal(isSnoozeExpired(past, nowIso), true)
})

test('isSnoozeExpired: exactly at the boundary counts as expired', () => {
  assert.equal(isSnoozeExpired(nowIso, nowIso), true)
})

test('isSnoozeExpired: unparseable value is never expired', () => {
  assert.equal(isSnoozeExpired('not-a-date', nowIso), false)
})

test('formatResumeDate: renders a real, human-readable date', () => {
  const until = resolveSnoozeUntil(nowIso) // 2026-08-12
  assert.equal(formatResumeDate(until), 'Aug 12, 2026')
})

test('formatResumeDate: null/unparseable both fall back to null', () => {
  assert.equal(formatResumeDate(null), null)
  assert.equal(formatResumeDate('garbage'), null)
})
