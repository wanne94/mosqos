/**
 * Household module types
 */

/**
 * Core household entity
 */
export interface Household {
  id: string
  organization_id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  head_of_household_id: string | null
  custom_fields: Record<string, unknown> | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

/**
 * Input for creating a new household
 */
export interface CreateHouseholdInput {
  organization_id: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  head_of_household_id?: string | null
  custom_fields?: Record<string, unknown> | null
}

/**
 * Input for updating an existing household
 */
export interface UpdateHouseholdInput {
  name?: string
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  head_of_household_id?: string | null
  custom_fields?: Record<string, unknown> | null
}

/**
 * Household with member count
 */
export interface HouseholdWithMembers extends Household {
  member_count: number
  members?: Array<{
    id: string
    first_name: string
    last_name: string
    email: string | null
    role: string
  }>
}

/**
 * Household filter options
 */
export interface HouseholdFilters {
  search?: string
  city?: string
  state?: string
  country?: string
  has_head?: boolean
  min_members?: number
  max_members?: number
}
