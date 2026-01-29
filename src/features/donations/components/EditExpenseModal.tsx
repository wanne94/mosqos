import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useFormDirty } from '@/shared/hooks/useFormDirty'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useFunds } from '../hooks/useFunds'

const EXPENSE_CATEGORIES = [
  'Utilities',
  'Salary',
  'Maintenance',
  'Event Cost',
  'Charity Distribution',
] as const

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

interface ExpenseFormData {
  fund_id: string
  category: ExpenseCategory
  amount: string
  description: string
  expense_date: string
}

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  expenseId: string | null
}

export function EditExpenseModal({ isOpen, onClose, onSave, expenseId }: EditExpenseModalProps) {
  const { currentOrganization } = useOrganization()
  const { funds } = useFunds({ organizationId: currentOrganization?.id })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialFormData, setInitialFormData] = useState<ExpenseFormData | null>(null)
  const [formData, setFormData] = useState<ExpenseFormData>({
    fund_id: '',
    category: 'Utilities',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  })
  const isDirty = useFormDirty(formData, initialFormData)

  useEscapeKey(onClose, {
    requireConfirmation: isDirty,
    confirmMessage: 'You have unsaved changes. Are you sure you want to close?',
    enabled: isOpen,
  })

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  useEffect(() => {
    if (isOpen && expenseId && currentOrganization) {
      fetchExpenseData()
    }
  }, [isOpen, expenseId, currentOrganization])

  const fetchExpenseData = async () => {
    if (!expenseId || !currentOrganization) return

    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data && typeof data === 'object') {
        const e = data as any
        const expenseDate = e.expense_date
          ? new Date(e.expense_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        const initial: ExpenseFormData = {
          fund_id: e.fund_id || '',
          category: (e.category as ExpenseCategory) || 'Utilities',
          amount: e.amount ? String(e.amount) : '',
          description: e.description || '',
          expense_date: expenseDate,
        }
        setInitialFormData(initial)
        setFormData(initial)
      }
    } catch (err) {
      console.error('Error fetching expense data:', err)
      setError('Failed to load expense data.')
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseId || !currentOrganization) return

    setLoading(true)
    setError(null)

    try {
      const expenseData = {
        fund_id: formData.fund_id || null,
        category: formData.category,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        description: formData.description || null,
        expense_date: formData.expense_date || null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('expenses')
        .update(expenseData)
        .eq('id', expenseId)
        .eq('organization_id', currentOrganization.id)

      if (error) throw error

      if (onSave) {
        setTimeout(() => {
          onSave()
        }, 500)
      }

      window.dispatchEvent(new CustomEvent('expenseUpdated'))

      onClose()
    } catch (err) {
      console.error('Error updating expense:', err)
      setError('Failed to update expense.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit Expense</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fund <span className="text-red-500">*</span>
              </label>
              <select
                name="fund_id"
                value={formData.fund_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              >
                <option value="">Select fund</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name || `Fund ${fund.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                placeholder="e.g., Imam Salary, Electric Bill"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
