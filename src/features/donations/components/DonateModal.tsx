import { useState, useEffect } from 'react'
import { X, CreditCard, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useFormDirty } from '@/shared/hooks/useFormDirty'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useFunds } from '../hooks/useFunds'

interface DonateFormData {
  amount: string
  fund_id: string
  donor_name: string
  donor_contact_email: string
  donor_contact_phone: string
  notes: string
}

interface StripeConfig {
  publishableKey: string
}

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  prefillMemberId?: string
}

const initialFormData: DonateFormData = {
  amount: '',
  fund_id: '',
  donor_name: '',
  donor_contact_email: '',
  donor_contact_phone: '',
  notes: '',
}

export function DonateModal({
  isOpen,
  onClose,
  onSuccess,
  prefillMemberId,
}: DonateModalProps) {
  const { currentOrganization } = useOrganization()
  const { funds } = useFunds({ organizationId: currentOrganization?.id })
  const [processingPayment, setProcessingPayment] = useState(false)
  const [formData, setFormData] = useState<DonateFormData>(initialFormData)
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isDirty = useFormDirty(formData, initialFormData)

  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (confirmClose) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  useEscapeKey(handleClose, { enabled: isOpen })

  useEffect(() => {
    if (isOpen && currentOrganization) {
      fetchStripeConfig()

      if (prefillMemberId) {
        fetchMemberInfo(prefillMemberId)
      } else {
        setFormData(initialFormData)
      }
    }
  }, [isOpen, prefillMemberId, currentOrganization])

  const fetchMemberInfo = async (memberId: string) => {
    if (!currentOrganization) return

    try {
      const { data: member, error } = await supabase
        .from('organization_members')
        .select('first_name, last_name, email, phone')
        .eq('id', memberId)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (member && typeof member === 'object') {
        const m = member as any
        setFormData({
          ...initialFormData,
          donor_name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
          donor_contact_email: m.email || '',
          donor_contact_phone: m.phone || '',
        })
      }
    } catch (err) {
      console.error('Error fetching member info:', err)
      setFormData(initialFormData)
    }
  }

  const fetchStripeConfig = async () => {
    if (!currentOrganization) return

    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('stripe_publishable_key, payment_provider')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle()

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data && typeof data === 'object') {
        const settings = data as any
        if (settings.payment_provider === 'stripe' && settings.stripe_publishable_key) {
          setStripeConfig({
            publishableKey: settings.stripe_publishable_key,
          })
        } else {
          setError('Payment processing is not configured.')
        }
      } else {
        setError('Payment processing is not configured.')
      }
    } catch (err) {
      console.error('Error fetching Stripe config:', err)
      setError('Failed to load payment configuration.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid donation amount.')
      return
    }

    if (!formData.fund_id) {
      setError('Please select a fund.')
      return
    }

    if (!stripeConfig?.publishableKey) {
      setError('Payment processing is not configured.')
      return
    }

    setProcessingPayment(true)
    setError(null)

    try {
      // This is a placeholder - in production you'd call your payment API
      // const response = await fetch('/api/create-checkout-session', { ... })

      // For now, just show success message
      alert('Payment integration would be completed here. This is a demo.')

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Error processing payment:', err)
      setError('Failed to process payment. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard size={24} />
            Make Donation
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            disabled={processingPayment}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Donation Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                placeholder="0.00"
                disabled={processingPayment}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fund <span className="text-red-500">*</span>
            </label>
            <select
              name="fund_id"
              value={formData.fund_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              disabled={processingPayment}
            >
              <option value="">Select fund</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              name="donor_name"
              value={formData.donor_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              placeholder="John Doe"
              disabled={processingPayment}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="donor_contact_email"
              value={formData.donor_contact_email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              placeholder="john@example.com"
              disabled={processingPayment}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="donor_contact_phone"
              value={formData.donor_contact_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              placeholder="(555) 123-4567"
              disabled={processingPayment}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              placeholder="Any additional notes..."
              disabled={processingPayment}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              disabled={processingPayment}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processingPayment || !stripeConfig}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processingPayment ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Continue to Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
