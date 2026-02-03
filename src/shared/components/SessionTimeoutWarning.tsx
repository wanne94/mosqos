import { useEffect, useState } from 'react'
import { Clock, X, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCountdown, getTimeUntilExpiry } from '@/lib/supabase/auth-helpers'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'

export interface SessionTimeoutWarningProps {
  isOpen: boolean
  onClose: () => void
  onExtend: () => Promise<void>
  onLogout: () => Promise<void>
  initialSeconds?: number
}

/**
 * Session timeout warning modal
 * Shows countdown timer and allows user to extend session or logout
 */
export function SessionTimeoutWarning({
  isOpen,
  onClose,
  onExtend,
  onLogout,
  initialSeconds = 300, // 5 minutes default
}: SessionTimeoutWarningProps) {
  const { t } = useTranslation('common')
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds)
  const [isExtending, setIsExtending] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEscapeKey(onClose, { enabled: isOpen })

  // Update countdown timer every second
  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(initialSeconds)
      return
    }

    // Get actual time remaining from session
    const updateTimeRemaining = async () => {
      const timeRemaining = await getTimeUntilExpiry()
      if (timeRemaining !== null) {
        setSecondsRemaining(timeRemaining)
      }
    }

    updateTimeRemaining()

    const interval = setInterval(async () => {
      const timeRemaining = await getTimeUntilExpiry()

      if (timeRemaining === null || timeRemaining <= 0) {
        clearInterval(interval)
        // Auto-logout when time expires
        handleLogout()
        return
      }

      setSecondsRemaining(timeRemaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, initialSeconds])

  const handleExtend = async () => {
    setIsExtending(true)
    try {
      await onExtend()
      onClose()
    } catch (error) {
      console.error('Failed to extend session:', error)
    } finally {
      setIsExtending(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } catch (error) {
      console.error('Failed to logout:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!isOpen) return null

  const isExpired = secondsRemaining <= 0
  const isWarning = secondsRemaining <= 60 // Last minute warning

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                isExpired
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : isWarning
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}
            >
              {isExpired ? <AlertCircle size={24} /> : <Clock size={24} />}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isExpired
                ? t('session.expired_title')
                : t('session.expiring_title')}
            </h2>
          </div>
          {!isExpired && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Countdown Timer */}
          <div className="flex items-center justify-center mb-6">
            <div
              className={`text-6xl font-bold tabular-nums ${
                isExpired
                  ? 'text-red-600 dark:text-red-400'
                  : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {formatCountdown(secondsRemaining)}
            </div>
          </div>

          {/* Message */}
          <p className="text-slate-700 dark:text-slate-300 text-center mb-6">
            {isExpired ? (
              t('session.expired_message')
            ) : (
              <>
                {t('session.expiring_message')}{' '}
                <span className="font-semibold">
                  {formatCountdown(secondsRemaining)}
                </span>
                .
              </>
            )}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!isExpired && (
              <button
                onClick={handleExtend}
                disabled={isExtending || isLoggingOut}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtending
                  ? t('session.extending')
                  : t('session.extend_button')}
              </button>
            )}
            <button
              onClick={handleLogout}
              disabled={isExtending || isLoggingOut}
              className={`w-full px-4 py-3 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isExpired
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {isLoggingOut
                ? t('session.logging_out')
                : isExpired
                ? t('session.return_to_login')
                : t('session.logout_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionTimeoutWarning
