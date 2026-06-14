'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ReviewTargetType } from '@/lib/types'

function csv(raw: FormDataEntryValue | null): string[] | null {
  const s = (raw as string) ?? ''
  const parts = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  return parts.length ? parts : null
}

function intOrNull(raw: FormDataEntryValue | null): number | null {
  const s = (raw as string) ?? ''
  if (!s.trim()) return null
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

/**
 * Create/update the current user's self-attested profile.
 * NOTE: never writes `verified` / `verified_ratings` — those are admin-only and
 * additionally frozen at the DB layer by the protect_profile_verification trigger.
 */
export async function upsertProfile(formData: FormData): Promise<{ error?: string } | void> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/profile')

  const payload = {
    user_id: user.id,
    display_name: ((formData.get('display_name') as string) || '').trim() || null,
    home_airport: ((formData.get('home_airport') as string) || '').trim().toUpperCase() || null,
    total_hours: intOrNull(formData.get('total_hours')),
    ratings_held: csv(formData.get('ratings_held')),
    mission: ((formData.get('mission') as string) || '').trim() || null,
    bio: ((formData.get('bio') as string) || '').trim() || null,
    avatar_url: ((formData.get('avatar_url') as string) || '').trim() || null,
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' })
  if (error) {
    if (error.code === '42P01') {
      return { error: 'Profiles are not enabled yet (migration 0001 pending). Ask an admin to apply it.' }
    }
    return { error: 'Could not save your profile. Please try again.' }
  }

  revalidatePath('/profile')
  revalidatePath(`/pilots/${user.id}`)
  redirect(`/pilots/${user.id}`)
}

const PROFANITY = ['fuck', 'shit', 'asshole', 'bitch', 'cunt', 'bastard', 'dick']

/** Post a review on a partnership or seeker listing. */
export async function postReview(input: {
  targetType: ReviewTargetType
  targetId: string
  rating?: number | null
  body: string
}): Promise<{ ok?: true; error?: string }> {
  const body = (input.body ?? '').trim()
  if (body.length < 3) return { error: 'Please write at least a few words.' }
  if (body.length > 2000) return { error: 'Review is too long (2000 character max).' }
  const lower = body.toLowerCase()
  if (PROFANITY.some((w) => new RegExp(`\\b${w}`, 'i').test(lower))) {
    return { error: 'Please keep your review professional.' }
  }
  if (input.rating != null && (input.rating < 1 || input.rating > 5)) {
    return { error: 'Rating must be 1–5.' }
  }
  if (input.targetType !== 'partnership' && input.targetType !== 'seeker') {
    return { error: 'Invalid review target.' }
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to post a review.' }

  // Block self-review: look up the target's owner.
  const table = input.targetType === 'partnership' ? 'partnerships' : 'partnership_seekers'
  try {
    const { data: target } = await supabase.from(table).select('poster_id').eq('id', input.targetId).single()
    if (target?.poster_id && target.poster_id === user.id) {
      return { error: 'You cannot review your own listing.' }
    }
  } catch {
    // If we can't resolve ownership, fall through — the insert is still gated by RLS.
  }

  const { error } = await supabase.from('listing_reviews').insert({
    target_type: input.targetType,
    target_id: input.targetId,
    author_user_id: user.id,
    rating: input.rating ?? null,
    body,
  })

  if (error) {
    if (error.code === '42P01') {
      return { error: 'Reviews are not enabled yet (migration 0001 pending).' }
    }
    if (error.code === '23505') {
      return { error: 'You have already reviewed this listing.' }
    }
    return { error: 'Could not post your review. Please try again.' }
  }

  const path = input.targetType === 'partnership' ? `/partnerships/${input.targetId}` : `/partnerships/seeking/${input.targetId}`
  revalidatePath(path)
  return { ok: true }
}
