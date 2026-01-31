import { useTranslation } from 'react-i18next'
import {
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  PlayCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { IslamicService, ServiceStatus } from '../types/islamic-services.types'

interface ServiceCardProps {
  service: IslamicService
  onEdit: (service: IslamicService) => void
  onDelete: (service: IslamicService) => void
  onStatusChange: (id: string, status: ServiceStatus) => void
  isUpdatingStatus?: boolean
}

const statusConfig: Record<ServiceStatus, { color: string; label: string; icon: React.ReactNode }> = {
  requested: {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Requested',
    icon: <Clock size={14} />,
  },
  pending_documents: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    label: 'Pending Documents',
    icon: <FileText size={14} />,
  },
  documents_received: {
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    label: 'Documents Received',
    icon: <FileText size={14} />,
  },
  scheduled: {
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    label: 'Scheduled',
    icon: <Calendar size={14} />,
  },
  in_progress: {
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    label: 'In Progress',
    icon: <PlayCircle size={14} />,
  },
  completed: {
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    label: 'Completed',
    icon: <CheckCircle size={14} />,
  },
  cancelled: {
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Cancelled',
    icon: <XCircle size={14} />,
  },
}

const serviceTypeIcons: Record<string, string> = {
  nikah: '💒',
  janazah: '🕌',
  shahada: '☪️',
  aqeeqah: '🐑',
  counseling: '💬',
}

export default function ServiceCard({
  service,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdatingStatus,
}: ServiceCardProps) {
  const { t, i18n } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const status = statusConfig[service.status]
  const slug = service.service_type?.slug || 'other'
  const icon = serviceTypeIcons[slug] || '📋'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const feeBalance = service.fee_amount - service.fee_paid

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
                {service.case_number}
              </p>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {service.service_type?.name || 'Service'}
              </h3>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <MoreVertical size={18} className="text-slate-500" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute end-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1">
                  <button
                    onClick={() => { onEdit(service); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Edit size={16} />
                    {t('common.edit') || 'Edit'}
                  </button>
                  <hr className="my-1 border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => { onDelete(service); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                    {t('common.delete') || 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mt-3 relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={isUpdatingStatus}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.color} cursor-pointer hover:opacity-80`}
          >
            {status.icon}
            {t(`services.status.${service.status}`) || status.label}
          </button>

          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute start-0 top-8 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1">
                {(Object.keys(statusConfig) as ServiceStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onStatusChange(service.id, s)
                      setShowStatusMenu(false)
                    }}
                    disabled={s === service.status}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-start ${
                      s === service.status
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusConfig[s].color}`}>
                      {statusConfig[s].icon}
                    </span>
                    {t(`services.status.${s}`) || statusConfig[s].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Requestor */}
        {service.requestor_name && (
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {service.requestor_name}
            </span>
          </div>
        )}

        {/* Schedule */}
        {service.scheduled_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {formatDate(service.scheduled_date)}
              {service.scheduled_time && ` at ${formatTime(service.scheduled_time)}`}
            </span>
          </div>
        )}

        {/* Location */}
        {service.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              {service.location}
            </span>
          </div>
        )}

        {/* Fee */}
        {service.fee_amount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign size={14} className="text-slate-400" />
            <span className={`${feeBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              ${service.fee_paid.toLocaleString()} / ${service.fee_amount.toLocaleString()}
              {feeBalance > 0 && (
                <span className="ms-1 text-xs">
                  (${feeBalance.toLocaleString()} {t('common.due') || 'due'})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{formatDate(service.created_at)}</span>
        {service.certificate_number && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <FileText size={12} />
            {t('services.certificateIssued') || 'Certificate Issued'}
          </span>
        )}
      </div>
    </div>
  )
}
