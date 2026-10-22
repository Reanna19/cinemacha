import { create } from 'zustand'
import { exportArchiveZip, importArchiveZip } from '@/lib/backup'
import {
  deleteMeta,
  deleteRecord,
  loadArchive,
  putRecord,
  replaceArchive,
  setMeta,
} from '@/lib/idb'
import { archiveTicketImage, assertVideoOk } from '@/lib/image'
import { newId, normalizeCompanionKind, normalizeMediaKind } from '@/lib/ids'
import type { MediaItem, MediaKind, MovieEntry, Profile } from '@/lib/types'

interface AppState {
  ready: boolean
  error: string | null
  profile: Profile | null
  avatar: Blob | null
  entries: MovieEntry[]
  media: MediaItem[]
  hydrate: () => Promise<void>
  saveProfile: (profile: Profile) => Promise<void>
  setAvatar: (file: File) => Promise<void>
  clearAvatar: () => Promise<void>
  saveEntry: (entry: MovieEntry) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  addMedia: (entryId: string, file: File, kind: MediaKind) => Promise<void>
  removeMedia: (id: string) => Promise<void>
  exportBackup: () => Promise<void>
  importBackup: (file: File) => Promise<void>
  clearAll: () => Promise<void>
}

function sortEntries(list: MovieEntry[]) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  error: null,
  profile: null,
  avatar: null,
  entries: [],
  media: [],

  hydrate: async () => {
    try {
      const data = await loadArchive()
      set({
        ready: true,
        error: null,
        profile: data.profile,
        avatar: data.avatar,
        entries: sortEntries(data.entries),
        media: data.media.map((item) => ({
          ...item,
          kind: normalizeMediaKind(item.kind),
        })),
      })
    } catch (error) {
      set({
        ready: true,
        error: error instanceof Error ? error.message : '無法讀取資料',
      })
    }
  },

  saveProfile: async (profile) => {
    const next: Profile = {
      name: profile.name.trim(),
      createdAt: profile.createdAt,
      updatedAt: new Date().toISOString(),
    }
    await setMeta('profile', next)
    set({ profile: next })
  },

  setAvatar: async (file) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('頭像請選擇相片檔案。')
    }
    const blob = await archiveTicketImage(file)
    await setMeta('avatar', blob)
    set({ avatar: blob })
  },

  clearAvatar: async () => {
    await deleteMeta('avatar')
    set({ avatar: null })
  },

  saveEntry: async (entry) => {
    const rawCount = Number.isFinite(entry.watchCount) ? Math.floor(entry.watchCount) : 1
    const next: MovieEntry = {
      ...entry,
      rating: entry.status === 'to_watch' ? null : entry.rating,
      watchCount: entry.status === 'to_watch' ? 0 : Math.max(1, rawCount),
      companionKind: normalizeCompanionKind(entry.companionKind),
      companionName: entry.companionName?.trim() ?? '',
      title: entry.title.trim(),
      updatedAt: new Date().toISOString(),
    }
    await putRecord('entries', next)
    set({
      entries: sortEntries([
        ...get().entries.filter((item) => item.id !== next.id),
        next,
      ]),
    })
  },

  removeEntry: async (id) => {
    const media = get().media.filter((item) => item.entryId === id)
    for (const item of media) await deleteRecord('media', item.id)
    await deleteRecord('entries', id)
    set({
      entries: get().entries.filter((item) => item.id !== id),
      media: get().media.filter((item) => item.entryId !== id),
    })
  },

  addMedia: async (entryId, file, kind) => {
    let blob: Blob
    let filename = file.name

    if (kind === 'memory') {
      if (file.type.startsWith('video/')) {
        assertVideoOk(file)
        blob = file
      } else if (file.type.startsWith('image/')) {
        blob = await archiveTicketImage(file)
        filename = file.name.replace(/\.[^.]+$/, '') + '.jpg'
      } else {
        throw new Error('回憶請選擇相片或影片。')
      }
    } else {
      const label =
        kind === 'poster' ? '海報' : kind === 'ticket' ? '票根' : '平面圖'
      if (!file.type.startsWith('image/')) {
        throw new Error(`${label}請選擇相片檔案。`)
      }
      blob = await archiveTicketImage(file)
      filename = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    }

    const item: MediaItem = {
      id: newId(),
      entryId,
      kind,
      filename,
      mime: blob.type || file.type || 'application/octet-stream',
      byteLength: blob.size,
      createdAt: new Date().toISOString(),
      blob,
    }
    if (kind === 'floorplan' || kind === 'poster') {
      const old = get().media.filter((m) => m.entryId === entryId && m.kind === kind)
      for (const prev of old) await deleteRecord('media', prev.id)
      set({
        media: [...get().media.filter((m) => !(m.entryId === entryId && m.kind === kind)), item],
      })
    } else {
      set({ media: [...get().media, item] })
    }
    await putRecord('media', item)
  },

  removeMedia: async (id) => {
    await deleteRecord('media', id)
    set({ media: get().media.filter((item) => item.id !== id) })
  },

  exportBackup: async () => {
    await exportArchiveZip()
  },

  importBackup: async (file) => {
    await importArchiveZip(file)
    await get().hydrate()
  },

  clearAll: async () => {
    await replaceArchive({ profile: null, entries: [], media: [], avatar: null })
    set({ profile: null, avatar: null, entries: [], media: [] })
  },
}))
