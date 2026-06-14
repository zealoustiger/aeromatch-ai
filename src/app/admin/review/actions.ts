'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

async function assertAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email?.toLowerCase()
  if (!email || (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email))) {
    throw new Error('Not authorized')
  }
}

export async function publishDraft(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()

  const draftId = formData.get('draft_id') as string
  const images = ((formData.get('images') as string) || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const num = (k: string) => {
    const v = formData.get(k) as string
    return v && v.trim() ? parseInt(v.replace(/[^\d]/g, ''), 10) : null
  }

  // posted_at: accept a YYYY-MM-DD value, else null
  const postedRaw = (formData.get('posted_at') as string)?.trim()
  const posted_at = postedRaw && /^\d{4}-\d{2}-\d{2}$/.test(postedRaw) ? postedRaw : null

  const payload = {
    make: (formData.get('make') as string) || 'Unknown',
    model: (formData.get('model') as string) || 'Unknown',
    year: num('year'),
    home_airport: ((formData.get('home_airport') as string) || 'KPAO').toUpperCase(),
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || 'CA',
    share_type: (formData.get('share_type') as string) || 'other',
    shares_available: 1,
    buy_in_price: num('buy_in_price'),
    monthly_fixed: num('monthly_fixed'),
    hourly_wet: num('hourly_wet'),
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    images,
    image_is_placeholder: images.length === 0,
    source_url: (formData.get('source_url') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: 'facebook-noreply@clubhanger.com',
    contact_method: 'email' as const,
    posted_at,
    status: 'active' as const,
    poster_id: null,
  }

  const { data: listing, error } = await admin
    .from('partnerships')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(`Publish failed: ${error.message}`)

  await admin
    .from('listing_drafts')
    .update({ status: 'published', published_listing_id: listing.id })
    .eq('id', draftId)

  revalidatePath('/admin/review')
  revalidatePath('/partnerships')
}

export async function dismissDraft(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  const draftId = formData.get('draft_id') as string
  await admin.from('listing_drafts').update({ status: 'dismissed' }).eq('id', draftId)
  revalidatePath('/admin/review')
}
