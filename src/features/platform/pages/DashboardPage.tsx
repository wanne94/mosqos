import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, DollarSign, TrendingUp, Loader2, LucideIcon, Plus, Clock, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlatformStats, useRecentOrganizations } from '../hooks/usePlatformStats'
import { usePendingOrganizationsCount } from '@/features/organizations/hooks/useOrganizations'
import CreateOrganizationModal from '../components/CreateOrganizationModal'
import PendingOrganizationsList from '../components/PendingOrganizationsList'

interface StatItem {
  label: string
  value: string
  icon: LucideIcon
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
}

export default function DashboardPage() {
  const { t } = useTranslation('platform')
  const { data: stats, isLoading: statsLoading, error: statsError } = usePlatformStats()
  const { data: recentOrgs, isLoading: orgsLoading } = useRecentOrganizations()
  const { data: pendingCount = 0 } = usePendingOrganizationsCount()

  const [createModalOpen, setCreateModalOpen] = useState(false)

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
      label: t('dashboard.stats.totalOrganizations'),
      value: stats?.totalOrganizations.toString() || '0',
      icon: Building2,
      change: formatChange(stats?.organizationsChange || 0),
      changeType: getChangeType(stats?.organizationsChange || 0),
    },
    {
      label: t('dashboard.stats.totalMembers'),
      value: stats?.totalMembers.toString() || '0',
      icon: Users,
      change: formatChange(stats?.membersChange || 0),
      changeType: getChangeType(stats?.membersChange || 0),
    },
    {
      label: t('dashboard.stats.monthlyRevenue'),
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: DollarSign,
      change: formatChange(stats?.revenueChange || 0),
      changeType: getChangeType(stats?.revenueChange || 0),
    },
    {
      label: t('dashboard.stats.activeSubscriptions'),
      value: stats?.activeSubscriptions.toString() || '0',
      icon: TrendingUp,
      change: formatChange(stats?.subscriptionsChange || 0),
      changeType: getChangeType(stats?.subscriptionsChange || 0),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcome')}
        </p>
      </div>

      {/* Error State */}
      {statsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">{t('dashboard.errorLoading')}</p>
          <p className="text-sm">{statsError instanceof Error ? statsError.message : 'Unknown error'}</p>
        </div>
      )}

      {/* Pending Applications Alert */}
      {pendingCount > 0 && (
        <Link
          to="/platform/organizations?status=pending"
          className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                {pendingCount} {t('dashboard.pendingApplications')}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                {t('dashboard.pendingDescription')}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </Link>
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

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Actions */}
        <div className="p-6 rounded-xl border bg-card">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h2>
          <div className="space-y-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-medium">{t('dashboard.createOrg')}</span>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.createOrgDesc')}
                </p>
              </div>
            </button>
            <Link
              to="/platform/users"
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="font-medium">{t('dashboard.manageUsers')}</span>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.manageUsersDesc')}
                </p>
              </div>
            </Link>
            <Link
              to="/platform/analytics"
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <span className="font-medium">{t('dashboard.viewReports')}</span>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.viewReportsDesc')}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Organizations */}
        <div className="p-6 rounded-xl border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.recentOrganizations')}</h2>
            <Link to="/platform/organizations" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {orgsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentOrgs && recentOrgs.length > 0 ? (
            <div className="space-y-3">
              {recentOrgs.map((org) => (
                <Link
                  key={org.id}
                  to={`/platform/organizations/${org.id}`}
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
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {org.is_active ? 'Active' : 'Inactive'}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('dashboard.noOrganizations')}</p>
              <p className="text-sm">{t('dashboard.createFirst')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Organizations */}
      {pendingCount > 0 && (
        <PendingOrganizationsList limit={5} />
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  )
}
