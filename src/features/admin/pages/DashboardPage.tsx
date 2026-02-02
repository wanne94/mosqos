import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  UserPlus,
  Home,
  UsersIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useMembers } from '@/features/members/hooks/useMembers'
import { useHouseholds } from '@/features/households'
import { AddMemberModal } from '@/features/members/components/AddMemberModal'
import { NewHouseholdModal } from '@/features/households'
import { StatsCard } from '../components'

export default function DashboardPage() {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addHouseholdOpen, setAddHouseholdOpen] = useState(false)

  // Fetch data
  const {
    members,
    stats: memberStats,
    isLoadingStats: isMemberStatsLoading,
    error: memberError,
  } = useMembers({ organizationId: currentOrganization?.id })

  const {
    households,
    stats: householdStats,
    isLoadingStats: isHouseholdStatsLoading,
    error: householdError,
  } = useHouseholds({ organizationId: currentOrganization?.id })

  const isLoading = isMemberStatsLoading || isHouseholdStatsLoading
  const hasError = memberError || householdError

  // Calculate average household size
  const averageHouseholdSize =
    householdStats?.total && householdStats.total > 0
      ? (members.length / householdStats.total).toFixed(1)
      : '0'

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('dashboard.error')}</h3>
        <p className="text-muted-foreground">{t('dashboard.errorMessage')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { organizationName: currentOrganization?.name })}
        </h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatsCard
              key={i}
              label={t('dashboard.stats.loading')}
              value="0"
              icon={Users}
              loading
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={t('dashboard.stats.totalMembers')}
            value={memberStats?.total || 0}
            icon={Users}
            iconColor="emerald"
          />
          <StatsCard
            label={t('dashboard.stats.activeMembers')}
            value={memberStats?.active || 0}
            icon={UserCheck}
            iconColor="blue"
          />
          <StatsCard
            label={t('dashboard.stats.newThisMonth')}
            value={memberStats?.newThisMonth || 0}
            icon={UserPlus}
            iconColor="green"
          />
          <StatsCard
            label={t('dashboard.stats.totalHouseholds')}
            value={householdStats?.total || 0}
            icon={Home}
            iconColor="purple"
          />
          <StatsCard
            label={t('dashboard.stats.averageHouseholdSize')}
            value={averageHouseholdSize}
            icon={UsersIcon}
            iconColor="amber"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.quickActions.title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Add New Member */}
          <button
            onClick={() => setAddMemberOpen(true)}
            className="w-full text-left px-6 py-4 rounded-xl border bg-card hover:bg-muted/50 transition flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-1">{t('dashboard.quickActions.addMember')}</p>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.quickActions.addMemberDesc')}
              </p>
            </div>
          </button>

          {/* Add New Household */}
          <button
            onClick={() => setAddHouseholdOpen(true)}
            className="w-full text-left px-6 py-4 rounded-xl border bg-card hover:bg-muted/50 transition flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-1">{t('dashboard.quickActions.addHousehold')}</p>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.quickActions.addHouseholdDesc')}
              </p>
            </div>
          </button>

          {/* View All Members */}
          <button
            onClick={() => navigate(`/${currentOrganization?.slug}/admin/people`)}
            className="w-full text-left px-6 py-4 rounded-xl border bg-card hover:bg-muted/50 transition flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-1">{t('dashboard.quickActions.viewPeople')}</p>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.quickActions.viewPeopleDesc')}
              </p>
            </div>
          </button>

          {/* View All Households */}
          <button
            onClick={() => navigate(`/${currentOrganization?.slug}/admin/households`)}
            className="w-full text-left px-6 py-4 rounded-xl border bg-card hover:bg-muted/50 transition flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-1">{t('dashboard.quickActions.viewHouseholds')}</p>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.quickActions.viewHouseholdsDesc')}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal isOpen={addMemberOpen} onClose={() => setAddMemberOpen(false)} />
      <NewHouseholdModal isOpen={addHouseholdOpen} onClose={() => setAddHouseholdOpen(false)} />
    </div>
  )
}
