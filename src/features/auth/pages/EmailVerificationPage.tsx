import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ResendVerificationButton } from '../components/ResendVerificationButton'

type VerificationState = 'verifying' | 'success' | 'error' | 'expired'

export default function EmailVerificationPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<VerificationState>('verifying')
  const [countdown, setCountdown] = useState(3)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL (different param names based on Supabase version)
      const token = searchParams.get('token') || searchParams.get('confirmation_token')
      const type = searchParams.get('type')

      if (!token) {
        setState('error')
        return
      }

      try {
        // Supabase automatically verifies email when user clicks the link
        // We just need to exchange the token for a session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        })

        if (error) {
          console.error('Verification error:', error)

          // Check if token is expired
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setState('expired')
          } else {
            setState('error')
          }
          return
        }

        if (data.user) {
          setUserEmail(data.user.email || '')
          setState('success')
        } else {
          setState('error')
        }
      } catch (err) {
        console.error('Unexpected verification error:', err)
        setState('error')
      }
    }

    verifyEmail()
  }, [searchParams])

  useEffect(() => {
    if (state === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (state === 'success' && countdown === 0) {
      // Redirect to dashboard or appropriate page
      navigate('/platform', { replace: true })
    }
  }, [state, countdown, navigate])

  // Get user email for resend button
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    if (state === 'expired' || state === 'error') {
      getUser()
    }
  }, [state])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {state === 'verifying' && (
            <>
              <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                {t('email_verification.verifying')}
              </h2>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                {t('email_verification.success_title')}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('email_verification.success_message')}
              </p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                {t('email_verification.redirecting', { seconds: countdown })}
              </p>
            </>
          )}

          {state === 'expired' && (
            <>
              <Clock className="mx-auto h-16 w-16 text-orange-500" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                {t('email_verification.expired_title')}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('email_verification.expired_message')}
              </p>
              {userEmail && (
                <div className="mt-6">
                  <ResendVerificationButton email={userEmail} />
                </div>
              )}
              <div className="mt-4">
                <Link
                  to="/login"
                  className="text-primary hover:underline text-sm"
                >
                  {t('email_verification.back_to_login')}
                </Link>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                {t('email_verification.error_title')}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('email_verification.error_message')}
              </p>
              {userEmail && (
                <div className="mt-6">
                  <ResendVerificationButton email={userEmail} />
                </div>
              )}
              <div className="mt-4">
                <Link
                  to="/login"
                  className="text-primary hover:underline text-sm"
                >
                  {t('email_verification.back_to_login')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
