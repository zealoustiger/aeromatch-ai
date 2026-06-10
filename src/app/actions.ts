'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

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

export async function createSeekerListing(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const makesRaw = formData.get('preferred_makes') as string
  const preferred_makes = makesRaw ? makesRaw.split(',').map((m) => m.trim()).filter(Boolean) : null

  const ratingsRaw = formData.get('ratings_held') as string
  const ratings_held = ratingsRaw ? ratingsRaw.split(',').map((r) => r.trim()).filter(Boolean) : null

  const shareTypesRaw = formData.get('preferred_share_types') as string
  const preferred_share_types = shareTypesRaw ? shareTypesRaw.split(',').map((s) => s.trim()).filter(Boolean) : null

  const useRaw = formData.get('intended_use') as string
  const intended_use = useRaw ? useRaw.split(',').map((u) => u.trim()).filter(Boolean) : null

  const payload = {
    preferred_makes,
    preferred_models: (formData.get('preferred_models') as string) || null,
    min_year: formData.get('min_year') ? parseInt(formData.get('min_year') as string) : null,
    max_year: formData.get('max_year') ? parseInt(formData.get('max_year') as string) : null,
    aircraft_category: (formData.get('aircraft_category') as string) || null,
    max_buy_in: formData.get('max_buy_in') ? parseInt(formData.get('max_buy_in') as string) : null,
    max_monthly: formData.get('max_monthly') ? parseInt(formData.get('max_monthly') as string) : null,
    max_hourly: formData.get('max_hourly') ? parseInt(formData.get('max_hourly') as string) : null,
    home_airport: (formData.get('home_airport') as string).toUpperCase(),
    airport_name: (formData.get('airport_name') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    willing_to_travel_nm: formData.get('willing_to_travel_nm') ? parseInt(formData.get('willing_to_travel_nm') as string) : null,
    total_hours: formData.get('total_hours') ? parseInt(formData.get('total_hours') as string) : null,
    ratings_held,
    preferred_share_types,
    preferred_scheduling: (formData.get('preferred_scheduling') as string) || null,
    intended_use,
    hours_per_month: formData.get('hours_per_month') ? parseInt(formData.get('hours_per_month') as string) : null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: formData.get('contact_email') as string,
    contact_method: (formData.get('contact_method') as string) || 'email',
    contact_phone: (formData.get('contact_phone') as string) || null,
    status: 'active',
    poster_id: null,
  }

  const { data, error } = await supabase.from('partnership_seekers').insert(payload).select('id').single()

  if (error) throw new Error(error.message)

  revalidatePath('/partnerships/seeking')
  redirect(`/partnerships/seeking/${data.id}`)
}

export async function joinWaitlist(email: string, searchParams: string) {
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('waitlist')
    .upsert({ email: email.toLowerCase().trim(), search_params: searchParams, source: 'hero_search' }, { onConflict: 'email' })

  if (error) return { error: 'Something went wrong. Please try again.' }

  return { ok: true }
}
