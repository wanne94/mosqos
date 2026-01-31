import { useTranslation } from 'react-i18next'
import { AlertTriangle, X } from 'lucide-react'
import type { IslamicService } from '../types/islamic-services.types'

interface DeleteServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  service: IslamicService | null
  isDeleting?: boolean
}

export default function DeleteServiceModal({
  isOpen,
  onClose,
  onConfirm,
  service,
  isDeleting,
}: DeleteServiceModalProps) {
  const { t } = useTranslation()

  if (!isOpen || !service) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('services.deleteService') || 'Delete Service'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {t('services.deleteConfirmation') || 'Are you sure you want to delete this service record? This action cannot be undone.'}
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
              {service.case_number}
            </p>
            <p className="font-medium text-slate-900 dark:text-white">
              {service.service_type?.name || 'Service'}
            </p>
            {service.requestor_name && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {service.requestor_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting
              ? (t('common.deleting') || 'Deleting...')
              : (t('common.delete') || 'Delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
