import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'listing-images'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function randomHex(n: number) {
  const arr = new Uint8Array(n)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  // Auth gate
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Parse the file from FormData
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate type
  const ct = file.type
  if (!ALLOWED_TYPES.has(ct)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or AVIF images are allowed' }, { status: 400 })
  }

  // Validate size
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large — maximum 5 MB per photo' }, { status: 400 })
  }
  if (buf.byteLength < 1024) {
    return NextResponse.json({ error: 'File too small' }, { status: 400 })
  }

  // Upload to Storage via admin client (bypasses storage RLS)
  const ext = EXT[ct] ?? 'jpg'
  const path = `partnership-photos/${user.id}/${randomHex(8)}.${ext}`
  const admin = createAdminClient()
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: ct, upsert: false })
  if (upErr) {
    console.error('[upload-partnership-photo] storage error:', upErr.message)
    return NextResponse.json({ error: 'Upload failed — please try again' }, { status: 500 })
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}
