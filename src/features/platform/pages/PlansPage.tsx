import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type SubscriptionPlan = {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number | null
  price_yearly: number | null
  features: Record<string, boolean> | null
  is_active: boolean
  sort_order: number
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
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['platform-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_subscription_plans')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return (data || []) as SubscriptionPlan[]
    },
  })

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async ({ planId, monthly, yearly }: { planId: string; monthly: number; yearly: number }) => {
      const { error } = await (supabase
        .from('organization_subscription_plans') as any)
        .update({
          price_monthly: monthly,
          price_yearly: yearly,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (error) throw error
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

      const { error } = await (supabase
        .from('organization_subscription_plans') as any)
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
                      ${plan.price_monthly !== null && plan.price_monthly !== undefined ? plan.price_monthly : '0'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-medium">
                      ${plan.price_yearly !== null && plan.price_yearly !== undefined ? plan.price_yearly : '0'}
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
