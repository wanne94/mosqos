'use client'

import { useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { FileText, Filter, Download } from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useUrlParam } from '@/shared/hooks/useUrlState'

// Types
interface Transaction {
  id: string
  type: 'Income' | 'Expense'
  date: string
  description: string
  category: string
  fund: string
  fund_id: string | null
  amount: number
  payment_method?: string
}

interface Donation {
  id: string
  donation_date?: string
  created_at: string
  date?: string
  amount: number
  payment_method?: string
  fund_id: string | null
  donor_name?: string
  name?: string
  households?: {
    id: string
    name: string
  } | null
  funds?: {
    id: string
    name: string
  } | null
}

interface Expense {
  id: string
  expense_date?: string
  created_at: string
  amount: number
  fund_id: string | null
  description?: string
  category?: string
  funds?: {
    id: string
    name: string
  } | null
}

interface Fund {
  id: string
  name: string
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.language || 'en'
  const { currentOrganization } = useOrganization()

  // URL state for filter persistence
  const [month, setMonth] = useUrlParam('month', '')
  const [fundId, setFundId] = useUrlParam('fund_id', '')

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    month,
    fund_id: fundId
  }), [month, fundId])

  // Fetch funds
  const { data: funds = [] } = useQuery<Fund[]>({
    queryKey: ['funds', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return []

      const { data, error } = await supabase
        .from('funds')
        .select('id, name')
        .eq('organization_id', currentOrganization.id)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!currentOrganization?.id
  })

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', currentOrganization?.id, filters.month, filters.fund_id],
    queryFn: async () => {
      if (!currentOrganization?.id) return []

      // Fetch donations with joined data
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select(`
          *,
          households:household_id (
            id,
            name
          ),
          funds:fund_id (
            id,
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)

      if (donationsError) {
        console.error('Error fetching donations:', donationsError)
      }

      // Fetch expenses with joined data
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          funds:fund_id (
            id,
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError)
      }

      // Combine and transform data
      const combinedTransactions: Transaction[] = []

      // Process donations as Income
      const donationsArray = (donations || []) as unknown as Donation[]
      donationsArray.forEach((donation) => {
        combinedTransactions.push({
          id: donation.id,
          type: 'Income',
          date: donation.donation_date || donation.created_at || donation.date || '',
          description: donation.households?.name || donation.donor_name || donation.name || 'Anonymous',
          category: donation.funds?.name || 'Donation',
          fund: donation.funds?.name || 'N/A',
          fund_id: donation.fund_id,
          amount: parseFloat(String(donation.amount)) || 0,
          payment_method: donation.payment_method,
        })
      })

      // Process expenses as Expense
      const expensesArray = (expenses || []) as unknown as Expense[]
      expensesArray.forEach((expense) => {
        combinedTransactions.push({
          id: expense.id,
          type: 'Expense',
          date: expense.expense_date || expense.created_at,
          description: expense.description || 'Expense',
          category: expense.category || 'N/A',
          fund: expense.funds?.name || 'N/A',
          fund_id: expense.fund_id,
          amount: parseFloat(String(expense.amount)) || 0,
        })
      })

      // Sort by date (newest first)
      combinedTransactions.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
      })

      // Apply filters
      let filtered = combinedTransactions

      if (filters.month) {
        filtered = filtered.filter((transaction) => {
          const transactionDate = new Date(transaction.date)
          const [year, month] = filters.month.split('-')
          return (
            transactionDate.getFullYear() === parseInt(year) &&
            transactionDate.getMonth() + 1 === parseInt(month)
          )
        })
      }

      if (filters.fund_id) {
        filtered = filtered.filter((transaction) => {
          return transaction.fund_id?.toString() === filters.fund_id.toString()
        })
      }

      return filtered
    },
    enabled: !!currentOrganization?.id
  })

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return t('common.notAvailable')
    const locale = currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US'
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [currentLanguage, t])

  const formatCurrency = useCallback((amount: number) => {
    if (!amount) return '$0.00'
    const locale = currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }, [currentLanguage])

  // Generate month options (last 12 months)
  const getMonthOptions = useCallback(() => {
    const options = []
    const now = new Date()
    const localeMap: Record<string, string> = {
      'tr': 'tr-TR',
      'ar': 'ar-SA',
      'en': 'en-US'
    }
    const locale = localeMap[currentLanguage] || 'en-US'

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const label = date.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
      options.push({ value: `${year}-${month}`, label })
    }
    return options
  }, [currentLanguage])

  const clearFilters = () => {
    setMonth(null)
    setFundId(null)
  }

  const totalIncome = useMemo(() =>
    transactions
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalExpenses = useMemo(() =>
    transactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const netBalance = totalIncome - totalExpenses

  const handleExportToExcel = () => {
    if (transactions.length === 0) return

    // Basic CSV export
    const csvData = [
      ['Date', 'Type', 'Description', 'Fund', 'Category', 'Amount'].join(','),
      ...transactions.map(transaction => [
        formatDate(transaction.date),
        transaction.type === 'Income' ? t('reports.income') : t('reports.expense'),
        transaction.description,
        transaction.fund,
        transaction.category,
        formatCurrency(transaction.amount)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial_reports_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8 animate-page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('reports.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">{t('reports.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
              <FileText className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('reports.totalIncome')}</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
              <FileText className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('reports.totalExpenses')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-lg ${netBalance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <FileText
                className={netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                size={24}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('reports.netBalance')}</p>
              <p
                className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={20} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('reports.filters')}:</span>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('reports.month')}</label>
              <select
                value={filters.month}
                onChange={(e) => {
                  const val = e.target.value
                  // Pass null to clear the param from URL
                  if (val === '') {
                    setMonth(null)
                  } else {
                    setMonth(val as '' | null)
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('reports.allMonths')}</option>
                {getMonthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('reports.fund')}</label>
              <select
                value={filters.fund_id}
                onChange={(e) => {
                  const val = e.target.value
                  // Pass null to clear the param from URL
                  if (val === '') {
                    setFundId(null)
                  } else {
                    setFundId(val as '' | null)
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('reports.allFunds')}</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(filters.month || filters.fund_id) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              {t('reports.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-slate-600 dark:text-slate-400">{t('reports.loadingTransactions')}</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
          <FileText className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('reports.noTransactionsFound')}</h3>
          <p className="text-slate-600 dark:text-slate-400">
            {filters.month || filters.fund_id
              ? t('reports.tryAdjustingFilters')
              : t('reports.noTransactionsRecorded')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-end">
            <button
              onClick={handleExportToExcel}
              className="p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              title={t('common.exportToExcel')}
            >
              <Download size={18} className="text-slate-700 dark:text-slate-300" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('reports.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('reports.description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('reports.category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('reports.fund')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('reports.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('reports.type')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {transactions.map((transaction) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {transaction.fund}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {transaction.type === 'Income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'Income'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
