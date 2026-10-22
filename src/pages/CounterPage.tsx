import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PopcornRating } from '@/components/PopcornRating'
import {
  COMPANION_OPTIONS,
  newId,
  splitList,
  todayIsoDate,
} from '@/lib/ids'
import { HK_CITIES, VIEWING_COUNTRIES } from '@/lib/places'
import { useApp } from '@/store/app'
import type { CompanionKind, WatchStatus } from '@/lib/types'

type StepId =
  | 'hello'
  | 'status'
  | 'title'
  | 'date'
  | 'count'
  | 'rating'
  | 'companion'
  | 'place'
  | 'seat'
  | 'credits'
  | 'thoughts'
  | 'popcorn'

const STAFF_LINES: Record<StepId, string> = {
  hello: '歡迎光臨 cinemacha 戲院～我是櫃檯的小茉。今天想記哪一筆觀影？',
  status: '這次是「已看」還是放進「想看」清單呢？',
  title: '請問你看了／想看哪一套電影？',
  date: '哪一天呢？告訴我日期就好。',
  count: '這套你看過幾次了？',
  rating: '給這次觀影打個爆谷分數吧～',
  companion: '這次是和誰一起看的？',
  place: '在哪個國家／地區、哪個城市看的？',
  seat: '記得座位編號嗎？（可先跳過）',
  credits: '導演或演員有想記下來的嗎？（可先跳過）',
  thoughts: '最後，有什麼感想想留給自己？',
  popcorn: '謝謝你的分享！這一包熱騰騰的爆米花送給你——紀錄已收進日記啦。',
}

