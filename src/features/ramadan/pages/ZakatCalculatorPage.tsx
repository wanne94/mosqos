/**
 * Zakat Calculator Page
 * Standalone page for Zakat calculation
 */

'use client'

import { useParams, Link } from 'react-router-dom'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { ArrowLeft, History, DollarSign, Users } from 'lucide-react'
import { ZakatCalculator } from '../components/ZakatCalculator'
import { useZakatHistory, useZakatStats } from '../hooks'

export default function ZakatCalculatorPage() {
  const { currentOrganization } = useOrganization()
  const { slug } = useParams()

  const { data: history = [], isLoading: loadingHistory } = useZakatHistory(
    currentOrganization?.id,
    10
  )

  const { data: stats } = useZakatStats(currentOrganization?.id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          to={`/${slug}/admin/ramadan`}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={18} />
          Back to Ramadan Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Zakat Calculator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
          Calculate your annual Zakat obligation based on current assets and liabilities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator */}
        <div className="lg:col-span-2">
          <ZakatCalculator organizationId={currentOrganization?.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                This Year's Zakat
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                    <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Collected</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(stats.totalCollected)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Distributed</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(stats.totalDisbursed)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                    <Users size={18} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Recipients</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {stats.recipientCount} families
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculation History */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <History size={18} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Calculations
              </h3>
            </div>

            {loadingHistory ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
                No calculations saved yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {history.map((calc) => (
                  <div
                    key={calc.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {calc.person
                          ? `${calc.person.first_name} ${calc.person.last_name}`
                          : 'Anonymous'}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(calc.zakat_amount)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(calc.calculation_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
              About Zakat
            </h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
              Zakat is one of the Five Pillars of Islam. It is a form of obligatory charity that
              has the potential to ease the suffering of millions.
            </p>
            <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
              <li>• Rate: 2.5% of eligible wealth</li>
              <li>• Paid annually on savings held for one lunar year</li>
              <li>• Must exceed the Nisab threshold</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
