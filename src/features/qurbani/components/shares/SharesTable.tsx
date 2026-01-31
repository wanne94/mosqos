import { useTranslation } from 'react-i18next'
import { Eye, DollarSign, Trash2, ChevronRight } from 'lucide-react'
import type { QurbaniShare, ProcessingStatus, PaymentStatus, AnimalType } from '../../types/qurbani.types'

interface SharesTableProps {
  shares: QurbaniShare[]
  onView: (share: QurbaniShare) => void
  onRecordPayment: (share: QurbaniShare) => void
  onUpdateStatus: (share: QurbaniShare, status: ProcessingStatus) => void
  onDelete: (share: QurbaniShare) => void
}

const animalTypeLabels: Record<AnimalType, string> = {
  sheep: 'Sheep',
  cow: 'Cow',
  camel: 'Camel',
}

const paymentStatusColors: Record<PaymentStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  deposit_paid: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  partial: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  refunded: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
}

const processingStatusColors: Record<ProcessingStatus, { bg: string; text: string }> = {
  registered: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  slaughtered: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  processed: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  ready_for_pickup: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  distributed: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
}

export default function SharesTable({
  shares,
  onView,
  onRecordPayment,
  onUpdateStatus,
  onDelete,
}: SharesTableProps) {
  const { t } = useTranslation('qurbani')

  const getRegistrantName = (share: QurbaniShare) => {
    if (share.member) {
      return `${share.member.first_name} ${share.member.last_name}`
    }
    return share.guest_name || t('unknownRegistrant') || 'Unknown'
  }

  const processingStatusOptions: ProcessingStatus[] = [
    'registered',
    'slaughtered',
    'processed',
    'ready_for_pickup',
    'distributed',
    'completed',
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                {t('shareNumber') || 'Share #'}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                {t('registrant') || 'Registrant'}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                {t('animal') || 'Animal'}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                {t('amount') || 'Amount'}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                {t('payment') || 'Payment'}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                {t('processing') || 'Processing'}
              </th>
              <th className="px-4 py-3 text-end text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                {t('actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {shares.map((share) => {
              const paymentStyle = paymentStatusColors[share.payment_status] || paymentStatusColors.pending
              const processingStyle = processingStatusColors[share.processing_status] || processingStatusColors.registered

              return (
                <tr
                  key={share.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-slate-900 dark:text-white">
                      {share.share_number || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {getRegistrantName(share)}
                      </p>
                      {share.intention_names && share.intention_names.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('onBehalfOf') || 'For'}: {share.intention_names.join(', ')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-900 dark:text-white">
                      {animalTypeLabels[share.animal_type] || share.animal_type}
                      {share.quantity > 1 && ` x${share.quantity}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium text-slate-900 dark:text-white">
                        ${share.total_amount.toLocaleString()}
                      </p>
                      {share.balance_due > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {t('due') || 'Due'}: ${share.balance_due.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${paymentStyle.bg} ${paymentStyle.text}`}>
                      {share.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={share.processing_status}
                      onChange={(e) => onUpdateStatus(share, e.target.value as ProcessingStatus)}
                      className={`px-2 py-1 text-xs font-medium rounded border-0 ${processingStyle.bg} ${processingStyle.text} cursor-pointer focus:ring-2 focus:ring-emerald-500`}
                    >
                      {processingStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(share)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title={t('common:view') || 'View'}
                      >
                        <Eye size={16} />
                      </button>
                      {share.balance_due > 0 && (
                        <button
                          onClick={() => onRecordPayment(share)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title={t('recordPayment') || 'Record Payment'}
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(share)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title={t('common:delete') || 'Delete'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
