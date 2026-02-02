/**
 * User Types for Platform Admin
 *
 * TypeScript types for user management in platform admin
 */

// User role in an organization
export type UserRole = 'owner' | 'delegate' | 'member' | 'imam'

// User with organization memberships
export interface UserWithOrganizations {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null

  // User metadata from auth
  user_metadata: {
    full_name?: string
    avatar_url?: string
    [key: string]: unknown
  }

  // Organization memberships
  organizations: UserOrganizationMembership[]

  // Computed
  is_active: boolean
}

// User's membership in an organization
export interface UserOrganizationMembership {
  organization_id: string
  organization_name: string
  organization_slug: string
  role: UserRole
  joined_at: string
}

// Detailed user info for detail page
export interface UserDetail extends UserWithOrganizations {
  // Member profile if exists
  member_profile?: {
    id: string
    first_name: string
    last_name: string
    phone: string | null
    date_of_birth: string | null
  } | null

  // Activity stats
  activity_stats?: {
    total_donations: number
    total_cases: number
    last_activity: string | null
  }
}

// Filter options for users list
export interface UserFilters {
  search?: string
  organization_id?: string
  role?: UserRole
  is_active?: boolean
}

// Input for updating a user
export interface UpdateUserInput {
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    [key: string]: unknown
  }
}

// Imam info for imam management
export interface ImamInfo {
  id: string
  user_id: string | null
  member_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  organization_id: string
  organization_name: string
  organization_slug: string
  joined_at: string
  is_active: boolean
}

// Filter options for imams list
export interface ImamFilters {
  search?: string
  organization_id?: string
  is_active?: boolean
}
