'use client'

import { useActionState } from 'react'
import { Info } from 'lucide-react'
import { createPartnership } from '@/app/actions'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

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

export default function PostPartnershipForm() {
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

  return (
    <form action={action} className="space-y-8">
      {/* Aircraft details */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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

      {/* Listing content — moved up so the headline + description (what pilots read
          first) come right after the aircraft, not at the very bottom of the form. */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader>Listing Details</SectionHeader>
        <div className="space-y-4">
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
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
        {pending ? 'Submitting…' : 'Post Partnership Listing'}
      </button>
    </form>
  )
}
