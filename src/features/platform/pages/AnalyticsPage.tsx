import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, Building2, Globe, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface CountryGroup {
  code: string
  name: string
  count: number
}

interface PlanGroup {
  name: string
  slug: string
  count: number
}

interface MonthData {
  month: string
  count: number
}

interface TotalStats {
  organizations: number
  members: number
  activeSubscriptions: number
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: async () => {
      // Fetch organizations with country and subscription data
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          id, created_at,
          organization_countries (code, name),
          organization_subscriptions (
            status,
            organization_subscription_plans (name, slug)
          )
        `)

      if (orgsError) throw orgsError

      // Type-safe organization data
      const orgData = (orgs || []) as any[]

      // Group by country
      const countryGroups: Record<string, CountryGroup> = {}
      orgData.forEach((org: any) => {
        const code = org.organization_countries?.code || 'Unknown'
        const name = org.organization_countries?.name || 'Unknown'
        if (!countryGroups[code]) {
          countryGroups[code] = { code, name, count: 0 }
        }
        countryGroups[code].count++
      })
      const orgsByCountry = Object.values(countryGroups).sort((a, b) => b.count - a.count)

      // Group by plan
      const planGroups: Record<string, PlanGroup> = {}
      orgData.forEach((org: any) => {
        const subscriptions = org.organization_subscriptions || []
        const plan = subscriptions[0]?.organization_subscription_plans?.name || 'No Plan'
        const slug = subscriptions[0]?.organization_subscription_plans?.slug || 'none'
        if (!planGroups[slug]) {
          planGroups[slug] = { name: plan, slug, count: 0 }
        }
        planGroups[slug].count++
      })
      const orgsByPlan = Object.values(planGroups).sort((a, b) => b.count - a.count)

      // Calculate monthly growth (last 6 months)
      const months: MonthData[] = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

        const count = orgData.filter((org: any) => {
          const created = new Date(org.created_at)
          return created <= monthEnd
        }).length || 0

        months.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          count
        })
      }

      // Fetch total members
      const { data: metrics } = await supabase
        .from('organization_metrics')
        .select('member_count')

      const metricsData = (metrics || []) as any[]
      const totalMembers = metricsData.reduce((sum: number, m: any) => sum + (m.member_count || 0), 0)

      // Active subscriptions
      const activeCount = orgData.filter((org: any) => {
        const subscriptions = org.organization_subscriptions || []
        return subscriptions[0]?.status === 'active'
      }).length

      const totalStats: TotalStats = {
        organizations: orgData.length,
        members: totalMembers,
        activeSubscriptions: activeCount
      }

      return {
        orgsByCountry,
        orgsByPlan,
        monthlyGrowth: months,
        totalStats
      }
    },
  })

  const getCountryFlag = (code: string) => {
    const flags: Record<string, string> = {
      US: '🇺🇸', TR: '🇹🇷', DE: '🇩🇪', GB: '🇬🇧',
      CA: '🇨🇦', AU: '🇦🇺', FR: '🇫🇷', NL: '🇳🇱'
    }
    return flags[code] || '🏳️'
  }

  const getPlanColor = (slug: string) => {
    const colors: Record<string, string> = {
      free: 'bg-slate-500 dark:bg-slate-600',
      basic: 'bg-blue-500',
      pro: 'bg-purple-500',
      enterprise: 'bg-yellow-500',
      none: 'bg-slate-700'
    }
    return colors[slug] || 'bg-slate-500'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const { orgsByCountry = [], orgsByPlan = [], monthlyGrowth = [], totalStats = { organizations: 0, members: 0, activeSubscriptions: 0 } } = analytics || {}
  const maxGrowth = Math.max(...monthlyGrowth.map(m => m.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform-wide metrics and insights</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Organizations</p>
              <p className="text-2xl font-bold">{totalStats.organizations}</p>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Members</p>
              <p className="text-2xl font-bold">{totalStats.members.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Active Subscriptions</p>
              <p className="text-2xl font-bold">{totalStats.activeSubscriptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
            Organization Growth
          </h2>
          <div className="h-64 flex items-end gap-2">
            {monthlyGrowth.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-purple-500 rounded-t transition-all duration-500"
                  style={{ height: `${(month.count / maxGrowth) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-xs text-muted-foreground">{month.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Total Organizations Over Time</span>
          </div>
        </div>

        {/* By Country */}
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe size={20} className="text-purple-600 dark:text-purple-400" />
            Organizations by Country
          </h2>
          <div className="space-y-3">
            {orgsByCountry.slice(0, 6).map(country => (
              <div key={country.code} className="flex items-center gap-3">
                <span className="text-2xl w-8">{getCountryFlag(country.code)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{country.name}</span>
                    <span className="font-medium">{country.count}</span>
                  </div>
                  <div className="h-2 bg-muted dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(country.count / totalStats.organizations) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {orgsByCountry.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* By Plan */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-600 dark:text-purple-400" />
          Organizations by Plan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {orgsByPlan.map(plan => (
            <div key={plan.slug} className="bg-muted dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-3 w-3 rounded-full ${getPlanColor(plan.slug)}`} />
                <span className="font-medium">{plan.name}</span>
              </div>
              <p className="text-3xl font-bold">{plan.count}</p>
              <p className="text-sm text-muted-foreground">
                {((plan.count / totalStats.organizations) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Placeholder */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />
          Revenue Analytics
        </h2>
        <div className="text-center py-8">
          <DollarSign size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
          <p className="text-muted-foreground">Revenue tracking will be available after payment integration</p>
          <p className="text-sm text-muted-foreground mt-2">Connect Stripe or iyzico to see MRR, ARR, and more</p>
        </div>
      </div>
    </div>
  )
}
