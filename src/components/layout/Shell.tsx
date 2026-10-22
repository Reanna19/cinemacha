import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Clapperboard, Home, UserRound } from 'lucide-react'
import { AvatarBubble } from '@/components/AvatarBubble'
import { useApp } from '@/store/app'

const links = [
  { to: '/', label: '主頁', icon: Home, end: true },
  { to: '/new', label: '新增', icon: Clapperboard, end: false },
  { to: '/me', label: '我', icon: UserRound, end: false },
]

export function Shell() {
  const hydrate = useApp((s) => s.hydrate)
  const ready = useApp((s) => s.ready)
  const error = useApp((s) => s.error)
  const profile = useApp((s) => s.profile)
  const avatar = useApp((s) => s.avatar)
  const location = useLocation()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <div className="relative mx-auto min-h-dvh max-w-lg lg:max-w-5xl lg:grid lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-matcha/15 px-6 py-8 lg:block">
        <p className="display text-2xl lowercase tracking-[0.16em] text-matcha-deep">cinemacha</p>
        <p className="mt-2 text-sm text-mute">電影日記 · 觀影隨筆</p>
        {profile && (
          <div className="mt-6 flex items-center gap-3 rounded-[1.2rem] bg-foam px-3 py-3">
            <AvatarBubble blob={avatar} name={profile.name} size="sm" />
            <div>
              <p className="font-medium">{profile.name}</p>
              <p className="text-xs text-mute">電影日記</p>
            </div>
          </div>
        )}
        <nav className="mt-8 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm ${
                  isActive ? 'bg-matcha text-cream' : 'text-ink hover:bg-foam'
                }`
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))] lg:hidden">
          <div>
            <p className="display text-xl lowercase tracking-[0.16em] text-matcha-deep">cinemacha</p>
            <p className="text-[11px] text-mute">
              {profile ? `你好，${profile.name}` : '電影日記 · 觀影隨筆'}
            </p>
          </div>
          {profile && <AvatarBubble blob={avatar} name={profile.name} size="sm" />}
        </header>

        <main className="flex-1 px-5 pb-28 pt-2 lg:px-10 lg:pb-12 lg:pt-8">
          {!ready ? (
            <p className="text-sm text-mute">載入中…</p>
          ) : error ? (
            <p className="text-sm text-mocha">無法載入資料：{error}</p>
          ) : (
            <Outlet key={location.pathname} />
          )}
        </main>
      </div>

      {profile && (
        <nav className="pill-nav fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-[1.8rem] px-2 py-2.5 shadow-lg lg:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="flex flex-col items-center gap-1 text-[11px]">
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      isActive ? 'bg-pop text-cocoa' : 'bg-white/10'
                    }`}
                  >
                    <link.icon size={16} />
                  </span>
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
