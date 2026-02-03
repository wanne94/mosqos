/**
 * Tax Receipts Hooks
 * React Query hooks for tax receipt operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taxReceiptsService, type DonorYearSummary, type YearEndFilters } from '../services/tax-receipts.service'

// Query keys
const TAX_RECEIPTS_KEYS = {
  all: ['tax-receipts'] as const,
  donors: (organizationId: string, year: number) =>
    [...TAX_RECEIPTS_KEYS.all, 'donors', organizationId, year] as const,
  donor: (organizationId: string, donorId: string, year: number) =>
    [...TAX_RECEIPTS_KEYS.all, 'donor', organizationId, donorId, year] as const,
  years: (organizationId: string) =>
    [...TAX_RECEIPTS_KEYS.all, 'years', organizationId] as const,
  stats: (organizationId: string, year: number) =>
    [...TAX_RECEIPTS_KEYS.all, 'stats', organizationId, year] as const,
}

/**
 * Hook to get all donors with donations for a specific year
 */
export function useYearEndDonors(params: {
  organizationId?: string
  filters: YearEndFilters
}) {
  const { organizationId, filters } = params

  return useQuery({
    queryKey: TAX_RECEIPTS_KEYS.donors(organizationId || '', filters.year),
    queryFn: () => taxReceiptsService.getAllDonorsForYear(organizationId!, filters),
    enabled: !!organizationId && !!filters.year,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get summary for a specific donor
 */
export function useDonorYearSummary(params: {
  organizationId?: string
  donorId?: string
  year: number
}) {
  const { organizationId, donorId, year } = params

  return useQuery({
    queryKey: TAX_RECEIPTS_KEYS.donor(organizationId || '', donorId || '', year),
    queryFn: () => taxReceiptsService.getDonorYearSummary(organizationId!, donorId!, year),
    enabled: !!organizationId && !!donorId && !!year,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get available years with donations
 */
export function useAvailableYears(organizationId?: string) {
  return useQuery({
    queryKey: TAX_RECEIPTS_KEYS.years(organizationId || ''),
    queryFn: () => taxReceiptsService.getAvailableYears(organizationId!),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get year-end statistics
 */
export function useYearEndStats(params: {
  organizationId?: string
  year: number
}) {
  const { organizationId, year } = params

  return useQuery({
    queryKey: TAX_RECEIPTS_KEYS.stats(organizationId || '', year),
    queryFn: () => taxReceiptsService.getYearEndStats(organizationId!, year),
    enabled: !!organizationId && !!year,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to mark receipts as sent
 */
export function useMarkReceiptsSent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (donationIds: string[]) => taxReceiptsService.markReceiptsSent(donationIds),
    onSuccess: () => {
      // Invalidate all tax receipts queries
      queryClient.invalidateQueries({ queryKey: TAX_RECEIPTS_KEYS.all })
    },
  })
}

/**
 * Combined hook for year-end statements page
 */
export function useYearEndStatements(params: {
  organizationId?: string
  year: number
  minAmount?: number
  includeNonTaxDeductible?: boolean
}) {
  const { organizationId, year, minAmount = 0, includeNonTaxDeductible = true } = params

  const donors = useYearEndDonors({
    organizationId,
    filters: { year, minAmount, includeNonTaxDeductible },
  })

  const stats = useYearEndStats({
    organizationId,
    year,
  })

  const years = useAvailableYears(organizationId)
  const markSent = useMarkReceiptsSent()

  return {
    // Donors data
    donors: donors.data || [],
    isLoadingDonors: donors.isLoading,
    donorsError: donors.error,
    refetchDonors: donors.refetch,

    // Stats data
    stats: stats.data,
    isLoadingStats: stats.isLoading,

    // Available years
    availableYears: years.data || [new Date().getFullYear()],
    isLoadingYears: years.isLoading,

    // Mutations
    markReceiptsSent: markSent.mutateAsync,
    isMarkingSent: markSent.isPending,

    // Combined loading state
    isLoading: donors.isLoading || stats.isLoading,
  }
}
