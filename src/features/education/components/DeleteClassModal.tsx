import { X, AlertTriangle } from 'lucide-react'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'

interface DeleteClassModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  className: string
}

export default function DeleteClassModal({
  isOpen,
  onClose,
  onConfirm,
  className,
}: DeleteClassModalProps) {
  useEscapeKey(onClose, { enabled: isOpen })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100">Delete Course</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">
                Are you sure you want to delete this class?
              </h3>
              <p className="text-slate-600 dark:text-gray-400">
                This will permanently delete <strong>{className}</strong> and all associated enrollments. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
