import { useQuery } from '@tanstack/react-query'
import { platformService } from '../services/platform.service'

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: () => platformService.getStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

export const useRecentOrganizations = (limit = 5) => {
  return useQuery({
    queryKey: ['platform', 'organizations', 'recent', limit],
    queryFn: () => platformService.getRecentOrganizations(limit),
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
