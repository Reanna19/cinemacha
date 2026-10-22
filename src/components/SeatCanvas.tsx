import { useEffect, useMemo, useRef } from 'react'
import { AvatarBubble } from './AvatarBubble'

export function SeatCanvas({
  blob,
  avatar,
  profileName,
  seatX,
  seatY,
  seatLabel,
  editable,
  onPlace,
}: {
  blob: Blob
  avatar: Blob | null
  profileName?: string
  seatX: number | null
  seatY: number | null
  seatLabel: string
  editable: boolean
  onPlace?: (x: number, y: number) => void
}) {
  const src = useMemo(() => URL.createObjectURL(blob), [blob])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => URL.revokeObjectURL(src)
  }, [src])

  const place = (clientX: number, clientY: number) => {
    if (!editable || !onPlace || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
    onPlace(x, y)
  }

  return (
    <div className="space-y-2">
      <div
        ref={wrapRef}
        className={`relative overflow-hidden rounded-[1.4rem] bg-foam ${editable ? 'cursor-crosshair' : ''}`}
        onClick={(event) => place(event.clientX, event.clientY)}
      >
        <img src={src} alt="戲院平面圖" className="block w-full" />
        {seatX != null && seatY != null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${seatX * 100}%`, top: `${seatY * 100}%` }}
          >
            <AvatarBubble blob={avatar} name={profileName} size="sm" className="shadow-md" />
            {seatLabel && (
              <p className="mt-1 rounded-full bg-cocoa/90 px-2 py-0.5 text-center text-[10px] text-cream">
                {seatLabel}
              </p>
            )}
          </div>
        )}
      </div>
      {editable && (
        <p className="text-xs text-mute">點選平面圖上的位置，即可標記你的座位。</p>
      )}
    </div>
  )
}
