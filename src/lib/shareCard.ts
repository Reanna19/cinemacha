import { toPng } from 'html-to-image'

export type ShareOutcome =
  | { ok: true; kind: 'shared' }
  | { ok: true; kind: 'downloaded' }
  | { ok: true; kind: 'cancelled' }
  | { ok: false; kind: 'unsupported'; message: string }
  | { ok: false; kind: 'failed'; message: string }

const CAPTURE = {
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: '#fffcf6',
} as const

function isAbort(err: unknown) {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  )
}

export async function waitForFonts() {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }
}

/** Render the share-card preview node to a PNG File. */
export async function captureSharePng(node: HTMLElement, filename: string): Promise<File> {
  await waitForFonts()
  // Double rAF helps layout/fonts settle before capture (esp. Chinese glyphs).
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  const dataUrl = await toPng(node, {
    ...CAPTURE,
    // Prefer system CJK stacks already used by the app UI.
    fontEmbedCSS: undefined,
    filter: (el) => {
      if (!(el instanceof HTMLElement)) return true
      return !el.dataset.shareIgnore
    },
  })
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], filename, { type: 'image/png' })
}

export function canSharePngFile(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  if (typeof navigator.canShare !== 'function') {
    // Older Safari may share files without canShare; attempt is still gated by share().
    return true
  }
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

export async function sharePngFile(
  file: File,
  opts: { title: string; text?: string },
): Promise<ShareOutcome> {
  if (!canSharePngFile(file)) {
    return {
      ok: false,
      kind: 'unsupported',
      message: '此瀏覽器不支援直接分享圖片檔，請改用「下載圖片」。',
    }
  }
  try {
    await navigator.share({
      files: [file],
      title: opts.title,
      text: opts.text,
    })
    return { ok: true, kind: 'shared' }
  } catch (err) {
    if (isAbort(err)) return { ok: true, kind: 'cancelled' }
    return {
      ok: false,
      kind: 'failed',
      message: '分享未能完成，請改用「下載圖片」。',
    }
  }
}

/** Trigger a file download. Does not claim the image was saved to Photos. */
export function downloadPngFile(file: File): ShareOutcome {
  const url = URL.createObjectURL(file)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    return { ok: true, kind: 'downloaded' }
  } catch {
    return {
      ok: false,
      kind: 'failed',
      message: '無法開始下載，請稍後再試。',
    }
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }
}

export function shareFilename(title: string) {
  const safe = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .slice(0, 40)
  return `cinemacha-${safe || 'share'}.png`
}
