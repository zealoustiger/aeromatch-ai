/**
 * Run: node --experimental-strip-types --test src/lib/email.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPriceDropEmail, buildAlertDigestEmail, pickBestPriceDropSample } from './email.ts'

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

test('the text body never claims the drop "just" happened — a daily/weekly cron send, not real-time', () => {
  const { text } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.doesNotMatch(text, /just dropped/i)
  assert.match(text, /dropped 10% this week/)
})

test('periodLabel overrides the default "this week" wording (e.g. "yesterday" for a daily alert)', () => {
  const { text } = buildPriceDropEmail({ ...BASE, photoUrl: null, periodLabel: 'yesterday' })
  assert.match(text, /dropped 10% yesterday/)
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

test('dropNoun customizes the subject/badge label (partnership buy-in drops)', () => {
  const { subject, html } = buildPriceDropEmail({ ...BASE, photoUrl: null, dropNoun: 'buy-in drop' })
  assert.equal(subject, '10% buy-in drop — 2013 Cessna 172S Skyhawk now $180,000')
  assert.match(html, />\s*10% buy-in drop\s*</)
})

test('shareType renders as a subtitle in the HTML and inline in the text body', () => {
  const { html, text } = buildPriceDropEmail({
    ...BASE,
    photoUrl: null,
    dropNoun: 'buy-in drop',
    shareType: '1/4 Share',
  })
  assert.match(html, />1\/4 Share</)
  assert.match(text, /2013 Cessna 172S Skyhawk \(1\/4 Share\) dropped 10% this week/)
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

test('digest: dropNoun customizes the drop label (partnership buy-in drops)', () => {
  const { subject, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 2,
    dropNoun: 'buy-in drop',
  })
  assert.equal(subject, '1 new listing + 2 buy-in drops — Cessna 172 on ClubHanger')
  assert.match(text, /1 new listing \+ 2 buy-in drops/)
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

const sample = (overrides: Partial<Parameters<typeof pickBestPriceDropSample>[0][number]>) => ({
  title: 'Aircraft',
  photoUrl: null,
  isPlaceholder: false,
  year: 2010,
  ttaf: 2000,
  location: null,
  price: 100_000,
  previousPrice: 120_000,
  url: 'https://clubhanger.com/aircraft/listing/x',
  ...overrides,
})

test('pickBestPriceDropSample: picks the largest % decrease, not the first/most-recent', () => {
  const best = pickBestPriceDropSample([
    sample({ title: 'Small drop', previousPrice: 200_000, price: 190_000 }), // 5%
    sample({ title: 'Big drop', previousPrice: 200_000, price: 150_000 }), // 25%
    sample({ title: 'Medium drop', previousPrice: 200_000, price: 170_000 }), // 15%
  ])
  assert.equal(best?.title, 'Big drop')
})

test('pickBestPriceDropSample: ignores samples with no genuine decrease or missing prices', () => {
  const best = pickBestPriceDropSample([
    sample({ title: 'No previous price', previousPrice: undefined, price: 100_000 }),
    sample({ title: 'No price', previousPrice: 120_000, price: null }),
    sample({ title: 'Price went up', previousPrice: 100_000, price: 120_000 }),
    sample({ title: 'Flat', previousPrice: 100_000, price: 100_000 }),
    sample({ title: 'Genuine drop', previousPrice: 120_000, price: 100_000 }),
  ])
  assert.equal(best?.title, 'Genuine drop')
})

test('pickBestPriceDropSample: returns null for an empty or all-disqualified list', () => {
  assert.equal(pickBestPriceDropSample([]), null)
  assert.equal(pickBestPriceDropSample([sample({ previousPrice: 100_000, price: 100_000 })]), null)
})
