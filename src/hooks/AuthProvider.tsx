import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { shouldClearUserCache, type CachedUserId } from '../lib/auth/session'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './authContext'

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error('Could not connect to authentication.')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const cachedUserIdRef = useRef<CachedUserId>(undefined)

  const applySession = useCallback((nextSession: Session | null) => {
    const nextUserId = nextSession?.user.id ?? null
    if (shouldClearUserCache(cachedUserIdRef.current, nextUserId)) queryClient.clear()
    cachedUserIdRef.current = nextUserId
    setSession(nextSession)
  }, [queryClient])

  const refreshSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      applySession(data.session)
    } catch (sessionError) {
      applySession(null)
      setError(toError(sessionError))
    } finally {
      setLoading(false)
    }
  }, [applySession])

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        applySession(null)
        setError(toError(sessionError))
      } else {
        applySession(data.session)
        setError(null)
      }
      setLoading(false)
    }).catch((sessionError: unknown) => {
      if (!active) return
      applySession(null)
      setError(toError(sessionError))
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession)
      setError(null)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [applySession])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    error,
    refreshSession,
    signOut: () => supabase.auth.signOut(),
  }), [error, loading, refreshSession, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
