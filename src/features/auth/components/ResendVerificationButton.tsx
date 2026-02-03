import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

interface ResendVerificationButtonProps {
  email: string
  className?: string
}

export function ResendVerificationButton({ email, className = '' }: ResendVerificationButtonProps) {
  const { t } = useTranslation('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) throw error

      toast.success(t('email_verification.resend_success'))
      setCooldown(60) // 60 second cooldown
    } catch (error) {
      console.error('Error resending verification email:', error)
      toast.error(t('email_verification.resend_error'))
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || cooldown > 0

  return (
    <button
      onClick={handleResend}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition ${
        isDisabled
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-primary text-primary-foreground hover:opacity-90'
      } ${className}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {cooldown > 0 ? (
        t('email_verification.resend_cooldown', { seconds: cooldown })
      ) : isLoading ? (
        t('email_verification.resending')
      ) : (
        t('email_verification.resend_button')
      )}
    </button>
  )
}
