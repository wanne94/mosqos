// Islamic Services Types

export type ServiceStatus =
  | 'requested'
  | 'pending_documents'
  | 'documents_received'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type FeeStatus = 'pending' | 'partial' | 'paid' | 'waived'

export type ServiceTypeSlug = 'nikah' | 'janazah' | 'shahada' | 'aqeeqah' | 'counseling' | 'other'

// Service Type Configuration
export interface IslamicServiceType {
  id: string
  organization_id: string
  name: string
  slug: ServiceTypeSlug | string
  name_ar?: string
  name_tr?: string
  description?: string
  default_fee: number
  requires_witnesses: boolean
  witness_count: number
  requires_appointment: boolean
  certificate_template: Record<string, any>
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Witness info
export interface Witness {
  id: string
  name: string
  phone?: string
  id_number?: string
}

// Attachment
export interface ServiceAttachment {
  id: string
  name: string
  url: string
  type: string
  uploaded_at: string
}

// Main Service Record
export interface IslamicService {
  id: string
  organization_id: string
  service_type_id: string
  case_number: string
  status: ServiceStatus
  scheduled_date?: string
  scheduled_time?: string
  location?: string
  fee_amount: number
  fee_paid: number
  fee_status: FeeStatus
  officiant_id?: string
  requestor_id?: string
  requestor_name?: string
  requestor_phone?: string
  requestor_email?: string
  service_data: NikahData | JanazahData | ShahadaData | Record<string, any>
  witnesses: Witness[]
  attachments: ServiceAttachment[]
  certificate_number?: string
  certificate_issued_at?: string
  certificate_url?: string
  notes?: string
  internal_notes?: string
  created_at: string
  updated_at: string
  completed_at?: string
  created_by?: string
  updated_by?: string
  // Joined fields
  service_type?: IslamicServiceType
  officiant?: { id: string; first_name: string; last_name: string }
}

// Nikah (Marriage) specific data
export interface NikahData {
  // Groom info
  groom_name: string
  groom_father_name?: string
  groom_dob?: string
  groom_id_number?: string
  groom_nationality?: string
  groom_phone?: string
  groom_email?: string
  groom_address?: string
  groom_previous_marriages?: number
  groom_is_convert?: boolean

  // Bride info
  bride_name: string
  bride_father_name?: string
  bride_dob?: string
  bride_id_number?: string
  bride_nationality?: string
  bride_phone?: string
  bride_email?: string
  bride_address?: string
  bride_previous_marriages?: number
  bride_is_convert?: boolean

  // Guardian (Wali)
  wali_name?: string
  wali_relationship?: string
  wali_phone?: string

  // Mahr details
  mahr_amount?: number
  mahr_currency?: string
  mahr_description?: string
  mahr_paid?: boolean
  mahr_deferred_amount?: number
}

// Janazah (Funeral) specific data
export interface JanazahData {
  // Deceased info
  deceased_name: string
  deceased_gender?: 'male' | 'female'
  deceased_dob?: string
  deceased_death_date?: string
  deceased_death_time?: string
  deceased_cause_of_death?: string
  deceased_nationality?: string
  deceased_id_number?: string

  // Family contact
  family_contact_name?: string
  family_contact_relationship?: string
  family_contact_phone?: string
  family_contact_email?: string

  // Ghusl (ritual washing)
  ghusl_performed?: boolean
  ghusl_date?: string
  ghusl_location?: string
  ghusl_performed_by?: string

  // Burial
  burial_date?: string
  burial_time?: string
  burial_location?: string
  cemetery_name?: string
  cemetery_plot?: string

  // Special instructions
  special_instructions?: string
  death_certificate_received?: boolean
}

// Shahada (Reversion) specific data
export interface ShahadaData {
  // New Muslim info
  birth_name: string
  chosen_muslim_name?: string
  gender?: 'male' | 'female' | 'other'
  dob?: string
  nationality?: string
  phone?: string
  email?: string
  address?: string

  // Background
  previous_religion?: string
  reason_for_conversion?: string

  // Shahada ceremony
  shahada_date?: string
  shahada_time?: string

  // Follow-up
  mentor_id?: string
  mentor_name?: string
  follow_up_date?: string
  education_enrolled?: boolean
  classes_recommended?: string[]
}

// Input types
export interface IslamicServiceTypeInput {
  organization_id: string
  name: string
  slug: string
  name_ar?: string
  name_tr?: string
  description?: string
  default_fee?: number
  requires_witnesses?: boolean
  witness_count?: number
  requires_appointment?: boolean
  is_active?: boolean
  sort_order?: number
}

export interface IslamicServiceInput {
  organization_id: string
  service_type_id: string
  scheduled_date?: string
  scheduled_time?: string
  location?: string
  fee_amount?: number
  officiant_id?: string
  requestor_id?: string
  requestor_name?: string
  requestor_phone?: string
  requestor_email?: string
  service_data?: NikahData | JanazahData | ShahadaData | Record<string, any>
  witnesses?: Witness[]
  notes?: string
}

export interface IslamicServiceUpdateInput extends Partial<IslamicServiceInput> {
  id: string
  status?: ServiceStatus
  fee_paid?: number
  fee_status?: FeeStatus
  certificate_number?: string
  certificate_url?: string
  internal_notes?: string
}

// Filter types
export interface IslamicServiceFilters {
  status?: ServiceStatus | 'all'
  service_type_id?: string | 'all'
  search?: string
  date_from?: string
  date_to?: string
}

// Stats
export interface IslamicServiceStats {
  total: number
  requested: number
  scheduled: number
  in_progress: number
  completed: number
  cancelled: number
  by_type: Record<string, number>
  total_fees: number
  fees_collected: number
}
