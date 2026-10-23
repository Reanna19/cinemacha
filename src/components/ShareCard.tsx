import { useEffect, useMemo, useRef, useState } from 'react'
import { BlobMedia } from '@/components/BlobMedia'
import { PopcornRating } from '@/components/PopcornRating'
import {
  captureSharePng,
  canSharePngFile,
  downloadPngFile,
  shareFilename,
  sharePngFile,
} from '@/lib/shareCard'
import { formatCompanion, formatHkDate, timesWatched } from '@/lib/ids'
import type { MediaItem, MovieEntry, Profile } from '@/lib/types'

export type ShareSelection = {
  poster: boolean
  place: boolean
  companion: boolean
  rating: boolean
  credits: boolean
}

const DEFAULT_SELECTION: ShareSelection = {
  poster: true,
  place: true,
  companion: true,
  rating: true,
  credits: false,
}

type Props = {
  entry: MovieEntry
  profile: Profile
  poster: MediaItem | undefined
}

export function ShareCard({ entry, profile, poster }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<ShareSelection>(DEFAULT_SELECTION)
  const [prepared, setPrepared] = useState<File | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const prepareGen = useRef(0)

  const planned = entry.status === 'to_watch'
  const place = [entry.city, entry.region, entry.country].filter(Boolean).join(' · ')
  const hasCredits = entry.directors.length > 0 || entry.actors.length > 0
  const hasPoster = Boolean(poster)
  const hasPlace = Boolean(place)
  const hasRating = !planned && entry.rating != null
  const filename = useMemo(() => shareFilename(entry.title), [entry.title])

  const selectionKey = useMemo(
    () =>
      JSON.stringify({
        selection,
        title: entry.title,
        date: entry.date,
        status: entry.status,
        rating: entry.rating,
        watchCount: entry.watchCount,
        place,
        companion: formatCompanion(entry),
        directors: entry.directors,
        actors: entry.actors,
        posterId: poster?.id ?? null,
        name: profile.name,
      }),
    [selection, entry, place, poster?.id, profile.name],
  )

  // Pre-generate PNG so share can stay within a user gesture when ready.
  useEffect(() => {
    const node = cardRef.current
    if (!node) return
    const gen = ++prepareGen.current
    setPrepared(null)
    setPreparing(true)
    let cancelled = false

    const run = async () => {
      try {
        const file = await captureSharePng(node, filename)
        if (cancelled || gen !== prepareGen.current) return
        setPrepared(file)
      } catch {
        if (!cancelled && gen === prepareGen.current) setPrepared(null)
      } finally {
        if (!cancelled && gen === prepareGen.current) setPreparing(false)
      }
    }

    const timer = window.setTimeout(() => void run(), 120)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [selectionKey, filename])

  const ensureFile = async () => {
    if (prepared) return prepared
    const node = cardRef.current
    if (!node) throw new Error('missing card')
    setPreparing(true)
    try {
      const file = await captureSharePng(node, filename)
      setPrepared(file)
      return file
    } finally {
      setPreparing(false)
    }
  }

  const onShare = async () => {
    if (busy) return
    // Prefer a pre-built file so share() stays close to the user gesture (esp. iOS).
    if (!prepared) {
      setNotice(
        preparing
          ? '圖片產生中，請稍候顯示「圖片已就緒」後再點分享。'
          : '圖片尚未就緒。請稍候或改用「下載圖片」。',
      )
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const file = prepared
      if (!canSharePngFile(file)) {
        setNotice('此瀏覽器不支援直接分享圖片檔，請改用「下載圖片」。')
        return
      }
      const result = await sharePngFile(file, {
        title: 'cinemacha',
        text: `${profile.name} 的電影日記 · ${entry.title}`,
      })
      if (result.kind === 'cancelled') {
        // Quiet return — no download, no error.
        return
      }
      if (!result.ok) {
        setNotice(result.message)
        return
      }
      setNotice(null)
    } catch {
      setNotice('分享未能完成，請改用「下載圖片」。')
    } finally {
      setBusy(false)
    }
  }

  const onDownload = async () => {
    if (busy) return
    setBusy(true)
    setNotice(null)
    try {
      const file = await ensureFile()
      const result = downloadPngFile(file)
      if (!result.ok) {
        setNotice(result.message)
        return
      }
      setNotice('已開始下載圖片。若未出現檔案，請檢查瀏覽器下載設定。（不會自動寫入相簿）')
    } catch {
      setNotice('產生圖片失敗，請稍後再試。')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (key: keyof ShareSelection) => {
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const locked = busy || preparing

  return (
    <section className="space-y-3">
      <div>
        <h2 className="display text-xl">分享卡片</h2>
        <p className="mt-1 text-xs text-mute">
          只會匯出你勾選的內容。觀影感想、票根與座位圖不會出現在分享圖。
        </p>
      </div>

      <div className="flex flex-wrap gap-2" data-share-ignore="true">
        {hasPoster && (
          <ToggleChip active={selection.poster} onClick={() => toggle('poster')} label="海報" />
        )}
        {hasPlace && (
          <ToggleChip active={selection.place} onClick={() => toggle('place')} label="地點" />
        )}
        <ToggleChip active={selection.companion} onClick={() => toggle('companion')} label="和誰看" />
        {hasRating && (
          <ToggleChip active={selection.rating} onClick={() => toggle('rating')} label="評分" />
        )}
        {hasCredits && (
          <ToggleChip active={selection.credits} onClick={() => toggle('credits')} label="導演／演員" />
        )}
      </div>

      {/* Preview — also the capture source */}
      <div className="overflow-hidden rounded-[1.35rem] border border-matcha/20 bg-foam/60 p-3">
        <div
          ref={cardRef}
          className="share-card mx-auto w-full max-w-[20rem] rounded-[1.25rem] bg-card px-5 py-5 text-ink shadow-sm"
          style={{
            fontFamily:
              '"PingFang HK", "PingFang TC", "Noto Sans TC", "Hiragino Sans GB", sans-serif',
          }}
        >
          <p
            className="text-[11px] tracking-[0.2em] text-matcha-deep"
            style={{
              fontFamily:
                '"Iowan Old Style", "Songti TC", "Noto Serif TC", "PMingLiU", serif',
            }}
          >
            cinemacha
          </p>
          <p className="mt-1 text-[11px] text-mute">{profile.name} 的電影日記</p>

          <div
            className={`mt-4 grid gap-3 ${
              selection.poster && hasPoster ? 'grid-cols-[1fr_4.75rem]' : 'grid-cols-1'
            }`}
          >
            <div className="min-w-0">
              <p
                className="text-[1.35rem] leading-snug text-ink"
                style={{
                  fontFamily:
                    '"Iowan Old Style", "Songti TC", "Noto Serif TC", "PMingLiU", serif',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {entry.title}
              </p>
              <p className="mt-1 text-xs text-mute">{formatHkDate(entry.date)}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] ${
                  planned ? 'bg-foam text-mute' : 'bg-matcha/15 text-matcha-deep'
                }`}
              >
                {planned ? '想看' : '已看'}
              </span>

              {selection.place && hasPlace && (
                <p className="mt-2 text-xs text-mute" style={{ overflowWrap: 'anywhere' }}>
                  地點 {place}
                </p>
              )}
              {selection.companion && (
                <p className="mt-1 text-xs text-mute" style={{ overflowWrap: 'anywhere' }}>
                  和誰看：{formatCompanion(entry)}
                </p>
              )}
              {selection.rating && hasRating && (
                <div className="mt-2">
                  <p className="mb-1 text-[11px] text-matcha-deep">
                    看過 {timesWatched(entry)} 次
                  </p>
                  <PopcornRating value={entry.rating} readOnly />
                </div>
              )}
              {selection.credits && hasCredits && (
                <div className="mt-2 space-y-0.5 text-[11px] text-mute">
                  {entry.directors.length > 0 && (
                    <p style={{ overflowWrap: 'anywhere' }}>
                      導演：{entry.directors.join('、')}
                    </p>
                  )}
                  {entry.actors.length > 0 && (
                    <p style={{ overflowWrap: 'anywhere' }}>演員：{entry.actors.join('、')}</p>
                  )}
                </div>
              )}
            </div>

            {selection.poster && poster && (
              <div className="overflow-hidden rounded-[0.85rem] bg-foam">
                <BlobMedia
                  blob={poster.blob}
                  mime={poster.mime}
                  alt=""
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-[10px] tracking-wide text-mute">電影日記 · 觀影隨筆</p>
        </div>
      </div>

      <p className="text-[11px] text-mute" data-share-ignore="true">
        {preparing && !busy
          ? '正在準備分享圖片…'
          : prepared
            ? '圖片已就緒，可分享或下載。'
            : '點下方按鈕時會產生圖片。'}
      </p>

      <div className="flex flex-wrap gap-2" data-share-ignore="true">
        <button
          type="button"
          className="cute-btn"
          disabled={locked}
          onClick={() => void onShare()}
        >
          {busy ? '產生圖片中…' : '分享圖片'}
        </button>
        <button
          type="button"
          className="cute-btn-quiet"
          disabled={locked}
          onClick={() => void onDownload()}
        >
          {busy ? '產生圖片中…' : '下載圖片'}
        </button>
      </div>

      {notice && (
        <p className="text-sm text-mocha" data-share-ignore="true" role="status">
          {notice}
        </p>
      )}
    </section>
  )
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs ${
        active ? 'bg-matcha text-cream' : 'bg-foam text-mute'
      }`}
    >
      {active ? '✓ ' : ''}
      {label}
    </button>
  )
}
