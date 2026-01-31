// Qurbani Module Types for MosqOS

// ============================================================================
// ENUMS
// ============================================================================

export enum CampaignStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AnimalType {
  SHEEP = 'sheep',
  COW = 'cow',
  CAMEL = 'camel',
}

export enum IntentionType {
  SELF = 'self',
  FAMILY = 'family',
  DECEASED = 'deceased',
  OTHER = 'other',
}

export enum DistributionType {
  LOCAL_PICKUP = 'local_pickup',
  FULL_CHARITY = 'full_charity',
  OVERSEAS = 'overseas',
  HYBRID = 'hybrid',
}

export enum ShareStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  DEPOSIT_PAID = 'deposit_paid',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum ProcessingStatus {
  REGISTERED = 'registered',
  SLAUGHTERED = 'slaughtered',
  PROCESSED = 'processed',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DISTRIBUTED = 'distributed',
  COMPLETED = 'completed',
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface PickupLocation {
  name: string
  address: string
  notes?: string
}

export interface QurbaniCampaign {
  id: string
  organization_id: string
  name: string
  description: string | null
  year: number
  hijri_year: number | null
  registration_start: string | null
  registration_deadline: string
  slaughter_start_date: string
  slaughter_end_date: string
  distribution_start_date: string | null
  distribution_end_date: string | null
  sheep_price: number | null
  cow_price: number | null
  camel_price: number | null
  currency: string
  sheep_capacity: number | null
  cow_capacity: number | null
  camel_capacity: number | null
  sheep_available: number | null
  cow_shares_available: number | null
  camel_shares_available: number | null
  allows_local_pickup: boolean
  allows_full_charity: boolean
  allows_overseas: boolean
  overseas_countries: string[]
  pickup_locations: PickupLocation[]
  status: CampaignStatus
  coordinator_id: string | null
  contact_email: string | null
  contact_phone: string | null
  allow_guest_registration: boolean
  require_full_payment: boolean
  deposit_amount: number | null
  notes: string | null
  terms_and_conditions: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface QurbaniShare {
  id: string
  organization_id: string
  campaign_id: string
  share_number: string | null
  animal_type: AnimalType
  quantity: number
  member_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  guest_address: string | null
  intention_type: IntentionType
  intention_names: string[]
  intention_notes: string | null
  distribution_type: DistributionType
  pickup_portion: number
  charity_portion: number
  overseas_portion: number
  overseas_country: string | null
  pickup_location: string | null
  pickup_date: string | null
  pickup_time: string | null
  pickup_notes: string | null
  unit_price: number
  total_amount: number
  amount_paid: number
  balance_due: number
  currency: string
  payment_status: PaymentStatus
  payment_method: string | null
  payment_reference: string | null
  payment_date: string | null
  status: ShareStatus
  processing_status: ProcessingStatus
  slaughtered_at: string | null
  distributed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  refund_amount: number | null
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  }
  campaign?: QurbaniCampaign
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateCampaignInput {
  name: string
  description?: string | null
  year: number
  hijri_year?: number | null
  registration_start?: string | null
  registration_deadline: string
  slaughter_start_date: string
  slaughter_end_date: string
  distribution_start_date?: string | null
  distribution_end_date?: string | null
  sheep_price?: number | null
  cow_price?: number | null
  camel_price?: number | null
  currency?: string
  sheep_capacity?: number | null
  cow_capacity?: number | null
  camel_capacity?: number | null
  allows_local_pickup?: boolean
  allows_full_charity?: boolean
  allows_overseas?: boolean
  overseas_countries?: string[]
  pickup_locations?: PickupLocation[]
  status?: CampaignStatus
  coordinator_id?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  allow_guest_registration?: boolean
  require_full_payment?: boolean
  deposit_amount?: number | null
  notes?: string | null
  terms_and_conditions?: string | null
}

export interface UpdateCampaignInput {
  name?: string
  description?: string | null
  year?: number
  hijri_year?: number | null
  registration_start?: string | null
  registration_deadline?: string
  slaughter_start_date?: string
  slaughter_end_date?: string
  distribution_start_date?: string | null
  distribution_end_date?: string | null
  sheep_price?: number | null
  cow_price?: number | null
  camel_price?: number | null
  currency?: string
  sheep_capacity?: number | null
  cow_capacity?: number | null
  camel_capacity?: number | null
  allows_local_pickup?: boolean
  allows_full_charity?: boolean
  allows_overseas?: boolean
  overseas_countries?: string[]
  pickup_locations?: PickupLocation[]
  status?: CampaignStatus
  coordinator_id?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  allow_guest_registration?: boolean
  require_full_payment?: boolean
  deposit_amount?: number | null
  notes?: string | null
  terms_and_conditions?: string | null
}

export interface CreateShareInput {
  campaign_id: string
  animal_type: AnimalType
  quantity?: number
  member_id?: string | null
  guest_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  guest_address?: string | null
  intention_type?: IntentionType
  intention_names?: string[]
  intention_notes?: string | null
  distribution_type: DistributionType
  pickup_portion?: number
  charity_portion?: number
  overseas_portion?: number
  overseas_country?: string | null
  pickup_location?: string | null
  pickup_date?: string | null
  pickup_time?: string | null
  pickup_notes?: string | null
  unit_price: number
  total_amount: number
  amount_paid?: number
  payment_method?: string | null
  payment_reference?: string | null
  payment_date?: string | null
  notes?: string | null
}

export interface UpdateShareInput {
  animal_type?: AnimalType
  quantity?: number
  member_id?: string | null
  guest_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  guest_address?: string | null
  intention_type?: IntentionType
  intention_names?: string[]
  intention_notes?: string | null
  distribution_type?: DistributionType
  pickup_portion?: number
  charity_portion?: number
  overseas_portion?: number
  overseas_country?: string | null
  pickup_location?: string | null
  pickup_date?: string | null
  pickup_time?: string | null
  pickup_notes?: string | null
  status?: ShareStatus
  processing_status?: ProcessingStatus
  amount_paid?: number
  payment_status?: PaymentStatus
  payment_method?: string | null
  payment_reference?: string | null
  payment_date?: string | null
  notes?: string | null
  internal_notes?: string | null
}

export interface RecordPaymentInput {
  share_id: string
  amount: number
  payment_method: string
  payment_reference?: string | null
  payment_date?: string
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface CampaignFilters {
  search?: string
  year?: number
  status?: CampaignStatus | CampaignStatus[]
}

export interface ShareFilters {
  search?: string
  campaign_id?: string
  member_id?: string
  animal_type?: AnimalType | AnimalType[]
  status?: ShareStatus | ShareStatus[]
  payment_status?: PaymentStatus | PaymentStatus[]
  processing_status?: ProcessingStatus | ProcessingStatus[]
  distribution_type?: DistributionType | DistributionType[]
  pickup_date?: string
  has_balance?: boolean
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface CampaignStats {
  total_shares: number
  total_revenue: number
  total_collected: number
  total_outstanding: number
  by_animal_type: Record<AnimalType, { count: number; amount: number }>
  by_distribution_type: Record<DistributionType, number>
  by_payment_status: Record<PaymentStatus, number>
  by_processing_status: Record<ProcessingStatus, number>
}
