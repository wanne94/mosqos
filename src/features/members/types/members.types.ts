import type { Json } from '@/shared/types/database.types'

// ============================================================================
// Core Member Types
// ============================================================================

export type MembershipType = 'individual' | 'family' | 'student' | 'senior' | 'lifetime' | 'honorary'
export type MembershipStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'deceased'
export type Gender = 'male' | 'female' | 'other'

export interface Member {
  id: string
  organization_id: string
  household_id: string | null
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  date_of_birth_hijri: string | null
  gender: Gender | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  membership_type: MembershipType
  membership_status: MembershipStatus
  joined_date: string
  photo_url: string | null
  notes: string | null
  custom_fields: Json
  self_registered: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  household?: Household
  // Computed fields
  full_name?: string
}

// ============================================================================
// Household Types
// ============================================================================

export interface Household {
  id: string
  organization_id: string
  name: string
  head_of_household_id: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface HouseholdWithMembers extends Household {
  members: Member[]
  head_of_household: Member | null
  member_count?: number
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateMemberInput {
  organization_id: string
  household_id?: string | null
  user_id?: string | null
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  date_of_birth_hijri?: string | null
  gender?: Gender | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  membership_type?: MembershipType
  membership_status?: MembershipStatus
  joined_date?: string
  photo_url?: string | null
  notes?: string | null
  custom_fields?: Json
  self_registered?: boolean
}

export interface UpdateMemberInput {
  household_id?: string | null
  user_id?: string | null
  first_name?: string
  last_name?: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  date_of_birth_hijri?: string | null
  gender?: Gender | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  membership_type?: MembershipType
  membership_status?: MembershipStatus
  joined_date?: string
  photo_url?: string | null
  notes?: string | null
  custom_fields?: Json
}

export interface CreateHouseholdInput {
  organization_id: string
  name: string
  head_of_household_id?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export interface UpdateHouseholdInput {
  name?: string
  head_of_household_id?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

// ============================================================================
// Filter & Pagination Types
// ============================================================================

export interface MemberFilters {
  search?: string
  membership_type?: MembershipType | MembershipType[]
  membership_status?: MembershipStatus | MembershipStatus[]
  gender?: Gender | Gender[]
  household_id?: string | null
  joined_date_from?: string
  joined_date_to?: string
  city?: string
  state?: string
  has_email?: boolean
  has_phone?: boolean
}

export interface HouseholdFilters {
  search?: string
  city?: string
  state?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface SortParams {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// ============================================================================
// Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface MemberStats {
  total: number
  active: number
  inactive: number
  pending: number
  newThisMonth: number
  byMembershipType: Record<MembershipType, number>
  byGender: Record<Gender | 'unknown', number>
}

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    message: string
  }>
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'
