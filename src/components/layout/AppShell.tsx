import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    setSignOutError(false)
    try {
      const { error } = await signOut()
      if (error) setSignOutError(true)
    } catch {
      setSignOutError(true)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <Link to="/" className="font-semibold text-neutral-900 hover:text-neutral-600">
          Flashcards
        </Link>
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <Link to="/settings" className="max-w-40 truncate hover:text-neutral-900 hover:underline">
            {profile?.display_name || user?.email}
          </Link>
          {signOutError && <span role="alert" className="text-xs text-red-600">Sign-out failed</span>}
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-100 disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
