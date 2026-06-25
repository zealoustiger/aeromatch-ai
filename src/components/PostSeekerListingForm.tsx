'use client'

import { useActionState, useEffect, useTransition, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { createSeekerListing, generateSeekerDraft } from '@/app/actions'
import { cn } from '@/lib/utils'
import { useFormDraft, type DraftStatus } from '@/components/useFormDraft'

const SHARE_TYPES = ['1/2', '1/3', '1/4', 'leaseback', 'dry_lease', 'other']
const RATINGS = ['PPL', 'IFR', 'CPL', 'ATP', 'CFI', 'Cirrus Transition', 'High Performance', 'Complex', 'Multi-Engine']
const MAKES = ['Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Mooney', "Van's", 'Diamond', 'Grumman', 'Other']
const INTENDED_USE_OPTIONS = [
  { value: 'personal_travel', label: 'Personal Travel' },
  { value: 'weekend_trips', label: 'Weekend Trips' },
  { value: 'cross_country', label: 'Cross Country' },
  { value: 'instrument_currency', label: 'Instrument Currency' },
  { value: 'training', label: 'Training / Hours Building' },
  { value: 'other', label: 'Other' },
]
const AIRCRAFT_CATEGORIES = [
  { value: 'any', label: 'Any / Open' },
  { value: 'sel', label: 'Single-Engine Land' },
  { value: 'mel', label: 'Multi-Engine' },
  { value: 'turboprop', label: 'Turboprop' },
  { value: 'jet', label: 'Jet' },
]

// Plain-language guidance shown beside the Description field so the box isn't a
// blank-page barrier. Tips + two genuine example write-ups (a first-time buyer and
// an experienced IFR time-builder) — purely static content, no client state.
const DESCRIPTION_TIPS = [
  'Lead with who you are — your ratings, total hours, and how current you are.',
  'Say how you actually fly: typical missions, hours per month, day/night/IFR.',
  'Be clear on what you want — share size, budget, based airport, and timeline.',
  'Show you’ll be a good partner: how you treat aircraft, fund reserves, and communicate.',
]

const DESCRIPTION_EXAMPLES = [
  {
    label: 'First-time buyer',
    text:
      'Private pilot, 240 hours, recently instrument-rated and flying about 8 hours a month out of KAUS. Looking for a 1/3 or 1/4 share in a well-maintained IFR single (Cessna 182 or Cirrus SR20/22) for weekend trips around Texas and the occasional cross-country to see family. I’m meticulous about squawks and logbooks, happy to fund a healthy engine/maintenance reserve, and I prefer a scheduling app so everyone has fair access. Hoping to join in the next 1–2 months.',
  },
  {
    label: 'Experienced time-builder',
    text:
      'Commercial pilot, 1,400 hours, CFI/CFII building toward the airlines. Fly 15–20 hours a month and want a 1/2 share in a glass-panel SR22 or similar near KPAO for instrument currency and cross-country work. I keep aircraft hangared and spotless, pay reserves on time, and I’m an easy, communicative partner. Open to a leaseback structure if it works for the group. Ready to move quickly for the right airplane.',
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

export default function PostSeekerListingForm() {
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

  const { formRef, status, handleSubmit, handleResult } = useFormDraft('ch:draft:seeker-new')

  // Clear the saved draft on a successful post; restore it after a failed submit
  // (React resets the uncontrolled form once the action resolves).
  useEffect(() => {
    if (state) handleResult(Boolean(state.ok))
  }, [state, handleResult])

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, startGenerating] = useTransition()

  function handleGenerate() {
    setAiError(null)
    startGenerating(async () => {
      try {
        const result = await generateSeekerDraft(aiPrompt)
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

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-end">
        <DraftIndicator status={status} />
      </div>

      {/* Aircraft preferences */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Aircraft Preferences</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Preferred Makes</Label>
            <Input
              name="preferred_makes"
              placeholder="e.g. Cessna, Piper, Cirrus"
            />
            <p className="mt-1 text-xs text-slate-400">Comma-separated. Leave blank if open to any.</p>
          </div>
          <div>
            <Label>Preferred Models</Label>
            <Input
              name="preferred_models"
              placeholder="e.g. 172, 182, PA-28, SR22"
            />
            <p className="mt-1 text-xs text-slate-400">Free text — be as specific or broad as you like.</p>
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
      </section>

      {/* Budget */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Budget</SectionHeader>
        <p className="mb-4 text-xs text-slate-500">Setting a budget helps owners find compatible partners. Leave blank if flexible.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Max Buy-In</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <Input name="max_buy_in" type="number" placeholder="25000" className="pl-7" min={0} />
            </div>
          </div>
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
      </section>

      {/* Location */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Base Location</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Home Airport (ICAO)</Label>
            <Input
              name="home_airport"
              placeholder="e.g. KAUS"
              required
              maxLength={4}
              className="font-mono uppercase"
            />
            <p className="mt-1 text-xs text-slate-400">
              Just the 4-letter ICAO code — we&apos;ll fill in the airport name, city, and state from it.
            </p>
          </div>
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
      </section>

      {/* Pilot profile */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Your Pilot Profile</SectionHeader>
        <p className="mb-4 text-xs text-slate-500">Help owners know who they&apos;re talking to. This information is shown on your listing.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Total Flight Hours</Label>
            <Input name="total_hours" type="number" placeholder="e.g. 300" min={0} />
          </div>
          <div>
            <Label>Ratings &amp; Endorsements You Hold</Label>
            <Input
              name="ratings_held"
              placeholder="e.g. PPL, IFR, Complex"
            />
            <p className="mt-1 text-xs text-slate-400">Comma-separated</p>
          </div>
          <div>
            <Label>Estimated Hours per Month</Label>
            <Input name="hours_per_month" type="number" placeholder="e.g. 15" min={1} max={200} />
            <p className="mt-1 text-xs text-slate-400">How many hours you expect to fly</p>
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
          <p className="mt-1.5 text-xs text-slate-400">Select all that apply</p>
        </div>
      </section>

      {/* Partnership preferences */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Partnership Preferences</SectionHeader>
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
      </section>

      {/* Listing content */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Listing Details</SectionHeader>
        <div className="space-y-4">
          {/* AI draft generator */}
          <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-4">
            <p className="mb-2 text-xs font-semibold text-violet-800">Generate with AI ✨</p>
            <p className="mb-2 text-xs text-slate-500">Jot down a few sentences about yourself and what you&apos;re looking for — the AI will draft a title and description for you.</p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. IFR-rated, 450 hours, fly 10–12 hrs/month out of KPAO. Looking for a 1/4 share in an IFR single, prefer a Cessna 182 or Piper Archer. Budget around $20k buy-in, $400/mo fixed…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            {aiError && (
              <p className="mt-1.5 text-xs text-red-600">{aiError}</p>
            )}
            <button
              type="button"
              disabled={!aiPrompt.trim() || isGenerating}
              onClick={handleGenerate}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isGenerating ? 'Generating…' : 'Generate with AI ✨'}
            </button>
          </div>
          <div>
            <Label required>Title</Label>
            <Input
              name="title"
              placeholder="e.g. IFR pilot seeking 1/3 share near Austin (KAUS)"
              required
            />
            <p className="mt-1 text-xs text-slate-400">Be specific — include your location, ratings, and what you&apos;re looking for.</p>
          </div>
          <div>
            <Label>Description</Label>
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
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {ex.label}
                      </p>
                      <p className="mt-1 text-xs italic leading-relaxed text-slate-600">“{ex.text}”</p>
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
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Contact Information</SectionHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Your Name</Label>
            <Input name="contact_name" placeholder="e.g. Brian Ma" />
            <p className="mt-1 text-xs text-slate-400">Only your first name + last initial is shown publicly (e.g. Brian M.).</p>
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
        {pending ? 'Submitting…' : 'Post Seeking Listing'}
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
