import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useOrganization } from '@/hooks/useOrganization'
import type { VisaStatus, TripRegistration } from '../types/umrah.types'

interface UpdateVisaStatusModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  pilgrim: TripRegistration
  currentStatus: VisaStatus
}

export default function UpdateVisaStatusModal({
  isOpen,
  onClose,
  onSave,
  pilgrim,
  currentStatus,
}: UpdateVisaStatusModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [initialStatus, setInitialStatus] = useState<VisaStatus>(currentStatus || 'not_started')
  const [selectedStatus, setSelectedStatus] = useState<VisaStatus>(currentStatus || 'not_started')
  const isDirty = selectedStatus !== initialStatus

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
    if (isOpen && currentStatus) {
      setInitialStatus(currentStatus)
      setSelectedStatus(currentStatus)
    }
  }, [isOpen, currentStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('trip_registrations')
        .update({ visa_status: selectedStatus })
        .eq('id', pilgrim.id)
        .eq('organization_id', currentOrganizationId)

      if (error) throw error

      alert(t('umrah.visaStatusUpdated'))
      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating visa status:', error)
      alert(`Failed to update visa status: ${error instanceof Error ? error.message : t('common.failedToSave')}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !pilgrim) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('umrah.updateVisaStatus')}</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('umrah.visaStatus')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as VisaStatus)}
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
