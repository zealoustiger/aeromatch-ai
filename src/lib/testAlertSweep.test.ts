/**
 * Run: node --experimental-strip-types --test src/lib/testAlertSweep.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSweepableTestAlertEmail, sweepCutoffIso } from './testAlertSweep.ts'

test('isSweepableTestAlertEmail matches plain @example.com addresses', () => {
  assert.equal(isSweepableTestAlertEmail('foo@example.com'), true)
  assert.equal(isSweepableTestAlertEmail('qa-slug-123@example.com'), true)
})

test('isSweepableTestAlertEmail is case-insensitive', () => {
  assert.equal(isSweepableTestAlertEmail('FOO@EXAMPLE.COM'), true)
  assert.equal(isSweepableTestAlertEmail('Foo@Example.Com'), true)
})

test('isSweepableTestAlertEmail trims surrounding whitespace', () => {
  assert.equal(isSweepableTestAlertEmail('  foo@example.com  '), true)
})

test('isSweepableTestAlertEmail rejects lookalike domains', () => {
  assert.equal(isSweepableTestAlertEmail('foo@notexample.com'), false)
  assert.equal(isSweepableTestAlertEmail('foo@example.com.evil.com'), false)
  assert.equal(isSweepableTestAlertEmail('foo@example.org'), false)
  assert.equal(isSweepableTestAlertEmail('foo@sub.example.com'), false)
})

test('isSweepableTestAlertEmail rejects malformed input', () => {
  assert.equal(isSweepableTestAlertEmail('example.com'), false)
  assert.equal(isSweepableTestAlertEmail(''), false)
})

test('sweepCutoffIso computes a timestamp N hours before now', () => {
  const now = Date.parse('2026-07-20T12:00:00.000Z')
  assert.equal(sweepCutoffIso(now, 24), '2026-07-19T12:00:00.000Z')
  assert.equal(sweepCutoffIso(now, 1), '2026-07-20T11:00:00.000Z')
})
