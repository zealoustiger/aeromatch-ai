import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  buildAlertConfirmEmail,
  buildManageLinkEmail,
  buildAlertEmailChangeConfirmEmail,
  buildNewMessageEmail,
  buildSeedInquiryEmail,
  buildPriceDropEmail,
  buildListingUnavailableEmail,
  buildWidenSuggestionEmail,
  buildAlertDigestEmail,
  buildCombinedAlertDigestEmail,
  buildMatchAlertEmail,
} from '@/lib/email'
import { getAlertDigestPreview } from '@/lib/alertMatchCounts'
import { createAdminClient } from '@/lib/supabase-admin'
import { getPlaceholderPhoto, pickRealPhoto } from '@/lib/aircraftPhotos'
import AdminEmailPreviewCard from '@/components/AdminEmailPreviewCard'

export const metadata = { title: 'Email template gallery', robots: { index: false } }
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://clubhanger.com'
const PLACEHOLDER_NOTE = 'Static placeholder data — no real listing/message behind this preview.'

type Built = { subject: string; html: string; text: string }
type Entry = { name: string; purpose: string; dataNote: string; built: Built }

// One genuinely on-sale aircraft whose most recent price change was a real
// decrease, for an honest price-drop preview. Returns null (never a guessed
// before/after price) when no live row currently qualifies.
async function getSamplePriceDropListing() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('aircraft_for_sale')
    .select('id, make, model, year, asking_price, previous_price, images, location, price_changed_at')
    .eq('status', 'active')
    .not('previous_price', 'is', null)
    .order('price_changed_at', { ascending: false })
    .limit(20)
  const row = (data ?? []).find((r) => r.previous_price != null && r.asking_price != null && r.previous_price > r.asking_price)
  if (!row) return null
  return {
    title: [row.year, row.make, row.model].filter(Boolean).join(' ') || 'Aircraft',
    photoUrl: pickRealPhoto(row.images) ?? getPlaceholderPhoto(row.make ?? ''),
    previousPrice: row.previous_price as number,
    askingPrice: row.asking_price as number,
    listingUrl: `${SITE_URL}/aircraft/listing/${row.id}`,
  }
}

