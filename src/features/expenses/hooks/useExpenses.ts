import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesService } from '../services/expenses.service'
import type {
  ExpenseFilters,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from '../types/expenses.types'

const EXPENSES_QUERY_KEY = 'expenses'
const EXPENSE_CATEGORIES_QUERY_KEY = 'expense-categories'

// ============================================================================
// EXPENSES HOOKS
// ============================================================================

interface UseExpensesOptions {
  organizationId?: string
  filters?: ExpenseFilters
}

/**
 * Hook to get all expenses for an organization with mutations
 */
export function useExpenses({ organizationId, filters }: UseExpensesOptions = {}) {
  const queryClient = useQueryClient()

  // Get all expenses
  const query = useQuery({
    queryKey: [EXPENSES_QUERY_KEY, organizationId, filters],
    queryFn: () => expensesService.getAll(organizationId!, filters),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateExpenseInput) => expensesService.create(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseInput }) =>
      expensesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY, organizationId] })
    },
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) =>
      expensesService.approve(id, approved, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY, organizationId] })
    },
  })

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: (id: string) => expensesService.markAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    expenses: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    // Mutations
    createExpense: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateExpense: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteExpense: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    approveExpense: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    markAsPaid: markAsPaidMutation.mutateAsync,
    isMarkingAsPaid: markAsPaidMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

/**
 * Hook to get a single expense by ID
 */
export function useExpense(id?: string) {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'detail', id],
    queryFn: () => expensesService.getById(id!),
    enabled: !!id,
  })
}

/**
 * Hook to get expense summary/statistics
 */
export function useExpenseSummary(
  organizationId?: string,
  dateRange?: { startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'summary', organizationId, dateRange],
    queryFn: () => expensesService.getSummary(organizationId!, dateRange),
    enabled: !!organizationId,
  })
}

// ============================================================================
// EXPENSE CATEGORIES HOOKS
// ============================================================================

interface UseExpenseCategoriesOptions {
  organizationId?: string
  activeOnly?: boolean
}

/**
 * Hook to get expense categories for an organization
 */
export function useExpenseCategories({ organizationId, activeOnly = true }: UseExpenseCategoriesOptions = {}) {
  const queryClient = useQueryClient()

  // Get all categories
  const query = useQuery({
    queryKey: [EXPENSE_CATEGORIES_QUERY_KEY, organizationId, activeOnly],
    queryFn: () => expensesService.getCategories(organizationId!, activeOnly),
    enabled: !!organizationId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateExpenseCategoryInput) =>
      expensesService.createCategory(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSE_CATEGORIES_QUERY_KEY, organizationId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseCategoryInput }) =>
      expensesService.updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSE_CATEGORIES_QUERY_KEY, organizationId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSE_CATEGORIES_QUERY_KEY, organizationId] })
    },
  })

  return {
    // Queries
    categories: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    // Mutations
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCategory: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCategory: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Utilities
    refetch: query.refetch,
  }
}

/**
 * Hook to get a single category by ID
 */
export function useExpenseCategory(id?: string) {
  return useQuery({
    queryKey: [EXPENSE_CATEGORIES_QUERY_KEY, 'detail', id],
    queryFn: () => expensesService.getCategoryById(id!),
    enabled: !!id,
  })
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get distinct categories used in expenses (for filters)
 */
export function useUsedExpenseCategories(organizationId?: string) {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'used-categories', organizationId],
    queryFn: () => expensesService.getUsedCategories(organizationId!),
    enabled: !!organizationId,
  })
}

/**
 * Hook to get distinct vendors used in expenses (for autocomplete)
 */
export function useUsedVendors(organizationId?: string) {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'used-vendors', organizationId],
    queryFn: () => expensesService.getUsedVendors(organizationId!),
    enabled: !!organizationId,
  })
}
