import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { casesService } from '../services/cases.service'
import type {
  CaseFilters,
  CreateCaseInput,
  UpdateCaseInput,
  AddCaseNoteInput,
  CaseStatus,
} from '../types/cases.types'

const QUERY_KEY = 'cases'

interface UseCasesOptions {
  organizationId?: string
  filters?: CaseFilters
}

export function useCases({ organizationId, filters }: UseCasesOptions = {}) {
  const queryClient = useQueryClient()

  // Get all cases
  const query = useQuery({
    queryKey: [QUERY_KEY, organizationId, filters],
    queryFn: () => casesService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get stats
  const statsQuery = useQuery({
    queryKey: [QUERY_KEY, 'stats', organizationId],
    queryFn: () => casesService.getStats(organizationId!),
    enabled: !!organizationId,
  })

  // Get case types
  const typesQuery = useQuery({
    queryKey: [QUERY_KEY, 'types', organizationId],
    queryFn: () => casesService.getCaseTypes(organizationId!),
    enabled: !!organizationId,
  })

  // Get categories
  const categoriesQuery = useQuery({
    queryKey: [QUERY_KEY, 'categories', organizationId],
    queryFn: () => casesService.getCategories(organizationId!),
    enabled: !!organizationId,
  })

  // Get cases requiring followup
  const followupQuery = useQuery({
    queryKey: [QUERY_KEY, 'followup', organizationId],
    queryFn: () => casesService.getRequiringFollowup(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateCaseInput) => casesService.create(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCaseInput }) =>
      casesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => casesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: ({ caseId, userId }: { caseId: string; userId: string | null }) =>
      casesService.assign(caseId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ caseId, status }: { caseId: string; status: CaseStatus }) =>
      casesService.updateStatus(caseId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (input: AddCaseNoteInput) => casesService.addNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    cases: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    caseTypes: typesQuery.data || [],
    categories: categoriesQuery.data || [],
    casesRequiringFollowup: followupQuery.data || [],
    isLoadingFollowup: followupQuery.isLoading,

    // Mutations
    createCase: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCase: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCase: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    assignCase: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    updateCaseStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single case
export function useCase(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => casesService.getById(id!),
    enabled: !!id,
  })
}

// Hook for member's cases
export function useMemberCases(memberId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'member', memberId],
    queryFn: () => casesService.getByMember(memberId!),
    enabled: !!memberId,
  })
}

// Hook for my assigned cases
export function useMyAssignedCases(userId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'my-assigned', userId],
    queryFn: () => casesService.getMyAssigned(userId!),
    enabled: !!userId,
  })
}
