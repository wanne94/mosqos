import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

interface VerificationGuardProps {
  children: React.ReactNode
}

/**
 * VerificationGuard ensures that users have verified their email
 * before accessing protected routes.
 *
 * If user is not verified, redirects to /verify-email/pending
 */
export function VerificationGuard({ children }: VerificationGuardProps) {
  const { user, isLoading, isDevMode } = useAuth()

  // Don't block in dev mode
  if (isDevMode) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if user has verified email
  // In Supabase, email_confirmed_at is set when email is verified
  if (user && !user.email_confirmed_at) {
    return <Navigate to="/verify-email/pending" replace />
  }

  return <>{children}</>
}
