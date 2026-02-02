/**
 * Organizations React Query Hooks
 *
 * Hooks for organization data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsService } from '../services/organizations.service'
import type {
  CreateOrganizationInput,
  AdminCreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters
} from '../types/organization.types'

// Query keys
export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters?: OrganizationFilters) => [...organizationKeys.lists(), filters] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  bySlug: (slug: string) => [...organizationKeys.all, 'slug', slug] as const,
  pending: () => [...organizationKeys.all, 'pending'] as const,
  pendingCount: () => [...organizationKeys.all, 'pending-count'] as const,
  stats: (id: string) => [...organizationKeys.all, 'stats', id] as const,
  admins: (id: string) => [...organizationKeys.all, 'admins', id] as const,
  userOrg: (userId: string) => [...organizationKeys.all, 'user-org', userId] as const,
  countries: ['countries'] as const,
}

/**
 * Get all active countries for dropdown
 */
export function useCountries() {
  return useQuery({
    queryKey: organizationKeys.countries,
    queryFn: () => organizationsService.getCountries(),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

/**
 * Get all organizations with optional filters
 */
export function useOrganizations(filters?: OrganizationFilters) {
  return useQuery({
    queryKey: organizationKeys.list(filters),
    queryFn: () => organizationsService.getAll(filters),
  })
}

/**
 * Get organization by ID
 */
export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationsService.getById(id),
    enabled: !!id,
  })
}

/**
 * Get organization by slug
 */
export function useOrganizationBySlug(slug: string) {
  return useQuery({
    queryKey: organizationKeys.bySlug(slug),
    queryFn: () => organizationsService.getBySlug(slug),
    enabled: !!slug,
  })
}

/**
 * Get pending organizations for admin approval
 */
export function usePendingOrganizations() {
  return useQuery({
    queryKey: organizationKeys.pending(),
    queryFn: () => organizationsService.getPending(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Get pending organizations count
 */
export function usePendingOrganizationsCount() {
  return useQuery({
    queryKey: organizationKeys.pendingCount(),
    queryFn: () => organizationsService.getPendingCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Get organization statistics
 */
export function useOrganizationStats(organizationId: string) {
  return useQuery({
    queryKey: organizationKeys.stats(organizationId),
    queryFn: () => organizationsService.getStats(organizationId),
    enabled: !!organizationId,
  })
}

/**
 * Get organization admins (owners and delegates)
 */
export function useOrganizationAdmins(organizationId: string) {
  return useQuery({
    queryKey: organizationKeys.admins(organizationId),
    queryFn: () => organizationsService.getAdmins(organizationId),
    enabled: !!organizationId,
  })
}

/**
 * Get user's organization
 */
export function useUserOrganization(userId?: string) {
  return useQuery({
    queryKey: organizationKeys.userOrg(userId || ''),
    queryFn: () => organizationsService.getUserOrganization(userId!),
    enabled: !!userId,
    refetchInterval: 10000, // Check every 10 seconds for status changes
  })
}

/**
 * Create a new organization (self-service)
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => organizationsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

/**
 * Create a new organization (admin)
 */
export function useAdminCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AdminCreateOrganizationInput) => organizationsService.adminCreate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

/**
 * Add owner to organization
 */
export function useAddOrganizationOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      organizationsService.addOwner(organizationId, userId),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.admins(organizationId) })
    },
  })
}

/**
 * Update an organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationInput }) =>
      organizationsService.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      queryClient.setQueryData(organizationKeys.detail(result.id), result)
    },
  })
}

/**
 * Delete an organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => organizationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

/**
 * Approve a pending organization
 */
export function useApproveOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (organizationId: string) => organizationsService.approve(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

/**
 * Reject a pending organization
 */
export function useRejectOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ organizationId, reason }: { organizationId: string; reason: string }) =>
      organizationsService.reject(organizationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

/**
 * Deactivate an organization
 */
export function useDeactivateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => organizationsService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

/**
 * Reactivate an organization
 */
export function useReactivateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => organizationsService.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}
