'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPartnershipsByIds } from '@/lib/partnerships'
import { getAircraftForSaleByIds } from '@/lib/aircraftForSale'
import { getAircraftCompVerdicts, type AircraftCompVerdict } from '@/lib/aircraftComps'
import { getSeekersByIds } from '@/lib/seekersQuery'
import {
  getPartnershipCompVerdicts,
  getSeekerBudgetCheckVerdicts,
  type PartnershipCardVerdict,
  type PartnershipCompVerdict,
} from '@/lib/partnershipComps'
import { getSaveCounts } from '@/lib/saveCounts'
import { sendEmail, buildAlertConfirmEmail, buildNewMessageEmail, buildSeedInquiryEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase-admin'
import { isSeedProfile } from '@/lib/seedProfiles'
import { SITE_URL } from '@/lib/seo'
import { validateReview } from '@/lib/reviewValidation'
import { assertSafePublicUrl } from '@/lib/urlFetchGuard'
import { parseEditableAlertTarget, buildAlertCriteriaUpdate, type AlertCriteriaFields } from '@/lib/alertEditCriteria'
import { normalizeFrequency, type AlertFrequency } from '@/lib/alertFrequency'
import { htmlToReadableText } from '@/lib/htmlText'
import type { Partnership, AircraftForSale, PartnershipSeeker } from '@/lib/types'
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

// Let a signed-in pilot set their base airport (profiles.home_airport, already exists
// but was never settable) + up to 3 favorite/frequently-visited airports. Seeds the
// prerequisite for a future airport-page "pilots based here" section (BACKLOG.md).
// Each non-blank code is validated against the real airports table (same "reject a
// fake/typo'd ICAO" pattern as createPartnership/createSeekerListing) — a blank field
// just clears that slot rather than erroring.
export async function updateProfile(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  async function resolveIcao(raw: string): Promise<string | null> {
    const code = raw.trim().toUpperCase()
    if (!code) return null
    const { data } = await supabase.from('airports').select('icao').eq('icao', code).maybeSingle()
    if (!data) throw new Error(`We couldn't find an airport with the code "${code}". Please pick one from the suggestions list, or double-check the 4-letter code.`)
    return data.icao as string
  }

  let home_airport: string | null
  let favorites: string[]
  try {
    home_airport = await resolveIcao((formData.get('home_airport') as string) || '')
    const rawFavorites = ['favorite_airport_1', 'favorite_airport_2', 'favorite_airport_3']
      .map((k) => (formData.get(k) as string) || '')
    const resolved = await Promise.all(rawFavorites.map(resolveIcao))
    // Dedupe, drop blanks, drop anything matching the base airport, cap at 3.
    favorites = Array.from(new Set(resolved.filter((a): a is string => !!a && a !== home_airport))).slice(0, 3)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid airport code.' }
  }

  // Blank → null (not ''), so /pilots/[id]'s `display_name || 'ClubHanger member'` and
  // `mission || bio` fallbacks keep working. Trimmed + length-capped server-side too,
  // not just via the form's maxLength, since FormData can be posted directly.
  function trimmedOrNull(raw: string | null, maxLen: number): string | null {
    const trimmed = (raw ?? '').trim()
    return trimmed ? trimmed.slice(0, maxLen) : null
  }
  const display_name = trimmedOrNull(formData.get('display_name') as string | null, 60)
  const mission = trimmedOrNull(formData.get('mission') as string | null, 140)
  const bio = trimmedOrNull(formData.get('bio') as string | null, 600)

  const basePayload = {
    user_id: user.id,
    home_airport,
    display_name,
    mission,
    bio,
    updated_at: new Date().toISOString(),
  }
  const payload = { ...basePayload, favorite_airports: favorites }

  let { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' })

  // If favorite_airports hasn't been migrated live yet, retry without it — the base
  // airport still saves (graceful fallback, same pattern as additional_airports).
  if (error && error.message?.includes('favorite_airports')) {
    ;({ error } = await supabase.from('profiles').upsert(basePayload, { onConflict: 'user_id' }))
  }

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account')
  revalidatePath(`/pilots/${user.id}`)
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
  // Rejects (throws) when the ICAO isn't in our ~17k-row table rather than silently
  // saving a listing with a null location — a syntactically-valid-but-fake code is
  // almost always a typo, not a real gap in coverage.
  const home_airport = (formData.get('home_airport') as string).toUpperCase()
  const { data: airport } = await supabase
    .from('airports')
    .select('name, city, state')
    .eq('icao', home_airport)
    .maybeSingle()
  if (!airport) {
    throw new Error(`We couldn't find an airport with the code "${home_airport}". Please pick one from the suggestions list, or double-check the 4-letter code.`)
  }

  const basePayload = {
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
    contact_method: (formData.get('contact_method') as string) || 'platform',
    contact_phone: (formData.get('contact_phone') as string) || null,
    status: 'active',
    poster_id: user.id,
    images: photoUrls.length > 0 ? photoUrls : [],
    // Real user uploads are not placeholders — clear the flag so the gallery
    // shows them without the "Not actual plane photo" badge and OG uses them.
    ...(photoUrls.length > 0 ? { image_is_placeholder: false } : {}),
  }

  // ttaf/smoh/engine_type and annual_due/damage_history each require their own
  // not-yet-applied migration (schema.sql — partnership_add_spec_fields and
  // partnership_add_annual_damage). Always attempt with both groups first so they
  // start round-tripping the moment each migration lands; the fallback loop below
  // drops whichever group Postgres reports missing (in either order) and retries,
  // converging on basePayload-only rather than ever failing the post.
  const specFields = {
    ttaf: formData.get('ttaf') ? parseInt(formData.get('ttaf') as string) : null,
    smoh: formData.get('smoh') ? parseInt(formData.get('smoh') as string) : null,
    engine_type: ((formData.get('engine_type') as string) || '').trim() || null,
  }
  const annualDamageFields = {
    annual_due: (() => {
      const raw = (formData.get('annual_due') as string) || ''
      return raw ? `${raw}-01` : null
    })(),
    damage_history: (() => {
      const raw = formData.get('damage_history') as string
      return raw === 'true' ? true : raw === 'false' ? false : null
    })(),
  }
  const optionalGroups = [
    { pattern: /'(ttaf|smoh|engine_type)'/i, fields: specFields },
    { pattern: /'(annual_due|damage_history)'/i, fields: annualDamageFields },
  ]
  let activeGroups = optionalGroups
  let { data, error } = await supabase
    .from('partnerships')
    .insert({ ...basePayload, ...Object.assign({}, ...activeGroups.map((g) => g.fields)) })
    .select('id')
    .single()

  // Graceful fallback: drop whichever optional column group Postgres reports
  // missing and retry, so the listing still goes live before every migration lands
  // (same pattern as createSeekerListing's additional_airports fallback).
  while (error && activeGroups.length > 0) {
    const idx = activeGroups.findIndex((g) => g.pattern.test(error!.message ?? ''))
    if (idx === -1) break
    activeGroups = activeGroups.filter((_, i) => i !== idx)
    const retry = await supabase
      .from('partnerships')
      .insert({ ...basePayload, ...Object.assign({}, ...activeGroups.map((g) => g.fields)) })
      .select('id')
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)

  // Persist contact_name to user_metadata for future form pre-fills.
  // Magic-link users have no full_name set (Google OAuth users do); saving it here
  // means the next post form visit pre-fills their name via the contact-prefill logic.
  const contactName = (formData.get('contact_name') as string)?.trim()
  if (contactName && !user.user_metadata?.full_name) {
    await supabase.auth.updateUser({ data: { full_name: contactName } })
  }

  // Same lazy-save for contact_phone — one fewer field to retype on the next listing.
  const contactPhone = (formData.get('contact_phone') as string)?.trim()
  if (contactPhone && !user.user_metadata?.contact_phone) {
    await supabase.auth.updateUser({ data: { contact_phone: contactPhone } })
  }

  revalidatePath('/partnerships')
  redirect(`/partnerships/${data!.id}?posted=1`)
}

// Edit an existing user-posted partnership listing. Mirrors createPartnership's
// column set + derivation logic, but updates the row in place instead of
// inserting, and is ownership-scoped the same way deactivateListing/relistListing
// are (.eq('poster_id', user.id) on the update — RLS backs this up too). Unlike
// aircraft_for_sale, the partnerships table stores the raw ICAO in home_airport
// (not just the derived city/state), so — unlike updateAircraftListing — the
// edit form can always prefill "Home Airport" and this action can always safely
// re-derive airport_name/city/state on save; no "only touch if resupplied" case.
export async function updatePartnershipListing(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth?next=/partnerships/${id}/edit`)

  const ratingsRaw = formData.get('ratings_required') as string
  const ratings = ratingsRaw ? ratingsRaw.split(',').map((r) => r.trim()).filter(Boolean) : null
  const photoUrls = (formData.getAll('photo_url') as string[]).filter(Boolean)

  const home_airport = ((formData.get('home_airport') as string) || '').trim().toUpperCase()
  const { data: airport } = await supabase
    .from('airports')
    .select('name, city, state')
    .eq('icao', home_airport)
    .maybeSingle()
  if (!airport) {
    throw new Error(`We couldn't find an airport with the code "${home_airport}". Please pick one from the suggestions list, or double-check the 4-letter code.`)
  }

  const buy_in_price = formData.get('buy_in_price') ? parseInt(formData.get('buy_in_price') as string) : null

  // Price-history: read the currently-stored buy-in before overwriting it, so a real
  // change (both old and new known and different) can be recorded as a "seller
  // motivation" signal on the listing page — mirrors aircraft_for_sale's
  // previous_price/price_changed_at, set by the scraper on every detected price change.
  // Requires the partnership_add_price_history migration (graceful fallback below).
  const { data: existingRow } = await supabase
    .from('partnerships')
    .select('buy_in_price')
    .eq('id', id)
    .eq('poster_id', user.id)
    .maybeSingle()
  const priceChangeFields =
    existingRow?.buy_in_price != null && buy_in_price != null && existingRow.buy_in_price !== buy_in_price
      ? { previous_buy_in_price: existingRow.buy_in_price, buy_in_price_changed_at: new Date().toISOString() }
      : {}

  const basePayload = {
    make: (formData.get('make') as string) || null,
    model: (formData.get('model') as string) || null,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    registration: (formData.get('registration') as string) || null,
    home_airport,
    airport_name: airport?.name ?? null,
    city: airport?.city ?? null,
    state: airport?.state ?? null,
    share_type: formData.get('share_type') as string,
    shares_available: parseInt(formData.get('shares_available') as string) || 1,
    total_shares: formData.get('total_shares') ? parseInt(formData.get('total_shares') as string) : null,
    buy_in_price,
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
    contact_method: (formData.get('contact_method') as string) || 'platform',
    contact_phone: (formData.get('contact_phone') as string) || null,
    images: photoUrls.length > 0 ? photoUrls : [],
    image_is_placeholder: photoUrls.length === 0,
  }

  // See createPartnership — same not-yet-applied-migration graceful fallback, now
  // covering THREE independent optional column groups, each behind its own
  // not-yet-applied migration: spec fields (ttaf/smoh/engine_type),
  // previous_buy_in_price/buy_in_price_changed_at (above), and annual_due/
  // damage_history. The fallback loop below sheds whichever group's columns the
  // error names, one at a time, in whatever order Postgres reports them, until it
  // converges on basePayload-only — never throws just because one or more
  // optional column sets aren't applied yet.
  const tryUpdate = (fields: object) =>
    supabase
      .from('partnerships')
      .update({ ...basePayload, ...fields })
      .eq('id', id)
      .eq('poster_id', user.id)
      .select('id')
      .single()

  const specFields = {
    ttaf: formData.get('ttaf') ? parseInt(formData.get('ttaf') as string) : null,
    smoh: formData.get('smoh') ? parseInt(formData.get('smoh') as string) : null,
    engine_type: ((formData.get('engine_type') as string) || '').trim() || null,
  }
  const annualDamageFields = {
    annual_due: (() => {
      const raw = (formData.get('annual_due') as string) || ''
      return raw ? `${raw}-01` : null
    })(),
    damage_history: (() => {
      const raw = formData.get('damage_history') as string
      return raw === 'true' ? true : raw === 'false' ? false : null
    })(),
  }

  let activeGroups = [
    { pattern: /'(ttaf|smoh|engine_type)'/i, fields: specFields },
    { pattern: /'(previous_buy_in_price|buy_in_price_changed_at)'/i, fields: priceChangeFields },
    { pattern: /'(annual_due|damage_history)'/i, fields: annualDamageFields },
  ]
  let { data, error } = await tryUpdate(Object.assign({}, ...activeGroups.map((g) => g.fields)))

  while (error && activeGroups.length > 0) {
    const idx = activeGroups.findIndex((g) => g.pattern.test(error!.message ?? ''))
    if (idx === -1) break
    activeGroups = activeGroups.filter((_, i) => i !== idx)
    ;({ data, error } = await tryUpdate(Object.assign({}, ...activeGroups.map((g) => g.fields))))
  }

  if (error || !data) throw new Error(error?.message ?? 'Listing not found or not yours to edit.')

  // Same lazy-save as createPartnership — a poster who first supplies their
  // name/phone while editing (not just on the original post) should still get it
  // pre-filled on their next new listing.
  const contactNameEdit = (formData.get('contact_name') as string)?.trim()
  if (contactNameEdit && !user.user_metadata?.full_name) {
    await supabase.auth.updateUser({ data: { full_name: contactNameEdit } })
  }
  const contactPhoneEdit = (formData.get('contact_phone') as string)?.trim()
  if (contactPhoneEdit && !user.user_metadata?.contact_phone) {
    await supabase.auth.updateUser({ data: { contact_phone: contactPhoneEdit } })
  }

  revalidatePath('/partnerships')
  revalidatePath('/listings')
  revalidatePath(`/partnerships/${id}`)
  redirect(`/partnerships/${id}?updated=1`)
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
  // real state. Rejects (throws) when the ICAO isn't in our ~17k-row table rather than
  // silently saving a listing with a null location — a syntactically-valid-but-fake
  // code is almost always a typo, not a real gap in coverage.
  const home_airport = (formData.get('home_airport') as string).toUpperCase()
  const { data: airport } = await supabase
    .from('airports')
    .select('name, city, state')
    .eq('icao', home_airport)
    .maybeSingle()
  if (!airport) {
    throw new Error(`We couldn't find an airport with the code "${home_airport}". Please pick one from the suggestions list, or double-check the 4-letter code.`)
  }

  // Optional additional airport — store as text[] when non-empty.
  // Requires the `seeker_additional_airports` migration (add column if not exists).
  // Graceful fallback: if the column doesn't exist yet, we retry without it so the
  // listing still goes live without error (the additional airport is silently dropped).
  // Same real-airport check as home_airport above (blank stays optional; a
  // well-formed-but-fake code is rejected rather than silently stored — it would
  // never match a real searcher's airport filter otherwise).
  const extraRaw = ((formData.get('additional_airport_2') as string) || '').trim().toUpperCase()
  if (extraRaw) {
    const { data: extraAirport } = await supabase
      .from('airports')
      .select('icao')
      .eq('icao', extraRaw)
      .maybeSingle()
    if (!extraAirport) {
      throw new Error(`We couldn't find an airport with the code "${extraRaw}" for the additional airport. Please pick one from the suggestions list, or double-check the 4-letter code.`)
    }
  }
  const additional_airports = extraRaw ? [extraRaw] : null

  const basePayload = {
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
    contact_method: (formData.get('contact_method') as string) || 'platform',
    contact_phone: (formData.get('contact_phone') as string) || null,
    status: 'active',
    poster_id: user.id,
  }

  const payload = additional_airports
    ? { ...basePayload, additional_airports }
    : basePayload

  let { data, error } = await supabase.from('partnership_seekers').insert(payload).select('id').single()

  // If the additional_airports column hasn't been migrated yet, retry without it so
  // the listing still goes live (graceful self-suppression, same pattern as partnership
  // spec fields). The column error message contains "additional_airports".
  if (error && additional_airports && error.message?.includes('additional_airports')) {
    const retry = await supabase.from('partnership_seekers').insert(basePayload).select('id').single()
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)

  // Same lazy-name-save as createPartnership — persist contact_name to user_metadata
  // so future visits to any post form pre-fill the name field automatically.
  const contactNameSeeker = (formData.get('contact_name') as string)?.trim()
  if (contactNameSeeker && !user.user_metadata?.full_name) {
    await supabase.auth.updateUser({ data: { full_name: contactNameSeeker } })
  }

  // Same lazy-save for contact_phone — one fewer field to retype on the next listing.
  const contactPhoneSeeker = (formData.get('contact_phone') as string)?.trim()
  if (contactPhoneSeeker && !user.user_metadata?.contact_phone) {
    await supabase.auth.updateUser({ data: { contact_phone: contactPhoneSeeker } })
  }

  revalidatePath('/partnerships/seeking')
  redirect(`/partnerships/seeking/${data!.id}?posted=1`)
}

// Edit an existing user-posted seeking listing. Mirrors createSeekerListing's
// column set + derivation logic (including the additional_airports graceful
// fallback), but updates the row in place instead of inserting, and is
// ownership-scoped the same way updatePartnershipListing/updateAircraftListing
// are (.eq('poster_id', user.id) on the update — RLS backs this up too).
export async function updateSeekerListing(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth?next=/partnerships/seeking/${id}/edit`)

  const makesRaw = formData.get('preferred_makes') as string
  const preferred_makes = makesRaw ? makesRaw.split(',').map((m) => m.trim()).filter(Boolean) : null

  const ratingsRaw = formData.get('ratings_held') as string
  const ratings_held = ratingsRaw ? ratingsRaw.split(',').map((r) => r.trim()).filter(Boolean) : null

  const shareTypesRaw = formData.get('preferred_share_types') as string
  const preferred_share_types = shareTypesRaw ? shareTypesRaw.split(',').map((s) => s.trim()).filter(Boolean) : null

  const useRaw = formData.get('intended_use') as string
  const intended_use = useRaw ? useRaw.split(',').map((u) => u.trim()).filter(Boolean) : null

  const home_airport = ((formData.get('home_airport') as string) || '').trim().toUpperCase()
  const { data: airport } = await supabase
    .from('airports')
    .select('name, city, state')
    .eq('icao', home_airport)
    .maybeSingle()
  if (!airport) {
    throw new Error(`We couldn't find an airport with the code "${home_airport}". Please pick one from the suggestions list, or double-check the 4-letter code.`)
  }

  // Same real-airport check as home_airport above (blank stays optional; a
  // well-formed-but-fake code is rejected rather than silently stored).
  const extraRaw = ((formData.get('additional_airport_2') as string) || '').trim().toUpperCase()
  if (extraRaw) {
    const { data: extraAirport } = await supabase
      .from('airports')
      .select('icao')
      .eq('icao', extraRaw)
      .maybeSingle()
    if (!extraAirport) {
      throw new Error(`We couldn't find an airport with the code "${extraRaw}" for the additional airport. Please pick one from the suggestions list, or double-check the 4-letter code.`)
    }
  }
  const additional_airports = extraRaw ? [extraRaw] : null

  const basePayload = {
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
    intended_use,
    hours_per_month: formData.get('hours_per_month') ? parseInt(formData.get('hours_per_month') as string) : null,
    title: (() => {
      const t = ((formData.get('title') as string) || '').trim()
      if (t) return t
      const makePart = preferred_makes?.length ? preferred_makes.join('/') + ' ' : ''
      return `Pilot seeking ${makePart}partnership near ${home_airport}`
    })(),
    description: (formData.get('description') as string) || null,
    contact_name: (formData.get('contact_name') as string) || null,
    contact_email: (formData.get('contact_email') as string) || user.email || '',
    contact_method: (formData.get('contact_method') as string) || 'platform',
    contact_phone: (formData.get('contact_phone') as string) || null,
  }

  // Always include additional_airports (even when null) so blanking the field on
  // edit actually clears a previously-set value instead of leaving it untouched.
  const payload = { ...basePayload, additional_airports }

  let { data, error } = await supabase
    .from('partnership_seekers')
    .update(payload)
    .eq('id', id)
    .eq('poster_id', user.id)
    .select('id')
    .single()

  // Same graceful fallback as createSeekerListing — if additional_airports hasn't
  // been migrated yet, retry without it so the save still succeeds. Checked on the
  // error alone (not "additional_airports truthy") so clearing the field on an
  // unmigrated DB also falls back correctly.
  if (error && error.message?.includes('additional_airports')) {
    const retry = await supabase
      .from('partnership_seekers')
      .update(basePayload)
      .eq('id', id)
      .eq('poster_id', user.id)
      .select('id')
      .single()
    data = retry.data
    error = retry.error
  }

  if (error || !data) throw new Error(error?.message ?? 'Listing not found or not yours to edit.')

  // Same lazy-save as createSeekerListing — a poster who first supplies their
  // name/phone while editing (not just on the original post) should still get it
  // pre-filled on their next new listing.
  const contactNameEdit = (formData.get('contact_name') as string)?.trim()
  if (contactNameEdit && !user.user_metadata?.full_name) {
    await supabase.auth.updateUser({ data: { full_name: contactNameEdit } })
  }
  const contactPhoneEdit = (formData.get('contact_phone') as string)?.trim()
  if (contactPhoneEdit && !user.user_metadata?.contact_phone) {
    await supabase.auth.updateUser({ data: { contact_phone: contactPhoneEdit } })
  }

  revalidatePath('/partnerships/seeking')
  revalidatePath('/listings')
  revalidatePath(`/partnerships/seeking/${id}`)
  redirect(`/partnerships/seeking/${id}?updated=1`)
}

