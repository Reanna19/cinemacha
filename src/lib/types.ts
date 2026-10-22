export type WatchStatus = 'watched' | 'to_watch'

/** Who you watched with */
export type CompanionKind = 'solo' | 'family' | 'partner'

/** poster = 電影海報; ticket = 票根; memory = 回憶; floorplan = 座位平面圖 */
export type MediaKind = 'poster' | 'ticket' | 'memory' | 'floorplan'

export interface Profile {
  name: string
  /** @deprecated emoji character; avatar image is preferred */
  characterId?: string
  createdAt: string
  updatedAt: string
}

export interface MovieEntry {
  id: string
  title: string
  status: WatchStatus
  /** ISO date YYYY-MM-DD */
  date: string
  /** How many times watched; 0 when still to-watch */
  watchCount: number
  rating: number | null
  thoughts: string
  companionKind: CompanionKind
  /** Optional name(s), e.g. partner or family member */
  companionName: string
  country: string
  region: string
  city: string
  directors: string[]
  actors: string[]
  seatLabel: string
  /** 0–1 relative to floor-plan image; null = unset */
  seatX: number | null
  seatY: number | null
  createdAt: string
  updatedAt: string
}

export interface MediaItem {
  id: string
  entryId: string
  kind: MediaKind
  filename: string
  mime: string
  byteLength: number
  createdAt: string
  blob: Blob
}

export interface BackupManifest {
  app: 'cinemacha'
  format: 2
  exportedAt: string
  profile: Profile | null
  entries: MovieEntry[]
  media: Array<{
    id: string
    entryId: string
    kind: MediaKind
    filename: string
    mime: string
    byteLength: number
    createdAt: string
  }>
}
