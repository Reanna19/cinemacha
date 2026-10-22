import type { CompanionKind } from './types'

export function newId() {
  return crypto.randomUUID()
}

export function todayIsoDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function formatHkDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return `${year}年${month}月${day}日`
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function splitList(raw: string) {
  return raw
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

/** Back-compat for entries saved before watchCount existed. */
export function timesWatched(entry: { status: string; watchCount?: number }) {
  if (entry.status === 'to_watch') return 0
  const count = entry.watchCount
  if (typeof count === 'number' && Number.isFinite(count) && count >= 1) return Math.floor(count)
  return 1
}

/** Map legacy image/video kinds onto current media kinds. */
export function normalizeMediaKind(kind: string): 'poster' | 'ticket' | 'memory' | 'floorplan' {
  if (kind === 'poster' || kind === 'ticket' || kind === 'floorplan' || kind === 'memory') return kind
  if (kind === 'video' || kind === 'image') return 'memory'
  return 'memory'
}

export const COMPANION_OPTIONS: Array<{ id: CompanionKind; label: string }> = [
  { id: 'solo', label: '自己' },
  { id: 'family', label: '家人' },
  { id: 'partner', label: '男朋友／女朋友' },
]

export function normalizeCompanionKind(kind: string | undefined): CompanionKind {
  if (kind === 'solo' || kind === 'family' || kind === 'partner') return kind
  return 'solo'
}

export function formatCompanion(entry: {
  companionKind?: CompanionKind | string
  companionName?: string
}) {
  const kind = normalizeCompanionKind(entry.companionKind)
  const label = COMPANION_OPTIONS.find((item) => item.id === kind)?.label ?? '自己'
  const name = entry.companionName?.trim()
  if (kind === 'solo') return name ? `自己 · ${name}` : '自己'
  return name ? `${label} · ${name}` : label
}
