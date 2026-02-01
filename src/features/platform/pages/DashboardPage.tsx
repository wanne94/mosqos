import { Building2, Users, DollarSign, TrendingUp, Loader2, LucideIcon } from 'lucide-react'
import { usePlatformStats, useRecentOrganizations } from '../hooks/usePlatformStats'

interface StatItem {
  label: string
  value: string
  icon: LucideIcon
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = usePlatformStats()
  const { data: recentOrgs, isLoading: orgsLoading } = useRecentOrganizations()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100) // Assuming amount is in cents
  }

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getChangeType = (change: number): 'positive' | 'negative' | 'neutral' => {
    if (change > 0) return 'positive'
    if (change < 0) return 'negative'
    return 'neutral'
  }

  const statsData: StatItem[] = [
    {
      label: 'Total Organizations',
      value: stats?.totalOrganizations.toString() || '0',
      icon: Building2,
      change: formatChange(stats?.organizationsChange || 0),
      changeType: getChangeType(stats?.organizationsChange || 0),
    },
    {
      label: 'Total Members',
      value: stats?.totalMembers.toString() || '0',
      icon: Users,
      change: formatChange(stats?.membersChange || 0),
      changeType: getChangeType(stats?.membersChange || 0),
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: DollarSign,
      change: formatChange(stats?.revenueChange || 0),
      changeType: getChangeType(stats?.revenueChange || 0),
    },
    {
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions.toString() || '0',
      icon: TrendingUp,
      change: formatChange(stats?.subscriptionsChange || 0),
      changeType: getChangeType(stats?.subscriptionsChange || 0),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to MosqOS Platform Dashboard
        </p>
      </div>

      {/* Error State */}
      {statsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading dashboard data</p>
          <p className="text-sm">{statsError instanceof Error ? statsError.message : 'Unknown error'}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          statsData.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="p-6 rounded-xl border bg-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            )
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border bg-card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition">
              <span className="font-medium">Create New Organization</span>
              <p className="text-sm text-muted-foreground">
                Add a new mosque to the platform
              </p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition">
              <span className="font-medium">Send Invitations</span>
              <p className="text-sm text-muted-foreground">
                Invite new organizations to join
              </p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition">
              <span className="font-medium">View Reports</span>
              <p className="text-sm text-muted-foreground">
                Platform analytics and insights
              </p>
            </button>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card">
          <h2 className="text-lg font-semibold mb-4">Recent Organizations</h2>
          {orgsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentOrgs && recentOrgs.length > 0 ? (
            <div className="space-y-3">
              {recentOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">/{org.slug}</p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      org.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {org.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No organizations yet</p>
              <p className="text-sm">Create your first organization to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
