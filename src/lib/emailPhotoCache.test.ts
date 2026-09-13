import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rehostSamplePhotos } from './emailPhotoCache.ts'
import type { AlertDigestSample } from './email.ts'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
const OUR_HOST = 'https://example.supabase.co/storage/v1/object/public/listing-images/'
// Stand-in for aircraftPhotos.getPlaceholderPhoto (injected, see rehostSamplePhotos's doc).
const PLACEHOLDER = (make: string) => `https://upload.wikimedia.org/placeholder/${encodeURIComponent(make || 'generic')}.jpg`

type Upload = { path: string; contentType: string; bytes: number }

/** Minimal stand-in for the admin client's storage surface. */
function fakeSupabase(uploads: Upload[]) {
  return {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `${OUR_HOST}${path}` } }),
        upload: async (path: string, buf: Buffer, opts: { contentType: string }) => {
          uploads.push({ path, contentType: opts.contentType, bytes: buf.byteLength })
          return { error: null }
        },
      }),
    },
  } as unknown as Parameters<typeof rehostSamplePhotos>[0]
}

type Upstream = { status: number; contentType?: string; bytes?: number }

/** Routes HEADs on our host to `hosted`, everything else to `upstream`. */
function installFakeFetch(t: { after: (fn: () => void) => void }, upstream: Record<string, Upstream>, hosted: Set<string> = new Set()) {
  const real = globalThis.fetch
  const calls: { url: string; method: string; ua?: string }[] = []
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = init?.method ?? 'GET'
    const ua = (init?.headers as Record<string, string> | undefined)?.['user-agent']
    calls.push({ url, method, ua })
    if (url.startsWith(OUR_HOST)) return new Response(null, { status: hosted.has(url) ? 200 : 400 })
    const u = upstream[url]
    if (!u) return new Response('nope', { status: 404 })
    if (u.status !== 200) return new Response('blocked', { status: u.status, headers: { 'content-type': 'text/html' } })
    const body = Buffer.alloc(u.bytes ?? 2048, 1)
    return new Response(body, { status: 200, headers: { 'content-type': u.contentType ?? 'image/jpeg' } })
  }) as typeof fetch
  t.after(() => {
    globalThis.fetch = real
  })
  return calls
}

function sample(over: Partial<AlertDigestSample>): AlertDigestSample {
  return {
    title: '2014 Cirrus SR22',
    photoUrl: null,
    isPlaceholder: false,
    year: 2014,
    ttaf: 2145,
    location: 'Santa Ana, CA',
    price: 664_900,
    url: 'https://clubhanger.com/aircraft/listing/x',
    make: 'Cirrus',
    ...over,
  }
}

test('rehost: a source-hosted photo is copied to our storage and the card points at our URL', async (t) => {
  const src = 'https://www.hangar67.com/photos/1/a.jpg'
  const calls = installFakeFetch(t, { [src]: { status: 200 } })
  const uploads: Upload[] = []
  const [out] = await rehostSamplePhotos(fakeSupabase(uploads), [sample({ photoUrl: src })], PLACEHOLDER)
  assert.ok(out.photoUrl?.startsWith(`${OUR_HOST}email-cache/`), `expected our host, got ${out.photoUrl}`)
  assert.equal(out.isPlaceholder, false)
  assert.equal(uploads.length, 1)
  assert.equal(uploads[0].contentType, 'image/jpeg')
  // The upstream fetch goes out with a real browser UA — that's the whole point (Hangar67 403s the rest).
  const upstreamCall = calls.find((c) => c.url === src)
  assert.match(upstreamCall?.ua ?? '', /Chrome/)
})

test('rehost: a photo the source refuses (403) becomes an honest placeholder, never a blank <img>', async (t) => {
  const src = 'https://www.hangar67.com/photos/2/blocked.jpg'
  installFakeFetch(t, { [src]: { status: 403 } })
  const uploads: Upload[] = []
  const [out] = await rehostSamplePhotos(fakeSupabase(uploads), [sample({ photoUrl: src })], PLACEHOLDER)
  assert.equal(out.isPlaceholder, true)
  assert.match(out.photoUrl ?? '', /upload\.wikimedia\.org/) // the per-make (Cirrus) placeholder
  assert.equal(uploads.length, 0)
})

test('rehost: an already-cached photo is served from our host without touching the source again', async (t) => {
  const src = 'https://www.hangar67.com/photos/3/cached.jpg'
  // Discover the cache URL by rehosting once, then simulate a later run where it already exists.
  const first = installFakeFetch(t, { [src]: { status: 200 } })
  const [seeded] = await rehostSamplePhotos(fakeSupabase([]), [sample({ photoUrl: src })], PLACEHOLDER)
  assert.ok(first.some((c) => c.url === src), 'first run fetched upstream')
  assert.match(seeded.photoUrl ?? '', /email-cache\/[0-9a-f]{40}$/, 'cache key is a sha1 of the source URL')
  // A fresh source URL so the per-instance memo can't short-circuit the second run.
  const src2 = 'https://www.hangar67.com/photos/3/cached-again.jpg'
  const second = installFakeFetch(t, { [src2]: { status: 200 } }, new Set([cachedUrlFor(src2)]))
  const uploads: Upload[] = []
  const [out] = await rehostSamplePhotos(fakeSupabase(uploads), [sample({ photoUrl: src2 })], PLACEHOLDER)
  assert.equal(out.photoUrl, cachedUrlFor(src2))
  assert.equal(uploads.length, 0, 'no re-upload')
  assert.ok(!second.some((c) => c.url === src2), 'source not fetched when cache hit')
})

test('rehost: placeholders, photo-less samples, and photos already on our host pass through untouched', async (t) => {
  installFakeFetch(t, {})
  const uploads: Upload[] = []
  const input = [
    sample({ photoUrl: 'https://upload.wikimedia.org/x.jpg', isPlaceholder: true }),
    sample({ photoUrl: null }),
    sample({ photoUrl: `${OUR_HOST}listing-photos/abc.jpg` }),
  ]
  const out = await rehostSamplePhotos(fakeSupabase(uploads), input, PLACEHOLDER)
  assert.deepEqual(out, input)
  assert.equal(uploads.length, 0)
})

test('rehost: a non-image response (HTML challenge page with a 200) is rejected, not stored', async (t) => {
  const src = 'https://www.hangar67.com/photos/4/challenge.jpg'
  installFakeFetch(t, { [src]: { status: 200, contentType: 'text/html' } })
  const uploads: Upload[] = []
  const [out] = await rehostSamplePhotos(fakeSupabase(uploads), [sample({ photoUrl: src })], PLACEHOLDER)
  assert.equal(out.isPlaceholder, true)
  assert.equal(uploads.length, 0)
})

// Mirrors emailPhotoCache's cache key so the "already hosted" test can pre-seed it.
import { createHash } from 'node:crypto'
function cachedUrlFor(sourceUrl: string): string {
  return `${OUR_HOST}email-cache/${createHash('sha1').update(sourceUrl).digest('hex')}`
}
