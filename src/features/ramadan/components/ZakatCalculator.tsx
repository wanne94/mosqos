/**
 * Zakat Calculator Component
 * Full-featured Zakat calculation form
 */

import { useState } from 'react'
import { Calculator, DollarSign, RefreshCw, Save, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useZakatCalculator } from '../hooks/useZakatCalculator'

interface ZakatCalculatorProps {
  organizationId?: string
  personId?: string
  onSave?: () => void
}

export function ZakatCalculator({ organizationId, personId, onSave }: ZakatCalculatorProps) {
  const [showDetails, setShowDetails] = useState(false)

  const {
    assets,
    liabilities,
    useGoldNisab,
    setUseGoldNisab,
    nisab,
    isLoadingNisab,
    result,
    updateAsset,
    updateLiability,
    reset,
    saveCalculation,
    isSaving,
  } = useZakatCalculator({
    organizationId,
    personId,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSave = async () => {
    if (!organizationId) {
      toast.error('Organization required to save calculation')
      return
    }
    try {
      await saveCalculation()
      toast.success('Zakat calculation saved')
      onSave?.()
    } catch (error) {
      toast.error('Failed to save calculation')
    }
  }

  const assetFields = [
    { key: 'cash_on_hand' as const, label: 'Cash on Hand', icon: '💵' },
    { key: 'bank_balances' as const, label: 'Bank Balances', icon: '🏦' },
    { key: 'gold_value' as const, label: 'Gold Value', icon: '🥇' },
    { key: 'silver_value' as const, label: 'Silver Value', icon: '🥈' },
    { key: 'investments' as const, label: 'Stocks & Investments', icon: '📈' },
    { key: 'business_inventory' as const, label: 'Business Inventory', icon: '📦' },
    { key: 'receivables' as const, label: 'Money Owed to You', icon: '📝' },
    { key: 'other_assets' as const, label: 'Other Assets', icon: '💎' },
  ]

  const liabilityFields = [
    { key: 'debts' as const, label: 'Outstanding Debts', icon: '📋' },
    { key: 'bills_due' as const, label: 'Bills Due', icon: '📄' },
    { key: 'loans' as const, label: 'Loans to Repay', icon: '💳' },
    { key: 'other_liabilities' as const, label: 'Other Liabilities', icon: '⚠️' },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Calculator size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Zakat Calculator
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Calculate your Zakat obligation
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Nisab Selection */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
              <span className="font-medium text-slate-900 dark:text-white">
                Nisab Threshold
              </span>
            </div>
            {isLoadingNisab && (
              <span className="text-sm text-slate-500">Loading...</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setUseGoldNisab(true)}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                useGoldNisab
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <div className="text-lg mb-1">🥇 Gold</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {nisab ? formatCurrency(nisab.nisab_gold_usd) : '...'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {nisab?.nisab_gold_grams}g
              </div>
            </button>
            <button
              onClick={() => setUseGoldNisab(false)}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                !useGoldNisab
                  ? 'border-slate-400 bg-slate-100 dark:bg-slate-600'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <div className="text-lg mb-1">🥈 Silver</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {nisab ? formatCurrency(nisab.nisab_silver_usd) : '...'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {nisab?.nisab_silver_grams}g
              </div>
            </button>
          </div>
        </div>

        {/* Assets Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Assets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assetFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span className="mr-2">{field.icon}</span>
                  {field.label}
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={assets[field.key] || ''}
                    onChange={(e) => updateAsset(field.key, parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Liabilities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liabilityFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span className="mr-2">{field.icon}</span>
                  {field.label}
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={liabilities[field.key] || ''}
                    onChange={(e) => updateLiability(field.key, parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
              Calculation Results
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Total Assets:</span>
                <span className="font-medium">{formatCurrency(result.total_assets)}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Total Liabilities:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{formatCurrency(result.total_liabilities)}
                </span>
              </div>
              <hr className="border-emerald-200 dark:border-emerald-700" />
              <div className="flex justify-between text-slate-900 dark:text-white font-medium">
                <span>Net Zakatable Wealth:</span>
                <span>{formatCurrency(result.net_zakatable)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
                <span>Nisab Threshold:</span>
                <span>{formatCurrency(result.nisab_threshold)}</span>
              </div>
            </div>

            {/* Zakat Due */}
            <div
              className={`mt-4 p-4 rounded-lg ${
                result.is_zakat_due
                  ? 'bg-emerald-100 dark:bg-emerald-800/50'
                  : 'bg-slate-100 dark:bg-slate-700/50'
              }`}
            >
              {result.is_zakat_due ? (
                <>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                    Your wealth exceeds the Nisab threshold. Zakat is due.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">
                      Zakat Due (2.5%):
                    </span>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(result.zakat_amount)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  Your wealth is below the Nisab threshold. No Zakat is due at this time.
                </p>
              )}
            </div>

            {/* Save Button */}
            {organizationId && result.is_zakat_due && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Calculation'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
