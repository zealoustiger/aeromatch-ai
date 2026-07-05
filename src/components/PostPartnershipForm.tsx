'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Check, ChevronDown, Loader2 } from 'lucide-react'
import { createPartnership, updatePartnershipListing, generatePartnershipDraft, generatePartnershipDraftFromUrl, type PartnershipDraft } from '@/app/actions'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useFormDraft, readForm, type DraftStatus } from '@/components/useFormDraft'
import PartnershipPhotoUpload from '@/components/PartnershipPhotoUpload'
import AirportFormInput from '@/components/AirportFormInput'
import { SEO_MAKE_MODELS } from '@/lib/seo'
import { hasCsvItem, toggleCsvItem } from '@/lib/csvList'
import { consumePostHandoff } from '@/lib/postHandoff'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

// Same rating set as the seeker form's "Ratings & Endorsements You Hold" chips —
// here they describe what a partnership requires of a prospective partner.
const RATINGS_CHIPS = ['PPL', 'IFR', 'Complex', 'High Performance', 'Multi-Engine', 'Tailwheel', 'CFI', 'ATP']

const DESCRIPTION_TIPS = [
  'Lead with the aircraft basics: make/model/year, total time, engine time since major overhaul (SMOH), and avionics.',
  'Describe the group: how many partners, their experience/ratings, and how well it runs today.',
  'Explain scheduling: what system you use and how easy it is to get the airplane when you need it.',
  "Say what you're looking for in a partner: hours, ratings, how often they'd fly, and any buy-in/reserve expectations.",
]

const DESCRIPTION_EXAMPLES = [
  {
    label: 'Established group with an opening',
    text:
      "1/4 share in a 2004 Cessna 172S based at KAUS, 3,200 TTAF, 450 SMOH, Garmin 430W with ADS-B Out. Well-run 4-pilot group, all instrument-rated, scheduling via FlyingClub app with rarely a conflict. Buy-in $18,000, $180/mo dues covers hangar + reserves, wet rate $95/hr. Looking for a pilot with 200+ hours who flies at least 10 hrs/month and wants a long-term partner, not a short-term renter.",
  },
  {
    label: 'New partnership forming',
    text:
      "Forming a 1/3 partnership on a 2010 Piper Archer, 1,800 TTAF, 200 SMOH, based at KPAO. I'm the first partner and looking for 2 more to split a $60,000 buy-in evenly. Plan to use a shared scheduling app and split hangar/insurance/reserve costs equally. Looking for instrument-rated pilots who'll fly regularly and treat the airplane like their own — happy to talk through the full cost breakdown before you commit.",
  },
]

const NEW_DRAFT_KEY = 'ch:draft:partnership-new'

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

