/**
 * Run: node --experimental-strip-types --test src/lib/resendWebhook.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  verifyResendWebhookSignature,
  extractHardBouncedEmails,
  extractComplainedEmails,
  extractEngagementEvent,
} from './resendWebhook.ts'

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

test('extractComplainedEmails returns lowercased recipients for a spam complaint', () => {
  const body = { type: 'email.complained', data: { to: ['Buyer@Example.com'] } }
  assert.deepEqual(extractComplainedEmails(body), ['buyer@example.com'])
})

test('extractComplainedEmails ignores unrelated event types', () => {
  const body = { type: 'email.bounced', data: { to: ['buyer@example.com'] } }
  assert.deepEqual(extractComplainedEmails(body), [])
})

test('extractComplainedEmails is defensive against malformed/partial payloads', () => {
  assert.deepEqual(extractComplainedEmails(null), [])
  assert.deepEqual(extractComplainedEmails(undefined), [])
  assert.deepEqual(extractComplainedEmails('nope'), [])
  assert.deepEqual(extractComplainedEmails({}), [])
  assert.deepEqual(extractComplainedEmails({ type: 'email.complained' }), [])
  assert.deepEqual(extractComplainedEmails({ type: 'email.complained', data: {} }), [])
  assert.deepEqual(
    extractComplainedEmails({ type: 'email.complained', data: { to: 'not-an-array' } }),
    []
  )
})

test('extractEngagementEvent parses an email.opened event and reads the type tag', () => {
  const body = {
    type: 'email.opened',
    data: { email_id: 'abc-123', tags: [{ name: 'type', value: 'alert-digest' }] },
  }
  assert.deepEqual(extractEngagementEvent(body), {
    eventType: 'opened',
    emailType: 'alert-digest',
    resendEmailId: 'abc-123',
    link: null,
  })
})

test('extractEngagementEvent parses an email.clicked event including the clicked link', () => {
  const body = {
    type: 'email.clicked',
    data: {
      email_id: 'abc-456',
      tags: [{ name: 'type', value: 'price-drop' }],
      click: { link: 'https://clubhanger.com/aircraft/listing/1' },
    },
  }
  assert.deepEqual(extractEngagementEvent(body), {
    eventType: 'clicked',
    emailType: 'price-drop',
    resendEmailId: 'abc-456',
    link: 'https://clubhanger.com/aircraft/listing/1',
  })
})

test('extractEngagementEvent buckets an untagged send as null emailType, not a crash', () => {
  const body = { type: 'email.opened', data: { email_id: 'abc-789' } }
  assert.deepEqual(extractEngagementEvent(body), {
    eventType: 'opened',
    emailType: null,
    resendEmailId: 'abc-789',
    link: null,
  })
})

test('extractEngagementEvent ignores unrelated event types', () => {
  assert.equal(extractEngagementEvent({ type: 'email.bounced', data: {} }), null)
  assert.equal(extractEngagementEvent({ type: 'email.delivered', data: {} }), null)
})

test('extractEngagementEvent is defensive against malformed/partial payloads', () => {
  assert.equal(extractEngagementEvent(null), null)
  assert.equal(extractEngagementEvent(undefined), null)
  assert.equal(extractEngagementEvent('nope'), null)
  assert.equal(extractEngagementEvent({}), null)
  assert.deepEqual(extractEngagementEvent({ type: 'email.opened' }), {
    eventType: 'opened',
    emailType: null,
    resendEmailId: null,
    link: null,
  })
  assert.deepEqual(extractEngagementEvent({ type: 'email.opened', data: { tags: 'not-an-array' } }), {
    eventType: 'opened',
    emailType: null,
    resendEmailId: null,
    link: null,
  })
})
