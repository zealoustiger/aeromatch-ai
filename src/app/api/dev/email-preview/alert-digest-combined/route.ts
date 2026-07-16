import { buildCombinedAlertDigestEmail } from '@/lib/email'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'

export const dynamic = 'force-dynamic'

/**
 * Dev-only preview of the COMBINED alert-digest email — the one-email-per-
 * subscriber-per-pass send used when 2+ of a subscriber's alerts are due at
 * once (see the alert-digest cron). Renders against static fixture listings
 * so it can be eyeballed in a browser without sending anything or touching
 * the DB. Already excluded from crawling by `robots.ts`'s blanket `/api`
 * disallow; not linked from any nav.
 */
export async function GET() {
  const { html } = buildCombinedAlertDigestEmail({
    manageUrl: 'https://clubhanger.com/alerts/manage?token=preview',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=preview-1,preview-2',
    sections: [
      {
        context: 'Cessna 172',
        newCount: 2,
        dropCount: 0,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cessna&model=172',
        marketPulse: '14 Cessna 172s listed right now, median asking $89k.',
        stopUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=preview-1',
        samples: [
          {
            title: '2015 Cessna 172S Skyhawk',
            photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cessna_172S_Skyhawk_SP%2C_Private_JP6817606.jpg',
            isPlaceholder: false,
            year: 2015,
            ttaf: 1240,
            location: 'Austin, TX',
            price: 219_000,
            url: 'https://clubhanger.com/aircraft/listing/preview-1',
          },
        ],
      },
      {
        context: 'Cirrus SR22',
        newCount: 0,
        dropCount: 1,
        listingsUrl: 'https://clubhanger.com/aircraft?make=Cirrus&model=SR22',
        stopUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=preview-2',
        samples: [
          {
            title: '2009 Cirrus SR22',
            photoUrl: getPlaceholderPhoto('cirrus'),
            isPlaceholder: true,
            year: 2009,
            ttaf: 3100,
            location: 'Reno, NV',
            price: 285_000,
            previousPrice: 310_000,
            url: 'https://clubhanger.com/aircraft/listing/preview-2',
          },
        ],
      },
    ],
  })

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
