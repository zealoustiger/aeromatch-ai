/**
 * Run: node --experimental-strip-types --test src/lib/email.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPriceDropEmail,
  buildAlertDigestEmail,
  buildCombinedAlertDigestEmail,
  buildListUnsubscribeHeaders,
  pickBestPriceDropSample,
} from './email.ts'

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
  assert.doesNotMatch(html, /Get fewer emails/)
  assert.doesNotMatch(text, /Get fewer emails/)
})

test('digest: with frequencyUrl (daily alert), the footer adds a "Get fewer emails" link', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz',
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz"[^>]*>Get fewer emails<\/a>/)
  assert.match(text, /Get fewer emails \(switch to weekly\): https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz/)
})

test('digest: sampleNote prefixes the subject with "Sample:" and renders a sample banner', () => {
  const { subject, html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 2,
    dropCount: 0,
    sampleNote: "your real weekly digest arrives automatically when there's a genuine match.",
  })
  assert.equal(subject, 'Sample: 2 current matches — Cessna 172 on ClubHanger')
  assert.match(html, /Sample email/)
  assert.match(html, /your real weekly digest arrives automatically/)
  assert.match(text, /^SAMPLE EMAIL — your real weekly digest arrives automatically/)
  assert.doesNotMatch(subject, /new listing/)
})

test('digest: without sampleNote, no sample banner renders and subject/copy are unchanged', () => {
  const { subject, html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 0 })
  assert.equal(subject, '2 new listings — Cessna 172 on ClubHanger')
  assert.doesNotMatch(html, /Sample email/)
  assert.doesNotMatch(text, /SAMPLE EMAIL/)
})

test('digest: sampleNote honestly renders a genuine zero match count, not a fabricated one', () => {
  const { subject, html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 0,
    dropCount: 0,
    samples: [],
    sampleNote: "your real weekly digest arrives automatically when there's a genuine match.",
  })
  assert.equal(subject, 'Sample: 0 current matches — Cessna 172 on ClubHanger')
  assert.match(html, /0 current matches for your Cessna 172 alert right now/)
})

test('price drop: without frequencyUrl (weekly alert), no "Get fewer emails" link renders', () => {
  const { html, text } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.doesNotMatch(html, /Get fewer emails/)
  assert.doesNotMatch(text, /Get fewer emails/)
})

test('price drop: with frequencyUrl (daily alert), the footer adds a "Get fewer emails" link', () => {
  const { html, text } = buildPriceDropEmail({
    ...BASE,
    photoUrl: null,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz',
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz"[^>]*>Get fewer emails<\/a>/)
  assert.match(text, /Get fewer emails \(switch to weekly\): https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz/)
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

// ─── buildCombinedAlertDigestEmail ─────────────────────────────────────────

test('combined: subject states an honest total across all sections, never a single alert\'s count', () => {
  const { subject } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 2, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172' },
      { context: 'Cirrus SR22', newCount: 0, dropCount: 1, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus&model=SR22' },
    ],
  })
  assert.equal(subject, '2 new listings + 1 price drop across your 2 alerts on ClubHanger')
})

test('combined: each section keeps its own context, count line, and CTA — never merged into one', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 2, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172' },
      { context: 'Cirrus SR22', newCount: 0, dropCount: 1, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus&model=SR22' },
    ],
  })
  assert.match(html, />Cessna 172</)
  assert.match(html, />2 new listings</)
  assert.match(html, />Cirrus SR22</)
  assert.match(html, />1 price drop</)
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\?make=Cessna&amp;model=172"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\?make=Cirrus&amp;model=SR22"/)
  assert.match(text, /Cessna 172 — 2 new listings/)
  assert.match(text, /Cirrus SR22 — 1 price drop/)
})

test('combined: dropNoun customizes a partnership section\'s own drop label independent of other sections (the overall total across mixed noun types stays generic)', () => {
  const { text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
      { context: null, newCount: 0, dropCount: 1, dropNoun: 'buy-in drop', listingsUrl: 'https://clubhanger.com/partnerships' },
    ],
  })
  assert.match(text, /Your alert — 1 buy-in drop/)
})

test('combined: a section with no context falls back to "Your alert" instead of a blank heading', () => {
  const { html } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: null, newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft' },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
  })
  assert.match(html, />Your alert</)
})

test('combined: sample cards render within their own section', () => {
  const { html } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna',
        samples: [
          {
            title: '2015 Cessna 172S Skyhawk',
            photoUrl: null,
            isPlaceholder: false,
            year: 2015,
            ttaf: 1240,
            location: 'Austin, TX',
            price: 219_000,
            url: 'https://clubhanger.com/aircraft/listing/preview-1',
          },
        ],
      },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
  })
  assert.match(html, /2015 Cessna 172S Skyhawk/)
  assert.match(html, /\$219,000/)
})

test('combined: footer carries the shared Manage/Unsubscribe links (already multi-token-scoped by the caller)', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/manage\?token=a"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=a,b"/)
  assert.match(text, /Manage alerts: https:\/\/clubhanger\.com\/alerts\/manage\?token=a/)
  assert.match(text, /Unsubscribe from these: https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=a,b/)
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

// ─── buildListUnsubscribeHeaders (RFC 8058) ────────────────────────────────

test('buildListUnsubscribeHeaders: wraps the URL in angle brackets and sets the one-click marker', () => {
  const headers = buildListUnsubscribeHeaders('https://clubhanger.com/api/alerts/unsubscribe?token=xyz')
  assert.deepEqual(headers, {
    'List-Unsubscribe': '<https://clubhanger.com/api/alerts/unsubscribe?token=xyz>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  })
})

test('buildListUnsubscribeHeaders: returns undefined with no URL (non-alert emails stay header-free)', () => {
  assert.equal(buildListUnsubscribeHeaders(undefined), undefined)
  assert.equal(buildListUnsubscribeHeaders(''), undefined)
})
