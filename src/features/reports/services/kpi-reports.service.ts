/**
 * KPI Reports Service
 * Handles staff performance metrics and KPI calculations
 */

import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  StaffMetrics,
  CaseTrend,
  CaseDistribution,
  ResolutionTimeStats,
  KPIDashboardData,
  DateRange,
} from '../types/kpi.types'

// Type assertion for tables with columns not in generated types
const db = supabase as SupabaseClient<any>

interface CaseRow {
  id: string
  assigned_to: string | null
  status: string
  priority: string
  case_type: string | null
  category: string | null
  requested_amount: number | null
  approved_amount: number | null
  disbursed_amount: number | null
  created_at: string
  resolved_date: string | null
}

interface UserRow {
  id: string
  email: string
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
}

const TYPE_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981',
  '#F59E0B', '#EF4444', '#6366F1', '#84CC16', '#F97316',
]

export const kpiReportsService = {
  /**
   * Get staff performance metrics for a date range
   */
  async getStaffPerformance(
    organizationId: string,
    dateRange: DateRange
  ): Promise<StaffMetrics[]> {
    // Get all cases in the date range
    const { data: cases, error: casesError } = await db
      .from('service_cases')
      .select('id, assigned_to, status, requested_amount, disbursed_amount, created_at, resolved_date')
      .eq('organization_id', organizationId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .not('assigned_to', 'is', null)

    if (casesError) throw casesError

    if (!cases || cases.length === 0) {
      return []
    }

    // Get unique assigned user IDs
    const userIds = [...new Set((cases as CaseRow[]).map((c) => c.assigned_to).filter(Boolean))] as string[]

    // Get user details
    const { data: users, error: usersError } = await db
      .from('auth_users_view')
      .select('id, email')
      .in('id', userIds)

    if (usersError) {
      // Fallback if view doesn't exist
      console.warn('auth_users_view not available, using IDs as names')
    }

    const userMap = new Map<string, UserRow>()
    if (users) {
      for (const u of users as UserRow[]) {
        userMap.set(u.id, u)
      }
    }

    // Group cases by assigned user
    const staffMap = new Map<string, CaseRow[]>()
    for (const c of cases as CaseRow[]) {
      if (c.assigned_to) {
        if (!staffMap.has(c.assigned_to)) {
          staffMap.set(c.assigned_to, [])
        }
        staffMap.get(c.assigned_to)!.push(c)
      }
    }

    // Calculate metrics for each staff member
    const metrics: StaffMetrics[] = []

    for (const [userId, userCases] of staffMap) {
      const user = userMap.get(userId)
      const resolvedCases = userCases.filter((c) => c.status === 'resolved' || c.status === 'closed')
      const resolutionDays: number[] = []

      for (const c of resolvedCases) {
        if (c.resolved_date && c.created_at) {
          const created = new Date(c.created_at)
          const resolved = new Date(c.resolved_date)
          const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          resolutionDays.push(days)
        }
      }

      const avgResolutionDays = resolutionDays.length > 0
        ? resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length
        : 0

      const totalDisbursed = userCases.reduce((sum, c) => sum + (c.disbursed_amount || 0), 0)
      const totalRequested = userCases.reduce((sum, c) => sum + (c.requested_amount || 0), 0)

      metrics.push({
        userId,
        userName: user?.email?.split('@')[0] || `User ${userId.substring(0, 8)}`,
        userEmail: user?.email || '',
        totalCases: userCases.length,
        openCases: userCases.filter((c) => c.status === 'open').length,
        inProgressCases: userCases.filter((c) => c.status === 'in_progress').length,
        resolvedCases: userCases.filter((c) => c.status === 'resolved').length,
        closedCases: userCases.filter((c) => c.status === 'closed').length,
        avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
        totalDisbursed,
        totalRequested,
        resolutionRate: userCases.length > 0
          ? Math.round((resolvedCases.length / userCases.length) * 100)
          : 0,
      })
    }

    // Sort by resolution rate descending
    return metrics.sort((a, b) => b.resolutionRate - a.resolutionRate)
  },

  /**
   * Get case trends over time
   */
  async getCaseTrends(
    organizationId: string,
    dateRange: DateRange,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<CaseTrend[]> {
    const { data: cases, error } = await db
      .from('service_cases')
      .select('id, status, created_at, resolved_date, disbursed_amount')
      .eq('organization_id', organizationId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!cases || cases.length === 0) {
      return []
    }

    // Generate period buckets
    const startDate = new Date(dateRange.from)
    const endDate = new Date(dateRange.to)
    const buckets = new Map<string, CaseTrend>()

    // Initialize buckets
    let current = new Date(startDate)
    while (current <= endDate) {
      const key = getPeriodKey(current, period)
      const label = getPeriodLabel(current, period)

      if (!buckets.has(key)) {
        buckets.set(key, {
          period: key,
          periodLabel: label,
          openedCases: 0,
          resolvedCases: 0,
          closedCases: 0,
          totalAmount: 0,
        })
      }

      // Increment based on period
      if (period === 'daily') {
        current.setDate(current.getDate() + 1)
      } else if (period === 'weekly') {
        current.setDate(current.getDate() + 7)
      } else {
        current.setMonth(current.getMonth() + 1)
      }
    }

    // Fill buckets with case data
    for (const c of cases as CaseRow[]) {
      const createdKey = getPeriodKey(new Date(c.created_at), period)
      if (buckets.has(createdKey)) {
        const bucket = buckets.get(createdKey)!
        bucket.openedCases++
        bucket.totalAmount += c.disbursed_amount || 0
      }

      if (c.resolved_date) {
        const resolvedKey = getPeriodKey(new Date(c.resolved_date), period)
        if (buckets.has(resolvedKey)) {
          const bucket = buckets.get(resolvedKey)!
          if (c.status === 'resolved') {
            bucket.resolvedCases++
          } else if (c.status === 'closed') {
            bucket.closedCases++
          }
        }
      }
    }

    return Array.from(buckets.values())
  },

  /**
   * Get case distribution by type, category, or priority
   */
  async getCaseDistribution(
    organizationId: string,
    dateRange: DateRange,
    groupBy: 'type' | 'category' | 'priority' = 'type'
  ): Promise<CaseDistribution[]> {
    const column = groupBy === 'type' ? 'case_type' : groupBy === 'category' ? 'category' : 'priority'

    const { data: cases, error } = await db
      .from('service_cases')
      .select(`id, ${column}`)
      .eq('organization_id', organizationId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)

    if (error) throw error

    if (!cases || cases.length === 0) {
      return []
    }

    // Count by group
    const counts = new Map<string, number>()
    for (const c of cases as any[]) {
      const value = c[column] || 'Unknown'
      counts.set(value, (counts.get(value) || 0) + 1)
    }

    const total = cases.length
    const distribution: CaseDistribution[] = []

    let colorIndex = 0
    for (const [label, value] of counts) {
      distribution.push({
        label,
        value,
        percentage: Math.round((value / total) * 100),
        color: groupBy === 'priority' ? PRIORITY_COLORS[label] : TYPE_COLORS[colorIndex % TYPE_COLORS.length],
      })
      colorIndex++
    }

    return distribution.sort((a, b) => b.value - a.value)
  },

  /**
   * Get resolution time statistics
   */
  async getResolutionTimeStats(
    organizationId: string,
    dateRange: DateRange
  ): Promise<ResolutionTimeStats> {
    const { data: cases, error } = await db
      .from('service_cases')
      .select('id, priority, created_at, resolved_date, status')
      .eq('organization_id', organizationId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .in('status', ['resolved', 'closed'])
      .not('resolved_date', 'is', null)

    if (error) throw error

    const defaultStats: ResolutionTimeStats = {
      avgDays: 0,
      minDays: 0,
      maxDays: 0,
      medianDays: 0,
      under24Hours: 0,
      under7Days: 0,
      under30Days: 0,
      over30Days: 0,
      byPriority: [],
    }

    if (!cases || cases.length === 0) {
      return defaultStats
    }

    const resolutionDays: number[] = []
    const byPriorityMap = new Map<string, number[]>()

    for (const c of cases as CaseRow[]) {
      if (c.resolved_date && c.created_at) {
        const created = new Date(c.created_at)
        const resolved = new Date(c.resolved_date)
        const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        resolutionDays.push(days)

        if (!byPriorityMap.has(c.priority)) {
          byPriorityMap.set(c.priority, [])
        }
        byPriorityMap.get(c.priority)!.push(days)
      }
    }

    if (resolutionDays.length === 0) {
      return defaultStats
    }

    resolutionDays.sort((a, b) => a - b)

    const avgDays = resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length
    const medianDays = resolutionDays.length % 2 === 0
      ? (resolutionDays[resolutionDays.length / 2 - 1] + resolutionDays[resolutionDays.length / 2]) / 2
      : resolutionDays[Math.floor(resolutionDays.length / 2)]

    const byPriority = Array.from(byPriorityMap.entries()).map(([priority, days]) => ({
      priority,
      avgDays: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10,
      count: days.length,
    }))

    return {
      avgDays: Math.round(avgDays * 10) / 10,
      minDays: Math.round(Math.min(...resolutionDays) * 10) / 10,
      maxDays: Math.round(Math.max(...resolutionDays) * 10) / 10,
      medianDays: Math.round(medianDays * 10) / 10,
      under24Hours: resolutionDays.filter((d) => d < 1).length,
      under7Days: resolutionDays.filter((d) => d >= 1 && d < 7).length,
      under30Days: resolutionDays.filter((d) => d >= 7 && d < 30).length,
      over30Days: resolutionDays.filter((d) => d >= 30).length,
      byPriority: byPriority.sort((a, b) => a.avgDays - b.avgDays),
    }
  },

  /**
   * Get complete KPI dashboard data
   */
  async getKPIDashboard(
    organizationId: string,
    dateRange: DateRange
  ): Promise<KPIDashboardData> {
    const [staffMetrics, trends, typeDistribution, categoryDistribution, priorityDistribution, resolutionStats] =
      await Promise.all([
        this.getStaffPerformance(organizationId, dateRange),
        this.getCaseTrends(organizationId, dateRange, 'weekly'),
        this.getCaseDistribution(organizationId, dateRange, 'type'),
        this.getCaseDistribution(organizationId, dateRange, 'category'),
        this.getCaseDistribution(organizationId, dateRange, 'priority'),
        this.getResolutionTimeStats(organizationId, dateRange),
      ])

    // Calculate summary
    const totalCases = typeDistribution.reduce((sum, d) => sum + d.value, 0)
    const resolvedCases = staffMetrics.reduce((sum, s) => sum + s.resolvedCases + s.closedCases, 0)
    const totalDisbursed = staffMetrics.reduce((sum, s) => sum + s.totalDisbursed, 0)
    const openCases = staffMetrics.reduce((sum, s) => sum + s.openCases + s.inProgressCases, 0)

    return {
      period: dateRange,
      summary: {
        totalCases,
        openCases,
        resolvedCases,
        avgResolutionDays: resolutionStats.avgDays,
        totalDisbursed,
        resolutionRate: totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0,
      },
      staffMetrics,
      trends,
      distributionByType: typeDistribution,
      distributionByCategory: categoryDistribution,
      distributionByPriority: priorityDistribution,
      resolutionTimeStats: resolutionStats,
    }
  },
}

// Helper functions
function getPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
  if (period === 'daily') {
    return date.toISOString().split('T')[0]
  } else if (period === 'weekly') {
    // Get Monday of the week
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
}

function getPeriodLabel(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
  if (period === 'daily') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else if (period === 'weekly') {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
}
