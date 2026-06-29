'use client'

import { useActionState, useEffect, useTransition, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { createSeekerListing, generateSeekerDraft, type SeekerDraft } from '@/app/actions'
import { cn } from '@/lib/utils'
import { useFormDraft, type DraftStatus } from '@/components/useFormDraft'
import AirportFormInput from '@/components/AirportFormInput'
import { hasCsvItem, toggleCsvItem } from '@/lib/csvList'

const DRAFT_KEY = 'ch:draft:seeker-new'

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
// One-tap common makes for the multi-value "Preferred Makes" field. Same set the
// aircraft/partnership post forms suggest — every value is a make already used in the
// codebase, none fabricated. Chips toggle entries in the comma-separated value; the
// field stays free text so a seeker open to any other make can still type it in.
const PREFERRED_MAKE_CHIPS = ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman']
// One-tap common ratings/endorsements for the multi-value "Ratings & Endorsements" field.
// Same chip/csvList toggle pattern as PREFERRED_MAKE_CHIPS — active chip highlights which
// abbreviations are already in the comma-separated value; the field stays free text so any
// unlisted rating can still be typed. Ordered most-common first.
const RATINGS_CHIPS = ['PPL', 'IFR', 'Complex', 'High Performance', 'Multi-Engine', 'Tailwheel', 'CFI', 'ATP']
// One-tap common models for the multi-value "Preferred Models" field. Make-agnostic —
// covers the most-sought models across all 8 common makes. Same chip/csvList pattern.
const PREFERRED_MODEL_CHIPS = ['172', '182', 'SR22', 'SR20', 'Cherokee', 'Arrow', 'M20', 'Bonanza', 'DA40']
const AIRCRAFT_CATEGORIES = [
  { value: 'any', label: 'Any / Open' },
  { value: 'sel', label: 'Single-Engine Land' },
  { value: 'mel', label: 'Multi-Engine' },
  { value: 'turboprop', label: 'Turboprop' },
  { value: 'jet', label: 'Jet' },
]
const INTENDED_USE_OPTIONS = [
  { value: 'personal_travel', label: 'Personal Travel' },
  { value: 'weekend_trips', label: 'Weekend Trips' },
  { value: 'cross_country', label: 'Cross Country' },
  { value: 'instrument_currency', label: 'Instrument Currency' },
  { value: 'training', label: 'Training / Hours Building' },
  { value: 'other', label: 'Other' },
]

const DESCRIPTION_TIPS = [
  'Lead with who you are — your ratings, total hours, and how current you are.',
  'Say how you actually fly: typical missions, hours per month, day/night/IFR.',
  'Be clear on what you want — share size, budget, based airport, and timeline.',
  "Show you’ll be a good partner: how you treat aircraft, fund reserves, and communicate.",
]

const DESCRIPTION_EXAMPLES = [
  {
    label: 'First-time buyer',
    text:
      "Private pilot, 240 hours, recently instrument-rated and flying about 8 hours a month out of KAUS. Looking for a 1/3 or 1/4 share in a well-maintained IFR single (Cessna 182 or Cirrus SR20/22) for weekend trips around Texas and the occasional cross-country to see family. I'm meticulous about squawks and logbooks, happy to fund a healthy engine/maintenance reserve, and I prefer a scheduling app so everyone has fair access. Hoping to join in the next 1–2 months.",
  },
  {
    label: 'Experienced time-builder',
    text:
      "Commercial pilot, 1,400 hours, CFI/CFII building toward the airlines. Fly 15–20 hours a month and want a 1/2 share in a glass-panel SR22 or similar near KPAO for instrument currency and cross-country work. I keep aircraft hangared and spotless, pay reserves on time, and I'm an easy, communicative partner. Open to a leaseback structure if it works for the group. Ready to move quickly for the right airplane.",
  },
]

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

export default function PostSeekerListingForm({
  isLoggedIn = true,
  userEmail,
  userName,
}: {
  isLoggedIn?: boolean
  userEmail?: string
  userName?: string
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await createSeekerListing(formData)
        return { ok: true }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong' }
      }
    },
    null
  )

  const { formRef, status, handleSubmit, handleResult, reset } = useFormDraft(DRAFT_KEY)

  // Mirror the (uncontrolled) free-text "Preferred Makes" value so the one-tap make
  // chips can show which makes are currently selected. Stays uncontrolled — typing,
  // the AI prefill, and chip toggles all set the input and dispatch 'input', which
  // fires the onChange that updates this mirror.
  const [preferredMakes, setPreferredMakes] = useState('')
  // Same mirror pattern for the "Ratings & Endorsements" field.
  const [ratingsHeld, setRatingsHeld] = useState('')
  // Same mirror pattern for the "Preferred Models" field.
  const [preferredModels, setPreferredModels] = useState('')

  // Sync once after mount in case a restored draft set the field before this ran
  // (mirrors PostAircraftForm's selectedMake sync).
  useEffect(() => {
    const input = formRef.current?.querySelector<HTMLInputElement>('[name="preferred_makes"]')
    if (input?.value) setPreferredMakes(input.value)
    const ratingsInput = formRef.current?.querySelector<HTMLInputElement>('[name="ratings_held"]')
    if (ratingsInput?.value) setRatingsHeld(ratingsInput.value)
    const modelsInput = formRef.current?.querySelector<HTMLInputElement>('[name="preferred_models"]')
    if (modelsInput?.value) setPreferredModels(modelsInput.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function togglePreferredMake(make: string) {
    const input = formRef.current?.querySelector<HTMLInputElement>('[name="preferred_makes"]')
    if (!input) return
    const next = toggleCsvItem(input.value, make)
    input.value = next
    // Dispatch 'input' so autosave re-arms and the onChange mirror updates.
    input.dispatchEvent(new Event('input', { bubbles: true }))
    setPreferredMakes(next)
  }

  function toggleRating(rating: string) {
    const input = formRef.current?.querySelector<HTMLInputElement>('[name="ratings_held"]')
    if (!input) return
    const next = toggleCsvItem(input.value, rating)
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
    setRatingsHeld(next)
  }

  function togglePreferredModel(model: string) {
    const input = formRef.current?.querySelector<HTMLInputElement>('[name="preferred_models"]')
    if (!input) return
    const next = toggleCsvItem(input.value, model)
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
    setPreferredModels(next)
  }

  // Monotonic token bumped on "Start over". The async AI prefill captures it before its
  // await and bails on resolve if it has advanced — so a prefill still in flight when the
  // user clears the form can't re-populate or re-persist the cleared draft. Mirrors
  // PostAircraftForm / PostPartnershipForm.
  const fillTokenRef = useRef(0)

  function handleStartOver() {
    if (window.confirm("Clear this draft and start over? This erases what you've entered on this device.")) {
      // Invalidate any in-flight AI prefill so it can't re-fill the form (or re-arm
      // autosave) after we clear it below.
      fillTokenRef.current += 1
      setAiError(null)
      reset()
      setPreferredMakes('')
      setRatingsHeld('')
      setPreferredModels('')
    }
  }
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  const aiPromptRef = useRef<HTMLTextAreaElement>(null)
  const [hasAiPrompt, setHasAiPrompt] = useState(false)
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
    const token = fillTokenRef.current
    startGenerating(async () => {
      try {
        const result: SeekerDraft = await generateSeekerDraft(aiPromptRef.current?.value ?? '')
        // Bail if the user hit "Start over" while this was in flight — don't
        // re-populate the cleared form.
        if (token !== fillTokenRef.current) return
        const form = formRef.current
        if (form) {
          fillFormField(form, '[name="title"]', result.title)
          fillFormField(form, '[name="description"]', result.description)
          if (result.preferred_makes) fillFormField(form, '[name="preferred_makes"]', result.preferred_makes)
          if (result.preferred_models) fillFormField(form, '[name="preferred_models"]', result.preferred_models)
          if (result.aircraft_category) fillFormField(form, '[name="aircraft_category"]', result.aircraft_category, 'change')
          if (result.min_year) fillFormField(form, '[name="min_year"]', result.min_year)
          if (result.max_year) fillFormField(form, '[name="max_year"]', result.max_year)
          if (result.max_buy_in) fillFormField(form, '[name="max_buy_in"]', result.max_buy_in)
          if (result.max_monthly) fillFormField(form, '[name="max_monthly"]', result.max_monthly)
          if (result.max_hourly) fillFormField(form, '[name="max_hourly"]', result.max_hourly)
          if (result.home_airport) fillFormField(form, '[name="home_airport"]', result.home_airport)
          if (result.willing_to_travel_nm) fillFormField(form, '[name="willing_to_travel_nm"]', result.willing_to_travel_nm, 'change')
          if (result.total_hours) fillFormField(form, '[name="total_hours"]', result.total_hours)
          if (result.ratings_held) fillFormField(form, '[name="ratings_held"]', result.ratings_held)
          if (result.hours_per_month) fillFormField(form, '[name="hours_per_month"]', result.hours_per_month)
          // If AI fills anything that lives in the "More details" section, open it
          const hasMoreDetails = result.preferred_makes || result.preferred_models ||
            result.aircraft_category || result.min_year || result.max_year ||
            result.max_monthly || result.max_hourly || result.total_hours ||
            result.ratings_held || result.hours_per_month || result.willing_to_travel_nm ||
            result.title || result.description
          if (hasMoreDetails && detailsRef.current) {
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
      router.push('/auth?next=/partnerships/seeking/new')
      return
    }
    handleSubmit()
  }

  return (
    <form ref={formRef} action={action} onSubmit={onFormSubmit} className="space-y-5">
      {!isLoggedIn && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Sign in to publish — your progress saves automatically on this device.
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        {(status === 'saved' || status === 'restored') && (
          <button
            type="button"
            onClick={handleStartOver}
            className="text-xs text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline"
          >
            Start over
          </button>
        )}
        <DraftIndicator status={status} />
      </div>

      {/* AI prefill — first thing on the form */}
      <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-4">
        <p className="mb-1 text-xs font-semibold text-violet-800">Prefill from your notes ✨</p>
        <p className="mb-2 text-xs text-slate-500">Jot down a few sentences about yourself and what you&apos;re looking for — the AI will prefill the whole form (aircraft preferences, budget, location, pilot profile, title, and description).</p>
        <textarea
          ref={aiPromptRef}
          defaultValue=""
          onInput={(e) => setHasAiPrompt(!!(e.target as HTMLTextAreaElement).value.trim())}
          rows={3}
          placeholder="e.g. IFR-rated, 450 hours, fly 10–12 hrs/month out of KPAO. Looking for a 1/4 share in an IFR single, prefer a Cessna 182 or Piper Archer. Budget around $20k buy-in, $400/mo fixed…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        {aiError && (
          <p className="mt-1.5 text-xs text-red-600">{aiError}</p>
        )}
        <button
          type="button"
          disabled={!hasAiPrompt || isGenerating}
          onClick={handleGenerate}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 sm:w-auto"
        >
          {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isGenerating ? 'Prefilling…' : 'Prefill from your notes ✨'}
        </button>
      </div>

      {/* The basics — only what's needed to publish */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionHeader>The basics</SectionHeader>
        <div className="space-y-4">
          <div>
            <Label required>Home Airport</Label>
            <AirportFormInput
              name="home_airport"
              required
              placeholder="City, IATA, or ICAO (e.g. Austin, AUS, KAUS)"
            />
            <p className="mt-1 text-xs text-slate-400">Type a city or airport code — name, city, and state fill in automatically.</p>
          </div>
          <div>
            <Label>Also flying from <span className="font-normal text-slate-400">(optional)</span></Label>
            <AirportFormInput
              name="additional_airport_2"
              placeholder="Second airport, if you fly from multiple (e.g. KNUQ)"
            />
            <p className="mt-1 text-xs text-slate-400">Based near two airports? Add the second so owners at either can find you.</p>
          </div>
          <div>
            <Label>Max Buy-In <span className="font-normal text-slate-400">(optional)</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="max_buy_in" type="number" placeholder="e.g. 25000" className="pl-7" min={0} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Your maximum buy-in — helps owners find compatible partners.</p>
          </div>
          <div>
            <Label>Title <span className="font-normal text-slate-400">(optional)</span></Label>
            <Input
              name="title"
              placeholder="e.g. IFR pilot seeking 1/3 share near Austin (KAUS)"
            />
            <p className="mt-1 text-xs text-slate-400">Leave blank to auto-fill from your location and preferences.</p>
          </div>
        </div>
      </section>

      {/* More details — everything optional, collapsed by default */}
      <details ref={detailsRef} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-semibold text-slate-700">More details <span className="font-normal text-slate-400">(optional)</span></span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-6 border-t border-slate-100 px-4 pb-6 pt-4 sm:px-6">

          {/* Aircraft preferences */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Aircraft Preferences</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Preferred Makes</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {PREFERRED_MAKE_CHIPS.map((make) => {
                    const active = hasCsvItem(preferredMakes, make)
                    return (
                      <button
                        key={make}
                        type="button"
                        onClick={() => togglePreferredMake(make)}
                        aria-pressed={active}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                          active
                            ? 'border-sky-400 bg-sky-50 text-sky-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {make}
                      </button>
                    )
                  })}
                </div>
                <Input
                  name="preferred_makes"
                  placeholder="e.g. Cessna, Piper, Cirrus"
                  onChange={(e) => setPreferredMakes(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">Tap a make to add it, or type your own — comma-separated. Leave blank if open to any.</p>
              </div>
              <div>
                <Label>Preferred Models</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {PREFERRED_MODEL_CHIPS.map((model) => {
                    const active = hasCsvItem(preferredModels, model)
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => togglePreferredModel(model)}
                        aria-pressed={active}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                          active
                            ? 'border-sky-400 bg-sky-50 text-sky-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {model}
                      </button>
                    )
                  })}
                </div>
                <Input
                  name="preferred_models"
                  placeholder="e.g. 172, 182, PA-28, SR22"
                  onChange={(e) => setPreferredModels(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">Tap a model to add it, or type your own — comma-separated. Leave blank if open to any.</p>
              </div>
              <div>
                <Label>Aircraft Category</Label>
                <Select name="aircraft_category">
                  {AIRCRAFT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Year</Label>
                  <Input name="min_year" type="number" placeholder="e.g. 1995" min={1940} max={new Date().getFullYear()} />
                </div>
                <div>
                  <Label>Max Year</Label>
                  <Input name="max_year" type="number" placeholder="Any" min={1940} max={new Date().getFullYear()} />
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Budget</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Max Monthly Cost</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <Input name="max_monthly" type="number" placeholder="500" className="pl-7" min={0} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Hangar, insurance, etc.</p>
              </div>
              <div>
                <Label>Max Wet Rate</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <Input name="max_hourly" type="number" placeholder="120" className="pl-7" min={0} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Per hour, fuel included</p>
              </div>
            </div>
          </div>

          {/* Location extras */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Location</p>
            <div>
              <Label>Max commute distance</Label>
              <Select name="willing_to_travel_nm">
                <option value="">Home airport only</option>
                <option value="25">~30 min drive</option>
                <option value="40">~45 min drive</option>
                <option value="50">~1 hr drive</option>
                <option value="75">~1.5 hr drive</option>
                <option value="100">~2 hr drive</option>
              </Select>
              <p className="mt-1 text-xs text-slate-400">How far you&apos;d commute from your home airport</p>
            </div>
          </div>

          {/* Pilot profile */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Your Pilot Profile</p>
            <p className="mb-3 text-xs text-slate-500">Helps owners know who they&apos;re talking to — shown on your listing.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Total Flight Hours</Label>
                <Input name="total_hours" type="number" placeholder="e.g. 300" min={0} />
              </div>
              <div>
                <Label>Ratings &amp; Endorsements You Hold</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {RATINGS_CHIPS.map((rating) => {
                    const active = hasCsvItem(ratingsHeld, rating)
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => toggleRating(rating)}
                        aria-pressed={active}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                          active
                            ? 'border-sky-400 bg-sky-50 text-sky-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {rating}
                      </button>
                    )
                  })}
                </div>
                <Input
                  name="ratings_held"
                  placeholder="e.g. PPL, IFR, Complex"
                  onChange={(e) => setRatingsHeld(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">Tap to add, or type any rating — comma-separated</p>
              </div>
              <div>
                <Label>Estimated Hours per Month</Label>
                <Input name="hours_per_month" type="number" placeholder="e.g. 15" min={1} max={200} />
              </div>
            </div>
            <div className="mt-4">
              <Label>Intended Use</Label>
              <div className="mt-2 flex flex-wrap gap-2" id="intended-use-group">
                {INTENDED_USE_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-700">
                    <input type="checkbox" name="intended_use_check" value={value} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
              <input type="hidden" name="intended_use" id="intended_use_hidden" />
            </div>
          </div>

          {/* Partnership preferences */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Partnership Preferences</p>
            <div>
              <Label>Preferred Share Types</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SHARE_TYPES.map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-700">
                    <input type="checkbox" name="share_type_check" value={t} className="sr-only" />
                    {t}
                  </label>
                ))}
              </div>
              <input type="hidden" name="preferred_share_types" id="preferred_share_types_hidden" />
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Description</p>
            <div className="mb-2 rounded-lg border border-sky-100 bg-sky-50/60 p-3">
              <p className="text-xs font-semibold text-sky-800">How to write a great description</p>
              <ul className="mt-1.5 space-y-1">
                {DESCRIPTION_TIPS.map((tip) => (
                  <li key={tip} className="flex gap-1.5 text-xs text-slate-600">
                    <span aria-hidden className="text-sky-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <details className="group mt-2">
                <summary className="cursor-pointer list-none text-xs font-medium text-sky-700 hover:text-sky-800">
                  <span className="group-open:hidden">See two example descriptions</span>
                  <span className="hidden group-open:inline">Hide examples</span>
                </summary>
                <div className="mt-2 space-y-2">
                  {DESCRIPTION_EXAMPLES.map((ex) => (
                    <div key={ex.label} className="rounded-md border border-slate-200 bg-white p-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{ex.label}</p>
                      <p className="mt-1 text-xs italic leading-relaxed text-slate-600">&ldquo;{ex.text}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
            <textarea
              name="description"
              rows={5}
              placeholder="Tell owners about yourself — your experience, how you fly, what you're looking for in a partnership, and anything that makes you a great partner..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Contact info */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Contact Information</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Your Name</Label>
                <Input name="contact_name" placeholder="e.g. Jay C." defaultValue={userName ?? ''} />
                <p className="mt-1 text-xs text-slate-400">
                  {isLoggedIn && !userName
                    ? "We'll save your name for future listings."
                    : 'Only your first name + last initial is shown publicly.'}
                </p>
              </div>
              <div>
                <Label>Email <span className="font-normal text-slate-400">(optional)</span></Label>
                <Input name="contact_email" type="email" placeholder="you@example.com" defaultValue={userEmail ?? ''} />
                <p className="mt-1 text-xs text-slate-400">
                  {userEmail
                    ? 'Pre-filled from your account — edit if needed. Not shown publicly.'
                    : 'Defaults to your account email. Not shown publicly.'}
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
                <Label>Phone <span className="font-normal text-slate-400">(optional)</span></Label>
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
        {pending ? 'Submitting…' : isLoggedIn ? 'Post Seeking Listing' : 'Sign in to Publish →'}
      </button>

      {/* Sync checkbox groups to hidden inputs before submit */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          function syncCheckboxes(checkboxName, hiddenId) {
            var form = document.currentScript ? document.currentScript.closest('form') : document.querySelector('form');
            if (!form) return;
            function update() {
              var checked = Array.from(form.querySelectorAll('[name="' + checkboxName + '"]:checked')).map(function(el) { return el.value; });
              var hidden = form.querySelector('#' + hiddenId);
              if (hidden) hidden.value = checked.join(',');
            }
            form.addEventListener('change', update);
            update();
          }
          syncCheckboxes('intended_use_check', 'intended_use_hidden');
          syncCheckboxes('share_type_check', 'preferred_share_types_hidden');
        })();
      `}} />
    </form>
  )
}
