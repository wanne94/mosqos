import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, ChevronRight, Building2, Shield, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { useAllUsers } from '../hooks/useUsers'
import type { UserFilters, UserRole } from '../types/user.types'

// Role badge colors
const roleColors: Record<UserRole, string> = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delegate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  imam: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function UsersPage() {
  const { t } = useTranslation('platform')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOrganization, setFilterOrganization] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')

  // Build filters
  const filters: UserFilters = useMemo(() => ({
    search: searchQuery || undefined,
    organization_id: filterOrganization || undefined,
    role: filterRole || undefined,
  }), [searchQuery, filterOrganization, filterRole])

  // Fetch users
  const { data: users = [], isLoading } = useAllUsers(filters)

  // Fetch organizations for filter dropdown
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name')

      if (error) throw error
      return data || []
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('users.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('users.totalCount', { count: users.length })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('users.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Organization Filter */}
        <select
          value={filterOrganization}
          onChange={(e) => setFilterOrganization(e.target.value)}
          className="px-4 py-2 bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t('users.allOrganizations')}</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
          className="px-4 py-2 bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t('users.allRoles')}</option>
          <option value="owner">{t('users.roleOwner')}</option>
          <option value="delegate">{t('users.roleDelegate')}</option>
          <option value="imam">{t('users.roleImam')}</option>
          <option value="member">{t('users.roleMember')}</option>
        </select>
      </div>

      {/* Users List */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length > 0 ? (
          <div className="divide-y divide-border dark:divide-slate-700">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/platform/users/${user.id}`}
                className="flex items-center p-4 hover:bg-muted dark:hover:bg-slate-700/50 transition-colors"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {user.user_metadata.full_name as string || user.email}
                    </h3>
                    {!user.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {t('users.statusInactive')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  {/* Organizations */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {user.organizations.slice(0, 3).map((org) => (
                      <span
                        key={`${user.id}-${org.organization_id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <Building2 className="w-3 h-3" />
                        {org.organization_name}
                        <span className={`px-1.5 py-0.5 rounded text-xs ${roleColors[org.role]}`}>
                          {org.role}
                        </span>
                      </span>
                    ))}
                    {user.organizations.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{user.organizations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={20} className="text-muted-foreground dark:text-slate-500" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterOrganization || filterRole
                ? t('users.noResults')
                : t('users.noUsers')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
