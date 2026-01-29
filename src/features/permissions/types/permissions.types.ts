/**
 * Permission module types for AD-style permission groups system
 */

/**
 * Available permission modules in the system
 */
export enum PermissionModule {
  MEMBERS = 'members',
  HOUSEHOLDS = 'households',
  DONATIONS = 'donations',
  FUNDS = 'funds',
  PLEDGES = 'pledges',
  EDUCATION = 'education',
  CASES = 'cases',
  UMRAH = 'umrah',
  QURBANI = 'qurbani',
  SERVICES = 'services',
  ANNOUNCEMENTS = 'announcements',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  PERMISSIONS = 'permissions',
}

/**
 * Permission definition
 */
export interface Permission {
  id: string
  code: string
  name: string
  description: string
  module: PermissionModule
  created_at?: string
}

/**
 * Permission group (like AD groups)
 */
export interface PermissionGroup {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_system: boolean
  permissions: Permission[]
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

/**
 * Permission group without nested permissions (for listing)
 */
export interface PermissionGroupSummary {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_system: boolean
  permission_count: number
  member_count: number
  created_at: string
  updated_at: string
}

/**
 * Group member assignment
 */
export interface GroupMember {
  id: string
  member_id: string
  group_id: string
  assigned_at: string
  assigned_by: string | null
  member: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    photo_url: string | null
  }
}

/**
 * User's effective permissions for an organization
 */
export interface UserPermissions {
  /** Platform admin has all permissions across all organizations */
  isPlatformAdmin: boolean
  /** Organization owner has all permissions within their organization */
  isOwner: boolean
  /** Delegate has elevated permissions (like co-admin) */
  isDelegate: boolean
  /** Permission groups the user belongs to */
  groups: PermissionGroupSummary[]
  /** Flattened list of all permission codes the user has */
  permissions: string[]
}

/**
 * Create permission group input
 */
export interface CreatePermissionGroupInput {
  organization_id: string
  name: string
  description?: string
  permission_ids: string[]
}

/**
 * Update permission group input
 */
export interface UpdatePermissionGroupInput {
  name?: string
  description?: string
  permission_ids?: string[]
}

/**
 * Permission check result with details
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason: 'platform_admin' | 'owner' | 'delegate' | 'permission_granted' | 'no_permission'
}

/**
 * Predefined permission codes
 */
export const PERMISSION_CODES = {
  // Members
  MEMBERS_VIEW: 'members:view',
  MEMBERS_CREATE: 'members:create',
  MEMBERS_EDIT: 'members:edit',
  MEMBERS_DELETE: 'members:delete',
  MEMBERS_EXPORT: 'members:export',
  MEMBERS_IMPORT: 'members:import',

  // Households
  HOUSEHOLDS_VIEW: 'households:view',
  HOUSEHOLDS_CREATE: 'households:create',
  HOUSEHOLDS_EDIT: 'households:edit',
  HOUSEHOLDS_DELETE: 'households:delete',

  // Donations
  DONATIONS_VIEW: 'donations:view',
  DONATIONS_CREATE: 'donations:create',
  DONATIONS_EDIT: 'donations:edit',
  DONATIONS_DELETE: 'donations:delete',
  DONATIONS_EXPORT: 'donations:export',
  DONATIONS_REFUND: 'donations:refund',

  // Funds
  FUNDS_VIEW: 'funds:view',
  FUNDS_CREATE: 'funds:create',
  FUNDS_EDIT: 'funds:edit',
  FUNDS_DELETE: 'funds:delete',
  FUNDS_TRANSFER: 'funds:transfer',

  // Pledges
  PLEDGES_VIEW: 'pledges:view',
  PLEDGES_CREATE: 'pledges:create',
  PLEDGES_EDIT: 'pledges:edit',
  PLEDGES_DELETE: 'pledges:delete',

  // Education
  EDUCATION_VIEW: 'education:view',
  EDUCATION_CREATE: 'education:create',
  EDUCATION_EDIT: 'education:edit',
  EDUCATION_DELETE: 'education:delete',
  EDUCATION_ENROLL: 'education:enroll',
  EDUCATION_GRADES: 'education:grades',

  // Cases
  CASES_VIEW: 'cases:view',
  CASES_CREATE: 'cases:create',
  CASES_EDIT: 'cases:edit',
  CASES_DELETE: 'cases:delete',
  CASES_ASSIGN: 'cases:assign',
  CASES_CLOSE: 'cases:close',

  // Umrah
  UMRAH_VIEW: 'umrah:view',
  UMRAH_CREATE: 'umrah:create',
  UMRAH_EDIT: 'umrah:edit',
  UMRAH_DELETE: 'umrah:delete',
  UMRAH_MANAGE: 'umrah:manage',

  // Qurbani
  QURBANI_VIEW: 'qurbani:view',
  QURBANI_CREATE: 'qurbani:create',
  QURBANI_EDIT: 'qurbani:edit',
  QURBANI_DELETE: 'qurbani:delete',
  QURBANI_MANAGE: 'qurbani:manage',

  // Islamic Services
  SERVICES_VIEW: 'services:view',
  SERVICES_CREATE: 'services:create',
  SERVICES_EDIT: 'services:edit',
  SERVICES_DELETE: 'services:delete',
  SERVICES_SCHEDULE: 'services:schedule',

  // Announcements
  ANNOUNCEMENTS_VIEW: 'announcements:view',
  ANNOUNCEMENTS_CREATE: 'announcements:create',
  ANNOUNCEMENTS_EDIT: 'announcements:edit',
  ANNOUNCEMENTS_DELETE: 'announcements:delete',
  ANNOUNCEMENTS_PUBLISH: 'announcements:publish',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_FINANCIAL: 'reports:financial',
  REPORTS_MEMBERSHIP: 'reports:membership',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SETTINGS_BILLING: 'settings:billing',
  SETTINGS_INTEGRATIONS: 'settings:integrations',

  // Permissions
  PERMISSIONS_VIEW: 'permissions:view',
  PERMISSIONS_MANAGE: 'permissions:manage',
} as const

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES]
