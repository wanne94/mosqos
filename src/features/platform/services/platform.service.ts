import { supabase } from '@/lib/supabase/client'
import { executeQuery } from '@/lib/supabase/query-helpers'

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

export const platformService = {
  /**
   * Get platform-wide statistics
   */
  getStats: async (): Promise<PlatformStats> => {
    try {
      // Get total organizations count
      const organizations = await executeQuery(
        () => supabase.from('organizations').select('id'),
        'Fetching total organizations'
      )

      // Get total members count across all organizations
      const members = await executeQuery(
        () => supabase.from('members').select('id'),
        'Fetching total members'
      )

      // Get active subscriptions count and revenue
      // JOIN with subscription_plans and plan_pricing to get actual prices
      const subscriptions = await executeQuery(
        () => supabase
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
          .eq('status', 'active'),
        'Fetching active subscriptions with pricing'
      )

      // Calculate monthly revenue based on billing cycle
      const monthlyRevenue = subscriptions?.reduce((sum, sub) => {
        // @ts-ignore - Supabase JOIN type inference limitation
        const pricing = sub.subscription_plans?.plan_pricing?.[0]
        if (!pricing) return sum

        const price = sub.billing_cycle === 'monthly'
          ? pricing.price_monthly
          : pricing.price_yearly / 12  // Convert yearly to monthly average

        return sum + (price || 0)
      }, 0) || 0

      // TODO: Calculate percentage changes (requires historical data)
      // For now, return 0 for changes
      return {
        totalOrganizations: organizations?.length || 0,
        totalMembers: members?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
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
    return executeQuery(
      () => supabase
        .from('organizations')
        .select('id, name, slug, created_at, is_active')
        .order('created_at', { ascending: false })
        .limit(limit),
      'Fetching recent organizations'
    )
  },

  /**
   * Get all organizations
   */
  getAllOrganizations: async () => {
    return executeQuery(
      () => supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false }),
      'Fetching all organizations'
    )
  },
}
