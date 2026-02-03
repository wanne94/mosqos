/**
 * KPI Card Component
 * Displays a single KPI metric with icon and optional trend
 */

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-emerald-600 dark:text-emerald-400',
  iconBgColor = 'bg-emerald-100 dark:bg-emerald-900/30',
  trend,
}: KPICardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${iconBgColor}`}>
            <Icon size={22} className={iconColor} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
