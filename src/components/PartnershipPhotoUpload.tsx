'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, X, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { savePendingPhoto, deletePendingPhoto, listPendingPhotos, clearPendingPhotos } from '@/lib/idbPhotoDraft'

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

export default function PartnershipPhotoUpload({
  endpoint = '/api/upload-partnership-photo',
  persistKey,
  restoreGateKey,
  initialPhotos,
  isLoggedIn = true,
  onRequireAuth,
}: {
  endpoint?: string
  // When set, mirror the successfully-uploaded photo URLs to localStorage[persistKey]
  // so they survive a reload or the deferred-auth redirect (the URLs are already in
  // storage before submit — only the references need to persist). Restored on mount.
  persistKey?: string
  // Only restore persisted photos when localStorage[restoreGateKey] exists (the form's
  // text-draft key). Ties photo lifetime to the draft's: photos come back exactly when
  // the draft does, and are dropped (no stale photos) once the draft is gone — e.g.
  // after a successful publish clears it.
  restoreGateKey?: string
  // Seed existing photos (edit flows) rather than a blank uploader. Ignored once the
  // localStorage-draft restore effect below runs, so callers that pass this shouldn't
  // also pass a persistKey/restoreGateKey pair that could restore a stale create-draft.
  initialPhotos?: string[]
  // The upload endpoints require a session — when logged out, addFiles() skips the
  // doomed network call and calls onRequireAuth() instead, so a dropped/pasted photo
  // gets the same save-draft-and-redirect treatment as a deferred-auth submit, rather
  // than a cryptic per-thumbnail "Not authenticated" error.
  isLoggedIn?: boolean
  onRequireAuth?: () => void
}) {
  const [photos, setPhotos] = useState<PhotoEntry[]>(() =>
    (initialPhotos ?? []).slice(0, MAX_PHOTOS).map((url, i) => ({
      key: `initial-${i}-${url}`,
      url,
      preview: url,
      uploading: false,
      error: null,
    }))
  )
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Shared upload path for both a freshly-added file and one recovered from
  // IndexedDB after an interrupted upload — either way, the pending record is
  // dropped once the request settles (success or failure).
  const uploadEntry = useCallback(
    async (key: string, file: File) => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(endpoint, { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok || !json.url) {
          setPhotos((prev) =>
            prev.map((p) => (p.key === key ? { ...p, uploading: false, error: json.error ?? 'Upload failed' } : p))
          )
        } else {
          setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, url: json.url, uploading: false } : p)))
        }
      } catch {
        setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, uploading: false, error: 'Upload failed' } : p)))
      } finally {
        if (persistKey) deletePendingPhoto(persistKey, key)
      }
    },
    [endpoint, persistKey]
  )

  // Restore persisted photos on mount, gated on the draft key (see prop docs).
  useEffect(() => {
    if (!persistKey) return
    let cancelled = false
    try {
      const draftPresent = restoreGateKey ? !!window.localStorage.getItem(restoreGateKey) : true
      if (!draftPresent) {
        window.localStorage.removeItem(persistKey)
        clearPendingPhotos(persistKey)
        return
      }
      const raw = window.localStorage.getItem(persistKey)
      if (raw) {
        const urls = JSON.parse(raw) as unknown
        if (Array.isArray(urls)) {
          const restored: PhotoEntry[] = urls
            .filter((u): u is string => typeof u === 'string' && u.length > 0)
            .slice(0, MAX_PHOTOS)
            .map((url, i) => ({ key: `restored-${i}-${url}`, url, preview: url, uploading: false, error: null }))
          if (restored.length) setPhotos(restored)
        }
      }
      // A photo that was still mid-upload (in-flight request, only an in-memory
      // File) when the tab reloaded or navigated away never made it into the
      // persisted URL list above. Resume any such leftover file automatically.
      listPendingPhotos(persistKey).then((pending) => {
        if (cancelled || !pending.length) return
        setPhotos((prev) => {
          const room = MAX_PHOTOS - prev.length
          if (room <= 0) return prev
          const toRestore = pending.slice(0, room)
          const restoredEntries: PhotoEntry[] = toRestore.map(({ entryKey, file }) => ({
            key: entryKey,
            url: '',
            preview: URL.createObjectURL(file),
            uploading: true,
            error: null,
          }))
          toRestore.forEach(({ entryKey, file }) => uploadEntry(entryKey, file))
          return [...prev, ...restoredEntries]
        })
      })
    } catch {
      /* corrupt/unavailable storage — start clean */
    }
    return () => {
      cancelled = true
    }
    // Run once on mount; persistKey/restoreGateKey/uploadEntry are stable per form instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirror the current set of successfully-uploaded URLs to storage as they change.
  useEffect(() => {
    if (!persistKey) return
    try {
      const urls = photos.filter((p) => p.url && !p.uploading && !p.error).map((p) => p.url)
      if (urls.length) window.localStorage.setItem(persistKey, JSON.stringify(urls))
      else window.localStorage.removeItem(persistKey)
    } catch {
      /* storage unavailable/full — best effort */
    }
  }, [photos, persistKey])

  const canAddMore = photos.length < MAX_PHOTOS

  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (!isLoggedIn) {
      onRequireAuth?.()
      return
    }

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

    // Persist the raw file so it can resume if a reload/navigation interrupts
    // the upload below (see the mount-time recovery effect above).
    if (persistKey) {
      newEntries.forEach((entry, i) => savePendingPhoto(persistKey, entry.key, arr[i]))
    }

    // Upload each file concurrently
    await Promise.all(arr.map((file, i) => uploadEntry(newEntries[i].key, file)))
  }, [photos.length, isLoggedIn, onRequireAuth, persistKey, uploadEntry])

  const removePhoto = (key: string) => {
    setPhotos((prev) => {
      const entry = prev.find((p) => p.key === key)
      if (entry) URL.revokeObjectURL(entry.preview)
      return prev.filter((p) => p.key !== key)
    })
  }

  // Swaps a thumbnail with its left/right neighbor. Array order is the existing cover
  // mechanism (pickRealPhoto picks the first usable image), so reordering here is all
  // that's needed to change the cover photo — no schema/action change.
  const movePhoto = (key: string, direction: 'left' | 'right') => {
    setPhotos((prev) => {
      const i = prev.findIndex((p) => p.key === key)
      const j = direction === 'left' ? i - 1 : i + 1
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (canAddMore) setDragOver(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    // Only clear when the pointer truly leaves the component, not when it moves
    // between child thumbnails (which would otherwise flicker the highlight).
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  // Paste an image from the clipboard anywhere on the page — except while typing in
  // a text field (so it never hijacks the "Prefill from your notes" textarea or any
  // other input). Adds any image files the clipboard carries, respecting MAX_PHOTOS.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const ae = document.activeElement as HTMLElement | null
      const tag = ae?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae?.isContentEditable) return
      const files = e.clipboardData?.files
      if (!files?.length) return
      const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (images.length) {
        e.preventDefault()
        addFiles(images)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [addFiles])

  const successPhotos = photos.filter((p) => p.url)

  // Opens the file picker when logged in; otherwise routes straight to the same
  // save-draft-and-redirect path a deferred-auth submit uses (see addFiles above).
  const openPicker = () => {
    if (!isLoggedIn) {
      onRequireAuth?.()
      return
    }
    inputRef.current?.click()
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'space-y-3 rounded-xl transition',
        // Show a drop-highlight ring once photos exist (the empty state has its own
        // big dashed zone); keeps drag-drop discoverable for adding more photos.
        dragOver && photos.length > 0 && 'ring-2 ring-sky-300 ring-offset-2'
      )}
    >
      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
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
              {photos.length > 1 && i === 0 && (
                <span className="absolute left-0.5 top-0.5 rounded bg-slate-900/70 px-1 py-0.5 text-[9px] font-medium leading-none text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(p.key)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
              {photos.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-gradient-to-t from-slate-900/70 to-transparent pb-0.5 pt-2.5">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(p.key, 'left')}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
                      aria-label="Move photo earlier"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                  )}
                  {i < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(p.key, 'right')}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
                      aria-label="Move photo later"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add-more tile */}
          {canAddMore && (
            <button
              type="button"
              onClick={openPicker}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-sky-400 hover:text-sky-500"
              aria-label={isLoggedIn ? 'Add another photo' : 'Sign in to add another photo'}
            >
              <ImagePlus className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {/* Drop zone — only shown when no photos yet. Drag/drop for the with-photos
          state is handled by the outer container (see onDragOver/onDrop above). */}
      {photos.length === 0 && (
        <div
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
            dragOver
              ? 'border-sky-400 bg-sky-50/60'
              : 'border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/40'
          )}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openPicker()}
        >
          <ImagePlus className="mb-2 h-8 w-8 text-slate-300" />
          {isLoggedIn ? (
            <>
              <p className="text-sm font-medium text-slate-600">
                Drag or paste photos here, or <span className="text-sky-600 underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                JPEG, PNG, or WebP · max 5 MB each · up to {MAX_PHOTOS} photos
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-600">
                <span className="text-sky-600 underline">Sign in</span> to add photos
              </p>
              <p className="mt-1 text-xs text-slate-400">
                We&rsquo;ll save your draft and bring you right back
              </p>
            </>
          )}
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
          {canAddMore && ` · drag, paste, or tap + to add more (up to ${MAX_PHOTOS})`}
        </p>
      )}
    </div>
  )
}
