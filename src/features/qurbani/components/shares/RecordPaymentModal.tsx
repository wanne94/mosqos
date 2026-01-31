import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../../hooks/useOrganization'
import { useShares } from '../../hooks/useShares'
import type { QurbaniShare } from '../../types/qurbani.types'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  share: QurbaniShare | null
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSave,
  share,
}: RecordPaymentModalProps) {
  const { t } = useTranslation('qurbani')
  const { currentOrganizationId } = useOrganization()
  const { recordPayment, isRecordingPayment } = useShares({ organizationId: currentOrganizationId || undefined })

  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [reference, setReference] = useState('')

  useEffect(() => {
    if (isOpen && share) {
      setAmount(share.balance_due)
      setPaymentMethod('cash')
      setReference('')
    }
  }, [isOpen, share])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!share || amount <= 0) {
      toast.error(t('invalidAmount') || 'Please enter a valid amount')
      return
    }

    try {
      await recordPayment({
        share_id: share.id,
        amount,
        payment_method: paymentMethod,
        payment_reference: reference || null,
      })
      toast.success(t('paymentRecorded') || 'Payment recorded successfully')
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(t('failedToRecord') || 'Failed to record payment', {
        description: error.message,
      })
    }
  }

  if (!isOpen || !share) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('recordPayment') || 'Record Payment'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                {share.share_number}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Balance Info */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 dark:text-slate-400">{t('totalAmount') || 'Total'}:</span>
              <span className="font-medium text-slate-900 dark:text-white">${share.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 dark:text-slate-400">{t('alreadyPaid') || 'Already Paid'}:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">${share.amount_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-slate-200 dark:border-slate-700 pt-2">
              <span className="text-slate-900 dark:text-white">{t('balanceDue') || 'Balance Due'}:</span>
              <span className="text-amber-600 dark:text-amber-400">${share.balance_due.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('paymentAmount') || 'Payment Amount'} *
            </label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="0.01"
                max={share.balance_due}
                step="0.01"
                required
                className="w-full ps-8 pe-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(share.balance_due)}
                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                {t('fullBalance') || 'Full Balance'}
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.round(share.balance_due / 2 * 100) / 100)}
                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                50%
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('paymentMethod') || 'Payment Method'} *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="cash">{t('cash') || 'Cash'}</option>
              <option value="card">{t('card') || 'Card'}</option>
              <option value="check">{t('check') || 'Check'}</option>
              <option value="bank_transfer">{t('bankTransfer') || 'Bank Transfer'}</option>
              <option value="online">{t('online') || 'Online'}</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('reference') || 'Reference Number'}
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('referencePlaceholder') || 'Check #, Transaction ID, etc.'}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
              {t('common:cancel') || 'Cancel'}
            </button>
            <button type="submit" disabled={isRecordingPayment || amount <= 0} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {isRecordingPayment ? t('common:saving') || 'Saving...' : t('recordPayment') || 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
