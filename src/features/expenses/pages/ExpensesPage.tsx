'use client'

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  DollarSign,
  FileText,
  Edit,
  Download,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '@/hooks/useOrganization'
import { useExpenses, useUsedExpenseCategories } from '../hooks'
import { useFunds } from '@/features/donations/hooks'
import type { ExpenseStatus, ExpenseFilters } from '../types'

// Import modals from donations for now (will be moved later)
import { LogExpenseModal } from '@/features/donations/components/LogExpenseModal'
import { EditExpenseModal } from '@/features/donations/components/EditExpenseModal'

export default function ExpensesPage() {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const { funds } = useFunds({ organizationId: currentOrganizationId })
  const { data: usedCategories = [] } = useUsedExpenseCategories(currentOrganizationId)

  // Filters
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Use new hook
  const { expenses, isLoading, deleteExpense, isDeleting, refetch } = useExpenses({
    organizationId: currentOrganizationId || undefined,
    filters: {
      ...filters,
      searchTerm: searchTerm || undefined,
    },
  })

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleEditExpense = (expenseId: string) => {
    setSelectedExpenseId(expenseId)
    setIsEditModalOpen(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId)
      toast.success(t('expenses.deleted', 'Expense deleted successfully'))
      setDeleteConfirmId(null)
    } catch (error: any) {
      toast.error(t('expenses.deleteError', 'Failed to delete expense'), {
        description: error.message,
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Utilities: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      Salary: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      Payroll: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      Maintenance: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'Event Cost': 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      Events: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      'Charity Distribution':
        'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
      'Charity/Zakat Distribution':
        'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
      Supplies: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      Insurance: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      'Professional Services': 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
      'Office Expenses': 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
      Education: 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
    }
    return colors[category] || 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
  }

  const getStatusBadge = (status: ExpenseStatus) => {
    const badges: Record<ExpenseStatus, { icon: React.ReactNode; color: string; label: string }> = {
      pending: {
        icon: <Clock size={14} />,
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
        label: t('expenses.status.pending', 'Pending'),
      },
      approved: {
        icon: <CheckCircle size={14} />,
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
        label: t('expenses.status.approved', 'Approved'),
      },
      rejected: {
        icon: <XCircle size={14} />,
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
        label: t('expenses.status.rejected', 'Rejected'),
      },
      paid: {
        icon: <CreditCard size={14} />,
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
        label: t('expenses.status.paid', 'Paid'),
      },
      cancelled: {
        icon: <XCircle size={14} />,
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        label: t('expenses.status.cancelled', 'Cancelled'),
      },
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    )
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (parseFloat(String(expense.amount)) || 0),
    0
  )

  const handleExportToExcel = useCallback(() => {
    if (expenses.length === 0) return

    const headers = ['Date', 'Fund', 'Category', 'Description', 'Vendor', 'Status', 'Amount']
    const rows = expenses.map((expense) => [
      formatDate(expense.expense_date),
      expense.funds?.name || '',
      expense.category || '',
      expense.description || '',
      expense.vendor || '',
      expense.status,
      formatCurrency(expense.amount),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [expenses])

  const handleFilterChange = (key: keyof ExpenseFilters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchTerm

  return (
    <div className="p-8 animate-page-enter">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t('expenses.title', 'Expenses')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {t('expenses.subtitle', 'Track and manage organization expenses')}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            {t('expenses.logExpense', 'Log Expense')}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('expenses.search', 'Search expenses...')}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Filter size={18} />
            {t('common.filters', 'Filters')}
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fund Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('expenses.fund', 'Fund')}
                </label>
                <select
                  value={filters.fundId || ''}
                  onChange={(e) => handleFilterChange('fundId', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('expenses.category', 'Category')}
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {usedCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('expenses.status', 'Status')}
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value as ExpenseStatus)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  <option value="pending">{t('expenses.status.pending', 'Pending')}</option>
                  <option value="approved">{t('expenses.status.approved', 'Approved')}</option>
                  <option value="paid">{t('expenses.status.paid', 'Paid')}</option>
                  <option value="rejected">{t('expenses.status.rejected', 'Rejected')}</option>
                  <option value="cancelled">{t('expenses.status.cancelled', 'Cancelled')}</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('expenses.dateFrom', 'Date From')}
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {t('common.clearFilters', 'Clear filters')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <DollarSign className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('expenses.totalExpenses', 'Total Expenses')}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {expenses.length} {t('expenses.records', 'records')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
            <div className="text-slate-600 dark:text-slate-400 mt-4">
              {t('common.loading', 'Loading...')}
            </div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
            <FileText className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {hasActiveFilters
                ? t('expenses.noExpensesFiltered', 'No expenses match your filters')
                : t('expenses.noExpenses', 'No expenses found')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {hasActiveFilters
                ? t('expenses.tryDifferentFilters', 'Try adjusting your filters')
                : t('expenses.noExpensesYet', 'No expenses have been logged yet.')}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
                {t('expenses.logFirstExpense', 'Log First Expense')}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('expenses.title', 'Expenses')}
              </h3>
              <button
                onClick={handleExportToExcel}
                className="p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                title={t('expenses.export', 'Export to CSV')}
              >
                <Download size={18} className="text-slate-700 dark:text-slate-300" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t('expenses.date', 'Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t('expenses.fund', 'Fund')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t('expenses.category', 'Category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t('expenses.description', 'Description')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t('expenses.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t('expenses.amount', 'Amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {expense.funds?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.category ? (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                              expense.category
                            )}`}
                          >
                            {expense.category}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white max-w-xs truncate">
                        {expense.description || expense.vendor || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(expense.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditExpense(expense.id)}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                            title={t('common.edit', 'Edit')}
                          >
                            <Edit size={18} />
                          </button>
                          {deleteConfirmId === expense.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                disabled={isDeleting}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded disabled:opacity-50"
                              >
                                {isDeleting ? '...' : t('common.confirm', 'Confirm')}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-slate-600 dark:text-slate-400 text-xs px-2 py-1"
                              >
                                {t('common.cancel', 'Cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(expense.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                              title={t('common.delete', 'Delete')}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <LogExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => refetch()}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedExpenseId(null)
        }}
        onSave={() => refetch()}
        expenseId={selectedExpenseId}
      />
    </div>
  )
}
