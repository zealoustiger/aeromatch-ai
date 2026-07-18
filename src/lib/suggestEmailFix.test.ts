/**
 * Run: node --experimental-strip-types --test src/lib/suggestEmailFix.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suggestEmailFix } from './suggestEmailFix.ts'

test('transposition typo: gmial.com -> gmail.com', () => {
  assert.equal(suggestEmailFix('pilot@gmial.com'), 'pilot@gmail.com')
})

test('substitution typo: gmail.con -> gmail.com', () => {
  assert.equal(suggestEmailFix('pilot@gmail.con'), 'pilot@gmail.com')
})

test('deletion typo: gmail.co -> gmail.com', () => {
  assert.equal(suggestEmailFix('pilot@gmail.co'), 'pilot@gmail.com')
})

test('insertion typo: gmailx.com -> gmail.com', () => {
  assert.equal(suggestEmailFix('pilot@gmailx.com'), 'pilot@gmail.com')
})

test('missing letter: yaho.com -> yahoo.com', () => {
  assert.equal(suggestEmailFix('pilot@yaho.com'), 'pilot@yahoo.com')
})

test('transposition typo: hotmial.com -> hotmail.com', () => {
  assert.equal(suggestEmailFix('pilot@hotmial.com'), 'pilot@hotmail.com')
})

test('missing letter: outlok.com -> outlook.com', () => {
  assert.equal(suggestEmailFix('pilot@outlok.com'), 'pilot@outlook.com')
})

test('already-correct top domain returns null', () => {
  assert.equal(suggestEmailFix('pilot@gmail.com'), null)
})

test('unrelated domain returns null, never a wild guess', () => {
  assert.equal(suggestEmailFix('pilot@corporate-flight-ops.com'), null)
})

test('domain match is case-insensitive on input, lowercased in suggestion', () => {
  assert.equal(suggestEmailFix('Pilot@GMIAL.COM'), 'Pilot@gmail.com')
})

test('local part is preserved verbatim, only the domain is corrected', () => {
  assert.equal(suggestEmailFix('first.last+alerts@gmial.com'), 'first.last+alerts@gmail.com')
})

test('malformed input with no "@" returns null', () => {
  assert.equal(suggestEmailFix('not-an-email'), null)
})

test('leading "@" with empty local part returns null', () => {
  assert.equal(suggestEmailFix('@gmial.com'), null)
})

test('trailing "@" with empty domain returns null', () => {
  assert.equal(suggestEmailFix('pilot@'), null)
})

test('empty string returns null', () => {
  assert.equal(suggestEmailFix(''), null)
})

test('a real but unrelated short domain is not force-matched', () => {
  assert.equal(suggestEmailFix('pilot@x.com'), null)
})