export async function createAircraftListing(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/aircraft/new')

  const asking_price = formData.get('asking_price') ? parseInt(formData.get('asking_price') as string) : null
  const photoUrls = (formData.getAll('photo_url') as string[]).filter(Boolean)

  // The form now asks for the ICAO airport code (frictionless) — derive location
  // string and state from the airports table, same pattern as partnership/seeker actions.
  // Based-at is optional here, but a non-empty code that doesn't resolve is rejected
  // (throws) rather than silently saved with a null location — same rationale as the
  // required home_airport fields on the other two forms.
  const homeAirportRaw = ((formData.get('home_airport') as string) || '').trim().toUpperCase()
  let location: string | null = null
  let state: string | null = null
  if (homeAirportRaw) {
    const { data: airport } = await supabase
      .from('airports')
      .select('city, state')
      .eq('icao', homeAirportRaw)
      .maybeSingle()
    if (!airport?.city) {
      throw new Error(`We couldn't find an airport with the code "${homeAirportRaw}". Please pick one from the suggestions list, double-check the 4-letter code, or leave this field blank.`)
    }
    location = airport.state ? `${airport.city}, ${airport.state}` : airport.city
    state = airport.state ?? null
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
    engine_type: ((formData.get('engine_type') as string) || '').trim() || null,
    avionics: (() => {
      const raw = ((formData.get('avionics') as string) || '').trim()
      if (!raw) return null
      const items = raw.split(',').map((s) => s.trim()).filter(Boolean)
      return items.length > 0 ? items : null
    })(),
    annual_due: (() => {
      const raw = (formData.get('annual_due') as string) || ''
      return raw ? `${raw}-01` : null
    })(),
    damage_history: (() => {
      const raw = formData.get('damage_history') as string
      return raw === 'true' ? true : raw === 'false' ? false : null
    })(),
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
    contact_phone: (formData.get('contact_phone') as string) || null,
    status: 'active',
    poster_id: user.id,
    images: photoUrls.length > 0 ? photoUrls : [],
    image_is_placeholder: photoUrls.length === 0,
  }

  let result = await supabase.from('aircraft_for_sale').insert(payload).select('id').single()

  if (result.error?.code === '42703' || result.error?.code === 'PGRST204') {
    // contact_phone isn't migrated on every environment yet — retry without it so
    // posting still succeeds; the phone just won't save until the human applies
    // `alter table aircraft_for_sale add column if not exists contact_phone text;`
    const { contact_phone: _contactPhone, ...withoutPhone } = payload
    result = await supabase.from('aircraft_for_sale').insert(withoutPhone).select('id').single()
  }

  if (result.error) throw new Error(result.error.message)

  // Same lazy-save as createPartnership/createSeekerListing — persist contact_phone
  // to user_metadata so the next post form visit pre-fills the phone field automatically.
  const contactPhoneAircraft = (formData.get('contact_phone') as string)?.trim()
  if (contactPhoneAircraft && !user.user_metadata?.contact_phone) {
    await supabase.auth.updateUser({ data: { contact_phone: contactPhoneAircraft } })
  }

  revalidatePath('/aircraft')
  redirect(`/aircraft/listing/${result.data.id}?posted=1`)
}

