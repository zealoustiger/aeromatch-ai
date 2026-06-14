import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseListing } from '@/lib/parseListing'
import { llmParseListing } from '@/lib/llmParse'

const MAX_IMAGE_BYTES = 12 * 1024 * 1024 // 12 MB per image
const MAX_IMAGES = 10

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function extFromContentType(ct: string): string {
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  return 'jpg'
}

export async function POST(request: NextRequest) {
  // Auth: same-origin request from the admin's logged-in browser (capture page)
  const auth = await createServerSupabaseClient()
  const { data: userData } = await auth.auth.getUser()
  const email = userData.user?.email?.toLowerCase()
  if (!email || (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string; imageUrls?: string[]; postUrl?: string; author?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rawText = (body.text ?? '').trim()
  const sourceUrl = body.postUrl ?? null
  const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.slice(0, MAX_IMAGES) : []

  if (!rawText && imageUrls.length === 0) {
    return NextResponse.json({ error: 'Nothing to ingest — no text or images found' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Parse: LLM (Claude Haiku) when ANTHROPIC_API_KEY is set, else heuristic.
  const parsed = ((await llmParseListing(rawText)) ?? parseListing(rawText)) as unknown as Record<string, unknown>

  // Prefer the FB author as the contact name when the post text didn't yield one.
  if (!parsed.contact_name && typeof body.author === 'string' && body.author.trim()) {
    parsed.contact_name = body.author.trim()
  }

  // Authoritative city/state from the airports table (never guess these).
  const icao = (parsed.home_airport as string | null)?.toUpperCase()
  if (icao) {
    parsed.home_airport = icao
    const { data: airport } = await supabase
      .from('airports')
      .select('city, state')
      .eq('icao', icao)
      .single()
    if (airport) {
      // The home airport's city/state are authoritative — override any LLM guess.
      if (airport.city) parsed.city = airport.city
      if (airport.state) parsed.state = airport.state
    }
  }

  // Create the draft first so we have an ID for the storage path
  const { data: draft, error: draftErr } = await supabase
    .from('listing_drafts')
    .insert({ source: 'facebook', source_url: sourceUrl, raw_text: rawText, parsed })
    .select('id')
    .single()

  if (draftErr || !draft) {
    return NextResponse.json({ error: `Draft create failed: ${draftErr?.message}` }, { status: 500 })
  }

  // Re-host each image while the signed FB URL is still valid
  const rehosted: string[] = []
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const res = await fetch(imageUrls[i])
      if (!res.ok) continue
      const ct = res.headers.get('content-type') ?? 'image/jpeg'
      if (!ct.startsWith('image/')) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.byteLength > MAX_IMAGE_BYTES || buf.byteLength < 1024) continue

      const path = `drafts/${draft.id}/${i}.${extFromContentType(ct)}`
      const { error: upErr } = await supabase.storage
        .from('listing-images')
        .upload(path, buf, { contentType: ct, upsert: true })
      if (upErr) continue

      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path)
      rehosted.push(pub.publicUrl)
    } catch {
      // skip a failed image, keep the rest
    }
  }

  if (rehosted.length > 0) {
    await supabase.from('listing_drafts').update({ images: rehosted }).eq('id', draft.id)
  }

  return NextResponse.json({
    ok: true,
    draftId: draft.id,
    imagesRehosted: rehosted.length,
    imagesAttempted: imageUrls.length,
  })
}
