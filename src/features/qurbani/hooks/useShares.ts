import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qurbaniService } from '../services/qurbani.service'
import type {
  CreateShareInput,
  UpdateShareInput,
  RecordPaymentInput,
  ShareFilters,
  ProcessingStatus,
} from '../types/qurbani.types'

interface UseSharesOptions {
  organizationId?: string
  filters?: ShareFilters
}

/**
 * Hook to fetch and manage Qurbani shares
 */
export function useShares(options: UseSharesOptions = {}) {
  const { organizationId, filters } = options
  const queryClient = useQueryClient()

  const queryKey = ['qurbani-shares', organizationId, filters]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return []
      return qurbaniService.getShares(organizationId, filters)
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  })

  const createShare = useMutation({
    mutationFn: async (input: CreateShareInput) => {
      if (!organizationId) throw new Error('Organization ID required')
      return qurbaniService.createShare(organizationId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-shares'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaign-stats'] })
    },
  })

  const updateShare = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateShareInput }) => {
      return qurbaniService.updateShare(id, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-shares'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-share'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaign-stats'] })
    },
  })

  const deleteShare = useMutation({
    mutationFn: async (id: string) => {
      return qurbaniService.deleteShare(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-shares'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaign-stats'] })
    },
  })

  const recordPayment = useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      if (!organizationId) throw new Error('Organization ID required')
      return qurbaniService.recordPayment(organizationId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-shares'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-share'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaign-stats'] })
    },
  })

  const updateProcessingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProcessingStatus }) => {
      return qurbaniService.updateProcessingStatus(id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-shares'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-share'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaign-stats'] })
    },
  })

  const cancelShare = useMutation({
    mutationFn: async ({
      id,
      reason,
      refundAmount,
    }: {
      id: string
      reason: string
      refundAmount?: number
    }) => {
      return qurbaniService.cancelShare(id, reason, refundAmount)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-shares'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaign-stats'] })
    },
  })

  return {
    shares: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
    refetch: query.refetch,
    createShare: createShare.mutateAsync,
    updateShare: updateShare.mutateAsync,
    deleteShare: deleteShare.mutateAsync,
    recordPayment: recordPayment.mutateAsync,
    updateProcessingStatus: updateProcessingStatus.mutateAsync,
    cancelShare: cancelShare.mutateAsync,
    isCreating: createShare.isPending,
    isUpdating: updateShare.isPending,
    isDeleting: deleteShare.isPending,
    isRecordingPayment: recordPayment.isPending,
    isUpdatingStatus: updateProcessingStatus.isPending,
    isCancelling: cancelShare.isPending,
  }
}

/**
 * Hook to fetch a single share
 */
export function useShare(shareId: string | null) {
  return useQuery({
    queryKey: ['qurbani-share', shareId],
    queryFn: async () => {
      if (!shareId) return null
      return qurbaniService.getShare(shareId)
    },
    enabled: !!shareId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
