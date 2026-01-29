// Umrah/Hajj Trips Module Types for MosqOS

// ============================================================================
// ENUMS
// ============================================================================

export enum TripType {
  UMRAH = 'umrah',
  HAJJ = 'hajj',
  ZIYARAT = 'ziyarat',
  EDUCATIONAL = 'educational',
  OTHER = 'other',
}

export enum TripStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  FULL = 'full',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  WAITLISTED = 'waitlisted',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  DEPOSIT_PAID = 'deposit_paid',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum VisaStatus {
  NOT_STARTED = 'not_started',
  DOCUMENTS_SUBMITTED = 'documents_submitted',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ISSUED = 'issued',
}

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  TRIPLE = 'triple',
  QUAD = 'quad',
  FAMILY = 'family',
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface TripHighlight {
  title: string
  description?: string
  icon?: string
}

export interface TripInclusion {
  item: string
  description?: string
}

export interface FlightDetails {
  departure_city?: string
  departure_date?: string
  departure_time?: string
  departure_airline?: string
  departure_flight?: string
  return_city?: string
  return_date?: string
  return_time?: string
  return_airline?: string
  return_flight?: string
  notes?: string
}

export interface Trip {
  id: string
  organization_id: string
  name: string
  description: string | null
  code: string | null
  trip_type: TripType
  start_date: string
  end_date: string
  registration_deadline: string | null
  destination: string | null
  itinerary: string | null
  highlights: TripHighlight[]
  hotel_makkah: string | null
  hotel_madinah: string | null
  accommodation_details: string | null
  price: number | null
  early_bird_price: number | null
  early_bird_deadline: string | null
  deposit_amount: number | null
  currency: string
  inclusions: TripInclusion[]
  exclusions: TripInclusion[]
  capacity: number | null
  available_spots: number | null
  waitlist_capacity: number
  status: TripStatus
  requirements: string | null
  visa_requirements: string | null
  health_requirements: string | null
  group_leader_id: string | null
  contact_email: string | null
  contact_phone: string | null
  image_url: string | null
  gallery: string[]
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  group_leader?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  }
  // Computed fields
  registration_count?: number
  confirmed_count?: number
  waitlist_count?: number
  days_remaining?: number
  is_early_bird_active?: boolean
}

export interface TripRegistration {
  id: string
  organization_id: string
  trip_id: string
  member_id: string
  registration_date: string
  registration_number: string | null
  status: RegistrationStatus
  payment_status: PaymentStatus
  total_amount: number | null
  deposit_paid: number
  amount_paid: number
  balance_due: number
  currency: string
  payment_deadline: string | null
  room_type: RoomType | null
  room_sharing_with: string[] // Array of member IDs
  passport_number: string | null
  passport_expiry: string | null
  passport_country: string | null
  visa_status: VisaStatus
  visa_number: string | null
  visa_issue_date: string | null
  visa_expiry_date: string | null
  visa_notes: string | null
  medical_conditions: string | null
  dietary_requirements: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  flight_details: FlightDetails
  special_requests: string | null
  accessibility_needs: string | null
  notes: string | null
  internal_notes: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  refund_amount: number | null
  refund_date: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  trip?: Trip
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    date_of_birth: string | null
    gender: string | null
    address: string | null
    city: string | null
    zip_code: string | null
  }
  room_mates?: Array<{
    id: string
    first_name: string
    last_name: string
  }>
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateTripInput {
  name: string
  description?: string | null
  code?: string | null
  trip_type?: TripType
  start_date: string
  end_date: string
  registration_deadline?: string | null
  destination?: string | null
  itinerary?: string | null
  highlights?: TripHighlight[]
  hotel_makkah?: string | null
  hotel_madinah?: string | null
  accommodation_details?: string | null
  price?: number | null
  early_bird_price?: number | null
  early_bird_deadline?: string | null
  deposit_amount?: number | null
  currency?: string
  inclusions?: TripInclusion[]
  exclusions?: TripInclusion[]
  capacity?: number | null
  waitlist_capacity?: number
  status?: TripStatus
  requirements?: string | null
  visa_requirements?: string | null
  health_requirements?: string | null
  group_leader_id?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  image_url?: string | null
  gallery?: string[]
  notes?: string | null
}

