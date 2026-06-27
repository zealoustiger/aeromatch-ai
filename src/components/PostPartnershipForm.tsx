'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Check, ChevronDown, Loader2 } from 'lucide-react'
import { createPartnership, generatePartnershipDraft, type PartnershipDraft } from '@/app/actions'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useFormDraft, type DraftStatus } from '@/components/useFormDraft'
import PartnershipPhotoUpload from '@/components/PartnershipPhotoUpload'
import AirportFormInput from '@/components/AirportFormInput'

const DRAFT_KEY = 'ch:draft:partnership-new'

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

const SHARE_TYPES = ['1/2', '1/3', '1/4', 'leaseback', 'dry_lease', 'other']
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

function DraftIndicator({ status }: { status: DraftStatus }) {
  const base = 'flex items-center gap-1.5 text-xs'
  switch (status) {
    case 'saving':
      return (
        <span className={cn(base, 'text-slate-400')} aria-live="polite">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
        </span>
      )
    case 'saved':
      return (
        <span className={cn(base, 'text-emerald-600')} aria-live="polite">
          <Check className="h-3.5 w-3.5" /> Draft saved
        </span>
      )
    case 'restored':
      return (
        <span className={cn(base, 'text-emerald-600')} aria-live="polite">
          <Check className="h-3.5 w-3.5" /> Draft restored — picking up where you left off
        </span>
      )
    default:
      return <span className={cn(base, 'text-slate-400')}>Your progress autosaves on this device</span>
  }
}

