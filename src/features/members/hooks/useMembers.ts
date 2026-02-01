import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '../services/members.service'
import type {
  MemberFilters,
  CreateMemberInput,
  UpdateMemberInput,
  MembershipStatus,
} from '../types/members.types'

const QUERY_KEY = 'members'

interface UseMembersOptions {
  organizationId?: string
  filters?: MemberFilters
}

export function useMembers({ organizationId, filters }: UseMembersOptions = {}) {
  const queryClient = useQueryClient()

  // Get all members
  const query = useQuery({
    queryKey: [QUERY_KEY, organizationId, filters],
    queryFn: () => membersService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get stats
  const statsQuery = useQuery({
    queryKey: [QUERY_KEY, 'stats', organizationId],
    queryFn: () => membersService.getStats(organizationId!),
    enabled: !!organizationId,
  })

  // Get cities for filters
  const citiesQuery = useQuery({
    queryKey: [QUERY_KEY, 'cities', organizationId],
    queryFn: () => membersService.getCities(organizationId!),
    enabled: !!organizationId,
  })

  // Get states for filters
  const statesQuery = useQuery({
    queryKey: [QUERY_KEY, 'states', organizationId],
    queryFn: () => membersService.getStates(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateMemberInput) => membersService.create(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.organization_id] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMemberInput }) =>
      membersService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, input }: { ids: string[]; input: Partial<UpdateMemberInput> }) =>
      membersService.bulkUpdate(ids, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Assign to household mutation
  const assignToHouseholdMutation = useMutation({
    mutationFn: ({ memberId, householdId }: { memberId: string; householdId: string | null }) =>
      membersService.assignToHousehold(memberId, householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: ['households', organizationId] })
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: MembershipStatus }) =>
      membersService.updateStatus(memberId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    members: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    cities: citiesQuery.data || [],
    states: statesQuery.data || [],

    // Mutations
    createMember: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMember: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteMember: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    bulkUpdateMembers: bulkUpdateMutation.mutateAsync,
    isBulkUpdating: bulkUpdateMutation.isPending,
    assignToHousehold: assignToHouseholdMutation.mutateAsync,
    isAssigning: assignToHouseholdMutation.isPending,
    updateMemberStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single member
export function useMember(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => membersService.getById(id!),
    enabled: !!id,
  })
}

// Hook for member search
export function useMemberSearch(organizationId?: string) {
  const search = async (query: string) => {
    if (!organizationId) return []
    return membersService.search(organizationId, query)
  }

  return { search }
}

// Hook for members in a specific household
export function useHouseholdMembers(householdId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'household', householdId],
    queryFn: () => membersService.getByHousehold(householdId!),
    enabled: !!householdId,
  })
}
