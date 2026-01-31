import { useTranslation } from 'react-i18next'
import { AlertTriangle, X } from 'lucide-react'
import type { Announcement } from '../types/announcements.types'

interface DeleteAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  announcement: Announcement | null
  isDeleting?: boolean
}

export default function DeleteAnnouncementModal({
  isOpen,
  onClose,
  onConfirm,
  announcement,
  isDeleting,
}: DeleteAnnouncementModalProps) {
  const { t, i18n } = useTranslation()

  if (!isOpen || !announcement) return null

  const currentLang = i18n.language as 'en' | 'ar' | 'tr'
  const title = announcement.title[currentLang] || announcement.title.en || 'Untitled'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('announcements.deleteAnnouncement') || 'Delete Announcement'}
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
            {t('announcements.deleteConfirmation') || 'Are you sure you want to delete this announcement? This action cannot be undone.'}
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <p className="font-medium text-slate-900 dark:text-white">{title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-1">
              {t(`announcements.status.${announcement.status}`) || announcement.status}
            </p>
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
