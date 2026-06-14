'use client'

import { Mail, Phone, ExternalLink } from 'lucide-react'
import { track } from '@/lib/analytics'
import { isContactableEmail } from '@/lib/utils'

export default function ContactButtons({
  listingId,
  title,
  contactEmail,
  contactPhone,
  contactMethod,
  sourceUrl,
}: {
  listingId: string
  title: string
  contactEmail: string
  contactPhone: string | null
  contactMethod: string
  sourceUrl?: string | null
}) {
  const showEmail = (contactMethod === 'email' || contactMethod === 'both') && isContactableEmail(contactEmail)
  const showPhone = (contactMethod === 'phone' || contactMethod === 'both') && !!contactPhone
  // Fallback only when there's no usable on-platform contact (e.g. captured listings).
  const showSourceFallback = !showEmail && !showPhone && !!sourceUrl

  return (
    <div className="space-y-2">
      {showEmail && (
        <a
          href={`mailto:${contactEmail}?subject=Re: ${encodeURIComponent(title)}`}
          onClick={() => track('contact_initiated', { listing_id: listingId, method: 'email' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          <Mail className="h-4 w-4" /> Send Email
        </a>
      )}
      {showPhone && (
        <a
          href={`tel:${contactPhone}`}
          onClick={() => track('contact_initiated', { listing_id: listingId, method: 'phone' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
        >
          <Phone className="h-4 w-4" /> {contactPhone}
        </a>
      )}
      {showSourceFallback && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('source_link_clicked', { listing_id: listingId, source_url: sourceUrl })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
        >
          <ExternalLink className="h-4 w-4" /> View original listing
        </a>
      )}
    </div>
  )
}
