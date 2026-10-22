import { useEffect, useMemo } from 'react'

export function AvatarBubble({
  blob,
  name,
  size = 'md',
  className = '',
}: {
  blob: Blob | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const src = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  const dim = size === 'lg' ? 'h-20 w-20 text-3xl' : size === 'sm' ? 'h-10 w-10 text-base' : 'h-14 w-14 text-2xl'
  const initial = name?.trim().slice(0, 1) || '影'

  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src)
    }
  }, [src])

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}的頭像` : '頭像'}
        className={`${dim} rounded-full object-cover ring-2 ring-white/80 ${className}`}
      />
    )
  }

  return (
    <span
      className={`grid ${dim} place-items-center rounded-full bg-matcha/25 font-medium text-matcha-deep ${className}`}
    >
      {initial}
    </span>
  )
}
