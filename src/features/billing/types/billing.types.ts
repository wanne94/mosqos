// Billing & Subscription Module Types for MosqOS

// ============================================================================
// ENUMS
// ============================================================================

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  PAUSED = 'paused',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  TRIAL_EXTENSION = 'trial_extension',
  FREE_MONTHS = 'free_months',
}

export enum CouponRedemptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  USED = 'used',
}

// ============================================================================
// SUBSCRIPTION PLAN TYPES
// ============================================================================

export interface PlanFeatures {
  donations: boolean
  education: boolean
  cases: boolean
  umrah: boolean
  qurbani: boolean
  islamic_services: boolean
  api_access: boolean
  custom_domain: boolean
  white_label: boolean
  priority_support: boolean
  advanced_reports: boolean
  bank_reconciliation: boolean
  [key: string]: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string | null
  tier: number
  member_limit: number | null
  admin_limit: number
  storage_limit_gb: number | null
  features: PlanFeatures
  is_popular: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlanPricing {
  id: string
  plan_id: string
  country_id: string
  price_monthly: number
  price_yearly: number
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  trial_days: number
  created_at: string
  updated_at: string
  // Joined fields
  plan?: SubscriptionPlan
  country?: {
    id: string
    code: string
    name: string
    currency_code: string
    currency_symbol: string
  }
}

export interface PlanWithPricing extends SubscriptionPlan {
  pricing: PlanPricing | null
  monthly_price: number
  yearly_price: number
  currency_code: string
  currency_symbol: string
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface OrganizationSubscription {
  id: string
  organization_id: string
  plan_id: string
  status: SubscriptionStatus
  billing_cycle: BillingCycle
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string | null
  trial_ends_at: string | null
  cancelled_at: string | null
  cancel_at_period_end: boolean
  current_member_count: number
  current_storage_used_mb: number
  created_at: string
  updated_at: string
  // Joined fields
  plan?: SubscriptionPlan
  // Computed fields
  is_trialing?: boolean
  trial_days_remaining?: number
  days_until_renewal?: number
  is_at_member_limit?: boolean
  member_usage_percentage?: number
}

export interface SubscriptionWithDetails extends OrganizationSubscription {
  plan: SubscriptionPlan
  pricing: PlanPricing | null
  active_coupon: CouponRedemption | null
}

// ============================================================================
// COUPON TYPES
// ============================================================================

export interface Coupon {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: CouponDiscountType
  discount_value: number
  duration_months: number | null
  currency: string
  valid_plans: string[] | null
  valid_countries: string[] | null
  min_billing_cycle: BillingCycle | null
  usage_limit: number | null
  usage_limit_per_org: number
  current_usage: number
  first_time_only: boolean
  stackable: boolean
  minimum_amount: number | null
  starts_at: string
  expires_at: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface CouponRedemption {
  id: string
  coupon_id: string
  organization_id: string
  subscription_id: string | null
  discount_applied: number
  currency: string
  original_amount: number | null
  final_amount: number | null
  status: CouponRedemptionStatus
  valid_from: string
  valid_until: string | null
  months_remaining: number | null
  redeemed_at: string
  applied_by: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Joined fields
  coupon?: Coupon
}

export interface CouponValidationResult {
  valid: boolean
  error?: string
  coupon?: {
    id: string
    code: string
    name: string
    description: string | null
    discount_type: CouponDiscountType
    discount_value: number
    duration_months: number | null
    currency: string
  }
}

export interface CouponApplicationResult {
  success: boolean
  error?: string
  redemption_id?: string
  discount_amount?: number
  final_amount?: number
  valid_until?: string
  coupon?: CouponValidationResult['coupon']
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateSubscriptionInput {
  organization_id: string
  plan_id: string
  billing_cycle: BillingCycle
  payment_method_id?: string
  coupon_code?: string
}

export interface UpdateSubscriptionInput {
  plan_id?: string
  billing_cycle?: BillingCycle
  cancel_at_period_end?: boolean
}

export interface CreateCouponInput {
  code: string
  name: string
  description?: string | null
  discount_type: CouponDiscountType
  discount_value: number
  duration_months?: number | null
  currency?: string
  valid_plans?: string[] | null
  valid_countries?: string[] | null
  min_billing_cycle?: BillingCycle | null
  usage_limit?: number | null
  usage_limit_per_org?: number
  first_time_only?: boolean
  stackable?: boolean
  minimum_amount?: number | null
  starts_at?: string
  expires_at?: string | null
  is_active?: boolean
  notes?: string | null
}

export interface UpdateCouponInput {
  name?: string
  description?: string | null
  discount_type?: CouponDiscountType
  discount_value?: number
  duration_months?: number | null
  valid_plans?: string[] | null
  valid_countries?: string[] | null
  min_billing_cycle?: BillingCycle | null
  usage_limit?: number | null
  usage_limit_per_org?: number
  first_time_only?: boolean
  stackable?: boolean
  minimum_amount?: number | null
  starts_at?: string
  expires_at?: string | null
  is_active?: boolean
  notes?: string | null
}

export interface ValidateCouponInput {
  code: string
  organization_id: string
  plan_slug?: string
  country_code?: string
}

export interface ApplyCouponInput {
  code: string
  organization_id: string
  subscription_id: string
  original_amount: number
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface CouponFilters {
  search?: string
  discount_type?: CouponDiscountType
  is_active?: boolean
  is_expired?: boolean
  valid_for_plan?: string
  valid_for_country?: string
}

export interface RedemptionFilters {
  coupon_id?: string
  organization_id?: string
  status?: CouponRedemptionStatus
  date_from?: string
  date_to?: string
}

// ============================================================================
// BILLING REPORT TYPES
// ============================================================================

export interface BillingStatistics {
  total_organizations: number
  paying_organizations: number
  trialing_organizations: number
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
  average_revenue_per_org: number
  churn_rate: number
  conversion_rate: number
  by_plan: Record<string, {
    count: number
    revenue: number
  }>
  by_country: Record<string, {
    count: number
    revenue: number
  }>
}

export interface CouponStatistics {
  total_coupons: number
  active_coupons: number
  total_redemptions: number
  total_discount_given: number
  by_type: Record<CouponDiscountType, {
    count: number
    redemptions: number
    discount_total: number
  }>
  top_coupons: Array<{
    code: string
    name: string
    redemptions: number
    total_discount: number
  }>
}

export interface BillingDashboard {
  statistics: BillingStatistics
  coupon_statistics: CouponStatistics
  recent_subscriptions: OrganizationSubscription[]
  expiring_trials: OrganizationSubscription[]
  past_due_subscriptions: OrganizationSubscription[]
  revenue_trend: Array<{
    period: string
    revenue: number
    new_subscribers: number
    churned: number
  }>
}

// ============================================================================
// FEATURE GATING
// ============================================================================

export interface FeatureGateConfig {
  feature: keyof PlanFeatures
  fallback?: React.ReactNode
  children: React.ReactNode
}

export interface SubscriptionLimits {
  member_limit: number | null
  admin_limit: number
  storage_limit_gb: number | null
  current_member_count: number
  current_storage_used_mb: number
  can_add_members: boolean
  members_remaining: number | null
  storage_remaining_gb: number | null
}

// ============================================================================
// STRIPE TYPES
// ============================================================================

export interface CreateCheckoutSessionInput {
  organization_id: string
  plan_id: string
  billing_cycle: BillingCycle
  success_url: string
  cancel_url: string
  coupon_code?: string
}

export interface CreatePortalSessionInput {
  organization_id: string
  return_url: string
}

export interface WebhookEvent {
  type: string
  data: {
    object: Record<string, unknown>
  }
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
