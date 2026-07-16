/**
 * Run: node --experimental-strip-types --test src/lib/shareAlertLink.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withShareParam, stripShareParam } from './shareAlertLink.ts'

test('appends ?share=alert when the source_path has no query string', () => {
  assert.equal(withShareParam('/aircraft/cessna/172'), '/aircraft/cessna/172?share=alert')
})

test('appends &share=alert when the source_path already has a query string', () => {
  assert.equal(withShareParam('/aircraft?make=Cessna'), '/aircraft?make=Cessna&share=alert')
})

test('is a no-op on an empty source_path', () => {
  assert.equal(withShareParam(''), '')
})

test('stripShareParam removes a trailing share=alert, keeping other params', () => {
  assert.equal(stripShareParam('/aircraft?make=Piper&share=alert'), '/aircraft?make=Piper')
})

test('stripShareParam removes a leading share=alert, keeping other params', () => {
  assert.equal(stripShareParam('/aircraft?share=alert&make=Piper'), '/aircraft?make=Piper')
})

test('stripShareParam drops the query string entirely when share=alert was the only param', () => {
  assert.equal(stripShareParam('/aircraft?share=alert'), '/aircraft')
})

test('stripShareParam is a no-op when there is no share param', () => {
  assert.equal(stripShareParam('/aircraft?make=Cessna'), '/aircraft?make=Cessna')
  assert.equal(stripShareParam('/aircraft/listing/abc?watch=price'), '/aircraft/listing/abc?watch=price')
})

test('stripShareParam is a no-op on an empty source_path', () => {
  assert.equal(stripShareParam(''), '')
})
