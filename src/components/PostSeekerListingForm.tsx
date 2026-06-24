'use client'

import { useActionState } from 'react'
import { createSeekerListing } from '@/app/actions'
import { cn } from '@/lib/utils'

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

  return (
    <form action={action} className="space-y-8">
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
            <Label>Willing to Travel</Label>
            <Select name="willing_to_travel_nm">
              <option value="">Home airport only</option>
              <option value="25">Up to 25 nm</option>
              <option value="50">Up to 50 nm</option>
              <option value="100">Up to 100 nm</option>
              <option value="150">Up to 150 nm</option>
              <option value="200">Up to 200 nm</option>
            </Select>
            <p className="mt-1 text-xs text-slate-400">How far from your home airport you&apos;d commute</p>
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
