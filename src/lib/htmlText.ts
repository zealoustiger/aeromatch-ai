// Strips a fetched listing page down to plain readable text (title + meta
// description + visible body copy) so it can be fed through the same AI
// draft-extraction prompt that already handles pasted listing text — no
// per-source parser needed, unlike the photo scraper in listingPhotos.ts.

const ENTITY_MAP: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
}

function decodeEntities(s: string): string {
  return s
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) => ENTITY_MAP[name])
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

/** Extract readable text from a raw HTML document, capped to `maxChars`. */
export function htmlToReadableText(html: string, maxChars = 6000): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
  const metaDescription =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] ??
    ''

  const body = html
    .replace(/<(script|style|noscript|svg|head|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  const parts = [decodeEntities(title), decodeEntities(metaDescription), decodeEntities(body)]
    .map((s) => s.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim())
    .filter(Boolean)

  return parts.join('\n\n').slice(0, maxChars)
}
