'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import AirportFormInput from '@/components/AirportFormInput'
import { updateProfile } from '@/app/actions'

export default function ProfileAirportsForm({
  homeAirport,
  favoriteAirports,
}: {
  homeAirport: string | null
  favoriteAirports: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setStatus('idle')
    setError(null)
    startTransition(async () => {
      const res = await updateProfile(formData)
      if (res.ok) {
        setStatus('saved')
        router.refresh()
      } else {
        setStatus('error')
        setError(res.error ?? 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="home_airport" className="mb-1 block text-sm font-medium text-slate-700">
          Base airport
        </label>
        <AirportFormInput
          name="home_airport"
          defaultValue={homeAirport ?? ''}
          placeholder="City, IATA, or ICAO (e.g. Austin, AUS, KAUS)"
        />
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Favorite airports <span className="font-normal text-slate-400">(optional, up to 3)</span>
        </span>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <AirportFormInput
              key={i}
              name={`favorite_airport_${i + 1}`}
              defaultValue={favoriteAirports[i] ?? ''}
              placeholder="City, IATA, or ICAO"
            />
          ))}
        </div>
      </div>

      {status === 'error' && error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save'
          )}
        </button>
        {status === 'saved' && !pending && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
