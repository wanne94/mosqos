/**
 * Users React Query Hooks for Platform Admin
 *
 * Hooks for user management data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services/users.service'
import type { UserFilters, ImamFilters, UserRole } from '../types/user.types'

// Query keys
export const userKeys = {
  all: ['platform-users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  imams: ['platform-imams'] as const,
  imamsList: (filters?: ImamFilters) => [...userKeys.imams, 'list', filters] as const,
}

/**
 * Get all users with optional filters
 */
export function useAllUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersService.getAll(filters),
  })
}

/**
 * Get user detail by ID
 */
export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersService.getById(userId),
    enabled: !!userId,
  })
}

/**
 * Get all imams with optional filters
 */
export function useAllImams(filters?: ImamFilters) {
  return useQuery({
    queryKey: userKeys.imamsList(filters),
    queryFn: () => usersService.getImams(filters),
  })
}

/**
 * Change user's role in an organization
 */
export function useChangeUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, organizationId, newRole }: {
      userId: string
      organizationId: string
      newRole: UserRole
    }) => usersService.changeRole(userId, organizationId, newRole),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
    },
  })
}

/**
 * Remove user from an organization
 */
export function useRemoveUserFromOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, organizationId }: {
      userId: string
      organizationId: string
    }) => usersService.removeFromOrganization(userId, organizationId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
    },
  })
}
