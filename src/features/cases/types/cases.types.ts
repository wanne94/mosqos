// Service Cases Module Types for MosqOS

// ============================================================================
// ENUMS
// ============================================================================

export enum CaseStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SupportRequestStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum SupportRequestSource {
  MANUAL = 'manual',
  PORTAL = 'portal',
  EMAIL = 'email',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
  OTHER = 'other',
}

export enum CommunicationType {
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  IN_PERSON = 'in_person',
  LETTER = 'letter',
  VIDEO_CALL = 'video_call',
  OTHER = 'other',
}

export enum CommunicationDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum CommunicationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface CaseNote {
  id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
  is_internal: boolean
}

export interface ServiceCase {
  id: string
  organization_id: string
  case_number: string | null
  member_id: string | null
  case_type: string | null
  category: string | null
  title: string
  description: string | null
  status: CaseStatus
  priority: CasePriority
  requested_amount: number | null
  approved_amount: number | null
  disbursed_amount: number
  fund_id: string | null
  assistance_date: string | null
  due_date: string | null
  resolved_date: string | null
  assigned_to: string | null
  assigned_at: string | null
  resolution_notes: string | null
  outcome: string | null
  notes_thread: CaseNote[]
  is_confidential: boolean
  requires_followup: boolean
  followup_date: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
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
  fund?: {
    id: string
    name: string
  }
  assigned_user?: {
    id: string
    email: string
  }
}

export interface SupportRequest {
  id: string
  organization_id: string
  member_id: string | null
  requester_name: string | null
  requester_email: string | null
  requester_phone: string | null
  subject: string
  description: string | null
  category: string | null
  status: SupportRequestStatus
  priority: CasePriority
  assigned_to: string | null
  resolved_at: string | null
  resolution_notes: string | null
  source: SupportRequestSource
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
  assigned_user?: {
    id: string
    email: string
  }
}

export interface CommunicationAttachment {
  name: string
  url: string
  type: string
  size: number
}

export interface CommunicationLog {
  id: string
  organization_id: string
  member_id: string | null
  service_case_id: string | null
  support_request_id: string | null
  communication_type: CommunicationType
  direction: CommunicationDirection
  subject: string | null
  content: string | null
  summary: string | null
  status: CommunicationStatus
  scheduled_at: string | null
  completed_at: string | null
  contact_method: string | null
  attachments: CommunicationAttachment[]
  created_at: string
  created_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
  }
  service_case?: {
    id: string
    case_number: string | null
    title: string
  }
  support_request?: {
    id: string
    subject: string
  }
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateCaseInput {
  member_id?: string | null
  case_type?: string | null
  category?: string | null
  title: string
  description?: string | null
  priority?: CasePriority
  requested_amount?: number | null
  fund_id?: string | null
  assistance_date?: string | null
  due_date?: string | null
  assigned_to?: string | null
  is_confidential?: boolean
  requires_followup?: boolean
  followup_date?: string | null
}

export interface UpdateCaseInput {
  member_id?: string | null
  case_type?: string | null
  category?: string | null
  title?: string
  description?: string | null
  status?: CaseStatus
  priority?: CasePriority
  requested_amount?: number | null
  approved_amount?: number | null
  disbursed_amount?: number
  fund_id?: string | null
  assistance_date?: string | null
  due_date?: string | null
  assigned_to?: string | null
  resolution_notes?: string | null
  outcome?: string | null
  is_confidential?: boolean
  requires_followup?: boolean
  followup_date?: string | null
}

export interface AddCaseNoteInput {
  case_id: string
  content: string
  is_internal?: boolean
}

export interface CreateSupportRequestInput {
  member_id?: string | null
  requester_name?: string | null
  requester_email?: string | null
  requester_phone?: string | null
  subject: string
  description?: string | null
  category?: string | null
  priority?: CasePriority
  source?: SupportRequestSource
  assigned_to?: string | null
}

export interface UpdateSupportRequestInput {
  member_id?: string | null
  requester_name?: string | null
  requester_email?: string | null
  requester_phone?: string | null
  subject?: string
  description?: string | null
  category?: string | null
  status?: SupportRequestStatus
  priority?: CasePriority
  assigned_to?: string | null
  resolution_notes?: string | null
}

export interface CreateCommunicationLogInput {
  member_id?: string | null
  service_case_id?: string | null
  support_request_id?: string | null
  communication_type: CommunicationType
  direction: CommunicationDirection
  subject?: string | null
  content?: string | null
  summary?: string | null
  status?: CommunicationStatus
  scheduled_at?: string | null
  contact_method?: string | null
  attachments?: CommunicationAttachment[]
}

export interface CompleteCommunicationInput {
  id: string
  content?: string | null
  summary?: string | null
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface CaseFilters {
  search?: string
  case_type?: string
  category?: string
  status?: CaseStatus | CaseStatus[]
  priority?: CasePriority | CasePriority[]
  member_id?: string
  assigned_to?: string
  fund_id?: string
  date_from?: string
  date_to?: string
  requires_followup?: boolean
  is_confidential?: boolean
  has_amount?: boolean
}

export interface SupportRequestFilters {
  search?: string
  category?: string
  status?: SupportRequestStatus | SupportRequestStatus[]
  priority?: CasePriority | CasePriority[]
  member_id?: string
  assigned_to?: string
  source?: SupportRequestSource
  date_from?: string
  date_to?: string
}

export interface CommunicationLogFilters {
  member_id?: string
  service_case_id?: string
  support_request_id?: string
  communication_type?: CommunicationType
  direction?: CommunicationDirection
  status?: CommunicationStatus
  date_from?: string
  date_to?: string
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface CaseStatistics {
  total_cases: number
  open_cases: number
  in_progress_cases: number
  resolved_cases: number
  closed_cases: number
  by_type: Record<string, number>
  by_category: Record<string, number>
  by_priority: Record<CasePriority, number>
  total_requested: number
  total_approved: number
  total_disbursed: number
  average_resolution_days: number
}

export interface SupportRequestStatistics {
  total_requests: number
  open_requests: number
  resolved_requests: number
  by_category: Record<string, number>
  by_source: Record<SupportRequestSource, number>
  by_priority: Record<CasePriority, number>
  average_resolution_hours: number
}

export interface CasesDashboard {
  statistics: CaseStatistics
  support_statistics: SupportRequestStatistics
  recent_cases: ServiceCase[]
  urgent_cases: ServiceCase[]
  cases_requiring_followup: ServiceCase[]
  my_assigned_cases: ServiceCase[]
  recent_communications: CommunicationLog[]
}

// ============================================================================
// CASE TYPES / CATEGORIES (for reference)
// ============================================================================

export const DEFAULT_CASE_TYPES = [
  'Financial Assistance',
  'Counseling',
  'Emergency Aid',
  'Food Assistance',
  'Medical Assistance',
  'Housing Assistance',
  'Education Support',
  'Job Assistance',
  'Legal Aid',
  'Family Support',
  'Refugee Services',
  'New Muslim Support',
  'Other',
] as const

export const DEFAULT_CASE_CATEGORIES = [
  'Zakat Eligible',
  'Sadaqah',
  'Emergency',
  'Recurring Need',
  'One-Time Need',
  'Referral',
] as const

export const DEFAULT_CASE_OUTCOMES = [
  'Approved',
  'Partially Approved',
  'Denied',
  'Referred to External Agency',
  'Withdrawn',
  'No Longer Needed',
  'Completed Successfully',
] as const

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
