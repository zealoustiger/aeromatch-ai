import { createHash } from 'node:crypto'
import type { createAdminClient } from './supabase-admin.ts'
import type { AlertDigestSample } from './email.ts'

/**
 * Rehosts each emailed sample photo onto our own Supabase Storage before a
 * send, so an alert email's `<img>` never points at a source site.
 *
 * Why: email clients load images through their own proxies (Gmail's
 * GoogleImageProxy, Apple Mail Privacy Protection's relay, Superhuman, …),
 * which present non-browser user-agents and no referer. Several listing
 * sources — Hangar67 in particular — 403 exactly those fetches while happily
 * serving a real browser, so the listing shows a photo on-site and a blank
 * slot in the inbox (observed 2026-09-13: a Hangar67 2014 SR22-G5 digest card
 * rendered with no photo, no caption). Our storage host is a plain public CDN
 * that serves anyone, and the copy is ours to keep, so the email also can't
 * rot later if the source expires or rehosts the original.
 *
 * Honesty: a photo we can't fetch (source down, not an image, oversized)
 * falls back to the per-make placeholder WITH `isPlaceholder: true`, so the
 * card carries the same "Not actual plane photo" caption as everywhere else
 * on the site — never a silently blank slot, never a wrong plane presented
 * as this one.
 *
 * Idempotent + cheap on repeat: keyed by a hash of the source URL under
 * `email-cache/`, checked with one HEAD before any upstream fetch, memoised
 * per warm lambda. Path carries no extension on purpose — the stored
 * `contentType` is what the CDN serves, and an extension would force a
 * fetch before the cache key could even be checked. At most `CONCURRENCY`
 * upstream fetches in flight per call.
 */

const BUCKET = 'listing-images' // existing public bucket (see /api/ingest's draft rehoster)
const PREFIX = 'email-cache'
const CONCURRENCY = 4
const FETCH_TIMEOUT_MS = 8_000
const HEAD_TIMEOUT_MS = 5_000
const MAX_BYTES = 4 * 1024 * 1024
const MIN_BYTES = 1024
// A real browser UA is what Hangar67 (and friends) gate on — see file doc.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

type Admin = ReturnType<typeof createAdminClient>

/** sourceUrl → our public URL, or null = tried and failed on this warm
 *  instance (don't re-hammer a dead host across a whole cron pass; the next
 *  cold start retries naturally). */
const memo = new Map<string, string | null>()

function isOurs(url: string): boolean {
  const own = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
  return !!own && url.startsWith(own)
}

function cachePath(sourceUrl: string): string {
  return `${PREFIX}/${createHash('sha1').update(sourceUrl).digest('hex')}`
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await run(ctrl.signal)
  } finally {
    clearTimeout(t)
  }
}

async function alreadyHosted(publicUrl: string): Promise<boolean> {
  try {
    const res = await withTimeout(HEAD_TIMEOUT_MS, (signal) => fetch(publicUrl, { method: 'HEAD', signal }))
    return res.ok
  } catch {
    return false
  }
}

/** Upstream fetch with browser headers; null unless it's a real, sane-sized image. */
async function fetchImage(url: string): Promise<{ buf: Buffer; contentType: string } | null> {
  try {
    const res = await withTimeout(FETCH_TIMEOUT_MS, (signal) =>
      fetch(url, {
        signal,
        redirect: 'follow',
        headers: { 'user-agent': BROWSER_UA, accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
      })
    )
    if (!res.ok) return null
    const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    if (!contentType.startsWith('image/')) return null
    const declared = Number(res.headers.get('content-length') ?? 0)
    if (declared > MAX_BYTES) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > MAX_BYTES || buf.byteLength < MIN_BYTES) return null
    return { buf, contentType }
  } catch {
    return null
  }
}

/** Our public URL for `sourceUrl` — the cached copy, or a fresh rehost. Null on any failure. */
async function rehostOne(supabase: Admin, sourceUrl: string): Promise<string | null> {
  const hit = memo.get(sourceUrl)
  if (hit !== undefined) return hit

  const path = cachePath(sourceUrl)
  const bucket = supabase.storage.from(BUCKET)
  const publicUrl = bucket.getPublicUrl(path).data.publicUrl

  if (await alreadyHosted(publicUrl)) {
    memo.set(sourceUrl, publicUrl)
    return publicUrl
  }

  const img = await fetchImage(sourceUrl)
  if (!img) {
    memo.set(sourceUrl, null)
    return null
  }

  const { error } = await bucket.upload(path, img.buf, {
    contentType: img.contentType,
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) {
    console.warn(`[emailPhotoCache] upload failed for ${sourceUrl}: ${error.message}`)
    memo.set(sourceUrl, null)
    return null
  }
  memo.set(sourceUrl, publicUrl)
  return publicUrl
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return out
}

/**
 * Returns the samples with every real (non-placeholder) `photoUrl` swapped
 * for a copy on our own storage. Placeholders and photos already on our host
 * pass through untouched. A photo that can't be rehosted becomes an honest
 * placeholder (`isPlaceholder: true`) rather than a blank `<img>`.
 *
 * `placeholderFor` is injected (pass `getPlaceholderPhoto` from
 * `aircraftPhotos`) rather than imported: this module has to stay free of
 * runtime relative imports so `node --experimental-strip-types --test` can
 * load it — the repo's tsconfig forbids the `.ts` import extensions Node
 * would need to resolve them (see `email.ts`, which is testable for the
 * same reason). It also keeps the unit tests pure.
 */
export async function rehostSamplePhotos(
  supabase: Admin,
  samples: AlertDigestSample[],
  placeholderFor: (make: string) => string
): Promise<AlertDigestSample[]> {
  return mapLimit(samples, CONCURRENCY, async (s) => {
    if (!s.photoUrl || s.isPlaceholder || isOurs(s.photoUrl)) return s
    const hosted = await rehostOne(supabase, s.photoUrl)
    if (hosted) return { ...s, photoUrl: hosted }
    return { ...s, photoUrl: placeholderFor(s.make ?? ''), isPlaceholder: true }
  })
}
