import { useState } from 'react'
import { AvatarBubble } from '@/components/AvatarBubble'
import { formatBytes } from '@/lib/ids'
import { useApp } from '@/store/app'

export function MePage() {
  const profile = useApp((s) => s.profile)
  const avatar = useApp((s) => s.avatar)
  const entries = useApp((s) => s.entries)
  const media = useApp((s) => s.media)
  const saveProfile = useApp((s) => s.saveProfile)
  const setAvatar = useApp((s) => s.setAvatar)
  const clearAvatar = useApp((s) => s.clearAvatar)
  const exportBackup = useApp((s) => s.exportBackup)
  const importBackup = useApp((s) => s.importBackup)
  const clearAll = useApp((s) => s.clearAll)
  const [name, setName] = useState(profile?.name ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!profile) return null

  const watched = entries.filter((item) => item.status === 'watched').length
  const bytes = media.reduce((sum, item) => sum + item.byteLength, 0) + (avatar?.size ?? 0)

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <section>
        <p className="text-xs tracking-[0.24em] text-matcha">ME</p>
        <h1 className="display mt-1 text-3xl">我</h1>
        <p className="mt-2 text-sm text-mute">管理個人資料與備份。</p>
      </section>

      <div className="flex items-center gap-3 rounded-[1.3rem] bg-foam px-4 py-4">
        <AvatarBubble blob={avatar} name={profile.name} size="md" />
        <div>
          <p className="font-medium">{profile.name}</p>
          <p className="text-xs text-mute">
            已看 {watched} · 媒體 {media.length} · {formatBytes(bytes)}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="display text-xl">頭像與名稱</h2>
        <div className="flex flex-wrap items-center gap-3">
          <AvatarBubble blob={avatar} name={name || profile.name} size="lg" />
          <div className="flex flex-col gap-2">
            <label className="cute-btn-quiet cursor-pointer">
              上傳頭像
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  setBusy(true)
                  setMessage(null)
                  try {
                    await setAvatar(file)
                    setMessage('頭像已更新。')
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : '上傳失敗')
                  } finally {
                    setBusy(false)
                  }
                }}
              />
            </label>
            {avatar && (
              <button
                type="button"
                className="text-xs text-mute"
                disabled={busy}
                onClick={async () => {
                  await clearAvatar()
                  setMessage('已移除頭像。')
                }}
              >
                移除頭像
              </button>
            )}
          </div>
        </div>
        <label className="block text-sm">
          名稱
          <input
            className="field mt-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
          />
        </label>
        <button
          type="button"
          className="cute-btn"
          disabled={busy || !name.trim()}
          onClick={async () => {
            await saveProfile({
              ...profile,
              name: name.trim(),
            })
            setMessage('資料已儲存。')
          }}
        >
          儲存資料
        </button>
      </section>

      <section className="bubble space-y-3 rounded-[1.4rem] p-5">
        <h2 className="display text-xl">備份與還原</h2>
        <p className="text-sm text-mute">
          你的日記與媒體保存在此裝置的瀏覽器中。更換裝置或清除瀏覽資料前，建議先匯出備份。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="cute-btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setMessage(null)
              try {
                await exportBackup()
                setMessage('備份檔已開始下載。')
              } catch (error) {
                setMessage(error instanceof Error ? error.message : '備份失敗')
              } finally {
                setBusy(false)
              }
            }}
          >
            匯出備份
          </button>
          <label className="cute-btn-quiet cursor-pointer">
            還原備份
            <input
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                if (!window.confirm('還原會覆蓋目前裝置上的日記資料，確定繼續？')) return
                setBusy(true)
                setMessage(null)
                try {
                  await importBackup(file)
                  setMessage('備份已還原。')
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : '還原失敗')
                } finally {
                  setBusy(false)
                }
              }}
            />
          </label>
        </div>
        {message && <p className="text-sm text-matcha-deep">{message}</p>}
      </section>

      <button
        type="button"
        className="text-xs text-mute"
        onClick={async () => {
          if (!window.confirm('確定清空此裝置上的全部日記？此操作無法復原。')) return
          await clearAll()
          window.location.href = '/onboarding'
        }}
      >
        清空全部資料
      </button>
    </div>
  )
}
