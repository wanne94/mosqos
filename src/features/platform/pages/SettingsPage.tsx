import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Globe,
  Link2,
  Building2,
  CreditCard,
  BarChart3,
  Tag,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Country = {
  id: string
  code: string
  name: string
  currency_code: string
  currency_symbol: string
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type TabType = 'general' | 'countries' | 'quick-links'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('general')

  // Fetch countries
  const { data: countries = [], isLoading: loadingCountries, error: countriesError } = useQuery({
    queryKey: ['platform-countries'],
    queryFn: async () => {
      console.log('Fetching countries...')
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name')

      if (error) {
        console.error('Countries fetch error:', error)
        throw error
      }
      console.log('Countries fetched:', data)
      return (data || []) as Country[]
    },
  })

  // Fetch organization count
  const { data: orgCount = 0, isLoading: loadingOrgCount } = useQuery({
    queryKey: ['platform-org-count'],
    queryFn: async () => {
      console.log('Fetching org count...')
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Org count fetch error:', error)
        throw error
      }
      console.log('Org count:', count)
      return count || 0
    },
  })

  // Fetch active subscription count
  const { data: activeSubCount = 0, isLoading: loadingSubCount } = useQuery({
    queryKey: ['platform-active-subscriptions-count'],
    queryFn: async () => {
      console.log('Fetching active subscription count...')
      const { count, error } = await supabase
        .from('organization_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (error) {
        console.error('Active sub count fetch error:', error)
        throw error
      }
      console.log('Active sub count:', count)
      return count || 0
    },
  })

  // Toggle country active status mutation
  const toggleCountryMutation = useMutation({
    mutationFn: async ({ countryId, isActive }: { countryId: string; isActive: boolean }) => {
      const { error } = await (supabase
        .from('countries') as any)
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', countryId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-countries'] })
    },
  })

  const handleToggleCountry = (country: Country) => {
    toggleCountryMutation.mutate({
      countryId: country.id,
      isActive: !country.is_active
    })
  }

  const getCountryFlag = (code: string) => {
    const flags: Record<string, string> = {
      US: '🇺🇸', TR: '🇹🇷', DE: '🇩🇪', GB: '🇬🇧',
      CA: '🇨🇦', AU: '🇦🇺', FR: '🇫🇷', NL: '🇳🇱'
    }
    return flags[code] || '🏳️'
  }

  const quickLinks = [
    {
      title: 'Plans & Pricing',
      description: 'Manage subscription plans and pricing tiers',
      icon: CreditCard,
      href: '/platform/plans',
      color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Discount Codes',
      description: 'Create and manage promotional discount codes',
      icon: Tag,
      href: '/platform/discount-codes',
      color: 'bg-green-500/20 text-green-600 dark:text-green-400'
    },
    {
      title: 'Analytics',
      description: 'View platform metrics and performance data',
      icon: BarChart3,
      href: '/platform/analytics',
      color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Organizations',
      description: 'Browse and manage all registered organizations',
      icon: Building2,
      href: '/platform/organizations',
      color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
          <strong>Debug Info:</strong>
          <ul className="mt-2 space-y-1">
            <li>Countries: {loadingCountries ? 'Loading...' : `${countries.length} loaded`}</li>
            <li>Org Count: {loadingOrgCount ? 'Loading...' : orgCount}</li>
            <li>Active Subs: {loadingSubCount ? 'Loading...' : activeSubCount}</li>
            {countriesError && <li className="text-red-600">Error: {countriesError.message}</li>}
          </ul>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="text-primary" size={28} />
            Platform Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your platform configuration
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border dark:border-slate-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('countries')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'countries'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
          >
            Countries
          </button>
          <button
            onClick={() => setActiveTab('quick-links')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quick-links'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
          >
            Quick Links
          </button>
        </nav>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Platform Info Card */}
          <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe size={20} className="text-primary" />
              Platform Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Platform Name
                </label>
                <div className="px-4 py-2 bg-muted dark:bg-slate-700 rounded-lg font-medium">
                  MosqOS
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Version
                </label>
                <div className="px-4 py-2 bg-muted dark:bg-slate-700 rounded-lg font-medium">
                  0.1.0
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              Platform Statistics
            </h2>

            {loadingOrgCount || loadingSubCount || loadingCountries ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold">{orgCount}</div>
                  <div className="text-sm text-muted-foreground">Total Organizations</div>
                </div>

                <div className="bg-muted dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold">{activeSubCount}</div>
                  <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                </div>

                <div className="bg-muted dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold">{countries.filter(c => c.is_active).length}</div>
                  <div className="text-sm text-muted-foreground">Active Countries</div>
                </div>

                <div className="bg-muted dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Supported Languages</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Countries Tab */}
      {activeTab === 'countries' && (
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-border dark:border-slate-700">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe size={20} className="text-primary" />
              Country Configuration
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Enable or disable countries where organizations can register
            </p>
          </div>

          {countriesError ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">Error loading countries</p>
              <p className="text-sm text-muted-foreground">{countriesError.message}</p>
            </div>
          ) : loadingCountries ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-900/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Flag</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Country</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Code</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Currency</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Timezone</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map(country => (
                    <tr key={country.id} className="border-b border-border dark:border-slate-700/50 hover:bg-muted/50 dark:hover:bg-slate-700/50">
                      <td className="p-4">
                        <span className="text-2xl">{getCountryFlag(country.code)}</span>
                      </td>
                      <td className="p-4 font-medium">{country.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs rounded bg-muted dark:bg-slate-700 font-mono">
                          {country.code}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{country.currency_symbol} {country.currency_code}</td>
                      <td className="p-4 text-muted-foreground text-sm">{country.timezone}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          country.is_active
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {country.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleCountry(country)}
                          disabled={toggleCountryMutation.isPending}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            country.is_active
                              ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400'
                              : 'bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400'
                          } disabled:opacity-50`}
                        >
                          {country.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {countries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No countries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Links Tab */}
      {activeTab === 'quick-links' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Quick Navigation</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Quickly access other platform management sections
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6 hover:bg-muted dark:hover:bg-slate-700/50 transition-colors flex items-center gap-4"
              >
                <div className={`p-3 rounded-lg ${link.color}`}>
                  <link.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
