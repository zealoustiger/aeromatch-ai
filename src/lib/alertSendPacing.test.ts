/**
 * Run: node --experimental-strip-types --test src/lib/alertSendPacing.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldDeferSend, SendPacer, SEND_PACE_MS, CRON_TIME_BUDGET_MS, CRON_TIME_SAFETY_MARGIN_MS } from './alertSendPacing.ts'

test('shouldDeferSend: false well before the deadline', () => {
  assert.equal(shouldDeferSend(1_000, 60_000, 8_000), false)
})

test('shouldDeferSend: false right up to the margin boundary', () => {
  assert.equal(shouldDeferSend(60_000 - 8_000 - 1, 60_000, 8_000), false)
})

test('shouldDeferSend: true exactly at the margin boundary', () => {
  assert.equal(shouldDeferSend(60_000 - 8_000, 60_000, 8_000), true)
})

test('shouldDeferSend: true once elapsed exceeds the budget entirely', () => {
  assert.equal(shouldDeferSend(70_000, 60_000, 8_000), true)
})

test('shouldDeferSend: defaults match the route\'s maxDuration=60 contract', () => {
  assert.equal(shouldDeferSend(0), false)
  assert.equal(shouldDeferSend(CRON_TIME_BUDGET_MS - CRON_TIME_SAFETY_MARGIN_MS), true)
})

test('SendPacer: the first send is never paced', async () => {
  const sleeps: number[] = []
  const pacer = new SendPacer(0, {
    nowMs: () => 0,
    sleep: async (ms) => {
      sleeps.push(ms)
    },
  })
  const result = await pacer.send(async () => 'ok')
  assert.deepEqual(result, { attempted: true, value: 'ok' })
  assert.deepEqual(sleeps, [])
})

test('SendPacer: every send after the first waits paceMs', async () => {
  const sleeps: number[] = []
  let clock = 0
  const pacer = new SendPacer(0, {
    nowMs: () => clock,
    sleep: async (ms) => {
      sleeps.push(ms)
    },
    paceMs: 350,
  })
  await pacer.send(async () => 1)
  await pacer.send(async () => 2)
  await pacer.send(async () => 3)
  assert.deepEqual(sleeps, [350, 350])
})

test('SendPacer: defers without calling attempt once the budget is exhausted', async () => {
  let attempts = 0
  let clock = 55_000 // within the default 8s margin of the 60s budget
  const pacer = new SendPacer(0, { nowMs: () => clock })
  const result = await pacer.send(async () => {
    attempts++
    return 'should not run'
  })
  assert.deepEqual(result, { attempted: false, deferred: true })
  assert.equal(attempts, 0)
  assert.equal(pacer.deferredSends, 1)
})

test('SendPacer: a deferred send does not count toward the pacing sequence', async () => {
  const sleeps: number[] = []
  let clock = 0
  const pacer = new SendPacer(0, {
    nowMs: () => clock,
    sleep: async (ms) => {
      sleeps.push(ms)
    },
  })
  await pacer.send(async () => 'a') // sent, count=1
  clock = 55_000 // now over budget
  const deferred = await pacer.send(async () => 'b')
  assert.equal(deferred.attempted, false)
  clock = 0 // back "in budget" for the test's sake
  await pacer.send(async () => 'c') // still paces normally (sentCount was 1, not reset)
  assert.deepEqual(sleeps, [SEND_PACE_MS])
  assert.equal(pacer.deferredSends, 1)
})

test('SendPacer: deferredSends accumulates across multiple deferred calls', async () => {
  const pacer = new SendPacer(0, { nowMs: () => 100_000 })
  await pacer.send(async () => 1)
  await pacer.send(async () => 2)
  await pacer.send(async () => 3)
  assert.equal(pacer.deferredSends, 3)
})
