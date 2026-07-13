import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reminderWindow } from './alertConfirmReminder.ts'

test('reminderWindow: start is 72h before now, end is 24h before now', () => {
  const now = '2026-07-13T12:00:00.000Z'
  const { start, end } = reminderWindow(now)
  assert.equal(start, '2026-07-10T12:00:00.000Z')
  assert.equal(end, '2026-07-12T12:00:00.000Z')
})

test('reminderWindow: start is always earlier than end', () => {
  const { start, end } = reminderWindow('2026-01-01T00:00:00.000Z')
  assert.ok(new Date(start).getTime() < new Date(end).getTime())
})

test('reminderWindow: a signup created exactly 48h ago falls inside the window', () => {
  const now = '2026-07-13T12:00:00.000Z'
  const createdAt = '2026-07-11T12:00:00.000Z' // 48h before now
  const { start, end } = reminderWindow(now)
  const createdMs = new Date(createdAt).getTime()
  assert.ok(createdMs >= new Date(start).getTime())
  assert.ok(createdMs <= new Date(end).getTime())
})

test('reminderWindow: a signup created 1h ago falls outside the window (too young)', () => {
  const now = '2026-07-13T12:00:00.000Z'
  const createdAt = '2026-07-13T11:00:00.000Z' // 1h before now
  const { end } = reminderWindow(now)
  assert.ok(new Date(createdAt).getTime() > new Date(end).getTime())
})

test('reminderWindow: a signup created 100h ago falls outside the window (too old)', () => {
  const now = '2026-07-13T12:00:00.000Z'
  const createdAt = '2026-07-09T08:00:00.000Z' // 100h before now
  const { start } = reminderWindow(now)
  assert.ok(new Date(createdAt).getTime() < new Date(start).getTime())
})
