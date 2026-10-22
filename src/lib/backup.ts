import JSZip from 'jszip'
import { normalizeMediaKind } from './ids'
import type { BackupManifest, MediaItem } from './types'
import { loadArchive, replaceArchive } from './idb'

function mediaExt(item: MediaItem) {
  if (item.mime.includes('png')) return 'png'
  if (item.mime.includes('webp')) return 'webp'
  if (item.mime.includes('gif')) return 'gif'
  if (item.mime.startsWith('video/')) {
    if (item.mime.includes('webm')) return 'webm'
    if (item.mime.includes('quicktime')) return 'mov'
    return 'mp4'
  }
  return 'jpg'
}

export async function exportArchiveZip() {
  const archive = await loadArchive()
  const zip = new JSZip()
  const manifest: BackupManifest = {
    app: 'cinemacha',
    format: 2,
    exportedAt: new Date().toISOString(),
    profile: archive.profile,
    entries: archive.entries,
    media: archive.media.map((item) => ({
      id: item.id,
      entryId: item.entryId,
      kind: item.kind,
      filename: item.filename,
      mime: item.mime,
      byteLength: item.byteLength,
      createdAt: item.createdAt,
    })),
  }
  zip.file('cinemacha.json', JSON.stringify(manifest, null, 2))
  if (archive.avatar) {
    zip.file('avatar.jpg', archive.avatar)
  }
  const folder = zip.folder('media')
  for (const item of archive.media) {
    folder?.file(`${item.id}.${mediaExt(item)}`, item.blob)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const stamp = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cinemacha-日記-${stamp}.zip`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function importArchiveZip(file: File) {
  const zip = await JSZip.loadAsync(file)
  const manifestFile = zip.file('cinemacha.json')
  if (!manifestFile) {
    throw new Error('此檔案不是有效的 cinemacha 備份。')
  }
  const manifest = JSON.parse(await manifestFile.async('string')) as BackupManifest
  if (manifest.app !== 'cinemacha' || manifest.format !== 2) {
    throw new Error('備份格式不相容，請使用本應用匯出的備份檔。')
  }

  const media: MediaItem[] = []
  for (const meta of manifest.media) {
    const match = zip.file(new RegExp(`media/${meta.id}\\.`))[0]
    if (!match) throw new Error('備份檔內容不完整，還原失敗。')
    const blob = await match.async('blob')
    media.push({
      ...meta,
      kind: normalizeMediaKind(meta.kind),
      blob: blob.type ? blob : new Blob([blob], { type: meta.mime }),
    })
  }

  const avatarFile = zip.file('avatar.jpg') ?? zip.file(/^avatar\./)?.[0]
  const avatar = avatarFile
    ? await avatarFile.async('blob')
    : null

  await replaceArchive({
    profile: manifest.profile,
    entries: manifest.entries,
    media,
    avatar,
  })
}
