/**
 * Case Trends Chart Component
 * Line chart showing case trends over time
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CaseTrend } from '../types/kpi.types'

interface CaseTrendsChartProps {
  data: CaseTrend[]
  showAmount?: boolean
}

export function CaseTrendsChart({ data, showAmount = false }: CaseTrendsChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">No trend data available</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Case Trends
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="periodLabel"
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
              formatter={(value: number, name: string) => {
                if (name === 'totalAmount') {
                  return [formatCurrency(value), 'Amount Disbursed']
                }
                return [value, name === 'openedCases' ? 'Opened' : name === 'resolvedCases' ? 'Resolved' : 'Closed']
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  openedCases: 'Opened',
                  resolvedCases: 'Resolved',
                  closedCases: 'Closed',
                  totalAmount: 'Amount',
                }
                return <span className="text-slate-600 dark:text-slate-400">{labels[value] || value}</span>
              }}
            />
            <Line
              type="monotone"
              dataKey="openedCases"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="resolvedCases"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="closedCases"
              stroke="#6366F1"
              strokeWidth={2}
              dot={{ fill: '#6366F1', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            {showAmount && (
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                yAxisId="right"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
