import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Check, X, DollarSign, Users, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/shared/types/database.types'

type DbSubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']

type SubscriptionPlan = {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number | null
  price_yearly: number | null
  features: Record<string, boolean> | null
  is_active: boolean
  sort_order: number | null
  created_at: string
  updated_at: string
}

type FeatureName = 'people' | 'finance' | 'education' | 'services' | 'umrah' | 'ai' | 'api' | 'sso' | 'priority_support'

const FEATURE_NAMES: Record<FeatureName, string> = {
  people: 'People Management',
  finance: 'Finance & Donations',
  education: 'Education Module',
  services: 'Case Management',
  umrah: 'Hajj & Umrah',
  ai: 'Mosque AI',
  api: 'API Access',
  sso: 'SSO Integration',
  priority_support: 'Priority Support'
}

const FEATURES: FeatureName[] = ['people', 'finance', 'education', 'services', 'umrah', 'ai', 'api', 'sso', 'priority_support']

type EditPricingFormData = {
  monthly_price: string
  yearly_price: string
}

export default function PlansPage() {
  const queryClient = useQueryClient()
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [formData, setFormData] = useState<EditPricingFormData>({
    monthly_price: '',
    yearly_price: ''
  })

  // Fetch plans
  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['platform-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order')

      if (error) throw error
      // Map database rows to local type with features cast
      return (data || []).map((row: DbSubscriptionPlan): SubscriptionPlan => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        price_monthly: null, // Prices are in plan_pricing table
        price_yearly: null,
        features: row.features as Record<string, boolean> | null,
        is_active: row.is_active,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
    },
  })

  // Fetch subscription stats
  const { data: stats } = useQuery({
    queryKey: ['platform-subscription-stats'],
    queryFn: async () => {
      // Active subscriptions
      const { data: subs, error: subsError } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('status', 'active')

      if (subsError) throw subsError

      // Total organizations
      const { count: orgCount, error: orgError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      if (orgError) throw orgError

      // Total members
      const { count: memberCount, error: memberError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })

      if (memberError) throw memberError

      const activeCount = subs?.length || 0
      // For now, return 0 as we don't have actual billing data
      const monthlyRevenue = 0

      return {
        activeCount,
        monthlyRevenue,
        totalOrganizations: orgCount || 0,
        totalMembers: memberCount || 0
      }
    },
  })

  const formatPrice = (price: number | null | undefined): string => {
    const value = price ?? 0
    return value.toFixed(2)
  }

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async ({ planId, monthly, yearly }: { planId: string; monthly: number; yearly: number }) => {
      // Note: price_monthly and price_yearly are not in the database schema
      // They should come from plan_pricing table instead
      // This is a workaround until proper pricing table updates are implemented
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (error) throw error
      // TODO: Update plan_pricing table with monthly/yearly prices
      console.log('Price update requested:', { planId, monthly, yearly })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-subscription-plans'] })
      setEditingPlan(null)
    },
  })

  // Toggle feature mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ planId, featureName, currentFeatures }: {
      planId: string
      featureName: string
      currentFeatures: Record<string, boolean> | null
    }) => {
      const features = currentFeatures || {}
      const updatedFeatures = {
        ...features,
        [featureName]: !features[featureName]
      }

      const { error } = await supabase
        .from('subscription_plans')
        .update({
          features: updatedFeatures,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-subscription-plans'] })
    },
  })

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setFormData({
      monthly_price: plan.price_monthly?.toString() || '',
      yearly_price: plan.price_yearly?.toString() || ''
    })
  }

  const handleSavePricing = async () => {
    if (!editingPlan) return

    updatePricingMutation.mutate({
      planId: editingPlan.id,
      monthly: parseFloat(formData.monthly_price) || 0,
      yearly: parseFloat(formData.yearly_price) || 0
    })
  }

  const handleToggleFeature = (plan: SubscriptionPlan, featureName: string) => {
    toggleFeatureMutation.mutate({
      planId: plan.id,
      featureName,
      currentFeatures: plan.features
    })
  }

  const getPlanBadgeColor = (slug: string): string => {
    const colors: Record<string, string> = {
      free: 'bg-slate-600 dark:bg-slate-700',
      basic: 'bg-blue-600',
      pro: 'bg-purple-600',
      enterprise: 'bg-yellow-600'
    }
    return colors[slug] || 'bg-slate-600'
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
          <h1 className="text-2xl font-bold">Subscription Plans & Pricing</h1>
          <p className="text-muted-foreground mt-1">Manage your plan pricing (in USD)</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">${formatPrice(stats?.monthlyRevenue)}</p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.activeCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Building2 className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalOrganizations ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Organizations</p>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Users className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalMembers ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-slate-700">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plan</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Description</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Monthly Price</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Yearly Price</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} className="border-b border-border dark:border-slate-700/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPlanBadgeColor(plan.slug)} text-white`}>
                        {plan.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground dark:text-slate-300">{plan.description}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-medium">
                      ${formatPrice(plan.price_monthly)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-medium">
                      ${formatPrice(plan.price_yearly)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      plan.is_active
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="text-primary hover:opacity-80 transition-opacity"
                      title="Edit pricing"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Matrix */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-border dark:border-slate-700">
          <h2 className="text-lg font-semibold">Feature Matrix</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Click on any checkmark or X to toggle feature access
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-slate-700">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Feature</th>
                {plans.map(plan => (
                  <th key={plan.id} className="text-center p-4 text-sm font-medium text-muted-foreground">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(feature => (
                <tr key={feature} className="border-b border-border dark:border-slate-700/50">
                  <td className="p-4 font-medium">{FEATURE_NAMES[feature]}</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="p-4 text-center">
                      <button
                        onClick={() => handleToggleFeature(plan, feature)}
                        className="hover:bg-muted dark:hover:bg-slate-700 rounded-lg p-2 transition-colors"
                        title={`Click to ${plan.features?.[feature] ? 'disable' : 'enable'} for ${plan.name}`}
                        disabled={toggleFeatureMutation.isPending}
                      >
                        {plan.features?.[feature] ? (
                          <Check size={20} className="text-green-600 dark:text-green-400 mx-auto" />
                        ) : (
                          <X size={20} className="text-slate-400 dark:text-slate-600 mx-auto" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Pricing Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card dark:bg-slate-800 rounded-xl p-6 w-full max-w-md border dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4">Edit {editingPlan.name} Pricing</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Monthly Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_price}
                  onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="29.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Yearly Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.yearly_price}
                  onChange={(e) => setFormData({ ...formData, yearly_price: e.target.value })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="299.99"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSavePricing}
                  disabled={updatePricingMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {updatePricingMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingPlan(null)}
                  disabled={updatePricingMutation.isPending}
                  className="flex-1 px-4 py-2 bg-muted dark:bg-slate-700 rounded-lg hover:bg-muted/80 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
