'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { Plus, DollarSign, FileText, Edit, Download } from 'lucide-react'
import { LogExpenseModal } from '@/features/donations/components/LogExpenseModal'
import { EditExpenseModal } from '@/features/donations/components/EditExpenseModal'

interface Expense {
  id: string
  organization_id: string
  fund_id: string | null
  amount: number
  category: string
  description: string | null
  expense_date: string
  created_at: string
  funds?: {
    id: string
    name: string
  }
}

export default function ExpensesPage() {
  const { currentOrganization } = useOrganization()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)

  const { data: expenses = [], isLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return []
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          funds:fund_id (
            id,
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('expense_date', { ascending: false })

      if (error) throw error

      return (data as Expense[]) || []
    },
    enabled: !!currentOrganization?.id,
  })

  const handleEditExpense = (expenseId: string) => {
    setSelectedExpenseId(expenseId)
    setIsEditModalOpen(true)
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
      'Utilities': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'Salary': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      'Maintenance': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'Event Cost': 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      'Charity Distribution': 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
    }
    return colors[category] || 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (parseFloat(String(expense.amount)) || 0),
    0
  )

  const handleExportToExcel = useCallback(() => {
    if (expenses.length === 0) return

    const headers = ['Date', 'Fund', 'Category', 'Description', 'Amount']
    const rows = expenses.map(expense => [
      formatDate(expense.expense_date),
      expense.funds?.name || '',
      expense.category,
      expense.description || '',
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

  return (
    <div className="p-8 animate-page-enter">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Expenses</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Track and manage organization expenses</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            Log Expense
          </button>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <DollarSign className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
            <div className="text-slate-600 dark:text-slate-400">Loading expenses...</div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
            <FileText className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No expenses found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">No expenses have been logged yet.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={18} />
              Log First Expense
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Expenses</h3>
              <button
                onClick={handleExportToExcel}
                className="p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                title="Export to Excel"
              >
                <Download size={18} className="text-slate-700 dark:text-slate-300" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Fund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Actions
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
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                            expense.category
                          )}`}
                        >
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {expense.description || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditExpense(expense.id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
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

      <LogExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => refetchExpenses()}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedExpenseId(null)
        }}
        onSave={() => refetchExpenses()}
        expenseId={selectedExpenseId}
      />
    </div>
  )
}
