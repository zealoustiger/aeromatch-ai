/**
 * Run: node --experimental-strip-types --test src/lib/email.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPriceDropEmail, buildAlertDigestEmail } from './email.ts'

const BASE = {
  title: '2013 Cessna 172S Skyhawk',
  previousPrice: 200_000,
  askingPrice: 180_000,
  listingUrl: 'https://clubhanger.com/aircraft/listing/abc',
  manageUrl: 'https://clubhanger.com/alerts/manage',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('percent-off is computed correctly and named in the subject', () => {
  const { subject } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.equal(subject, '10% price drop — 2013 Cessna 172S Skyhawk now $180,000')
})

test('old and new price are both formatted as USD in the text body', () => {
  const { text } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.match(text, /now \$180,000 \(was \$200,000\)/)
  assert.match(text, /View listing: https:\/\/clubhanger\.com\/aircraft\/listing\/abc/)
  assert.match(text, /Manage alerts: https:\/\/clubhanger\.com\/alerts\/manage/)
  assert.match(text, /Unsubscribe: https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=xyz/)
})

test('with a photo, the HTML includes an <img> tag pointing at it', () => {
  const { html } = buildPriceDropEmail({
    ...BASE,
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cessna.jpg',
  })
  assert.match(html, /<img src="https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/a\/ae\/Cessna\.jpg"/)
})

test('without a photo, no <img> tag is rendered (no broken image)', () => {
  const { html } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.doesNotMatch(html, /<img/)
})

test('the struck-through old price and bold new price both appear in the HTML', () => {
  const { html } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.match(html, /text-decoration:line-through[^>]*>\$200,000</)
  assert.match(html, />\$180,000</)
  assert.match(html, />\s*10% price drop\s*</)
})

test('listing title is HTML-escaped', () => {
  const { html } = buildPriceDropEmail({
    ...BASE,
    title: 'Cessna 172 <script>alert(1)</script>',
    photoUrl: null,
  })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

// ─── buildAlertDigestEmail ──────────────────────────────────────────────────

const DIGEST_BASE = {
  context: 'Cessna 172',
  listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172',
  manageUrl: 'https://clubhanger.com/alerts/manage',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('digest: new + drop counts are named distinctly, never summed', () => {
  const { subject, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 1 })
  assert.equal(subject, '2 new listings + 1 price drop — Cessna 172 on ClubHanger')
  assert.match(text, /2 new listings \+ 1 price drop/)
})

test('digest: with no samples, the email still renders cleanly (CTA-only)', () => {
  const { html } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 3, dropCount: 0, samples: [] })
  assert.doesNotMatch(html, /<img/)
  assert.match(html, />\s*View Cessna 172 listings\s*</)
})

test('digest: sample cards render photo, specs, and price; "See all" CTA when more remain', () => {
  const { html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 5,
    dropCount: 0,
    samples: [
      {
        title: '2015 Cessna 172S Skyhawk',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cessna.jpg',
        isPlaceholder: false,
        year: 2015,
        ttaf: 1240,
        location: 'Austin, TX',
        price: 219_000,
        url: 'https://clubhanger.com/aircraft/listing/abc',
      },
    ],
  })
  assert.match(html, /<img src="https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/a\/ae\/Cessna\.jpg"/)
  assert.match(html, /2015 Cessna 172S Skyhawk/)
  assert.match(html, /1,240 TTAF/)
  assert.match(html, /Austin, TX/)
  assert.match(html, />\$219,000</)
  assert.match(html, />\s*See all Cessna 172 matches\s*</) // 5 total, 1 shown → more remain
})

test('digest: a placeholder sample photo carries an honest "Not actual plane photo" caption', () => {
  const { html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    samples: [
      {
        title: '2009 Cessna 172S Skyhawk',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/placeholder.jpg',
        isPlaceholder: true,
        year: 2009,
        ttaf: 3100,
        location: 'Reno, NV',
        price: 165_000,
        url: 'https://clubhanger.com/aircraft/listing/def',
      },
    ],
  })
  assert.match(html, /Not actual plane photo/)
})

test('digest: a price-drop sample shows the struck-through previous price next to the new one', () => {
  const { html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 0,
    dropCount: 1,
    samples: [
      {
        title: '2009 Cessna 172S Skyhawk',
        photoUrl: null,
        isPlaceholder: false,
        year: 2009,
        ttaf: 3100,
        location: 'Reno, NV',
        price: 165_000,
        previousPrice: 179_900,
        url: 'https://clubhanger.com/aircraft/listing/def',
      },
    ],
  })
  assert.match(html, /text-decoration:line-through[^>]*>\$179,900</)
  assert.match(html, />\$165,000</)
})

test('digest: footer includes both Manage alerts and Unsubscribe links', () => {
  const { html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0 })
  assert.match(html, /Manage alerts<\/a>/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/manage"/)
  assert.match(text, /Manage alerts: https:\/\/clubhanger\.com\/alerts\/manage/)
  assert.match(text, /Unsubscribe: https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=xyz/)
})
