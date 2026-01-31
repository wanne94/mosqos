import { useTranslation } from 'react-i18next'
import { X, DollarSign, User, Package, Truck } from 'lucide-react'
import type { QurbaniShare } from '../../types/qurbani.types'

interface ShareDetailModalProps {
  isOpen: boolean
  onClose: () => void
  share: QurbaniShare | null
  onRecordPayment: () => void
}

export default function ShareDetailModal({
  isOpen,
  onClose,
  share,
  onRecordPayment,
}: ShareDetailModalProps) {
  const { t } = useTranslation('qurbani')

  if (!isOpen || !share) return null

  const registrantName = share.member
    ? `${share.member.first_name} ${share.member.last_name}`
    : share.guest_name || 'Unknown'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t('shareDetails') || 'Share Details'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              {share.share_number || 'Pending'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Registrant */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="text-slate-400" size={20} />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {t('registrant') || 'Registrant'}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-900 dark:text-white font-medium">{registrantName}</p>
              {(share.guest_email || share.member?.email) && (
                <p className="text-slate-500 dark:text-slate-400">{share.guest_email || share.member?.email}</p>
              )}
              {(share.guest_phone || share.member?.phone) && (
                <p className="text-slate-500 dark:text-slate-400">{share.guest_phone || share.member?.phone}</p>
              )}
            </div>
          </div>

          {/* Share Details */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Package className="text-slate-400" size={20} />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {t('shareInfo') || 'Share Information'}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t('animalType') || 'Animal'}:</span>
                <p className="font-medium text-slate-900 dark:text-white capitalize">{share.animal_type}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t('quantity') || 'Quantity'}:</span>
                <p className="font-medium text-slate-900 dark:text-white">{share.quantity}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t('intentionType') || 'Intention'}:</span>
                <p className="font-medium text-slate-900 dark:text-white capitalize">{share.intention_type}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t('processing') || 'Processing'}:</span>
                <p className="font-medium text-slate-900 dark:text-white capitalize">{share.processing_status.replace(/_/g, ' ')}</p>
              </div>
            </div>
            {share.intention_names && share.intention_names.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('onBehalfOf') || 'On behalf of'}:</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{share.intention_names.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Distribution */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="text-slate-400" size={20} />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {t('distribution') || 'Distribution'}
              </h3>
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-900 dark:text-white capitalize">
                {share.distribution_type.replace(/_/g, ' ')}
              </p>
              {share.pickup_location && (
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {t('location') || 'Location'}: {share.pickup_location}
                </p>
              )}
              {share.pickup_date && (
                <p className="text-slate-500 dark:text-slate-400">
                  {t('date') || 'Date'}: {new Date(share.pickup_date).toLocaleDateString()}
                  {share.pickup_time && ` at ${share.pickup_time}`}
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="text-slate-400" size={20} />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {t('payment') || 'Payment'}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('total') || 'Total'}:</span>
                <span className="font-medium text-slate-900 dark:text-white">${share.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('paid') || 'Paid'}:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">${share.amount_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500 dark:text-slate-400">{t('balance') || 'Balance'}:</span>
                <span className={`font-semibold ${share.balance_due > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  ${share.balance_due.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 dark:text-slate-400">{t('status') || 'Status'}:</span>
                <span className="font-medium text-slate-900 dark:text-white capitalize">{share.payment_status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
            {t('common:close') || 'Close'}
          </button>
          {share.balance_due > 0 && (
            <button onClick={onRecordPayment} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <DollarSign size={18} />
              {t('recordPayment') || 'Record Payment'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
