import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

export interface OrganizationDetails {
  id: string
  name: string
  slug: string
  contact_email: string | null
  contact_phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  logo_url: string | null
  website: string | null
  is_active: boolean
  created_at: string
  country_id: string
  status?: string
  approved_at?: string | null
  approved_by?: string | null
  rejection_reason?: string | null
  countries?: {
    id: string
    code: string
    name: string
  } | null
  organization_subscriptions?: Array<{
    id: string
    status: string
    stripe_subscription_id: string | null
    stripe_customer_id: string | null
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    trial_ends_at: string | null
    plan_id: string | null
    subscription_plans?: {
      id: string
      name: string
      slug: string
    } | null
  }> | null
  organization_owners?: Array<{
    id: string
    user_id: string
    created_at: string
  }> | null
  organization_delegates?: Array<{
    id: string
    user_id: string
    created_at: string
  }> | null
}

export function useOrganizationDetails(organizationId: string) {
  return useQuery({
    queryKey: ['platform-organization-details', organizationId],
    queryFn: async () => {
      const { data, error } = await db
        .from('organizations')
        .select(`
          *,
          countries (id, code, name),
          organization_subscriptions (
            id, status, stripe_subscription_id, stripe_customer_id,
            current_period_start, current_period_end, cancel_at_period_end,
            trial_ends_at, plan_id,
            subscription_plans (id, name, slug)
          ),
          organization_owners (id, user_id, created_at),
          organization_delegates (id, user_id, created_at)
        `)
        .eq('id', organizationId)
        .single()

      if (error) throw error
      return data as OrganizationDetails
    },
    enabled: !!organizationId,
  })
}

export function useOrganizationStats(organizationId: string) {
  return useQuery({
    queryKey: ['platform-organization-stats', organizationId],
    queryFn: async () => {
      // Get member count
      const { count: memberCount, error: memberError } = await db
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      if (memberError) throw memberError

      return {
        memberCount: memberCount || 0,
      }
    },
    enabled: !!organizationId,
  })
}
