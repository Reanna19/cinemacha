import type { MediaItem, MovieEntry, Profile } from './types'

const DB_NAME = 'cinemacha'
const DB_VERSION = 2

type StoreName = 'entries' | 'media' | 'meta'

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      // Drop legacy v1 film-hub stores if present.
      for (const name of [...db.objectStoreNames]) {
        db.deleteObjectStore(name)
      }
      db.createObjectStore('entries', { keyPath: 'id' })
      const media = db.createObjectStore('media', { keyPath: 'id' })
      media.createIndex('byEntry', 'entryId', { unique: false })
      db.createObjectStore('meta', { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function reqToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function waitForTransaction(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T> | T,
) {
  const db = await openDb()
  try {
    const tx = db.transaction(storeName, mode)
    const finished = waitForTransaction(tx)
    const result = await run(tx.objectStore(storeName))
    await finished
    return result
  } finally {
    db.close()
  }
}

export async function getAll<T>(storeName: StoreName) {
  return withStore(storeName, 'readonly', (store) => reqToPromise(store.getAll()) as Promise<T[]>)
}

export async function putRecord<T>(storeName: StoreName, value: T) {
  await withStore(storeName, 'readwrite', (store) => {
    store.put(value)
    return undefined
  })
}

export async function deleteRecord(storeName: StoreName, id: string) {
  await withStore(storeName, 'readwrite', (store) => {
    store.delete(id)
    return undefined
  })
}

export async function getMeta<T>(key: string) {
  const row = await withStore('meta', 'readonly', (store) => reqToPromise(store.get(key)))
  return (row as { key: string; value: T } | undefined)?.value
}

export async function setMeta<T>(key: string, value: T) {
  await putRecord('meta', { key, value })
}

export async function deleteMeta(key: string) {
  await deleteRecord('meta', key)
}

export async function loadArchive() {
  const [entries, media, profile, avatar] = await Promise.all([
    getAll<MovieEntry>('entries'),
    getAll<MediaItem>('media'),
    getMeta<Profile>('profile'),
    getMeta<Blob>('avatar'),
  ])
  return {
    entries,
    media,
    profile: profile ?? null,
    avatar: avatar instanceof Blob ? avatar : null,
  }
}

export async function replaceArchive(data: {
  profile: Profile | null
  entries: MovieEntry[]
  media: MediaItem[]
  avatar: Blob | null
}) {
  const db = await openDb()
  try {
    const tx = db.transaction(['entries', 'media', 'meta'], 'readwrite')
    const finished = waitForTransaction(tx)
    const entries = tx.objectStore('entries')
    const media = tx.objectStore('media')
    const meta = tx.objectStore('meta')
    entries.clear()
    media.clear()
    for (const entry of data.entries) entries.put(entry)
    for (const item of data.media) media.put(item)
    if (data.profile) meta.put({ key: 'profile', value: data.profile })
    else meta.delete('profile')
    if (data.avatar) meta.put({ key: 'avatar', value: data.avatar })
    else meta.delete('avatar')
    await finished
  } finally {
    db.close()
  }
}
