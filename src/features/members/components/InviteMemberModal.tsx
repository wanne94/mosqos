import { useState, useEffect, useCallback } from 'react'
import { X, Mail, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFormDirty } from '@/shared/hooks'
import { useEscapeKey } from '@/shared/hooks'

export interface InviteMemberModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Called when modal is closed */
  onClose: () => void
  /** Organization slug for redirect URL */
  organizationSlug: string
}

const initialFormData = { email: '' }

/**
 * Modal for inviting new members via email
 * Sends a magic link invitation to join the organization
 *
 * @example
 * <InviteMemberModal
 *   isOpen={showInvite}
 *   onClose={() => setShowInvite(false)}
 *   organizationSlug="my-mosque"
 * />
 */
export function InviteMemberModal({
  isOpen,
  onClose,
  organizationSlug,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const isDirty = useFormDirty({ email }, initialFormData)

  const handleClose = useCallback(() => {
    if (isDirty && !success) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (confirmClose) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, success, onClose])

  useEscapeKey(handleClose, { enabled: isOpen })

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setError('')
      setSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Use OTP (magic link) to invite new users
      // This sends an email with a magic link that allows them to sign up
      const redirectUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(`/${organizationSlug}/join`)}`

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      })

      if (otpError) {
        // If OTP fails, it might be because user already exists
        if (
          otpError.message?.includes('already registered') ||
          otpError.message?.includes('already exists')
        ) {
          // User exists, send password reset email instead
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
          })
          if (resetError) throw resetError
        } else {
          throw new Error(
            `Unable to send invitation: ${otpError.message || 'Please check your Supabase email settings.'}`
          )
        }
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setEmail('')
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Invite error:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send invitation. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="text-emerald-600 dark:text-emerald-400" size={24} />
            Invite Member
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <Send className="text-emerald-600 dark:text-emerald-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Invitation Sent!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We've sent an invitation email to <strong>{email}</strong>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              They'll receive a magic link to create their account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="member@example.com"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                We'll send them an email with instructions to create their account and profile.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={18} />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default InviteMemberModal
