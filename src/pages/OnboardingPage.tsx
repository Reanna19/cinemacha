import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AvatarBubble } from '@/components/AvatarBubble'
import { useApp } from '@/store/app'

export function OnboardingPage() {
  const saveProfile = useApp((s) => s.saveProfile)
  const setAvatar = useApp((s) => s.setAvatar)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [preview, setPreview] = useState<Blob | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-md space-y-8 py-4">
      <section className="text-center">
        <p className="display text-3xl lowercase tracking-[0.18em] text-matcha-deep">cinemacha</p>
        <h1 className="display mt-4 text-2xl">建立你的電影日記</h1>
        <p className="mt-2 text-sm text-mute">上傳頭像並輸入名稱，開始記錄每一次觀影。</p>
      </section>

      <div className="flex flex-col items-center gap-3">
        <AvatarBubble blob={preview} name={name || '你'} size="lg" />
        <label className="cute-btn-quiet cursor-pointer">
          選擇頭像
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              if (!file.type.startsWith('image/')) {
                setError('請選擇相片檔案。')
                return
              }
              setError(null)
              setPendingFile(file)
              setPreview(file)
            }}
          />
        </label>
        {preview && (
          <button
            type="button"
            className="text-xs text-mute"
            onClick={() => {
              setPreview(null)
              setPendingFile(null)
            }}
          >
            稍後再設頭像
          </button>
        )}
      </div>

      <label className="block text-sm">
        你的名稱
        <input
          className="field mt-1"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="輸入名稱"
          maxLength={24}
          autoComplete="nickname"
        />
      </label>

      {error && <p className="text-sm text-mocha">{error}</p>}

      <button
        type="button"
        className="cute-btn w-full"
        disabled={!name.trim() || saving}
        onClick={async () => {
          setSaving(true)
          setError(null)
          try {
            const now = new Date().toISOString()
            await saveProfile({
              name: name.trim(),
              createdAt: now,
              updatedAt: now,
            })
            if (pendingFile) await setAvatar(pendingFile)
            navigate('/', { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : '建立失敗，請再試一次。')
            setSaving(false)
          }
        }}
      >
        {saving ? '準備中…' : '開始使用'}
      </button>

      <p className="text-center text-xs text-mute">資料保存在你的裝置，可隨時在「我」頁面修改。</p>
    </div>
  )
}
