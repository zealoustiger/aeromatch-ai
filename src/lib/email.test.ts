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
  buildListingBackOnMarketEmail,
  buildWidenSuggestionEmail,
  buildRepermissionEmail,
  buildAlertZeroMatchWelcomeEmail,
  buildListUnsubscribeHeaders,
  pickBestPriceDropSample,
  buildManageLinkEmail,
  buildAlertEmailChangeConfirmEmail,
  buildNewMessageEmail,
  buildSeedInquiryEmail,
  buildMatchAlertEmail,
  buildAdminAlertFunnelEmail,
  compLabel,
  isRetriableStatus,
  parseRetryAfterMs,
  planEmailRetry,
  withEmailRetry,
  MAX_SEND_ATTEMPTS,
  RETRY_BASE_MS,
  RETRY_MAX_MS,
} from './email.ts'
import type { AlertFunnelWeeklySnapshot } from './alertFunnelWeekly.ts'

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

test('price-drop: without snoozeUrl, no "Snooze 30 days" link renders', () => {
  const { html, text } = buildPriceDropEmail({ ...BASE, photoUrl: null })
  assert.doesNotMatch(html, /Snooze 30 days/)
  assert.doesNotMatch(text, /Snooze 30 days/)
})

test('price-drop: with snoozeUrl, the footer adds a "Snooze 30 days" link (HTML + text)', () => {
  const { html, text } = buildPriceDropEmail({
    ...BASE,
    photoUrl: null,
    snoozeUrl: 'https://clubhanger.com/api/alerts/snooze?token=xyz',
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz"[^>]*>Snooze 30 days<\/a>/)
  assert.match(text, /Snooze 30 days: https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz/)
})

test('price-drop: with both frequencyUrl and snoozeUrl, both footer links render alongside each other', () => {
  const { html, text } = buildPriceDropEmail({
    ...BASE,
    photoUrl: null,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz',
    snoozeUrl: 'https://clubhanger.com/api/alerts/snooze?token=xyz',
  })
  assert.match(html, /Get fewer emails<\/a> &middot; <a href="https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz"[^>]*>Snooze 30 days<\/a>/)
  assert.match(text, /Get fewer emails \(switch to weekly\): https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz\nSnooze 30 days: https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz/)
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

test('digest: without periodLabel, the HTML body copy + hidden preheader both default to "this week" (byte-exact, no regression)', () => {
  const { html } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 1 })
  assert.match(html, /There are 2 new listings \+ 1 price drop matching your Cessna 172 alert on ClubHanger this week\./)
  assert.match(html, /display:none[^>]*>There are 2 new listings \+ 1 price drop matching your Cessna 172 alert on ClubHanger this week\./)
})

test('digest: periodLabel overrides "this week" in both the visible HTML body copy and the hidden preheader (e.g. "yesterday" for a daily alert)', () => {
  const { html } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 2, dropCount: 1, periodLabel: 'yesterday' })
  assert.match(html, /There are 2 new listings \+ 1 price drop matching your Cessna 172 alert on ClubHanger yesterday\./)
  assert.match(html, /display:none[^>]*>There are 2 new listings \+ 1 price drop matching your Cessna 172 alert on ClubHanger yesterday\./)
  assert.doesNotMatch(html, /this week/)
})

test('digest: periodLabel "this month" for a monthly alert', () => {
  const { html } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0, periodLabel: 'this month' })
  assert.match(html, /There is 1 new listing matching your Cessna 172 alert on ClubHanger this month\./)
})

test('digest: periodLabel is ignored for sample/firstSend framing (those never claim a time window)', () => {
  const { text: sampleText } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    periodLabel: 'yesterday',
    sampleNote: 'a preview',
  })
  assert.doesNotMatch(sampleText, /yesterday/)
  assert.match(sampleText, /1 current match/)

  const { text: firstSendText } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    periodLabel: 'yesterday',
    firstSend: true,
  })
  assert.doesNotMatch(firstSendText, /yesterday/)
  assert.match(firstSendText, /1 match right now/)
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

test('digest: with frequencyUrl + frequencyTarget "monthly" (weekly alert), the footer names monthly not weekly', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz&dir=monthly',
    frequencyTarget: 'monthly',
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz&amp;dir=monthly"[^>]*>Get fewer emails<\/a>/)
  assert.match(text, /Get fewer emails \(switch to monthly\): https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz&dir=monthly/)
})

test('digest: without snoozeUrl, no "Snooze 30 days" link renders', () => {
  const { html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0 })
  assert.doesNotMatch(html, /Snooze 30 days/)
  assert.doesNotMatch(text, /Snooze 30 days/)
})

test('digest: with snoozeUrl, the footer adds a "Snooze 30 days" link (HTML + text)', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    snoozeUrl: 'https://clubhanger.com/api/alerts/snooze?token=xyz',
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz"[^>]*>Snooze 30 days<\/a>/)
  assert.match(text, /Snooze 30 days: https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz/)
})

test('digest: with both frequencyUrl and snoozeUrl, both footer links render alongside each other', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz',
    snoozeUrl: 'https://clubhanger.com/api/alerts/snooze?token=xyz',
  })
  assert.match(html, /Get fewer emails<\/a> &middot; <a href="https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz"[^>]*>Snooze 30 days<\/a>/)
  assert.match(text, /Get fewer emails \(switch to weekly\): https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz\nSnooze 30 days: https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=xyz/)
})

test('digest: with shareUrl, a "Buying with a partner? Share this alert" line renders (HTML + text)', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    shareUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172&share=alert',
  })
  assert.match(
    html,
    /Buying with a partner\? <a href="https:\/\/clubhanger\.com\/aircraft\?make=Cessna&amp;model=172&amp;share=alert"[^>]*>Share this alert<\/a>/
  )
  assert.match(
    text,
    /Buying with a partner\? Share this alert: https:\/\/clubhanger\.com\/aircraft\?make=Cessna&model=172&share=alert/
  )
})

test('digest: without shareUrl, no "Share this alert" line renders (no source_path to share)', () => {
  const { html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0 })
  assert.doesNotMatch(html, /Share this alert/)
  assert.doesNotMatch(text, /Share this alert/)
})

test('digest: with viewUrl, a "View in browser" link renders (HTML + text)', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    viewUrl: 'https://clubhanger.com/alerts/digest/view?token=xyz',
  })
  assert.match(
    html,
    /href="https:\/\/clubhanger\.com\/alerts\/digest\/view\?token=xyz&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=digest"[^>]*>View in browser</
  )
  assert.match(
    text,
    /^View in browser: https:\/\/clubhanger\.com\/alerts\/digest\/view\?token=xyz&utm_source=alert_email&utm_medium=email&utm_campaign=digest\n/
  )
})

