import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pledgesService } from '../services/pledges.service'
import type {
  PledgeFilters,
  RecurringDonationFilters,
  CreatePledgeInput,
  UpdatePledgeInput,
  CreateRecurringDonationInput,
  UpdateRecurringDonationInput,
} from '../types/donations.types'

const PLEDGES_QUERY_KEY = 'pledges'
const RECURRING_QUERY_KEY = 'recurring-donations'

// ============================================================================
// PLEDGES HOOKS
// ============================================================================

interface UsePledgesOptions {
  organizationId?: string
  filters?: PledgeFilters
}

export function usePledges({ organizationId, filters }: UsePledgesOptions = {}) {
  const queryClient = useQueryClient()

  // Get all pledges
  const query = useQuery({
    queryKey: [PLEDGES_QUERY_KEY, organizationId, filters],
    queryFn: () => pledgesService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get overdue pledges
  const overdueQuery = useQuery({
    queryKey: [PLEDGES_QUERY_KEY, 'overdue', organizationId],
    queryFn: () => pledgesService.getOverdue(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreatePledgeInput) => pledgesService.create(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLEDGES_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePledgeInput }) =>
      pledgesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLEDGES_QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pledgesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLEDGES_QUERY_KEY, organizationId] })
    },
  })

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: ({ pledgeId, amount }: { pledgeId: string; amount: number }) =>
      pledgesService.recordPayment(pledgeId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLEDGES_QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: ['donations', organizationId] })
    },
  })

  return {
    // Queries
    pledges: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    overduePledges: overdueQuery.data || [],
    isLoadingOverdue: overdueQuery.isLoading,

    // Mutations
    createPledge: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePledge: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deletePledge: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    recordPayment: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single pledge
export function usePledge(id?: string) {
  return useQuery({
    queryKey: [PLEDGES_QUERY_KEY, 'detail', id],
    queryFn: () => pledgesService.getById(id!),
    enabled: !!id,
  })
}

// Hook for member's pledges
export function useMemberPledges(memberId?: string) {
  return useQuery({
    queryKey: [PLEDGES_QUERY_KEY, 'member', memberId],
    queryFn: () => pledgesService.getByMember(memberId!),
    enabled: !!memberId,
  })
}

// ============================================================================
// RECURRING DONATIONS HOOKS
// ============================================================================

interface UseRecurringDonationsOptions {
  organizationId?: string
  filters?: RecurringDonationFilters
}

export function useRecurringDonations({ organizationId, filters }: UseRecurringDonationsOptions = {}) {
  const queryClient = useQueryClient()

  // Get all recurring donations
  const query = useQuery({
    queryKey: [RECURRING_QUERY_KEY, organizationId, filters],
    queryFn: () => pledgesService.getRecurringDonations(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateRecurringDonationInput) =>
      pledgesService.createRecurring(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecurringDonationInput }) =>
      pledgesService.updateRecurring(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY, organizationId] })
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => pledgesService.cancelRecurring(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY, organizationId] })
    },
  })

  // Pause mutation
  const pauseMutation = useMutation({
    mutationFn: (id: string) => pledgesService.pauseRecurring(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY, organizationId] })
    },
  })

  // Resume mutation
  const resumeMutation = useMutation({
    mutationFn: (id: string) => pledgesService.resumeRecurring(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    recurringDonations: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    // Mutations
    createRecurringDonation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateRecurringDonation: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    cancelRecurringDonation: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    pauseRecurringDonation: pauseMutation.mutateAsync,
    isPausing: pauseMutation.isPending,
    resumeRecurringDonation: resumeMutation.mutateAsync,
    isResuming: resumeMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single recurring donation
export function useRecurringDonation(id?: string) {
  return useQuery({
    queryKey: [RECURRING_QUERY_KEY, 'detail', id],
    queryFn: () => pledgesService.getRecurringById(id!),
    enabled: !!id,
  })
}

// Hook for member's recurring donations
export function useMemberRecurringDonations(memberId?: string) {
  return useQuery({
    queryKey: [RECURRING_QUERY_KEY, 'member', memberId],
    queryFn: () => pledgesService.getRecurringByMember(memberId!),
    enabled: !!memberId,
  })
}
