import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { umrahService } from '../services/umrah.service'
import type {
  TripFilters,
  RegistrationFilters,
  CreateTripInput,
  UpdateTripInput,
  CreateRegistrationInput,
  UpdateRegistrationInput,
  UpdateVisaStatusInput,
  RecordPaymentInput,
  CancelRegistrationInput,
  TripStatus,
} from '../types/umrah.types'

const TRIPS_QUERY_KEY = 'umrah-trips'
const REGISTRATIONS_QUERY_KEY = 'umrah-registrations'

// ============================================================================
// TRIPS HOOKS
// ============================================================================

interface UseTripsOptions {
  organizationId?: string
  filters?: TripFilters
}

export function useTrips({ organizationId, filters }: UseTripsOptions = {}) {
  const queryClient = useQueryClient()

  // Get all trips
  const query = useQuery({
    queryKey: [TRIPS_QUERY_KEY, organizationId, filters],
    queryFn: () => umrahService.getTrips(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get statistics
  const statsQuery = useQuery({
    queryKey: [TRIPS_QUERY_KEY, 'stats', organizationId],
    queryFn: () => umrahService.getStatistics(organizationId!),
    enabled: !!organizationId,
  })

  // Get upcoming trips
  const upcomingQuery = useQuery({
    queryKey: [TRIPS_QUERY_KEY, 'upcoming', organizationId],
    queryFn: () => umrahService.getUpcomingTrips(organizationId!),
    enabled: !!organizationId,
  })

  // Get trips in progress
  const inProgressQuery = useQuery({
    queryKey: [TRIPS_QUERY_KEY, 'in-progress', organizationId],
    queryFn: () => umrahService.getTripsInProgress(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateTripInput) => umrahService.createTrip(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTripInput }) =>
      umrahService.updateTrip(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => umrahService.deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY, organizationId] })
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TripStatus }) =>
      umrahService.updateTripStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    trips: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    statistics: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    upcomingTrips: upcomingQuery.data || [],
    tripsInProgress: inProgressQuery.data || [],

    // Mutations
    createTrip: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTrip: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTrip: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateTripStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single trip
export function useTrip(id?: string) {
  return useQuery({
    queryKey: [TRIPS_QUERY_KEY, 'detail', id],
    queryFn: () => umrahService.getTripById(id!),
    enabled: !!id,
  })
}

// ============================================================================
// REGISTRATIONS HOOKS
// ============================================================================

interface UseRegistrationsOptions {
  tripId?: string
  organizationId?: string
  filters?: RegistrationFilters
}

export function useRegistrations({ tripId, organizationId, filters }: UseRegistrationsOptions = {}) {
  const queryClient = useQueryClient()

  // Get registrations for a trip
  const query = useQuery({
    queryKey: [REGISTRATIONS_QUERY_KEY, tripId, filters],
    queryFn: () => umrahService.getRegistrations(tripId!, filters),
    enabled: !!tripId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateRegistrationInput) =>
      umrahService.createRegistration(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRegistrationInput }) =>
      umrahService.updateRegistration(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY] })
    },
  })

  // Update visa status mutation
  const updateVisaMutation = useMutation({
    mutationFn: (input: UpdateVisaStatusInput) => umrahService.updateVisaStatus(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY] })
    },
  })

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (input: RecordPaymentInput) => umrahService.recordPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY] })
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (input: CancelRegistrationInput) => umrahService.cancelRegistration(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY] })
    },
  })

  return {
    // Queries
    registrations: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    // Mutations
    createRegistration: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateRegistration: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateVisaStatus: updateVisaMutation.mutateAsync,
    isUpdatingVisa: updateVisaMutation.isPending,
    recordPayment: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,
    cancelRegistration: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single registration
export function useRegistration(id?: string) {
  return useQuery({
    queryKey: [REGISTRATIONS_QUERY_KEY, 'detail', id],
    queryFn: () => umrahService.getRegistrationById(id!),
    enabled: !!id,
  })
}

// Hook for member's registrations
export function useMemberRegistrations(memberId?: string) {
  return useQuery({
    queryKey: [REGISTRATIONS_QUERY_KEY, 'member', memberId],
    queryFn: () => umrahService.getRegistrationsByMember(memberId!),
    enabled: !!memberId,
  })
}

// Hook for all registrations in organization
export function useAllRegistrations(organizationId?: string, filters?: RegistrationFilters) {
  return useQuery({
    queryKey: [REGISTRATIONS_QUERY_KEY, 'all', organizationId, filters],
    queryFn: () => umrahService.getAllRegistrations(organizationId!, filters),
    enabled: !!organizationId,
  })
}
