import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { islamicServicesService } from '../services/islamic-services.service'
import type {
  IslamicServiceInput,
  IslamicServiceUpdateInput,
  IslamicServiceTypeInput,
  IslamicServiceFilters,
  ServiceStatus,
} from '../types/islamic-services.types'

const QUERY_KEY = 'islamic-services'
const TYPES_KEY = 'islamic-service-types'

interface UseIslamicServicesOptions {
  organizationId?: string
  filters?: IslamicServiceFilters
}

// Main hook for services
export function useIslamicServices({ organizationId, filters }: UseIslamicServicesOptions = {}) {
  const queryClient = useQueryClient()

  // Get all services
  const query = useQuery({
    queryKey: [QUERY_KEY, organizationId, filters],
    queryFn: () => islamicServicesService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get stats
  const statsQuery = useQuery({
    queryKey: [QUERY_KEY, 'stats', organizationId],
    queryFn: () => islamicServicesService.getStats(organizationId!),
    enabled: !!organizationId,
  })

  // Get upcoming
  const upcomingQuery = useQuery({
    queryKey: [QUERY_KEY, 'upcoming', organizationId],
    queryFn: () => islamicServicesService.getUpcoming(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: IslamicServiceInput) => islamicServicesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: IslamicServiceUpdateInput) => islamicServicesService.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceStatus }) =>
      islamicServicesService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      islamicServicesService.recordPayment(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => islamicServicesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    services: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    upcoming: upcomingQuery.data || [],
    isLoadingUpcoming: upcomingQuery.isLoading,

    // Mutations
    createService: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateService: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    recordPayment: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,
    deleteService: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single service
export function useIslamicService(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => islamicServicesService.getById(id!),
    enabled: !!id,
  })
}

// Hook for service types
export function useServiceTypes(organizationId?: string, activeOnly = false) {
  const queryClient = useQueryClient()

  // Get types
  const query = useQuery({
    queryKey: [TYPES_KEY, organizationId, activeOnly],
    queryFn: () => islamicServicesService.getServiceTypes(organizationId!, activeOnly),
    enabled: !!organizationId,
  })

  // Create type mutation
  const createMutation = useMutation({
    mutationFn: (input: IslamicServiceTypeInput) => islamicServicesService.createServiceType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TYPES_KEY, organizationId] })
    },
  })

  // Update type mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IslamicServiceTypeInput> }) =>
      islamicServicesService.updateServiceType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TYPES_KEY, organizationId] })
    },
  })

  // Delete type mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => islamicServicesService.deleteServiceType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TYPES_KEY, organizationId] })
    },
  })

  // Seed defaults mutation
  const seedMutation = useMutation({
    mutationFn: () => islamicServicesService.seedDefaultTypes(organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TYPES_KEY, organizationId] })
    },
  })

  return {
    serviceTypes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    createType: createMutation.mutateAsync,
    isCreatingType: createMutation.isPending,
    updateType: updateMutation.mutateAsync,
    isUpdatingType: updateMutation.isPending,
    deleteType: deleteMutation.mutateAsync,
    isDeletingType: deleteMutation.isPending,
    seedDefaultTypes: seedMutation.mutateAsync,
    isSeeding: seedMutation.isPending,

    refetch: query.refetch,
  }
}
