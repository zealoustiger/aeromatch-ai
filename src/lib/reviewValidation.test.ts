/**
 * Run: node --experimental-strip-types --test src/lib/reviewValidation.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateReview } from './reviewValidation.ts'

test('accepts a normal review', () => {
  assert.equal(validateReview({ body: 'Great partner, smooth handoff.', rating: 5 }), null)
})

test('accepts a review with no rating', () => {
  assert.equal(validateReview({ body: 'Solid experience overall.', rating: null }), null)
})

test('rejects a too-short body', () => {
  assert.match(validateReview({ body: 'ok', rating: null }) ?? '', /few words/)
})

test('rejects a too-long body', () => {
  const long = 'a'.repeat(2001)
  assert.match(validateReview({ body: long, rating: null }) ?? '', /too long/)
})

test('rejects an out-of-range rating', () => {
  assert.match(validateReview({ body: 'Fine partnership.', rating: 6 }) ?? '', /1–5/)
  assert.match(validateReview({ body: 'Fine partnership.', rating: 0 }) ?? '', /1–5/)
})

test('rejects profanity', () => {
  assert.match(validateReview({ body: 'This guy is a total asshole honestly.', rating: 1 }) ?? '', /professional/)
})