test('digest: without viewUrl, no "View in browser" link renders', () => {
  const { html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0 })
  assert.doesNotMatch(html, /View in browser/)
  assert.doesNotMatch(text, /View in browser/)
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

test('digest: with digestFeedbackBaseUrl and a sample id, a per-sample "Not relevant?" link renders (HTML + text)', () => {
  const { html, text } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    digestFeedbackBaseUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=xyz',
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
        id: 'abc',
        type: 'aircraft',
      },
    ],
  })
  assert.match(html, /Not relevant\?/)
  assert.match(
    html,
    /href="https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=xyz&amp;listing=abc&amp;type=aircraft&amp;title=2015%20Cessna%20172S%20Skyhawk"/
  )
  assert.match(
    text,
    /Not relevant\? https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=xyz&listing=abc&type=aircraft&title=2015%20Cessna%20172S%20Skyhawk/
  )
})

test('digest: without digestFeedbackBaseUrl, no "Not relevant?" link renders even with sample ids', () => {
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
        id: 'abc',
        type: 'aircraft',
      },
    ],
  })
  assert.doesNotMatch(html, /Not relevant\?/)
  assert.doesNotMatch(text, /Not relevant\?/)
})

test('digest: with digestFeedbackBaseUrl but no sample id, no "Not relevant?" link renders for that sample', () => {
  const { html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    digestFeedbackBaseUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=xyz',
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
  assert.doesNotMatch(html, /Not relevant\?/)
})

test('combined digest: with digestFeedbackBaseUrl, each section\'s sample gets its own "Not relevant?" link', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    digestFeedbackBaseUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=a',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172',
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
            id: 'abc',
            type: 'aircraft',
          },
        ],
      },
    ],
  })
  assert.match(html, /Not relevant\?/)
  assert.match(html, /listing=abc&amp;type=aircraft/)
  assert.match(text, /Not relevant\? https:\/\/clubhanger\.com\/api\/alerts\/digest-feedback\?token=a&listing=abc&type=aircraft/)
})

test('digest: no "just reply" footer line when ALERTS_REPLY_TO is unset', () => {
  delete process.env.ALERTS_REPLY_TO
  const { html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0 })
  assert.doesNotMatch(html, /Just reply to this email/)
  assert.doesNotMatch(text, /Just reply to this email/)
})

test('digest: "just reply" footer line renders in both HTML and text when ALERTS_REPLY_TO is set', () => {
  process.env.ALERTS_REPLY_TO = 'support@clubhanger.com'
  try {
    const { html, text } = buildAlertDigestEmail({ ...DIGEST_BASE, newCount: 1, dropCount: 0 })
    assert.match(html, /Question about a listing\? Just reply to this email\./)
    assert.match(text, /Question about a listing\? Just reply to this email\./)
  } finally {
    delete process.env.ALERTS_REPLY_TO
  }
})

test('combined digest: no "just reply" footer line when ALERTS_REPLY_TO is unset', () => {
  delete process.env.ALERTS_REPLY_TO
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172' },
    ],
  })
  assert.doesNotMatch(html, /Just reply to this email/)
  assert.doesNotMatch(text, /Just reply to this email/)
})

test('combined digest: "just reply" footer line renders in both HTML and text when ALERTS_REPLY_TO is set', () => {
  process.env.ALERTS_REPLY_TO = 'support@clubhanger.com'
  try {
    const { html, text } = buildCombinedAlertDigestEmail({
      manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
      unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
      sections: [
        { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172' },
      ],
    })
    assert.match(html, /Question about a listing\? Just reply to this email\./)
    assert.match(text, /Question about a listing\? Just reply to this email\./)
  } finally {
    delete process.env.ALERTS_REPLY_TO
  }
})

test('digest: sample cards never nest the "Not relevant?" link inside the card\'s own <a> (invalid HTML)', () => {
  const { html } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 1,
    dropCount: 0,
    digestFeedbackBaseUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=xyz',
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
        id: 'abc',
        type: 'aircraft',
      },
    ],
  })
  const cardAnchorClose = html.indexOf('</a>')
  const notRelevantIndex = html.indexOf('Not relevant?')
  assert.ok(cardAnchorClose > -1 && notRelevantIndex > cardAnchorClose)
})

test('digest: sample card renders a "Watch this listing" link when watchUrl is set, never nested in the card\'s own <a>', () => {
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
        id: 'abc',
        type: 'aircraft',
        watchUrl: 'https://clubhanger.com/api/alerts/digest-cross-sell?token=xyz&path=%2Faircraft%2Flisting%2Fabc&source=digest_sample_watch&context=2015%20Cessna%20172S%20Skyhawk',
      },
    ],
  })
  const cardAnchorClose = html.indexOf('</a>')
  const watchIndex = html.indexOf('Watch this listing')
  assert.ok(cardAnchorClose > -1 && watchIndex > cardAnchorClose)
  assert.match(html, /https:\/\/clubhanger\.com\/api\/alerts\/digest-cross-sell\?token=xyz&amp;path=%2Faircraft%2Flisting%2Fabc&amp;source=digest_sample_watch/)
  assert.match(text, /Watch this listing: https:\/\/clubhanger\.com\/api\/alerts\/digest-cross-sell\?token=xyz&path=%2Faircraft%2Flisting%2Fabc&source=digest_sample_watch/)
})

test('digest: sample card renders no "Watch this listing" link when watchUrl is absent', () => {
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
        id: 'abc',
        type: 'aircraft',
      },
    ],
  })
  assert.doesNotMatch(html, /Watch this listing/)
  assert.doesNotMatch(text, /Watch this listing/)
})

test('combined digest: sample card renders a "Watch this listing" link when a section sample carries watchUrl', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172',
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
            id: 'abc',
            type: 'aircraft',
            watchUrl: 'https://clubhanger.com/api/alerts/digest-cross-sell?token=a&path=%2Faircraft%2Flisting%2Fabc&source=digest_sample_watch&context=2015%20Cessna%20172S%20Skyhawk',
          },
        ],
      },
    ],
  })
  assert.match(html, /Watch this listing/)
  assert.match(text, /Watch this listing: https:\/\/clubhanger\.com\/api\/alerts\/digest-cross-sell/)
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