// Edit an existing user-posted aircraft listing. Mirrors createAircraftListing's
// column set + derivation logic, but updates the row in place instead of
// inserting, and is ownership-scoped the same way deactivateListing/relistListing
// are (.eq('poster_id', user.id) on the update — RLS backs this up too).
export async function updateAircraftListing(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth?next=/aircraft/listing/${id}/edit`)

  const asking_price = formData.get('asking_price') ? parseInt(formData.get('asking_price') as string) : null
  const photoUrls = (formData.getAll('photo_url') as string[]).filter(Boolean)

  // The row only stores the airport's DERIVED city/state, never the raw ICAO —
  // so an edit form can't be prefilled with the original "Based at" input, and an
  // untouched (empty) field on submit doesn't mean "clear the location," just
  // "the poster didn't re-type it." Only touch location/state when this submit
  // actually supplied an airport; otherwise leave the stored value alone.
  const homeAirportRaw = ((formData.get('home_airport') as string) || '').trim().toUpperCase()
  const clearHomeAirport = (formData.get('clear_home_airport') as string) === 'true'
  let locationUpdate: { location: string | null; state: string | null } | null = null
  if (homeAirportRaw) {
    const { data: airport } = await supabase
      .from('airports')
      .select('city, state')
      .eq('icao', homeAirportRaw)
      .maybeSingle()
    if (!airport?.city) {
      throw new Error(`We couldn't find an airport with the code "${homeAirportRaw}". Please pick one from the suggestions list, double-check the 4-letter code, or leave this field blank.`)
    }
    locationUpdate = {
      location: airport.state ? `${airport.city}, ${airport.state}` : airport.city,
      state: airport.state ?? null,
    }
  } else if (clearHomeAirport) {
    // Explicit "remove location" checkbox — distinct from an untouched blank field,
    // which must leave the stored value alone (see comment above).
    locationUpdate = { location: null, state: null }
  }

  const payload = {
    make: (formData.get('make') as string) || null,
    model: (formData.get('model') as string) || null,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    registration: (formData.get('registration') as string) || null,
    ttaf: formData.get('ttaf') ? parseInt(formData.get('ttaf') as string) : null,
    smoh: formData.get('smoh') ? parseInt(formData.get('smoh') as string) : null,
    engine_type: ((formData.get('engine_type') as string) || '').trim() || null,
    avionics: (() => {
      const raw = ((formData.get('avionics') as string) || '').trim()
      if (!raw) return null
      const items = raw.split(',').map((s) => s.trim()).filter(Boolean)
      return items.length > 0 ? items : null
    })(),
    annual_due: (() => {
      const raw = (formData.get('annual_due') as string) || ''
      return raw ? `${raw}-01` : null
    })(),
    damage_history: (() => {
      const raw = formData.get('damage_history') as string
      return raw === 'true' ? true : raw === 'false' ? false : null
    })(),
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
    ...locationUpdate,
    contact_phone: (formData.get('contact_phone') as string) || null,
    images: photoUrls,
    image_is_placeholder: photoUrls.length === 0,
  }

  let result = await supabase
    .from('aircraft_for_sale')
    .update(payload)
    .eq('id', id)
    .eq('poster_id', user.id)
    .select('id')
    .single()

  if (result.error?.code === '42703' || result.error?.code === 'PGRST204') {
    // contact_phone isn't migrated on every environment yet — retry without it so
    // editing still succeeds; the phone just won't save until the human applies
    // `alter table aircraft_for_sale add column if not exists contact_phone text;`
    const { contact_phone: _contactPhone, ...withoutPhone } = payload
    result = await supabase
      .from('aircraft_for_sale')
      .update(withoutPhone)
      .eq('id', id)
      .eq('poster_id', user.id)
      .select('id')
      .single()
  }

  if (result.error || !result.data) throw new Error(result.error?.message ?? 'Listing not found or not yours to edit.')

  // Same lazy-save as createAircraftListing — a poster who first supplies their
  // phone while editing (not just on the original post) should still get it
  // pre-filled on their next new listing. (No name field on this form.)
  const contactPhoneEdit = (formData.get('contact_phone') as string)?.trim()
  if (contactPhoneEdit && !user.user_metadata?.contact_phone) {
    await supabase.auth.updateUser({ data: { contact_phone: contactPhoneEdit } })
  }

  revalidatePath('/aircraft')
  revalidatePath('/listings')
  revalidatePath(`/aircraft/listing/${id}`)
  redirect(`/aircraft/listing/${id}?updated=1`)
}

