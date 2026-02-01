import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { donationsService } from '../services/donations.service'
import type {
  DonationFilters,
  FundFilters,
  CreateDonationInput,
  UpdateDonationInput,
  CreateFundInput,
  UpdateFundInput,
} from '../types/donations.types'

const QUERY_KEY = 'donations'
const FUNDS_QUERY_KEY = 'funds'

interface UseDonationsOptions {
  organizationId?: string
  filters?: DonationFilters
}

export function useDonations({ organizationId, filters }: UseDonationsOptions = {}) {
  const queryClient = useQueryClient()

  // Get all donations
  const query = useQuery({
    queryKey: [QUERY_KEY, organizationId, filters],
    queryFn: () => donationsService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get summary
  const summaryQuery = useQuery({
    queryKey: [QUERY_KEY, 'summary', organizationId, filters?.date_from, filters?.date_to],
    queryFn: () => donationsService.getSummary(organizationId!, {
      from: filters?.date_from,
      to: filters?.date_to,
    }),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateDonationInput) => donationsService.create(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: [FUNDS_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDonationInput }) =>
      donationsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: [FUNDS_QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => donationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
      queryClient.invalidateQueries({ queryKey: [FUNDS_QUERY_KEY, organizationId] })
    },
  })

  // Send receipt mutation
  const sendReceiptMutation = useMutation({
    mutationFn: (donationId: string) => donationsService.sendReceipt(donationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    donations: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,

    // Mutations
    createDonation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateDonation: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteDonation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    sendReceipt: sendReceiptMutation.mutateAsync,
    isSendingReceipt: sendReceiptMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single donation
export function useDonation(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => donationsService.getById(id!),
    enabled: !!id,
  })
}

// Hook for member's donations
export function useMemberDonations(memberId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'member', memberId],
    queryFn: () => donationsService.getByMember(memberId!),
    enabled: !!memberId,
  })
}

// ============================================================================
// FUNDS HOOKS
// ============================================================================

interface UseFundsOptions {
  organizationId?: string
  filters?: FundFilters
}

export function useFunds({ organizationId, filters }: UseFundsOptions = {}) {
  const queryClient = useQueryClient()

  // Get all funds
  const query = useQuery({
    queryKey: [FUNDS_QUERY_KEY, organizationId, filters],
    queryFn: () => donationsService.getFunds(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateFundInput) => donationsService.createFund(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FUNDS_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFundInput }) =>
      donationsService.updateFund(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FUNDS_QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => donationsService.deleteFund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FUNDS_QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    funds: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    // Mutations
    createFund: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateFund: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteFund: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single fund
export function useFund(id?: string) {
  return useQuery({
    queryKey: [FUNDS_QUERY_KEY, 'detail', id],
    queryFn: () => donationsService.getFundById(id!),
    enabled: !!id,
  })
}
