import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PopcornRating } from '@/components/PopcornRating'
import {
  COMPANION_OPTIONS,
  newId,
  normalizeCompanionKind,
  splitList,
  timesWatched,
  todayIsoDate,
} from '@/lib/ids'
import { HK_CITIES, VIEWING_COUNTRIES } from '@/lib/places'
import { useApp } from '@/store/app'
import type { CompanionKind, WatchStatus } from '@/lib/types'

export function EntryFormPage() {
  const { entryId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const entries = useApp((s) => s.entries)
  const saveEntry = useApp((s) => s.saveEntry)
  const existing = entryId ? entries.find((item) => item.id === entryId) : undefined

  const initialStatus = (existing?.status ?? params.get('status') ?? 'watched') as WatchStatus
  const [title, setTitle] = useState(existing?.title ?? '')
  const [status, setStatus] = useState<WatchStatus>(
    initialStatus === 'to_watch' ? 'to_watch' : 'watched',
  )
  const [date, setDate] = useState(existing?.date ?? todayIsoDate())
  const [watchCount, setWatchCount] = useState(
    existing ? Math.max(1, timesWatched(existing)) : 1,
  )
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null)
  const [thoughts, setThoughts] = useState(existing?.thoughts ?? '')
  const [country, setCountry] = useState(existing?.country ?? '香港')
  const [region, setRegion] = useState(existing?.region ?? '')
  const [city, setCity] = useState(existing?.city ?? '')
  const [directors, setDirectors] = useState(existing?.directors.join('、') ?? '')
  const [actors, setActors] = useState(existing?.actors.join('、') ?? '')
  const [seatLabel, setSeatLabel] = useState(existing?.seatLabel ?? '')
  const [companionKind, setCompanionKind] = useState<CompanionKind>(
    normalizeCompanionKind(existing?.companionKind),
  )
  const [companionName, setCompanionName] = useState(existing?.companionName ?? '')
  const [saving, setSaving] = useState(false)

  if (entryId && !existing) return <Navigate to="/" replace />

  return (
    <form
      className="mx-auto max-w-xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!title.trim()) return
        setSaving(true)
        const id = existing?.id ?? newId()
        const now = new Date().toISOString()
        await saveEntry({
          id,
          title,
          status,
          date,
          watchCount: status === 'to_watch' ? 0 : Math.max(1, Math.floor(watchCount) || 1),
          rating: status === 'to_watch' ? null : rating,
          thoughts,
          companionKind,
          companionName: companionName.trim(),
          country,
          region,
          city,
          directors: splitList(directors),
          actors: splitList(actors),
          seatLabel: seatLabel.trim(),
          seatX: existing?.seatX ?? null,
          seatY: existing?.seatY ?? null,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        })
        navigate(`/entry/${id}`)
      }}
    >
      <div>
        <p className="text-xs tracking-[0.24em] text-matcha">NEW / EDIT</p>
        <h1 className="display mt-1 text-3xl">
          {existing ? '編輯紀錄' : status === 'to_watch' ? '想看' : '已看'}
        </h1>
      </div>

      <label className="block text-sm">
        電影名稱
        <input
          className="field mt-1"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="輸入片名"
        />
      </label>

      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-1 text-sm">狀態</legend>
        {(['watched', 'to_watch'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`rounded-full py-2 text-sm ${
              status === option ? 'bg-matcha text-cream' : 'bg-foam'
            }`}
            onClick={() => setStatus(option)}
          >
            {option === 'watched' ? '已看' : '想看'}
          </button>
        ))}
      </fieldset>

      <label className="block text-sm">
        {status === 'to_watch' ? '預計觀看日期' : '觀看日期'}
        <input
          type="date"
          required
          className="field mt-1"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>

      {status === 'watched' && (
        <>
          <label className="block text-sm">
            觀看次數
            <input
              type="number"
              min={1}
              max={999}
              inputMode="numeric"
              className="field mt-1"
              value={watchCount}
              onChange={(event) => {
                const next = Number(event.target.value)
                setWatchCount(Number.isFinite(next) ? next : 1)
              }}
            />
          </label>
          <div>
            <p className="text-sm">爆谷評分</p>
            <div className="mt-2">
              <PopcornRating value={rating} onChange={setRating} />
            </div>
          </div>
        </>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-sm">和誰看</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPANION_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`rounded-full px-3.5 py-2 text-sm outline-none ${
                  companionKind === option.id
                    ? 'bg-matcha text-cream'
                    : 'bg-foam text-ink'
                }`}
                onClick={() => setCompanionKind(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm">
          姓名
          <input
            className="field mt-1"
            value={companionName}
            onChange={(event) => setCompanionName(event.target.value)}
            placeholder={
              companionKind === 'solo'
                ? '可填暱稱'
                : companionKind === 'family'
                  ? '可填家人姓名'
                  : '可填對方姓名'
            }
          />
        </label>
      </div>

      <label className="block text-sm">
        觀看國家／地區
        <select className="field mt-1" value={country} onChange={(event) => setCountry(event.target.value)}>
          {VIEWING_COUNTRIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        地區
        <input
          className="field mt-1"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          placeholder="如：九龍"
        />
      </label>

      <label className="block text-sm">
        城市／地點
        <input
          className="field mt-1"
          list="hk-cities"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="如：尖沙咀"
        />
        <datalist id="hk-cities">
          {HK_CITIES.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </label>

      <label className="block text-sm">
        座位編號
        <input
          className="field mt-1"
          value={seatLabel}
          onChange={(event) => setSeatLabel(event.target.value)}
          placeholder="如：G12"
        />
      </label>

      <label className="block text-sm">
        導演
        <input
          className="field mt-1"
          value={directors}
          onChange={(event) => setDirectors(event.target.value)}
          placeholder="多人請以、分隔"
        />
      </label>

      <label className="block text-sm">
        演員
        <input
          className="field mt-1"
          value={actors}
          onChange={(event) => setActors(event.target.value)}
          placeholder="多人請以、分隔"
        />
      </label>

      <label className="block text-sm">
        觀影感想
        <textarea
          className="field mt-1 min-h-32"
          value={thoughts}
          onChange={(event) => setThoughts(event.target.value)}
          placeholder="寫下這次觀影的感受"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="cute-btn" disabled={saving || !title.trim()}>
          {saving ? '儲存中…' : '儲存'}
        </button>
        <Link to={existing ? `/entry/${existing.id}` : '/'} className="cute-btn-quiet">
          取消
        </Link>
      </div>
    </form>
  )
}
