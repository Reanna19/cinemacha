import { useEffect, useMemo } from 'react'

export function BlobMedia({
  blob,
  mime,
  alt,
  className,
}: {
  blob: Blob
  mime: string
  alt: string
  className?: string
}) {
  const src = useMemo(() => URL.createObjectURL(blob), [blob])

  useEffect(() => {
    return () => URL.revokeObjectURL(src)
  }, [src])

  if (mime.startsWith('video/')) {
    return <video src={src} className={className} controls playsInline preload="metadata" />
  }

  return <img src={src} alt={alt} className={className} />
}
