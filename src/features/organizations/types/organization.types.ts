/**
 * Organization Types
 *
 * TypeScript types for organization entities and operations
 */

// Organization approval status
export type OrganizationStatus = 'pending' | 'approved' | 'rejected'

// Subscription status
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'paused'

// Country reference
export interface Country {
  id: string
  code: string
  name: string
  name_native?: string | null
  currency_code: string
  currency_symbol: string
  timezone: string
  locale: string
  is_active: boolean
}

// Subscription plan reference
export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  tier: number
}

// Organization subscription info
export interface OrganizationSubscription {
  id: string
  status: SubscriptionStatus
  billing_cycle: 'monthly' | 'yearly'
  plan_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  subscription_plans?: SubscriptionPlan | null
}

// Base organization entity
export interface Organization {
  id: string
  name: string
  slug: string
  country_id: string

  // Address
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null

  // Contact
  contact_email: string | null
  contact_phone: string | null
  website: string | null

  // Timezone
  timezone: string | null

  // Branding
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null

  // Settings
  settings: Record<string, unknown>

  // Approval workflow
  status: OrganizationStatus
  approved_at: string | null
  approved_by: string | null
  rejection_reason: string | null

  // Status
  is_active: boolean

  // Audit
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// Organization with related data (for list views)
export interface OrganizationWithRelations extends Organization {
  countries?: Country | null
  organization_subscriptions?: OrganizationSubscription[] | null
  memberCount?: number | string
}

// Input for creating an organization (self-service signup)
export interface CreateOrganizationInput {
  name: string
  country_id: string
  contact_email: string
  status?: OrganizationStatus
}

// Input for admin creating an organization
export interface AdminCreateOrganizationInput {
  name: string
  country_id: string
  contact_email: string
  contact_phone?: string
  address_line1?: string
  city?: string
  state?: string
  postal_code?: string
  timezone?: string
  status?: OrganizationStatus
}

// Input for updating an organization
export interface UpdateOrganizationInput {
  name?: string
  slug?: string
  country_id?: string

  // Address
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null

  // Contact
  contact_email?: string | null
  contact_phone?: string | null
  website?: string | null

  // Timezone
  timezone?: string | null

  // Branding
  logo_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null

  // Settings
  settings?: Record<string, unknown>

  // Status
  is_active?: boolean
}

// Organization statistics
export interface OrganizationStats {
  memberCount: number
  householdCount: number
  totalDonations: number
  activeClasses: number
  openCases: number
}

// Filter options for organizations list
export interface OrganizationFilters {
  search?: string
  country_id?: string
  status?: OrganizationStatus
  plan_slug?: string
  is_active?: boolean
}
