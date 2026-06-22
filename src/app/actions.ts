'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function createPartnership(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/partnerships/new')

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
    poster_id: user.id,
  }

  const { data, error } = await supabase.from('partnerships').insert(payload).select('id').single()

  if (error) throw new Error(error.message)

  revalidatePath('/partnerships')
  redirect(`/partnerships/${data.id}`)
}

export async function submitFeedback(input: {
  type: 'feedback' | 'issue' | 'request' | 'report'
  message: string
  email?: string
  listingId?: string
  pagePath?: string
}) {
  const message = input.message?.trim()
  if (!message || message.length < 3) {
    return { error: 'Please enter a message.' }
  }
  if (message.length > 5000) {
    return { error: 'Message is too long.' }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('feedback').insert({
    type: input.type,
    message,
    email: input.email?.trim().toLowerCase() || null,
    listing_id: input.listingId || null,
    page_path: input.pagePath || null,
  })

  if (error) return { error: 'Something went wrong. Please try again.' }
  return { ok: true }
}

export async function createSeekerListing(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/partnerships/seeking/new')

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
    poster_id: user.id,
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
    .upsert(
      { email: email.toLowerCase().trim(), search_params: searchParams, source: 'hero_search' },
      { onConflict: 'email' }
    )

  if (error) return { error: 'Something went wrong. Please try again.' }

  return { ok: true }
}

// Basic email-format check (intentionally lenient — server-side guard, not RFC-perfect).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Email-alerts capture (slice 1). Visitors opt into alerts for a make/model or
// state from the programmatic for-sale pages — NO account required. Anon insert
// is allowed by the `alerts` table RLS; rows land status='pending' (the seam for
// a future double-opt-in confirmation). Idempotent on (email, source_path): the
// same email+context twice is a no-op success, never an error.
export async function subscribeToAlerts(
  email: string,
  context: string,
  sourcePath: string
) {
  const clean = (email || '').toLowerCase().trim()
  if (!clean || !EMAIL_RE.test(clean)) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createServerSupabaseClient()

  // Plain INSERT (not upsert): the `alerts` table is insert-only for anon (no
  // public SELECT, to protect PII), and PostgREST upsert needs SELECT to detect
  // conflicts — so we insert and treat a unique-violation (same email+context)
  // as an idempotent success rather than an error. Dedupe is graceful: signing
  // up twice for the same alert is a no-op "you're on the list", not an error.
  const { error } = await supabase.from('alerts').insert({
    email: clean,
    context: context || null,
    source_path: sourcePath || null,
    status: 'pending',
  })

  // 23505 = unique_violation on (email, source_path) — already subscribed. Idempotent.
  if (error && error.code !== '23505') {
    return { error: 'Something went wrong. Please try again.' }
  }

  return { ok: true }
}

// Marketplaces a search can be saved from. Anything else falls back to partnerships.
const SAVED_SEARCH_PATHS = ['/partnerships', '/aircraft'] as const

export async function saveSearch(name: string, searchParams: string, path = '/partnerships') {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const safePath = SAVED_SEARCH_PATHS.includes(path as (typeof SAVED_SEARCH_PATHS)[number])
    ? path
    : '/partnerships'

  const { error } = await supabase.from('saved_searches').insert({
    user_id: user.id,
    name: name.trim(),
    search_params: searchParams,
    path: safePath,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You already have a search with that name.' }
    return { error: 'Failed to save search.' }
  }

  revalidatePath('/searches')
  return { ok: true }
}

// Marketplaces a listing can be favorited from. Anything else is rejected.
const SAVED_LISTING_TYPES = ['partnership', 'aircraft'] as const

// Toggle a favorited listing for the current user. Inserts if absent, removes if
// present. Owner-scoped via RLS; returns the resulting saved state.
export async function toggleSavedListing(
  listingId: string,
  listingType = 'partnership',
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const safeType = SAVED_LISTING_TYPES.includes(listingType as (typeof SAVED_LISTING_TYPES)[number])
    ? listingType
    : 'partnership'

  const { data: existing } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .eq('listing_type', safeType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', user.id)
    if (error) return { error: 'Failed to update saved listing.' }
    revalidatePath('/saved')
    return { ok: true, saved: false }
  }

  const { error } = await supabase
    .from('saved_listings')
    .insert({ user_id: user.id, listing_id: listingId, listing_type: safeType })
  // Unique-violation = a concurrent save already exists; treat as saved.
  if (error && error.code !== '23505') return { error: 'Failed to save listing.' }
  revalidatePath('/saved')
  return { ok: true, saved: true }
}

/**
 * Slice 2 of soft-save: merge a logged-out visitor's device-only saves (held in
 * localStorage) into their real account once they sign in/up. Idempotent and
 * defensive — the payload comes straight from a client localStorage that could be
 * tampered with, so we sanitize, dedupe, cap, and skip rows already on the account.
 */
export async function mergeDeviceSaves(
  saves: { id: string; type: string }[],
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!Array.isArray(saves) || saves.length === 0) return { ok: true, merged: 0 }

  // Sanitize: valid types only, well-formed ids, deduped, count-capped.
  const seen = new Set<string>()
  const rows = saves
    .filter(
      (s): s is { id: string; type: (typeof SAVED_LISTING_TYPES)[number] } =>
        !!s &&
        typeof s.id === 'string' &&
        s.id.length > 0 &&
        s.id.length <= 100 &&
        SAVED_LISTING_TYPES.includes(s.type as (typeof SAVED_LISTING_TYPES)[number]),
    )
    .filter((s) => {
      const key = `${s.type}:${s.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 200)

  if (rows.length === 0) return { ok: true, merged: 0 }

  // Skip rows already on the account so we never duplicate (no reliance on the
  // unique-constraint name) and the count we report is the true new-save count.
  const { data: existing } = await supabase
    .from('saved_listings')
    .select('listing_id, listing_type')
    .eq('user_id', user.id)
  const existingKeys = new Set(
    (existing ?? []).map((r) => `${r.listing_type}:${r.listing_id}`),
  )

  const toInsert = rows
    .filter((s) => !existingKeys.has(`${s.type}:${s.id}`))
    .map((s) => ({ user_id: user.id, listing_id: s.id, listing_type: s.type }))

  if (toInsert.length === 0) return { ok: true, merged: 0 }

  const { error } = await supabase.from('saved_listings').insert(toInsert)
  // 23505 = a concurrent insert beat us to a row; treat the merge as succeeded.
  if (error && error.code !== '23505') return { error: 'Failed to merge device saves.' }
  revalidatePath('/saved')
  return { ok: true, merged: toInsert.length }
}

export async function getOrCreateThread(partnershipId: string, ownerId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (user.id === ownerId) return { error: 'Cannot message your own listing' }

  const { data: existing } = await supabase
    .from('threads')
    .select('id')
    .eq('partnership_id', partnershipId)
    .eq('inquirer_id', user.id)
    .single()

  if (existing) return { threadId: existing.id }

  const { data, error } = await supabase
    .from('threads')
    .insert({ partnership_id: partnershipId, inquirer_id: user.id, owner_id: ownerId })
    .select('id')
    .single()

  if (error) return { error: 'Failed to start conversation.' }
  return { threadId: data.id }
}

export async function sendMessage(threadId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed || trimmed.length > 2000) return { error: 'Invalid message.' }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('messages')
    .insert({ thread_id: threadId, sender_id: user.id, body: trimmed })

  if (error) return { error: 'Failed to send message.' }
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
