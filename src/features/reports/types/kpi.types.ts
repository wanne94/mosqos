/**
 * KPI Reports Types
 */

export interface DateRange {
  from: string
  to: string
}

export interface StaffMetrics {
  userId: string
  userName: string
  userEmail: string
  totalCases: number
  openCases: number
  inProgressCases: number
  resolvedCases: number
  closedCases: number
  avgResolutionDays: number
  totalDisbursed: number
  totalRequested: number
  resolutionRate: number
}

export interface CaseTrend {
  period: string
  periodLabel: string
  openedCases: number
  resolvedCases: number
  closedCases: number
  totalAmount: number
}

export interface CaseDistribution {
  label: string
  value: number
  percentage: number
  color?: string
}

export interface ResolutionTimeStats {
  avgDays: number
  minDays: number
  maxDays: number
  medianDays: number
  under24Hours: number
  under7Days: number
  under30Days: number
  over30Days: number
  byPriority: {
    priority: string
    avgDays: number
    count: number
  }[]
}

export interface KPIDashboardData {
  period: DateRange
  summary: {
    totalCases: number
    openCases: number
    resolvedCases: number
    avgResolutionDays: number
    totalDisbursed: number
    resolutionRate: number
  }
  staffMetrics: StaffMetrics[]
  trends: CaseTrend[]
  distributionByType: CaseDistribution[]
  distributionByCategory: CaseDistribution[]
  distributionByPriority: CaseDistribution[]
  resolutionTimeStats: ResolutionTimeStats
}

export interface KPIFilters {
  dateRange: DateRange
  staffId?: string
  caseType?: string
  category?: string
}