test('price drop: with frequencyUrl + frequencyTarget "monthly" (weekly alert), the footer names monthly not weekly', () => {
  const { html, text } = buildPriceDropEmail({
    ...BASE,
    photoUrl: null,
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=xyz&dir=monthly',
    frequencyTarget: 'monthly',
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz&amp;dir=monthly"[^>]*>Get fewer emails<\/a>/)
  assert.match(text, /Get fewer emails \(switch to monthly\): https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=xyz&dir=monthly/)
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

// ─── Gmail-clipping byte-budget guard ──────────────────────────────────────

const DIGEST_BUDGET_BYTES = 100 * 1024 // matches email.ts's DIGEST_HTML_BYTE_BUDGET

const bigDigestSamples = (n: number, prefix = 'a') =>
  Array.from({ length: n }, (_, i) => ({
    title: `2015 Cessna 172S Skyhawk #${prefix}-${i} — a long descriptive title padding the card out`,
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cessna-photo-url-padding-example.jpg',
    isPlaceholder: false,
    year: 2015,
    ttaf: 1240,
    location: 'Austin, TX',
    price: 219_000,
    url: `https://clubhanger.com/aircraft/listing/${prefix}-${i}`,
    compLabel: '~12% below avg · $52k median · 8 comps',
    compBelowAvg: true,
  }))

test('digest: a normal-size digest never trims (byte-identical to the un-guarded core)', () => {
  const { html, trimmedSamples } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: 3,
    dropCount: 0,
    samples: bigDigestSamples(1),
  })
  assert.equal(trimmedSamples, undefined)
  assert.ok(Buffer.byteLength(html, 'utf8') < DIGEST_BUDGET_BYTES)
})

test('digest: an oversized sample set is trimmed until the HTML fits under the Gmail clip budget', () => {
  const total = 80
  const { html, text, trimmedSamples } = buildAlertDigestEmail({
    ...DIGEST_BASE,
    newCount: total,
    dropCount: 0,
    samples: bigDigestSamples(total),
  })
  assert.ok(
    Buffer.byteLength(html, 'utf8') <= DIGEST_BUDGET_BYTES,
    `expected html <= ${DIGEST_BUDGET_BYTES} bytes, got ${Buffer.byteLength(html, 'utf8')}`
  )
  assert.ok(typeof trimmedSamples === 'number' && trimmedSamples > 0)
  // The count/CTA stay honest to the real total even though fewer cards render.
  assert.match(html, />\s*See all Cessna 172 matches\s*</)
  assert.match(text, /80 new listings/)
})

test('combined: an oversized section is trimmed fairly (heaviest section first), other sections untouched', () => {
  const { html, trimmedSamples } = buildCombinedAlertDigestEmail({
    sections: [
      {
        context: 'Cessna 172',
        newCount: 80,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172',
        samples: bigDigestSamples(80, 'a'),
      },
      {
        context: 'Cirrus SR22',
        newCount: 5,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus&model=SR22',
        samples: bigDigestSamples(5, 'b'),
      },
    ],
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
  })
  assert.ok(
    Buffer.byteLength(html, 'utf8') <= DIGEST_BUDGET_BYTES,
    `expected html <= ${DIGEST_BUDGET_BYTES} bytes, got ${Buffer.byteLength(html, 'utf8')}`
  )
  assert.ok(typeof trimmedSamples === 'number' && trimmedSamples > 0)
  // Both sections' honest totals still name the real count, and the lighter
  // Cirrus section (5 samples) never lost a card to the heavier Cessna one.
  assert.match(html, /Cirrus SR22/)
  const cirrusCards = html.match(/listing\/b-\d+/g) ?? []
  assert.equal(cirrusCards.length, 5)
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

test('combined: with a frequencyUrl, a "Get fewer emails" footer link renders (ladder parity with the single-alert digest)', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    frequencyUrl: 'https://clubhanger.com/api/alerts/frequency?token=a,b&dir=step',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=a,b&amp;dir=step"[^>]*>Get fewer emails</)
  assert.match(text, /Get fewer emails: https:\/\/clubhanger\.com\/api\/alerts\/frequency\?token=a,b&dir=step/)
})

test('combined: without a frequencyUrl, no "Get fewer emails" link renders (every covered alert already monthly)', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
  })
  assert.doesNotMatch(html, /Get fewer emails/)
  assert.doesNotMatch(text, /Get fewer emails/)
})

test('combined: with a snoozeUrl, a "Snooze 30 days" footer link renders (HTML + text)', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    snoozeUrl: 'https://clubhanger.com/api/alerts/snooze?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
      { context: 'Cirrus SR22', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus' },
    ],
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=a,b"[^>]*>Snooze 30 days</)
  assert.match(text, /Snooze 30 days: https:\/\/clubhanger\.com\/api\/alerts\/snooze\?token=a,b/)
})

test('combined: without a snoozeUrl, no "Snooze 30 days" link renders', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
    ],
  })
  assert.doesNotMatch(html, /Snooze 30 days/)
  assert.doesNotMatch(text, /Snooze 30 days/)
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

test('combined: a section with its own shareUrl renders a per-section "Share this alert" link', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna',
        shareUrl: 'https://clubhanger.com/aircraft?make=Cessna&share=alert',
      },
      {
        context: 'Cirrus SR22',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus',
      },
    ],
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/aircraft\?make=Cessna&amp;share=alert"[^>]*>Share this alert</)
  assert.equal((html.match(/Share this alert/g) ?? []).length, 1)
  assert.match(text, /Share this alert: https:\/\/clubhanger\.com\/aircraft\?make=Cessna&share=alert/)
})

test('combined: a section with no shareUrl renders no per-section share link', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
    ],
  })
  assert.doesNotMatch(html, /Share this alert/)
  assert.doesNotMatch(text, /Share this alert/)
})

test('combined: a section with its own viewUrl renders a per-section "View in browser" link', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna',
        viewUrl: 'https://clubhanger.com/alerts/digest/view?token=a',
      },
      {
        context: 'Cirrus SR22',
        newCount: 1,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus',
      },
    ],
  })
  assert.match(html, /href="https:\/\/clubhanger\.com\/alerts\/digest\/view\?token=a"[^>]*>View in browser</)
  assert.equal((html.match(/View in browser/g) ?? []).length, 1)
  assert.match(text, /View in browser: https:\/\/clubhanger\.com\/alerts\/digest\/view\?token=a/)
})

