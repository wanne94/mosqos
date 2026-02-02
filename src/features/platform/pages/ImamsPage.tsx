import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { UserCheck, Search, Building2, Mail, Phone, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { useAllImams } from '../hooks/useUsers'
import type { ImamFilters } from '../types/user.types'

export default function ImamsPage() {
  const { t } = useTranslation('platform')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOrganization, setFilterOrganization] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('')

  // Build filters
  const filters: ImamFilters = useMemo(() => ({
    search: searchQuery || undefined,
    organization_id: filterOrganization || undefined,
    is_active: filterStatus === '' ? undefined : filterStatus === 'active',
  }), [searchQuery, filterOrganization, filterStatus])

  // Fetch imams
  const { data: imams = [], isLoading } = useAllImams(filters)

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
          <h1 className="text-2xl font-bold">{t('imams.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('imams.totalCount', { count: imams.length })}
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
            placeholder={t('imams.search')}
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

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as '' | 'active' | 'inactive')}
          className="px-4 py-2 bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t('imams.allStatus')}</option>
          <option value="active">{t('imams.statusActive')}</option>
          <option value="inactive">{t('imams.statusInactive')}</option>
        </select>
      </div>

      {/* Imams List */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : imams.length > 0 ? (
          <div className="divide-y divide-border dark:divide-slate-700">
            {imams.map((imam) => (
              <div
                key={imam.id}
                className="flex items-center p-4 hover:bg-muted dark:hover:bg-slate-700/50 transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mr-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-700 dark:text-green-400 font-semibold text-lg">
                      {imam.first_name[0]}{imam.last_name[0]}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {imam.first_name} {imam.last_name}
                    </h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {t('imams.badge')}
                    </span>
                    {!imam.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {t('imams.statusInactive')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {/* Organization */}
                    <Link
                      to={`/platform/organizations/${imam.organization_id}`}
                      className="flex items-center gap-1 hover:text-primary transition"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {imam.organization_name}
                    </Link>

                    {/* Email */}
                    {imam.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {imam.email}
                      </span>
                    )}

                    {/* Phone */}
                    {imam.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {imam.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Joined Date */}
                <div className="text-sm text-muted-foreground">
                  {t('imams.joined', { date: new Date(imam.joined_at).toLocaleDateString() })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <UserCheck size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterOrganization || filterStatus
                ? t('imams.noResults')
                : t('imams.noImams')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('imams.description')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
