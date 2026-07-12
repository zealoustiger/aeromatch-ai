import { buildPriceDropEmail } from '@/lib/email'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'

export const dynamic = 'force-dynamic'

/**
 * Dev-only preview of the price-drop notification email — renders the built
 * HTML against one static fixture listing so it can be eyeballed in a
 * browser without sending anything or touching the DB. Already excluded from
 * crawling by `robots.ts`'s blanket `/api` disallow; not linked from any nav.
 * `?type=partnership` previews the buy-in-drop copy (dropNoun/shareType).
 */
export async function GET(request: Request) {
  const isPartnership = new URL(request.url).searchParams.get('type') === 'partnership'

  const { html } = buildPriceDropEmail(
    isPartnership
      ? {
          title: '2015 Cirrus SR22',
          photoUrl: getPlaceholderPhoto('cirrus'),
          previousPrice: 40_000,
          askingPrice: 35_000,
          listingUrl: 'https://clubhanger.com/partnerships/preview',
          manageUrl: 'https://clubhanger.com/alerts/manage',
          unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=preview',
          dropNoun: 'buy-in drop',
          shareType: '1/4 Share',
        }
      : {
          title: '2013 Cessna 172S Skyhawk',
          photoUrl: getPlaceholderPhoto('cessna'),
          previousPrice: 200_000,
          askingPrice: 180_000,
          listingUrl: 'https://clubhanger.com/aircraft/listing/preview',
          manageUrl: 'https://clubhanger.com/alerts/manage',
          unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=preview',
        }
  )

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
