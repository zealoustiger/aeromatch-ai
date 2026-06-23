'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Shuffle, Loader2 } from 'lucide-react'
import AviatorAvatar, {
  type AviatorConfig,
  aviatorConfigFromSeed,
  randomAviatorConfig,
} from '@/components/AviatorAvatar'
import { saveAvatarConfig } from '@/app/actions'

const sameConfig = (a: AviatorConfig, b: AviatorConfig) =>
  a.bg === b.bg && a.skin === b.skin && a.cap === b.cap && a.scarf === b.scarf && a.lens === b.lens && a.expr === b.expr && a.goggles === b.goggles

// 12 deterministic starter options (seed + index) so server & client render the
// same grid (no hydration mismatch); "Shuffle" then swaps in fresh random ones.
function starterOptions(seed: string): AviatorConfig[] {
  return Array.from({ length: 12 }, (_, i) => aviatorConfigFromSeed(`${seed}:opt:${i}`))
}

export default function AvatarPicker({ seed, initial }: { seed: string; initial: AviatorConfig | null }) {
  const router = useRouter()
  const [current, setCurrent] = useState<AviatorConfig>(initial ?? aviatorConfigFromSeed(seed))
  const [options, setOptions] = useState<AviatorConfig[]>(() => starterOptions(seed))
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function choose(cfg: AviatorConfig) {
    setCurrent(cfg)
    setSaved(false)
    startTransition(async () => {
      const res = await saveAvatarConfig(cfg)
      if (res.ok) setSaved(true)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <AviatorAvatar config={current} size={72} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Your avatar</p>
          <p className="text-sm text-slate-500">
            {pending ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600"><Check className="h-3.5 w-3.5" /> Saved</span>
            ) : (
              'Pick one below — it shows on your listings and across ClubHanger.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOptions(Array.from({ length: 12 }, randomAviatorConfig))}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
        {options.map((cfg, i) => {
          const selected = sameConfig(cfg, current)
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(cfg)}
              aria-label={`Choose avatar ${i + 1}`}
              className={`relative rounded-full transition-transform hover:scale-105 ${selected ? 'ring-2 ring-sky-500 ring-offset-2' : ''}`}
            >
              <AviatorAvatar config={cfg} size={56} ring={false} />
              {selected && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white ring-2 ring-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
