// Best-effort IndexedDB store for a photo file that's still mid-upload when a
// reload or in-app navigation interrupts it — so it can be resumed on return,
// the same way an already-uploaded photo URL or a text draft already survives.
// Every operation degrades silently to a no-op if IndexedDB is unavailable or
// throws; callers should treat this purely as an enhancement, never a dependency.

const DB_NAME = 'ch-photo-drafts'
const STORE_NAME = 'pending'
const DB_VERSION = 1

type PendingRecord = {
  id: string
  draftKey: string
  entryKey: string
  file: File
}

function idKey(draftKey: string, entryKey: string) {
  return `${draftKey}::${entryKey}`
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

export async function savePendingPhoto(draftKey: string, entryKey: string, file: File): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const record: PendingRecord = { id: idKey(draftKey, entryKey), draftKey, entryKey, file }
      tx.objectStore(STORE_NAME).put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* best-effort — an in-flight upload that can't be persisted just behaves as before */
  }
}

export async function deletePendingPhoto(draftKey: string, entryKey: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(idKey(draftKey, entryKey))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* ignore */
  }
}

export async function listPendingPhotos(draftKey: string): Promise<Array<{ entryKey: string; file: File }>> {
  try {
    const db = await openDb()
    const all = await new Promise<PendingRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve((req.result as PendingRecord[]) ?? [])
      req.onerror = () => reject(req.error)
    })
    db.close()
    return all.filter((r) => r.draftKey === draftKey).map((r) => ({ entryKey: r.entryKey, file: r.file }))
  } catch {
    return []
  }
}

export async function clearPendingPhotos(draftKey: string): Promise<void> {
  const entries = await listPendingPhotos(draftKey)
  await Promise.all(entries.map((e) => deletePendingPhoto(draftKey, e.entryKey)))
}
