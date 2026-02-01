import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { householdsService } from '../services/households.service'
import type {
  HouseholdFilters,
  CreateHouseholdInput,
  UpdateHouseholdInput,
} from '../types/households.types'

const QUERY_KEY = 'households'

interface UseHouseholdsOptions {
  organizationId?: string
  filters?: HouseholdFilters
}

export function useHouseholds({ organizationId, filters }: UseHouseholdsOptions = {}) {
  const queryClient = useQueryClient()

  // Get all households
  const query = useQuery({
    queryKey: [QUERY_KEY, organizationId, filters],
    queryFn: () => householdsService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get stats
  const statsQuery = useQuery({
    queryKey: [QUERY_KEY, 'stats', organizationId],
    queryFn: () => householdsService.getStats(organizationId!),
    enabled: !!organizationId,
  })

  // Get cities for filters
  const citiesQuery = useQuery({
    queryKey: [QUERY_KEY, 'cities', organizationId],
    queryFn: () => householdsService.getCities(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateHouseholdInput) => householdsService.create(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.organization_id] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHouseholdInput }) =>
      householdsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => householdsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: ['members', organizationId] })
    },
  })

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ householdId, memberId }: { householdId: string; memberId: string }) =>
      householdsService.addMember(householdId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: ['members', organizationId] })
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ householdId, memberId }: { householdId: string; memberId: string }) =>
      householdsService.removeMember(householdId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: ['members', organizationId] })
    },
  })

  // Set head of household mutation
  const setHeadMutation = useMutation({
    mutationFn: ({ householdId, memberId }: { householdId: string; memberId: string | null }) =>
      householdsService.setHeadOfHousehold(householdId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    households: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    cities: citiesQuery.data || [],

    // Mutations
    createHousehold: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateHousehold: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteHousehold: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
    setHeadOfHousehold: setHeadMutation.mutateAsync,
    isSettingHead: setHeadMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single household
export function useHousehold(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => householdsService.getById(id!),
    enabled: !!id,
  })
}

// Hook for household search
export function useHouseholdSearch(organizationId?: string) {
  const search = async (query: string) => {
    if (!organizationId) return []
    return householdsService.search(organizationId, query)
  }

  return { search }
}
