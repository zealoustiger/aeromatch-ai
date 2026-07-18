import { buildAlertDigestEmail } from '@/lib/email'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'

export const dynamic = 'force-dynamic'

/**
 * Dev-only preview of the weekly alert-digest email — renders the built HTML
 * against static fixture listings so it can be eyeballed in a browser
 * without sending anything or touching the DB. Already excluded from
 * crawling by `robots.ts`'s blanket `/api` disallow; not linked from any nav.
 */
export async function GET() {
  const { html } = buildAlertDigestEmail({
    context: 'Cessna 172',
    newCount: 2,
    dropCount: 1,
    listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172',
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=preview',
    marketPulse: '14 Cessna 172s listed right now, median asking $89k.',
    digestFeedbackBaseUrl: 'https://clubhanger.com/api/alerts/digest-feedback?token=preview',
    shareUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172&share=alert',
    viewUrl: 'https://clubhanger.com/alerts/digest/view?token=preview',
    samples: [
      {
        title: '2015 Cessna 172S Skyhawk',
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cessna_172S_Skyhawk_SP%2C_Private_JP6817606.jpg',
        isPlaceholder: false,
        year: 2015,
        ttaf: 1240,
        location: 'Austin, TX',
        price: 219_000,
        compLabel: '~9% below avg · $240k median · 6 comps',
        compBelowAvg: true,
        url: 'https://clubhanger.com/aircraft/listing/preview-1',
        id: 'preview-1',
        type: 'aircraft',
      },
      {
        title: '2009 Cessna 172S Skyhawk',
        photoUrl: getPlaceholderPhoto('cessna'),
        isPlaceholder: true,
        year: 2009,
        ttaf: 3100,
        location: 'Reno, NV',
        price: 165_000,
        previousPrice: 179_900,
        url: 'https://clubhanger.com/aircraft/listing/preview-2',
        id: 'preview-2',
        type: 'aircraft',
      },
    ],
  })

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
