import { useTranslation } from 'react-i18next'
import { Check, X, Clock, AlertCircle } from 'lucide-react'
import type { AttendanceStatus } from '../types/education.types'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
}

const statusConfig: Record<
  AttendanceStatus,
  {
    bgColor: string
    textColor: string
    darkBgColor: string
    darkTextColor: string
    icon: typeof Check
  }
> = {
  present: {
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    darkBgColor: 'dark:bg-emerald-900/30',
    darkTextColor: 'dark:text-emerald-400',
    icon: Check,
  },
  absent: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    darkBgColor: 'dark:bg-red-900/30',
    darkTextColor: 'dark:text-red-400',
    icon: X,
  },
  late: {
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    darkBgColor: 'dark:bg-amber-900/30',
    darkTextColor: 'dark:text-amber-400',
    icon: Clock,
  },
  excused: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    darkBgColor: 'dark:bg-blue-900/30',
    darkTextColor: 'dark:text-blue-400',
    icon: AlertCircle,
  },
  early_leave: {
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    darkBgColor: 'dark:bg-purple-900/30',
    darkTextColor: 'dark:text-purple-400',
    icon: Clock,
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
}

export default function AttendanceStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
}: AttendanceStatusBadgeProps) {
  const { t } = useTranslation()

  const config = statusConfig[status]
  const Icon = config.icon

  const labels: Record<AttendanceStatus, string> = {
    present: t('attendance.present') || 'Present',
    absent: t('attendance.absent') || 'Absent',
    late: t('attendance.late') || 'Late',
    excused: t('attendance.excused') || 'Excused',
    early_leave: t('attendance.earlyLeave') || 'Early Leave',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${config.bgColor} ${config.textColor}
        ${config.darkBgColor} ${config.darkTextColor}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {showLabel && <span>{labels[status]}</span>}
    </span>
  )
}