test('combined: a section with no viewUrl renders no per-section view-in-browser link', () => {
  const { html, text } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=a',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=a,b',
    sections: [
      { context: 'Cessna 172', newCount: 1, dropCount: 0, listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna' },
    ],
  })
  assert.doesNotMatch(html, /View in browser/)
  assert.doesNotMatch(text, /View in browser/)
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

test('confirm: renders the deliverability nudge (Primary tab / add to contacts) in both html and text, below the confirm button', () => {
  const { html, text } = buildAlertConfirmEmail(CONFIRM_BASE)
  assert.match(html, /Drag this one to your Primary tab or add us to your\s*\n?\s*contacts/)
  const confirmIdx = html.indexOf('Confirm my alerts')
  const nudgeIdx = html.indexOf('Primary tab')
  assert.ok(nudgeIdx > confirmIdx, 'deliverability nudge renders below the confirm button')
  assert.match(text, /Can't find our emails later\? Drag this one to your Primary tab/)
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

test('buildListingUnavailableEmail: omitting crossSell renders no upgrade CTA', () => {
  const { html, text } = buildListingUnavailableEmail(UNAVAILABLE_BASE)
  assert.doesNotMatch(html, /Yes, alert me too/)
  assert.doesNotMatch(text, /Yes, alert me too/)
})

test('buildListingUnavailableEmail: crossSell renders the one-tap "similar family" upgrade in both html and text', () => {
  const { html, text } = buildListingUnavailableEmail({
    ...UNAVAILABLE_BASE,
    crossSell: {
      label: 'Also want alerts for every Cessna 172 listing? 5 matches now.',
      acceptUrl: 'https://clubhanger.com/api/alerts/digest-cross-sell?token=xyz&context=Cessna+172&path=%2Faircraft%3Fmake%3DCessna&source=watch_unavailable_email',
    },
  })
  assert.match(html, /Yes, alert me too/)
  assert.match(html, /Also want alerts for every Cessna 172 listing\? 5 matches now\./)
  assert.ok(html.includes('https://clubhanger.com/api/alerts/digest-cross-sell?token=xyz&amp;context=Cessna+172&amp;path=%2Faircraft%3Fmake%3DCessna&amp;source=watch_unavailable_email'))
  assert.match(text, /Also want alerts for every Cessna 172 listing\? 5 matches now\./)
  assert.ok(text.includes('https://clubhanger.com/api/alerts/digest-cross-sell?token=xyz&context=Cessna+172&path=%2Faircraft%3Fmake%3DCessna&source=watch_unavailable_email'))
})

test('buildListingUnavailableEmail: crossSell label is HTML-escaped', () => {
  const { html } = buildListingUnavailableEmail({
    ...UNAVAILABLE_BASE,
    crossSell: { label: '<script>alert(1)</script>', acceptUrl: 'https://clubhanger.com/api/alerts/digest-cross-sell?token=xyz' },
  })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

// ─── buildListingBackOnMarketEmail (resumed watch-alert notice) ────────────

const BACK_ON_MARKET_BASE = {
  title: '2013 Cessna 172S Skyhawk',
  listingUrl: 'https://clubhanger.com/aircraft/listing/abc123',
  manageUrl: 'https://clubhanger.com/alerts/manage',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('buildListingBackOnMarketEmail: subject names the listing as back on the market', () => {
  const { subject } = buildListingBackOnMarketEmail(BACK_ON_MARKET_BASE)
  assert.equal(subject, '2013 Cessna 172S Skyhawk is back on the market')
})

test('buildListingBackOnMarketEmail: says the watch was resumed, not just "browse similar"', () => {
  const { html, text } = buildListingBackOnMarketEmail(BACK_ON_MARKET_BASE)
  assert.match(text, /resumed watching it for you/)
  assert.match(html, /resumed watching it for you/)
  assert.doesNotMatch(text, /Browse similar/)
})

test('buildListingBackOnMarketEmail: listing/manage/unsubscribe links all appear in both html and text', () => {
  const { html, text } = buildListingBackOnMarketEmail(BACK_ON_MARKET_BASE)
  for (const url of [BACK_ON_MARKET_BASE.listingUrl, BACK_ON_MARKET_BASE.manageUrl, BACK_ON_MARKET_BASE.unsubscribeUrl]) {
    assert.ok(text.includes(url), `expected text to include ${url}`)
    assert.ok(html.includes(url), `expected html to include ${url}`)
  }
})

test('buildListingBackOnMarketEmail: listing title is HTML-escaped', () => {
  const { html } = buildListingBackOnMarketEmail({
    ...BACK_ON_MARKET_BASE,
    title: 'Cessna 172 <script>alert(1)</script>',
  })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('buildListingBackOnMarketEmail: noun "partnership" reads buy-in drop, not price drop', () => {
  const { html, text } = buildListingBackOnMarketEmail({ ...BACK_ON_MARKET_BASE, noun: 'partnership' })
  assert.match(text, /buy-in drop/)
  assert.doesNotMatch(text, /price drop/)
  assert.match(html, /buy-in drop/)
})

test('buildListingBackOnMarketEmail: omitting noun stays byte-for-byte the original aircraft copy', () => {
  const withNoun = buildListingBackOnMarketEmail({ ...BACK_ON_MARKET_BASE, noun: 'aircraft' })
  const withoutNoun = buildListingBackOnMarketEmail(BACK_ON_MARKET_BASE)
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

// ─── buildRepermissionEmail (one-time dormant-address re-permission) ───────

const REPERMISSION_BASE = {
  context: 'Cessna 172 in California',
  manageUrl: 'https://clubhanger.com/alerts/manage?token=xyz',
  unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=xyz',
}

test('buildRepermissionEmail: subject names the alert context', () => {
  const { subject } = buildRepermissionEmail(REPERMISSION_BASE)
  assert.equal(subject, 'Still want alerts for Cessna 172 in California?')
})

test('buildRepermissionEmail: falls back to generic "your alert" subject when context is null/empty', () => {
  assert.equal(buildRepermissionEmail({ ...REPERMISSION_BASE, context: null }).subject, 'Still want alerts for your alert?')
  assert.equal(buildRepermissionEmail({ ...REPERMISSION_BASE, context: '  ' }).subject, 'Still want alerts for your alert?')
})

test('buildRepermissionEmail: manage and unsubscribe links appear in both html and text; unsubscribeUrl stays byte-exact', () => {
  const { html, text } = buildRepermissionEmail(REPERMISSION_BASE)
  assert.ok(text.includes(REPERMISSION_BASE.unsubscribeUrl))
  assert.ok(html.includes(REPERMISSION_BASE.unsubscribeUrl))
  assert.match(html, /alerts\/manage\?token=xyz&amp;utm_source=alert_email&amp;utm_medium=email&amp;utm_campaign=repermission/)
  assert.match(text, /alerts\/manage\?token=xyz&utm_source=alert_email&utm_medium=email&utm_campaign=repermission/)
})

test('buildRepermissionEmail: offers a "keep sending" CTA, not a fabricated auto-unsubscribe', () => {
  const { html, text } = buildRepermissionEmail(REPERMISSION_BASE)
  assert.match(html, /Yes, keep sending/)
  assert.match(text, /Unsubscribe:/)
})

test('buildRepermissionEmail: context is HTML-escaped', () => {
  const { html } = buildRepermissionEmail({
    ...REPERMISSION_BASE,
    context: 'Cessna <script>alert(1)</script>',
  })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

// ─── buildAdminAlertFunnelEmail (Monday admin WoW summary) ─────────────────

const ADMIN_FUNNEL_BASE: AlertFunnelWeeklySnapshot = {
  weekStart: '2026-07-11T08:00:00.000Z',
  weekEnd: '2026-07-18T08:00:00.000Z',
  createdThisWeek: 14,
  createdLastWeek: 9,
  confirmedThisWeek: 8,
  confirmedLastWeek: 6,
  unsubscribedThisWeek: 3,
  unsubscribedLastWeek: 5,
  pausedThisWeek: 2,
  pausedLastWeek: 1,
  bouncedThisWeek: 1,
  bouncedLastWeek: 1,
  liveTotal: 142,
  pendingTotal: 11,
  pausedTotal: 5,
  unsubscribedTotal: 23,
  bouncedTotal: 2,
  topSourcesThisWeek: [
    { source: 'card_watch', createdThisWeek: 6, createdLastWeek: 3 },
    { source: 'filter_toolbar', createdThisWeek: 4, createdLastWeek: 4 },
  ],
  digestVotesUpThisWeek: 5,
  digestVotesDownThisWeek: 1,
  digestVotesUpLastWeek: 3,
  digestVotesDownLastWeek: 2,
  digestVotesUpTotal: 19,
  digestVotesDownTotal: 6,
  emailOpenedThisWeek: 27,
  emailOpenedLastWeek: 21,
  emailClickedThisWeek: 9,
  emailClickedLastWeek: 6,
  emailOpenedTotal: 143,
  emailClickedTotal: 48,
  notRelevantListings: [
    { pagePath: '/aircraft/listing/abc123', title: '1978 Cessna 172N — $89,500', count: 3 },
    { pagePath: '/partnerships/def456', title: 'Cirrus SR22 1/4 share — KPAO', count: 2 },
  ],
  notRelevantTotalThisWeek: 5,
  instantInterestThisWeek: 4,
  instantInterestAllTime: 17,
  unsubscribeReasons: [
    { reason: 'not_relevant', label: 'Not relevant', countThisWeek: 2, countAllTime: 9 },
    { reason: 'too_many_emails', label: 'Too many emails', countThisWeek: 1, countAllTime: 6 },
  ],
  unsubscribeReasonColumnMigrated: true,
  demandWithNoSupply: [
    { sourcePath: '/aircraft?make=Mooney&state=OH', label: 'Mooney in Ohio', subscriberCount: 4 },
    { sourcePath: '/partnerships?make=Diamond', label: 'Diamond', subscriberCount: 2 },
  ],
  sourceColumnMigrated: true,
  unsubscribedAtMigrated: true,
  pausedAtMigrated: true,
  bouncedAtMigrated: true,
  cronRunDaysThisWeek: 7,
  cronRunsThisWeek: 7,
  cronRunsLastWeek: 7,
  cronEmailsSentThisWeek: 41,
  cronEmailsSentLastWeek: 33,
  cronAvgDurationMsThisWeek: 4820,
  cronRunsRecorded: true,
  cronSendFailuresThisWeek: 0,
  repermissionSentThisWeek: 6,
  repermissionSentLastWeek: 4,
  repermissionSentAllTime: 22,
  repermissionUnsubscribedCount: 5,
  repermissionPausedCount: 2,
  repermissionStillLiveCount: 15,
  repermissionSentAtMigrated: true,
  repermissionDowngradedCadenceCount: 3,
  frequencyChangedAtMigrated: true,
  computedAt: '2026-07-18T08:00:00.000Z',
}

test('buildAdminAlertFunnelEmail: subject names the week range and headline created/confirmed counts', () => {
  const { subject } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.equal(subject, 'Alert funnel — Jul 11 – Jul 18: 14 new, 8 confirmed')
})

test('buildAdminAlertFunnelEmail: renders a positive week-over-week delta for both created and confirmed', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /\+5 vs last week/)
  assert.match(html, /\+2 vs last week/)
  assert.match(text, /New signups: 14 \(\+5 vs last week\)/)
  assert.match(text, /Confirmed: 8 \(\+2 vs last week\)/)
})

test('buildAdminAlertFunnelEmail: a flat week renders "flat vs last week", not "+0"', () => {
  const { text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, createdThisWeek: 9, createdLastWeek: 9 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(text, /New signups: 9 \(flat vs last week\)/)
})

test('buildAdminAlertFunnelEmail: a down week renders a negative delta, not a fabricated positive spin', () => {
  const { text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, createdThisWeek: 4, createdLastWeek: 9 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(text, /New signups: 4 \(-5 vs last week\)/)
})

test('buildAdminAlertFunnelEmail: paused/bounced current totals always render under "Current totals (not weekly)"', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Current totals \(not weekly\)/)
  assert.match(text, /Current totals \(not weekly\)/)
  assert.match(html, /Paused<\/td>\s*<td[^>]*>5<\/td>/)
  assert.match(html, /Bounced<\/td>\s*<td[^>]*>2<\/td>/)
})

test('buildAdminAlertFunnelEmail: unsubscribed gets a real week-over-week delta once unsubscribedAtMigrated is true', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Unsubscribed[\s\S]{0,300}vs last week/)
  assert.match(text, /Unsubscribed: 3 \(-2 vs last week\)/)
  // The current-totals stock count (23, distinct from the weekly flow of 3)
  // must still render unchanged alongside the new WoW row.
  assert.match(html, /Unsubscribed<\/td>\s*<td[^>]*>23<\/td>/)
})

test('buildAdminAlertFunnelEmail: when unsubscribedAtMigrated is false, unsubscribed renders only as a current total — no WoW row, no regression', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, unsubscribedAtMigrated: false, unsubscribedThisWeek: 0, unsubscribedLastWeek: 0 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.doesNotMatch(html, /Unsubscribed[\s\S]{0,80}vs last week/)
  assert.doesNotMatch(text, /Unsubscribed: \d+ \(/)
  assert.match(html, /Unsubscribed<\/td>\s*<td[^>]*>23<\/td>/)
  assert.match(text, /Unsubscribed: 23/)
})

test('buildAdminAlertFunnelEmail: paused gets a real week-over-week delta once pausedAtMigrated is true', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Paused[\s\S]{0,300}vs last week/)
  assert.match(text, /Paused: 2 \(\+1 vs last week\)/)
  // The current-totals stock count (5, distinct from the weekly flow of 2)
  // must still render unchanged alongside the new WoW row.
  assert.match(html, /Paused<\/td>\s*<td[^>]*>5<\/td>/)
})

test('buildAdminAlertFunnelEmail: when pausedAtMigrated is false, paused renders only as a current total — no WoW row, no regression', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, pausedAtMigrated: false, pausedThisWeek: 0, pausedLastWeek: 0 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.doesNotMatch(html, /Paused[\s\S]{0,80}vs last week/)
  assert.doesNotMatch(text, /Paused: \d+ \(/)
  assert.match(html, /Paused<\/td>\s*<td[^>]*>5<\/td>/)
  assert.match(text, /Paused: 5/)
})

test('buildAdminAlertFunnelEmail: bounced gets a real week-over-week delta once bouncedAtMigrated is true', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Bounced[\s\S]{0,300}vs last week/)
  assert.match(text, /Bounced: 1 \(flat vs last week\)/)
  // The current-totals stock count (2, distinct from the weekly flow of 1)
  // must still render unchanged alongside the new WoW row.
  assert.match(html, /Bounced<\/td>\s*<td[^>]*>2<\/td>/)
})

test('buildAdminAlertFunnelEmail: when bouncedAtMigrated is false, bounced renders only as a current total — no WoW row, no regression', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, bouncedAtMigrated: false, bouncedThisWeek: 0, bouncedLastWeek: 0 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.doesNotMatch(html, /Bounced[\s\S]{0,80}vs last week/)
  assert.doesNotMatch(text, /Bounced: \d+ \(/)
  assert.match(html, /Bounced<\/td>\s*<td[^>]*>2<\/td>/)
  assert.match(text, /Bounced: 2/)
})

test('buildAdminAlertFunnelEmail: digest feedback votes render with a week-over-week delta for both up and down', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Digest feedback \(👍\/👎\)/)
  assert.match(html, /👍 5 \/ 👎 1/)
  assert.match(text, /Digest feedback: 👍 5 \(\+2 vs last week\), 👎 1 \(-1 vs last week\)/)
})

test('buildAdminAlertFunnelEmail: with zero votes ever recorded, an honest "No votes yet" line renders instead of a fabricated rate', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    {
      ...ADMIN_FUNNEL_BASE,
      digestVotesUpThisWeek: 0,
      digestVotesDownThisWeek: 0,
      digestVotesUpLastWeek: 0,
      digestVotesDownLastWeek: 0,
      digestVotesUpTotal: 0,
      digestVotesDownTotal: 0,
    },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /No votes yet/)
  assert.match(text, /Digest feedback: No votes yet/)
  assert.doesNotMatch(html, /👍 0 \/ 👎 0/)
})

test('buildAdminAlertFunnelEmail: email engagement renders opened/clicked with a week-over-week delta for both', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Email engagement \(opened\/clicked\)/)
  assert.match(html, /👀 27 \/ 🖱️ 9/)
  assert.match(text, /Email engagement: 👀 27 opened \(\+6 vs last week\), 🖱️ 9 clicked \(\+3 vs last week\)/)
})

