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
import { SEO_MAKE_MODELS } from '@/lib/seo'

const DRAFT_KEY = 'ch:draft:partnership-new'
// Uploaded photo URLs persist alongside the text draft so they survive the
// deferred-auth redirect / a reload (see PartnershipPhotoUpload persistKey).
// Mirrors PostAircraftForm.
const PHOTOS_KEY = `${DRAFT_KEY}:photos`

// Curated model-name suggestions reused from the existing SEO make/model table —
// no new or fabricated data. Grouped by a normalized make key so the Model field
// can suggest only the picked make's models (datalist; free text still allowed).
// Mirrors PostAircraftForm so partnership listings keep model values consistent.
const normMake = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const MODELS_BY_MAKE: Record<string, string[]> = SEO_MAKE_MODELS.reduce((acc, m) => {
  const key = normMake(m.make)
  ;(acc[key] ??= []).push(m.model)
  return acc
}, {} as Record<string, string[]>)
const ALL_MODELS = Array.from(new Set(SEO_MAKE_MODELS.map((m) => m.model)))

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

// Common makes kept as one-tap suggestions. The Make field is free text (datalist),
// so a partner posting any make can type it in — no "Other" dead-end that would lose the
// real make and break the buyer-side comp / Estimate / model-family matching. Mirrors
// PostAircraftForm.
const MAKES = ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman']

// Make suggestions = dedup union (by normalized key) of the common makes above and the
// distinct makes already in SEO_MAKE_MODELS (adds Bellanca, Robinson, CubCrafters, …) —
// every suggestion is a make already present in the codebase, none fabricated. Canonical
// spelling from MAKES wins on a tie (e.g. "Van's" over "Vans"). Sorted for the dropdown.
const MAKE_SUGGESTIONS: string[] = (() => {
  const byKey = new Map<string, string>()
  for (const m of SEO_MAKE_MODELS) byKey.set(normMake(m.make), m.make)
  for (const m of MAKES) byKey.set(normMake(m), m) // MAKES last → its spelling wins
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b))
})()

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

