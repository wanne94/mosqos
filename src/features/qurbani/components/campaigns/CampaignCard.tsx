import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Edit,
  Trash2,
  Eye,
  Scissors,
  DollarSign,
  Package,
  MoreVertical,
} from 'lucide-react'
import { useState } from 'react'
import type { QurbaniCampaign, CampaignStatus } from '../../types/qurbani.types'

interface CampaignCardProps {
  campaign: QurbaniCampaign
  onEdit: () => void
  onDelete: () => void
  onViewShares: () => void
}

const statusColors: Record<CampaignStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  open: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  closed: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  completed: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
}

export default function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onViewShares,
}: CampaignCardProps) {
  const { t } = useTranslation('qurbani')
  const [showMenu, setShowMenu] = useState(false)

  const statusStyle = statusColors[campaign.status] || statusColors.draft

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return `$${price.toLocaleString()}`
  }

  const statusLabels: Record<CampaignStatus, string> = {
    draft: t('statusDraft') || 'Draft',
    open: t('statusOpen') || 'Open',
    closed: t('statusClosed') || 'Closed',
    in_progress: t('statusInProgress') || 'In Progress',
    completed: t('statusCompleted') || 'Completed',
    cancelled: t('statusCancelled') || 'Cancelled',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {campaign.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {campaign.year} {campaign.hijri_year && `/ ${campaign.hijri_year}H`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
              {statusLabels[campaign.status]}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute end-0 top-8 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[120px]">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onEdit()
                      }}
                      className="w-full px-3 py-2 text-start text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Edit size={14} />
                      {t('common:edit') || 'Edit'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onViewShares()
                      }}
                      className="w-full px-3 py-2 text-start text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Eye size={14} />
                      {t('viewShares') || 'View Shares'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onDelete()
                      }}
                      className="w-full px-3 py-2 text-start text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      {t('common:delete') || 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar size={14} />
            {t('deadline') || 'Deadline'}
          </span>
          <span className="text-slate-900 dark:text-white font-medium">
            {formatDate(campaign.registration_deadline)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Scissors size={14} />
            {t('slaughter') || 'Slaughter'}
          </span>
          <span className="text-slate-900 dark:text-white">
            {formatDate(campaign.slaughter_start_date)} - {formatDate(campaign.slaughter_end_date)}
          </span>
        </div>
      </div>

      {/* Pricing */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatPrice(campaign.sheep_price)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('sheep') || 'Sheep'}
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatPrice(campaign.cow_price)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('cowShare') || 'Cow (1/7)'}
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatPrice(campaign.camel_price)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('camelShare') || 'Camel (1/7)'}
            </p>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500 dark:text-slate-400">
            {t('availability') || 'Availability'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-2">
            <p className="font-semibold text-slate-900 dark:text-white">
              {campaign.sheep_available ?? campaign.sheep_capacity ?? 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('sheep') || 'Sheep'}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-2">
            <p className="font-semibold text-slate-900 dark:text-white">
              {campaign.cow_shares_available ?? (campaign.cow_capacity ?? 0) * 7}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('cowShares') || 'Cow Shares'}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-2">
            <p className="font-semibold text-slate-900 dark:text-white">
              {campaign.camel_shares_available ?? (campaign.camel_capacity ?? 0) * 7}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('camelShares') || 'Camel Shares'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        <button
          onClick={onViewShares}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Package size={16} />
          {t('viewShares') || 'View Shares'}
        </button>
      </div>
    </div>
  )
}
