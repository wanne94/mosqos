import { supabase } from './client'

/**
 * Setup automatic token refresh
 * Supabase default: token expires in 1 hour
 * This function sets up auto refresh 5min before expiration
 *
 * Note: Supabase already handles auto-refresh internally,
 * but we expose this for custom logic if needed
 */
export const setupTokenRefresh = (callback?: () => void) => {
  // Supabase handles this automatically via autoRefreshToken: true
  // But we can add custom logic here if needed
  if (callback) {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        callback()
      }
    })
  }
}

/**
 * Check if session is about to expire
 * Returns true if session expires in the next 5 minutes
 */
export const isSessionExpiringSoon = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.expires_at) return false

  const expiresAt = session.expires_at * 1000 // Convert to ms
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  return (expiresAt - now) < fiveMinutes
}

/**
 * Get time remaining until session expires (in seconds)
 * Returns null if no active session
 */
export const getTimeUntilExpiry = async (): Promise<number | null> => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.expires_at) return null

  const expiresAt = session.expires_at * 1000
  const now = Date.now()
  const remainingMs = expiresAt - now

  return Math.max(0, Math.floor(remainingMs / 1000))
}

/**
 * Manually extend session by refreshing token
 * Returns true if refresh was successful
 */
export const extendSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error('Failed to refresh session:', error)
      return false
    }

    return !!data.session
  } catch (error) {
    console.error('Error refreshing session:', error)
    return false
  }
}

/**
 * Clean up session data on logout
 */
export const cleanupSession = async (): Promise<void> => {
  try {
    // Clear Supabase session
    await supabase.auth.signOut()

    // Clear any local storage data
    localStorage.removeItem('supabase.auth.token')

    // Note: React Query cache will be cleared from AuthProvider
  } catch (error) {
    console.error('Error during session cleanup:', error)
  }
}

/**
 * Get session expiry time
 * Returns Date object or null if no active session
 */
export const getSessionExpiryTime = async (): Promise<Date | null> => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.expires_at) return null

  return new Date(session.expires_at * 1000)
}

/**
 * Check if session is still valid
 * Returns true if session exists and hasn't expired
 */
export const isSessionValid = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.expires_at) return false

  const expiresAt = session.expires_at * 1000
  const now = Date.now()

  return now < expiresAt
}

/**
 * Format seconds to MM:SS format for countdown timer
 */
export const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