export interface UpdateTripInput {
  name?: string
  description?: string | null
  code?: string | null
  trip_type?: TripType
  start_date?: string
  end_date?: string
  registration_deadline?: string | null
  destination?: string | null
  itinerary?: string | null
  highlights?: TripHighlight[]
  hotel_makkah?: string | null
  hotel_madinah?: string | null
  accommodation_details?: string | null
  price?: number | null
  early_bird_price?: number | null
  early_bird_deadline?: string | null
  deposit_amount?: number | null
  currency?: string
  inclusions?: TripInclusion[]
  exclusions?: TripInclusion[]
  capacity?: number | null
  waitlist_capacity?: number
  status?: TripStatus
  requirements?: string | null
  visa_requirements?: string | null
  health_requirements?: string | null
  group_leader_id?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  image_url?: string | null
  gallery?: string[]
  notes?: string | null
}

export interface CreateRegistrationInput {
  trip_id: string
  member_id: string
  registration_date?: string
  status?: RegistrationStatus
  total_amount?: number | null
  room_type?: RoomType | null
  room_sharing_with?: string[]
  passport_number?: string | null
  passport_expiry?: string | null
  passport_country?: string | null
  medical_conditions?: string | null
  dietary_requirements?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relation?: string | null
  special_requests?: string | null
  accessibility_needs?: string | null
  notes?: string | null
}

export interface UpdateRegistrationInput {
  status?: RegistrationStatus
  payment_status?: PaymentStatus
  total_amount?: number | null
  payment_deadline?: string | null
  room_type?: RoomType | null
  room_sharing_with?: string[]
  passport_number?: string | null
  passport_expiry?: string | null
  passport_country?: string | null
  medical_conditions?: string | null
  dietary_requirements?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relation?: string | null
  flight_details?: FlightDetails
  special_requests?: string | null
  accessibility_needs?: string | null
  notes?: string | null
  internal_notes?: string | null
}

export interface UpdateVisaStatusInput {
  registration_id: string
  visa_status: VisaStatus
  visa_number?: string | null
  visa_issue_date?: string | null
  visa_expiry_date?: string | null
  visa_notes?: string | null
}

export interface RecordPaymentInput {
  registration_id: string
  amount: number
  payment_method: string
  reference_number?: string
  notes?: string
}

export interface CancelRegistrationInput {
  registration_id: string
  cancellation_reason: string
  refund_amount?: number | null
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface TripFilters {
  search?: string
  trip_type?: TripType | TripType[]
  status?: TripStatus | TripStatus[]
  start_date_from?: string
  start_date_to?: string
  destination?: string
  has_availability?: boolean
  price_min?: number
  price_max?: number
}

export interface RegistrationFilters {
  search?: string
  trip_id?: string
  member_id?: string
  status?: RegistrationStatus | RegistrationStatus[]
  payment_status?: PaymentStatus | PaymentStatus[]
  visa_status?: VisaStatus | VisaStatus[]
  room_type?: RoomType
  registration_date_from?: string
  registration_date_to?: string
  has_balance?: boolean
  needs_passport_update?: boolean
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface TripStatistics {
  total_trips: number
  active_trips: number
  upcoming_trips: number
  completed_trips: number
  total_registrations: number
  confirmed_registrations: number
  total_revenue: number
  collected_revenue: number
  pending_revenue: number
}

export interface TripReport {
  trip_id: string
  trip_name: string
  trip_type: TripType
  start_date: string
  end_date: string
  capacity: number | null
  total_registrations: number
  confirmed: number
  waitlisted: number
  cancelled: number
  by_payment_status: Record<PaymentStatus, number>
  by_visa_status: Record<VisaStatus, number>
  by_room_type: Record<RoomType, number>
  total_expected_revenue: number
  total_collected: number
  total_pending: number
  collection_rate: number
}

export interface PilgrimRoster {
  trip: Trip
  registrations: Array<{
    registration: TripRegistration
    member: TripRegistration['member']
  }>
  totals: {
    confirmed: number
    waitlisted: number
    total_paid: number
    total_balance: number
  }
}

export interface VisaTracking {
  trip_id: string
  trip_name: string
  by_status: Record<VisaStatus, Array<{
    registration_id: string
    member_name: string
    passport_number: string | null
    passport_expiry: string | null
    visa_notes: string | null
  }>>
  needs_attention: Array<{
    registration_id: string
    member_name: string
    issue: string
  }>
}

export interface UmrahDashboard {
  statistics: TripStatistics
  upcoming_trips: Trip[]
  trips_in_progress: Trip[]
  recent_registrations: TripRegistration[]
  registrations_with_balance: TripRegistration[]
  visa_alerts: Array<{
    registration_id: string
    member_name: string
    trip_name: string
    issue: string
  }>
  payment_reminders: Array<{
    registration_id: string
    member_name: string
    trip_name: string
    balance_due: number
    payment_deadline: string | null
  }>
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
