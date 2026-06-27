'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPartnershipsByIds } from '@/lib/partnerships'
import { getAircraftForSaleByIds } from '@/lib/aircraftForSale'
import { sendEmail, buildAlertConfirmEmail, buildNewMessageEmail, buildSeedInquiryEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase-admin'
import { isSeedProfile } from '@/lib/seedProfiles'
import { SITE_URL } from '@/lib/seo'
import type { Partnership, AircraftForSale } from '@/lib/types'
import type { AviatorConfig } from '@/components/AviatorAvatar'
import Anthropic from '@anthropic-ai/sdk'

// Simple in-process rate limiter for AI draft generation. Works correctly for
// typical Vercel patterns where warm instances are reused for sequential requests
// from the same session. Not distributed — for high-traffic, swap for Redis/KV;
// at current traffic levels this is sufficient and requires no schema change.
const AI_DRAFT_CALLS = new Map<string, { count: number; resetAt: number }>()
const AI_DRAFT_MAX_PER_HOUR = 10

// Per-thread throttle for new-message email notifications. Stores the timestamp
// of the last email sent for each threadId. At most 1 notification per thread
// per hour — prevents inbox spam in active back-and-forth conversations while
// still delivering the first "you have a new message" nudge.
const MESSAGE_NOTIFY_LAST = new Map<string, number>()
const MESSAGE_NOTIFY_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

async function checkAiDraftAccess(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const now = Date.now()
  const entry = AI_DRAFT_CALLS.get(user.id) ?? { count: 0, resetAt: now + 3_600_000 }
  if (now > entry.resetAt) {
    AI_DRAFT_CALLS.set(user.id, { count: 1, resetAt: now + 3_600_000 })
  } else if (entry.count >= AI_DRAFT_MAX_PER_HOUR) {
    throw new Error('Too many AI draft requests — please wait a bit before trying again.')
  } else {
    AI_DRAFT_CALLS.set(user.id, { count: entry.count + 1, resetAt: entry.resetAt })
  }

  return user.id
}

// Save the signed-in user's chosen aviator avatar to their profile. Upserts the
// profile row (user_id is the PK / RLS key) so it works for users who haven't
// otherwise filled out a profile yet.
export async function saveAvatarConfig(config: AviatorConfig): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, avatar_config: config, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return { ok: false }
  revalidatePath('/account')
  revalidatePath('/') // nav avatar
  return { ok: true }
}