export default function PostPartnershipForm({
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

  const { formRef, status, handleSubmit, handleResult, reset } = useFormDraft(DRAFT_KEY)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  // Bumped on "Start over" to remount the photo uploader so its thumbnails clear too
  // (reset() only clears the form's DOM fields, not the uploader's React state).
  const [photoMountKey, setPhotoMountKey] = useState(0)
  // Monotonic token bumped on "Start over". The async autofills (FAA N-number lookup,
  // AI prefill) capture it before their await and bail on resolve if it has advanced —
  // so a lookup/prefill still in flight when the user clears the form can't re-populate
  // or re-persist the just-cleared draft. Mirrors PostAircraftForm.
  const fillTokenRef = useRef(0)

  // Mirror the (uncontrolled) Make input so the Model field can suggest only that make's
  // curated models. Stays uncontrolled — the FAA/AI autofill sets make via fillFormField's
  // dispatched 'input' event, which still fires this onChange.
  const [selectedMake, setSelectedMake] = useState('')
  const makeKey = normMake(selectedMake)
  const modelSuggestions =
    makeKey && MODELS_BY_MAKE[makeKey]
      ? MODELS_BY_MAKE[makeKey]
      : selectedMake && selectedMake !== 'Other'
        ? [] // a make with no curated models (e.g. FAA-injected) — free text only
        : ALL_MODELS // no make picked yet — fall back to the full curated list

  // Sync the make once after mount in case a restored draft set it before this ran.
  useEffect(() => {
    const sel = formRef.current?.querySelector<HTMLInputElement>('[name="make"]')
    if (sel?.value) setSelectedMake(sel.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleStartOver() {
    if (window.confirm("Clear this draft and start over? This erases what you've entered on this device.")) {
      // Invalidate any in-flight FAA lookup / AI prefill so it can't re-fill the
      // form (or re-arm autosave) after we clear it below.
      fillTokenRef.current += 1
      setLookupStatus(null)
      setAiError(null)
      reset()
      try {
        window.localStorage.removeItem(PHOTOS_KEY)
      } catch {
        /* storage unavailable — uploader remount below still clears the thumbnails */
      }
      // Remount the photo uploader so its thumbnails clear too (reset() only clears
      // the form's DOM fields, not the uploader's React state).
      setPhotoMountKey((k) => k + 1)
    }
  }

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  const aiPromptRef = useRef<HTMLTextAreaElement>(null)
  const [hasAiPrompt, setHasAiPrompt] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, startGenerating] = useTransition()
  const [showBuyInInfo, setShowBuyInInfo] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupStatus, setLookupStatus] = useState<string | null>(null)

  async function handleLookup() {
    const form = formRef.current
    if (!form) return
    const regInput = form.querySelector<HTMLInputElement>('[name="registration"]')
    const nRaw = regInput?.value.trim() ?? ''
    if (!nRaw || isLookingUp) return
    const token = fillTokenRef.current
    setIsLookingUp(true)
    setLookupStatus(null)
    try {
      const res = await fetch(`/api/faa-lookup?n=${encodeURIComponent(nRaw)}`)
      const data = await res.json()
      // Bail if the user hit "Start over" while this was in flight — don't re-fill
      // (or re-arm autosave on) the cleared form.
      if (token !== fillTokenRef.current) return
      if (data.found) {
        const modelInput = form.querySelector<HTMLInputElement>('[name="model"]')
        const yearInput = form.querySelector<HTMLInputElement>('[name="year"]')
        if (data.make) fillFormField(form, '[name="make"]', data.make)
        if (modelInput && data.model) {
          modelInput.value = data.model
          modelInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
        if (yearInput && data.year) {
          yearInput.value = String(data.year)
          yearInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
        setLookupStatus(`Found: ${[data.year, data.make, data.model].filter(Boolean).join(' ')}`)
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
        const result: PartnershipDraft = await generatePartnershipDraft(aiPromptRef.current?.value ?? '')
        // Bail if the user hit "Start over" while this was in flight — don't
        // re-populate the cleared form.
        if (token !== fillTokenRef.current) return
        const form = formRef.current
        if (form) {
          fillFormField(form, '[name="title"]', result.title)
          fillFormField(form, '[name="description"]', result.description)
          if (result.make) fillFormField(form, '[name="make"]', result.make)
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

          if (result.ttaf) fillFormField(form, '[name="ttaf"]', result.ttaf)
          if (result.smoh) fillFormField(form, '[name="smoh"]', result.smoh)
          if (result.engine_type) fillFormField(form, '[name="engine_type"]', result.engine_type)
          // Auto-open "More details" if the AI filled any optional fields inside it
          const hasOptional = result.year || result.registration || result.title ||
            result.description || result.monthly_fixed || result.hourly_wet ||
            result.ttaf || result.smoh || result.engine_type
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

      {/* AI prefill — at the top so the fastest path is the most visible one */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-violet-800">Have notes? Fill the whole form in one shot ✨</p>
        <p className="mb-3 text-xs text-slate-500">
          Paste your notes or an existing listing — AI fills in aircraft, share terms, costs, and description. Edit anything before posting.
        </p>
        <textarea
          ref={aiPromptRef}
          defaultValue=""
          onInput={(e) => setHasAiPrompt(!!(e.target as HTMLTextAreaElement).value.trim())}
          rows={3}
          placeholder="e.g. 2004 Cessna 172S, G1000, based at KAUS. 1/3 share available, $15k buy-in, $300/mo fixed, $85/hr wet. Two current partners, good communicators, use Google Calendar. Looking for IFR-rated pilot who flies 10+ hrs/month…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        {aiError && (
          <p className="mt-1.5 text-xs text-red-600">{aiError}</p>
        )}
        <button
          type="button"
          disabled={!hasAiPrompt || isGenerating}
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

        {/* N-number autofill — one field fills make, model, and year */}
        <div className="mb-4">
          <Label>N-Number (Registration)</Label>
          <div className="flex gap-2">
            <Input
              name="registration"
              placeholder="e.g. N12345 — auto-fills make, model &amp; year"
              className="font-mono uppercase"
              onBlur={(e) => {
                const next = e.relatedTarget as HTMLElement | null
                if (next?.dataset?.lookup) return
                handleLookup()
              }}
            />
            <button
              type="button"
              data-lookup="true"
              onClick={handleLookup}
              disabled={isLookingUp}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {isLookingUp ? '…' : 'Look up →'}
            </button>
          </div>
          {lookupStatus ? (
            <p className={cn('mt-1 text-xs', lookupStatus.startsWith('Found') ? 'text-green-600' : 'text-slate-500')}>
              {lookupStatus}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Optional — type your tail number and we&apos;ll fill in make, model, and year.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Make</Label>
            <Input
              name="make"
              placeholder="e.g. Cessna, Maule, Bellanca"
              required
              list="partnership-make-suggestions"
              autoComplete="off"
              onChange={(e) => setSelectedMake(e.target.value)}
            />
            <datalist id="partnership-make-suggestions">
              {MAKE_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <Label required>Model</Label>
            <Input
              name="model"
              placeholder="e.g. 172S Skyhawk"
              required
              list="partnership-model-suggestions"
              autoComplete="off"
            />
            <datalist id="partnership-model-suggestions">
              {modelSuggestions.map((m) => <option key={m} value={m} />)}
            </datalist>
            {modelSuggestions.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">Start typing to pick a common model, or enter your own.</p>
            )}
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
              <span className="text-sm font-medium text-slate-700">Buy-In Price <span className="text-xs font-normal text-slate-400">(optional)</span></span>
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
                The one-time share price a new partner pays to join. Partnerships vary widely — enter what you&apos;re asking for, or leave blank if the price is negotiable.
              </p>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="buy_in_price" type="number" placeholder="15000" className="pl-7" min={0} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Leave blank if price is negotiable — describe the terms in your listing.</p>
          </div>
        </div>
      </section>

      {/* Photos — always visible; the highest-value element of a listing */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</h3>
        <p className="mb-3 text-xs text-slate-500">
          Real photos make your listing far more compelling. Add up to 5.
        </p>
        <PartnershipPhotoUpload
          key={photoMountKey}
          persistKey={PHOTOS_KEY}
          restoreGateKey={DRAFT_KEY}
        />
      </section>

      {/* More details — collapsible, closed by default */}
      <details ref={detailsRef} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-semibold text-slate-700 hover:text-slate-900 sm:px-6">
          <span>More details <span className="font-normal text-slate-400">(optional — makes your listing more compelling)</span></span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-6 px-4 pb-6 pt-2 sm:px-6">
          {/* Aircraft specs */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Year</Label>
                <Input name="year" type="number" placeholder="e.g. 2004" min={1940} max={new Date().getFullYear()} />
              </div>
              <div>
                <Label>Total Time (TTAF, hrs)</Label>
                <Input name="ttaf" type="number" placeholder="e.g. 2450" min={0} />
              </div>
              <div>
                <Label>SMOH (hrs since overhaul)</Label>
                <Input name="smoh" type="number" placeholder="e.g. 600" min={0} />
              </div>
              <div>
                <Label>Engine</Label>
                <Input name="engine_type" placeholder="e.g. Lycoming IO-360, Continental IO-550" />
                <p className="mt-1 text-xs text-slate-400">Powers the Engine Life &amp; overhaul-reserve estimate on your listing.</p>
              </div>
            </div>
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
                <Input name="contact_name" placeholder="First name or handle" defaultValue={userName ?? ''} />
                {isLoggedIn && !userName && (
                  <p className="mt-1 text-xs text-slate-400">We&apos;ll save your name for future listings.</p>
                )}
              </div>
              <div>
                <Label>Email</Label>
                <Input name="contact_email" type="email" placeholder="you@example.com" defaultValue={userEmail ?? ''} />
                <p className="mt-1 text-xs text-slate-400">
                  {userEmail
                    ? 'Pre-filled from your account. Only shared when you select email contact above.'
                    : 'Leave blank to use your account email. Only shared when you select email contact above.'}
                </p>
              </div>
              <div>
                <Label>Preferred Contact Method</Label>
                <Select name="contact_method">
                  <option value="platform">Message through ClubHanger (default)</option>
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