test('buildAdminAlertFunnelEmail: with zero engagement events ever recorded, an honest empty line renders instead of a fabricated 0/0', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    {
      ...ADMIN_FUNNEL_BASE,
      emailOpenedThisWeek: 0,
      emailOpenedLastWeek: 0,
      emailClickedThisWeek: 0,
      emailClickedLastWeek: 0,
      emailOpenedTotal: 0,
      emailClickedTotal: 0,
    },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /No engagement events yet/)
  assert.match(text, /Email engagement: No engagement events yet/)
  assert.doesNotMatch(html, /👀 0 \/ 🖱️ 0/)
})

test('buildAdminAlertFunnelEmail: instant-alerts interest renders this-week + all-time tap counts', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Instant-alerts interest \(taps\)/)
  assert.match(html, /⚡ 4 this week/)
  assert.match(html, /17 all-time/)
  assert.match(text, /Instant-alerts interest: ⚡ 4 this week, 17 all-time/)
})

test('buildAdminAlertFunnelEmail: with zero instant-interest taps ever, an honest empty line renders instead of a fabricated 0', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, instantInterestThisWeek: 0, instantInterestAllTime: 0 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /Instant-alerts interest \(taps\)/)
  assert.match(html, /No interest recorded yet/)
  assert.match(text, /Instant-alerts interest: No interest recorded yet/)
  assert.doesNotMatch(html, /⚡ 0 this week/)
})

