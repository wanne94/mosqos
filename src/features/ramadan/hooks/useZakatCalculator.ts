/**
 * Zakat Calculator Hooks
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { zakatService } from '../services/zakat.service'
import type { ZakatAssets, ZakatLiabilities, ZakatCalculationResult } from '../types'

const ZAKAT_KEYS = {
  all: ['zakat'] as const,
  nisab: () => [...ZAKAT_KEYS.all, 'nisab'] as const,
  history: (orgId: string) => [...ZAKAT_KEYS.all, 'history', orgId] as const,
  stats: (orgId: string, year?: number) => [...ZAKAT_KEYS.all, 'stats', orgId, year] as const,
}

// Default empty assets and liabilities
const DEFAULT_ASSETS: ZakatAssets = {
  cash_on_hand: 0,
  bank_balances: 0,
  gold_value: 0,
  silver_value: 0,
  investments: 0,
  business_inventory: 0,
  receivables: 0,
  other_assets: 0,
}

const DEFAULT_LIABILITIES: ZakatLiabilities = {
  debts: 0,
  bills_due: 0,
  loans: 0,
  other_liabilities: 0,
}

/**
 * Hook to get Nisab values
 */
export function useNisabValues(currency: string = 'USD') {
  return useQuery({
    queryKey: [...ZAKAT_KEYS.nisab(), currency],
    queryFn: () => zakatService.getNisabValues(currency),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get Zakat calculation history
 */
export function useZakatHistory(organizationId?: string, limit = 20) {
  return useQuery({
    queryKey: [...ZAKAT_KEYS.history(organizationId || ''), limit],
    queryFn: () => zakatService.getCalculationHistory(organizationId!, limit),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get Zakat stats
 */
export function useZakatStats(organizationId?: string, year?: number) {
  return useQuery({
    queryKey: ZAKAT_KEYS.stats(organizationId || '', year),
    queryFn: () => zakatService.getZakatStats(organizationId!, year),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Full Zakat Calculator Hook with state management
 */
export function useZakatCalculator(params: {
  organizationId?: string
  personId?: string
  currency?: string
}) {
  const { organizationId, personId, currency = 'USD' } = params
  const queryClient = useQueryClient()

  // State for assets and liabilities
  const [assets, setAssets] = useState<ZakatAssets>(DEFAULT_ASSETS)
  const [liabilities, setLiabilities] = useState<ZakatLiabilities>(DEFAULT_LIABILITIES)
  const [useGoldNisab, setUseGoldNisab] = useState(true) // Gold nisab by default

  // Get Nisab values
  const nisab = useNisabValues(currency)

  // Calculate result based on current state
  const result = useMemo<ZakatCalculationResult | null>(() => {
    if (!nisab.data) return null

    const nisabThreshold = useGoldNisab
      ? nisab.data.nisab_gold_usd
      : nisab.data.nisab_silver_usd

    return zakatService.calculateZakat(assets, liabilities, nisabThreshold)
  }, [assets, liabilities, nisab.data, useGoldNisab])

  // Save calculation mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !result) {
        throw new Error('Organization ID and calculation result required')
      }
      return zakatService.saveCalculation(
        organizationId,
        personId || null,
        assets,
        liabilities,
        result,
        currency
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZAKAT_KEYS.history(organizationId!) })
    },
  })

  // Update asset value
  const updateAsset = (key: keyof ZakatAssets, value: number) => {
    setAssets(prev => ({ ...prev, [key]: value }))
  }

  // Update liability value
  const updateLiability = (key: keyof ZakatLiabilities, value: number) => {
    setLiabilities(prev => ({ ...prev, [key]: value }))
  }

  // Reset all values
  const reset = () => {
    setAssets(DEFAULT_ASSETS)
    setLiabilities(DEFAULT_LIABILITIES)
  }

  return {
    // State
    assets,
    liabilities,
    useGoldNisab,
    setUseGoldNisab,

    // Nisab data
    nisab: nisab.data,
    isLoadingNisab: nisab.isLoading,

    // Calculation result
    result,

    // Actions
    updateAsset,
    updateLiability,
    reset,

    // Save
    saveCalculation: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
  }
}
