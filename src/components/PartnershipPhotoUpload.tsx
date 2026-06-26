'use client'

import { useCallback, useRef, useState } from 'react'
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_PHOTOS = 5
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/avif'
const ACCEPT_EXT = '.jpg,.jpeg,.png,.webp,.avif'

type PhotoEntry = {
  key: string     // stable client key
  url: string     // public storage URL (empty while uploading)
  preview: string // object URL for local preview
  uploading: boolean
  error: string | null
}

export default function PartnershipPhotoUpload() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canAddMore = photos.length < MAX_PHOTOS

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_PHOTOS - photos.length)
    if (!arr.length) return

    const newEntries: PhotoEntry[] = arr.map((f) => ({
      key: `${Date.now()}-${f.name}`,
      url: '',
      preview: URL.createObjectURL(f),
      uploading: true,
      error: null,
    }))
    setPhotos((prev) => [...prev, ...newEntries])

    // Upload each file concurrently
    await Promise.all(
      arr.map(async (file, i) => {
        const entry = newEntries[i]
        try {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/upload-partnership-photo', { method: 'POST', body: fd })
          const json = await res.json()
          if (!res.ok || !json.url) {
            setPhotos((prev) =>
              prev.map((p) =>
                p.key === entry.key
                  ? { ...p, uploading: false, error: json.error ?? 'Upload failed' }
                  : p
              )
            )
          } else {
            setPhotos((prev) =>
              prev.map((p) =>
                p.key === entry.key ? { ...p, url: json.url, uploading: false } : p
              )
            )
          }
        } catch {
          setPhotos((prev) =>
            prev.map((p) =>
              p.key === entry.key ? { ...p, uploading: false, error: 'Upload failed' } : p
            )
          )
        }
      })
    )
  }, [photos.length])

  const removePhoto = (key: string) => {
    setPhotos((prev) => {
      const entry = prev.find((p) => p.key === key)
      if (entry) URL.revokeObjectURL(entry.preview)
      return prev.filter((p) => p.key !== key)
    })
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const successPhotos = photos.filter((p) => p.url)

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div
              key={p.key}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            >
              <img
                src={p.preview}
                alt=""
                className={cn('h-full w-full object-cover', p.uploading && 'opacity-50')}
              />
              {p.uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                </div>
              )}
              {p.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 p-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="mt-0.5 text-center text-[9px] leading-tight text-red-700">{p.error}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(p.key)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Add-more tile */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-sky-400 hover:text-sky-500"
              aria-label="Add another photo"
            >
              <ImagePlus className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {/* Drop zone — only shown when no photos yet */}
      {photos.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
            dragOver
              ? 'border-sky-400 bg-sky-50/60'
              : 'border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/40'
          )}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <ImagePlus className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            Drag photos here, or <span className="text-sky-600 underline">browse</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            JPEG, PNG, or WebP · max 5 MB each · up to {MAX_PHOTOS} photos
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED + ',' + ACCEPT_EXT}
        multiple
        className="sr-only"
        onChange={onInputChange}
        aria-label="Upload partnership photos"
      />

      {/* Hidden inputs carrying the uploaded URLs to the form action */}
      {successPhotos.map((p) => (
        <input key={p.key} type="hidden" name="photo_url" value={p.url} />
      ))}

      {photos.length > 0 && (
        <p className="text-xs text-slate-400">
          {successPhotos.length}/{photos.length} uploaded
          {photos.length < MAX_PHOTOS && ` · up to ${MAX_PHOTOS} photos`}
        </p>
      )}
    </div>
  )
}
