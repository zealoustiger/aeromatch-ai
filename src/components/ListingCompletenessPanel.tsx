import { CheckCircle, MinusCircle, Camera, Tag, Calendar, Hash, Gauge } from 'lucide-react'
import type { AircraftForSale } from '@/lib/types'
import { pickRealPhoto } from '@/lib/aircraftPhotos'

interface Signal {
  icon: React.ReactNode
  label: string
  present: boolean
  detail?: string
}

function computeSignals(p: AircraftForSale): Signal[] {
  const hasRealPhoto = pickRealPhoto(p.images) != null
  const hasSpecs = !!(p.make && p.model && p.year)
  const hasPrice = p.asking_price != null
  const hasRegistration = !!p.registration?.trim()
  const hasTotalTime = p.ttaf != null

  return [
    {
      icon: <Camera className="h-3.5 w-3.5" />,
      label: 'Real photos',
      present: hasRealPhoto,
      detail: hasRealPhoto ? undefined : 'No actual photos',
    },
    {
      icon: <Tag className="h-3.5 w-3.5" />,
      label: 'Asking price',
      present: hasPrice,
      detail: hasPrice ? undefined : 'Price not listed',
    },
    {
      icon: <Calendar className="h-3.5 w-3.5" />,
      label: 'Make, model & year',
      present: hasSpecs,
      detail: hasSpecs ? undefined : 'Incomplete specs',
    },
    {
      icon: <Hash className="h-3.5 w-3.5" />,
      label: 'Registration (N-number)',
      present: hasRegistration,
      detail: hasRegistration ? p.registration! : 'Not provided',
    },
    {
      icon: <Gauge className="h-3.5 w-3.5" />,
      label: 'Total airframe time',
      present: hasTotalTime,
      detail: hasTotalTime ? `${p.ttaf?.toLocaleString()} hrs` : 'Not listed',
    },
  ]
}

export default function ListingCompletenessPanel({ p }: { p: AircraftForSale }) {
  const signals = computeSignals(p)
  const presentCount = signals.filter((s) => s.present).length

  return (
    <div className="ch-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Listing info
        </h2>
        <span className="text-xs font-medium text-slate-400">
          {presentCount}/{signals.length}
        </span>
      </div>
      <ul className="space-y-2">
        {signals.map((s) => (
          <li key={s.label} className="flex items-start gap-2.5">
            {s.present ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
            )}
            <div className="min-w-0">
              <span
                className={`text-xs font-medium ${s.present ? 'text-slate-700' : 'text-slate-400'}`}
              >
                {s.label}
              </span>
              {s.detail && s.present && (
                <p className="truncate font-mono text-[10px] text-slate-400">{s.detail}</p>
              )}
              {s.detail && !s.present && (
                <p className="text-[10px] text-slate-300">{s.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
