/**
 * KPI Reports Hooks
 * React Query hooks for KPI report operations
 */

import { useQuery } from '@tanstack/react-query'
import { kpiReportsService } from '../services/kpi-reports.service'
import type { DateRange } from '../types/kpi.types'

// Query keys
const KPI_KEYS = {
  all: ['kpi-reports'] as const,
  dashboard: (organizationId: string, dateRange: DateRange) =>
    [...KPI_KEYS.all, 'dashboard', organizationId, dateRange] as const,
  staffPerformance: (organizationId: string, dateRange: DateRange) =>
    [...KPI_KEYS.all, 'staff', organizationId, dateRange] as const,
  trends: (organizationId: string, dateRange: DateRange, period: string) =>
    [...KPI_KEYS.all, 'trends', organizationId, dateRange, period] as const,
  distribution: (organizationId: string, dateRange: DateRange, groupBy: string) =>
    [...KPI_KEYS.all, 'distribution', organizationId, dateRange, groupBy] as const,
  resolutionStats: (organizationId: string, dateRange: DateRange) =>
    [...KPI_KEYS.all, 'resolution', organizationId, dateRange] as const,
}

/**
 * Hook to get complete KPI dashboard data
 */
export function useKPIDashboard(params: {
  organizationId?: string
  dateRange: DateRange
}) {
  const { organizationId, dateRange } = params

  return useQuery({
    queryKey: KPI_KEYS.dashboard(organizationId || '', dateRange),
    queryFn: () => kpiReportsService.getKPIDashboard(organizationId!, dateRange),
    enabled: !!organizationId && !!dateRange.from && !!dateRange.to,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get staff performance metrics
 */
export function useStaffPerformance(params: {
  organizationId?: string
  dateRange: DateRange
}) {
  const { organizationId, dateRange } = params

  return useQuery({
    queryKey: KPI_KEYS.staffPerformance(organizationId || '', dateRange),
    queryFn: () => kpiReportsService.getStaffPerformance(organizationId!, dateRange),
    enabled: !!organizationId && !!dateRange.from && !!dateRange.to,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get case trends
 */
export function useCaseTrends(params: {
  organizationId?: string
  dateRange: DateRange
  period?: 'daily' | 'weekly' | 'monthly'
}) {
  const { organizationId, dateRange, period = 'weekly' } = params

  return useQuery({
    queryKey: KPI_KEYS.trends(organizationId || '', dateRange, period),
    queryFn: () => kpiReportsService.getCaseTrends(organizationId!, dateRange, period),
    enabled: !!organizationId && !!dateRange.from && !!dateRange.to,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get case distribution
 */
export function useCaseDistribution(params: {
  organizationId?: string
  dateRange: DateRange
  groupBy?: 'type' | 'category' | 'priority'
}) {
  const { organizationId, dateRange, groupBy = 'type' } = params

  return useQuery({
    queryKey: KPI_KEYS.distribution(organizationId || '', dateRange, groupBy),
    queryFn: () => kpiReportsService.getCaseDistribution(organizationId!, dateRange, groupBy),
    enabled: !!organizationId && !!dateRange.from && !!dateRange.to,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get resolution time statistics
 */
export function useResolutionTimeStats(params: {
  organizationId?: string
  dateRange: DateRange
}) {
  const { organizationId, dateRange } = params

  return useQuery({
    queryKey: KPI_KEYS.resolutionStats(organizationId || '', dateRange),
    queryFn: () => kpiReportsService.getResolutionTimeStats(organizationId!, dateRange),
    enabled: !!organizationId && !!dateRange.from && !!dateRange.to,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Combined hook with date range state management
 */
export function useKPIReports(params: {
  organizationId?: string
  dateRange: DateRange
}) {
  const dashboard = useKPIDashboard(params)

  return {
    // Dashboard data
    data: dashboard.data,
    isLoading: dashboard.isLoading,
    error: dashboard.error,
    refetch: dashboard.refetch,

    // Convenience accessors
    summary: dashboard.data?.summary,
    staffMetrics: dashboard.data?.staffMetrics || [],
    trends: dashboard.data?.trends || [],
    distributionByType: dashboard.data?.distributionByType || [],
    distributionByCategory: dashboard.data?.distributionByCategory || [],
    distributionByPriority: dashboard.data?.distributionByPriority || [],
    resolutionStats: dashboard.data?.resolutionTimeStats,
  }
}