export default function PostPartnershipForm({ isLoggedIn = true }: { isLoggedIn?: boolean }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        track('listing_submitted', {
          make: formData.get('make'),
          home_airport: formData.get('home_airport'),
          share_type: formData.get('share_type'),
        })
        await createPartnership(formData)
        return { ok: true }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong' }
      }
    },
    null
  )

  const { formRef, status, handleSubmit, handleResult } = useFormDraft(DRAFT_KEY)
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, startGenerating] = useTransition()
  const [showBuyInInfo, setShowBuyInInfo] = useState(false)

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
        const result: PartnershipDraft = await generatePartnershipDraft(aiPrompt)
        const form = formRef.current
        if (form) {
          fillFormField(form, '[name="title"]', result.title)
          fillFormField(form, '[name="description"]', result.description)
          if (result.make) fillFormField(form, '[name="make"]', result.make, 'change')
          if (result.model) fillFormField(form, '[name="model"]', result.model)
          if (result.year) fillFormField(form, '[name="year"]', result.year)
          if (result.registration) fillFormField(form, '[name="registration"]', result.registration)
          if (result.home_airport) fillFormField(form, '[name="home_airport"]', result.home_airport)
          if (result.share_type) fillFormField(form, '[name="share_type"]', result.share_type, 'change')
          if (result.total_shares) fillFormField(form, '[name="total_shares"]', result.total_shares)
          if (result.shares_available) fillFormField(form, '[name="shares_available"]', result.shares_available)
          if (result.buy_in_price) fillFormField(form, '[name="buy_in_price"]', result.buy_in_price)
          if (result.monthly_fixed) fillFormField(form, '[name="monthly_fixed"]', result.monthly_fixed)
          if (result.hourly_wet) fillFormField(form, '[name="hourly_wet"]', result.hourly_wet)

          // Auto-open "More details" if the AI filled any optional fields inside it
          const hasOptional = result.year || result.registration || result.title ||
            result.description || result.monthly_fixed || result.hourly_wet
          if (hasOptional && detailsRef.current) {
            detailsRef.current.open = true
          }
        }
      } catch (e) {
        setAiError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
      }
    })
  }

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isLoggedIn) {
      e.preventDefault()
      if (formRef.current) forceSaveDraft(formRef.current)
      router.push('/auth?next=/partnerships/new')
      return
    }
    handleSubmit()
  }

  return (
    <form ref={formRef} action={action} onSubmit={onFormSubmit} className="space-y-6">
      {!isLoggedIn && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Sign in to publish — your progress saves automatically on this device.
        </div>
      )}
      <div className="flex justify-end">
        <DraftIndicator status={status} />
      </div>

      {/* AI prefill — at the top so the fastest path is the most visible one */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-violet-800">Have notes? Fill the whole form in one shot ✨</p>
        <p className="mb-3 text-xs text-slate-500">
          Paste your notes or an existing listing — AI fills in aircraft, share terms, costs, and description. Edit anything before posting.
        </p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. 2004 Cessna 172S, G1000, based at KAUS. 1/3 share available, $15k buy-in, $300/mo fixed, $85/hr wet. Two current partners, good communicators, use Google Calendar. Looking for IFR-rated pilot who flies 10+ hrs/month…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        {aiError && (
          <p className="mt-1.5 text-xs text-red-600">{aiError}</p>
        )}
        <button
          type="button"
          disabled={!aiPrompt.trim() || isGenerating}
          onClick={handleGenerate}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isGenerating ? 'Prefilling…' : 'Prefill from your notes ✨'}
        </button>
      </div>

      {/* Essentials — all required fields in one compact section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>The basics</SectionHeader>
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
            <Input name="model" placeholder="e.g. 172S Skyhawk" required />
          </div>
          <div className="sm:col-span-2">
            <Label required>Home Airport</Label>
            <AirportFormInput
              name="home_airport"
              required
              placeholder="City, IATA, or ICAO (e.g. Austin, AUS, KAUS)"
            />
            <p className="mt-1 text-xs text-slate-400">
              Type a city, IATA code, or 4-letter ICAO — city and state fill in automatically.
            </p>
          </div>
          <div>
            <Label required>Share Type</Label>
            <Select name="share_type" required>
              <option value="">Select type</option>
              {SHARE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm font-medium text-slate-700">Buy-In Price <span className="text-red-500">*</span></span>
              <button
                type="button"
                onClick={() => setShowBuyInInfo(!showBuyInInfo)}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="About buy-in price"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            {showBuyInInfo && (
              <p className="mb-1.5 text-xs text-slate-500 rounded-lg bg-slate-50 px-3 py-2">
                The one-time share price a new partner pays to join. Partnerships vary widely — enter what you&apos;re asking for.
              </p>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="buy_in_price" type="number" placeholder="15000" className="pl-7" min={0} required />
            </div>
          </div>
        </div>
      </section>

      {/* More details — collapsible, closed by default */}
      <details ref={detailsRef} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-semibold text-slate-700 hover:text-slate-900 sm:px-6">
          <span>More details <span className="font-normal text-slate-400">(optional — makes your listing more compelling)</span></span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-6 px-4 pb-6 pt-2 sm:px-6">
          {/* Year + N-Number */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Year</Label>
                <Input name="year" type="number" placeholder="e.g. 2004" min={1940} max={new Date().getFullYear()} />
              </div>
              <div>
                <Label>N-Number (Registration)</Label>
                <Input name="registration" placeholder="e.g. N12345" className="font-mono uppercase" />
                <p className="mt-1 text-xs text-slate-400">Optional — helps buyers verify the aircraft.</p>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</h3>
            <p className="mb-3 text-xs text-slate-500">
              Real photos make your listing far more compelling. Add up to 5.
            </p>
            <PartnershipPhotoUpload />
          </div>

          {/* Title + Description */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Listing details</h3>
            <div className="space-y-4">
              <div>
                <Label>Title <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                <Input
                  name="title"
                  placeholder="e.g. 1/3 Share Available — 2004 C172S, Austin TX (KAUS)"
                />
                <p className="mt-1 text-xs text-slate-400">Leave blank to auto-fill from make and model.</p>
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  name="description"
                  rows={5}
                  placeholder="Tell prospective partners about the aircraft, the current group, how scheduling works, and what you're looking for in a partner..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          {/* Partnership costs */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ongoing costs <span className="font-normal normal-case">(optional)</span></h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm font-medium text-slate-700">Monthly Fixed</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <Input name="monthly_fixed" type="number" placeholder="300" className="pl-7" min={0} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Per-partner monthly fee (hangar, insurance, etc.)</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm font-medium text-slate-700">Wet Rate (per hour)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <Input name="hourly_wet" type="number" placeholder="85" className="pl-7" min={0} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Fuel included in the hourly rate</p>
              </div>
            </div>
          </div>

          {/* Share structure */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Share structure</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Shares available</Label>
                <Input name="shares_available" type="number" placeholder="1" min={1} defaultValue={1} />
              </div>
              <div>
                <Label>Total shares</Label>
                <Input name="total_shares" type="number" placeholder="e.g. 3" min={1} />
                <p className="mt-1 text-xs text-slate-400">Total number of partners once full</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Your Name</Label>
                <Input name="contact_name" placeholder="First name or handle" />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="contact_email" type="email" placeholder="you@example.com" />
                <p className="mt-1 text-xs text-slate-400">
                  Leave blank to use your account email. Not shown publicly — inquiries routed through us.
                </p>
              </div>
              <div>
                <Label>Preferred Contact Method</Label>
                <Select name="contact_method">
                  <option value="email">Email only</option>
                  <option value="phone">Phone only</option>
                  <option value="both">Email or phone</option>
                </Select>
              </div>
              <div>
                <Label>Phone <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                <Input name="contact_phone" type="tel" placeholder="(555) 000-0000" />
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
        {pending ? 'Submitting…' : isLoggedIn ? 'Post Partnership Listing' : 'Sign in to Publish →'}
      </button>
    </form>
  )
}
