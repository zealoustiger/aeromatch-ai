'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Check, Loader2 } from 'lucide-react'
import { createPartnership, generatePartnershipDraft, type PartnershipDraft } from '@/app/actions'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useFormDraft, type DraftStatus } from '@/components/useFormDraft'
import PartnershipPhotoUpload from '@/components/PartnershipPhotoUpload'

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
const RATINGS = ['PPL', 'IFR', 'CPL', 'ATP', 'CFI', 'Cirrus Transition', 'High Performance', 'Complex']
const SCHEDULING = ['Google Calendar', 'FlyingClub', 'OpenPilot', 'SimPlates', 'Email/text', 'Other']

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

  // Clear the saved draft on a successful post; restore it after a failed submit
  // (React resets the uncontrolled form once the action resolves).
  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, startGenerating] = useTransition()

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
    <form ref={formRef} action={action} onSubmit={onFormSubmit} className="space-y-8">
      {!isLoggedIn && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Sign in to publish — your progress saves automatically on this device.
        </div>
      )}
      <div className="flex justify-end">
        <DraftIndicator status={status} />
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
            <Input name="model" placeholder="e.g. 172S Skyhawk" required />
          </div>
          <div>
            <Label>Year</Label>
            <Input name="year" type="number" placeholder="e.g. 2004" min={1940} max={new Date().getFullYear()} />
          </div>
          <div>
            <Label>N-Number (Registration)</Label>
            <Input name="registration" placeholder="e.g. N12345" className="font-mono uppercase" />
            <p className="mt-1 text-xs text-slate-400">Optional — helps verify the aircraft, but leave it blank if you'd rather not.</p>
          </div>
        </div>
      </section>

      {/* Photos — optional, but dramatically improve listing quality. */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Photos <span className="text-xs font-normal text-slate-400">(optional)</span></SectionHeader>
        <p className="mb-3 text-xs text-slate-500">
          Add up to 5 photos of the aircraft. Real photos make your listing far more compelling.
        </p>
        <PartnershipPhotoUpload />
      </section>

      {/* Listing content — moved up so the headline + description (what pilots read
          first) come right after the aircraft, not at the very bottom of the form. */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Listing Details</SectionHeader>
        <div className="space-y-4">
          {/* AI draft generator */}
          <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-4">
            <p className="mb-2 text-xs font-semibold text-violet-800">Prefill from your notes ✨</p>
            <p className="mb-2 text-xs text-slate-500">Paste your notes or an existing listing — the AI will prefill the whole form (aircraft, share terms, costs, title, and description). Edit anything before submitting.</p>
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
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 sm:w-auto"
            >
              {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isGenerating ? 'Prefilling…' : 'Prefill from your notes ✨'}
            </button>
          </div>
          <div>
            <Label required>Title</Label>
            <Input
              name="title"
              placeholder="e.g. 1/3 Share Available — 2004 C172S, Austin TX (KAUS)"
              required
            />
            <p className="mt-1 text-xs text-slate-400">Be specific — include aircraft, share type, and airport.</p>
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
      </section>

      {/* Location — just the ICAO. The airport name, city, and state are implied by
          the identifier, so we derive them server-side instead of asking again. */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Home Airport</SectionHeader>
        <div className="sm:max-w-xs">
          <Label required>ICAO Code</Label>
          <Input
            name="home_airport"
            placeholder="e.g. KAUS"
            required
            maxLength={4}
            className="font-mono uppercase"
          />
          <p className="mt-1 text-xs text-slate-400">
            4-letter identifier (e.g. KAUS, KDAL, KFXE). We&apos;ll fill in the airport name, city, and state for you.
          </p>
        </div>
      </section>

      {/* Partnership structure */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Partnership Structure</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Share Type</Label>
            <Select name="share_type" required>
              <option value="">Select type</option>
              {SHARE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label>Shares Available</Label>
            <Input name="shares_available" type="number" placeholder="1" min={1} max={10} defaultValue="1" />
          </div>
          <div>
            <Label>Total Shares in Partnership</Label>
            <Input name="total_shares" type="number" placeholder="e.g. 3" min={2} max={10} />
          </div>
          <div>
            <Label>Scheduling System</Label>
            <Select name="scheduling_system">
              <option value="">Select or leave blank</option>
              {SCHEDULING.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
      </section>

      {/* Costs */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Costs</SectionHeader>
        <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>
            Partnerships are structured in different ways — some charge a monthly fixed cost, some an
            hourly wet rate, some both. Enter the buy-in, and{' '}
            <span
              className="cursor-help underline decoration-dotted underline-offset-2"
              title="Every group splits costs differently. Fill in whichever of the monthly and hourly rates apply to yours and leave the other blank — you can always explain the details in your description."
            >
              leave any rate that doesn&apos;t apply blank
            </span>
            . Listings with costs shown get significantly more inquiries.
          </span>
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label required>Buy-In Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="buy_in_price" type="number" placeholder="15000" className="pl-7" min={0} required />
            </div>
          </div>
          <div>
            <Label>Monthly Fixed Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="monthly_fixed" type="number" placeholder="300" className="pl-7" min={0} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Hangar, insurance, etc.</p>
          </div>
          <div>
            <Label>Wet Rate (per hour)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="hourly_wet" type="number" placeholder="85" className="pl-7" min={0} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Fuel + oil included</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>Contact Information</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Your Name</Label>
            <Input name="contact_name" placeholder="First name or handle" />
          </div>
          <div>
            <Label required>Email</Label>
            <Input name="contact_email" type="email" placeholder="you@example.com" required />
            <p className="mt-1 text-xs text-slate-400">Not shown publicly — inquiries routed through us.</p>
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
            <Label>Phone (optional)</Label>
            <Input name="contact_phone" type="tel" placeholder="(555) 000-0000" />
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
        {pending ? 'Submitting…' : isLoggedIn ? 'Post Partnership Listing' : 'Sign in to Publish →'}
      </button>
    </form>
  )
}
