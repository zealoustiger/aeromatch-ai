'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getPlaceholderPhoto, isUsablePhoto } from '@/lib/aircraftPhotos'
import { cn } from '@/lib/utils'

/**
 * Photo gallery for listing detail pages. Renders `images[]` with a thumbnail
 * strip + full-screen lightbox (keyboard + click navigation). When there are no
 * real photos it shows the same make-based placeholder + "Not actual plane photo"
 * badge the listing cards use, so the empty state matches the rest of the app.
 */
export default function PhotoGallery({
  images,
  make,
  alt,
  imageIsPlaceholder,
}: {
  images: string[] | null
  make: string
  alt: string
  imageIsPlaceholder?: boolean | null
}) {
  const real = (images ?? []).filter(isUsablePhoto)
  const hasReal = real.length > 0
  const photos = hasReal ? real : [getPlaceholderPhoto(make)]
  const isPlaceholder = !hasReal || imageIsPlaceholder === true

  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + photos.length) % photos.length),
    [photos.length]
  )

  useEffect(() => {
    if (!lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, go])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Main image */}
      <button
        type="button"
        onClick={() => hasReal && setLightbox(true)}
        className={cn('relative block h-72 w-full sm:h-96', hasReal ? 'cursor-zoom-in' : 'cursor-default')}
        aria-label={hasReal ? 'Open full-size photo' : alt}
      >
        <Image src={photos[active]} alt={alt} fill className="object-cover" sizes="(max-width: 896px) 100vw, 896px" priority />
        {isPlaceholder && (
          <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
            Not actual plane photo
          </span>
        )}
        {hasReal && real.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white/90">
            {active + 1} / {real.length}
          </span>
        )}
      </button>

      {/* Thumbnails */}
      {hasReal && real.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {real.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition-all',
                i === active ? 'ring-sky-500' : 'ring-transparent hover:ring-slate-300'
              )}
              aria-label={`View photo ${i + 1}`}
            >
              <Image src={src} alt={`${alt} thumbnail ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && hasReal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {real.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1) }}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[active]} alt={alt} fill className="object-contain" sizes="100vw" />
          </div>

          {real.length > 1 && (
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {active + 1} / {real.length}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
