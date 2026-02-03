/**
 * Case Distribution Chart Component
 * Pie chart showing case distribution by type, category, or priority
 */

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import type { CaseDistribution } from '../types/kpi.types'

interface CaseDistributionChartProps {
  data: CaseDistribution[]
  title: string
}

export function CaseDistributionChart({ data, title }: CaseDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">No distribution data available</p>
      </div>
    )
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
  }) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="label"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [value, 'Cases']}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ paddingLeft: '20px' }}
              formatter={(value) => (
                <span className="text-sm text-slate-600 dark:text-slate-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
