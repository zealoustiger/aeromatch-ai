'use client'

import { Mail, Phone } from 'lucide-react'
import { track } from '@/lib/analytics'

export default function ContactButtons({
  listingId,
  title,
  contactEmail,
  contactPhone,
  contactMethod,
}: {
  listingId: string
  title: string
  contactEmail: string
  contactPhone: string | null
  contactMethod: string
}) {
  return (
    <div className="space-y-2">
      {(contactMethod === 'email' || contactMethod === 'both') && (
        <a
          href={`mailto:${contactEmail}?subject=Re: ${encodeURIComponent(title)}`}
          onClick={() => track('contact_initiated', { listing_id: listingId, method: 'email' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          <Mail className="h-4 w-4" /> Send Email
        </a>
      )}
      {(contactMethod === 'phone' || contactMethod === 'both') && contactPhone && (
        <a
          href={`tel:${contactPhone}`}
          onClick={() => track('contact_initiated', { listing_id: listingId, method: 'phone' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
        >
          <Phone className="h-4 w-4" /> {contactPhone}
        </a>
      )}
    </div>
  )
}
