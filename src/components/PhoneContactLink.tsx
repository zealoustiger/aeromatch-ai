'use client'

import { useState } from 'react'
import AlertSignup from './AlertSignup'

/**
 * The "Or call / text: {phone}" line on a user-posted aircraft listing. Clicking
 * a tel: link doesn't navigate the page away, so once clicked we treat it as the
 * same "just proved buyer intent" moment a sent message is, and reveal the alert
 * cross-sell inline underneath.
 */
export default function PhoneContactLink({
  phone,
  alertContext,
  alertSourcePath,
  alertCount,
}: {
  phone: string
  alertContext?: string
  alertSourcePath: string
  alertCount?: number
}) {
  const [clicked, setClicked] = useState(false)

  return (
    <>
      <p className="mt-3 text-sm text-slate-500">
        Or call / text:{' '}
        <a
          href={`tel:${phone}`}
          onClick={() => setClicked(true)}
          className="font-medium text-slate-700 hover:text-sky-700"
        >
          {phone}
        </a>
      </p>
      {clicked && (
        <div className="mt-3">
          <AlertSignup
            context={alertContext}
            source="post_contact"
            sourcePath={alertSourcePath}
            noun="aircraft"
            alertCount={alertCount}
            className="my-0"
          />
        </div>
      )}
    </>
  )
}
