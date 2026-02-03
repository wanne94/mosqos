/**
 * Staff Performance Table Component
 * Displays staff KPI metrics in a sortable table
 */

import { useState } from 'react'
import { ChevronUp, ChevronDown, User } from 'lucide-react'
import type { StaffMetrics } from '../types/kpi.types'

interface StaffPerformanceTableProps {
  data: StaffMetrics[]
  onExportCSV?: () => void
}

type SortKey = keyof StaffMetrics
type SortOrder = 'asc' | 'desc'

export function StaffPerformanceTable({ data, onExportCSV }: StaffPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('resolutionRate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }
    return sortOrder === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (column !== sortKey) return null
    return sortOrder === 'asc' ? (
      <ChevronUp size={14} className="inline" />
    ) : (
      <ChevronDown size={14} className="inline" />
    )
  }

  const headerClasses = 'px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors'

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 text-center">
        <User size={48} className="mx-auto text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          No Staff Data
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          No cases have been assigned to staff members in this period.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Staff Performance
        </h3>
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Export CSV
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className={headerClasses} onClick={() => handleSort('userName')}>
                Staff Member <SortIcon column="userName" />
              </th>
              <th className={headerClasses} onClick={() => handleSort('totalCases')}>
                Total <SortIcon column="totalCases" />
              </th>
              <th className={headerClasses} onClick={() => handleSort('openCases')}>
                Open <SortIcon column="openCases" />
              </th>
              <th className={headerClasses} onClick={() => handleSort('resolvedCases')}>
                Resolved <SortIcon column="resolvedCases" />
              </th>
              <th className={headerClasses} onClick={() => handleSort('resolutionRate')}>
                Resolution % <SortIcon column="resolutionRate" />
              </th>
              <th className={headerClasses} onClick={() => handleSort('avgResolutionDays')}>
                Avg Days <SortIcon column="avgResolutionDays" />
              </th>
              <th className={headerClasses} onClick={() => handleSort('totalDisbursed')}>
                Disbursed <SortIcon column="totalDisbursed" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {sortedData.map((staff) => (
              <tr
                key={staff.userId}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {staff.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {staff.userName}
                      </p>
                      {staff.userEmail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {staff.userEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                  {staff.totalCases}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    {staff.openCases + staff.inProgressCases}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {staff.resolvedCases + staff.closedCases}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          staff.resolutionRate >= 75
                            ? 'bg-emerald-500'
                            : staff.resolutionRate >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${staff.resolutionRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {staff.resolutionRate}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {staff.avgResolutionDays > 0 ? `${staff.avgResolutionDays} days` : '-'}
                </td>
                <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(staff.totalDisbursed)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
