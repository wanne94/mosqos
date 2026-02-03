/**
 * Ramadan Settings Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ramadanService } from '../services/ramadan.service'
import type { CreateRamadanSettingsInput, UpdateRamadanSettingsInput } from '../types'

const RAMADAN_KEYS = {
  all: ['ramadan'] as const,
  settings: (orgId: string) => [...RAMADAN_KEYS.all, 'settings', orgId] as const,
  active: (orgId: string) => [...RAMADAN_KEYS.all, 'active', orgId] as const,
  iftars: (orgId: string) => [...RAMADAN_KEYS.all, 'iftars', orgId] as const,
  taraweeh: (orgId: string) => [...RAMADAN_KEYS.all, 'taraweeh', orgId] as const,
}

/**
 * Hook to get Ramadan settings
 */
export function useRamadanSettings(organizationId?: string) {
  const queryClient = useQueryClient()

  const settings = useQuery({
    queryKey: RAMADAN_KEYS.settings(organizationId || ''),
    queryFn: () => ramadanService.getSettings(organizationId!),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateRamadanSettingsInput) =>
      ramadanService.createSettings(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAMADAN_KEYS.settings(organizationId!) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRamadanSettingsInput }) =>
      ramadanService.updateSettings(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAMADAN_KEYS.settings(organizationId!) })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ramadanService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAMADAN_KEYS.settings(organizationId!) })
    },
  })

  // Calculate remaining days
  const daysInfo = settings.data
    ? ramadanService.calculateDaysRemaining(settings.data)
    : { daysRemaining: 0, currentDay: 0, totalDays: 30, isRamadan: false }

  return {
    settings: settings.data,
    isLoading: settings.isLoading,
    error: settings.error,
    refetch: settings.refetch,

    // Days info
    ...daysInfo,

    // Mutations
    createSettings: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    toggleActive: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
  }
}

/**
 * Hook to get Iftar events
 */
export function useIftarEvents(organizationId?: string, limit = 5) {
  return useQuery({
    queryKey: [...RAMADAN_KEYS.iftars(organizationId || ''), limit],
    queryFn: () => ramadanService.getIftarEvents(organizationId!, limit),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get Taraweeh schedule
 */
export function useTaraweehSchedule(organizationId?: string) {
  return useQuery({
    queryKey: RAMADAN_KEYS.taraweeh(organizationId || ''),
    queryFn: () => ramadanService.getTaraweehSchedule(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  })
}
