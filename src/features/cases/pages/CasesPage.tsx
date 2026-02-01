import { useState, useMemo, useCallback } from 'react'
import { Plus, DollarSign, FileText, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { CaseModal } from '../components'
import { useCases } from '../hooks'
import type { ServiceCase } from '../types'

interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

export default function CasesPage() {
  const { currentOrganization } = useOrganization()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [sortState, setSortState] = useState<SortState>({
    column: 'date',
    direction: 'desc',
  })

  // Use the cases hook
  const {
    cases,
    isLoading,
    stats,
    refetch,
  } = useCases({ organizationId: currentOrganization?.id })

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const formatCurrency = useCallback((amount: number | null) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }, [])

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'Financial Assistance (Zakat)': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      'Food Pantry': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      'Housing': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      'Medical': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      'Marriage (Nikkah)': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      'Funeral (Janazah)': 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300',
      'Education': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      'Counseling': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    }
    return colors[category || ''] || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
  }

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      'Open': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'Closed': 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-200',
      'Cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    }
    return colors[status || ''] || 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-200'
  }

  const sortCases = useCallback((a: ServiceCase, b: ServiceCase, column: string, direction: 'asc' | 'desc') => {
    let aValue: string | number, bValue: string | number

    switch (column) {
      case 'date':
        aValue = new Date(a.created_at || 0).getTime()
        bValue = new Date(b.created_at || 0).getTime()
        break
      case 'member':
        aValue = a.member
          ? `${a.member.first_name || ''} ${a.member.last_name || ''}`.toLowerCase().trim()
          : ''
        bValue = b.member
          ? `${b.member.first_name || ''} ${b.member.last_name || ''}`.toLowerCase().trim()
          : ''
        break
      case 'category':
        aValue = (a.category || '').toLowerCase()
        bValue = (b.category || '').toLowerCase()
        break
      case 'type':
        aValue = (a.case_type || 'Assistance').toLowerCase()
        bValue = (b.case_type || 'Assistance').toLowerCase()
        break
      case 'amount':
        aValue = a.requested_amount || 0
        bValue = b.requested_amount || 0
        break
      case 'status':
        aValue = (a.status || 'open').toLowerCase()
        bValue = (b.status || 'open').toLowerCase()
        break
      default:
        return 0
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  }, [])

  const handleSort = (column: string) => {
    setSortState((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortIcon = (column: string) => {
    if (sortState.column !== column) {
      return <ArrowUpDown size={14} className="text-slate-400 dark:text-slate-500" />
    }
    return sortState.direction === 'asc'
      ? <ArrowUp size={14} className="text-emerald-600 dark:text-emerald-400" />
      : <ArrowDown size={14} className="text-emerald-600 dark:text-emerald-400" />
  }

  // Filter and sort cases
  const sortedCases = useMemo(() => {
    if (cases.length === 0) return cases

    return [...cases].sort((a, b) => sortCases(a, b, sortState.column, sortState.direction))
  }, [cases, sortState.column, sortState.direction, sortCases])

  // Use stats from hook if available, fallback to local calculation
  const totalCases = stats?.total_cases ?? sortedCases.length
  const totalAssistance = stats?.total_disbursed ?? sortedCases
    .filter((caseItem) => (caseItem.case_type || 'Assistance') === 'Assistance' && caseItem.status !== 'cancelled')
    .reduce((sum, caseItem) => sum + (caseItem.requested_amount || 0), 0)
  const totalCollected = stats?.total_approved ?? sortedCases
    .filter((caseItem) => caseItem.case_type === 'Collection' && caseItem.status !== 'cancelled')
    .reduce((sum, caseItem) => sum + (caseItem.requested_amount || 0), 0)

  const handleEditCase = (caseId: string) => {
    setSelectedCaseId(caseId)
    setIsModalOpen(true)
  }

  const handleAddCase = () => {
    setSelectedCaseId(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCaseId(null)
  }

  const handleSaveSuccess = () => {
    refetch()
    handleCloseModal()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Case Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
              Manage service cases and assistance requests
            </p>
          </div>
          <button
            onClick={handleAddCase}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base"
          >
            <Plus size={18} />
            New Case
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
                <FileText className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Cases</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCases}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <DollarSign className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Assistance</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalAssistance)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
                <DollarSign className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Collected</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCollected)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
            <div className="text-slate-600 dark:text-slate-400">Loading cases...</div>
          </div>
        ) : sortedCases.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
            <FileText className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Cases Found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">No service cases have been recorded yet.</p>
            <button
              onClick={handleAddCase}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={18} />
              Add First Case
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-end">
              <button
                className="p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                title="Export to Excel"
              >
                <Download size={18} className="text-slate-700 dark:text-slate-300" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none"
                      onClick={() => handleSort('member')}
                    >
                      <div className="flex items-center gap-2">
                        Member
                        {getSortIcon('member')}
                      </div>
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-2">
                        Category
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        {getSortIcon('amount')}
                      </div>
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {sortedCases.map((caseItem) => (
                    <tr
                      key={caseItem.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onClick={() => handleEditCase(caseItem.id)}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                        {formatDate(caseItem.created_at)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {caseItem.member ? (
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                              {caseItem.member.first_name} {caseItem.member.last_name}
                            </div>
                            {caseItem.member.email && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                {caseItem.member.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                            caseItem.category
                          )}`}
                        >
                          {caseItem.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-200">
                        {formatCurrency(caseItem.requested_amount)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            caseItem.status as any
                          )}`}
                        >
                          {caseItem.status || 'Open'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCase(caseItem.id)
                          }}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
        caseId={selectedCaseId}
      />
    </div>
  )
}
