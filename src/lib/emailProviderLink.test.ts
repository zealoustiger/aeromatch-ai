/**
 * Run: node --experimental-strip-types --test src/lib/emailProviderLink.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getEmailProviderLink } from './emailProviderLink.ts'

test('gmail.com resolves to Gmail webmail', () => {
  assert.deepEqual(getEmailProviderLink('pilot@gmail.com'), {
    label: 'Gmail',
    url: 'https://mail.google.com/mail/u/0/#inbox',
  })
})

test('googlemail.com also resolves to Gmail', () => {
  assert.equal(getEmailProviderLink('pilot@googlemail.com')?.label, 'Gmail')
})

test('outlook/hotmail/live/msn all resolve to Outlook', () => {
  for (const domain of ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']) {
    assert.equal(getEmailProviderLink(`pilot@${domain}`)?.label, 'Outlook')
  }
})

test('yahoo family resolves to Yahoo Mail', () => {
  for (const domain of ['yahoo.com', 'yahoo.co.uk', 'ymail.com']) {
    assert.equal(getEmailProviderLink(`pilot@${domain}`)?.label, 'Yahoo Mail')
  }
})

test('icloud family resolves to iCloud Mail', () => {
  for (const domain of ['icloud.com', 'me.com', 'mac.com']) {
    assert.equal(getEmailProviderLink(`pilot@${domain}`)?.label, 'iCloud Mail')
  }
})

test('aol.com resolves to AOL Mail', () => {
  assert.equal(getEmailProviderLink('pilot@aol.com')?.label, 'AOL Mail')
})

test('domain match is case-insensitive', () => {
  assert.equal(getEmailProviderLink('Pilot@GMAIL.COM')?.label, 'Gmail')
})

test('leading/trailing whitespace on the domain is tolerated', () => {
  assert.equal(getEmailProviderLink('pilot@gmail.com ')?.label, 'Gmail')
})

test('plus-addressing does not change the resolved domain', () => {
  assert.equal(getEmailProviderLink('pilot+alerts@gmail.com')?.label, 'Gmail')
})

test('unrecognized domain returns null, never a guess', () => {
  assert.equal(getEmailProviderLink('pilot@corporate-flight-ops.com'), null)
})

test('a work-subdomain of a known provider is NOT matched (no fabricated link)', () => {
  assert.equal(getEmailProviderLink('pilot@mail.gmail.com.evil.com'), null)
})

test('malformed input with no "@" returns null', () => {
  assert.equal(getEmailProviderLink('not-an-email'), null)
})

test('trailing "@" with empty domain returns null', () => {
  assert.equal(getEmailProviderLink('pilot@'), null)
})

test('empty string returns null', () => {
  assert.equal(getEmailProviderLink(''), null)
})
