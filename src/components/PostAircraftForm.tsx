'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useFormDraft } from '@/components/useFormDraft'
import { createAircraftListing, generateAircraftDraft } from '@/app/actions'
import PartnershipPhotoUpload from '@/components/PartnershipPhotoUpload'

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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">
      {children}
    </h2>
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

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isLoggedIn) {
      e.preventDefault()
      // Force-save the draft before navigating so it survives the auth redirect.
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

  function handleGenerate() {
    setAiError(null)
    startGenerating(async () => {
      try {
        const result = await generateAircraftDraft(aiPrompt)
        const form = formRef.current
        if (form) {
          const titleInput = form.querySelector<HTMLInputElement>('[name="title"]')
          const descTextarea = form.querySelector<HTMLTextAreaElement>('[name="description"]')
          if (titleInput) {
            titleInput.value = result.title
            titleInput.dispatchEvent(new Event('input', { bubbles: true }))
          }
          if (descTextarea) {
            descTextarea.value = result.description
            descTextarea.dispatchEvent(new Event('input', { bubbles: true }))
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
    <form ref={formRef} action={action} onSubmit={onFormSubmit} className="space-y-8">
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

      {/* Aircraft details */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Aircraft Details</SectionHeader>
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
      </section>

      {/* Photos — optional, but dramatically improve listing quality. */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Photos <span className="text-xs font-normal text-slate-400">(optional)</span></SectionHeader>
        <p className="mb-4 text-sm text-slate-500">
          Add up to 5 photos of the aircraft. Real photos make your listing far more compelling.
        </p>
        <PartnershipPhotoUpload endpoint="/api/upload-aircraft-photo" />
      </section>

      {/* Listing content */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Listing Details</SectionHeader>
        <div className="space-y-4">
          {/* AI draft generator */}
          <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-4">
            <p className="mb-2 text-xs font-semibold text-violet-800">Generate with AI ✨</p>
            <p className="mb-2 text-xs text-slate-500">Jot down a few sentences about your aircraft — the AI will draft a title and description for you.</p>
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
              className="mt-2 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 sm:w-auto"
            >
              {isGenerating ? 'Generating…' : 'Generate with AI ✨'}
            </button>
          </div>

          <div>
            <Label required>Title</Label>
            <Input name="title" placeholder="e.g. 2006 Cessna 182T Skylane — G1000, 2,450 TTAF" required />
            <p className="mt-1 text-xs text-slate-400">Be specific — include year, make/model, and a standout detail.</p>
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
      </section>

      {/* Price + location */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Price &amp; Location</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Asking Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="asking_price" type="number" placeholder="285000" className="pl-7" min={0} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Leave blank for &ldquo;contact for price.&rdquo;</p>
          </div>
          <div>
            <Label>Location</Label>
            <Input name="location" placeholder="e.g. Austin, TX" />
          </div>
          <div>
            <Label>State</Label>
            <Input name="state" placeholder="TX" maxLength={2} className="uppercase" />
            <p className="mt-1 text-xs text-slate-400">2-letter code — powers the state search pages.</p>
          </div>
        </div>
      </section>

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
