import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { useApp } from '@/store/app'
import { EntryFormPage } from '@/pages/EntryFormPage'
import { EntryPage } from '@/pages/EntryPage'
import { HomePage } from '@/pages/HomePage'
import { MePage } from '@/pages/MePage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import type { ReactNode } from 'react'

function RequireProfile({ children }: { children: ReactNode }) {
  const ready = useApp((s) => s.ready)
  const profile = useApp((s) => s.profile)
  if (!ready) return null
  if (!profile) return <Navigate to="/onboarding" replace />
  return children
}

function GuestOnly({ children }: { children: ReactNode }) {
  const ready = useApp((s) => s.ready)
  const profile = useApp((s) => s.profile)
  if (!ready) return null
  if (profile) return <Navigate to="/" replace />
  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      {
        path: 'onboarding',
        element: (
          <GuestOnly>
            <OnboardingPage />
          </GuestOnly>
        ),
      },
      {
        index: true,
        element: (
          <RequireProfile>
            <HomePage />
          </RequireProfile>
        ),
      },
      {
        path: 'new',
        element: (
          <RequireProfile>
            <EntryFormPage />
          </RequireProfile>
        ),
      },
      {
        path: 'entry/:entryId',
        element: (
          <RequireProfile>
            <EntryPage />
          </RequireProfile>
        ),
      },
      {
        path: 'entry/:entryId/edit',
        element: (
          <RequireProfile>
            <EntryFormPage />
          </RequireProfile>
        ),
      },
      {
        path: 'me',
        element: (
          <RequireProfile>
            <MePage />
          </RequireProfile>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
