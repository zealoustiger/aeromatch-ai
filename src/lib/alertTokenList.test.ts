/**
 * Run: node --experimental-strip-types --test src/lib/alertTokenList.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAlertTokens } from './alertTokenList.ts'

test('parseAlertTokens: single token', () => {
  assert.deepEqual(parseAlertTokens('abc123'), ['abc123'])
})

test('parseAlertTokens: comma-separated combined-digest list', () => {
  assert.deepEqual(parseAlertTokens('a,b,c'), ['a', 'b', 'c'])
})

test('parseAlertTokens: trims whitespace around each token', () => {
  assert.deepEqual(parseAlertTokens(' a , b ,c '), ['a', 'b', 'c'])
})

test('parseAlertTokens: dedupes repeated tokens', () => {
  assert.deepEqual(parseAlertTokens('a,b,a'), ['a', 'b'])
})

test('parseAlertTokens: drops empty segments from stray/double commas', () => {
  assert.deepEqual(parseAlertTokens('a,,b,'), ['a', 'b'])
})

test('parseAlertTokens: null/undefined/empty → empty array', () => {
  assert.deepEqual(parseAlertTokens(null), [])
  assert.deepEqual(parseAlertTokens(undefined), [])
  assert.deepEqual(parseAlertTokens(''), [])
  assert.deepEqual(parseAlertTokens('   '), [])
})
