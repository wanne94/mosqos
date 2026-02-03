/**
 * Resolution Time Chart Component
 * Bar chart showing resolution time distribution
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ResolutionTimeStats } from '../types/kpi.types'

interface ResolutionTimeChartProps {
  data: ResolutionTimeStats
}

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  const chartData = [
    { name: '< 24h', value: data.under24Hours, color: '#10B981' },
    { name: '1-7 days', value: data.under7Days, color: '#3B82F6' },
    { name: '7-30 days', value: data.under30Days, color: '#F59E0B' },
    { name: '> 30 days', value: data.over30Days, color: '#EF4444' },
  ]

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">No resolution data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Resolution Time Distribution
        </h3>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Average</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {data.avgDays} days
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
          <p className="text-xs text-slate-500 dark:text-slate-400">Min</p>
          <p className="font-semibold text-slate-900 dark:text-white">{data.minDays}d</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
          <p className="text-xs text-slate-500 dark:text-slate-400">Median</p>
          <p className="font-semibold text-slate-900 dark:text-white">{data.medianDays}d</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
          <p className="text-xs text-slate-500 dark:text-slate-400">Max</p>
          <p className="font-semibold text-slate-900 dark:text-white">{data.maxDays}d</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
          <p className="font-semibold text-slate-900 dark:text-white">{total}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [`${value} cases`, 'Count']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By Priority */}
      {data.byPriority.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Average by Priority
          </h4>
          <div className="space-y-2">
            {data.byPriority.map((p) => (
              <div key={p.priority} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {p.priority}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {p.avgDays} days
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    ({p.count} cases)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
