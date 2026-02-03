/**
 * KPI Reports Page
 * Staff performance dashboard with charts and metrics
 */

'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import {
  Users,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { useKPIReports } from '../hooks/useKPIReports'
import { KPICard } from '../components/KPICard'
import { StaffPerformanceTable } from '../components/StaffPerformanceTable'
import { CaseTrendsChart } from '../components/CaseTrendsChart'
import { CaseDistributionChart } from '../components/CaseDistributionChart'
import { ResolutionTimeChart } from '../components/ResolutionTimeChart'
import type { DateRange } from '../types/kpi.types'

const DATE_PRESETS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last 6 Months', days: 180 },
  { label: 'Last Year', days: 365 },
]

export default function KPIReportsPage() {
  const { currentOrganization } = useOrganization()

  // Date range state
  const [selectedPreset, setSelectedPreset] = useState(1) // Default: Last 30 Days
  const dateRange = useMemo<DateRange>(() => {
    const days = DATE_PRESETS[selectedPreset].days
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    }
  }, [selectedPreset])

  const {
    summary,
    staffMetrics,
    trends,
    distributionByType,
    distributionByPriority,
    resolutionStats,
    isLoading,
    error,
  } = useKPIReports({
    organizationId: currentOrganization?.id,
    dateRange,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleExportCSV = () => {
    if (staffMetrics.length === 0) return

    const headers = [
      'Staff Member',
      'Email',
      'Total Cases',
      'Open',
      'In Progress',
      'Resolved',
      'Closed',
      'Resolution Rate',
      'Avg Resolution Days',
      'Total Disbursed',
    ]

    const rows = staffMetrics.map((staff) => [
      staff.userName,
      staff.userEmail,
      staff.totalCases,
      staff.openCases,
      staff.inProgressCases,
      staff.resolvedCases,
      staff.closedCases,
      `${staff.resolutionRate}%`,
      staff.avgResolutionDays,
      formatCurrency(staff.totalDisbursed),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kpi-report-${dateRange.from}-to-${dateRange.to}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error loading KPI data: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              KPI Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
              Staff performance and case resolution metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" />
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {DATE_PRESETS.map((preset, index) => (
                  <option key={index} value={index}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              disabled={staffMetrics.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <KPICard
              title="Total Cases"
              value={summary.totalCases}
              icon={FileText}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            />
            <KPICard
              title="Open Cases"
              value={summary.openCases}
              icon={Clock}
              iconColor="text-amber-600 dark:text-amber-400"
              iconBgColor="bg-amber-100 dark:bg-amber-900/30"
            />
            <KPICard
              title="Resolved"
              value={summary.resolvedCases}
              icon={TrendingUp}
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <KPICard
              title="Resolution Rate"
              value={`${summary.resolutionRate}%`}
              icon={BarChart3}
              iconColor="text-purple-600 dark:text-purple-400"
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            />
            <KPICard
              title="Avg Resolution"
              value={`${summary.avgResolutionDays} days`}
              icon={Clock}
              iconColor="text-indigo-600 dark:text-indigo-400"
              iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
            />
            <KPICard
              title="Disbursed"
              value={formatCurrency(summary.totalDisbursed)}
              icon={DollarSign}
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
            />
          </div>
        )}
      </div>

      {!isLoading && (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Trends Chart */}
            <CaseTrendsChart data={trends} />

            {/* Resolution Time Chart */}
            {resolutionStats && <ResolutionTimeChart data={resolutionStats} />}
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CaseDistributionChart
              data={distributionByType}
              title="Distribution by Type"
            />
            <CaseDistributionChart
              data={distributionByPriority}
              title="Distribution by Priority"
            />
          </div>

          {/* Staff Performance Table */}
          <div className="mb-6">
            <StaffPerformanceTable
              data={staffMetrics}
              onExportCSV={handleExportCSV}
            />
          </div>

          {/* No Data State */}
          {!summary?.totalCases && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
              <Users size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Case Data
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                No cases found for the selected date range. Try selecting a different period.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
