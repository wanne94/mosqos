import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Search, Users, Calendar, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/shared/types/supabase.types'

type OrganizationCountry = {
  id: string
  code: string
  name: string
}

type SubscriptionPlan = {
  id: string
  name: string
  slug: string
}

type OrganizationSubscription = {
  id: string
  status: string
  plan_id: string | null
  organization_subscription_plans?: SubscriptionPlan | null
}

type Organization = Database['public']['Tables']['organizations']['Row'] & {
  organization_countries?: OrganizationCountry | null
  organization_subscriptions?: OrganizationSubscription[] | null
  memberCount: string | number
}

type Country = {
  id: string
  code: string
  name: string
  is_active: boolean
}

type Plan = {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
}

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterPlan, setFilterPlan] = useState('')

  // Fetch organizations
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['platform-organizations'],
    queryFn: async () => {
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_countries (id, code, name),
          organization_subscriptions (
            id, status, plan_id,
            organization_subscription_plans (id, name, slug)
          )
        `)
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Temporary: Set member count to N/A until new auth system is built
      const orgsWithCounts = (orgs || []).map((org: any) => ({
        ...(org as object),
        memberCount: 'N/A'
      })) as Organization[]

      return orgsWithCounts
    },
  })

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ['organization-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_countries')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return (data || []) as Country[]
    },
  })

  // Fetch plans
  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return (data || []) as Plan[]
    },
  })

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = !searchQuery ||
      org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCountry = !filterCountry || org.country_id === filterCountry
    const matchesPlan = !filterPlan ||
      org.organization_subscriptions?.[0]?.organization_subscription_plans?.slug === filterPlan

    return matchesSearch && matchesCountry && matchesPlan
  })

  const getStatusBadge = (subscription: OrganizationSubscription | undefined) => {
    if (!subscription) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-slate-600 dark:bg-slate-700 text-slate-300 dark:text-slate-400">
          No Plan
        </span>
      )
    }

    const status = subscription.status as SubscriptionStatus
    const colors: Record<SubscriptionStatus, string> = {
      active: 'bg-green-500/20 text-green-600 dark:text-green-400',
      trialing: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      past_due: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      canceled: 'bg-red-500/20 text-red-600 dark:text-red-400',
      paused: 'bg-slate-500/20 text-slate-600 dark:text-slate-400'
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPlanBadge = (subscription: OrganizationSubscription | undefined) => {
    if (!subscription?.organization_subscription_plans) {
      return null
    }

    const plan = subscription.organization_subscription_plans
    const colors: Record<string, string> = {
      free: 'bg-slate-600 dark:bg-slate-700 text-slate-300 dark:text-slate-400',
      basic: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      pro: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      enterprise: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[plan.slug] || colors.free}`}>
        {plan.name}
      </span>
    )
  }

  const getCountryFlag = (code: string) => {
    const flags: Record<string, string> = {
      US: '🇺🇸', TR: '🇹🇷', DE: '🇩🇪', GB: '🇬🇧',
      CA: '🇨🇦', AU: '🇦🇺', FR: '🇫🇷', NL: '🇳🇱'
    }
    return flags[code] || '🏳️'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            {organizations.length} total organizations
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
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Country Filter */}
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="px-4 py-2 bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Countries</option>
          {countries.map(country => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>

        {/* Plan Filter */}
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-2 bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Plans</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.slug}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      {/* Organizations List */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
        {filteredOrgs.length > 0 ? (
          <div className="divide-y divide-border dark:divide-slate-700">
            {filteredOrgs.map((org) => (
              <Link
                key={org.id}
                to={`/platform/organizations/${org.id}`}
                className="flex items-center p-4 hover:bg-muted dark:hover:bg-slate-700/50 transition-colors"
              >
                {/* Logo */}
                <div className="flex-shrink-0 mr-4">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted dark:bg-slate-700 flex items-center justify-center">
                      <Building2 size={24} className="text-muted-foreground dark:text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{org.name}</h3>
                    {org.organization_countries && (
                      <span className="text-lg" title={org.organization_countries.name}>
                        {getCountryFlag(org.organization_countries.code)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {org.memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(org.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mr-4">
                  {getPlanBadge(org.organization_subscriptions?.[0])}
                  {getStatusBadge(org.organization_subscriptions?.[0])}
                </div>

                {/* Arrow */}
                <ChevronRight size={20} className="text-muted-foreground dark:text-slate-500" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Building2 size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterCountry || filterPlan
                ? 'No organizations match your filters'
                : 'No organizations yet. Use the invite system to create new organizations.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
