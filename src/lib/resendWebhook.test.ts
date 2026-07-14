/**
 * Run: node --experimental-strip-types --test src/lib/resendWebhook.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyResendWebhookSignature, extractHardBouncedEmails } from './resendWebhook.ts'

const SECRET = 'whsec_' + Buffer.from('test-secret-bytes-0000').toString('base64')

function sign(payload: string, id: string, timestamp: string, secret = SECRET) {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const signedContent = `${id}.${timestamp}.${payload}`
  return 'v1,' + createHmac('sha256', secretBytes).update(signedContent).digest('base64')
}

test('accepts a correctly-signed payload', () => {
  const payload = '{"type":"email.bounced"}'
  const svixId = 'msg_123'
  const svixTimestamp = '1700000000'
  const svixSignature = sign(payload, svixId, svixTimestamp)
  assert.equal(
    verifyResendWebhookSignature({ payload, secret: SECRET, svixId, svixTimestamp, svixSignature }),
    true
  )
})

test('rejects a tampered payload', () => {
  const payload = '{"type":"email.bounced"}'
  const svixId = 'msg_123'
  const svixTimestamp = '1700000000'
  const svixSignature = sign(payload, svixId, svixTimestamp)
  assert.equal(
    verifyResendWebhookSignature({
      payload: payload + 'x',
      secret: SECRET,
      svixId,
      svixTimestamp,
      svixSignature,
    }),
    false
  )
})

test('rejects a signature made with the wrong secret', () => {
  const payload = '{"type":"email.bounced"}'
  const svixId = 'msg_123'
  const svixTimestamp = '1700000000'
  const wrongSecret = 'whsec_' + Buffer.from('another-secret-bytes').toString('base64')
  const svixSignature = sign(payload, svixId, svixTimestamp, wrongSecret)
  assert.equal(
    verifyResendWebhookSignature({ payload, secret: SECRET, svixId, svixTimestamp, svixSignature }),
    false
  )
})

test('accepts a valid signature even when other, bogus candidates are present (key-rotation format)', () => {
  const payload = '{"type":"email.bounced"}'
  const svixId = 'msg_123'
  const svixTimestamp = '1700000000'
  const valid = sign(payload, svixId, svixTimestamp)
  const svixSignature = `v1,bogus== ${valid}`
  assert.equal(
    verifyResendWebhookSignature({ payload, secret: SECRET, svixId, svixTimestamp, svixSignature }),
    true
  )
})

test('rejects when every candidate signature is invalid', () => {
  const payload = '{"type":"email.bounced"}'
  assert.equal(
    verifyResendWebhookSignature({
      payload,
      secret: SECRET,
      svixId: 'msg_123',
      svixTimestamp: '1700000000',
      svixSignature: 'v1,bogus==',
    }),
    false
  )
})

test('extractHardBouncedEmails returns lowercased recipients for a Permanent bounce', () => {
  const body = {
    type: 'email.bounced',
    data: { to: ['Buyer@Example.com'], bounce: { type: 'Permanent', subType: 'General' } },
  }
  assert.deepEqual(extractHardBouncedEmails(body), ['buyer@example.com'])
})

test('extractHardBouncedEmails ignores transient/soft bounces — they may still deliver later', () => {
  const body = {
    type: 'email.bounced',
    data: { to: ['buyer@example.com'], bounce: { type: 'Transient', subType: 'MailboxFull' } },
  }
  assert.deepEqual(extractHardBouncedEmails(body), [])
})

test('extractHardBouncedEmails ignores unrelated event types', () => {
  const body = { type: 'email.delivered', data: { to: ['buyer@example.com'], bounce: { type: 'Permanent' } } }
  assert.deepEqual(extractHardBouncedEmails(body), [])
})

test('extractHardBouncedEmails is defensive against malformed/partial payloads', () => {
  assert.deepEqual(extractHardBouncedEmails(null), [])
  assert.deepEqual(extractHardBouncedEmails(undefined), [])
  assert.deepEqual(extractHardBouncedEmails('nope'), [])
  assert.deepEqual(extractHardBouncedEmails({}), [])
  assert.deepEqual(extractHardBouncedEmails({ type: 'email.bounced' }), [])
  assert.deepEqual(extractHardBouncedEmails({ type: 'email.bounced', data: {} }), [])
  assert.deepEqual(
    extractHardBouncedEmails({ type: 'email.bounced', data: { bounce: { type: 'Permanent' }, to: 'not-an-array' } }),
    []
  )
})
