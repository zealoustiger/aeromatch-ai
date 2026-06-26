'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPartnershipsByIds } from '@/lib/partnerships'
import { getAircraftForSaleByIds } from '@/lib/aircraftForSale'
import { sendEmail, buildAlertConfirmEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/seo'
import type { Partnership, AircraftForSale } from '@/lib/types'
import type { AviatorConfig } from '@/components/AviatorAvatar'
import Anthropic from '@anthropic-ai/sdk'

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

export async function createAircraftListing(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/aircraft/new')

  const asking_price = formData.get('asking_price') ? parseInt(formData.get('asking_price') as string) : null
  const state = ((formData.get('state') as string) || '').toUpperCase().slice(0, 2) || null

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
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    asking_price,
    price_text: asking_price ? `$${asking_price.toLocaleString('en-US')}` : null,
    location: (formData.get('location') as string) || null,
    state,
    status: 'active',
    poster_id: user.id,
    images: [],
    image_is_placeholder: true,
  }

  const { data, error } = await supabase.from('aircraft_for_sale').insert(payload).select('id').single()

  if (error) throw new Error(error.message)

  revalidatePath('/aircraft')
  redirect(`/aircraft?posted=${data.id}`)
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

export async function generatePartnershipDraft(prompt: string): Promise<{ title: string; description: string }> {
  const text = prompt.trim()
  if (!text) throw new Error('Prompt is required.')
  if (text.length > 2000) throw new Error('Prompt is too long.')

  const client = new Anthropic()
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You help aircraft owners write "Partnership Available" listings for ClubHanger, a co-ownership marketplace.

Given the owner's stream-of-consciousness notes about their aircraft and partnership, produce:
1. title: A concise, specific listing title (max 120 chars) — include share type, year + make + model, and airport if mentioned (e.g. "1/3 Share — 2004 Cessna 172S, Austin TX (KAUS)").
2. description: A compelling 200–350 word write-up covering the aircraft (condition, avionics, maintenance history), the partnership structure (current partners, scheduling, costs if mentioned), what makes this a great opportunity, and what you're looking for in a new partner (experience level, use patterns, communication style).

Do not invent facts not present in the prompt; if key details are missing, use natural placeholders like "[X]-hour engine." Write in a direct, welcoming owner voice — warm but professional.`,
    tools: [
      {
        name: 'draft_listing',
        description: 'Output the drafted listing title and description.',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string', description: 'Concise listing title, max 120 characters' },
            description: { type: 'string', description: 'Listing description, 200–350 words, owner voice' },
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
  const f = block.input as { title: string; description: string }
  if (!f.title || !f.description) throw new Error('Incomplete draft generated.')
  return { title: f.title.slice(0, 200), description: f.description }
}

export async function generateSeekerDraft(prompt: string): Promise<{ title: string; description: string }> {
  const text = prompt.trim()
  if (!text) throw new Error('Prompt is required.')
  if (text.length > 2000) throw new Error('Prompt is too long.')

  const client = new Anthropic()
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You help pilots write "Seeking Aircraft Partnership" listings for ClubHanger, a co-ownership marketplace.

Given the pilot's stream-of-consciousness notes, produce:
1. title: A concise, specific listing title (max 120 chars) — include ratings, desired share type, aircraft type, and location or airport if mentioned.
2. description: A compelling 200–350 word first-person write-up covering who they are (ratings, hours, currency), how they fly (missions, frequency), what they want (share/aircraft/budget/airport), and why they'd be a great partner (aircraft care, communication style, reserves).

Do not invent facts not present in the prompt; if key details are missing, use natural placeholders like "[X] hours total time". Write in a direct, professional but warm first-person voice.`,
    tools: [
      {
        name: 'draft_listing',
        description: 'Output the drafted listing title and description.',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string', description: 'Concise listing title, max 120 characters' },
            description: { type: 'string', description: 'Listing description, 200–350 words, first-person' },
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
  const f = block.input as { title: string; description: string }
  if (!f.title || !f.description) throw new Error('Incomplete draft generated.')
  return { title: f.title.slice(0, 200), description: f.description }
}
