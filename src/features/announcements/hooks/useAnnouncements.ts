import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementsService } from '../services/announcements.service'
import type {
  AnnouncementInput,
  AnnouncementUpdateInput,
  AnnouncementFilters,
} from '../types/announcements.types'

const QUERY_KEY = 'announcements'

interface UseAnnouncementsOptions {
  organizationId?: string
  filters?: AnnouncementFilters
}

export function useAnnouncements({ organizationId, filters }: UseAnnouncementsOptions = {}) {
  const queryClient = useQueryClient()

  // Get all announcements
  const query = useQuery({
    queryKey: [QUERY_KEY, organizationId, filters],
    queryFn: () => announcementsService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Get stats
  const statsQuery = useQuery({
    queryKey: [QUERY_KEY, 'stats', organizationId],
    queryFn: () => announcementsService.getStats(organizationId!),
    enabled: !!organizationId,
  })

  // Get categories
  const categoriesQuery = useQuery({
    queryKey: [QUERY_KEY, 'categories', organizationId],
    queryFn: () => announcementsService.getCategories(organizationId!),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: AnnouncementInput) => announcementsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: AnnouncementUpdateInput) => announcementsService.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (id: string) => announcementsService.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => announcementsService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      announcementsService.togglePin(id, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    announcements: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    categories: categoriesQuery.data || [],
    isLoadingCategories: categoriesQuery.isLoading,

    // Mutations
    createAnnouncement: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAnnouncement: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    publishAnnouncement: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    archiveAnnouncement: archiveMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,
    deleteAnnouncement: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    togglePin: togglePinMutation.mutateAsync,
    isTogglingPin: togglePinMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

// Hook for single announcement
export function useAnnouncement(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => announcementsService.getById(id!),
    enabled: !!id,
  })
}

// Hook for published announcements (portal)
export function usePublishedAnnouncements(organizationId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'published', organizationId],
    queryFn: () => announcementsService.getPublished(organizationId!),
    enabled: !!organizationId,
  })
}
