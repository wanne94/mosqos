import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface DeleteCaseModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  caseId: string
  caseTitle: string
}

export default function DeleteCaseModal({
  isOpen,
  onClose,
  onDelete,
  caseId,
  caseTitle,
}: DeleteCaseModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('service_cases')
        .delete()
        .eq('id', caseId)

      if (deleteError) throw deleteError

      onDelete()
      onClose()
    } catch (err) {
      console.error('Error deleting case:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete case')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Delete Case
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Warning Icon */}
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center">
            <p className="text-slate-700 dark:text-slate-300 mb-2">
              Are you sure you want to delete this case?
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
              "{caseTitle}"
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This action cannot be undone. All case data, including notes and history, will be permanently removed.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
