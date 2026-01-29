import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { X, Calendar, FileText } from 'lucide-react'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface EvaluationHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  classId: string
  studentName: string
  className: string
}

interface Evaluation {
  id: string
  score: number
  behavior_notes: string | null
  evaluation_date: string
}

export default function EvaluationHistoryModal({
  isOpen,
  onClose,
  memberId,
  classId,
  studentName,
  className,
}: EvaluationHistoryModalProps) {
  const { currentOrganizationId } = useOrganization()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEscapeKey(onClose, false, '', isOpen)

  useEffect(() => {
    if (isOpen && memberId) {
      fetchEvaluations()
    }
  }, [isOpen, memberId])

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('member_id', memberId)
        .eq('organization_id', currentOrganizationId)
        .order('evaluation_date', { ascending: false })

      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Error fetching evaluations:', error)
      setEvaluations([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    if (score >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Average'
    if (score >= 60) return 'Below Average'
    return 'Needs Improvement'
  }

  const averageScore =
    evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
      : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Evaluation History</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {studentName} - {className}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">Loading evaluations...</div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Evaluations Found</h3>
              <p className="text-slate-600 dark:text-slate-400">No evaluations have been recorded for this student yet.</p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Evaluations</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{evaluations.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Average Score</p>
                    <p
                      className={`text-2xl font-bold ${
                        averageScore >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : averageScore >= 80
                          ? 'text-blue-600 dark:text-blue-400'
                          : averageScore >= 70
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : averageScore >= 60
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {averageScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Latest Score</p>
                    <p
                      className={`text-2xl font-bold ${
                        evaluations[0].score >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : evaluations[0].score >= 80
                          ? 'text-blue-600 dark:text-blue-400'
                          : evaluations[0].score >= 70
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : evaluations[0].score >= 60
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {evaluations[0].score}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evaluations List */}
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md dark:hover:bg-slate-700/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                          <Calendar className="text-slate-600 dark:text-slate-400" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {formatDate(evaluation.evaluation_date)}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {getScoreLabel(evaluation.score)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(
                            evaluation.score
                          )}`}
                        >
                          {evaluation.score}
                        </span>
                      </div>
                    </div>
                    {evaluation.behavior_notes && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {evaluation.behavior_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
