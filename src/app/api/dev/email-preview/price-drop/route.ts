import { buildPriceDropEmail } from '@/lib/email'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'

export const dynamic = 'force-dynamic'

/**
 * Dev-only preview of the price-drop notification email — renders the built
 * HTML against one static fixture listing so it can be eyeballed in a
 * browser without sending anything or touching the DB. Already excluded from
 * crawling by `robots.ts`'s blanket `/api` disallow; not linked from any nav.
 */
export async function GET() {
  const { html } = buildPriceDropEmail({
    title: '2013 Cessna 172S Skyhawk',
    photoUrl: getPlaceholderPhoto('cessna'),
    previousPrice: 200_000,
    askingPrice: 180_000,
    listingUrl: 'https://clubhanger.com/aircraft/listing/preview',
    manageUrl: 'https://clubhanger.com/alerts/manage',
    unsubscribeUrl: 'https://clubhanger.com/api/alerts/unsubscribe?token=preview',
  })

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
