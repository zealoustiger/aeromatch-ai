'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function createPartnership(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const ratingsRaw = formData.get('ratings_required') as string
  const ratings = ratingsRaw ? ratingsRaw.split(',').map((r) => r.trim()).filter(Boolean) : null

  const payload = {
    make: formData.get('make') as string,
    model: formData.get('model') as string,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    registration: (formData.get('registration') as string) || null,
    home_airport: (formData.get('home_airport') as string).toUpperCase(),
    airport_name: (formData.get('airport_name') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    share_type: formData.get('share_type') as string,
    shares_available: parseInt(formData.get('shares_available') as string) || 1,
    total_shares: formData.get('total_shares') ? parseInt(formData.get('total_shares') as string) : null,
    buy_in_price: formData.get('buy_in_price') ? parseInt(formData.get('buy_in_price') as string) : null,
    monthly_fixed: formData.get('monthly_fixed') ? parseInt(formData.get('monthly_fixed') as string) : null,
    hourly_wet: formData.get('hourly_wet') ? parseInt(formData.get('hourly_wet') as string) : null,
    min_hours: formData.get('min_hours') ? parseInt(formData.get('min_hours') as string) : null,
    ratings_required: ratings,
    scheduling_system: (formData.get('scheduling_system') as string) || null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: formData.get('contact_email') as string,
    contact_method: (formData.get('contact_method') as string) || 'email',
    contact_phone: (formData.get('contact_phone') as string) || null,
    status: 'active',
    poster_id: null,
  }

  const { data, error } = await supabase.from('partnerships').insert(payload).select('id').single()

  if (error) throw new Error(error.message)

  revalidatePath('/partnerships')
  redirect(`/partnerships/${data.id}`)
}

export async function joinWaitlist(email: string, searchParams: string) {
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('waitlist')
    .upsert(
      { email: email.toLowerCase().trim(), search_params: searchParams, source: 'hero_search' },
      { onConflict: 'email' }
    )

  if (error) return { error: 'Something went wrong. Please try again.' }

  return { ok: true }
}

export async function saveSearch(name: string, searchParams: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('saved_searches').insert({
    user_id: user.id,
    name: name.trim(),
    search_params: searchParams,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You already have a search with that name.' }
    return { error: 'Failed to save search.' }
  }

  revalidatePath('/searches')
  return { ok: true }
}

export async function deleteSavedSearch(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete search.' }

  revalidatePath('/searches')
  return { ok: true }
}
