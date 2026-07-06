/**
 * Worked-example tests for the seeker Model filter's free-text token parsing/matching.
 * Run: node --experimental-strip-types --test src/lib/seekerModelFilter.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePreferredModelTokens, matchesModelFilter } from './seekerModelFilter.ts'

test('parsePreferredModelTokens splits, trims, dedupes comma-separated free text', () => {
  assert.deepEqual(parsePreferredModelTokens('172, 182, PA-28'), ['172', '182', 'PA-28'])
  assert.deepEqual(parsePreferredModelTokens('172,172,  182 '), ['172', '182'])
  assert.deepEqual(parsePreferredModelTokens(''), [])
  assert.deepEqual(parsePreferredModelTokens(null), [])
  assert.deepEqual(parsePreferredModelTokens(undefined), [])
})

test('matchesModelFilter: no selection means everyone matches', () => {
  assert.equal(matchesModelFilter('172, 182', []), true)
  assert.equal(matchesModelFilter(null, []), true)
})

test('matchesModelFilter: case-insensitive exact-token match', () => {
  assert.equal(matchesModelFilter('172, 182', ['172']), true)
  assert.equal(matchesModelFilter('SR20, SR22', ['sr22']), true)
  assert.equal(matchesModelFilter(null, ['172']), false)
})

test('matchesModelFilter: never substring-matches a different model', () => {
  // "172" must not match a seeker who only wants "172RG"
  assert.equal(matchesModelFilter('172RG', ['172']), false)
  assert.equal(matchesModelFilter('172RG', ['172RG']), true)
})

test('matchesModelFilter: OR semantics across several selected models', () => {
  assert.equal(matchesModelFilter('PA-28', ['172', 'PA-28']), true)
  assert.equal(matchesModelFilter('PA-32', ['172', 'PA-28']), false)
})