export async function createPartnership(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/partnerships/new')

  const ratingsRaw = formData.get('ratings_required') as string
  const ratings = ratingsRaw ? ratingsRaw.split(',').map((r) => r.trim()).filter(Boolean) : null
  const photoUrls = (formData.getAll('photo_url') as string[]).filter(Boolean)

  // The post form now asks only for the ICAO (frictionless) — derive the airport
  // name / city / state from the authoritative `airports` table so the location is
  // accurate and the `/partnerships/state/[state]` SEO pages still get a real state.
  // Falls back to null when the ICAO isn't in our table (insert still succeeds).
  const home_airport = (formData.get('home_airport') as string).toUpperCase()
  const { data: airport } = await supabase
    .from('airports')
    .select('name, city, state')
    .eq('icao', home_airport)
    .maybeSingle()

  const payload = {
    make: formData.get('make') as string,
    model: formData.get('model') as string,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    registration: (formData.get('registration') as string) || null,
    home_airport,
    airport_name: airport?.name ?? null,
    city: airport?.city ?? null,
    state: airport?.state ?? null,
    share_type: formData.get('share_type') as string,
    shares_available: parseInt(formData.get('shares_available') as string) || 1,
    total_shares: formData.get('total_shares') ? parseInt(formData.get('total_shares') as string) : null,
    buy_in_price: formData.get('buy_in_price') ? parseInt(formData.get('buy_in_price') as string) : null,
    monthly_fixed: formData.get('monthly_fixed') ? parseInt(formData.get('monthly_fixed') as string) : null,
    hourly_wet: formData.get('hourly_wet') ? parseInt(formData.get('hourly_wet') as string) : null,
    min_hours: formData.get('min_hours') ? parseInt(formData.get('min_hours') as string) : null,
    ratings_required: ratings,
    scheduling_system: (formData.get('scheduling_system') as string) || null,
    title: (() => {
      const t = ((formData.get('title') as string) || '').trim()
      if (t) return t
      const make = ((formData.get('make') as string) || '').trim()
      const model = ((formData.get('model') as string) || '').trim()
      return [make, model].filter(Boolean).join(' ') + ' Partnership'
    })(),
    description: (formData.get('description') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: (formData.get('contact_email') as string) || user.email || '',
    contact_method: (formData.get('contact_method') as string) || 'email',
    contact_phone: (formData.get('contact_phone') as string) || null,
    status: 'active',
    poster_id: user.id,
    images: photoUrls.length > 0 ? photoUrls : [],
    // Real user uploads are not placeholders — clear the flag so the gallery
    // shows them without the "Not actual plane photo" badge and OG uses them.
    ...(photoUrls.length > 0 ? { image_is_placeholder: false } : {}),
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

  // The form now asks only for the ICAO (frictionless) — derive the airport
  // name / city / state from the authoritative `airports` table so the location is
  // accurate and the seeking / `/partnerships/state/[state]` SEO surfaces still get a
  // real state. Falls back to null when the ICAO isn't in our table (insert still succeeds).
  const home_airport = (formData.get('home_airport') as string).toUpperCase()
  const { data: airport } = await supabase
    .from('airports')
    .select('name, city, state')
    .eq('icao', home_airport)
    .maybeSingle()

  const payload = {
    preferred_makes,
    preferred_models: (formData.get('preferred_models') as string) || null,
    min_year: formData.get('min_year') ? parseInt(formData.get('min_year') as string) : null,
    max_year: formData.get('max_year') ? parseInt(formData.get('max_year') as string) : null,
    aircraft_category: (formData.get('aircraft_category') as string) || null,
    max_buy_in: formData.get('max_buy_in') ? parseInt(formData.get('max_buy_in') as string) : null,
    max_monthly: formData.get('max_monthly') ? parseInt(formData.get('max_monthly') as string) : null,
    max_hourly: formData.get('max_hourly') ? parseInt(formData.get('max_hourly') as string) : null,
    home_airport,
    airport_name: airport?.name ?? null,
    city: airport?.city ?? null,
    state: airport?.state ?? null,
    willing_to_travel_nm: formData.get('willing_to_travel_nm') ? parseInt(formData.get('willing_to_travel_nm') as string) : null,
    total_hours: formData.get('total_hours') ? parseInt(formData.get('total_hours') as string) : null,
    ratings_held,
    preferred_share_types,
    preferred_scheduling: (formData.get('preferred_scheduling') as string) || null,
    intended_use,
    hours_per_month: formData.get('hours_per_month') ? parseInt(formData.get('hours_per_month') as string) : null,
    title: (formData.get('title') as string)?.trim() ||
      (() => {
        const makePart = preferred_makes?.length ? preferred_makes.join('/') + ' ' : ''
        return `Pilot seeking ${makePart}partnership near ${home_airport}`
      })(),
    description: (formData.get('description') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: (formData.get('contact_email') as string) || user.email || '',
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

export async function createAircraftListing(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/aircraft/new')

  const asking_price = formData.get('asking_price') ? parseInt(formData.get('asking_price') as string) : null
  const photoUrls = (formData.getAll('photo_url') as string[]).filter(Boolean)

  // The form now asks for the ICAO airport code (frictionless) — derive location
  // string and state from the airports table, same pattern as partnership/seeker actions.
  const homeAirportRaw = ((formData.get('home_airport') as string) || '').trim().toUpperCase()
  let location: string | null = null
  let state: string | null = null
  if (homeAirportRaw) {
    const { data: airport } = await supabase
      .from('airports')
      .select('city, state')
      .eq('icao', homeAirportRaw)
      .single()
    if (airport?.city) {
      location = airport.state ? `${airport.city}, ${airport.state}` : airport.city
      state = airport.state ?? null
    }
  }

  const payload = {
    // User-posted listings live alongside scraped inventory; source distinguishes
    // them and source_id stays null (the unique(source, source_id) constraint
    // treats NULLs as distinct, so many user posts coexist).
    source: 'user',
    source_id: null,
    source_url: null,
    make: (formData.get('make') as string) || null,
    model: (formData.get('model') as string) || null,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    registration: (formData.get('registration') as string) || null,
    ttaf: formData.get('ttaf') ? parseInt(formData.get('ttaf') as string) : null,
    smoh: formData.get('smoh') ? parseInt(formData.get('smoh') as string) : null,
    title: (() => {
      const t = ((formData.get('title') as string) || '').trim()
      if (t) return t
      const year = formData.get('year') ? parseInt(formData.get('year') as string) : null
      const make = ((formData.get('make') as string) || '').trim()
      const model = ((formData.get('model') as string) || '').trim()
      return [year, make, model].filter(Boolean).join(' ') || 'Aircraft for Sale'
    })(),
    description: (formData.get('description') as string) || null,
    asking_price,
    price_text: asking_price ? `$${asking_price.toLocaleString('en-US')}` : null,
    location,
    state,
    status: 'active',
    poster_id: user.id,
    images: photoUrls.length > 0 ? photoUrls : [],
    image_is_placeholder: photoUrls.length === 0,
  }

  const { data, error } = await supabase.from('aircraft_for_sale').insert(payload).select('id').single()

  if (error) throw new Error(error.message)

  revalidatePath('/aircraft')
  redirect(`/aircraft/listing/${data.id}?posted=1`)
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

// Email-alerts capture + double-opt-in (slices 1-2). Visitors opt into alerts
// for a make/model or state from the programmatic for-sale pages — NO account
// required. Anon insert is allowed by the `alerts` table RLS; rows land
// status='pending' until the visitor clicks the confirmation link.
//
// We mint the confirm + unsubscribe tokens in-app (rather than relying on the
// column defaults) so the action has them in hand to build the email links
// without needing to read the row back (anon has no SELECT on `alerts`, by
// design — the table holds PII). On a genuinely NEW signup we fire a
// double-opt-in confirmation email; with no `RESEND_API_KEY` configured that
// send is a logged no-op (see `lib/email.ts`), so this is safe to ship.
//
// Idempotent on (email, source_path): the same email+context twice is a no-op
// success (and we do NOT re-send the confirmation), never an error.
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

  const confirmToken = crypto.randomUUID()
  const unsubscribeToken = crypto.randomUUID()

  // Plain INSERT (not upsert): the `alerts` table is insert-only for anon (no
  // public SELECT, to protect PII), and PostgREST upsert needs SELECT to detect
  // conflicts — so we insert and treat a unique-violation (same email+context)
  // as an idempotent success rather than an error.
  const { error } = await supabase.from('alerts').insert({
    email: clean,
    context: context || null,
    source_path: sourcePath || null,
    status: 'pending',
    confirm_token: confirmToken,
    unsubscribe_token: unsubscribeToken,
  })

  // 23505 = unique_violation on (email, source_path) — already subscribed.
  // Idempotent success, and crucially we skip the email so a re-submit can't be
  // used to spam an address with confirmation mail.
  if (error) {
    if (error.code === '23505') return { ok: true }
    return { error: 'Something went wrong. Please try again.' }
  }

  // Genuinely new signup → send the double-opt-in confirmation email. Tokens go
  // in the URL; the confirm/unsubscribe routes look them up with the service
  // role. Awaited but failure is non-fatal (the row is already saved).
  const confirmUrl = `${SITE_URL}/api/alerts/confirm?token=${confirmToken}`
  const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubscribeToken}`
  const { subject, html, text } = buildAlertConfirmEmail({
    context: context || null,
    confirmUrl,
    unsubscribeUrl,
  })
  await sendEmail({ to: clean, subject, html, text })

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
 * Attach (or clear) an optional free-text note on a saved listing. The note lives
 * on the per-user saved_listings row, so users can remember why they saved a plane
 * ("great panel — ask about damage history"). An empty/whitespace note clears it.
 * Owner-scoped server-side (RLS + explicit user_id match). Degrades gracefully if
 * the `note` column hasn't been migrated yet (returns a friendly error).
 */
export async function updateSavedNote(savedRowId: string, note: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = note.trim().slice(0, 1000)

  const { error } = await supabase
    .from('saved_listings')
    .update({ note: trimmed === '' ? null : trimmed })
    .eq('id', savedRowId)
    .eq('user_id', user.id)

  if (error) {
    // 42703 = undefined_column — the note column isn't migrated yet.
    if (error.code === '42703') return { error: 'Notes aren’t available yet — try again shortly.' }
    return { error: 'Failed to save your note.' }
  }

  revalidatePath('/saved')
  return { ok: true, note: trimmed }
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

/**
 * Slice 3 of soft-save. Hydrate a logged-out visitor's device-only save list
 * (held in this browser's localStorage) into renderable card data so `/saved`
 * can show those saves instead of bouncing the visitor to /auth. Read-only — it
 * persists nothing. The payload comes from tamperable localStorage, so it is
 * sanitized exactly like `mergeDeviceSaves` before any lookup.
 */
export async function hydrateDeviceSaves(
  saves: { id: string; type: string }[],
): Promise<{ partnerships: Partnership[]; aircraft: AircraftForSale[] }> {
  if (!Array.isArray(saves) || saves.length === 0) return { partnerships: [], aircraft: [] }

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

  const partnershipIds = rows.filter((s) => s.type === 'partnership').map((s) => s.id)
  const aircraftIds = rows.filter((s) => s.type === 'aircraft').map((s) => s.id)

  // Hydrate, active-only, preserving the device's save order (newest-saved last
  // in the store → the page reverses for display). Orphan/sold saves drop out.
  let partnerships: Partnership[] = []
  if (partnershipIds.length > 0) {
    const fetched = await getPartnershipsByIds(partnershipIds)
    const byId = new Map(
      fetched.filter((p) => p.status === 'active').map((p) => [p.id, p]),
    )
    partnerships = partnershipIds
      .map((id) => byId.get(id))
      .filter((p): p is Partnership => !!p)
  }

  let aircraft: AircraftForSale[] = []
  if (aircraftIds.length > 0) {
    const fetched = await getAircraftForSaleByIds(aircraftIds)
    aircraft = fetched.filter((a) => a.status === 'active')
  }

  return { partnerships, aircraft }
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

export async function getOrCreateSeekerThread(seekerId: string, seekerOwnerId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (user.id === seekerOwnerId) return { error: 'Cannot message your own listing' }

  const { data: existing } = await supabase
    .from('threads')
    .select('id')
    .eq('seeker_id', seekerId)
    .eq('inquirer_id', user.id)
    .maybeSingle()

  if (existing) return { threadId: existing.id }

  const { data, error } = await supabase
    .from('threads')
    .insert({ seeker_id: seekerId, inquirer_id: user.id, owner_id: seekerOwnerId })
    .select('id')
    .single()

  if (error) return { error: 'Failed to start conversation.' }
  return { threadId: data.id }
}

export async function getOrCreateAircraftThread(aircraftId: string, ownerId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (user.id === ownerId) return { error: 'Cannot message your own listing' }

  const { data: existing } = await supabase
    .from('threads')
    .select('id')
    .eq('aircraft_for_sale_id', aircraftId)
    .eq('inquirer_id', user.id)
    .maybeSingle()

  if (existing) return { threadId: existing.id }

  const { data, error } = await supabase
    .from('threads')
    .insert({ aircraft_for_sale_id: aircraftId, inquirer_id: user.id, owner_id: ownerId })
    .select('id')
    .single()

  if (error) return { error: 'Failed to start conversation.' }
  return { threadId: data.id }
}

// Look up the thread's OTHER participant and send them a new-message email.
// Throttled to at most one email per thread per hour to avoid spamming active
// conversations. Resolves (never throws) so the caller can fire-and-forget safely.
async function notifyMessageRecipient(threadId: string, senderId: string): Promise<void> {
  try {
    // Throttle: skip if we already sent a notification for this thread recently.
    const now = Date.now()
    const lastSent = MESSAGE_NOTIFY_LAST.get(threadId) ?? 0
    if (now - lastSent < MESSAGE_NOTIFY_INTERVAL_MS) return

    // Service-role client: need to read thread + look up recipient email.
    const admin = createAdminClient()
    const { data: thread } = await admin
      .from('threads')
      .select('owner_id, inquirer_id, partnership_id')
      .eq('id', threadId)
      .single()
    if (!thread) return

    const recipientId =
      thread.inquirer_id === senderId ? thread.owner_id : thread.inquirer_id
    if (!recipientId || recipientId === senderId) return

    const { data: { user: recipient } } = await admin.auth.admin.getUserById(recipientId)
    if (!recipient?.email) return

    const threadUrl = `${SITE_URL}/messages/${threadId}`

    // Inquiry on a seed persona? Send the recipient (the seed listings' owner) a
    // rich, context-carrying alert — inquirer email, message body, listing — so
    // they can respond straight from their inbox. Detected from the listing itself
    // (isSeedProfile), so it's independent of which account owns the seed rows.
    const listing = thread.partnership_id
      ? (await admin
          .from('partnerships')
          .select('title, contact_name, contact_email, source_url')
          .eq('id', thread.partnership_id)
          .single()).data
      : null

    if (listing && isSeedProfile(listing)) {
      const [{ data: { user: inquirer } }, { data: lastMsg }] = await Promise.all([
        admin.auth.admin.getUserById(senderId),
        admin.from('messages').select('body').eq('thread_id', threadId).order('created_at', { ascending: false }).limit(1).single(),
      ])
      await sendEmail({
        ...buildSeedInquiryEmail({
          personaName: listing.contact_name ?? 'Seed listing',
          listingTitle: listing.title ?? 'a partnership listing',
          listingUrl: `${SITE_URL}/partnerships/${thread.partnership_id}`,
          threadUrl,
          inquirerEmail: inquirer?.email ?? null,
          body: lastMsg?.body ?? '',
        }),
        to: recipient.email,
      })
    } else {
      await sendEmail({ ...buildNewMessageEmail({ threadUrl }), to: recipient.email })
    }

    // Record successful send time so subsequent messages in this thread are suppressed.
    MESSAGE_NOTIFY_LAST.set(threadId, Date.now())
  } catch {
    // Non-fatal — message is already saved; email is best-effort.
  }
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

  // Stamp the thread so the unread-badge query can check cheaply (no join needed).
  await supabase
    .from('threads')
    .update({ last_message_at: new Date().toISOString(), last_message_sender_id: user.id })
    .eq('id', threadId)

  // Fire-and-forget: notify the other participant by email (no-op when RESEND_API_KEY absent).
  void notifyMessageRecipient(threadId, user.id)

  return { ok: true }
}

export async function markThreadRead(threadId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: thread } = await supabase
    .from('threads')
    .select('id, inquirer_id, owner_id')
    .eq('id', threadId)
    .single()

  if (!thread) return

  const field = thread.inquirer_id === user.id ? 'inquirer_read_at' : 'owner_read_at'
  await supabase
    .from('threads')
    .update({ [field]: new Date().toISOString() })
    .eq('id', threadId)
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

// Rename a saved search's display name (slice 2 of one-click save). Owner-scoped
// (user_id + RLS), additive — only the `name` column changes, never the criteria.
// Mirrors saveSearch's 23505 handling so a duplicate name is a friendly message,
// not a crash.
export async function renameSavedSearch(id: string, name: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = name.trim().slice(0, 120)
  if (!trimmed) return { error: 'Name cannot be empty.' }

  const { error } = await supabase
    .from('saved_searches')
    .update({ name: trimmed })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'You already have a search with that name.' }
    return { error: 'Failed to rename search.' }
  }

  revalidatePath('/searches')
  return { ok: true }
}

export interface PartnershipDraft {
  title: string
  description: string
  make?: string
  model?: string
  year?: number
  registration?: string
  home_airport?: string
  share_type?: string
  total_shares?: number
  shares_available?: number
  buy_in_price?: number
  monthly_fixed?: number
  hourly_wet?: number
}

export async function generatePartnershipDraft(prompt: string): Promise<PartnershipDraft> {
  await checkAiDraftAccess()
  const text = prompt.trim()
  if (!text) throw new Error('Prompt is required.')
  if (text.length > 2000) throw new Error('Prompt is too long.')

  const client = new Anthropic()
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: `You help aircraft owners write "Partnership Available" listings for ClubHanger, a co-ownership marketplace.

Given the owner's notes or a pasted listing, do TWO things:

1. Extract every structured fact present in the input (do NOT invent facts):
   - make: one of "Cessna","Piper","Beechcraft","Cirrus","Mooney","Van's","Diamond","Grumman","Other" — or omit if not clear
   - model: aircraft model string, e.g. "172S Skyhawk" — or omit
   - year: 4-digit integer — or omit
   - registration: FAA N-number, e.g. "N12345" — or omit
   - home_airport: 4-letter ICAO code, e.g. "KAUS" — or omit
   - share_type: one of "1/2","1/3","1/4","leaseback","dry_lease","other" — or omit
   - total_shares: total number of shares in the partnership (integer) — or omit
   - shares_available: number of shares being offered (integer) — or omit
   - buy_in_price: buy-in cost in USD as integer (no $ or commas) — or omit
   - monthly_fixed: monthly fixed cost per partner in USD as integer — or omit
   - hourly_wet: wet rate per hour in USD as integer — or omit

2. Draft the listing:
   - title: concise, specific (max 120 chars) — include share type, year + make + model, and airport if mentioned
   - description: compelling 200–350 word write-up covering aircraft (condition, avionics, maintenance), the partnership (costs, scheduling, current partners), and what you're looking for in a new partner. Write in a warm, direct owner voice.

Rules: never invent facts not in the input. Omit structured fields entirely when they aren't mentioned. Use natural placeholders like "[X]-hour engine" only in the description if clearly implied.`,
    tools: [
      {
        name: 'draft_listing',
        description: 'Output the drafted listing with all extracted structured fields.',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string', description: 'Concise listing title, max 120 characters' },
            description: { type: 'string', description: 'Listing description, 200–350 words, owner voice' },
            make: { type: 'string', enum: ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman', 'Other'], description: 'Aircraft manufacturer — must be one of the enum values' },
            model: { type: 'string', description: 'Aircraft model, e.g. "172S Skyhawk"' },
            year: { type: 'integer', description: 'Model year, e.g. 2004' },
            registration: { type: 'string', description: 'FAA N-number, e.g. N12345' },
            home_airport: { type: 'string', description: '4-letter ICAO airport code, e.g. KAUS' },
            share_type: { type: 'string', enum: ['1/2', '1/3', '1/4', 'leaseback', 'dry_lease', 'other'], description: 'Share type offered' },
            total_shares: { type: 'integer', description: 'Total number of shares in the partnership' },
            shares_available: { type: 'integer', description: 'Number of shares being offered' },
            buy_in_price: { type: 'integer', description: 'Buy-in price in USD, no $ or commas' },
            monthly_fixed: { type: 'integer', description: 'Monthly fixed cost per partner in USD' },
            hourly_wet: { type: 'integer', description: 'Wet rate per flight hour in USD' },
          },
          required: ['title', 'description'],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'draft_listing' },
    messages: [{ role: 'user', content: text }],
  })

  const block = res.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('No draft generated.')
  const f = block.input as PartnershipDraft
  if (!f.title || !f.description) throw new Error('Incomplete draft generated.')
  return {
    title: f.title.slice(0, 200),
    description: f.description,
    make: f.make,
    model: f.model,
    year: f.year,
    registration: f.registration,
    home_airport: f.home_airport ? f.home_airport.toUpperCase().slice(0, 4) : undefined,
    share_type: f.share_type,
    total_shares: f.total_shares,
    shares_available: f.shares_available,
    buy_in_price: f.buy_in_price,
    monthly_fixed: f.monthly_fixed,
    hourly_wet: f.hourly_wet,
  }
}

export interface SeekerDraft {
  title: string
  description: string
  preferred_makes?: string
  preferred_models?: string
  aircraft_category?: 'any' | 'sel' | 'mel' | 'turboprop' | 'jet'
  min_year?: number
  max_year?: number
  max_buy_in?: number
  max_monthly?: number
  max_hourly?: number
  home_airport?: string
  willing_to_travel_nm?: number
  total_hours?: number
  ratings_held?: string
  hours_per_month?: number
}

export async function generateSeekerDraft(prompt: string): Promise<SeekerDraft> {
  await checkAiDraftAccess()
  const text = prompt.trim()
  if (!text) throw new Error('Prompt is required.')
  if (text.length > 2000) throw new Error('Prompt is too long.')

  const client = new Anthropic()
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: `You help pilots write "Seeking Aircraft Partnership" listings for ClubHanger, a co-ownership marketplace.

Given the pilot's stream-of-consciousness notes, do TWO things:

1. Extract every structured fact present in the input (do NOT invent facts):
   - preferred_makes: comma-separated makes the pilot wants, e.g. "Cessna, Piper" — or omit if not mentioned
   - preferred_models: free text models, e.g. "172, 182, SR22" — or omit
   - aircraft_category: one of "any","sel","mel","turboprop","jet" — omit if unclear (default omit, not "any")
   - min_year: earliest acceptable model year as integer — or omit
   - max_year: latest acceptable model year as integer — or omit
   - max_buy_in: maximum buy-in in USD as integer, no $ or commas — or omit
   - max_monthly: maximum monthly fixed cost in USD as integer — or omit
   - max_hourly: maximum wet rate per hour in USD as integer — or omit
   - home_airport: 4-letter ICAO code if mentioned, e.g. "KPAO" — or omit
   - willing_to_travel_nm: how far they'll commute in nautical miles; map drive times to: 25 (~30 min), 40 (~45 min), 50 (~1 hr), 75 (~1.5 hr), 100 (~2 hr) — or omit
   - total_hours: total flight hours as integer — or omit
   - ratings_held: comma-separated ratings, e.g. "PPL, IFR, Complex" — or omit
   - hours_per_month: expected flying hours per month as integer — or omit

2. Draft the listing:
   - title: concise, specific (max 120 chars) — include ratings, desired share type, aircraft type, and airport if mentioned
   - description: compelling 200–350 word first-person write-up covering who they are (ratings, hours, currency), how they fly (missions, frequency), what they want (share/aircraft/budget/airport), and why they'd be a great partner.

Rules: never invent facts not in the input. Omit structured fields entirely when they aren't mentioned. Write in a direct, professional but warm first-person voice.`,
    tools: [
      {
        name: 'draft_listing',
        description: 'Output the drafted listing with all extracted structured fields.',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string', description: 'Concise listing title, max 120 characters' },
            description: { type: 'string', description: 'Listing description, 200–350 words, first-person' },
            preferred_makes: { type: 'string', description: 'Comma-separated makes, e.g. "Cessna, Piper"' },
            preferred_models: { type: 'string', description: 'Comma-separated models, e.g. "172, 182, SR22"' },
            aircraft_category: { type: 'string', enum: ['any', 'sel', 'mel', 'turboprop', 'jet'], description: 'Aircraft category' },
            min_year: { type: 'integer', description: 'Earliest acceptable model year' },
            max_year: { type: 'integer', description: 'Latest acceptable model year' },
            max_buy_in: { type: 'integer', description: 'Max buy-in in USD, integer only' },
            max_monthly: { type: 'integer', description: 'Max monthly fixed cost in USD, integer only' },
            max_hourly: { type: 'integer', description: 'Max wet rate per hour in USD, integer only' },
            home_airport: { type: 'string', description: '4-letter ICAO airport code, e.g. KPAO' },
            willing_to_travel_nm: { type: 'integer', enum: [25, 40, 50, 75, 100], description: 'Commute radius in nm: 25=~30min, 40=~45min, 50=~1hr, 75=~1.5hr, 100=~2hr' },
            total_hours: { type: 'integer', description: 'Total flight hours' },
            ratings_held: { type: 'string', description: 'Comma-separated ratings, e.g. "PPL, IFR, Complex"' },
            hours_per_month: { type: 'integer', description: 'Expected flying hours per month' },
          },
          required: ['title', 'description'],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'draft_listing' },
    messages: [{ role: 'user', content: text }],
  })

  const block = res.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('No draft generated.')
  const f = block.input as SeekerDraft
  if (!f.title || !f.description) throw new Error('Incomplete draft generated.')
  return {
    title: f.title.slice(0, 200),
    description: f.description,
    preferred_makes: f.preferred_makes,
    preferred_models: f.preferred_models,
    aircraft_category: f.aircraft_category,
    min_year: f.min_year,
    max_year: f.max_year,
    max_buy_in: f.max_buy_in,
    max_monthly: f.max_monthly,
    max_hourly: f.max_hourly,
    home_airport: f.home_airport ? f.home_airport.toUpperCase().slice(0, 4) : undefined,
    willing_to_travel_nm: f.willing_to_travel_nm,
    total_hours: f.total_hours,
    ratings_held: f.ratings_held,
    hours_per_month: f.hours_per_month,
  }
}

export interface AircraftDraft {
  title: string
  description: string
  make?: string
  model?: string
  year?: number
  registration?: string
  ttaf?: number
  smoh?: number
  asking_price?: number
  home_airport?: string
}

export async function generateAircraftDraft(prompt: string): Promise<AircraftDraft> {
  await checkAiDraftAccess()
  const text = prompt.trim()
  if (!text) throw new Error('Prompt is required.')
  if (text.length > 2000) throw new Error('Prompt is too long.')

  const client = new Anthropic()
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: `You help pilots and aircraft owners post "Aircraft for Sale" listings on ClubHanger.

Given the seller's notes or a pasted listing, do TWO things:

1. Extract every structured fact present in the input (do NOT invent facts):
   - make: one of "Cessna","Piper","Beechcraft","Cirrus","Mooney","Van's","Diamond","Grumman","Other" — or omit if not clear
   - model: model string, e.g. "182T Skylane" or "SR22 G6" — or omit
   - year: 4-digit integer — or omit
   - registration: FAA N-number, e.g. "N12345" — or omit
   - ttaf: total airframe hours as integer — or omit
   - smoh: hours since major overhaul as integer — or omit
   - asking_price: integer dollars (no $ sign, no commas) — or omit
   - home_airport: 4-letter ICAO airport code where the aircraft is based, e.g. "KAUS" — or omit if not mentioned

2. Draft the listing:
   - title: concise, specific (max 120 chars) — include year + make + model and the top selling point
   - description: 150–300 word seller write-up — cover specs, avionics, engine/prop times, maintenance, condition, reason for selling. End with a "Why you'll love it" sentence.

Rules: never invent numbers or facts not in the input. Use natural placeholders like "[X]-hour engine" only in the description if a detail is clearly implied but the number is missing. Omit structured fields entirely when they aren't in the input.`,
    tools: [
      {
        name: 'draft_listing',
        description: 'Output the drafted listing with all extracted structured fields.',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string', description: 'Concise listing title, max 120 characters' },
            description: { type: 'string', description: 'Listing description, 150–300 words, seller voice' },
            make: { type: 'string', enum: ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman', 'Other'], description: 'Aircraft manufacturer — must be one of the enum values' },
            model: { type: 'string', description: 'Aircraft model, e.g. "182T Skylane"' },
            year: { type: 'integer', description: 'Model year, e.g. 2006' },
            registration: { type: 'string', description: 'FAA N-number, e.g. N12345' },
            ttaf: { type: 'integer', description: 'Total time airframe, hours' },
            smoh: { type: 'integer', description: 'Hours since major overhaul' },
            asking_price: { type: 'integer', description: 'Asking price in USD, no $ or commas' },
            home_airport: { type: 'string', description: '4-letter ICAO airport code where aircraft is based, e.g. "KAUS"' },
          },
          required: ['title', 'description'],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'draft_listing' },
    messages: [{ role: 'user', content: text }],
  })

  const saleBlock = res.content.find((b) => b.type === 'tool_use')
  if (!saleBlock || saleBlock.type !== 'tool_use') throw new Error('No draft generated.')
  const sale = saleBlock.input as AircraftDraft
  if (!sale.title || !sale.description) throw new Error('Incomplete draft generated.')
  return {
    title: sale.title.slice(0, 200),
    description: sale.description,
    make: sale.make,
    model: sale.model,
    year: sale.year,
    registration: sale.registration,
    ttaf: sale.ttaf,
    smoh: sale.smoh,
    asking_price: sale.asking_price,
    home_airport: sale.home_airport ? sale.home_airport.toUpperCase().slice(0, 4) : undefined,
  }
}