export default async function EmailTemplateGalleryPage() {
  const [aircraftPreview, partnershipPreview, priceDropListing] = await Promise.all([
    getAlertDigestPreview('/aircraft', 3),
    getAlertDigestPreview('/partnerships', 2),
    getSamplePriceDropListing(),
  ])

  const manageUrl = `${SITE_URL}/alerts/manage?token=preview`
  const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=preview`

  const entries: Entry[] = [
    {
      name: 'buildAlertConfirmEmail',
      purpose: 'Double-opt-in confirmation sent right after someone signs up for an alert.',
      dataNote: aircraftPreview
        ? `Live preview of ${aircraftPreview.count} currently-matching aircraft.`
        : 'No live aircraft matched right now — renders the honest zero-match copy.',
      built: buildAlertConfirmEmail({
        context: 'Cessna 172',
        confirmUrl: `${SITE_URL}/api/alerts/confirm?token=preview`,
        manageUrl,
        unsubscribeUrl,
        preview: aircraftPreview ? { count: aircraftPreview.count, samples: aircraftPreview.samples } : null,
      }),
    },
    {
      name: 'buildManageLinkEmail',
      purpose: '"Here\'s your manage link" — sent to a subscriber who lost their original email.',
      dataNote: PLACEHOLDER_NOTE,
      built: buildManageLinkEmail({ manageUrl }),
    },
    {
      name: 'buildAlertEmailChangeConfirmEmail',
      purpose: 'Confirms moving a subscriber\'s alerts to a new email address.',
      dataNote: PLACEHOLDER_NOTE,
      built: buildAlertEmailChangeConfirmEmail({
        oldEmail: 'old-address@example.com',
        confirmUrl: `${SITE_URL}/api/alerts/change-email/confirm?token=preview`,
        manageUrl,
      }),
    },
    {
      name: 'buildNewMessageEmail',
      purpose: 'Notifies a user they have a new on-site message.',
      dataNote: PLACEHOLDER_NOTE,
      built: buildNewMessageEmail({ threadUrl: `${SITE_URL}/messages/preview` }),
    },
    {
      name: 'buildSeedInquiryEmail',
      purpose: 'Routes an inquiry on a concierge/seed listing to the operator inbox.',
      dataNote: PLACEHOLDER_NOTE,
      built: buildSeedInquiryEmail({
        personaName: 'Jordan R.',
        listingTitle: '2015 Cessna 172S Skyhawk',
        listingUrl: `${SITE_URL}/aircraft/listing/preview`,
        threadUrl: `${SITE_URL}/messages/preview`,
        inquirerEmail: 'buyer@example.com',
        body: "Hi — is this still available? I'd love to schedule a look this weekend.",
      }),
    },
    {
      name: 'buildPriceDropEmail',
      purpose: 'Single-listing notice when a watched aircraft/partnership genuinely drops price.',
      dataNote: priceDropListing
        ? `Live preview of a real current price drop: ${priceDropListing.title}.`
        : 'No aircraft with a genuine live price drop right now — renders with illustrative placeholder numbers instead.',
      built: buildPriceDropEmail(
        priceDropListing
          ? {
              title: priceDropListing.title,
              photoUrl: priceDropListing.photoUrl,
              previousPrice: priceDropListing.previousPrice,
              askingPrice: priceDropListing.askingPrice,
              listingUrl: priceDropListing.listingUrl,
              manageUrl,
              unsubscribeUrl,
              frequencyUrl: `${SITE_URL}/api/alerts/frequency?token=preview`,
            }
          : {
              title: '2013 Cessna 172S Skyhawk',
              photoUrl: getPlaceholderPhoto('cessna'),
              previousPrice: 200_000,
              askingPrice: 180_000,
              listingUrl: `${SITE_URL}/aircraft/listing/preview`,
              manageUrl,
              unsubscribeUrl,
              frequencyUrl: `${SITE_URL}/api/alerts/frequency?token=preview`,
            }
      ),
    },
    {
      name: 'buildListingUnavailableEmail',
      purpose: 'One-time notice when a watched listing sells/closes — the last email about it.',
      dataNote: PLACEHOLDER_NOTE,
      built: buildListingUnavailableEmail({
        title: '2013 Cessna 172S Skyhawk',
        browseUrl: `${SITE_URL}/aircraft`,
        manageUrl,
        unsubscribeUrl,
      }),
    },
    {
      name: 'buildWidenSuggestionEmail',
      purpose: 'One-time nudge when a confirmed alert has never matched anything.',
      dataNote: aircraftPreview
        ? `Widen count/description are illustrative; sample cards are ${aircraftPreview.count} live currently-matching aircraft.`
        : PLACEHOLDER_NOTE,
      built: buildWidenSuggestionEmail({
        context: 'Cessna 172 in Wyoming',
        widenDescription: 'Show all Cessna 172 listings nationwide',
        widenCount: 14,
        widenNoun: 'listing',
        manageUrl,
        unsubscribeUrl,
        samples: aircraftPreview?.samples ?? [],
      }),
    },
    {
      name: 'buildAlertDigestEmail',
      purpose: 'Weekly (or daily) digest for one alert — new matches and/or price drops.',
      dataNote: aircraftPreview
        ? `Live preview of ${aircraftPreview.count} currently-matching aircraft.`
        : 'No live aircraft matched right now — renders the honest zero-match copy.',
      built: buildAlertDigestEmail({
        context: 'Cessna 172',
        newCount: aircraftPreview?.samples.length ?? 0,
        dropCount: 0,
        listingsUrl: `${SITE_URL}/aircraft?make=Cessna&model=172`,
        manageUrl,
        unsubscribeUrl,
        samples: aircraftPreview?.samples ?? [],
      }),
    },
    {
      name: 'buildCombinedAlertDigestEmail',
      purpose: 'One email covering 2+ alerts due at once, so a subscriber never gets spammed with separate sends.',
      dataNote:
        aircraftPreview && partnershipPreview
          ? 'Live preview: one aircraft section + one partnership section, both from real current listings.'
          : 'Some live sections had no current matches — those sections render their honest zero-match copy.',
      built: buildCombinedAlertDigestEmail({
        manageUrl,
        unsubscribeUrl,
        sections: [
          {
            context: 'Cessna 172',
            newCount: aircraftPreview?.samples.length ?? 0,
            dropCount: 0,
            listingsUrl: `${SITE_URL}/aircraft?make=Cessna&model=172`,
            samples: aircraftPreview?.samples ?? [],
            stopUrl: `${SITE_URL}/api/alerts/unsubscribe?token=preview-1`,
          },
          {
            context: 'Partnerships',
            newCount: partnershipPreview?.samples.length ?? 0,
            dropCount: 0,
            listingsUrl: `${SITE_URL}/partnerships`,
            samples: partnershipPreview?.samples ?? [],
            stopUrl: `${SITE_URL}/api/alerts/unsubscribe?token=preview-2`,
          },
        ],
      }),
    },
    {
      name: 'buildMatchAlertEmail',
      purpose: 'Tells an owner their own posted listing has new matches on the other side (e.g. seekers).',
      dataNote: PLACEHOLDER_NOTE,
      built: buildMatchAlertEmail({
        listingLabel: 'your 2015 Cessna 172S Skyhawk partnership',
        otherSideLabel: 'pilots seeking a partnership',
        count: 3,
        matchesUrl: `${SITE_URL}/partnerships/preview/matches`,
      }),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Email template gallery</h2>
          <p className="mt-1 text-sm text-slate-500">
            Every alert email builder in <code>email.ts</code>, rendered against honest
            sample data. Use &quot;Send to my inbox&quot; on any template to see exactly
            what it looks like in a real inbox.
          </p>
        </div>
        <Link href="/admin/alerts" className="flex items-center gap-1.5 text-sm text-sky-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Alert Scoreboard
        </Link>
      </div>

      {entries.map((entry) => (
        <AdminEmailPreviewCard key={entry.name} entry={entry} />
      ))}
    </div>
  )
}