test('buildAdminAlertFunnelEmail: re-permission renders this-week/all-time sends plus the unsubscribed/paused/still-active breakdown', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Re-permission emails sent/)
  assert.match(html, /6 this week/)
  assert.match(html, /22 all-time/)
  assert.match(html, /5 unsubscribed, 2 paused, 15 still active/)
  assert.match(
    text,
    /Re-permission emails sent: 6 this week, 22 all-time \(of those: 5 unsubscribed, 2 paused, 15 still active; 3 downshifted cadence since the re-permission email\)/
  )
})

test('buildAdminAlertFunnelEmail: downshifted-cadence count renders a real number once frequencyChangedAtMigrated is true', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /3 downshifted cadence since the re-permission email/)
  assert.match(text, /3 downshifted cadence since the re-permission email/)
})

test('buildAdminAlertFunnelEmail: downshifted-cadence renders an honest 0, not a fabricated number, when migrated but genuinely zero', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, repermissionDowngradedCadenceCount: 0 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /0 downshifted cadence since the re-permission email/)
  assert.match(text, /0 downshifted cadence since the re-permission email/)
})

test('buildAdminAlertFunnelEmail: downshifted-cadence renders a distinct not-migrated message when frequency_changed_at is not migrated live', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, frequencyChangedAtMigrated: false },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /cadence-downshift data not available yet/)
  assert.match(text, /cadence-downshift data not available yet/)
  assert.doesNotMatch(html, /downshifted cadence since the re-permission email/)
})

