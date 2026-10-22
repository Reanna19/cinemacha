import { Link } from 'react-router-dom'
import { BlobMedia } from '@/components/BlobMedia'
import { PopcornRating } from '@/components/PopcornRating'
import { formatCompanion, formatHkDate, timesWatched } from '@/lib/ids'
import { useApp } from '@/store/app'

export function HomePage() {
  const profile = useApp((s) => s.profile)
  const entries = useApp((s) => s.entries)
  const media = useApp((s) => s.media)
  const watched = entries.filter((item) => item.status === 'watched')
  const planned = entries.filter((item) => item.status === 'to_watch')

  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs tracking-[0.24em] text-matcha">HOME</p>
        <h1 className="display mt-1 text-3xl">
          {profile ? `${profile.name} 的電影日記` : '電影日記'}
        </h1>
        <p className="mt-2 text-sm text-mute">
          記錄已看與想看的電影，留下票根、回憶與感想。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/new?status=watched" className="cute-btn">
            ＋ 已看
          </Link>
          <Link to="/new?status=to_watch" className="cute-btn-quiet">
            ＋ 想看
          </Link>
        </div>
        <p className="mt-3 text-sm">
          已看 {watched.length} · 想看 {planned.length}
        </p>
      </section>

      {entries.length === 0 ? (
        <div className="bubble rounded-[1.5rem] px-5 py-10 text-center text-sm text-mute">
          還沒有電影紀錄，點上方按鈕開始吧。
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const poster = media.find((item) => item.entryId === entry.id && item.kind === 'poster')
            const tickets = media.filter((item) => item.entryId === entry.id && item.kind === 'ticket').length
            const memories = media.filter((item) => item.entryId === entry.id && item.kind === 'memory').length
            const hasPlan = media.some((item) => item.entryId === entry.id && item.kind === 'floorplan')
            const place = [entry.city, entry.region, entry.country].filter(Boolean).join(' · ')
            const isPlanned = entry.status === 'to_watch'
            return (
              <Link
                key={entry.id}
                to={`/entry/${entry.id}`}
                className="bubble grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3 overflow-hidden rounded-[1.35rem] p-3 sm:grid-cols-[minmax(0,1fr)_6.5rem]"
              >
                <div className="min-w-0 py-1 pl-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="display text-xl leading-snug">{entry.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] ${
                        isPlanned ? 'bg-foam text-mute' : 'bg-matcha/15 text-matcha-deep'
                      }`}
                    >
                      {isPlanned ? '想看' : '已看'}
                    </span>
                  </div>
                  <p className="text-xs text-mute">{formatHkDate(entry.date)}</p>
                  {place && <p className="mt-1 text-xs text-mute">地點 {place}</p>}
                  <p className="mt-1 text-xs text-mute">和誰看：{formatCompanion(entry)}</p>
                  <div className="mt-2">
                    {isPlanned ? (
                      <p className="text-xs text-mute">想看清單暫不評分</p>
                    ) : (
                      <>
                        <p className="mb-1 text-xs text-matcha-deep">看過 {timesWatched(entry)} 次</p>
                        <PopcornRating value={entry.rating} readOnly />
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-mute">
                    {tickets > 0 ? `票根 ${tickets}` : '尚無票根'}
                    {` · 回憶 ${memories}`}
                    {hasPlan ? ' · 座位圖' : ''}
                    {entry.seatLabel ? ` · ${entry.seatLabel}` : ''}
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1rem] bg-foam">
                  {poster ? (
                    <BlobMedia
                      blob={poster.blob}
                      mime={poster.mime}
                      alt={`${entry.title} 海報`}
                      className="h-full min-h-[8.5rem] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[8.5rem] items-center justify-center px-2 text-center text-[10px] leading-relaxed text-mute">
                      尚無海報
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
