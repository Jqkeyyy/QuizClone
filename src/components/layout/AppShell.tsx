import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <Link to="/" className="font-semibold text-neutral-900 hover:text-neutral-600">
          Flashcards
        </Link>
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <span>{user?.email}</span>
          <button onClick={() => signOut()} className="rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-100">
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
