const MAX_EDGE = 1600
const JPEG_QUALITY = 0.84

export async function archiveTicketImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('請揀相片。')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), 'image/jpeg', JPEG_QUALITY)
  })
  return blob ?? file
}

const MAX_VIDEO_BYTES = 40 * 1024 * 1024

export function assertVideoOk(file: File) {
  if (!file.type.startsWith('video/')) {
    throw new Error('請揀影片檔。')
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('影片過大，請選擇約 40MB 以內的短片。')
  }
}