test('buildAdminAlertFunnelEmail: with zero re-permission emails ever sent (column migrated), an honest empty line renders instead of a fabricated 0', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    {
      ...ADMIN_FUNNEL_BASE,
      repermissionSentThisWeek: 0,
      repermissionSentLastWeek: 0,
      repermissionSentAllTime: 0,
      repermissionUnsubscribedCount: 0,
      repermissionPausedCount: 0,
      repermissionStillLiveCount: 0,
    },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /No re-permission emails sent yet\./)
  assert.match(text, /Re-permission emails sent: No re-permission emails sent yet\./)
  assert.doesNotMatch(html, /0 this week/)
})

test('buildAdminAlertFunnelEmail: when repermission_sent_at is not migrated live, a distinct honest message renders (not "no emails sent yet")', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    {
      ...ADMIN_FUNNEL_BASE,
      repermissionSentThisWeek: 0,
      repermissionSentLastWeek: 0,
      repermissionSentAllTime: 0,
      repermissionUnsubscribedCount: 0,
      repermissionPausedCount: 0,
      repermissionStillLiveCount: 0,
      repermissionSentAtMigrated: false,
    },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /isn.t migrated live/)
  assert.match(text, /isn.t migrated live/)
  assert.doesNotMatch(html, /No re-permission emails sent yet\./)
})

test('buildAdminAlertFunnelEmail: least-relevant listings render their stored titles and flag counts', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Least relevant listings this week/)
  assert.match(html, /1978 Cessna 172N/)
  assert.match(html, /3 flagged/)
  assert.match(text, /Least relevant listings this week:/)
  assert.match(text, /1978 Cessna 172N — \$89,500: 3 flagged/)
})

test('buildAdminAlertFunnelEmail: with no "not relevant" votes this week, an honest empty line renders instead of a blank table', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, notRelevantListings: [], notRelevantTotalThisWeek: 0 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /Least relevant listings this week/)
  assert.match(html, /No listings flagged as off-target this week/)
  assert.match(text, /\(no listings flagged as off-target this week\)/)
})

test('buildAdminAlertFunnelEmail: unsubscribe reasons render label + this-week/all-time counts', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Why people unsubscribe/)
  assert.match(html, /Not relevant/)
  assert.match(html, /2 this week/)
  assert.match(html, /9 all-time/)
  assert.match(text, /Why people unsubscribe:/)
  assert.match(text, /Not relevant: 2 this week, 9 all-time/)
})

test('buildAdminAlertFunnelEmail: with no reasons recorded, an honest empty line renders instead of a blank table', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, unsubscribeReasons: [] },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /No reasons recorded yet/)
  assert.match(text, /\(No reasons recorded yet\.\)/)
})

test('buildAdminAlertFunnelEmail: when the unsubscribe_reason column is not migrated live, a distinct honest message renders (not "no reasons yet")', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, unsubscribeReasons: [], unsubscribeReasonColumnMigrated: false },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /isn.t migrated live/)
  assert.match(text, /isn.t migrated live/)
  assert.doesNotMatch(html, /No reasons recorded yet/)
})

test('buildAdminAlertFunnelEmail: top-sources table renders this-week and last-week counts per source', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /card_watch/)
  assert.match(text, /card_watch: 6 \(last week: 3\)/)
})

test('buildAdminAlertFunnelEmail: with zero sources this week, an honest empty line renders instead of a blank table', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, topSourcesThisWeek: [] },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /No new alerts this week/)
  assert.match(text, /\(no new alerts this week\)/)
})

test('buildAdminAlertFunnelEmail: demand-with-no-supply renders each waiting search with its subscriber count', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Demand with no supply/)
  assert.match(html, /Mooney in Ohio/)
  assert.match(html, /4 waiting · 0 matches/)
  assert.match(text, /Mooney in Ohio: 4 waiting, 0 matches/)
  assert.match(text, /Diamond: 2 waiting, 0 matches/)
})

test('buildAdminAlertFunnelEmail: with confirmed alerts but none currently unmatched, an honest "every search has matches" line renders, not a blank table', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, demandWithNoSupply: [] },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /Every top search has live matches right now/)
  assert.match(text, /Every top search has live matches right now/)
})

test('buildAdminAlertFunnelEmail: with zero confirmed alerts at all, a distinct "no confirmed alerts yet" line renders instead of the has-matches claim', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, demandWithNoSupply: [], liveTotal: 0 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /No confirmed alerts yet/)
  assert.match(text, /No confirmed alerts yet/)
  assert.doesNotMatch(html, /Every top search has live matches/)
})

test('buildAdminAlertFunnelEmail: when the source column is not migrated, an honest note renders instead of a silent gap', () => {
  const { html } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, sourceColumnMigrated: false },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /alerts\.source.*column isn&rsquo;t migrated live yet/)
})

test('buildAdminAlertFunnelEmail: cron reliability renders days-ran, emails-sent WoW delta, and avg duration with no warning at 7/7 days', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /Cron reliability/)
  assert.match(html, /Days the cron ran/)
  assert.match(html, />7\/7</)
  assert.doesNotMatch(html, /fewer days than expected/)
  assert.match(html, /Emails sent this week/)
  assert.match(html, />41</)
  assert.match(text, /ran 7\/7 days/)
  assert.doesNotMatch(text, /fewer than expected/)
  assert.match(text, /41 emails sent/)
  assert.match(text, /avg duration 5s/)
  assert.match(html, /Send failures/)
  assert.match(html, />0</)
  assert.doesNotMatch(html, /check the Resend dashboard/)
  assert.match(text, /0 send failures/)
  assert.doesNotMatch(text, /check the Resend dashboard/)
})

test('buildAdminAlertFunnelEmail: cron reliability flags real send failures when > 0', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, cronSendFailuresThisWeek: 3 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /Send failures/)
  assert.match(html, />3</)
  assert.match(html, /check the Resend dashboard/)
  assert.match(text, /3 send failures \(⚠️ check the Resend dashboard\)/)
})

test('buildAdminAlertFunnelEmail: cron reliability flags a short week when fewer than 7 days ran', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    { ...ADMIN_FUNNEL_BASE, cronRunDaysThisWeek: 4, cronRunsThisWeek: 4 },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, />4\/7</)
  assert.match(html, /fewer days than expected — check for silent failures/)
  assert.match(text, /ran 4\/7 days \(⚠️ fewer than expected/)
})

test('buildAdminAlertFunnelEmail: with no cron run data at all, an honest empty state renders instead of a fabricated 0/7', () => {
  const { html, text } = buildAdminAlertFunnelEmail(
    {
      ...ADMIN_FUNNEL_BASE,
      cronRunsRecorded: false,
      cronRunDaysThisWeek: 0,
      cronRunsThisWeek: 0,
      cronRunsLastWeek: 0,
      cronEmailsSentThisWeek: 0,
      cronEmailsSentLastWeek: 0,
      cronAvgDurationMsThisWeek: null,
    },
    'https://clubhanger.com/admin/alerts'
  )
  assert.match(html, /No cron run data yet/)
  assert.doesNotMatch(html, /Days the cron ran/)
  assert.match(text, /No cron run data yet/)
})

