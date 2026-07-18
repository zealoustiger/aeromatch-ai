/**
 * Run: node --experimental-strip-types --test src/lib/email.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPriceDropEmail,
  buildAlertDigestEmail,
  buildCombinedAlertDigestEmail,
  buildAlertConfirmEmail,
  buildListingUnavailableEmail,
  buildWidenSuggestionEmail,
  buildAlertZeroMatchWelcomeEmail,
  buildListUnsubscribeHeaders,
  pickBestPriceDropSample,
  buildManageLinkEmail,
  buildAlertEmailChangeConfirmEmail,
  buildNewMessageEmail,
  buildSeedInquiryEmail,
  buildMatchAlertEmail,
  compLabel,
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

test('price-drop: marketPulse renders as an honest one-liner in both HTML and text', () => {
  const { html, text } = buildPriceDropEmail({
    ...BASE,
    photoUrl: null,
    marketPulse: '14 Cessna 172s listed right now, median asking $89k.',
  })
  assert.match(html, /14 Cessna 172s listed right now, median asking \$89k\./)
  assert.match(text, /14 Cessna 172s listed right now, median asking \$89k\./)
})

test('price-drop: without marketPulse, no market-context line renders (honesty gate — never a guess)', () => {
  const { html, text } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.doesNotMatch(html, /listed right now, median asking/)
  assert.doesNotMatch(text, /listed right now, median asking/)
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

test('digest: marketPulse renders as an honest one-liner in both HTML and text', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 2,
    dropCount: 0,
    marketPulse: '14 Cessna 172s listed right now, median asking $89k.',
  })
  assert.match(html, /14 Cessna 172s listed right now, median asking \$89k\./)
  assert.match(text, /14 Cessna 172s listed right now, median asking \$89k\./)
})

test('digest: without marketPulse, no market-context line renders (honesty gate — never a guess)', () => {
  const { html } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 0 })
  assert.doesNotMatch(html, /listed right now, median asking/)
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

test('compLabel: below-median comp renders "~N% below avg · median · comps"', () => {
  assert.equal(compLabel({ kind: 'below', pct: 12, count: 8, median: 52_000 }), '~12% below avg · $52k median · 8 comps')
})

test('compLabel: above-median comp renders "~N% above avg · median · comps"', () => {
  assert.equal(compLabel({ kind: 'above', pct: 7, count: 5, median: 118_000 }), '~7% above avg · $118k median · 5 comps')
})

test('compLabel: near-median comp renders "Near avg · median · comps" with no percent', () => {
  assert.equal(compLabel({ kind: 'near', pct: 0, count: 12, median: 90_000 }), 'Near avg · $90k median · 12 comps')
})

test('compLabel: a million-dollar median formats compactly ($X.XM)', () => {
  assert.equal(compLabel({ kind: 'below', pct: 3, count: 6, median: 1_250_000 }), '~3% below avg · $1.3M median · 6 comps')
})

test('digest: a sample with compLabel renders the market-context pill in an emerald "below avg" style', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    samples: [
      {
        title: '2015 Cessna 172S Skyhawk',
        photoUrl: null,
        isPlaceholder: false,
        year: 2015,
        ttaf: 1240,
        location: 'Austin, TX',
        price: 219_000,
        url: 'https://clubhanger.com/aircraft/listing/abc',
        compLabel: '~12% below avg · $250k median · 8 comps',
        compBelowAvg: true,
      },
    ],
  })
  assert.match(html, /#ecfdf5/) // emerald background for a below-avg deal
  assert.match(html, /~12% below avg &middot;? ?\$250k median &middot;? ?8 comps|~12% below avg · \$250k median · 8 comps/)
  assert.match(text, /\[~12% below avg · \$250k median · 8 comps\]/)
})

test('digest: a sample with no compLabel renders no market-context pill (honesty gate)', () => {
  const { html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    samples: [
      {
        title: '2015 Cessna 172S Skyhawk',
        photoUrl: null,
        isPlaceholder: false,
        year: 2015,
        ttaf: 1240,
        location: 'Austin, TX',
        price: 219_000,
        url: 'https://clubhanger.com/aircraft/listing/abc',
      },
    ],
  })
  assert.doesNotMatch(html, /median/)
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
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/manage\?utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=digest"/)
  assert.match(text, /Manage alerts: https:\/\/clubhanger\.com\/alerts\/manage\?utm_source=alert_email&utm_medium=email&utm_campaign=digest/)
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

test('digest: without digest-feedback urls, no "Was this digest useful?" row renders', () => {
  const { html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0 })
  assert.doesNotMatch(html, /Was this digest useful/)
  assert.doesNotMatch(text, /Was this digest useful/)
})

test('digest: with both digest-feedback urls, the footer adds a "Was this digest useful?" 👍/👎 row', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    digestFeedbackUpUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=xyz&vote=up',
    digestFeedbackDownUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=xyz&vote=down',
  })
  assert.match(html, /Was this digest useful\?/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=xyz&amp;vote=up"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=xyz&amp;vote=down"/)
  assert.match(text, /Was this digest useful\? Yes: https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=xyz&vote=up  No: https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=xyz&vote=down/)
})

test('digest: with only one digest-feedback url, no row renders (they are always built as a pair)', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    digestFeedbackUpUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=xyz&vote=up',
  })
  assert.doesNotMatch(html, /Was this digest useful/)
  assert.doesNotMatch(text, /Was this digest useful/)
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

test('digest: subject names the standout listing when there is exactly one new match', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    samples: [
      {
        title: '1977 Cessna 182Q',
        photoUrl: null,
        isPlaceholder: false,
        year: 1977,
        ttaf: 3400,
        location: 'Boise, ID',
        price: 89_500,
        url: 'https://clubhanger.com/aircraft/listing/xyz',
      },
    ],
  })
  assert.equal(subject, 'New: 1977 Cessna 182Q at $89,500 — your Cessna 172 alert')
})

test('digest: standout subject falls back to "new match on ClubHanger" when the alert has no context', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    context: null,
    newCount: 1,
    dropCount: 0,
    samples: [
      {
        title: '1977 Cessna 182Q',
        photoUrl: null,
        isPlaceholder: false,
        year: 1977,
        ttaf: 3400,
        location: 'Boise, ID',
        price: 89_500,
        url: 'https://clubhanger.com/aircraft/listing/xyz',
      },
    ],
  })
  assert.equal(subject, 'New: 1977 Cessna 182Q at $89,500 — new match on ClubHanger')
})

test('digest: standout naming falls back to the generic subject when there is more than one match', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 2,
    dropCount: 0,
    samples: [
      {
        title: '1977 Cessna 182Q',
        photoUrl: null,
        isPlaceholder: false,
        year: 1977,
        ttaf: 3400,
        location: 'Boise, ID',
        price: 89_500,
        url: 'https://clubhanger.com/aircraft/listing/xyz',
      },
    ],
  })
  assert.equal(subject, '2 new listings — Cessna 172 on ClubHanger')
})

test('digest: standout naming falls back to the generic subject when the one match is a price drop, not new', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 0,
    dropCount: 1,
    samples: [
      {
        title: '1977 Cessna 182Q',
        photoUrl: null,
        isPlaceholder: false,
        year: 1977,
        ttaf: 3400,
        location: 'Boise, ID',
        price: 89_500,
        previousPrice: 95_000,
        url: 'https://clubhanger.com/aircraft/listing/xyz',
      },
    ],
  })
  assert.equal(subject, '1 price drop — Cessna 172 on ClubHanger')
})

test('digest: standout naming falls back to the generic subject when the sample has no usable price (never fabricate)', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    samples: [
      {
        title: 'Pilot seeking a partnership',
        photoUrl: null,
        isPlaceholder: false,
        year: null,
        ttaf: null,
        location: null,
        price: null,
        url: 'https://clubhanger.com/partnerships/seeking/xyz',
      },
    ],
  })
  assert.equal(subject, '1 new listing — Cessna 172 on ClubHanger')
})

test('digest: standout naming falls back to the generic subject with zero samples', () => {
  const { subject } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0, samples: [] })
  assert.equal(subject, '1 new listing — Cessna 172 on ClubHanger')
})

test('digest: standout naming does not apply to sampleNote previews even with one match', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    sampleNote: "your real weekly digest arrives automatically when there's a genuine match.",
    samples: [
      {
        title: '1977 Cessna 182Q',
        photoUrl: null,
        isPlaceholder: false,
        year: 1977,
        ttaf: 3400,
        location: 'Boise, ID',
        price: 89_500,
        url: 'https://clubhanger.com/aircraft/listing/xyz',
      },
    ],
  })
  assert.equal(subject, 'Sample: 1 current match — Cessna 172 on ClubHanger')
})

test('digest: standout naming does not apply to firstSend even with one match', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    firstSend: true,
    samples: [
      {
        title: '1977 Cessna 182Q',
        photoUrl: null,
        isPlaceholder: false,
        year: 1977,
        ttaf: 3400,
        location: 'Boise, ID',
        price: 89_500,
        url: 'https://clubhanger.com/aircraft/listing/xyz',
      },
    ],
  })
  assert.equal(subject, '1 match right now — Cessna 172 on ClubHanger')
})

test('digest: firstSend renders "right now" framing, no Sample prefix or banner', () => {
  const { subject, html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 3,
    dropCount: 0,
    firstSend: true,
  })
  assert.equal(subject, '3 matches right now — Cessna 172 on ClubHanger')
  assert.doesNotMatch(subject, /Sample/)
  assert.doesNotMatch(html, /Sample email/)
  assert.doesNotMatch(text, /SAMPLE EMAIL/)
  assert.match(html, /3 matches right now for your Cessna 172 alert — here's what's live the moment you confirmed/)
  assert.match(text, /the moment you confirmed/)
})

test('digest: firstSend is ignored when sampleNote is also set (sample framing wins)', () => {
  const { subject } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    firstSend: true,
    sampleNote: "your real weekly digest arrives automatically when there's a genuine match.",
  })
  assert.equal(subject, 'Sample: 1 current match — Cessna 172 on ClubHanger')
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
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\?make=Cessna&amp;model=172&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=combined"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\?make=Cirrus&amp;model=SR22&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=combined"/)
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

test('combined: marketPulse renders per-section, independently — a section without one gets no line', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna',
        marketPulse: '14 Cessna 172s listed right now, median asking $89k.',
      },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
  })
  assert.match(html, /14 Cessna 172s listed right now, median asking \$89k\./)
  assert.match(text, /14 Cessna 172s listed right now, median asking \$89k\./)
  // Only one occurrence — the second (Cirrus) section has no marketPulse.
  assert.equal((html.match(/listed right now, median asking/g) ?? []).length, 1)
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
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/manage\?token=a&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=combined"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=a,b"/)
  assert.match(text, /Manage alerts: https:\/\/clubhanger\.com\/alerts\/manage\?token=a&utm_source=alert_email&utm_medium=email&utm_campaign=combined/)
  assert.match(text, /Unsubscribe from these: https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=a,b/)
})

test('combined: a section with its own stopUrl renders a per-section "Stop just this alert" link distinct from the shared footer unsubscribe', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna',
        stopUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a',
      },
      {
        context: 'Cirrus SR22',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus',
        stopUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=b',
      },
    ],
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=a"[^>]*>Stop just this alert</)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=b"[^>]*>Stop just this alert</)
  // Each section's stop link carries its OWN single token, never the
  // combined comma-joined one from the shared footer link.
  assert.equal((html.match(/token=a,b/g) ?? []).length, 1)
  assert.match(text, /Stop just this alert: https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=a/)
  assert.match(text, /Stop just this alert: https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=b/)
})

test('combined: a section with no stopUrl renders no per-section stop link (fails soft, no dead link)', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
    ],
  })
  assert.doesNotMatch(html, /Stop just this alert/)
  assert.doesNotMatch(text, /Stop just this alert/)
})

test('combined: with both digest-feedback urls, one shared "Was this digest useful?" row renders (not per-section)', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
    digestFeedbackUpUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=a&vote=up',
    digestFeedbackDownUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=a&vote=down',
  })
  assert.equal((html.match(/Was this digest useful\?/g) ?? []).length, 1)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=a&amp;vote=up"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=a&amp;vote=down"/)
  assert.match(text, /Was this digest useful\? Yes: https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=a&vote=up  No: https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=a&vote=down/)
})

test('combined: without digest-feedback urls, no row renders', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
    ],
  })
  assert.doesNotMatch(html, /Was this digest useful/)
  assert.doesNotMatch(text, /Was this digest useful/)
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

// ─── buildAlertConfirmEmail (confirm-email match preview) ──────────────────

const CONFIRM_BASE = {
  context: 'Cessna 172',
  confirmUrl: 'https://clubhanger.com/api/alerts/confirm?token=abc',
  manageUrl: 'https://clubhanger.com/alerts/manage?token=xyz',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('confirm: with no preview passed, renders exactly as before — no preview section', () => {
  const { html, text } = buildAlertConfirmEmail(CONFIRM_BASE)
  assert.doesNotMatch(html, /Here.{1,2}s what you.{1,2}d be watching/)
  assert.doesNotMatch(html, /None match right now/)
  assert.doesNotMatch(text, /Here's what you'd be watching/)
  assert.doesNotMatch(text, /None match right now/)
})

test('confirm: a null preview (unrecognized source_path, e.g. a listing watch alert) also renders no section', () => {
  const { html } = buildAlertConfirmEmail({ ...CONFIRM_BASE, preview: null })
  assert.doesNotMatch(html, /Here.{1,2}s what you.{1,2}d be watching/)
  assert.doesNotMatch(html, /None match right now/)
})

test('confirm: real samples render as cards above the confirm button', () => {
  const { html, text } = buildAlertConfirmEmail({
    ...CONFIRM_BASE,
    preview: {
      count: 2,
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
    },
  })
  assert.match(html, /Here&rsquo;s what you&rsquo;d be watching/)
  assert.match(html, /2015 Cessna 172S Skyhawk/)
  assert.match(html, />\$219,000</)
  const confirmIdx = html.indexOf('Confirm my alerts')
  const cardIdx = html.indexOf('2015 Cessna 172S Skyhawk')
  assert.ok(cardIdx > 0 && cardIdx < confirmIdx, 'sample card renders before the confirm button')
  assert.match(text, /Here's what you'd be watching:/)
  assert.match(text, /2015 Cessna 172S Skyhawk — \$219,000/)
})

test('confirm: a real, confirmed zero-match preview renders the honest "None match right now" line, never a fabricated sample', () => {
  const { html, text } = buildAlertConfirmEmail({ ...CONFIRM_BASE, preview: { count: 0, samples: [] } })
  assert.match(html, /None match right now/)
  assert.doesNotMatch(html, /<img/)
  assert.match(text, /None match right now — you'll be first to know when one does\./)
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

// ─── buildListingUnavailableEmail (watch-alert honesty gate) ───────────────

const UNAVAILABLE_BASE = {
  title: '2013 Cessna 172S Skyhawk',
  browseUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172',
  manageUrl: 'https://clubhanger.com/alerts/manage',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('buildListingUnavailableEmail: subject names the listing as no longer available', () => {
  const { subject } = buildListingUnavailableEmail(UNAVAILABLE_BASE)
  assert.equal(subject, '2013 Cessna 172S Skyhawk is no longer available')
})

test('buildListingUnavailableEmail: never claims a percent/badge-style drop — this is a removal notice, not a deal', () => {
  const { html, text } = buildListingUnavailableEmail(UNAVAILABLE_BASE)
  assert.doesNotMatch(html, /%\s*price drop/i)
  assert.match(text, /sold or taken off the market/)
})

test('buildListingUnavailableEmail: browse/manage/unsubscribe links all appear in both html and text', () => {
  const { html, text } = buildListingUnavailableEmail(UNAVAILABLE_BASE)
  for (const url of [UNAVAILABLE_BASE.browseUrl, UNAVAILABLE_BASE.manageUrl, UNAVAILABLE_BASE.unsubscribeUrl]) {
    assert.ok(text.includes(url), `expected text to include ${url}`)
  }
  assert.ok(html.includes(UNAVAILABLE_BASE.manageUrl), 'expected html to include manageUrl')
  assert.ok(html.includes(UNAVAILABLE_BASE.unsubscribeUrl), 'expected html to include unsubscribeUrl')
  assert.ok(
    html.includes(UNAVAILABLE_BASE.browseUrl.replace('&', '&amp;')),
    'expected html to include the HTML-escaped browseUrl'
  )
})

test('buildListingUnavailableEmail: listing title is HTML-escaped', () => {
  const { html } = buildListingUnavailableEmail({
    ...UNAVAILABLE_BASE,
    title: 'Cessna 172 <script>alert(1)</script>',
  })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('buildListingUnavailableEmail: noun "partnership" reads "filled or taken down" / buy-in drop, not sold/aircraft', () => {
  const { html, text } = buildListingUnavailableEmail({ ...UNAVAILABLE_BASE, noun: 'partnership' })
  assert.match(text, /filled or taken down/)
  assert.match(text, /buy-in drop/)
  assert.doesNotMatch(text, /sold or taken off the market/)
  assert.doesNotMatch(text, /Browse similar aircraft/)
  assert.match(text, /Browse similar partnerships/)
  assert.match(html, /Browse similar partnerships/)
})

test('buildListingUnavailableEmail: omitting noun stays byte-for-byte the original aircraft copy', () => {
  const withNoun = buildListingUnavailableEmail({ ...UNAVAILABLE_BASE, noun: 'aircraft' })
  const withoutNoun = buildListingUnavailableEmail(UNAVAILABLE_BASE)
  assert.equal(withNoun.html, withoutNoun.html)
  assert.equal(withNoun.text, withoutNoun.text)
})

// ─── buildWidenSuggestionEmail (one-time never-matched-alert nudge) ────────

const WIDEN_BASE = {
  context: 'Cessna 152 in Montana',
  widenDescription: 'Search every state',
  widenCount: 42,
  widenNoun: 'listing' as const,
  manageUrl: 'https://clubhanger.com/alerts/manage?token=xyz',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('buildWidenSuggestionEmail: subject names the alert context and asks to widen', () => {
  const { subject } = buildWidenSuggestionEmail(WIDEN_BASE)
  assert.equal(subject, "Cessna 152 in Montana hasn't matched anything yet — widen it?")
})

test('buildWidenSuggestionEmail: falls back to generic "Your alert" subject when context is null/empty', () => {
  assert.equal(
    buildWidenSuggestionEmail({ ...WIDEN_BASE, context: null }).subject,
    "Your alert hasn't matched anything yet — widen it?"
  )
  assert.equal(
    buildWidenSuggestionEmail({ ...WIDEN_BASE, context: '  ' }).subject,
    "Your alert hasn't matched anything yet — widen it?"
  )
})

test('buildWidenSuggestionEmail: renders the real widen description and count, never a fabricated fix', () => {
  const { html, text } = buildWidenSuggestionEmail(WIDEN_BASE)
  assert.match(html, /Search every state/)
  assert.match(html, /42 listings/)
  assert.match(text, /Search every state/)
  assert.match(text, /42 listings/)
})

test('buildWidenSuggestionEmail: singular noun has no trailing "s"', () => {
  const { text } = buildWidenSuggestionEmail({ ...WIDEN_BASE, widenCount: 1, widenNoun: 'pilot' })
  assert.match(text, /1 pilot right now/)
  assert.doesNotMatch(text, /1 pilots/)
})

test('buildWidenSuggestionEmail: manage and unsubscribe links appear in both html and text; unsubscribeUrl stays byte-exact', () => {
  const { html, text } = buildWidenSuggestionEmail(WIDEN_BASE)
  assert.ok(text.includes(WIDEN_BASE.unsubscribeUrl))
  assert.ok(html.includes(WIDEN_BASE.unsubscribeUrl))
  assert.match(html, /alerts\/manage\?token=xyz&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=widen/)
  assert.match(text, /alerts\/manage\?token=xyz&utm_source=alert_email&utm_medium=email&utm_campaign=widen/)
})

test('buildWidenSuggestionEmail: context and widen description are HTML-escaped', () => {
  const { html } = buildWidenSuggestionEmail({
    ...WIDEN_BASE,
    context: 'Cessna <script>alert(1)</script>',
  })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

// ─── buildAlertZeroMatchWelcomeEmail (confirm-time zero-match welcome) ─────

const ZERO_MATCH_BASE = {
  context: 'Cessna 152 in Montana',
  frequency: 'weekly' as const,
  manageUrl: 'https://clubhanger.com/alerts/manage?token=xyz',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('buildAlertZeroMatchWelcomeEmail: subject names the alert context and confirms', () => {
  const { subject } = buildAlertZeroMatchWelcomeEmail(ZERO_MATCH_BASE)
  assert.equal(subject, "Cessna 152 in Montana is confirmed — we're watching")
})

test('buildAlertZeroMatchWelcomeEmail: falls back to generic "Your alert" subject when context is null/empty', () => {
  assert.equal(
    buildAlertZeroMatchWelcomeEmail({ ...ZERO_MATCH_BASE, context: null }).subject,
    "Your alert is confirmed — we're watching"
  )
})

test('buildAlertZeroMatchWelcomeEmail: names the real cadence, never claims "instant"', () => {
  const { html, text } = buildAlertZeroMatchWelcomeEmail({ ...ZERO_MATCH_BASE, frequency: 'daily' })
  assert.match(html, /checks run daily/)
  assert.match(text, /checks run daily/)
  assert.doesNotMatch(html, /instant/i)
})

test('buildAlertZeroMatchWelcomeEmail: without a widen candidate, renders no widen section — never a guess', () => {
  const { html, text } = buildAlertZeroMatchWelcomeEmail({ ...ZERO_MATCH_BASE, widen: null })
  assert.doesNotMatch(html, /Widen this alert/)
  assert.doesNotMatch(text, /In the meantime/)
})

test('buildAlertZeroMatchWelcomeEmail: with a widen candidate, renders the real description/count/link', () => {
  const { html, text } = buildAlertZeroMatchWelcomeEmail({
    ...ZERO_MATCH_BASE,
    widen: {
      description: 'Search every state',
      count: 42,
      noun: 'listing',
      url: 'https://clubhanger.com/aircraft?make=Cessna',
    },
  })
  assert.match(html, /Search every state/)
  assert.match(html, /42 listings/)
  assert.match(html, /Widen this alert/)
  assert.match(text, /Search every state/)
  assert.match(text, /42 listings/)
})

test('buildAlertZeroMatchWelcomeEmail: singular widen noun has no trailing "s"', () => {
  const { text } = buildAlertZeroMatchWelcomeEmail({
    ...ZERO_MATCH_BASE,
    widen: { description: 'Search every state', count: 1, noun: 'pilot', url: 'https://clubhanger.com/partnerships' },
  })
  assert.match(text, /1 pilot right now/)
  assert.doesNotMatch(text, /1 pilots/)
})

test('buildAlertZeroMatchWelcomeEmail: manage and unsubscribe links appear in both html and text; unsubscribeUrl stays byte-exact', () => {
  const { html, text } = buildAlertZeroMatchWelcomeEmail(ZERO_MATCH_BASE)
  assert.ok(text.includes(ZERO_MATCH_BASE.unsubscribeUrl))
  assert.ok(html.includes(ZERO_MATCH_BASE.unsubscribeUrl))
  assert.match(html, /alerts\/manage\?token=xyz&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=confirm/)
})

test('buildAlertZeroMatchWelcomeEmail: context is HTML-escaped', () => {
  const { html } = buildAlertZeroMatchWelcomeEmail({
    ...ZERO_MATCH_BASE,
    context: 'Cessna <script>alert(1)</script>',
  })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

// ─── UTM attribution on alert-email site-page links ────────────────────────
// Site-page links (listing cards, "View all matches", manage link) carry
// utm_source=alert_email&utm_medium=email&utm_campaign=<confirm|digest|price_drop|combined>
// so a visit from an alert email is attributable. Token-scoped /api/alerts/*
// redirect links (confirm/unsubscribe/frequency) must never be touched — their
// tokens have to stay byte-exact for the route to resolve them.

test('price drop: listingUrl and manageUrl carry utm_campaign=price_drop; unsubscribeUrl/frequencyUrl stay byte-exact', () => {
  const { html, text } = buildPriceDropEmail({
    ...BASE,
    photoUrl: null,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz',
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\/listing\/abc\?utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=price_drop"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/manage\?utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=price_drop"/)
  assert.match(text, /View listing: https:\/\/clubhanger\.com\/aircraft\/listing\/abc\?utm_source=alert_email&utm_medium=email&utm_campaign=price_drop/)
  assert.match(text, /Manage alerts: https:\/\/clubhanger\.com\/alerts\/manage\?utm_source=alert_email&utm_medium=email&utm_campaign=price_drop/)
  // token links untouched
  assert.ok(html.includes(BASE.unsubscribeUrl))
  assert.ok(text.includes('https://clubhanger.com/api/alerts/frequency?token=xyz'))
  assert.doesNotMatch(text, /frequency\?token=xyz&utm_/)
  assert.doesNotMatch(text, /unsubscribe\?token=xyz&utm_/)
})

test('digest: listingsUrl, manageUrl, and sample urls carry utm_campaign=digest, preserving existing query params; unsubscribeUrl/frequencyUrl stay byte-exact', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz',
    samples: [
      {
        title: '2015 Cessna 172S Skyhawk',
        photoUrl: null,
        isPlaceholder: false,
        year: 2015,
        ttaf: 1240,
        location: 'Austin, TX',
        price: 219_000,
        url: 'https://clubhanger.com/aircraft/listing/abc',
      },
    ],
  })
  // existing ?make=Cessna&model=172 is preserved alongside the new utm_ params
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\?make=Cessna&amp;model=172&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=digest"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/manage\?utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=digest"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\/listing\/abc\?utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=digest"/)
  assert.doesNotMatch(text, /unsubscribe\?token=xyz&utm_/)
  assert.doesNotMatch(text, /frequency\?token=xyz&utm_/)
})

test('confirm: manageUrl and preview sample urls carry utm_campaign=confirm; confirmUrl/unsubscribeUrl stay byte-exact', () => {
  const { html, text } = buildAlertConfirmEmail({
    ...CONFIRM_BASE,
    preview: {
      count: 1,
      samples: [
        {
          title: '2015 Cessna 172S Skyhawk',
          photoUrl: null,
          isPlaceholder: false,
          year: 2015,
          ttaf: 1240,
          location: 'Austin, TX',
          price: 219_000,
          url: 'https://clubhanger.com/aircraft/listing/abc',
        },
      ],
    },
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/manage\?token=xyz&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=confirm"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\/listing\/abc\?utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=confirm"/)
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/confirm\?token=abc"/)
  assert.match(text, /Confirm your email: https:\/\/clubhanger\.com\/api\/alerts\/confirm\?token=abc/)
  assert.match(text, /Unsubscribe: https:\/\/clubhanger\.com\/api\/alerts\/unsubscribe\?token=xyz$/)
})

test('combined: sample card urls carry utm_campaign=combined', () => {
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
            url: 'https://clubhanger.com/aircraft/listing/abc',
          },
        ],
      },
    ],
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\/listing\/abc\?utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=combined"/)
})

// ─── preheader (hidden inbox-preview text) ─────────────────────────────────

test('price-drop: preheader is a hidden div right after <body>, phrased from the real pct/prices', () => {
  const { html } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  const bodyIdx = html.indexOf('<body')
  const preheaderIdx = html.indexOf('display:none')
  assert.ok(preheaderIdx > bodyIdx && preheaderIdx - bodyIdx < 200, 'preheader div sits immediately after <body>')
  assert.match(html, /display:none[^>]*>10% price drop — 2013 Cessna 172S Skyhawk now \$180,000 \(was \$200,000\)\./)
})

test('price-drop: preheader honors a custom dropNoun (partnership buy-in drops)', () => {
  const { html } = buildPriceDropEmail({ ...BASE, photoUrl: null, dropNoun: 'buy-in drop' })
  assert.match(html, /display:none[^>]*>10% buy-in drop — 2013 Cessna 172S Skyhawk now \$180,000 \(was \$200,000\)\./)
})

test('digest: preheader names the real new/drop counts, matching the visible body copy', () => {
  const { html } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 1 })
  assert.match(html, /display:none[^>]*>There are 2 new listings \+ 1 price drop matching your Cessna 172 alert on ClubHanger this week\./)
})

test('digest: sample-send preheader uses "current match(es)" framing, not "this week"', () => {
  const { html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    sampleNote: 'your real weekly digest arrives automatically when there is a genuine match.',
  })
  assert.match(html, /display:none[^>]*>1 current match for your Cessna 172 alert right now\./)
})

test('combined: preheader states the real overall total across all sections', () => {
  const { html } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 2, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
      { context: 'Piper Cherokee', newCount: 0, dropCount: 1, listingsUrl: 'https://clubhanger.com/aircraft?make=Piper' },
    ],
  })
  assert.match(html, /display:none[^>]*>2 new listings \+ 1 price drop across your 2 alerts on ClubHanger\./)
})

test('confirm: preheader names the real live match count when a preview was passed', () => {
  const { html } = buildAlertConfirmEmail({
    ...CONFIRM_BASE,
    preview: { count: 3, samples: [] },
  })
  assert.match(html, /display:none[^>]*>3 listings match right now — confirm to start getting alerts for new Cessna 172 listings\./)
})

test('confirm: preheader is honest ("you\'ll be first to know") for a real zero-match preview, never a fabricated count', () => {
  const { html } = buildAlertConfirmEmail({ ...CONFIRM_BASE, preview: { count: 0, samples: [] } })
  assert.match(html, /display:none[^>]*>Confirm to start getting alerts for new Cessna 172 listings — you'll be first to know when one matches\./)
})

test('confirm: preheader falls back to generic copy with no preview passed at all', () => {
  const { html } = buildAlertConfirmEmail(CONFIRM_BASE)
  assert.match(html, /display:none[^>]*>One click to start getting alerts for new Cessna 172 listings\./)
})

test('preheader special characters are HTML-escaped, not double-escaped', () => {
  const { html } = buildAlertDigestEmail({ ...DIGEST_BASE, context: 'Cessna & Piper', newCount: 1, dropCount: 0 })
  assert.match(html, /display:none[^>]*>There is 1 new listing matching your Cessna &amp; Piper alert on ClubHanger this week\./)
  assert.doesNotMatch(html, /&amp;amp;/)
})

test('the text part of every builder stays byte-identical — preheader is an HTML-only concept', () => {
  const price = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.doesNotMatch(price.text, /display:none/)

  const digest = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 1 })
  assert.doesNotMatch(digest.text, /display:none/)

  const combined = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
    sections: [{ context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' }],
  })
  assert.doesNotMatch(combined.text, /display:none/)

  const confirm = buildAlertConfirmEmail(CONFIRM_BASE)
  assert.doesNotMatch(confirm.text, /display:none/)
})

// ─── dark-mode-safe emails ──────────────────────────────────────────────────

const DARK_MODE_META = /<meta name="color-scheme" content="light dark">/
const DARK_MODE_QUERY = /@media \(prefers-color-scheme: dark\)/

test('every HTML email builder opts into light+dark color-scheme support', () => {
  const htmls: string[] = [
    buildPriceDropEmail({ ...BASE, photoUrl: null }).html,
    buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 1 }).html,
    buildCombinedAlertDigestEmail({
      manageUrl: 'https://clubhanger.com/alerts/manage',
      unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
      sections: [{ context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' }],
    }).html,
    buildAlertConfirmEmail(CONFIRM_BASE).html,
    buildListingUnavailableEmail(UNAVAILABLE_BASE).html,
    buildWidenSuggestionEmail(WIDEN_BASE).html,
    buildAlertZeroMatchWelcomeEmail(ZERO_MATCH_BASE).html,
    buildManageLinkEmail({ manageUrl: 'https://clubhanger.com/alerts/manage?token=xyz' }).html,
    buildAlertEmailChangeConfirmEmail({
      oldEmail: 'old@example.com',
      confirmUrl: 'https://clubhanger.com/api/alerts/confirm-email-change?token=abc',
    }).html,
    buildNewMessageEmail({ threadUrl: 'https://clubhanger.com/messages/thread-1' }).html,
    buildSeedInquiryEmail({
      personaName: 'Wei C.',
      listingTitle: '2004 Cessna 172S Skyhawk',
      listingUrl: 'https://clubhanger.com/partnerships/seeking/seek-2',
      threadUrl: 'https://clubhanger.com/messages/thread-2',
      inquirerEmail: 'buyer@example.com',
      body: 'Interested in your listing.',
    }).html,
    buildMatchAlertEmail({
      listingLabel: 'your 2004 Cessna 172S Skyhawk partnership',
      otherSideLabel: 'pilots seeking a partnership',
      count: 2,
      matchesUrl: 'https://clubhanger.com/partnerships/p-1',
    }).html,
  ]

  for (const html of htmls) {
    assert.match(html, DARK_MODE_META, 'missing color-scheme meta tag')
    assert.match(html, /<meta name="supported-color-schemes" content="light dark">/, 'missing supported-color-schemes meta tag')
    assert.match(html, DARK_MODE_QUERY, 'missing prefers-color-scheme: dark media query')
    assert.match(html, /class="ch-body"/, 'body missing ch-body class')
  }
})

test('the text part of every builder is unaffected by the dark-mode head (HTML-only concept)', () => {
  const { text } = buildAlertConfirmEmail(CONFIRM_BASE)
  assert.doesNotMatch(text, /color-scheme/)
  assert.doesNotMatch(text, /ch-body/)
})
