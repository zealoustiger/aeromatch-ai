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
import { SEO_MAKE_MODELS } from '@/lib/seo'

// Common makes kept as one-tap suggestions. The Make field is free text (datalist),
// so a seller of any make can type it in — no "Other" dead-end that would lose their
// real make and break the buyer-side comp / Estimate / model-family matching.
const MAKES = ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman']

// Curated model-name suggestions reused from the existing SEO make/model table —
// no new or fabricated data. Grouped by a normalized make key so the Model field
// can suggest only the picked make's models (datalist; free text still allowed).
const normMake = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const MODELS_BY_MAKE: Record<string, string[]> = SEO_MAKE_MODELS.reduce((acc, m) => {
  const key = normMake(m.make)
  ;(acc[key] ??= []).push(m.model)
  return acc
}, {} as Record<string, string[]>)
const ALL_MODELS = Array.from(new Set(SEO_MAKE_MODELS.map((m) => m.model)))

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

const DRAFT_KEY = 'ch:draft:aircraft-new'
// Uploaded photo URLs persist alongside the text draft so they survive the
// deferred-auth redirect / a reload (see PartnershipPhotoUpload persistKey).
const PHOTOS_KEY = `${DRAFT_KEY}:photos`

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
  const { formRef, status, handleSubmit, handleResult, reset } = useFormDraft(DRAFT_KEY)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  // Bumped on "Start over" to remount the photo uploader so its thumbnails clear too
  // (reset() only clears the form's DOM fields, not the uploader's React state).
  const [photoMountKey, setPhotoMountKey] = useState(0)
  // Monotonic token bumped on "Start over". The async autofills (FAA N-number lookup,
  // AI prefill) capture it before their await and bail on resolve if it has advanced —
  // so a lookup still in flight when the user clears the form can't re-populate or
  // re-persist the just-cleared draft.
  const fillTokenRef = useRef(0)

  // Mirror the (uncontrolled) Make <select> so the Model field can suggest only that
  // make's curated models. Stays uncontrolled — the FAA/AI autofill sets make via a
  // dispatched 'change' event, which still fires this onChange (see handleMakeChange).
  const [selectedMake, setSelectedMake] = useState('')
  const makeKey = normMake(selectedMake)
  const modelSuggestions =
    makeKey && MODELS_BY_MAKE[makeKey]
      ? MODELS_BY_MAKE[makeKey]
      : selectedMake && selectedMake !== 'Other'
        ? [] // a make with no curated models (e.g. FAA-injected) — free text only
        : ALL_MODELS // no make picked yet — fall back to the full curated list

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

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
      setPhotoMountKey((k) => k + 1)
    }
  }

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isLoggedIn) {
      e.preventDefault()
      if (formRef.current) forceSaveDraft(formRef.current)
      router.push('/auth?next=/aircraft/new')
      return
    }
    handleSubmit()
  }

  const aiPromptRef = useRef<HTMLTextAreaElement>(null)
  const [hasAiPrompt, setHasAiPrompt] = useState(false)
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
    const token = fillTokenRef.current
    startGenerating(async () => {
      try {
        const result: AircraftDraft = await generateAircraftDraft(aiPromptRef.current?.value ?? '')
        // Bail if the user hit "Start over" while this was in flight — don't
        // re-populate the cleared form.
        if (token !== fillTokenRef.current) return
        const form = formRef.current
        if (form) {
          if (result.make) fillFormField(form, '[name="make"]', result.make)
          if (result.model) fillFormField(form, '[name="model"]', result.model)
          if (result.year) fillFormField(form, '[name="year"]', result.year)
          if (result.registration) fillFormField(form, '[name="registration"]', result.registration)
          if (result.ttaf) fillFormField(form, '[name="ttaf"]', result.ttaf)
          if (result.smoh) fillFormField(form, '[name="smoh"]', result.smoh)
          if (result.engine_type) fillFormField(form, '[name="engine_type"]', result.engine_type)
          if (result.asking_price) fillFormField(form, '[name="asking_price"]', result.asking_price)
          if (result.home_airport) fillFormField(form, '[name="home_airport"]', result.home_airport)
          fillFormField(form, '[name="title"]', result.title)
          fillFormField(form, '[name="description"]', result.description)

          // Auto-open "More details" if the AI filled any optional fields inside it
          // (description is now outside <details>, so it doesn't trigger auto-open)
          const hasOptional = result.year || result.ttaf || result.smoh ||
            result.engine_type || result.title
          if (hasOptional && detailsRef.current) {
            detailsRef.current.open = true
          }

          // If the notes mentioned an N-number but the AI couldn't pin down the
          // make/model/year, verify against the authoritative FAA registry and backfill
          // only the gaps — so "Selling N739WL, $180k" still yields a complete listing.
          // onlyEmpty so the registry never clobbers a value the AI already extracted.
          const makeInput = form.querySelector<HTMLInputElement>('[name="make"]')
          const modelInput = form.querySelector<HTMLInputElement>('[name="model"]')
          const yearInput = form.querySelector<HTMLInputElement>('[name="year"]')
          const missingCore = !makeInput?.value || !modelInput?.value || !yearInput?.value
          if (result.registration && missingCore) {
            await handleLookup({ onlyEmpty: true })
          }
        }
      } catch (e) {
        setAiError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
      }
    })
  }

  // Look up the FAA registry for the N-number currently in the form and fill make /
  // model / year. By default (manual "Look up →" button / blur) the registry value is
  // authoritative and overwrites whatever's there. When called with { onlyEmpty: true }
  // — as the chained backfill after AI prefill does — it fills only the fields the AI
  // left blank, so a registry hit never clobbers a make/model/year the AI already set.
  async function handleLookup({ onlyEmpty = false }: { onlyEmpty?: boolean } = {}) {
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
        const makeInput = form.querySelector<HTMLInputElement>('[name="make"]')
        const modelInput = form.querySelector<HTMLInputElement>('[name="model"]')
        const yearInput = form.querySelector<HTMLInputElement>('[name="year"]')
        if (data.make && !(onlyEmpty && makeInput?.value)) fillFormField(form, '[name="make"]', data.make)
        if (modelInput && data.model && !(onlyEmpty && modelInput.value)) {
          modelInput.value = data.model
          modelInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
        if (yearInput && data.year && !(onlyEmpty && yearInput.value)) {
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
          ref={aiPromptRef}
          defaultValue=""
          onInput={(e) => setHasAiPrompt(!!(e.target as HTMLTextAreaElement).value.trim())}
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
          disabled={!hasAiPrompt || isGenerating}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isGenerating ? 'Prefilling…' : 'Prefill from your notes ✨'}
        </button>
      </div>

      {/* The basics — N-number at top for one-field auto-fill, then make/model */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">The basics</h2>

        {/* N-number autofill — one field replaces make/model/year */}
        <div className="mb-4">
          <Label>N-Number (Registration)</Label>
          <div className="flex gap-2">
            <Input
              name="registration"
              placeholder="e.g. N12345 — auto-fills make, model &amp; year"
              className="font-mono uppercase"
              onBlur={(e) => {
                // Skip auto-trigger when the user clicked the "Look up →" button directly
                // (the button's own onClick handles it; avoid double lookup)
                const next = e.relatedTarget as HTMLElement | null
                if (next?.dataset?.lookup) return
                handleLookup()
              }}
            />
            <button
              type="button"
              data-lookup="true"
              onClick={() => handleLookup()}
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
          {!lookupStatus && (
            <p className="mt-1 text-xs text-slate-400">Type your tail number — make, model, and year fill in automatically.</p>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Make</Label>
            <Input
              name="make"
              placeholder="e.g. Cessna, Maule, Bellanca"
              required
              list="aircraft-make-suggestions"
              autoComplete="off"
              onChange={(e) => setSelectedMake(e.target.value)}
            />
            <datalist id="aircraft-make-suggestions">
              {MAKE_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <Label required>Model</Label>
            <Input
              name="model"
              placeholder="e.g. 182T Skylane"
              required
              list="aircraft-model-suggestions"
              autoComplete="off"
            />
            <datalist id="aircraft-model-suggestions">
              {modelSuggestions.map((m) => <option key={m} value={m} />)}
            </datalist>
            {modelSuggestions.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">Start typing to pick a common model, or enter your own.</p>
            )}
          </div>
        </div>

        {/* Price + location — always visible so sellers fill the most-important fields */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Asking Price <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
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
      </section>

      {/* Photos — always visible; the highest-value element of a listing */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</h3>
        <p className="mb-3 text-xs text-slate-500">
          Real photos make your listing far more compelling. Add up to 5.
        </p>
        <PartnershipPhotoUpload
          key={photoMountKey}
          endpoint="/api/upload-aircraft-photo"
          persistKey={PHOTOS_KEY}
          restoreGateKey={DRAFT_KEY}
        />
      </section>

      {/* About this aircraft — description visible by default so sellers are prompted to write one */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-1 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">About this aircraft</h2>
        <p className="mb-3 text-xs text-slate-500">Tell buyers what makes this aircraft special — avionics, engine times, recent work, paint/interior, and why you're selling. A good description is the single biggest factor in getting a serious inquiry.</p>
        <textarea
          name="description"
          rows={5}
          placeholder="e.g. 2006 Cessna 182T with G1000 glass panel, 2,450 TTAF, 600 SMOH. Fresh annual April 2026. Good paint and interior. Garmin 650 with WAAS, ADS-B Out. Selling because upgrading. Serious buyers only."
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </section>

      {/* More details — aircraft specs, title & contact */}
      <details ref={detailsRef} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-semibold text-slate-700 hover:text-slate-900 sm:px-6">
          <span className="text-sm font-semibold text-slate-700">More details <span className="font-normal text-slate-400">(optional)</span></span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-6 px-4 pb-6 pt-2 sm:px-6">

          {/* Aircraft specs */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft specs</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Year</Label>
                <Input name="year" type="number" placeholder="e.g. 2006" min={1940} max={new Date().getFullYear()} />
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
                <p className="mt-1 text-xs text-slate-400">Make + designation. Powers the Engine Life &amp; overhaul-reserve estimate on your listing.</p>
              </div>
            </div>
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
                <Label>Phone <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                <Input name="contact_phone" type="tel" placeholder="(555) 000-0000" />
                <p className="mt-1 text-xs text-slate-400">Shown to buyers on your listing if you'd like them to call or text.</p>
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
