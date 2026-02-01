import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

export interface PlatformStats {
  totalOrganizations: number
  totalMembers: number
  activeSubscriptions: number
  monthlyRevenue: number
  organizationsChange: number
  membersChange: number
  subscriptionsChange: number
  revenueChange: number
}

// Helper type for subscription query with joins
interface SubscriptionWithPricing {
  id: string
  billing_cycle: string
  subscription_plans?: {
    id: string
    plan_pricing?: Array<{
      price_monthly: number
      price_yearly: number
    }>
  }
}

export const platformService = {
  /**
   * Get platform-wide statistics
   */
  getStats: async (): Promise<PlatformStats> => {
    try {
      // Get total organizations count
      const { data: organizations, error: orgError } = await db
        .from('organizations')
        .select('id')

      if (orgError) throw orgError

      // Get total members count across all organizations
      const { data: members, error: membersError } = await db
        .from('members')
        .select('id')

      if (membersError) throw membersError

      // Get active subscriptions count and revenue
      // JOIN with subscription_plans and plan_pricing to get actual prices
      const { data: subscriptions, error: subsError } = await db
        .from('organization_subscriptions')
        .select(`
          id,
          billing_cycle,
          subscription_plans!inner (
            id,
            plan_pricing!inner (
              price_monthly,
              price_yearly
            )
          )
        `)
        .eq('status', 'active')

      if (subsError) throw subsError

      // Calculate monthly revenue based on billing cycle
      const typedSubscriptions = (subscriptions || []) as unknown as SubscriptionWithPricing[]
      const monthlyRevenue = typedSubscriptions.reduce((sum, sub) => {
        const pricing = sub.subscription_plans?.plan_pricing?.[0]
        if (!pricing) return sum

        const price = sub.billing_cycle === 'monthly'
          ? pricing.price_monthly
          : pricing.price_yearly / 12  // Convert yearly to monthly average

        return sum + (price || 0)
      }, 0)

      // TODO: Calculate percentage changes (requires historical data)
      // For now, return 0 for changes
      return {
        totalOrganizations: (organizations as unknown[])?.length || 0,
        totalMembers: (members as unknown[])?.length || 0,
        activeSubscriptions: typedSubscriptions.length,
        monthlyRevenue,
        organizationsChange: 0,
        membersChange: 0,
        subscriptionsChange: 0,
        revenueChange: 0,
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error)
      throw error
    }
  },

  /**
   * Get recent organizations
   */
  getRecentOrganizations: async (limit = 5) => {
    const { data, error } = await db
      .from('organizations')
      .select('id, name, slug, created_at, is_active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Get all organizations
   */
  getAllOrganizations: async () => {
    const { data, error } = await db
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
}
