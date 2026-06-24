/**
 * Worked-example tests for the Model-filter variant grouping.
 * Run: node --experimental-strip-types --test src/lib/modelGroups.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { modelGroupKey, groupModelVariants } from './modelGroups.ts'

test('key: digit-first token is the base', () => {
  assert.equal(modelGroupKey('SR20'), 'SR20')
  assert.equal(modelGroupKey('SR20-G2'), 'SR20')
  assert.equal(modelGroupKey('Sr20 G3'), 'SR20')
  assert.equal(modelGroupKey('SF50 G2 Plus'), 'SF50')
  assert.equal(modelGroupKey('172'), '172')
})

test('key: alpha-prefix family keeps the model number (Piper)', () => {
  assert.equal(modelGroupKey('PA-28-181'), 'PA-28')
  assert.equal(modelGroupKey('PA-32-301'), 'PA-32')
  assert.equal(modelGroupKey('PA-28'), 'PA-28')
})

test('groups Cirrus generations + casing dupes under one parent', () => {
  const groups = groupModelVariants(['SR20', 'Sr20 G2', 'Sr20 G3', 'SR20-G2', 'SR20-G3'])
  assert.equal(groups.length, 1)
  assert.equal(groups[0].key, 'SR20')
  // exact raw strings preserved (for the `.in('model', ...)` query), de-duped + sorted
  assert.deepEqual(groups[0].members, ['SR20', 'Sr20 G2', 'Sr20 G3', 'SR20-G2', 'SR20-G3'])
})

test('never merges genuinely different models', () => {
  const groups = groupModelVariants(['SR20', 'SR22', 'SR22T'])
  assert.deepEqual(groups.map((g) => g.key), ['SR20', 'SR22', 'SR22T'])
  // suffix/turbo variants stay separate (conservative, no letter-stripping)
  assert.equal(groups.length, 3)
})

test('singletons return one-member groups', () => {
  const groups = groupModelVariants(['172', '182'])
  assert.deepEqual(groups.map((g) => g.key), ['172', '182'])
  assert.deepEqual(groups.map((g) => g.members), [['172'], ['182']])
})

test('Piper PA-28 variants merge, PA-32 stays separate', () => {
  const groups = groupModelVariants(['PA-28-181', 'PA-28-161', 'PA-32-301'])
  assert.equal(groups.length, 2)
  const pa28 = groups.find((g) => g.key === 'PA-28')!
  assert.deepEqual(pa28.members, ['PA-28-161', 'PA-28-181'])
})

test('ignores blank/whitespace entries', () => {
  const groups = groupModelVariants(['172', '  ', '', '172'])
  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].members, ['172'])
})
