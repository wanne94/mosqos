import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react'

const stats = [
  {
    label: 'Total Organizations',
    value: '0',
    icon: Building2,
    change: '+0%',
    changeType: 'neutral' as const,
  },
  {
    label: 'Total Members',
    value: '0',
    icon: Users,
    change: '+0%',
    changeType: 'neutral' as const,
  },
  {
    label: 'Monthly Revenue',
    value: '$0',
    icon: DollarSign,
    change: '+0%',
    changeType: 'neutral' as const,
  },
  {
    label: 'Active Subscriptions',
    value: '0',
    icon: TrendingUp,
    change: '+0%',
    changeType: 'neutral' as const,
  },
]

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to MosqOS Platform Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
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
        })}
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
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
            <p className="text-sm">Activities will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
