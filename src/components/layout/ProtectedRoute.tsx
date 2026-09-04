import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, error, refreshSession } = useAuth()
  if (loading) return <p role="status" className="p-6 text-sm text-neutral-500">Checking your session…</p>
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-neutral-900">Could not verify your session</h1>
          <p className="mt-2 text-sm text-neutral-500">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => void refreshSession()}
            className="mt-5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