export function CounterPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const saveEntry = useApp((s) => s.saveEntry)
  const profile = useApp((s) => s.profile)

  const initialStatus = (params.get('status') === 'to_watch' ? 'to_watch' : 'watched') as WatchStatus
  const [step, setStep] = useState<StepId>(params.get('status') ? 'title' : 'hello')
  const [status, setStatus] = useState<WatchStatus>(initialStatus)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayIsoDate())
  const [watchCount, setWatchCount] = useState(1)
  const [rating, setRating] = useState<number | null>(null)
  const [companionKind, setCompanionKind] = useState<CompanionKind>('solo')
  const [companionName, setCompanionName] = useState('')
  const [country, setCountry] = useState('香港')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [seatLabel, setSeatLabel] = useState('')
  const [directors, setDirectors] = useState('')
  const [actors, setActors] = useState('')
  const [thoughts, setThoughts] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const steps = useMemo(() => {
    const base: StepId[] = params.get('status')
      ? ['title', 'date']
      : ['hello', 'status', 'title', 'date']
    if (status === 'watched') {
      base.push('count', 'rating')
    }
    base.push('companion', 'place', 'seat', 'credits', 'thoughts', 'popcorn')
    return base
  }, [params, status])

  const stepIndex = Math.max(0, steps.indexOf(step))
  const progress = ((stepIndex + 1) / steps.length) * 100

  const goNext = (from: StepId = step) => {
    const idx = steps.indexOf(from)
    const next = steps[idx + 1]
    if (next) setStep(next)
  }

  const finishSave = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    const id = newId()
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
      seatX: null,
      seatY: null,
      createdAt: now,
      updatedAt: now,
    })
    setSavedId(id)
    setSaving(false)
    setStep('popcorn')
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.24em] text-matcha">COUNTER</p>
          <h1 className="display mt-1 text-3xl">戲院櫃檯</h1>
          <p className="mt-1 text-sm text-mute">
            {profile ? `${profile.name}，` : ''}和小茉對話，記下這次觀影。
          </p>
        </div>
        <Link to="/" className="cute-btn-quiet text-sm">
          回地圖
        </Link>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-foam">
        <div
          className="h-full rounded-full bg-matcha transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bubble relative overflow-hidden rounded-[1.5rem] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="staff-avatar grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-matcha/20 text-2xl ring-2 ring-white">
            🎟️
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-matcha-deep">櫃檯 · 小茉</p>
            <div className="speech-bubble mt-2 rounded-[1.1rem] rounded-tl-md bg-foam px-3.5 py-3 text-sm leading-relaxed">
              {STAFF_LINES[step]}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {step === 'hello' && (
            <button type="button" className="cute-btn w-full" onClick={() => goNext()}>
              你好，小茉！
            </button>
          )}

          {step === 'status' && (
            <div className="grid grid-cols-2 gap-2">
              {(['watched', 'to_watch'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="cute-btn-quiet"
                  onClick={() => {
                    setStatus(option)
                    setStep('title')
                  }}
                >
                  {option === 'watched' ? '已看' : '想看'}
                </button>
              ))}
            </div>
          )}

          {step === 'title' && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (!title.trim()) return
                goNext()
              }}
            >
              <input
                className="field"
                autoFocus
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="輸入片名"
              />
              <button type="submit" className="cute-btn w-full" disabled={!title.trim()}>
                下一題
              </button>
            </form>
          )}

          {step === 'date' && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                goNext()
              }}
            >
              <input
                type="date"
                required
                className="field"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <button type="submit" className="cute-btn w-full">
                下一題
              </button>
            </form>
          )}

          {step === 'count' && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                goNext()
              }}
            >
              <input
                type="number"
                min={1}
                max={999}
                inputMode="numeric"
                className="field"
                value={watchCount}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setWatchCount(Number.isFinite(next) ? next : 1)
                }}
              />
              <button type="submit" className="cute-btn w-full">
                下一題
              </button>
            </form>
          )}

          {step === 'rating' && (
            <div className="space-y-4">
              <PopcornRating value={rating} onChange={setRating} />
              <button type="button" className="cute-btn w-full" onClick={() => goNext()}>
                {rating == null ? '先跳過評分' : '下一題'}
              </button>
            </div>
          )}

          {step === 'companion' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {COMPANION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`rounded-full px-3.5 py-2 text-sm ${
                      companionKind === option.id ? 'bg-matcha text-cream' : 'bg-foam'
                    }`}
                    onClick={() => setCompanionKind(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <input
                className="field"
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
              <button type="button" className="cute-btn w-full" onClick={() => goNext()}>
                下一題
              </button>
            </div>
          )}

          {step === 'place' && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                goNext()
              }}
            >
              <select
                className="field"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              >
                {VIEWING_COUNTRIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                className="field"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="地區，如：九龍"
              />
              <input
                className="field"
                list="hk-cities-counter"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="城市／地點，如：尖沙咀"
              />
              <datalist id="hk-cities-counter">
                {HK_CITIES.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <button type="submit" className="cute-btn w-full">
                下一題
              </button>
            </form>
          )}

          {step === 'seat' && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                goNext()
              }}
            >
              <input
                className="field"
                value={seatLabel}
                onChange={(event) => setSeatLabel(event.target.value)}
                placeholder="如：G12"
              />
              <div className="flex gap-2">
                <button type="button" className="cute-btn-quiet flex-1" onClick={() => goNext()}>
                  跳過
                </button>
                <button type="submit" className="cute-btn flex-1">
                  下一題
                </button>
              </div>
            </form>
          )}

          {step === 'credits' && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                goNext()
              }}
            >
              <input
                className="field"
                value={directors}
                onChange={(event) => setDirectors(event.target.value)}
                placeholder="導演（多人用、分隔）"
              />
              <input
                className="field"
                value={actors}
                onChange={(event) => setActors(event.target.value)}
                placeholder="演員（多人用、分隔）"
              />
              <div className="flex gap-2">
                <button type="button" className="cute-btn-quiet flex-1" onClick={() => goNext()}>
                  跳過
                </button>
                <button type="submit" className="cute-btn flex-1">
                  下一題
                </button>
              </div>
            </form>
          )}

          {step === 'thoughts' && (
            <div className="space-y-3">
              <textarea
                className="field min-h-28"
                value={thoughts}
                onChange={(event) => setThoughts(event.target.value)}
                placeholder="寫下這次觀影的感受"
              />
              <button
                type="button"
                className="cute-btn w-full"
                disabled={saving || !title.trim()}
                onClick={() => void finishSave()}
              >
                {saving ? '收票中…' : '完成，領爆米花'}
              </button>
            </div>
          )}

          {step === 'popcorn' && (
            <div className="space-y-4 py-2 text-center">
              <div className="popcorn-reward mx-auto grid h-28 w-28 place-items-center rounded-[1.5rem] bg-pop/30 text-5xl shadow-inner">
                🍿
              </div>
              <p className="display text-2xl text-matcha-deep">紀錄成功</p>
              <p className="text-sm text-mute">《{title}》已寫進你的電影日記。</p>
              <div className="flex flex-wrap justify-center gap-2">
                {savedId && (
                  <button
                    type="button"
                    className="cute-btn"
                    onClick={() => navigate(`/entry/${savedId}`)}
                  >
                    查看紀錄
                  </button>
                )}
                <Link to="/" className="cute-btn-quiet">
                  回地圖
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