export async function joinWaitlist(email: string, searchParams: string, source: string = 'hero_search') {
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  // The live DB's `waitlist_anyone_insert` RLS policy (schema.sql) isn't applied
  // against the shared Supabase project, so the anon-key client 401s on every
  // insert (confirmed directly — see nightshift CHANGELOG). Same class of gap as
  // `alerts_owner_select`; use the admin client so real signups work today
  // instead of waiting on that migration.
  const admin = createAdminClient()

  const { error } = await admin
    .from('waitlist')
    .upsert(
      { email: email.toLowerCase().trim(), search_params: searchParams, source },
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
  sourcePath: string,
  priceDropOptIn: boolean = true,
  frequency: AlertFrequency = 'weekly'
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
  const basePayload = {
    email: clean,
    context: context || null,
    source_path: sourcePath || null,
    status: 'pending',
    confirm_token: confirmToken,
    unsubscribe_token: unsubscribeToken,
  }
  let payload: Record<string, unknown> = {
    ...basePayload,
    price_drop_opt_in: priceDropOptIn,
    frequency: normalizeFrequency(frequency),
  }
  let { error } = await supabase.from('alerts').insert(payload)

  // Neither, either, or both of price_drop_opt_in/frequency may not be
  // migrated live yet — retry without whichever column(s) the error names
  // (PostgREST reports one unknown column per error, so this can take up to
  // two passes). The core subscription still saves either way (graceful
  // fallback, same pattern as profiles.favorite_airports); the untaken
  // preference just doesn't take effect until its migration lands (the digest
  // cron then treats the alert as opted-in / weekly, both column defaults).
  for (let i = 0; i < 2 && error && error.code !== '23505'; i++) {
    if (error.message?.includes('frequency')) delete payload.frequency
    else if (error.message?.includes('price_drop_opt_in')) delete payload.price_drop_opt_in
    else break
    ;({ error } = await supabase.from('alerts').insert(payload))
  }

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

// Alerts have no user_id (they're settable with no account), so "ownership" is
// proven either by the signed-in user's own email, or — for the majority of
// subscribers who never created an account — by the `unsubscribe_token` their
// own alert email already carries (same public, token-scoped ownership proof
// `pauseAlertByToken` below established). Resolving the token's OWN alert to an
// email then unlocks every alert for that SAME email, exactly like the
// session path unlocks every alert for the signed-in user's email — neither
// path is scoped to a single row's id.
async function resolveOwnerEmail(admin: ReturnType<typeof createAdminClient>, token?: string) {
  if (token) {
    const { data } = await admin.from('alerts').select('email').eq('unsubscribe_token', token).maybeSingle()
    return data?.email?.toLowerCase() ?? null
  }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email?.toLowerCase() ?? null
}

// Anon/authenticated has no SELECT on this PII-holding table (see
// subscribeToAlerts above) and adding write policies would need the same human
// DDL step the pending `alerts_owner_select` policy is still waiting on. The
// admin client does the actual read/write; the email match above is what makes
// this safe.
async function loadOwnedAlert(id: string, token?: string) {
  const admin = createAdminClient()
  const ownerEmail = await resolveOwnerEmail(admin, token)
  if (!ownerEmail) return { error: token ? ('This link is no longer valid.' as const) : ('Not authenticated' as const) }

  const { data: alert } = await admin
    .from('alerts')
    .select('id, email, status, source_path')
    .eq('id', id)
    .maybeSingle()

  if (!alert || alert.email.toLowerCase() !== ownerEmail) {
    return { error: 'Alert not found.' as const }
  }
  return { admin, alert }
}

// Pause an active alert without losing the subscription — skips it from the
// alert-digest cron (which only ever queries `status = 'confirmed'`) until resumed.
export async function pauseAlert(id: string, token?: string) {
  const owned = await loadOwnedAlert(id, token)
  if ('error' in owned) return { error: owned.error }
  if (owned.alert.status !== 'confirmed') return { error: 'Only an active alert can be paused.' }

  const { error } = await owned.admin.from('alerts').update({ status: 'paused' }).eq('id', id)
  if (error) return { error: 'Failed to pause alert.' }
  revalidatePath('/alerts/manage')
  return { ok: true }
}

export async function resumeAlert(id: string, token?: string) {
  const owned = await loadOwnedAlert(id, token)
  if ('error' in owned) return { error: owned.error }
  if (owned.alert.status !== 'paused') return { error: 'Only a paused alert can be resumed.' }

  const { error } = await owned.admin.from('alerts').update({ status: 'confirmed' }).eq('id', id)
  if (error) return { error: 'Failed to resume alert.' }
  revalidatePath('/alerts/manage')
  return { ok: true }
}

// Deletes the alert row outright (the management page's own delete affordance,
// distinct from the one-click email `unsubscribe` link, which just flips status).
export async function deleteAlert(id: string, token?: string) {
  const owned = await loadOwnedAlert(id, token)
  if ('error' in owned) return { error: owned.error }

  const { error } = await owned.admin.from('alerts').delete().eq('id', id)
  if (error) return { error: 'Failed to delete alert.' }
  revalidatePath('/alerts/manage')
  return { ok: true }
}

// Shared by both resend entry points below. Re-sends the exact same confirm
// link (same `confirm_token`, so an older copy of the email still also works)
// via the same template/send path `subscribeToAlerts` uses for the original.
// Rate-limited to 1 resend per row per ~10 min via `last_confirm_sent_at` —
// if that column isn't migrated live yet, the cooldown just can't be enforced
// (the send still happens; the bookkeeping update below fails soft).
const RESEND_COOLDOWN_MS = 10 * 60 * 1000
type ResendableAlert = {
  id: string
  email: string
  status: string
  context: string | null
  confirm_token: string | null
  unsubscribe_token: string | null
  last_confirm_sent_at?: string | null
}
async function sendConfirmationResend(admin: ReturnType<typeof createAdminClient>, alert: ResendableAlert) {
  if (alert.status !== 'pending') return { error: 'This alert is already confirmed.' }
  if (!alert.confirm_token || !alert.unsubscribe_token) {
    return { error: 'Something went wrong. Please try again.' }
  }
  if (alert.last_confirm_sent_at) {
    const elapsed = Date.now() - new Date(alert.last_confirm_sent_at).getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      const mins = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 60_000)
      return { error: `Please wait ${mins} more minute${mins === 1 ? '' : 's'} before resending.` }
    }
  }

  const confirmUrl = `${SITE_URL}/api/alerts/confirm?token=${alert.confirm_token}`
  const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}`
  const { subject, html, text } = buildAlertConfirmEmail({
    context: alert.context || null,
    confirmUrl,
    unsubscribeUrl,
  })
  await sendEmail({ to: alert.email, subject, html, text })

  await admin.from('alerts').update({ last_confirm_sent_at: new Date().toISOString() }).eq('id', alert.id)
  // Not-yet-migrated DB (`last_confirm_sent_at` column missing) — the email above
  // already sent; a failed bookkeeping update just means the next resend can't
  // be rate-limited until the migration lands, same graceful-fallback pattern
  // as price_drop_opt_in/frequency.
  return { ok: true }
}

const RESEND_COLS = 'id, email, status, source_path, context, confirm_token, unsubscribe_token'

// Owner-scoped: the "Resend confirmation" button on a Pending row in
// `/alerts/manage`. Ownership proven the same way as pause/resume/delete —
// `loadOwnedAlert`'s base select doesn't carry the token/context columns this
// needs, so this re-queries by id directly rather than widening that shared
// select (which pause/resume/delete/updateAlertCriteria also depend on).
export async function resendAlertConfirmation(id: string, token?: string) {
  const admin = createAdminClient()
  const ownerEmail = await resolveOwnerEmail(admin, token)
  if (!ownerEmail) return { error: token ? 'This link is no longer valid.' : 'Not authenticated' }

  let { data: alert, error } = (await admin
    .from('alerts')
    .select(`${RESEND_COLS}, last_confirm_sent_at`)
    .eq('id', id)
    .maybeSingle()) as { data: ResendableAlert | null; error: { message: string } | null }
  if (error?.message?.includes('last_confirm_sent_at')) {
    ;({ data: alert, error } = (await admin
      .from('alerts')
      .select(RESEND_COLS)
      .eq('id', id)
      .maybeSingle()) as { data: ResendableAlert | null; error: { message: string } | null })
  }
  if (!alert || alert.email.toLowerCase() !== ownerEmail) {
    return { error: 'Alert not found.' }
  }
  return sendConfirmationResend(admin, alert)
}

// Public, no session required: the "Didn't get the email? Resend it" link in
// `AlertSignup`'s post-submit state. Looked up by the email + sourcePath the
// visitor just submitted seconds ago in this same browser — the same trust
// level as the original signup itself (which also just takes a raw email), not
// a weaker one.
export async function resendAlertConfirmationByEmail(email: string, sourcePath: string) {
  const clean = (email || '').toLowerCase().trim()
  if (!clean || !EMAIL_RE.test(clean)) {
    return { error: 'Please enter a valid email address.' }
  }

  const admin = createAdminClient()
  const lookup = (cols: string) => {
    const q = admin.from('alerts').select(cols).eq('email', clean)
    return sourcePath ? q.eq('source_path', sourcePath) : q.is('source_path', null)
  }
  let { data: alert, error } = (await lookup(`${RESEND_COLS}, last_confirm_sent_at`).maybeSingle()) as {
    data: ResendableAlert | null
    error: { message: string } | null
  }
  if (error?.message?.includes('last_confirm_sent_at')) {
    ;({ data: alert, error } = (await lookup(RESEND_COLS).maybeSingle()) as {
      data: ResendableAlert | null
      error: { message: string } | null
    })
  }
  if (!alert) return { error: 'No pending alert found for this email.' }
  return sendConfirmationResend(admin, alert)
}

// Rebuilds an editable alert's `source_path`/`context` from submitted criteria
// fields (make/model/state/price range) — the Edit action on `/alerts/manage`.
// Ownership proven the same way as pause/resume/delete: `loadOwnedAlert` matches
// the row's email against the signed-in user's own email via the admin client.
// Only alerts whose `source_path` is the "modern query-string shape"
// (`/aircraft?...`, `/partnerships?...`, `/partnerships/seeking?...`) are
// editable — see `alertEditCriteria.ts` for why legacy path-segment SEO alerts
// are excluded. The UI shouldn't normally be able to trigger the "can't be
// edited" branch (it doesn't render an Edit button for those rows), but this
// still guards a stale client / direct call.
export async function updateAlertCriteria(id: string, fields: AlertCriteriaFields, token?: string) {
  const owned = await loadOwnedAlert(id, token)
  if ('error' in owned) return { error: owned.error }

  const target = parseEditableAlertTarget(owned.alert.source_path)
  if (!target) return { error: "This alert's criteria can't be edited here." }

  const min = fields.minPrice ? parseInt(fields.minPrice, 10) : undefined
  const max = fields.maxPrice ? parseInt(fields.maxPrice, 10) : undefined
  if (min !== undefined && max !== undefined && Number.isFinite(min) && Number.isFinite(max) && min > max) {
    return { error: 'Minimum price must be less than maximum price.' }
  }

  const { sourcePath, context } = buildAlertCriteriaUpdate(target.type, owned.alert.source_path, fields)

  const { error } = await owned.admin
    .from('alerts')
    .update({ source_path: sourcePath, context })
    .eq('id', id)
  if (error) return { error: 'Failed to update alert.' }
  revalidatePath('/alerts/manage')
  return { ok: true }
}

// Toggle price-drop matching on/off for one alert, independent of the criteria
// edit form above (a persistent per-row switch, not hidden behind "Edit"). Same
// ownership proof as pause/resume/delete. Only meaningful for aircraft-type
// alerts (see alert-digest's countRecentAircraftPriceDrops) — the UI only
// renders this toggle for those rows.
export async function updateAlertPriceDropOptIn(id: string, enabled: boolean, token?: string) {
  const owned = await loadOwnedAlert(id, token)
  if ('error' in owned) return { error: owned.error }

  const { error } = await owned.admin.from('alerts').update({ price_drop_opt_in: enabled }).eq('id', id)
  // Not-yet-migrated DB (`price_drop_opt_in` column missing) — no-op rather than
  // surfacing a scary error for what is, until the migration lands, an inert toggle.
  if (error && error.message?.includes('price_drop_opt_in')) return { ok: true }
  if (error) return { error: 'Failed to update alert.' }
  revalidatePath('/alerts/manage')
  return { ok: true }
}

// Toggle digest cadence (weekly ↔ daily) for one alert. Same ownership proof and
// persistent-row-switch pattern as updateAlertPriceDropOptIn above, but applies
// to every alert type (unlike price-drop, cadence isn't aircraft-only).
export async function updateAlertFrequency(id: string, frequency: AlertFrequency, token?: string) {
  const owned = await loadOwnedAlert(id, token)
  if ('error' in owned) return { error: owned.error }

  const { error } = await owned.admin
    .from('alerts')
    .update({ frequency: normalizeFrequency(frequency) })
    .eq('id', id)
  // Not-yet-migrated DB (`frequency` column missing) — no-op rather than
  // surfacing a scary error for what is, until the migration lands, an inert toggle.
  if (error && error.message?.includes('frequency')) return { ok: true }
  if (error) return { error: 'Failed to update alert.' }
  revalidatePath('/alerts/manage')
  return { ok: true }
}

// Public, token-scoped recovery for the one-click unsubscribe landing page — no
// session exists there (it's a bare email link), so ownership is proven by the same
// `unsubscribe_token` the email already carries, not by `loadOwnedAlert`'s signed-in
// email match. Lets someone who just unsubscribed get "fewer emails" instead of
// "none" without creating an account. Same recoverable `paused` status the
// authenticated pause/resume flow uses (digest cron already skips it).
export async function pauseAlertByToken(token: string) {
  const trimmed = token?.trim()
  if (!trimmed) return { error: 'Invalid link.' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('alerts')
    .update({ status: 'paused' })
    .eq('unsubscribe_token', trimmed)
    .select('id')

  if (error) return { error: 'Something went wrong. Please try again.' }
  if (!data || data.length === 0) return { error: 'This link is no longer valid.' }
  return { ok: true }
}

// Post-confirmation cross-sell (see AlertCrossSell.tsx / alertCrossSell.ts): a
// visitor who just confirmed one alert gets offered a one-click counterpart alert
// (e.g. aircraft ↔ partnerships for the same make) for the SAME already-verified
// email — no second double-opt-in round trip. `originalToken` proves ownership: it's
// the confirm_token of an alert already flipped to `confirmed` by /api/alerts/confirm,
// so the caller has already proven they control that inbox once this cycle.
export async function subscribeToConfirmedAlert(originalToken: string, context: string, sourcePath: string) {
  const trimmed = originalToken?.trim()
  if (!trimmed) return { error: 'Invalid link.' }

  const admin = createAdminClient()
  const { data: original } = await admin
    .from('alerts')
    .select('email, status')
    .eq('confirm_token', trimmed)
    .maybeSingle()

  if (!original || original.status !== 'confirmed' || !original.email) {
    return { error: 'This link is no longer valid.' }
  }

  const { error } = await admin.from('alerts').insert({
    email: original.email,
    context: context || null,
    source_path: sourcePath || null,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    confirm_token: crypto.randomUUID(),
    unsubscribe_token: crypto.randomUUID(),
  })

  // 23505 = unique_violation on (email, source_path) — already subscribed, idempotent success.
  if (error && error.code !== '23505') return { error: 'Something went wrong. Please try again.' }
  return { ok: true }
}

// Signed-in one-click alert capture (see AlertSignup.tsx): a visitor with a verified
// session shouldn't have to retype an email we already have. Same no-second-opt-in
// precedent as subscribeToConfirmedAlert/subscribeSavedSearchAlert above — ownership
// is proven by the session, so the alert is inserted already `confirmed`, no
// double-opt-in email sent. Mirrors subscribeToAlerts' graceful degrade for the
// not-yet-migrated price_drop_opt_in/frequency columns.
export async function subscribeSignedInAlert(
  context: string,
  sourcePath: string,
  priceDropOptIn: boolean = true,
  frequency: AlertFrequency = 'weekly'
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Not authenticated' }

  const basePayload = {
    email: user.email,
    context: context || null,
    source_path: sourcePath || null,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    confirm_token: crypto.randomUUID(),
    unsubscribe_token: crypto.randomUUID(),
  }
  let payload: Record<string, unknown> = {
    ...basePayload,
    price_drop_opt_in: priceDropOptIn,
    frequency: normalizeFrequency(frequency),
  }
  let { error } = await supabase.from('alerts').insert(payload)

  for (let i = 0; i < 2 && error && error.code !== '23505'; i++) {
    if (error.message?.includes('frequency')) delete payload.frequency
    else if (error.message?.includes('price_drop_opt_in')) delete payload.price_drop_opt_in
    else break
    ;({ error } = await supabase.from('alerts').insert(payload))
  }

  // 23505 = unique_violation on (email, source_path) — already subscribed, idempotent success.
  if (error && error.code !== '23505') return { error: 'Something went wrong. Please try again.' }
  return { ok: true, email: user.email }
}

// Saved-search ↔ alert unification (slice 1, see /searches): one click turns a
// signed-in user's own saved search into a real, confirmed email alert — no
// second opt-in round trip, since the account's email is already verified
// (same no-second-opt-in precedent as subscribeToConfirmedAlert above, here
// proven by the signed-in session instead of a confirm token).
export async function subscribeSavedSearchAlert(searchId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Not authenticated' }

  const { data: search } = await supabase
    .from('saved_searches')
    .select('name, search_params, path')
    .eq('id', searchId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!search) return { error: 'Search not found.' }

  const sourcePath = `${search.path || '/partnerships'}?${search.search_params}`

  const { error } = await supabase.from('alerts').insert({
    email: user.email,
    context: search.name || null,
    source_path: sourcePath,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    confirm_token: crypto.randomUUID(),
    unsubscribe_token: crypto.randomUUID(),
  })

  // 23505 = unique_violation on (email, source_path) — already subscribed, idempotent success.
  if (error && error.code !== '23505') return { error: 'Something went wrong. Please try again.' }

  // `alerts` has no SELECT policy for the authenticated client (PII protection —
  // see savedSearchAlerts.ts), so `.select()` on the insert above can't return the
  // row. Look it up via the admin client instead (covers both the fresh-insert and
  // the idempotent-conflict path identically) so the caller can render the
  // frequency/price-drop toggles inline without a full page reload.
  const admin = createAdminClient()
  const { data: row } = await admin
    .from('alerts')
    .select('id, frequency, price_drop_opt_in')
    .eq('email', user.email)
    .eq('source_path', sourcePath)
    .maybeSingle()

  return {
    ok: true,
    context: search.name as string,
    sourcePath,
    alertId: row?.id as string | undefined,
    frequency: normalizeFrequency((row as { frequency?: string } | null)?.frequency),
    priceDropOptIn: (row as { price_drop_opt_in?: boolean } | null)?.price_drop_opt_in ?? true,
  }
}

// Marketplaces a search can be saved from. Anything else falls back to partnerships.
const SAVED_SEARCH_PATHS = ['/partnerships', '/aircraft', '/partnerships/seeking'] as const

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

  // Saving a search also turns on email alerts for it — the same `alerts` table/
  // `alert-digest` pipeline the standalone AlertSignup boxes use, but already-
  // authenticated here so we skip the anonymous double-opt-in and confirm immediately.
  // Insert-only + idempotent on (email, source_path), mirroring `subscribeToAlerts`:
  // a unique-violation means this search's alert already exists, which is success, not
  // an error. Best-effort — a failure here must never fail the search save itself.
  if (user.email) {
    const { error: alertError } = await supabase.from('alerts').insert({
      email: user.email.toLowerCase().trim(),
      context: name.trim(),
      source_path: `${safePath}?${searchParams}`,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    if (alertError && alertError.code !== '23505') {
      console.error('[saveSearch] alert insert failed:', alertError.message)
    }
  }

  revalidatePath('/searches')
  return { ok: true }
}

// Marketplaces a listing can be favorited from. Anything else is rejected.
const SAVED_LISTING_TYPES = ['partnership', 'aircraft', 'seeker'] as const

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

const FACILITY_TYPES = ['fbo', 'flying_club'] as const

/**
 * Rate a curated FBO/flying club shown on an airport community-hub page (1-5 stars).
 * Signed-in only. Upserts on (user_id, airport_icao, facility_name) so re-rating just
 * changes the existing row. Fails soft with a friendly error if the table isn't
 * migrated onto the live DB yet (⚠️ see supabase/schema.sql: airport_facility_ratings).
 */
export async function rateFacility(
  icao: string,
  facilityName: string,
  facilityType: string,
  rating: number,
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to rate this facility.' }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5.' }
  }
  const safeType = FACILITY_TYPES.includes(facilityType as (typeof FACILITY_TYPES)[number])
    ? facilityType
    : 'fbo'

  const { error } = await supabase
    .from('airport_facility_ratings')
    .upsert(
      {
        user_id: user.id,
        airport_icao: icao.toUpperCase(),
        facility_name: facilityName,
        facility_type: safeType,
        rating,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,airport_icao,facility_name' },
    )
  if (error) return { error: 'Failed to save your rating.' }
  revalidatePath(`/airports/${icao.toLowerCase()}`)
  return { ok: true, rating }
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
): Promise<{
  partnerships: Partnership[]
  aircraft: AircraftForSale[]
  seekers: PartnershipSeeker[]
  partnershipSaveCounts: Record<string, number>
  aircraftSaveCounts: Record<string, number>
  seekerSaveCounts: Record<string, number>
  partnershipVerdicts: Record<string, PartnershipCardVerdict>
  aircraftVerdicts: Record<string, AircraftCompVerdict>
  seekerBudgetVerdicts: Record<string, PartnershipCompVerdict>
}> {
  if (!Array.isArray(saves) || saves.length === 0) {
    return {
      partnerships: [],
      aircraft: [],
      seekers: [],
      partnershipSaveCounts: {},
      aircraftSaveCounts: {},
      seekerSaveCounts: {},
      partnershipVerdicts: {},
      aircraftVerdicts: {},
      seekerBudgetVerdicts: {},
    }
  }

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
  const seekerIds = rows.filter((s) => s.type === 'seeker').map((s) => s.id)

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

  // getSeekersByIds already scopes to status='active' per-row, so no extra filter needed.
  let seekers: PartnershipSeeker[] = []
  if (seekerIds.length > 0) {
    seekers = await getSeekersByIds(seekerIds)
  }

  // Same real save-count + comp/deal-verdict signals the logged-in `/saved` page
  // already computes for its hydrated listings — a device-only visitor should see
  // the identical honest social-proof/deal chips, not a stripped-down view.
  const supabase = await createServerSupabaseClient()
  const [
    partnershipVerdictsMap,
    aircraftVerdictsMap,
    seekerBudgetVerdictsMap,
    partnershipSaveCountsMap,
    aircraftSaveCountsMap,
    seekerSaveCountsMap,
  ] = await Promise.all([
    partnerships.length > 0 ? getPartnershipCompVerdicts(supabase, partnerships) : Promise.resolve(new Map<string, PartnershipCardVerdict>()),
    aircraft.length > 0 ? getAircraftCompVerdicts(supabase, aircraft) : Promise.resolve(new Map<string, AircraftCompVerdict>()),
    seekers.length > 0 ? getSeekerBudgetCheckVerdicts(supabase, seekers) : Promise.resolve(new Map<string, PartnershipCompVerdict>()),
    partnerships.length > 0 ? getSaveCounts(partnerships.map((p) => p.id), 'partnership') : Promise.resolve(new Map<string, number>()),
    aircraft.length > 0 ? getSaveCounts(aircraft.map((a) => a.id), 'aircraft') : Promise.resolve(new Map<string, number>()),
    seekers.length > 0 ? getSaveCounts(seekers.map((s) => s.id), 'seeker') : Promise.resolve(new Map<string, number>()),
  ])

  return {
    partnerships,
    aircraft,
    seekers,
    partnershipSaveCounts: Object.fromEntries(partnershipSaveCountsMap),
    aircraftSaveCounts: Object.fromEntries(aircraftSaveCountsMap),
    seekerSaveCounts: Object.fromEntries(seekerSaveCountsMap),
    partnershipVerdicts: Object.fromEntries(partnershipVerdictsMap),
    aircraftVerdicts: Object.fromEntries(aircraftVerdictsMap),
    seekerBudgetVerdicts: Object.fromEntries(seekerBudgetVerdictsMap),
  }
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
  ttaf?: number
  smoh?: number
  engine_type?: string
  annual_due?: string
  damage_history?: boolean
  min_hours?: number
  ratings_required?: string
  scheduling_system?: string
}

export async function generatePartnershipDraft(prompt: string): Promise<PartnershipDraft> {
  await checkAiDraftAccess()
  const text = prompt.trim()
  if (!text) throw new Error('Prompt is required.')
  if (text.length > 2000) throw new Error('Prompt is too long.')
  return draftPartnershipFromText(text)
}

// Paste-a-URL variant of the above: fetches the poster's existing listing page
// server-side, reduces it to readable text, then runs it through the exact same
// extraction prompt as the pasted-text path. Shares the same per-user hourly
// quota via checkAiDraftAccess so this can't be used to run more AI calls than
// pasting text already allows. Mirrors generateAircraftDraftFromUrl.
export async function generatePartnershipDraftFromUrl(rawUrl: string): Promise<PartnershipDraft> {
  await checkAiDraftAccess()
  const url = await assertSafePublicUrl(rawUrl.trim())

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ClubHangerBot/1.0)' },
      signal: ctrl.signal,
      redirect: 'follow',
    })
    if (!res.ok) throw new Error('unreachable')
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType && !contentType.includes('text/html')) throw new Error('not html')
    const reader = res.body?.getReader()
    if (!reader) {
      html = await res.text()
    } else {
      const chunks: Uint8Array[] = []
      let total = 0
      const MAX_BYTES = 2_000_000
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          total += value.byteLength
          if (total > MAX_BYTES) {
            await reader.cancel()
            break
          }
          chunks.push(value)
        }
      }
      html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8')
    }
  } catch {
    throw new Error("Couldn't read that page — try pasting the listing text instead.")
  } finally {
    clearTimeout(timer)
  }

  const text = htmlToReadableText(html, 6000)
  if (text.length < 40) {
    throw new Error("Couldn't find enough listing text on that page — try pasting the listing text instead.")
  }
  return draftPartnershipFromText(text)
}

async function draftPartnershipFromText(text: string): Promise<PartnershipDraft> {
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
   - ttaf: total airframe hours as integer — or omit
   - smoh: hours since major overhaul as integer — or omit
   - engine_type: engine make + designation as stated, e.g. "Lycoming IO-360" or "Continental IO-550" — or omit
   - annual_due: month the annual inspection is due, in "YYYY-MM" format — ONLY when a
     specific month/year is stated (e.g. "annual due March 2027" → "2027-03"); never guess
     a month from a vague statement like "annual is current" — omit instead
   - damage_history: true if the input states the aircraft has damage/accident/incident
     history, false if it explicitly states there is NO damage history — omit if not mentioned
   - min_hours: minimum total flight hours the owner requires of a partner, as integer — or omit
   - ratings_required: comma-separated ratings/endorsements the owner requires of a partner,
     e.g. "PPL, IFR, Complex" — or omit if not mentioned
   - scheduling_system: how partners schedule flights, e.g. "Google Calendar", "FlyingClub",
     "shared spreadsheet" — or omit if not mentioned

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
            ttaf: { type: 'integer', description: 'Total time airframe, hours' },
            smoh: { type: 'integer', description: 'Hours since major overhaul' },
            engine_type: { type: 'string', description: 'Engine make + designation as stated, e.g. "Lycoming IO-360" or "Continental IO-550"' },
            annual_due: { type: 'string', description: 'Month the annual inspection is due, "YYYY-MM" format — only when a specific month/year is stated' },
            damage_history: { type: 'boolean', description: 'true if damage/accident history is stated, false if explicitly no damage history' },
            min_hours: { type: 'integer', description: 'Minimum total flight hours required of a partner' },
            ratings_required: { type: 'string', description: 'Comma-separated ratings required of a partner, e.g. "PPL, IFR, Complex"' },
            scheduling_system: { type: 'string', description: 'How partners schedule flights, e.g. "Google Calendar", "FlyingClub", "shared spreadsheet"' },
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
    ttaf: f.ttaf,
    smoh: f.smoh,
    engine_type: f.engine_type,
    annual_due: /^\d{4}-\d{2}$/.test(f.annual_due ?? '') ? f.annual_due : undefined,
    damage_history: f.damage_history,
    min_hours: f.min_hours,
    ratings_required: f.ratings_required,
    scheduling_system: f.scheduling_system,
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
  additional_airport_2?: string
  willing_to_travel_nm?: number
  total_hours?: number
  ratings_held?: string
  hours_per_month?: number
  preferred_share_types?: string[]
  intended_use?: string[]
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
   - home_airport: 4-letter ICAO code for primary base airport if mentioned, e.g. "KPAO" — or omit
   - additional_airport_2: 4-letter ICAO code for a SECOND base airport if the pilot mentions flying from multiple airports, e.g. "KSQL" — or omit if only one airport is mentioned
   - willing_to_travel_nm: how far they'll commute in nautical miles; map drive times to: 25 (~30 min), 40 (~45 min), 50 (~1 hr), 75 (~1.5 hr), 100 (~2 hr) — or omit
   - total_hours: total flight hours as integer — or omit
   - ratings_held: comma-separated ratings, e.g. "PPL, IFR, Complex" — or omit
   - hours_per_month: expected flying hours per month as integer — or omit
   - preferred_share_types: which of "1/2","1/3","1/4","leaseback","dry_lease","other" the pilot mentions wanting — omit any not mentioned, omit entirely if none mentioned
   - intended_use: which of "personal_travel","weekend_trips","cross_country","instrument_currency","training","other" the pilot's stated missions match — omit any not mentioned, omit entirely if none mentioned

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
            home_airport: { type: 'string', description: '4-letter ICAO airport code for primary base, e.g. KPAO' },
            additional_airport_2: { type: 'string', description: '4-letter ICAO code for a second base airport, only when the pilot mentions flying from multiple airports, e.g. KSQL' },
            willing_to_travel_nm: { type: 'integer', enum: [25, 40, 50, 75, 100], description: 'Commute radius in nm: 25=~30min, 40=~45min, 50=~1hr, 75=~1.5hr, 100=~2hr' },
            total_hours: { type: 'integer', description: 'Total flight hours' },
            ratings_held: { type: 'string', description: 'Comma-separated ratings, e.g. "PPL, IFR, Complex"' },
            hours_per_month: { type: 'integer', description: 'Expected flying hours per month' },
            preferred_share_types: {
              type: 'array',
              items: { type: 'string', enum: ['1/2', '1/3', '1/4', 'leaseback', 'dry_lease', 'other'] },
              description: 'Share types the pilot mentions wanting, only ones actually mentioned',
            },
            intended_use: {
              type: 'array',
              items: { type: 'string', enum: ['personal_travel', 'weekend_trips', 'cross_country', 'instrument_currency', 'training', 'other'] },
              description: 'Intended-use categories matching the pilot\'s stated missions, only ones actually mentioned',
            },
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
    additional_airport_2: f.additional_airport_2 ? f.additional_airport_2.toUpperCase().slice(0, 4) : undefined,
    willing_to_travel_nm: f.willing_to_travel_nm,
    total_hours: f.total_hours,
    ratings_held: f.ratings_held,
    hours_per_month: f.hours_per_month,
    preferred_share_types: f.preferred_share_types,
    intended_use: f.intended_use,
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
  engine_type?: string
  avionics?: string[]
  asking_price?: number
  home_airport?: string
  annual_due?: string
  damage_history?: boolean
}

export async function generateAircraftDraft(prompt: string): Promise<AircraftDraft> {
  await checkAiDraftAccess()
  const text = prompt.trim()
  if (!text) throw new Error('Prompt is required.')
  if (text.length > 2000) throw new Error('Prompt is too long.')
  return draftAircraftFromText(text)
}

// Paste-a-URL variant of the above: fetches the seller's existing listing page
// (Barnstormers, Controller, TradeAPlane, etc.) server-side, reduces it to
// readable text, then runs it through the exact same extraction prompt as the
// pasted-text path. Shares the same per-user hourly quota via checkAiDraftAccess
// so this can't be used to run more AI calls than pasting text already allows.
export async function generateAircraftDraftFromUrl(rawUrl: string): Promise<AircraftDraft> {
  await checkAiDraftAccess()
  const url = await assertSafePublicUrl(rawUrl.trim())

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ClubHangerBot/1.0)' },
      signal: ctrl.signal,
      redirect: 'follow',
    })
    if (!res.ok) throw new Error('unreachable')
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType && !contentType.includes('text/html')) throw new Error('not html')
    const reader = res.body?.getReader()
    if (!reader) {
      html = await res.text()
    } else {
      const chunks: Uint8Array[] = []
      let total = 0
      const MAX_BYTES = 2_000_000
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          total += value.byteLength
          if (total > MAX_BYTES) {
            await reader.cancel()
            break
          }
          chunks.push(value)
        }
      }
      html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8')
    }
  } catch {
    throw new Error("Couldn't read that page — try pasting the listing text instead.")
  } finally {
    clearTimeout(timer)
  }

  const text = htmlToReadableText(html, 6000)
  if (text.length < 40) {
    throw new Error("Couldn't find enough listing text on that page — try pasting the listing text instead.")
  }
  return draftAircraftFromText(text)
}

async function draftAircraftFromText(text: string): Promise<AircraftDraft> {
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
   - engine_type: engine make + designation as stated, e.g. "Lycoming IO-360" or "Continental IO-550" — or omit
   - avionics: array of specific avionics/equipment items explicitly named (e.g. "G1000",
     "GFC 500 autopilot", "ADS-B Out", "GTN 750") — only items literally mentioned; omit or
     leave empty if the input doesn't name any equipment
   - asking_price: integer dollars (no $ sign, no commas) — or omit
   - home_airport: 4-letter ICAO airport code where the aircraft is based, e.g. "KAUS" — or omit if not mentioned
   - annual_due: month the annual inspection is due, in "YYYY-MM" format — ONLY when a
     specific month/year is stated (e.g. "annual due March 2027" → "2027-03"); never guess
     a month from a vague statement like "annual is current" — omit instead
   - damage_history: true if the input states the aircraft has damage/accident/incident
     history, false if it explicitly states there is NO damage history — omit if not mentioned

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
            engine_type: { type: 'string', description: 'Engine make + designation as stated, e.g. "Lycoming IO-360" or "Continental IO-550"' },
            avionics: { type: 'array', items: { type: 'string' }, description: 'Specific avionics/equipment items explicitly named, e.g. ["G1000", "GFC 500 autopilot", "ADS-B Out"] — only items literally mentioned' },
            asking_price: { type: 'integer', description: 'Asking price in USD, no $ or commas' },
            home_airport: { type: 'string', description: '4-letter ICAO airport code where aircraft is based, e.g. "KAUS"' },
            annual_due: { type: 'string', description: 'Month the annual inspection is due, "YYYY-MM" format — only when a specific month/year is stated' },
            damage_history: { type: 'boolean', description: 'true if damage/accident history is stated, false if explicitly no damage history' },
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
    engine_type: sale.engine_type,
    avionics: Array.isArray(sale.avionics) && sale.avionics.length > 0 ? sale.avionics.filter(Boolean) : undefined,
    asking_price: sale.asking_price,
    home_airport: sale.home_airport ? sale.home_airport.toUpperCase().slice(0, 4) : undefined,
    annual_due: /^\d{4}-\d{2}$/.test(sale.annual_due ?? '') ? sale.annual_due : undefined,
    damage_history: sale.damage_history,
  }
}

// =====================================================
// LISTING MANAGEMENT
// =====================================================

export async function deactivateListing(
  type: 'aircraft' | 'partnership' | 'seeker',
  id: string
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (type === 'aircraft') {
    const { error } = await supabase
      .from('aircraft_for_sale')
      .update({ status: 'sold' })
      .eq('id', id)
      .eq('poster_id', user.id)
    if (error) throw new Error(error.message)
  } else if (type === 'partnership') {
    const { error } = await supabase
      .from('partnerships')
      .update({ status: 'closed' })
      .eq('id', id)
      .eq('poster_id', user.id)
    if (error) throw new Error(error.message)
  } else if (type === 'seeker') {
    const { error } = await supabase
      .from('partnership_seekers')
      .update({ status: 'closed' })
      .eq('id', id)
      .eq('poster_id', user.id)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/listings')
}

// Post a review on a partnership listing (`listing_reviews`, RLS-scoped: the insert
// policy checks `auth.uid() = author_user_id`, so this can use the normal
// authenticated client — no service-role needed). Scoped to partnerships this slice;
// `partnership_seekers` reviews are a follow-up (anonymity considerations there).
export async function postReview(input: {
  targetId: string
  rating: number | null
  body: string
}): Promise<{ ok?: true; error?: string }> {
  const validationError = validateReview({ body: input.body, rating: input.rating })
  if (validationError) return { error: validationError }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to post a review.' }

  const { data: target } = await supabase
    .from('partnerships')
    .select('poster_id')
    .eq('id', input.targetId)
    .maybeSingle()
  if (target?.poster_id && target.poster_id === user.id) {
    return { error: 'You can’t review your own listing.' }
  }

  const { error } = await supabase.from('listing_reviews').insert({
    target_type: 'partnership',
    target_id: input.targetId,
    author_user_id: user.id,
    rating: input.rating,
    body: input.body.trim(),
  })

  if (error) {
    if (error.code === '23505') return { error: 'You’ve already reviewed this listing.' }
    return { error: 'Could not post your review. Please try again.' }
  }

  revalidatePath(`/partnerships/${input.targetId}`)
  return { ok: true }
}

export async function relistListing(
  type: 'aircraft' | 'partnership' | 'seeker',
  id: string
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (type === 'aircraft') {
    const { error } = await supabase
      .from('aircraft_for_sale')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('poster_id', user.id)
    if (error) throw new Error(error.message)
  } else if (type === 'partnership') {
    // Reset posted_at so the listing re-appears at the top of date-sorted feeds.
    const { error } = await supabase
      .from('partnerships')
      .update({ status: 'active', posted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('poster_id', user.id)
    if (error) throw new Error(error.message)
  } else if (type === 'seeker') {
    const { error } = await supabase
      .from('partnership_seekers')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('poster_id', user.id)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/listings')
}
