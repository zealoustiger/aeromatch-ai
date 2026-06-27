'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useFormDraft } from '@/components/useFormDraft'
import { createAircraftListing, generateAircraftDraft, type AircraftDraft } from '@/app/actions'
import PartnershipPhotoUpload from '@/components/PartnershipPhotoUpload'
import AirportFormInput from '@/components/AirportFormInput'

const MAKES = ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman', 'Other']

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100',
        className
      )}
      {...props}
    />
  )
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

const DRAFT_KEY = 'ch:draft:aircraft-new'

function forceSaveDraft(form: HTMLFormElement) {
  try {
    const data: Record<string, string> = {}
    for (const el of Array.from(form.elements)) {
      const e = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      if (e.name && e.value &&
          !['file', 'password', 'submit', 'button', 'reset', 'hidden', 'checkbox', 'radio'].includes(
            (e as HTMLInputElement).type ?? ''
          )) {
        data[e.name] = e.value
      }
    }
    if (Object.keys(data).length) {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    }
  } catch {
    /* storage unavailable — best effort */
  }
}

export default function PostAircraftForm({ isLoggedIn = true }: { isLoggedIn?: boolean }) {
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        track('aircraft_listing_submitted', {
          make: formData.get('make'),
          state: formData.get('state'),
          asking_price: formData.get('asking_price'),
        })
        await createAircraftListing(formData)
        return { ok: true }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong' }
      }
    },
    null
  )

  const router = useRouter()
  const { formRef, status, handleSubmit, handleResult } = useFormDraft(DRAFT_KEY)
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isLoggedIn) {
      e.preventDefault()
      if (formRef.current) forceSaveDraft(formRef.current)
      router.push('/auth?next=/aircraft/new')
      return
    }
    handleSubmit()
  }

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, startGenerating] = useTransition()

  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupStatus, setLookupStatus] = useState<string | null>(null)

  function fillFormField(form: HTMLFormElement, selector: string, value: string | number | undefined, eventType = 'input') {
    if (value === undefined || value === null) return
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector)
    if (el) {
      el.value = String(value)
      el.dispatchEvent(new Event(eventType, { bubbles: true }))
    }
  }

  function handleGenerate() {
    setAiError(null)
    startGenerating(async () => {
      try {
        const result: AircraftDraft = await generateAircraftDraft(aiPrompt)
        const form = formRef.current
        if (form) {
          if (result.make) fillFormField(form, '[name="make"]', result.make, 'change')
          if (result.model) fillFormField(form, '[name="model"]', result.model)
          if (result.year) fillFormField(form, '[name="year"]', result.year)
          if (result.registration) fillFormField(form, '[name="registration"]', result.registration)
          if (result.ttaf) fillFormField(form, '[name="ttaf"]', result.ttaf)
          if (result.smoh) fillFormField(form, '[name="smoh"]', result.smoh)
          if (result.asking_price) fillFormField(form, '[name="asking_price"]', result.asking_price)
          if (result.home_airport) fillFormField(form, '[name="home_airport"]', result.home_airport)
          fillFormField(form, '[name="title"]', result.title)
          fillFormField(form, '[name="description"]', result.description)

          // Auto-open "More details" if the AI filled any optional fields inside it
          const hasOptional = result.year || result.registration || result.ttaf || result.smoh ||
            result.asking_price || result.home_airport || result.title || result.description
          if (hasOptional && detailsRef.current) {
            detailsRef.current.open = true
          }
        }
      } catch (e) {
        setAiError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
      }
    })
  }

  async function handleLookup() {
    const form = formRef.current
    if (!form) return
    const regInput = form.querySelector<HTMLInputElement>('[name="registration"]')
    const nRaw = regInput?.value.trim() ?? ''
    if (!nRaw) return
    setIsLookingUp(true)
    setLookupStatus(null)
    try {
      const res = await fetch(`/api/faa-lookup?n=${encodeURIComponent(nRaw)}`)
      const data = await res.json()
      if (data.found) {
        const makeSelect = form.querySelector<HTMLSelectElement>('[name="make"]')
        const modelInput = form.querySelector<HTMLInputElement>('[name="model"]')
        const yearInput = form.querySelector<HTMLInputElement>('[name="year"]')
        if (makeSelect && data.make) {
          makeSelect.value = data.make
          makeSelect.dispatchEvent(new Event('change', { bubbles: true }))
        }
        if (modelInput && data.model) {
          modelInput.value = data.model
          modelInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
        if (yearInput && data.year) {
          yearInput.value = String(data.year)
          yearInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
        setLookupStatus(`Found: ${[data.year, data.make, data.model].filter(Boolean).join(' ')}`)
        // Auto-open details since N-number lookup fills optional fields
        if (detailsRef.current) detailsRef.current.open = true
      } else {
        setLookupStatus('Not found — fill in manually')
      }
    } catch {
      setLookupStatus('FAA lookup unavailable — fill in manually')
    } finally {
      setIsLookingUp(false)
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={onFormSubmit} className="space-y-6">
      {!isLoggedIn && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Sign in to publish — your progress saves automatically on this device.
        </div>
      )}
      <div className="flex justify-end">
        <span className="text-xs text-slate-400">
          {status === 'saved' || status === 'restored' ? 'Draft saved' : 'Your progress autosaves on this device'}
        </span>
      </div>

      {/* AI prefill — at the top so the fastest path is the most visible one */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-violet-800">Prefill from your notes ✨</p>
        <p className="mb-3 text-xs text-slate-500">
          Paste your listing text or a few notes — the AI fills in make, model, year, hours, price, location, title, and description all at once. Edit anything before posting.
        </p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. 2006 Cessna 182T, G1000 glass panel, 2450 TTAF, 600 SMOH, good paint/interior, based at KAUS. Selling because upgrading to a twin. Fresh annual March 2026."
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        {aiError && (
          <p className="mt-1.5 text-xs text-red-600">{aiError}</p>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!aiPrompt.trim() || isGenerating}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isGenerating ? 'Prefilling…' : 'Prefill from your notes ✨'}
        </button>
      </div>

      {/* The basics — only the two required fields */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">The basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Make</Label>
            <Select name="make" required>
              <option value="">Select make</option>
              {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Model</Label>
            <Input name="model" placeholder="e.g. 182T Skylane" required />
          </div>
        </div>
      </section>

      {/* More details — everything optional, collapsed by default */}
      <details ref={detailsRef} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-semibold text-slate-700 hover:text-slate-900 sm:px-6">
          <span className="text-sm font-semibold text-slate-700">More details <span className="font-normal text-slate-400">(optional)</span></span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-6 px-4 pb-6 pt-2 sm:px-6">

          {/* Aircraft details */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Year</Label>
                <Input name="year" type="number" placeholder="e.g. 2006" min={1940} max={new Date().getFullYear()} />
              </div>
              <div>
                <Label>N-Number (Registration)</Label>
                <div className="flex gap-2">
                  <Input name="registration" placeholder="e.g. N12345" className="font-mono uppercase" />
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={isLookingUp}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {isLookingUp ? '…' : 'Look up →'}
                  </button>
                </div>
                {lookupStatus && (
                  <p className={cn('mt-1 text-xs', lookupStatus.startsWith('Found') ? 'text-green-600' : 'text-slate-500')}>
                    {lookupStatus}
                  </p>
                )}
              </div>
              <div>
                <Label>Total Time (TTAF, hrs)</Label>
                <Input name="ttaf" type="number" placeholder="e.g. 2450" min={0} />
              </div>
              <div>
                <Label>SMOH (hrs since overhaul)</Label>
                <Input name="smoh" type="number" placeholder="e.g. 600" min={0} />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</h3>
            <p className="mb-3 text-xs text-slate-500">
              Real photos make your listing far more compelling. Add up to 5.
            </p>
            <PartnershipPhotoUpload endpoint="/api/upload-aircraft-photo" />
          </div>

          {/* Listing details */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Listing details</h3>
            <div className="space-y-4">
              <div>
                <Label>Title <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                <Input name="title" placeholder="e.g. 2006 Cessna 182T Skylane — G1000, 2,450 TTAF" />
                <p className="mt-1 text-xs text-slate-400">Leave blank to auto-fill from make, model, and year. Add a standout detail if you have one.</p>
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  name="description"
                  rows={5}
                  placeholder="Avionics, engine/prop times, damage history, paint/interior, why you're selling, anything a buyer should know…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          {/* Price + location */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Price &amp; location</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Asking Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <Input name="asking_price" type="number" placeholder="285000" className="pl-7" min={0} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Leave blank for &ldquo;contact for price.&rdquo;</p>
              </div>
              <div>
                <Label>Based at <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                <AirportFormInput
                  name="home_airport"
                  placeholder="City, IATA, or ICAO (e.g. Austin, AUS, KAUS)"
                />
                <p className="mt-1 text-xs text-slate-400">Type a city or airport code — city and state fill in automatically.</p>
              </div>
            </div>
          </div>

        </div>
      </details>

      {state && !state.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? 'Submitting…' : isLoggedIn ? 'Post Aircraft for Sale' : 'Sign in to Publish →'}
      </button>
    </form>
  )
}
