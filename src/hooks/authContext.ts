import { createContext } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  error: Error | null
  refreshSession: () => Promise<void>
  signOut: () => Promise<{ error: AuthError | null }>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
