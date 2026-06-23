// Harvest real listing photos from the source marketplace page.
//
// Listings are aggregated from external sites that we scrape for specs/text but
// not photos, so every aircraft card falls back to a per-make placeholder badged
// "Not actual plane photo". This module re-fetches the source page and extracts
// the *full* photo gallery (hotlinked source URLs — Phase 1; high-traffic
// listings get cached to our own storage in Phase 2).
//
// Per-source extractors, because each marketplace structures photos differently:
//   • aircraftforsale — schema.org ld+json `image[]` (full-size 800X600 jpgs)
//   • barnstormers    — S3 `thumbnail_image_{id}_{n}` → full-size `large/large_image_…`
//   • hangar67        — JS-rendered; needs their JSON API (deferred to Phase 2)

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export type PhotoResult = { images: string[]; supported: boolean }

/** Pull the numeric listing id out of a barnstormers classified URL. */
function barnstormersId(url: string): string | null {
  return url.match(/classified-(\d+)/i)?.[1] ?? null
}

/** barnstormers: real photos are S3 thumbnails we can map to full-size. Ad
 *  banners (`barnbann`) and site logos share the bucket, so filter to this
 *  listing's id and order by the `_{n}_` index. */
export function extractBarnstormers(html: string, sourceUrl: string): string[] {
  const id = barnstormersId(sourceUrl)
  if (!id) return []
  const re = new RegExp(
    `https://barnstormers\\.s3\\.amazonaws\\.com/media/listing_images/thumbnail/thumbnail_image_${id}_(\\d+)_\\d+\\.jpe?g`,
    'gi'
  )
  const byIndex = new Map<number, string>()
  for (const m of html.matchAll(re)) {
    const n = Number(m[1])
    // thumbnail → full-size; both live in the same bucket.
    const full = m[0].replace('/thumbnail/thumbnail_image_', '/large/large_image_')
    if (!byIndex.has(n)) byIndex.set(n, full)
  }
  return [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, u]) => u)
}

/** aircraftforsale: schema.org JSON-LD carries the full gallery; fall back to
 *  scraping the full-size (800X600) cdn jpgs and de-duping by photo hash. */
export function extractAircraftForSale(html: string): string[] {
  // 1) JSON-LD image array (preferred — it's the canonical ordered gallery).
  for (const block of html.matchAll(/<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(block[1].trim())
      const nodes = Array.isArray(json) ? json : [json]
      for (const node of nodes) {
        const img = node?.image
        const arr = Array.isArray(img) ? img : img ? [img] : []
        const urls = arr.map((x: unknown) => (typeof x === 'string' ? x : (x as { url?: string })?.url)).filter(Boolean)
        if (urls.length) return [...new Set(urls as string[])]
      }
    } catch {
      /* keep scanning */
    }
  }
  // 2) Fallback: full-size cdn jpgs, de-duped by the per-photo hash segment.
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of html.matchAll(/https?:\/\/cdn\.aircraftforsale\.com\/[^"'\\ )]+-800X600-\d+\.(?:jpg|jpeg)/gi)) {
    const key = m[0].split('-').slice(-3).join('-') // hash-800X600-n
    if (!seen.has(key)) {
      seen.add(key)
      out.push(m[0])
    }
  }
  return out
}

// A listing with no photos exposes the source's own "no image" graphic as its
// og:image (e.g. static.aircraftforsale.com/.../noimage-300x225.webp). That's not
// a real plane photo — drop it so the listing stays a placeholder, not a fake one.
const NOIMG_RE = /no[\s._-]?image|placeholder|no[\s._-]?photo/i

/** Dispatch to the right extractor for a given source. */
export function extractPhotos(source: string, html: string, sourceUrl: string): PhotoResult {
  switch (source) {
    case 'barnstormers':
      return { images: extractBarnstormers(html, sourceUrl).filter((u) => !NOIMG_RE.test(u)), supported: true }
    case 'aircraftforsale':
      return { images: extractAircraftForSale(html).filter((u) => !NOIMG_RE.test(u)), supported: true }
    default:
      // hangar67 etc. — JS-rendered, handled in Phase 2.
      return { images: [], supported: false }
  }
}

/** Fetch a source page and return its photo gallery. Network/HTTP failures are
 *  swallowed to an empty result so a backfill run never hard-stops on one row. */
export async function fetchListingPhotos(
  source: string,
  sourceUrl: string,
  timeoutMs = 15000
): Promise<PhotoResult> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(sourceUrl, { headers: { 'user-agent': UA }, signal: ctrl.signal })
    if (!res.ok) return { images: [], supported: extractPhotos(source, '', sourceUrl).supported }
    const html = await res.text()
    return extractPhotos(source, html, sourceUrl)
  } catch {
    return { images: [], supported: extractPhotos(source, '', sourceUrl).supported }
  } finally {
    clearTimeout(t)
  }
}
