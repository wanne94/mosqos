import { X, AlertTriangle } from 'lucide-react'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'

export interface ConfirmDeleteModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Called when modal is closed */
  onClose: () => void
  /** Called when delete is confirmed */
  onConfirm: () => void
  /** Modal title (e.g., "Delete Member") */
  title?: string
  /** Confirmation message */
  message?: string
  /** Name of item being deleted (shown in bold) */
  itemName?: string
  /** Text for confirm button */
  confirmText?: string
  /** Text for cancel button */
  cancelText?: string
  /** Whether delete action is in progress */
  isLoading?: boolean
}

/**
 * Reusable delete confirmation modal with warning styling
 * Shows a red warning icon and emphasizes the destructive nature of the action
 *
 * @example
 * <ConfirmDeleteModal
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Member"
 *   itemName={member.full_name}
 * />
 */
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete',
  message = 'Are you sure you want to delete this item?',
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmDeleteModalProps) {
  useEscapeKey(onClose, { enabled: isOpen })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full flex-shrink-0">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {message}
              </h3>
              {itemName && (
                <p className="text-slate-600 dark:text-slate-400">
                  This will permanently delete{' '}
                  <strong className="text-slate-900 dark:text-white">{itemName}</strong>{' '}
                  from the system. This action cannot be undone.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
