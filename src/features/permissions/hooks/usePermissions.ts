import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { PermissionCode } from '../types/permissions.types'

// Use any-typed client for tables not yet in generated types
const db = supabase as any

// Module-level permission flags for backward compatibility
interface ModulePermissions {
  dashboard: boolean
  finance: boolean
  education: boolean
  services: boolean
  umrah: boolean
  people: boolean
  settings: boolean
}

interface PermissionState {
  /** User's role: 'owner' | 'delegate' | 'member' | 'platform_admin' | null */
  role: string | null
  /** Base path for role-based routing */
  roleBasePath: 'platform' | 'owner' | 'delegate-owner' | 'member'
  /** Member record ID if user is a member */
  memberId: string | null
  /** Module-level permissions (legacy) */
  permissions: ModulePermissions | null
  /** User's organization ID */
  organizationId: string | null
  /** Loading state */
  loading: boolean
  /** Whether user has any admin-level access */
  isAdmin: boolean
  /** Whether user is a regular member (no admin access) */
  isMember: boolean
  /** Whether user is full admin (owner, super_admin, platform_admin) */
  isFullAdmin: boolean
  /** Whether user is a platform administrator */
  isPlatformAdmin: boolean
  /** Module access flags */
  canViewDashboard: boolean
  canViewFinance: boolean
  canViewEducation: boolean
  canViewUmrah: boolean
  canViewServices: boolean
  canViewPeople: boolean
  canViewSettings: boolean
  /** Super admin flag (owner or platform admin) */
  isSuperAdmin: boolean
  /** Refresh permissions manually */
  refresh: () => void
  /** Check if user has specific permission code */
  hasPermission: (code: PermissionCode) => boolean
  /** All permission codes the user has */
  permissionCodes: string[]
}

const FULL_MODULE_PERMISSIONS: ModulePermissions = {
  dashboard: true,
  finance: true,
  education: true,
  services: true,
  umrah: true,
  people: true,
  settings: true,
}

const EMPTY_MODULE_PERMISSIONS: ModulePermissions = {
  dashboard: false,
  finance: false,
  education: false,
  services: false,
  umrah: false,
  people: false,
  settings: false,
}

interface OwnerRecord {
  id: string
  organization_id: string
  role_id: string | null
  organization_roles: { role_name: string; default_permissions: ModulePermissions } | null
}

interface MemberRecord {
  id: string
  organization_id: string
  role_id: string | null
  organization_roles: { role_name: string; default_permissions: ModulePermissions } | null
}

interface PermissionGroupMember {
  permission_groups: {
    permission_group_permissions?: Array<{
      permissions?: { code?: string }
    }>
  } | null
}

// Force dev mode via environment variable
const FORCE_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

