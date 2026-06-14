'use client'

import { useActionState } from 'react'
import { upsertProfile } from '@/app/profile/actions'
import type { Profile } from '@/lib/types'

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500'

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await upsertProfile(formData)) ?? null
    },
    null
  )

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Display name
          <input name="display_name" defaultValue={profile?.display_name ?? ''} className={inputCls} placeholder="e.g. Dave M." />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Home airport (ICAO)
          <input name="home_airport" defaultValue={profile?.home_airport ?? ''} className={inputCls} placeholder="KAUS" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Total hours
          <input name="total_hours" type="number" min="0" defaultValue={profile?.total_hours ?? ''} className={inputCls} placeholder="450" />
        </label>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Ratings held <span className="font-normal text-slate-400">(comma-separated)</span>
          <input
            name="ratings_held"
            defaultValue={profile?.ratings_held?.join(', ') ?? ''}
            className={inputCls}
            placeholder="PPL, IFR, Complex"
          />
        </label>
        <p className="mt-1 text-xs text-slate-400">
          Self-attested. A “Verified” badge can only be granted by ClubHanger after manual review — you can’t set it yourself.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Mission <span className="font-normal text-slate-400">(one line)</span>
          <input name="mission" defaultValue={profile?.mission ?? ''} className={inputCls} placeholder="Weekend trips + staying instrument current" />
        </label>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Bio
          <textarea name="bio" defaultValue={profile?.bio ?? ''} rows={4} className={inputCls} placeholder="A bit about you, your flying, and what you're looking for in a partnership." />
        </label>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Avatar URL <span className="font-normal text-slate-400">(optional)</span>
          <input name="avatar_url" defaultValue={profile?.avatar_url ?? ''} className={inputCls} placeholder="https://…" />
        </label>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
