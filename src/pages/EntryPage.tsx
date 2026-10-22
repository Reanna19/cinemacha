import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BlobMedia } from '@/components/BlobMedia'
import { PopcornRating } from '@/components/PopcornRating'
import { SeatCanvas } from '@/components/SeatCanvas'
import { formatBytes, formatCompanion, formatHkDate, timesWatched } from '@/lib/ids'
import { useApp } from '@/store/app'

export function EntryPage() {
  const { entryId = '' } = useParams()
  const navigate = useNavigate()
  const profile = useApp((s) => s.profile)
  const avatar = useApp((s) => s.avatar)
  const entries = useApp((s) => s.entries)
  const media = useApp((s) => s.media)
  const addMedia = useApp((s) => s.addMedia)
  const removeMedia = useApp((s) => s.removeMedia)
  const removeEntry = useApp((s) => s.removeEntry)
  const saveEntry = useApp((s) => s.saveEntry)
  const [error, setError] = useState<string | null>(null)
  const entry = entries.find((item) => item.id === entryId)

  if (!entry) return <Navigate to="/" replace />
  if (!profile) return <Navigate to="/onboarding" replace />

  const poster = media.find((item) => item.entryId === entry.id && item.kind === 'poster')
  const tickets = media.filter((item) => item.entryId === entry.id && item.kind === 'ticket')
  const memories = media.filter((item) => item.entryId === entry.id && item.kind === 'memory')
  const floorplan = media.find((item) => item.entryId === entry.id && item.kind === 'floorplan')
  const place = [entry.city, entry.region, entry.country].filter(Boolean).join(' · ')
  const planned = entry.status === 'to_watch'

  const upload = async (
    file: File | undefined,
    kind: 'poster' | 'ticket' | 'memory' | 'floorplan',
  ) => {
    if (!file) return
    setError(null)
    try {
      await addMedia(entry.id, file, kind)
      if (kind === 'floorplan') {
        await saveEntry({ ...entry, seatX: null, seatY: null })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上傳失敗')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.24em] text-matcha">{planned ? '想看' : '已看'}</p>
        <h1 className="display mt-1 text-3xl">{entry.title}</h1>
        <p className="text-sm text-mute">{formatHkDate(entry.date)}</p>
        {place && <p className="mt-1 text-sm">地點：{place}</p>}
        <p className="mt-1 text-sm">和誰看：{formatCompanion(entry)}</p>
      </div>

      {planned ? (
        <p className="rounded-2xl bg-foam px-4 py-3 text-sm text-mute">想看清單暫不評分、不計觀看次數。</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-matcha-deep">看過 {timesWatched(entry)} 次</p>
          <PopcornRating value={entry.rating} readOnly />
        </div>
      )}

      {(entry.directors.length > 0 || entry.actors.length > 0) && (
        <div className="bubble rounded-[1.2rem] px-4 py-3 text-sm">
          {entry.directors.length > 0 && <p>導演：{entry.directors.join('、')}</p>}
          {entry.actors.length > 0 && <p className="mt-1">演員：{entry.actors.join('、')}</p>}
        </div>
      )}

      {entry.thoughts && (
        <article className="bubble whitespace-pre-wrap rounded-[1.3rem] px-5 py-4 text-sm">
          {entry.thoughts}
        </article>
      )}

      {error && <p className="text-sm text-mocha">{error}</p>}

      <section className="space-y-3">
        <h2 className="display text-xl">電影海報</h2>
        <p className="text-xs text-mute">上傳後會顯示於主頁卡片右側。</p>
        {poster ? (
          <figure className="overflow-hidden rounded-[1.1rem] bg-foam">
            <BlobMedia
              blob={poster.blob}
              mime={poster.mime}
              alt="電影海報"
              className="mx-auto aspect-[2/3] w-40 object-cover"
            />
            <figcaption className="flex items-center justify-between px-3 py-2 text-[11px] text-mute">
              <span>海報 · {formatBytes(poster.byteLength)}</span>
              <button type="button" onClick={() => void removeMedia(poster.id)}>
                刪除
              </button>
            </figcaption>
          </figure>
        ) : (
          <p className="text-sm text-mute">尚未上傳海報</p>
        )}
        <label className="cute-btn-quiet cursor-pointer">
          {poster ? '更換海報' : '上傳海報'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void upload(file, 'poster')
            }}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl">1. 票根</h2>
        <p className="text-xs text-mute">紙本票根或電子票截圖，僅支援相片。</p>
        {tickets.length === 0 ? (
          <p className="text-sm text-mute">尚未上傳票根</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tickets.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-[1.1rem] bg-foam">
                <BlobMedia
                  blob={item.blob}
                  mime={item.mime}
                  alt={item.filename}
                  className="aspect-[3/4] w-full object-cover"
                />
                <figcaption className="flex items-center justify-between px-2 py-2 text-[11px] text-mute">
                  <span>票根 · {formatBytes(item.byteLength)}</span>
                  <button type="button" onClick={() => void removeMedia(item.id)}>
                    刪除
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <label className="cute-btn-quiet cursor-pointer">
          上傳票根
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void upload(file, 'ticket')
            }}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl">2. 回憶</h2>
        <p className="text-xs text-mute">戲院合照、散場短片等，可上傳相片或影片。</p>
        {memories.length === 0 ? (
          <p className="text-sm text-mute">尚未上傳回憶</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {memories.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-[1.1rem] bg-foam">
                <BlobMedia
                  blob={item.blob}
                  mime={item.mime}
                  alt={item.filename}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="flex items-center justify-between px-2 py-2 text-[11px] text-mute">
                  <span>
                    {item.mime.startsWith('video/') ? '影片' : '相片'} · {formatBytes(item.byteLength)}
                  </span>
                  <button type="button" onClick={() => void removeMedia(item.id)}>
                    刪除
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="cute-btn-quiet cursor-pointer">
            上傳相片
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                void upload(file, 'memory')
              }}
            />
          </label>
          <label className="cute-btn-quiet cursor-pointer">
            上傳影片
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                void upload(file, 'memory')
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl">座位圖</h2>
        <p className="text-xs text-mute">
          上傳戲院平面圖，點選你的座位，頭像會標記在該位置。
        </p>
        {entry.seatLabel && <p className="text-sm">座位：{entry.seatLabel}</p>}
        {floorplan ? (
          <SeatCanvas
            blob={floorplan.blob}
            avatar={avatar}
            profileName={profile.name}
            seatX={entry.seatX}
            seatY={entry.seatY}
            seatLabel={entry.seatLabel}
            editable
            onPlace={(x, y) => {
              void saveEntry({ ...entry, seatX: x, seatY: y })
            }}
          />
        ) : (
          <p className="text-sm text-mute">尚未上傳平面圖</p>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="cute-btn-quiet cursor-pointer">
            {floorplan ? '更換平面圖' : '上傳平面圖'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                void upload(file, 'floorplan')
              }}
            />
          </label>
          {floorplan && (
            <button
              type="button"
              className="cute-btn-quiet"
              onClick={() => {
                void removeMedia(floorplan.id)
                void saveEntry({ ...entry, seatX: null, seatY: null })
              }}
            >
              刪除平面圖
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to={`/entry/${entry.id}/edit`} className="cute-btn">
          編輯
        </Link>
        <Link to="/" className="cute-btn-quiet">
          返回主頁
        </Link>
        <button
          type="button"
          className="cute-btn-quiet text-mocha"
          onClick={async () => {
            if (!window.confirm('確定刪除此電影紀錄及相關媒體？')) return
            await removeEntry(entry.id)
            navigate('/')
          }}
        >
          刪除
        </button>
      </div>
    </div>
  )
}
