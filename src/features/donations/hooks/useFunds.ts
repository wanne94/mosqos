import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Fund, CreateFundInput, UpdateFundInput } from '../types/donations.types'

interface UseFundsOptions {
  /** Organization ID to filter funds by */
  organizationId?: string
  /** Whether to include inactive funds */
  includeInactive?: boolean
}

/**
 * Custom hook to fetch and manage organization funds
 * Returns the fund categories configured for the organization
 *
 * @param options - Configuration options
 * @returns Query result with funds data and mutations
 *
 * @example
 * const { funds, isLoading, error, refetch } = useFunds({ organizationId })
 *
 * // In a select dropdown
 * <Select>
 *   {funds.map(fund => (
 *     <SelectItem key={fund.id} value={fund.id}>{fund.name}</SelectItem>
 *   ))}
 * </Select>
 */
export function useFunds(options: UseFundsOptions = {}) {
  const { organizationId, includeInactive = false } = options
  const queryClient = useQueryClient()

  const queryKey = ['funds', organizationId, includeInactive]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Using generic 'any' table access since funds table isn't in generated types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let queryBuilder = (supabase as any).from('funds').select('*')

      if (organizationId) {
        queryBuilder = queryBuilder.eq('organization_id', organizationId)
      }

      if (!includeInactive) {
        queryBuilder = queryBuilder.eq('is_active', true)
      }

      const { data, error } = await queryBuilder.order('sort_order', {
        ascending: true,
      })

      if (error) throw error
      return (data || []) as Fund[]
    },
    enabled: !!organizationId || !options.organizationId, // Always enabled if no org filter required
    staleTime: 5 * 60 * 1000, // 5 minutes - funds rarely change
  })

  // Create fund mutation
  const createFund = useMutation({
    mutationFn: async (input: CreateFundInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('funds')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as Fund
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] })
    },
  })

  // Update fund mutation
  const updateFund = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateFundInput }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('funds')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Fund
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] })
    },
  })

  // Delete fund mutation
  const deleteFund = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('funds').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] })
    },
  })

  return {
    /** List of funds */
    funds: query.data || [],
    /** Loading state */
    isLoading: query.isLoading,
    /** Fetching state (includes background refetch) */
    isFetching: query.isFetching,
    /** Error if query failed */
    error: query.error?.message || null,
    /** Refetch funds manually */
    refetch: query.refetch,
    /** Create a new fund */
    createFund: createFund.mutateAsync,
    /** Update an existing fund */
    updateFund: updateFund.mutateAsync,
    /** Delete a fund */
    deleteFund: deleteFund.mutateAsync,
    /** Mutation loading states */
    isCreating: createFund.isPending,
    isUpdating: updateFund.isPending,
    isDeleting: deleteFund.isPending,
  }
}

/**
 * Hook to get a single fund by ID
 *
 * @param fundId - The fund ID to fetch
 * @returns Query result with fund data
 */
export function useFund(fundId: string | null) {
  return useQuery({
    queryKey: ['fund', fundId],
    queryFn: async () => {
      if (!fundId) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('funds')
        .select('*')
        .eq('id', fundId)
        .single()

      if (error) throw error
      return data as Fund
    },
    enabled: !!fundId,
  })
}

interface FundWithDonations {
  id: string
  name: string
  code: string | null
  current_balance: number
  goal_amount: number | null
  donations: { amount: number }[]
}

interface FundBalance extends Omit<FundWithDonations, 'donations'> {
  totalDonations: number
  progressPercentage: number | null
}

/**
 * Hook to get fund balance summary
 *
 * @param organizationId - Organization ID
 * @returns Fund balances with totals
 */
export function useFundBalances(organizationId: string | null) {
  return useQuery({
    queryKey: ['fund-balances', organizationId],
    queryFn: async (): Promise<FundBalance[]> => {
      if (!organizationId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('funds')
        .select(
          `
          id,
          name,
          code,
          current_balance,
          goal_amount,
          donations:donations(amount)
        `
        )
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return ((data as FundWithDonations[] | null) || []).map((fund) => ({
        id: fund.id,
        name: fund.name,
        code: fund.code,
        current_balance: fund.current_balance,
        goal_amount: fund.goal_amount,
        totalDonations:
          fund.donations?.reduce((sum, d) => sum + d.amount, 0) || 0,
        progressPercentage: fund.goal_amount
          ? Math.min(
              100,
              Math.round((fund.current_balance / fund.goal_amount) * 100)
            )
          : null,
      }))
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes - balances may update more frequently
  })
}