test('buildAdminAlertFunnelEmail: the dashboard link points at the passed-in URL', () => {
  const { html, text } = buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts')
  assert.match(html, /href="https:\/\/clubhanger\.com\/admin\/alerts"/)
  assert.match(text, /https:\/\/clubhanger\.com\/admin\/alerts/)
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
    buildAdminAlertFunnelEmail(ADMIN_FUNNEL_BASE, 'https://clubhanger.com/admin/alerts').html,
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

// --- Send retry policy (429/5xx backoff) -------------------------------------

test('isRetriableStatus: 429 and 5xx retry; other statuses do not', () => {
  for (const s of [429, 500, 502, 503, 599]) assert.equal(isRetriableStatus(s), true)
  for (const s of [200, 301, 400, 401, 403, 404, 422, 600]) assert.equal(isRetriableStatus(s), false)
})

test('parseRetryAfterMs: delta-seconds → ms', () => {
  assert.equal(parseRetryAfterMs('0'), 0)
  assert.equal(parseRetryAfterMs('120'), 120_000)
  assert.equal(parseRetryAfterMs('  30  '), 30_000)
})

test('parseRetryAfterMs: HTTP-date → ms remaining, clamped non-negative', () => {
  const now = Date.UTC(2026, 6, 19, 12, 0, 0)
  assert.equal(parseRetryAfterMs(new Date(now + 45_000).toUTCString(), now), 45_000)
  assert.equal(parseRetryAfterMs(new Date(now - 45_000).toUTCString(), now), 0)
})

test('parseRetryAfterMs: absent / empty / garbage → null', () => {
  for (const h of [null, undefined, '', '   ', 'soon']) assert.equal(parseRetryAfterMs(h), null)
})

test('planEmailRetry: non-retriable status never retries (bad address hard-fails)', () => {
  assert.deepEqual(planEmailRetry({ status: 400, attempt: 1 }), { retry: false, delayMs: 0 })
  assert.deepEqual(planEmailRetry({ status: 422, attempt: 1 }), { retry: false, delayMs: 0 })
})

test('planEmailRetry: retries a 429/5xx until attempts are exhausted', () => {
  assert.equal(planEmailRetry({ status: 429, attempt: 1, rand: 0 }).retry, true)
  assert.equal(planEmailRetry({ status: 503, attempt: MAX_SEND_ATTEMPTS - 1, rand: 0 }).retry, true)
  assert.deepEqual(planEmailRetry({ status: 429, attempt: MAX_SEND_ATTEMPTS }), { retry: false, delayMs: 0 })
})

test('planEmailRetry: honors Retry-After (clamped) else exponential backoff + bounded jitter', () => {
  assert.equal(planEmailRetry({ status: 429, attempt: 1, retryAfter: '2' }).delayMs, 2000)
  assert.equal(planEmailRetry({ status: 503, attempt: 1, retryAfter: '3600' }).delayMs, RETRY_MAX_MS)
  assert.deepEqual(planEmailRetry({ status: 429, attempt: 1, retryAfter: '0' }), { retry: true, delayMs: 0 })
  assert.equal(planEmailRetry({ status: 500, attempt: 1, rand: 0 }).delayMs, RETRY_BASE_MS)
  assert.equal(planEmailRetry({ status: 500, attempt: 2, rand: 0 }).delayMs, RETRY_BASE_MS * 2)
  assert.equal(planEmailRetry({ status: 500, attempt: 1, rand: 1 }).delayMs, Math.round(RETRY_BASE_MS * 1.5))
  assert.equal(planEmailRetry({ status: 500, attempt: 20, maxAttempts: 99, rand: 1 }).delayMs, RETRY_MAX_MS)
})

function recordingSleep() {
  const delays: number[] = []
  return { sleep: async (ms: number) => { delays.push(ms) }, delays }
}
const rand0 = () => 0

test('withEmailRetry: terminal on first attempt returns immediately, never sleeps', async () => {
  const { sleep, delays } = recordingSleep()
  let calls = 0
  const result = await withEmailRetry(async () => { calls++; return { value: 'ok' } }, { sleep, rand: rand0 })
  assert.equal(result, 'ok')
  assert.equal(calls, 1)
  assert.deepEqual(delays, [])
})

test('withEmailRetry: retriable failure then success returns success, sleeps once', async () => {
  const { sleep, delays } = recordingSleep()
  let calls = 0
  const result = await withEmailRetry(async (attempt) => {
    calls++
    if (attempt === 1) return { retriable: true, status: 429, retryAfter: '0', value: 'fail' }
    return { value: 'sent' }
  }, { sleep, rand: rand0 })
  assert.equal(result, 'sent')
  assert.equal(calls, 2)
  assert.deepEqual(delays, [0])
})

test('withEmailRetry: persistent retriable failure stops at MAX_SEND_ATTEMPTS, returns last value', async () => {
  const { sleep, delays } = recordingSleep()
  let calls = 0
  const result = await withEmailRetry(async () => {
    calls++
    return { retriable: true, status: 503, retryAfter: '0', value: `fail-${calls}` }
  }, { sleep, rand: rand0 })
  assert.equal(result, `fail-${MAX_SEND_ATTEMPTS}`)
  assert.equal(calls, MAX_SEND_ATTEMPTS)
  assert.equal(delays.length, MAX_SEND_ATTEMPTS - 1)
})

test('withEmailRetry: a retriable flag with a non-retriable status does not retry', async () => {
  const { sleep, delays } = recordingSleep()
  let calls = 0
  const result = await withEmailRetry(async () => {
    calls++
    return { retriable: true, status: 400, retryAfter: null, value: 'hard-fail' }
  }, { sleep, rand: rand0 })
  assert.equal(result, 'hard-fail')
  assert.equal(calls, 1)
  assert.deepEqual(delays, [])
})

test('withEmailRetry: custom maxAttempts is honored and Retry-After drives the sleep', async () => {
  const { sleep, delays } = recordingSleep()
  let calls = 0
  await withEmailRetry(async () => {
    calls++
    return { retriable: true, status: 429, retryAfter: '2', value: 'x' }
  }, { sleep, rand: rand0, maxAttempts: 2 })
  assert.equal(calls, 2)
  assert.deepEqual(delays, [2000])
})
