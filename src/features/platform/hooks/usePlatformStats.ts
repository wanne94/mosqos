import { useQuery } from '@tanstack/react-query'
import { platformService, PlatformStats } from '../services/platform.service'

// Type for recent organizations
export interface RecentOrganization {
  id: string
  name: string
  slug: string
  created_at: string
  is_active: boolean
}

export const usePlatformStats = () => {
  return useQuery<PlatformStats>({
    queryKey: ['platform', 'stats'],
    queryFn: () => platformService.getStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

export const useRecentOrganizations = (limit = 5) => {
  return useQuery<RecentOrganization[]>({
    queryKey: ['platform', 'organizations', 'recent', limit],
    queryFn: async () => {
      const data = await platformService.getRecentOrganizations(limit)
      return (data || []) as RecentOrganization[]
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useAllOrganizations = () => {
  return useQuery({
    queryKey: ['platform', 'organizations', 'all'],
    queryFn: () => platformService.getAllOrganizations(),
    staleTime: 60 * 1000, // 1 minute
  })
}
