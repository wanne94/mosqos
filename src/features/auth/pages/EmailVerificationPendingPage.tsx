import { useTranslation } from 'react-i18next'
import { Mail, LogOut } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { ResendVerificationButton } from '../components/ResendVerificationButton'

export default function EmailVerificationPendingPage() {
  const { t } = useTranslation('auth')
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {t('email_verification.pending_title')}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('email_verification.pending_message')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">
              {t('email_verification.check_inbox', { email: user.email })}
            </p>
            <p className="text-xs mt-4 text-gray-500 dark:text-gray-500">
              {t('email_verification.no_email')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t('email_verification.check_spam')}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <ResendVerificationButton email={user.email || ''} className="w-full" />
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            {t('email_verification.logout_button')}
          </button>
        </div>
      </div>
    </div>
  )
}
