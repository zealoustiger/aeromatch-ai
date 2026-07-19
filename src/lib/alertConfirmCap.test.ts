/**
 * Run: node --experimental-strip-types --test src/lib/alertConfirmCap.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isOverConfirmSendCap, CONFIRM_CAP_WINDOW_MS, CONFIRM_CAP_MAX_SENDS } from './alertConfirmCap.ts'

const NOW = Date.UTC(2026, 6, 19, 8, 0, 0) // 2026-07-19T08:00:00Z, fixed "now"
const nowIso = new Date(NOW).toISOString()
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString()

test('empty history is never over cap', () => {
  assert.equal(isOverConfirmSendCap([], nowIso), false)
})

test('under the default cap (2 recent sends, max 3) is not over cap', () => {
  assert.equal(isOverConfirmSendCap([minutesAgo(5), minutesAgo(10)], nowIso), false)
})

test('exactly at the default cap (3 recent sends) is over cap', () => {
  assert.equal(isOverConfirmSendCap([minutesAgo(5), minutesAgo(10), minutesAgo(15)], nowIso), true)
})

test('well over the default cap is over cap', () => {
  assert.equal(isOverConfirmSendCap([minutesAgo(1), minutesAgo(2), minutesAgo(3), minutesAgo(4)], nowIso), true)
})

test('timestamps outside the window do not count toward the cap', () => {
  const outsideWindow = new Date(NOW - CONFIRM_CAP_WINDOW_MS - 60_000).toISOString()
  assert.equal(isOverConfirmSendCap([outsideWindow, outsideWindow, outsideWindow], nowIso), false)
})

test('boundary: a timestamp exactly at the window edge does not count (strict less-than)', () => {
  const atEdge = new Date(NOW - CONFIRM_CAP_WINDOW_MS).toISOString()
  assert.equal(isOverConfirmSendCap([atEdge, atEdge, atEdge], nowIso), false)
})

test('a mix of in-window and out-of-window only counts the in-window ones', () => {
  const outsideWindow = new Date(NOW - CONFIRM_CAP_WINDOW_MS - 60_000).toISOString()
  assert.equal(isOverConfirmSendCap([minutesAgo(5), minutesAgo(10), outsideWindow, outsideWindow], nowIso), false)
})

test('a future timestamp (clock skew) does not count toward the cap', () => {
  const future = new Date(NOW + 60_000).toISOString()
  assert.equal(isOverConfirmSendCap([future, future, future], nowIso), false)
})

test('null/undefined/unparseable entries are ignored, never counted', () => {
  assert.equal(isOverConfirmSendCap([null, undefined, 'not-a-date', minutesAgo(5)], nowIso), false)
})

test('custom maxSends/windowMs override the defaults', () => {
  // a stricter cap (1) trips on a single recent send that wouldn't trip the default (3)
  assert.equal(isOverConfirmSendCap([minutesAgo(1)], nowIso, 1, CONFIRM_CAP_WINDOW_MS), true)
  // a wider window (2h) picks up sends the default 1h window would exclude
  const ninetyMinAgo = minutesAgo(90)
  assert.equal(isOverConfirmSendCap([ninetyMinAgo, ninetyMinAgo, ninetyMinAgo], nowIso, CONFIRM_CAP_MAX_SENDS), false)
  assert.equal(
    isOverConfirmSendCap([ninetyMinAgo, ninetyMinAgo, ninetyMinAgo], nowIso, CONFIRM_CAP_MAX_SENDS, 2 * 60 * 60 * 1000),
    true
  )
})

test('unparseable nowIso never reports over cap', () => {
  assert.equal(isOverConfirmSendCap([minutesAgo(1), minutesAgo(2), minutesAgo(3)], 'garbage'), false)
})
