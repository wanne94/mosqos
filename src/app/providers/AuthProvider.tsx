import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isDevMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Development test users
const DEV_USERS = [
  { email: 'admin@mosqos.com', password: 'admin123', role: 'admin', name: 'Admin User' },
  { email: 'imam@mosqos.com', password: 'imam123', role: 'imam', name: 'Imam User' },
  { email: 'member@mosqos.com', password: 'member123', role: 'member', name: 'Member User' },
]

// Create a mock user object for dev mode
const createMockUser = (email: string, role: string, name: string): User => ({
  id: `dev-${email.replace('@', '-').replace('.', '-')}`,
  email,
  app_metadata: {},
  user_metadata: { name, role },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
})

// Create a mock session for dev mode
const createMockSession = (user: User): Session => ({
  access_token: 'dev-access-token',
  refresh_token: 'dev-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user,
})

const DEV_MODE_KEY = 'mosqos_dev_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isDevMode = !isSupabaseConfigured()

  useEffect(() => {
    if (isDevMode) {
      // Check for existing dev session in localStorage
      const savedDevUser = localStorage.getItem(DEV_MODE_KEY)
      if (savedDevUser) {
        const devUser = DEV_USERS.find(u => u.email === savedDevUser)
        if (devUser) {
          const mockUser = createMockUser(devUser.email, devUser.role, devUser.name)
          setUser(mockUser)
          setSession(createMockSession(mockUser))
        }
      }
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [isDevMode])

  const signIn = async (email: string, password: string) => {
    if (isDevMode) {
      const devUser = DEV_USERS.find(u => u.email === email && u.password === password)
      if (devUser) {
        const mockUser = createMockUser(devUser.email, devUser.role, devUser.name)
        setUser(mockUser)
        setSession(createMockSession(mockUser))
        localStorage.setItem(DEV_MODE_KEY, email)
        return { error: null }
      }
      return { error: new Error('Invalid email or password') }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    if (isDevMode) {
      // In dev mode, just simulate successful signup
      console.log('[DEV MODE] Signup simulated for:', email, metadata)
      return { error: null }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    if (isDevMode) {
      setUser(null)
      setSession(null)
      localStorage.removeItem(DEV_MODE_KEY)
      return
    }
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (isDevMode) {
      console.log('[DEV MODE] Password reset simulated for:', email)
      return { error: null }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error ? new Error(error.message) : null }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isDevMode,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
