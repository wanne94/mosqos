import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permissionsService } from '../services/permissions.service'
import type {
  CreatePermissionGroupInput,
  UpdatePermissionGroupInput,
} from '../types/permissions.types'

const PERMISSIONS_QUERY_KEY = 'permissions'
const PERMISSION_GROUPS_QUERY_KEY = 'permission-groups'
const GROUP_MEMBERS_QUERY_KEY = 'permission-group-members'

// ============================================================================
// ALL PERMISSIONS HOOK
// ============================================================================

/**
 * Hook to get all available permissions
 */
export function useAllPermissions() {
  const query = useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, 'all'],
    queryFn: () => permissionsService.getAllPermissions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions rarely change
  })

  return {
    permissions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Hook to get permissions grouped by module
 */
export function usePermissionsByModule() {
  const query = useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, 'by-module'],
    queryFn: () => permissionsService.getPermissionsByModule(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    permissionsByModule: query.data || {},
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

// ============================================================================
// PERMISSION GROUPS HOOKS
// ============================================================================

interface UsePermissionGroupsOptions {
  organizationId?: string
}

/**
 * Hook to get all permission groups for an organization
 */
export function usePermissionGroups({ organizationId }: UsePermissionGroupsOptions = {}) {
  const queryClient = useQueryClient()

  // Get all groups
  const query = useQuery({
    queryKey: [PERMISSION_GROUPS_QUERY_KEY, organizationId],
    queryFn: () => permissionsService.getGroups(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: Omit<CreatePermissionGroupInput, 'organization_id'>) =>
      permissionsService.createGroup({
        ...input,
        organization_id: organizationId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERMISSION_GROUPS_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePermissionGroupInput }) =>
      permissionsService.updateGroup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERMISSION_GROUPS_QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => permissionsService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERMISSION_GROUPS_QUERY_KEY, organizationId] })
    },
  })

  // Set permissions mutation
  const setPermissionsMutation = useMutation({
    mutationFn: ({ groupId, permissionIds }: { groupId: string; permissionIds: string[] }) =>
      permissionsService.setGroupPermissions(groupId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERMISSION_GROUPS_QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    groups: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    // Mutations
    createGroup: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateGroup: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteGroup: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    setPermissions: setPermissionsMutation.mutateAsync,
    isSettingPermissions: setPermissionsMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

/**
 * Hook to get a single permission group with its permissions
 */
export function usePermissionGroup(id?: string) {
  return useQuery({
    queryKey: [PERMISSION_GROUPS_QUERY_KEY, 'detail', id],
    queryFn: () => permissionsService.getGroupById(id!),
    enabled: !!id,
  })
}

// ============================================================================
// GROUP MEMBERS HOOKS
// ============================================================================

interface UseGroupMembersOptions {
  groupId?: string
  organizationId?: string
}

/**
 * Hook to manage members of a permission group
 */
export function useGroupMembers({ groupId, organizationId }: UseGroupMembersOptions = {}) {
  const queryClient = useQueryClient()

  // Get group members
  const membersQuery = useQuery({
    queryKey: [GROUP_MEMBERS_QUERY_KEY, groupId],
    queryFn: () => permissionsService.getGroupMembers(groupId!),
    enabled: !!groupId,
  })

  // Get available members (not in group)
  const availableMembersQuery = useQuery({
    queryKey: [GROUP_MEMBERS_QUERY_KEY, 'available', organizationId, groupId],
    queryFn: () => permissionsService.getMembersNotInGroup(organizationId!, groupId!),
    enabled: !!organizationId && !!groupId,
  })

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (memberId: string) => permissionsService.addMemberToGroup(groupId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROUP_MEMBERS_QUERY_KEY, groupId] })
      queryClient.invalidateQueries({ queryKey: [GROUP_MEMBERS_QUERY_KEY, 'available', organizationId, groupId] })
      queryClient.invalidateQueries({ queryKey: [PERMISSION_GROUPS_QUERY_KEY, organizationId] })
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => permissionsService.removeMemberFromGroup(groupId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROUP_MEMBERS_QUERY_KEY, groupId] })
      queryClient.invalidateQueries({ queryKey: [GROUP_MEMBERS_QUERY_KEY, 'available', organizationId, groupId] })
      queryClient.invalidateQueries({ queryKey: [PERMISSION_GROUPS_QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    availableMembers: availableMembersQuery.data || [],
    isLoadingAvailable: availableMembersQuery.isLoading,

    // Mutations
    addMember: addMemberMutation.mutateAsync,
    isAdding: addMemberMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending,

    // Utilities
    refetch: membersQuery.refetch,
    refetchAvailable: availableMembersQuery.refetch,
  }
}

/**
 * Hook to get groups a member belongs to
 */
export function useMemberGroups(memberId?: string) {
  return useQuery({
    queryKey: [GROUP_MEMBERS_QUERY_KEY, 'member', memberId],
    queryFn: () => permissionsService.getMemberGroups(memberId!),
    enabled: !!memberId,
  })
}

/**
 * Hook to get all permission codes for a member
 */
export function useMemberPermissionCodes(memberId?: string) {
  const query = useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, 'member-codes', memberId],
    queryFn: () => permissionsService.getMemberPermissionCodes(memberId!),
    enabled: !!memberId,
  })

  return {
    permissionCodes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
