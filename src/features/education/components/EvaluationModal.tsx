import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface EvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  enrollmentId: string
  memberId: string
  classId: string
}

interface EvaluationFormData {
  score: number
  behavior_notes: string
  evaluation_date: string
}

const initialFormData: EvaluationFormData = {
  score: 0,
  behavior_notes: '',
  evaluation_date: new Date().toISOString().split('T')[0],
}

export default function EvaluationModal({
  isOpen,
  onClose,
  onSave,
  enrollmentId,
  memberId,
  classId,
}: EvaluationModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EvaluationFormData>(initialFormData)
  const isDirty = useFormDirty(formData, initialFormData)

  useEscapeKey(
    onClose,
    isDirty,
    t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?',
    isOpen
  )

  // Handle close with confirmation if form is dirty
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (
        window.confirm(
          t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?'
        )
      ) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose, t])

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData(initialFormData)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      score: parseInt(e.target.value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const evaluationData = {
        organization_id: currentOrganizationId,
        enrollment_id: enrollmentId,
        member_id: memberId,
        class_id: classId,
        score: parseInt(formData.score.toString()),
        behavior_notes: formData.behavior_notes || null,
        evaluation_date: formData.evaluation_date,
      }

      const { error } = await supabase.from('evaluations').insert([evaluationData])

      if (error) throw error

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving evaluation:', error)
      alert(t('common.failedToSaveEvaluation'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 60) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Average'
    if (score >= 60) return 'Below Average'
    return 'Needs Improvement'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Evaluate Student</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Score: {formData.score} / 100
              </label>
              <span className={`text-sm font-semibold ${getScoreColor(formData.score)}`}>
                {getScoreLabel(formData.score)}
              </span>
            </div>
            <input
              type="range"
              name="score"
              min="0"
              max="100"
              value={formData.score}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            <input
              type="number"
              name="score"
              min="0"
              max="100"
              value={formData.score}
              onChange={handleChange}
              className="w-full mt-3 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Or enter score directly"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Evaluation Date *
            </label>
            <input
              type="date"
              name="evaluation_date"
              value={formData.evaluation_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Behavior Notes
            </label>
            <textarea
              name="behavior_notes"
              value={formData.behavior_notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Enter notes about student behavior, participation, progress, etc."
            />
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
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
