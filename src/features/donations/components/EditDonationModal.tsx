import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useFormDirty } from '@/shared/hooks/useFormDirty'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useFunds } from '../hooks/useFunds'
import type { PaymentMethod } from '../types/donations.types'

interface Household {
  id: string
  name: string
}

interface DonationFormData {
  household_id: string
  fund_id: string
  amount: string
  payment_method: PaymentMethod
  donation_date: string
}

interface EditDonationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  donationId: string | null
}

export function EditDonationModal({
  isOpen,
  onClose,
  onSave,
  donationId,
}: EditDonationModalProps) {
  const { currentOrganization } = useOrganization()
  const { funds } = useFunds({ organizationId: currentOrganization?.id })
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialFormData, setInitialFormData] = useState<DonationFormData | null>(null)
  const [formData, setFormData] = useState<DonationFormData>({
    household_id: '',
    fund_id: '',
    amount: '',
    payment_method: 'cash' as PaymentMethod,
    donation_date: new Date().toISOString().split('T')[0],
  })
  const isDirty = useFormDirty(formData, initialFormData)

  useEscapeKey(onClose, {
    requireConfirmation: isDirty,
    confirmMessage: 'You have unsaved changes. Are you sure you want to close?',
    enabled: isOpen,
  })

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  useEffect(() => {
    if (isOpen && donationId && currentOrganization) {
      fetchDonationData()
      fetchHouseholds()
    }
  }, [isOpen, donationId, currentOrganization])

  const fetchDonationData = async () => {
    if (!donationId || !currentOrganization) return

    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', donationId)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data && typeof data === 'object') {
        const d = data as any
        const donationDate = d.donation_date
          ? new Date(d.donation_date).toISOString().split('T')[0]
          : d.created_at
          ? new Date(d.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        const initial: DonationFormData = {
          household_id: d.household_id || '',
          fund_id: d.fund_id || '',
          amount: d.amount ? String(d.amount) : '',
          payment_method: (d.payment_method as PaymentMethod) || ('cash' as PaymentMethod),
          donation_date: donationDate,
        }
        setInitialFormData(initial)
        setFormData(initial)
      }
    } catch (err) {
      console.error('Error fetching donation data:', err)
      setError('Failed to load donation data.')
    } finally {
      setFetching(false)
    }
  }

  const fetchHouseholds = async () => {
    if (!currentOrganization) return

    try {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name', { ascending: true })

      if (error) throw error
      setHouseholds(data || [])
    } catch (err) {
      console.error('Error fetching households:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!donationId || !currentOrganization) return

    setLoading(true)
    setError(null)

    try {
      const donationData = {
        household_id: formData.household_id || null,
        fund_id: formData.fund_id || null,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        donation_date: formData.donation_date || new Date().toISOString().split('T')[0],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('donations')
        .update(donationData)
        .eq('id', donationId)
        .eq('organization_id', currentOrganization.id)

      if (error) throw error

      if (onSave) {
        onSave()
      }

      onClose()
    } catch (err) {
      console.error('Error updating donation:', err)
      setError('Failed to update donation.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit Donation</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400">Loading donation data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Household
              </label>
              <select
                name="household_id"
                value={formData.household_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              >
                <option value="">Select a household</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.name || `Household ${household.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fund
              </label>
              <select
                name="fund_id"
                value={formData.fund_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              >
                <option value="">Select a fund</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name || `Fund ${fund.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Donation Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="donation_date"
                value={formData.donation_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
              </select>
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
                disabled={loading || !formData.amount}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
