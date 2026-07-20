/**
 * Run: node --experimental-strip-types --test src/lib/alertCaptureSelfCheckHistory.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarizeSelfCheckHistory, shouldSendCaptureSelfCheckAlert } from './alertCaptureSelfCheckHistory.ts'

function run(ok: boolean | null, step: string | null = null) {
  return { captureSelfCheckOk: ok, captureSelfCheckStep: step }
}

test('summarizeSelfCheckHistory: unmigrated (all-null) runs report migrated=false, never a fabricated pass', () => {
  const result = summarizeSelfCheckHistory([run(null), run(null), run(null)])
  assert.equal(result.migrated, false)
  assert.equal(result.lastOk, null)
  assert.equal(result.lastStep, null)
  assert.equal(result.failuresConsidered, 0)
})

test('summarizeSelfCheckHistory: all-pass history reports migrated=true, zero failures', () => {
  const result = summarizeSelfCheckHistory([run(true), run(true), run(true)])
  assert.equal(result.migrated, true)
  assert.equal(result.lastOk, true)
  assert.equal(result.failuresConsidered, 0)
  assert.equal(result.runsConsidered, 3)
})

test('summarizeSelfCheckHistory: counts only real failures, and reports the most recent run\'s own step', () => {
  const result = summarizeSelfCheckHistory([run(false, 'confirm'), run(true), run(false, 'subscribe'), run(true)])
  assert.equal(result.migrated, true)
  assert.equal(result.lastOk, false)
  assert.equal(result.lastStep, 'confirm')
  assert.equal(result.failuresConsidered, 2)
})

test('summarizeSelfCheckHistory: caps at the limit (default 7), ignoring older runs', () => {
  const runs = [
    run(false, 'cleanup'), // most recent
    ...Array.from({ length: 6 }, () => run(true)),
    run(false, 'subscribe'), // 8th — outside the default window
  ]
  const result = summarizeSelfCheckHistory(runs)
  assert.equal(result.runsConsidered, 7)
  assert.equal(result.failuresConsidered, 1)
})

test('summarizeSelfCheckHistory: a run with data mixed with not-yet-migrated older runs still reports migrated=true', () => {
  const result = summarizeSelfCheckHistory([run(true), run(null), run(null)])
  assert.equal(result.migrated, true)
  assert.equal(result.failuresConsidered, 0)
  assert.equal(result.runsConsidered, 3)
})

test('summarizeSelfCheckHistory: empty history is a safe, honest not-migrated/zero state', () => {
  const result = summarizeSelfCheckHistory([])
  assert.equal(result.migrated, false)
  assert.equal(result.lastOk, null)
  assert.equal(result.runsConsidered, 0)
})

test('shouldSendCaptureSelfCheckAlert: a pass never sends, regardless of history', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([run(false), run(false)], true), false)
  assert.equal(shouldSendCaptureSelfCheckAlert([], true), false)
})

test('shouldSendCaptureSelfCheckAlert: fresh failure with no history sends (day 1)', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([], false), true)
})

test('shouldSendCaptureSelfCheckAlert: transition from a passing run sends', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([run(true), run(true)], false), true)
})

test('shouldSendCaptureSelfCheckAlert: transition from an unmigrated (null) run sends', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([run(null), run(null)], false), true)
})

test('shouldSendCaptureSelfCheckAlert: 2nd consecutive red day stays quiet', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([run(false, 'confirm')], false), false)
})

test('shouldSendCaptureSelfCheckAlert: 3rd consecutive red day re-sends', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([run(false), run(false)], false), true)
})

test('shouldSendCaptureSelfCheckAlert: 4th and 5th consecutive red days stay quiet, 6th re-sends', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([run(false), run(false), run(false)], false), false)
  assert.equal(shouldSendCaptureSelfCheckAlert([run(false), run(false), run(false), run(false)], false), false)
  assert.equal(
    shouldSendCaptureSelfCheckAlert([run(false), run(false), run(false), run(false), run(false)], false),
    true
  )
})

test('shouldSendCaptureSelfCheckAlert: a recovery breaks the streak — the next failure re-sends as fresh', () => {
  assert.equal(shouldSendCaptureSelfCheckAlert([run(true), run(false), run(false)], false), true)
})
