import { useState, useEffect } from 'react'
import { Plus, Calendar, DollarSign, FileText, Edit, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import CaseModal from './CaseModal'
import type { CaseStatus } from '../types/cases.types'

interface CaseHistoryTabProps {
  memberId: string
  canEdit?: boolean
}

interface CaseSummary {
  totalAssistance: number
  moneyIn: number
  moneyOut: number
  lastAssistanceDate: string | null
  caseCount: number
}

export default function CaseHistoryTab({
  memberId,
  canEdit = true,
}: CaseHistoryTabProps) {
  const { currentOrganizationId } = useOrganization()
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [summary, setSummary] = useState<CaseSummary>({
    totalAssistance: 0,
    moneyIn: 0,
    moneyOut: 0,
    lastAssistanceDate: null,
    caseCount: 0,
  })

  useEffect(() => {
    if (memberId) {
      fetchCases()
    }
  }, [memberId])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_cases')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCases(data || [])

      // Calculate summary (exclude cancelled cases)
      const nonCancelledCases = (data || []).filter((c: any) => c.status !== 'cancelled')
      const total = nonCancelledCases.reduce(
        (sum: number, c: any) => sum + (parseFloat(String(c.requested_amount || 0))),
        0
      )

      const moneyIn = nonCancelledCases
        .filter((c: any) => c.case_type === 'Collection')
        .reduce((sum: number, c: any) => sum + (parseFloat(String(c.requested_amount || 0))), 0)

      const moneyOut = nonCancelledCases
        .filter((c: any) => (c.case_type || 'Assistance') === 'Assistance')
        .reduce((sum: number, c: any) => sum + (parseFloat(String(c.requested_amount || 0))), 0)

      const lastDate = nonCancelledCases.length > 0 ? nonCancelledCases[0].created_at : null

      setSummary({
        totalAssistance: total,
        moneyIn,
        moneyOut,
        lastAssistanceDate: lastDate,
        caseCount: (data || []).length,
      })
    } catch (error) {
      console.error('Error fetching cases:', error)
      setCases([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'Financial Assistance': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'Food Pantry': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'Housing': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      'Medical': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'Marriage': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      'Funeral': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
      'Education': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'Counseling': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return colors[category || ''] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
  }

  const getStatusColor = (status: CaseStatus) => {
    const colors: Record<CaseStatus, string> = {
      open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return colors[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
  }

  const handleAddCase = () => {
    setSelectedCaseId(null)
    setIsModalOpen(true)
  }

  const handleEditCase = (caseId: string) => {
    setSelectedCaseId(caseId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCaseId(null)
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-600 dark:text-slate-400">
        Loading case history...
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
            <FileText size={18} />
            <span className="text-sm font-medium">Total Cases</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.caseCount}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
            <DollarSign size={18} />
            <span className="text-sm font-medium">Total Volume</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">In:</span>
              <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.moneyIn)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Out:</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(summary.moneyOut)}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
            <Calendar size={18} />
            <span className="text-sm font-medium">Last Assisted</span>
          </div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {summary.lastAssistanceDate ? formatDate(summary.lastAssistanceDate) : 'Never'}
          </div>
        </div>
      </div>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Case History</h3>
        {canEdit && (
          <button
            onClick={handleAddCase}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            Add Case
          </button>
        )}
      </div>

      {/* Cases List */}
      {cases.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-700">
          <FileText className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Case History</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No cases have been recorded for this member yet.
          </p>
          {canEdit && (
            <button
              onClick={handleAddCase}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={18} />
              Add First Case
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 transition-shadow ${
                canEdit ? 'hover:shadow-md cursor-pointer group' : ''
              }`}
              onClick={canEdit ? () => handleEditCase(caseItem.id) : undefined}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(caseItem.category)}`}>
                    {caseItem.category}
                  </span>
                  {caseItem.requested_amount && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(caseItem.requested_amount)}
                      </span>
                      <span
                        className={`p-1 rounded ${
                          caseItem.case_type === 'Collection'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        {caseItem.case_type === 'Collection' ? (
                          <ArrowUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowDown size={14} className="text-red-600 dark:text-red-400" />
                        )}
                      </span>
                    </div>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(caseItem.created_at)}
                  </div>
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCase(caseItem.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                      title="Edit case"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <h4 className="font-medium text-slate-900 dark:text-white">{caseItem.title}</h4>
              </div>

              {caseItem.description && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {caseItem.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={fetchCases}
        caseId={selectedCaseId}
        memberId={memberId}
        showAmountField={false}
      />
    </div>
  )
}
