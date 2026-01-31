import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qurbaniService } from '../services/qurbani.service'
import type {
  QurbaniCampaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignFilters,
} from '../types/qurbani.types'

interface UseCampaignsOptions {
  organizationId?: string
  filters?: CampaignFilters
}

/**
 * Hook to fetch and manage Qurbani campaigns
 */
export function useCampaigns(options: UseCampaignsOptions = {}) {
  const { organizationId, filters } = options
  const queryClient = useQueryClient()

  const queryKey = ['qurbani-campaigns', organizationId, filters]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return []
      return qurbaniService.getCampaigns(organizationId, filters)
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const createCampaign = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      if (!organizationId) throw new Error('Organization ID required')
      return qurbaniService.createCampaign(organizationId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaigns'] })
    },
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCampaignInput }) => {
      return qurbaniService.updateCampaign(id, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaigns'] })
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      return qurbaniService.deleteCampaign(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurbani-campaigns'] })
    },
  })

  return {
    campaigns: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
    refetch: query.refetch,
    createCampaign: createCampaign.mutateAsync,
    updateCampaign: updateCampaign.mutateAsync,
    deleteCampaign: deleteCampaign.mutateAsync,
    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
    isDeleting: deleteCampaign.isPending,
  }
}

/**
 * Hook to fetch a single campaign
 */
export function useCampaign(campaignId: string | null) {
  return useQuery({
    queryKey: ['qurbani-campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) return null
      return qurbaniService.getCampaign(campaignId)
    },
    enabled: !!campaignId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get campaign statistics
 */
export function useCampaignStats(organizationId: string | null, campaignId: string | null) {
  return useQuery({
    queryKey: ['qurbani-campaign-stats', organizationId, campaignId],
    queryFn: async () => {
      if (!organizationId || !campaignId) return null
      return qurbaniService.getCampaignStats(organizationId, campaignId)
    },
    enabled: !!organizationId && !!campaignId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
