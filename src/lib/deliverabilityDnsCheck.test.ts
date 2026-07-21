/**
 * Run: node --experimental-strip-types --test src/lib/deliverabilityDnsCheck.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveSpfVerdict, deriveDkimVerdict, deriveDmarcVerdict } from './deliverabilityDnsCheck.ts'

test('deriveSpfVerdict: a real v=spf1 record passes', () => {
  assert.equal(deriveSpfVerdict(['v=spf1 include:_spf.resend.com ~all']), 'pass')
})

test('deriveSpfVerdict: is case-insensitive and ignores unrelated TXT records', () => {
  assert.equal(
    deriveSpfVerdict(['google-site-verification=abc123', 'V=SPF1 include:_spf.resend.com ~all']),
    'pass'
  )
})

test('deriveSpfVerdict: no matching record fails', () => {
  assert.equal(deriveSpfVerdict(['google-site-verification=abc123']), 'fail')
})

test('deriveSpfVerdict: empty record list (NXDOMAIN/no records) fails', () => {
  assert.equal(deriveSpfVerdict([]), 'fail')
})

test('deriveSpfVerdict: null (lookup error) never fabricates a pass or fail', () => {
  assert.equal(deriveSpfVerdict(null), 'lookup-error')
})

test('deriveDkimVerdict: any record at the selector passes', () => {
  assert.equal(deriveDkimVerdict(['p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCB...']), 'pass')
})

test('deriveDkimVerdict: no record at the selector fails', () => {
  assert.equal(deriveDkimVerdict([]), 'fail')
})

test('deriveDkimVerdict: null (lookup error) never fabricates a pass or fail', () => {
  assert.equal(deriveDkimVerdict(null), 'lookup-error')
})

test('deriveDmarcVerdict: a real v=DMARC1 record passes', () => {
  assert.equal(deriveDmarcVerdict(['v=DMARC1; p=none; rua=mailto:dmarc@clubhanger.com']), 'pass')
})

test('deriveDmarcVerdict: no matching record fails', () => {
  assert.equal(deriveDmarcVerdict([]), 'fail')
})

test('deriveDmarcVerdict: null (lookup error) never fabricates a pass or fail', () => {
  assert.equal(deriveDmarcVerdict(null), 'lookup-error')
})
