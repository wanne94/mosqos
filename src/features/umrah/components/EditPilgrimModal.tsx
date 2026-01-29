import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '@/hooks/useFormDirty'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useOrganization } from '@/hooks/useOrganization'
import type { VisaStatus, PaymentStatus } from '../types/umrah.types'

interface EditPilgrimModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  pilgrimId: string
}

interface FormData {
  visa_status: VisaStatus
  payment_status: PaymentStatus
}

export default function EditPilgrimModal({ isOpen, onClose, onSave, pilgrimId }: EditPilgrimModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    visa_status: 'not_started' as VisaStatus,
    payment_status: 'pending' as PaymentStatus,
  })
  const isDirty = useFormDirty(formData, initialFormData)

  useEscapeKey(
    onClose,
    isDirty,
    t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?',
    isOpen
  )

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm(t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose, t])

  useEffect(() => {
    if (isOpen && pilgrimId) {
      fetchPilgrimData()
    }
  }, [isOpen, pilgrimId])

  const fetchPilgrimData = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('trip_registrations')
        .select('*')
        .eq('id', pilgrimId)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (error) throw error

      if (data) {
        const initial: FormData = {
          visa_status: (data.visa_status as VisaStatus) || 'not_started',
          payment_status: (data.payment_status as PaymentStatus) || 'pending',
        }
        setInitialFormData(initial)
        setFormData(initial)
      }
    } catch (error) {
      console.error('Error fetching pilgrim data:', error)
      alert(t('common.failedToLoadPilgrimData'))
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('trip_registrations')
        .update({
          visa_status: formData.visa_status,
          payment_status: formData.payment_status,
        })
        .eq('id', pilgrimId)
        .eq('organization_id', currentOrganizationId)

      if (error) throw error

      alert(t('common.pilgrimUpdatedSuccess'))
      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating pilgrim:', error)
      alert(t('common.failedToUpdate'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Pilgrim</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400">Loading pilgrim data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Visa Status *
              </label>
              <select
                name="visa_status"
                value={formData.visa_status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="not_started">Not Started</option>
                <option value="documents_submitted">Documents Submitted</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="issued">Issued</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payment Status *
              </label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="deposit_paid">Deposit Paid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
