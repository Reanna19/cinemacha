import { useRef, useState } from 'react'
import { AvatarBubble } from '@/components/AvatarBubble'

export function CinemaMap({
  avatar,
  name,
  onArrive,
}: {
  avatar: Blob | null
  name: string
  onArrive: (dest: 'cinema' | 'wishlist') => void
}) {
  const [walking, setWalking] = useState(false)
  const [pos, setPos] = useState({ x: 18, y: 72 })
  const posRef = useRef(pos)
  posRef.current = pos
  const walkRef = useRef(0)

  const go = (dest: 'cinema' | 'wishlist') => {
    if (walking) return
    setWalking(true)
    const target = dest === 'cinema' ? { x: 72, y: 28 } : { x: 28, y: 22 }
    const start = { ...posRef.current }
    const duration = 1400
    const started = performance.now()
    cancelAnimationFrame(walkRef.current)

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      const ease = 1 - Math.pow(1 - t, 3)
      setPos({
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
      })
      if (t < 1) {
        walkRef.current = requestAnimationFrame(tick)
      } else {
        setWalking(false)
        onArrive(dest)
      }
    }
    walkRef.current = requestAnimationFrame(tick)
  }

  return (
    <div className="cinema-map relative overflow-hidden rounded-[1.6rem] border border-matcha/20 bg-foam shadow-[0_12px_28px_rgba(92,67,52,0.08)]">
      <div className="cinema-map-sky absolute inset-0" />
      <div className="cinema-map-path absolute left-[22%] top-[30%] h-[48%] w-[52%] rounded-full border-[3px] border-dashed border-mocha/25" />

      <button
        type="button"
        className="cinema-spot absolute left-[14%] top-[12%] z-10 flex w-[7.5rem] flex-col items-center gap-1 rounded-2xl bg-card/90 px-2 py-2 shadow-sm ring-1 ring-matcha/20 transition hover:-translate-y-0.5 active:scale-[0.98]"
        onClick={() => go('wishlist')}
        disabled={walking}
        aria-label="走到想看清單"
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-pop/35 text-xl">📋</span>
        <span className="text-[11px] font-medium text-cocoa">想看清單</span>
      </button>

      <button
        type="button"
        className="cinema-spot absolute right-[8%] top-[10%] z-10 flex w-28 flex-col items-center gap-1 rounded-2xl bg-card/95 px-2 py-2 shadow-md ring-1 ring-matcha/25 transition hover:-translate-y-0.5 active:scale-[0.98]"
        onClick={() => go('cinema')}
        disabled={walking}
        aria-label="走到戲院"
      >
        <span className="cinema-building grid h-14 w-14 place-items-center rounded-xl bg-matcha text-2xl text-cream shadow-inner">
          🎬
        </span>
        <span className="text-[11px] font-medium text-matcha-deep">戲院櫃檯</span>
        <span className="text-[10px] text-mute">點我去記一筆</span>
      </button>

      <div
        className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-75 ${
          walking ? 'avatar-walk' : ''
        }`}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        <div className="flex flex-col items-center gap-1">
          <AvatarBubble blob={avatar} name={name} size="sm" className="ring-matcha/40 shadow-md" />
          <span className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] text-cocoa shadow-sm">
            {name}
          </span>
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-3 z-10 text-center text-[11px] text-mute">
        {walking ? '走過去中…' : '點戲院或想看清單，小人會走過去'}
      </p>
    </div>
  )
}