function forceSaveDraft(form: HTMLFormElement, draftKey: string) {
  try {
    const data = readForm(form)
    if (Object.keys(data).length) {
      window.localStorage.setItem(draftKey, JSON.stringify(data))
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

function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      inputMode={type === 'number' ? 'numeric' : undefined}
      className={cn(
        'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100',
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
        'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100',
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

export interface PartnershipEditInitial {
  make?: string
  model?: string
  year?: number
  registration?: string
  home_airport?: string
  share_type?: string
  shares_available?: number
  total_shares?: number
  buy_in_price?: number
  monthly_fixed?: number
  hourly_wet?: number
  ttaf?: number
  smoh?: number
  engine_type?: string
  annual_due?: string
  damage_history?: boolean
  min_hours?: number
  ratings_required?: string
  scheduling_system?: string
  title?: string
  description?: string
  images?: string[]
  contact_name?: string
  contact_email?: string
  contact_method?: string
  contact_phone?: string
}

export default function PostPartnershipForm({
  isLoggedIn: isLoggedInProp = true,
  userEmail,
  userName,
  userPhone,
  mode = 'create',
  listingId,
  initialValues,
}: {
  isLoggedIn?: boolean
  userEmail?: string
  userName?: string
  userPhone?: string
  mode?: 'create' | 'edit'
  listingId?: string
  initialValues?: PartnershipEditInitial
}) {
  const isEdit = mode === 'edit' && !!listingId
  // Live auth state, not just the SSR-derived prop above — so a session that
  // expires/changes while this form is open (mid-edit, mid-AI-draft, mid-upload)
  // still flips the submit/AI-draft/photo-upload auth gates instead of leaving
  // them silently stale and letting a 401 surface as a raw error. Mirrors
  // PostAircraftForm.
  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInProp)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])
  // Edit drafts are scoped per listing so they never collide with (or restore into)
  // the "post a new partnership" draft, and vice versa. Mirrors PostAircraftForm.
  const DRAFT_KEY = isEdit ? `ch:draft:partnership-edit:${listingId}` : NEW_DRAFT_KEY
  // Uploaded photo URLs persist alongside the text draft so they survive the
  // deferred-auth redirect / a reload (see PartnershipPhotoUpload persistKey).
  // Mirrors PostAircraftForm.
  const PHOTOS_KEY = `${DRAFT_KEY}:photos`

  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        if (isEdit) {
          track('partnership_listing_edited', { listing_id: listingId })
          await updatePartnershipListing(listingId as string, formData)
        } else {
          track('listing_submitted', {
            make: formData.get('make'),
            home_airport: formData.get('home_airport'),
            share_type: formData.get('share_type'),
          })
          await createPartnership(formData)
        }
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
  // Bumped on "Start over" to remount AirportFormInput so its own invalid/suggestion
  // state clears too (reset() doesn't fire the input/change event it relies on).
  const [airportMountKey, setAirportMountKey] = useState(0)
  // Count of photos still mid-upload — blocks submit so a photo whose upload hasn't
  // resolved yet can't silently publish without it (PartnershipPhotoUpload only emits
  // a hidden photo_url input once a photo's URL exists).
  const [uploadingPhotoCount, setUploadingPhotoCount] = useState(0)
  // Monotonic token bumped on "Start over". The async autofills (FAA N-number lookup,
  // AI prefill) capture it before their await and bail on resolve if it has advanced —
  // so a lookup/prefill still in flight when the user clears the form can't re-populate
  // or re-persist the just-cleared draft. Mirrors PostAircraftForm.
  const fillTokenRef = useRef(0)

  // Mirror the (uncontrolled) Make input so the Model field can suggest only that make's
  // curated models. Stays uncontrolled — the FAA/AI autofill sets make via fillFormField's
  // dispatched 'input' event, which still fires this onChange.
  const [selectedMake, setSelectedMake] = useState(initialValues?.make ?? '')
  const makeKey = normMake(selectedMake)
  const modelSuggestions =
    makeKey && MODELS_BY_MAKE[makeKey]
      ? MODELS_BY_MAKE[makeKey]
      : selectedMake && selectedMake !== 'Other'
        ? [] // a make with no curated models (e.g. FAA-injected) — free text only
        : ALL_MODELS // no make picked yet — fall back to the full curated list

  // Track the selected contact method so we can hide the email field when platform
  // messaging is chosen (the email address is irrelevant / never shown in that case).
  const [contactMethod, setContactMethod] = useState(initialValues?.contact_method ?? 'platform')

  // Mirror of the ratings_required chip input, same pattern as the seeker form's
  // ratings_held — lets the chip buttons and the free-text fallback stay in sync.
  const [ratingsRequired, setRatingsRequired] = useState(initialValues?.ratings_required ?? '')

  // Sync make + contact method + ratings once after mount in case a restored draft
  // set them before this ran (mirrors the selectedMake pattern above).
  useEffect(() => {
    const makeEl = formRef.current?.querySelector<HTMLInputElement>('[name="make"]')
    if (makeEl?.value) setSelectedMake(makeEl.value)
    const methodEl = formRef.current?.querySelector<HTMLSelectElement>('[name="contact_method"]')
    if (methodEl?.value) setContactMethod(methodEl.value)
    const ratingsEl = formRef.current?.querySelector<HTMLInputElement>('[name="ratings_required"]')
    if (ratingsEl?.value) setRatingsRequired(ratingsEl.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleRatingRequired(rating: string) {
    const input = formRef.current?.querySelector<HTMLInputElement>('[name="ratings_required"]')
    if (!input) return
    const next = toggleCsvItem(input.value, rating)
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
    setRatingsRequired(next)
  }

  function handleStartOver() {
    const confirmMessage = isEdit
      ? 'Discard your unsaved edits and revert to the last published version?'
      : "Clear this draft and start over? This erases what you've entered on this device."
    if (window.confirm(confirmMessage)) {
      // Invalidate any in-flight FAA lookup / AI prefill so it can't re-fill the
      // form (or re-arm autosave) after we clear it below.
      fillTokenRef.current += 1
      setLookupStatus(null)
      setAiError(null)
      reset()
      // form.reset() (inside reset()) restores fields to their HTML defaults — blank
      // in create mode, the listing's saved values in edit mode — so mirror state
      // follows the same target instead of always clearing to blank.
      setRatingsRequired(initialValues?.ratings_required ?? '')
      try {
        window.localStorage.removeItem(PHOTOS_KEY)
      } catch {
        /* storage unavailable — uploader remount below still clears the thumbnails */
      }
      // Remount the photo uploader so its thumbnails clear too (reset() only clears
      // the form's DOM fields, not the uploader's React state).
      setPhotoMountKey((k) => k + 1)
      setAirportMountKey((k) => k + 1)
    }
  }

  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  const aiPromptRef = useRef<HTMLTextAreaElement>(null)
  const [hasAiPrompt, setHasAiPrompt] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, startGenerating] = useTransition()

  // The AI-notes textarea is now part of the draft (has a `name`), so a restored
  // draft can silently set its value without firing `input` — sync the button's
  // enabled state once after the draft-restore effect above has run.
  useEffect(() => {
    if (aiPromptRef.current?.value.trim()) setHasAiPrompt(true)
  }, [])
  const [showBuyInInfo, setShowBuyInInfo] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupStatus, setLookupStatus] = useState<string | null>(null)

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
    if (!isLoggedIn) {
      redirectToAuth()
      return
    }
    setAiError(null)
    const token = fillTokenRef.current
    const raw = (aiPromptRef.current?.value ?? '').trim()
    const isBareUrl = /^https?:\/\/\S+$/i.test(raw)
    startGenerating(async () => {
      try {
        const result: PartnershipDraft = isBareUrl
          ? await generatePartnershipDraftFromUrl(raw)
          : await generatePartnershipDraft(raw)
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
          if (result.annual_due) fillFormField(form, '[name="annual_due"]', result.annual_due)
          // damage_history is a boolean — `false` is a meaningful, distinct value from
          // "not extracted," so this must check for undefined rather than truthiness.
          if (result.damage_history !== undefined) {
            fillFormField(form, '[name="damage_history"]', String(result.damage_history), 'change')
          }
          if (result.min_hours) fillFormField(form, '[name="min_hours"]', result.min_hours)
          if (result.ratings_required) fillFormField(form, '[name="ratings_required"]', result.ratings_required)
          if (result.scheduling_system) fillFormField(form, '[name="scheduling_system"]', result.scheduling_system)
          // Auto-open "More details" if the AI filled any optional fields still inside it
          // (description is now outside <details>, so it doesn't trigger auto-open)
          const hasOptional = result.year || result.registration || result.title ||
            result.monthly_fixed || result.hourly_wet ||
            result.ttaf || result.smoh || result.engine_type ||
            result.annual_due || result.damage_history !== undefined ||
            result.min_hours || result.ratings_required || result.scheduling_system
          if (hasOptional && detailsRef.current) {
            detailsRef.current.open = true
          }

          // If the pasted text mentioned an N-number but the AI couldn't pin down the
          // make/model/year, verify against the authoritative FAA registry and backfill
          // only the gaps — so "1/3 share in N739WL, KAUS, $15k" still yields a complete
          // listing. onlyEmpty so the registry never clobbers a value the AI already
          // extracted. Mirrors PostAircraftForm's chained backfill.
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

  // Pick up a paste handed off from the /post chooser (read-once). Fills the AI notes
  // box either way; only auto-runs the extraction when logged in — doing it while
  // logged out would just immediately bounce to /auth, which is a jarring first touch.
  useEffect(() => {
    if (isEdit) return
    const handoff = consumePostHandoff()
    if (!handoff || !aiPromptRef.current) return
    aiPromptRef.current.value = handoff
    aiPromptRef.current.dispatchEvent(new Event('input', { bubbles: true }))
    setHasAiPrompt(true)
    if (isLoggedIn) handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function redirectToAuth() {
    if (formRef.current) forceSaveDraft(formRef.current, DRAFT_KEY)
    router.push(`/auth?next=${isEdit ? `/partnerships/${listingId}/edit` : '/partnerships/new'}`)
  }

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isLoggedIn) {
      e.preventDefault()
      redirectToAuth()
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
            {isEdit ? 'Revert changes' : 'Start over'}
          </button>
        )}
        <DraftIndicator status={status} />
      </div>

      {/* AI prefill — at the top so the fastest path is the most visible one */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <p className="mb-1 text-sm font-semibold text-violet-800">Have notes? Fill the whole form in one shot ✨</p>
          {!isEdit && (
            <Link href="/post" className="shrink-0 text-xs font-medium text-violet-600 underline-offset-2 hover:text-violet-800 hover:underline">
              Not posting a share? Choose again →
            </Link>
          )}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Paste your notes, an existing listing, or a link to your listing on another site — AI fills in aircraft, share terms, costs, and description. Edit anything before posting.
        </p>
        <textarea
          ref={aiPromptRef}
          name="_ai_notes_draft"
          defaultValue=""
          onInput={(e) => setHasAiPrompt(!!(e.target as HTMLTextAreaElement).value.trim())}
          rows={3}
          placeholder="e.g. 2004 Cessna 172S, G1000, based at KAUS. 1/3 share available, $15k buy-in, $300/mo fixed, $85/hr wet. Two current partners, good communicators, use Google Calendar. Looking for IFR-rated pilot who flies 10+ hrs/month… Or just paste a link to your listing on another site."
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
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
              defaultValue={initialValues?.registration ?? ''}
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
              onClick={() => handleLookup()}
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
              defaultValue={initialValues?.make ?? ''}
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
              defaultValue={initialValues?.model ?? ''}
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
              key={airportMountKey}
              name="home_airport"
              defaultValue={initialValues?.home_airport ?? ''}
              required
              placeholder="City, IATA, or ICAO (e.g. Austin, AUS, KAUS)"
            />
            <p className="mt-1 text-xs text-slate-400">
              Type a city, IATA code, or 4-letter ICAO — city and state fill in automatically.
            </p>
          </div>
          <div>
            <Label required>Share Type</Label>
            <Select name="share_type" defaultValue={initialValues?.share_type ?? ''} required>
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
              <Input name="buy_in_price" type="number" defaultValue={initialValues?.buy_in_price ?? ''} placeholder="15000" className="pl-7" min={0} />
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
          initialPhotos={initialValues?.images}
          isLoggedIn={isLoggedIn}
          onRequireAuth={redirectToAuth}
          onUploadingChange={setUploadingPhotoCount}
        />
      </section>

      {/* About this partnership — description visible by default so posters are prompted to write one */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-1 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">About this partnership</h2>
        <p className="mb-3 text-xs text-slate-500">Tell prospective partners about the aircraft, the current group, how scheduling works, and what you&apos;re looking for in a partner. A compelling description is the single biggest factor in getting a serious inquiry.</p>
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
          defaultValue={initialValues?.description ?? ''}
          rows={5}
          placeholder="e.g. 1/3 share in a 2004 Cessna 172S based at KAUS. 3-pilot group, all instrument-rated, great camaraderie. Scheduling via FlyingClub app, rarely a conflict. TTAF 3,200, fresh annual Jan 2026. Looking for a pilot with 200+ hours who wants to fly 15+ hrs/month."
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base sm:text-sm placeholder-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </section>

      {/* More details — collapsible; open by default in edit mode when it already holds data */}
      <details
        ref={detailsRef}
        open={Boolean(
          (isEdit && (initialValues?.year || initialValues?.registration || initialValues?.ttaf || initialValues?.smoh ||
            initialValues?.engine_type || initialValues?.annual_due || initialValues?.damage_history != null ||
            initialValues?.title || initialValues?.monthly_fixed ||
            initialValues?.hourly_wet || initialValues?.total_shares || initialValues?.min_hours ||
            initialValues?.ratings_required || initialValues?.scheduling_system ||
            initialValues?.contact_name || initialValues?.contact_email || initialValues?.contact_phone)) ||
          (!isEdit && userPhone)
        )}
        className="group rounded-xl border border-slate-200 bg-white shadow-sm">
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
                <Input name="year" type="number" defaultValue={initialValues?.year ?? ''} placeholder="e.g. 2004" min={1940} max={new Date().getFullYear()} />
              </div>
              <div>
                <Label>Total Time (TTAF, hrs)</Label>
                <Input name="ttaf" type="number" defaultValue={initialValues?.ttaf ?? ''} placeholder="e.g. 2450" min={0} />
              </div>
              <div>
                <Label>SMOH (hrs since overhaul)</Label>
                <Input name="smoh" type="number" defaultValue={initialValues?.smoh ?? ''} placeholder="e.g. 600" min={0} />
              </div>
              <div>
                <Label>Engine</Label>
                <Input name="engine_type" defaultValue={initialValues?.engine_type ?? ''} placeholder="e.g. Lycoming IO-360, Continental IO-550" />
                <p className="mt-1 text-xs text-slate-400">Powers the Engine Life &amp; overhaul-reserve estimate on your listing.</p>
              </div>
              <div>
                <Label>Annual due</Label>
                <Input
                  name="annual_due"
                  type="month"
                  defaultValue={initialValues?.annual_due ? initialValues.annual_due.slice(0, 7) : ''}
                />
                <p className="mt-1 text-xs text-slate-400">Powers the Annual Inspection status on your listing.</p>
              </div>
              <div>
                <Label>Damage history</Label>
                <Select
                  name="damage_history"
                  defaultValue={
                    initialValues?.damage_history == null ? '' : initialValues.damage_history ? 'true' : 'false'
                  }
                >
                  <option value="">Prefer not to say</option>
                  <option value="false">No damage reported</option>
                  <option value="true">Damage reported</option>
                </Select>
                <p className="mt-1 text-xs text-slate-400">Shown as a buyer-trust signal — leave blank to omit.</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Listing details</h3>
            <div className="space-y-4">
              <div>
                <Label>Title <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                <Input
                  name="title"
                  defaultValue={initialValues?.title ?? ''}
                  placeholder="e.g. 1/3 Share Available — 2004 C172S, Austin TX (KAUS)"
                />
                <p className="mt-1 text-xs text-slate-400">Leave blank to auto-fill from make and model.</p>
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
                  <Input name="monthly_fixed" type="number" defaultValue={initialValues?.monthly_fixed ?? ''} placeholder="300" className="pl-7" min={0} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Per-partner monthly fee (hangar, insurance, etc.)</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm font-medium text-slate-700">Wet Rate (per hour)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <Input name="hourly_wet" type="number" defaultValue={initialValues?.hourly_wet ?? ''} placeholder="85" className="pl-7" min={0} />
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
                <Input name="shares_available" type="number" placeholder="1" min={1} defaultValue={initialValues?.shares_available ?? 1} />
              </div>
              <div>
                <Label>Total shares</Label>
                <Input name="total_shares" type="number" defaultValue={initialValues?.total_shares ?? ''} placeholder="e.g. 3" min={1} />
                <p className="mt-1 text-xs text-slate-400">Total number of partners once full</p>
              </div>
            </div>
          </div>

          {/* Partner requirements */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Partner requirements <span className="font-normal normal-case">(optional)</span></h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Minimum Hours</Label>
                <Input name="min_hours" type="number" defaultValue={initialValues?.min_hours ?? ''} placeholder="e.g. 200" min={0} />
              </div>
              <div>
                <Label>Scheduling System</Label>
                <Input name="scheduling_system" defaultValue={initialValues?.scheduling_system ?? ''} placeholder="e.g. FlyingClub, Google Calendar" />
              </div>
              <div className="sm:col-span-2">
                <Label>Ratings Required</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {RATINGS_CHIPS.map((rating) => {
                    const active = hasCsvItem(ratingsRequired, rating)
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => toggleRatingRequired(rating)}
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
                  name="ratings_required"
                  defaultValue={initialValues?.ratings_required ?? ''}
                  placeholder="e.g. PPL, IFR, Complex"
                  onChange={(e) => setRatingsRequired(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">Tap to add, or type any rating — comma-separated</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Your Name</Label>
                <Input name="contact_name" autoComplete="name" placeholder="First name or handle" defaultValue={initialValues?.contact_name ?? userName ?? ''} />
                {isLoggedIn && !userName && !initialValues?.contact_name && (
                  <p className="mt-1 text-xs text-slate-400">We&apos;ll save your name for future listings.</p>
                )}
              </div>
              <div className={contactMethod === 'platform' ? 'hidden' : undefined}>
                <Label>Email</Label>
                <Input name="contact_email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={initialValues?.contact_email ?? userEmail ?? ''} />
                <p className="mt-1 text-xs text-slate-400">
                  {userEmail
                    ? 'Pre-filled from your account. Only shared when you select email contact above.'
                    : 'Leave blank to use your account email. Only shared when you select email contact above.'}
                </p>
              </div>
              <div>
                <Label>Preferred Contact Method</Label>
                <Select
                  name="contact_method"
                  defaultValue={initialValues?.contact_method ?? 'platform'}
                  onChange={(e) => setContactMethod(e.target.value)}
                >
                  <option value="platform">Message through ClubHanger (default)</option>
                  <option value="email">Email only</option>
                  <option value="phone">Phone only</option>
                  <option value="both">Email or phone</option>
                </Select>
              </div>
              <div>
                <Label>Phone <span className="text-xs font-normal text-slate-400">(optional)</span></Label>
                <Input name="contact_phone" type="tel" autoComplete="tel" defaultValue={initialValues?.contact_phone ?? userPhone ?? ''} placeholder="(555) 000-0000" />
                {userPhone && !initialValues?.contact_phone && (
                  <p className="mt-1 text-xs text-slate-400">Pre-filled from a previous listing.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </details>

      {state && !state.ok && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || uploadingPhotoCount > 0}
        className="w-full rounded-lg bg-sky-600 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        {pending
          ? 'Saving…'
          : uploadingPhotoCount > 0
            ? 'Uploading photos…'
            : !isLoggedIn
              ? 'Sign in to Publish →'
              : isEdit
                ? 'Save Changes'
                : 'Post Partnership Listing'}
      </button>
    </form>
  )
}
