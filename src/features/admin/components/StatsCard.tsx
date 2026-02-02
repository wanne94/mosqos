import { type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: 'emerald' | 'blue' | 'amber' | 'purple' | 'green'
  change?: {
    value: string
    type: 'positive' | 'negative' | 'neutral'
  }
  loading?: boolean
}

const iconColorClasses = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
}

const changeColorClasses = {
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground',
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = 'emerald',
  change,
  loading = false,
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="p-6 rounded-xl border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          {change && <div className="h-5 w-12 bg-muted rounded animate-pulse" />}
        </div>
        <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            iconColorClasses[iconColor]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span
            className={cn(
              'text-sm font-medium',
              changeColorClasses[change.type]
            )}
          >
            {change.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