async function fetchUserPermissions(): Promise<{
  role: string | null
  memberId: string | null
  permissions: ModulePermissions | null
  organizationId: string | null
  isPlatformAdmin: boolean
  permissionCodes: string[]
}> {
  // Check for dev mode BEFORE calling Supabase
  // This ensures we don't try to authenticate with a placeholder Supabase instance
  const DEV_MODE_KEY = 'mosqos_dev_user'
  const savedDevUser = localStorage.getItem(DEV_MODE_KEY)

  if (savedDevUser && (FORCE_DEV_MODE || !isSupabaseConfigured())) {
    // Development mode: Return role based on email
    const devUsers: Record<string, { role: string; mappedRole: string }> = {
      'admin@mosqos.com': { role: 'admin', mappedRole: 'platform_admin' },
      'imam@mosqos.com': { role: 'imam', mappedRole: 'owner' },
      'member@mosqos.com': { role: 'member', mappedRole: 'member' },
    }

    const devUserData = devUsers[savedDevUser as keyof typeof devUsers]
    const mappedRole = devUserData?.mappedRole || 'member'
    const originalRole = devUserData?.role || 'member'

    return {
      role: mappedRole,
      memberId: mappedRole === 'member' ? 'dev-member-id' : null,
      permissions: mappedRole !== 'member' ? FULL_MODULE_PERMISSIONS : EMPTY_MODULE_PERMISSIONS,
      organizationId: originalRole !== 'admin' ? 'dev-org-id' : null,
      isPlatformAdmin: mappedRole === 'platform_admin',
      permissionCodes: mappedRole !== 'member' ? ['*'] : [],
    }
  }

  // Continue with normal Supabase flow for production
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      role: null,
      memberId: null,
      permissions: null,
      organizationId: null,
      isPlatformAdmin: false,
      permissionCodes: [],
    }
  }

  // Fallback dev mode check (in case user was created differently)
  if (user.id.startsWith('dev-')) {
    const devRole = user.user_metadata?.role as string
    const roleMapping: Record<string, string> = {
      admin: 'platform_admin',
      imam: 'owner',
      member: 'member',
    }
    const mappedRole = roleMapping[devRole] || 'member'

    return {
      role: mappedRole,
      memberId: mappedRole === 'member' ? 'dev-member-id' : null,
      permissions: mappedRole !== 'member' ? FULL_MODULE_PERMISSIONS : EMPTY_MODULE_PERMISSIONS,
      organizationId: devRole !== 'admin' ? 'dev-org-id' : null,
      isPlatformAdmin: mappedRole === 'platform_admin',
      permissionCodes: mappedRole !== 'member' ? ['*'] : [],
    }
  }

  // Check if user is a platform admin
  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isUserPlatformAdmin = !!platformAdmin

  // Check organization membership using 3-table structure
  // Priority: organization_owners > organization_delegates > organization_members

  let memberData: { id: string; permissions: ModulePermissions } | null = null
  let orgId: string | null = null
  let roleType: string | null = null
  let permissionCodes: string[] = []

  // Check if user is an organization owner
  const { data: ownerRecord, error: ownerError } = await db
    .from('organization_owners')
    .select(
      `
      id,
      organization_id,
      role_id,
      organization_roles (role_name, default_permissions)
    `
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!ownerError && ownerRecord) {
    const record = ownerRecord as unknown as OwnerRecord
    // Organization owners have FULL permissions to all modules
    memberData = {
      id: record.id,
      permissions: FULL_MODULE_PERMISSIONS,
    }
    orgId = record.organization_id
    roleType = 'owner'
  }

  // If not owner, check if delegate
  if (!memberData) {
    const { data: delegateRecord, error: delegateError } = await db
      .from('organization_delegates')
      .select(
        `
        id,
        organization_id,
        role_id,
        organization_roles (role_name, default_permissions)
      `
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (!delegateError && delegateRecord) {
      const record = delegateRecord as unknown as OwnerRecord
      // Organization delegates have FULL permissions to all modules
      memberData = {
        id: record.id,
        permissions: FULL_MODULE_PERMISSIONS,
      }
      orgId = record.organization_id
      roleType = 'delegate'
    }
  }

  // If not owner or delegate, check if member
  if (!memberData) {
    const { data: memberRecord, error: memberError } = await db
      .from('organization_members')
      .select(
        `
        id,
        organization_id,
        role_id,
        organization_roles (role_name, default_permissions)
      `
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (!memberError && memberRecord) {
      const record = memberRecord as unknown as MemberRecord
      const rolePermissions =
        record.organization_roles?.default_permissions || EMPTY_MODULE_PERMISSIONS

      memberData = {
        id: record.id,
        permissions: rolePermissions,
      }
      orgId = record.organization_id
      roleType = 'member'

      // Fetch permission codes from permission groups for members
      if (orgId) {
        const { data: groupPermissions } = await db
          .from('permission_group_members')
          .select(
            `
            permission_groups!inner (
              permission_group_permissions (
                permissions (code)
              )
            )
          `
          )
          .eq('member_id', record.id)

        if (groupPermissions) {
          const groups = groupPermissions as unknown as PermissionGroupMember[]
          permissionCodes = groups
            .flatMap((gp) =>
              gp.permission_groups?.permission_group_permissions?.map(
                (pgp) => pgp.permissions?.code
              ) || []
            )
            .filter((code): code is string => !!code)
        }
      }
    }
  }

  // Set permissions based on membership
  if (memberData && orgId) {
    return {
      role: roleType,
      memberId: memberData.id,
      permissions: memberData.permissions,
      organizationId: orgId,
      isPlatformAdmin: isUserPlatformAdmin,
      permissionCodes:
        roleType === 'owner' || roleType === 'delegate' ? ['*'] : permissionCodes,
    }
  } else if (isUserPlatformAdmin) {
    // Platform admin without specific org membership
    return {
      role: 'platform_admin',
      memberId: null,
      permissions: FULL_MODULE_PERMISSIONS,
      organizationId: null,
      isPlatformAdmin: true,
      permissionCodes: ['*'],
    }
  }

  // No membership found
  return {
    role: 'member',
    memberId: null,
    permissions: EMPTY_MODULE_PERMISSIONS,
    organizationId: null,
    isPlatformAdmin: false,
    permissionCodes: [],
  }
}

/**
 * Hook to get user's permissions and role information
 * Uses TanStack Query for caching and automatic refetching
 *
 * @returns PermissionState with role, permissions, and utility functions
 *
 * @example
 * const { isAdmin, canViewFinance, hasPermission, loading } = usePermissions()
 *
 * if (loading) return <Spinner />
 * if (!canViewFinance) return <AccessDenied />
 *
 * // Check specific permission code
 * if (hasPermission('donations:create')) {
 *   // Show create button
 * }
 */
export function usePermissions(): PermissionState {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: fetchUserPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
  }

  // Default state while loading
  const role = data?.role ?? null
  const memberId = data?.memberId ?? null
  const permissions = data?.permissions ?? null
  const organizationId = data?.organizationId ?? null
  const isPlatformAdmin = data?.isPlatformAdmin ?? false
  const permissionCodes = data?.permissionCodes ?? []

  // Compute derived values
  const hasAnyAdminPermission = Boolean(
    permissions &&
    (permissions.dashboard === true ||
      permissions.finance === true ||
      permissions.education === true ||
      permissions.services === true ||
      permissions.umrah === true ||
      permissions.people === true ||
      permissions.settings === true)
  )

  const isAdmin: boolean =
    isPlatformAdmin ||
    role === 'platform_admin' ||
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'owner' ||
    role === 'delegate' ||
    role === 'finance_admin' ||
    role === 'education_admin' ||
    role === 'services_admin' ||
    role === 'umrah_admin' ||
    role === 'people_admin' ||
    hasAnyAdminPermission

  const isMember = !isAdmin
  const isFullAdmin =
    isPlatformAdmin ||
    role === 'platform_admin' ||
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'owner'

  const hasStoredPermissions =
    permissions &&
    (permissions.dashboard !== undefined ||
      permissions.finance !== undefined ||
      permissions.education !== undefined ||
      permissions.services !== undefined ||
      permissions.umrah !== undefined ||
      permissions.people !== undefined ||
      permissions.settings !== undefined)

  const getRoleBasePath = (): 'platform' | 'owner' | 'delegate-owner' | 'member' => {
    if (isPlatformAdmin) return 'platform'
    if (role === 'owner') return 'owner'
    if (role === 'delegate') return 'delegate-owner'
    return 'member'
  }

  // Permission check helpers
  const canViewDashboard = hasStoredPermissions
    ? permissions?.dashboard === true
    : isAdmin

  const canViewFinance = hasStoredPermissions
    ? permissions?.finance === true
    : isFullAdmin || role === 'finance_admin'

  const canViewEducation = hasStoredPermissions
    ? permissions?.education === true
    : isFullAdmin || role === 'education_admin'

  const canViewUmrah = hasStoredPermissions
    ? permissions?.umrah === true
    : isFullAdmin || role === 'umrah_admin'

  const canViewServices = hasStoredPermissions
    ? permissions?.services === true
    : isFullAdmin || role === 'services_admin'

  const canViewPeople = hasStoredPermissions
    ? permissions?.people === true
    : isFullAdmin || role === 'people_admin'

  const canViewSettings: boolean = hasStoredPermissions
    ? (permissions?.settings === true)
    : isFullAdmin

  const hasPermission = (code: PermissionCode): boolean => {
    // Platform admins, owners, and delegates have all permissions
    if (isPlatformAdmin || role === 'owner' || role === 'delegate') {
      return true
    }
    // Check if user has wildcard or specific permission
    return permissionCodes.includes('*') || permissionCodes.includes(code)
  }

  return {
    role,
    roleBasePath: getRoleBasePath(),
    memberId,
    permissions,
    organizationId,
    loading: isLoading,
    isAdmin,
    isMember,
    isFullAdmin,
    isPlatformAdmin,
    canViewDashboard: canViewDashboard ?? false,
    canViewFinance: canViewFinance ?? false,
    canViewEducation: canViewEducation ?? false,
    canViewUmrah: canViewUmrah ?? false,
    canViewServices: canViewServices ?? false,
    canViewPeople: canViewPeople ?? false,
    canViewSettings: canViewSettings ?? false,
    isSuperAdmin: role === 'super_admin' || role === 'owner' || isPlatformAdmin,
    refresh,
    hasPermission,
    permissionCodes,
  }
}

/**
 * Hook to check a single permission
 * Lighter weight than usePermissions when you only need one check
 *
 * @param code - Permission code to check
 * @returns boolean indicating if user has the permission
 */
export function useHasPermission(code: PermissionCode): boolean {
  const { hasPermission, loading } = usePermissions()

  if (loading) return false
  return hasPermission(code)
}

export type { PermissionState, ModulePermissions }
