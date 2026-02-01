import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helper to create chainable mock query builder
function createMockQueryBuilder(finalResult: { data: any; error: any }) {
  const builder: any = {}
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'is',
    'not',
    'or',
    'gte',
    'lte',
    'like',
    'ilike',
    'order',
    'limit',
    'maybeSingle',
    'gt',
    'lt',
    'neq',
  ]

  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
    rpc: vi.fn(),
  },
}))

import { expensesService } from './expenses.service'
import { supabase } from '@/lib/supabase/client'

describe('expensesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // EXPENSES
  // ============================================================================

  describe('getAll', () => {
    const orgId = 'org-123'
    const mockExpenses = [
      {
        id: 'exp-1',
        organization_id: orgId,
        amount: 100,
        category: 'Utilities',
        status: 'pending',
        expense_date: '2024-01-15',
        funds: { id: 'fund-1', name: 'General Fund' },
      },
      {
        id: 'exp-2',
        organization_id: orgId,
        amount: 250,
        category: 'Maintenance',
        status: 'approved',
        expense_date: '2024-01-10',
        funds: null,
      },
    ]

    it('should fetch all expenses for an organization without filters', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getAll(orgId)

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.select).toHaveBeenCalled()
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', orgId)
      expect(mockBuilder.order).toHaveBeenCalledWith('expense_date', { ascending: false })
      expect(result).toEqual(mockExpenses)
    })

    it('should apply fundId filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, { fundId: 'fund-1' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('fund_id', 'fund-1')
    })

    it('should apply category filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, { category: 'Utilities' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('category', 'Utilities')
    })

    it('should apply status filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, { status: 'approved' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'approved')
    })

    it('should apply paymentMethod filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, { paymentMethod: 'check' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('payment_method', 'check')
    })

    it('should apply date range filters', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(mockBuilder.gte).toHaveBeenCalledWith('expense_date', '2024-01-01')
      expect(mockBuilder.lte).toHaveBeenCalledWith('expense_date', '2024-01-31')
    })

    it('should apply amount range filters', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, { minAmount: 50, maxAmount: 200 })

      expect(mockBuilder.gte).toHaveBeenCalledWith('amount', 50)
      expect(mockBuilder.lte).toHaveBeenCalledWith('amount', 200)
    })

    it('should apply vendor filter with ilike', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, { vendor: 'ACME' })

      expect(mockBuilder.ilike).toHaveBeenCalledWith('vendor', '%ACME%')
    })

    it('should apply searchTerm filter with or clause', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpenses, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getAll(orgId, { searchTerm: 'electric' })

      expect(mockBuilder.or).toHaveBeenCalledWith(
        'description.ilike.%electric%,vendor.ilike.%electric%,category.ilike.%electric%,reference_number.ilike.%electric%'
      )
    })

    it('should throw error when query fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Database error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.getAll(orgId)).rejects.toEqual({ message: 'Database error' })
    })

    it('should return empty array when data is null', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getAll(orgId)

      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    const mockExpense = {
      id: 'exp-1',
      organization_id: 'org-123',
      amount: 100,
      category: 'Utilities',
      status: 'pending',
      funds: { id: 'fund-1', name: 'General Fund' },
    }

    it('should fetch a single expense by ID', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpense, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getById('exp-1')

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.select).toHaveBeenCalled()
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'exp-1')
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockExpense)
    })

    it('should return null when expense not found (PGRST116)', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { code: 'OTHER', message: 'Database error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.getById('exp-1')).rejects.toEqual({
        code: 'OTHER',
        message: 'Database error',
      })
    })
  })

  describe('create', () => {
    const orgId = 'org-123'
    const input = {
      amount: 150,
      category: 'Supplies',
      vendor: 'Office Depot',
      fund_id: 'fund-1',
      description: 'Office supplies purchase',
    }
    const createdExpense = {
      id: 'exp-new',
      organization_id: orgId,
      ...input,
      status: 'pending',
      currency: 'USD',
      created_at: '2024-01-15T10:00:00Z',
    }

    it('should create a new expense with provided values', async () => {
      const mockBuilder = createMockQueryBuilder({ data: createdExpense, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.create(orgId, input)

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          organization_id: orgId,
          amount: 150,
          category: 'Supplies',
          vendor: 'Office Depot',
          fund_id: 'fund-1',
          description: 'Office supplies purchase',
          status: 'pending',
          currency: 'USD',
        }),
      ])
      expect(mockBuilder.select).toHaveBeenCalled()
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(createdExpense)
    })

    it('should use default values when optional fields are not provided', async () => {
      const minimalInput = { amount: 50 }
      const mockBuilder = createMockQueryBuilder({ data: { id: 'exp-new', ...minimalInput }, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.create(orgId, minimalInput)

      expect(mockBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          organization_id: orgId,
          amount: 50,
          currency: 'USD',
          status: 'pending',
          fund_id: null,
          category: null,
          description: null,
          vendor: null,
        }),
      ])
    })

    it('should throw error when creation fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Insert failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.create(orgId, input)).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  describe('update', () => {
    const expenseId = 'exp-1'
    const updateInput = {
      amount: 200,
      status: 'approved' as const,
      notes: 'Updated amount after review',
    }
    const updatedExpense = {
      id: expenseId,
      ...updateInput,
      organization_id: 'org-123',
    }

    it('should update an expense', async () => {
      const mockBuilder = createMockQueryBuilder({ data: updatedExpense, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.update(expenseId, updateInput)

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.update).toHaveBeenCalledWith(updateInput)
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', expenseId)
      expect(mockBuilder.select).toHaveBeenCalled()
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(updatedExpense)
    })

    it('should throw error when update fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Update failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.update(expenseId, updateInput)).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })

  describe('delete', () => {
    it('should delete an expense', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.delete('exp-1')

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.delete).toHaveBeenCalled()
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'exp-1')
    })

    it('should throw error when delete fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Delete failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.delete('exp-1')).rejects.toEqual({ message: 'Delete failed' })
    })
  })

  describe('approve', () => {
    const expenseId = 'exp-1'
    const approvedExpense = {
      id: expenseId,
      status: 'approved',
      approved_by: 'user-123',
      approved_at: expect.any(String),
    }

    beforeEach(() => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      } as any)
    })

    it('should approve an expense', async () => {
      const mockBuilder = createMockQueryBuilder({ data: approvedExpense, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.approve(expenseId, true)

      expect(supabase.auth.getUser).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          approved_by: 'user-123',
          approved_at: expect.any(String),
        })
      )
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', expenseId)
      expect(result).toEqual(approvedExpense)
    })

    it('should reject an expense', async () => {
      const rejectedExpense = { ...approvedExpense, status: 'rejected' }
      const mockBuilder = createMockQueryBuilder({ data: rejectedExpense, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.approve(expenseId, false)

      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
        })
      )
      expect(result.status).toBe('rejected')
    })

    it('should include notes when provided', async () => {
      const mockBuilder = createMockQueryBuilder({ data: approvedExpense, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.approve(expenseId, true, 'Looks good, approved')

      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Looks good, approved',
        })
      )
    })

    it('should handle null user gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
      } as any)
      const mockBuilder = createMockQueryBuilder({ data: { ...approvedExpense, approved_by: null }, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.approve(expenseId, true)

      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approved_by: null,
        })
      )
    })

    it('should throw error when approval fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Approval failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.approve(expenseId, true)).rejects.toEqual({
        message: 'Approval failed',
      })
    })
  })

  describe('markAsPaid', () => {
    const paidExpense = {
      id: 'exp-1',
      status: 'paid',
    }

    it('should mark an expense as paid', async () => {
      const mockBuilder = createMockQueryBuilder({ data: paidExpense, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.markAsPaid('exp-1')

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.update).toHaveBeenCalledWith({ status: 'paid' })
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'exp-1')
      expect(result).toEqual(paidExpense)
    })

    it('should throw error when marking as paid fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Update failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.markAsPaid('exp-1')).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })

  describe('getSummary', () => {
    const orgId = 'org-123'
    const mockExpensesData = [
      {
        id: 'exp-1',
        amount: 100,
        category: 'Utilities',
        status: 'approved',
        expense_date: '2024-01-15',
        fund_id: 'fund-1',
        funds: { id: 'fund-1', name: 'General Fund' },
      },
      {
        id: 'exp-2',
        amount: 200,
        category: 'Utilities',
        status: 'pending',
        expense_date: '2024-01-20',
        fund_id: 'fund-1',
        funds: { id: 'fund-1', name: 'General Fund' },
      },
      {
        id: 'exp-3',
        amount: 150,
        category: 'Maintenance',
        status: 'approved',
        expense_date: '2024-02-05',
        fund_id: 'fund-2',
        funds: { id: 'fund-2', name: 'Building Fund' },
      },
      {
        id: 'exp-4',
        amount: 50,
        category: null,
        status: 'paid',
        expense_date: '2024-02-10',
        fund_id: null,
        funds: null,
      },
    ]

    it('should calculate expense summary correctly', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockExpensesData, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getSummary(orgId)

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', orgId)

      // Check totals
      expect(result.totalAmount).toBe(500) // 100 + 200 + 150 + 50
      expect(result.count).toBe(4)

      // Check byCategory (sorted by amount descending)
      expect(result.byCategory).toHaveLength(3)
      expect(result.byCategory[0]).toEqual({ category: 'Utilities', amount: 300, count: 2 })
      expect(result.byCategory[1]).toEqual({ category: 'Maintenance', amount: 150, count: 1 })
      expect(result.byCategory[2]).toEqual({ category: 'Uncategorized', amount: 50, count: 1 })

      // Check byStatus
      expect(result.byStatus).toContainEqual({ status: 'approved', amount: 250, count: 2 })
      expect(result.byStatus).toContainEqual({ status: 'pending', amount: 200, count: 1 })
      expect(result.byStatus).toContainEqual({ status: 'paid', amount: 50, count: 1 })

      // Check byMonth (sorted alphabetically)
      expect(result.byMonth).toHaveLength(2)
      expect(result.byMonth[0]).toEqual({ month: '2024-01', amount: 300, count: 2 })
      expect(result.byMonth[1]).toEqual({ month: '2024-02', amount: 200, count: 2 })

      // Check byFund (sorted by amount descending)
      expect(result.byFund).toHaveLength(2)
      expect(result.byFund[0]).toEqual({ fundId: 'fund-1', fundName: 'General Fund', amount: 300, count: 2 })
      expect(result.byFund[1]).toEqual({ fundId: 'fund-2', fundName: 'Building Fund', amount: 150, count: 1 })
    })

    it('should apply date range filters', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getSummary(orgId, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(mockBuilder.gte).toHaveBeenCalledWith('expense_date', '2024-01-01')
      expect(mockBuilder.lte).toHaveBeenCalledWith('expense_date', '2024-01-31')
    })

    it('should handle empty expenses', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getSummary(orgId)

      expect(result).toEqual({
        totalAmount: 0,
        count: 0,
        byCategory: [],
        byStatus: [],
        byMonth: [],
        byFund: [],
      })
    })

    it('should handle null data', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getSummary(orgId)

      expect(result.totalAmount).toBe(0)
      expect(result.count).toBe(0)
    })

    it('should throw error when query fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Query failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.getSummary(orgId)).rejects.toEqual({ message: 'Query failed' })
    })
  })

  // ============================================================================
  // EXPENSE CATEGORIES
  // ============================================================================

  describe('getCategories', () => {
    const orgId = 'org-123'
    const mockCategories = [
      { id: 'cat-1', name: 'Utilities', organization_id: orgId, is_active: true, sort_order: 1 },
      { id: 'cat-2', name: 'Maintenance', organization_id: orgId, is_active: true, sort_order: 2 },
    ]

    it('should fetch active categories by default', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockCategories, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getCategories(orgId)

      expect(supabase.from).toHaveBeenCalledWith('expense_categories')
      expect(mockBuilder.select).toHaveBeenCalledWith('*')
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', orgId)
      expect(mockBuilder.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockBuilder.order).toHaveBeenCalledWith('sort_order')
      expect(mockBuilder.order).toHaveBeenCalledWith('name')
      expect(result).toEqual(mockCategories)
    })

    it('should fetch all categories when activeOnly is false', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockCategories, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.getCategories(orgId, false)

      // eq should only be called once (for organization_id) when activeOnly is false
      const eqCalls = mockBuilder.eq.mock.calls
      expect(eqCalls).toContainEqual(['organization_id', orgId])
      // Verify is_active filter was not applied (only org filter)
      expect(eqCalls.filter((call: any[]) => call[0] === 'is_active')).toHaveLength(0)
    })

    it('should return empty array when data is null', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getCategories(orgId)

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Query failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.getCategories(orgId)).rejects.toEqual({
        message: 'Query failed',
      })
    })
  })

  describe('getCategoryById', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Utilities',
      organization_id: 'org-123',
      is_active: true,
    }

    it('should fetch a single category by ID', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockCategory, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getCategoryById('cat-1')

      expect(supabase.from).toHaveBeenCalledWith('expense_categories')
      expect(mockBuilder.select).toHaveBeenCalledWith('*')
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'cat-1')
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockCategory)
    })

    it('should return null when category not found (PGRST116)', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getCategoryById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { code: 'OTHER', message: 'Database error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.getCategoryById('cat-1')).rejects.toEqual({
        code: 'OTHER',
        message: 'Database error',
      })
    })
  })

  describe('createCategory', () => {
    const orgId = 'org-123'
    const input = {
      name: 'New Category',
      description: 'A new expense category',
      color: '#FF5733',
      icon: 'folder',
      sort_order: 5,
    }
    const createdCategory = {
      id: 'cat-new',
      organization_id: orgId,
      ...input,
      is_active: true,
      parent_id: null,
    }

    it('should create a new category with provided values', async () => {
      const mockBuilder = createMockQueryBuilder({ data: createdCategory, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.createCategory(orgId, input)

      expect(supabase.from).toHaveBeenCalledWith('expense_categories')
      expect(mockBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          organization_id: orgId,
          name: 'New Category',
          description: 'A new expense category',
          color: '#FF5733',
          icon: 'folder',
          sort_order: 5,
          is_active: true,
          parent_id: null,
        }),
      ])
      expect(result).toEqual(createdCategory)
    })

    it('should use default values when optional fields are not provided', async () => {
      const minimalInput = { name: 'Basic Category' }
      const mockBuilder = createMockQueryBuilder({
        data: { id: 'cat-new', ...minimalInput },
        error: null,
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.createCategory(orgId, minimalInput)

      expect(mockBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          organization_id: orgId,
          name: 'Basic Category',
          description: null,
          parent_id: null,
          color: null,
          icon: null,
          sort_order: 0,
          is_active: true,
        }),
      ])
    })

    it('should throw error when creation fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Insert failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.createCategory(orgId, input)).rejects.toEqual({
        message: 'Insert failed',
      })
    })
  })

  describe('updateCategory', () => {
    const categoryId = 'cat-1'
    const updateInput = {
      name: 'Updated Category',
      color: '#00FF00',
    }
    const updatedCategory = {
      id: categoryId,
      ...updateInput,
      organization_id: 'org-123',
    }

    it('should update a category', async () => {
      const mockBuilder = createMockQueryBuilder({ data: updatedCategory, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.updateCategory(categoryId, updateInput)

      expect(supabase.from).toHaveBeenCalledWith('expense_categories')
      expect(mockBuilder.update).toHaveBeenCalledWith(updateInput)
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', categoryId)
      expect(mockBuilder.select).toHaveBeenCalled()
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(updatedCategory)
    })

    it('should throw error when update fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Update failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.updateCategory(categoryId, updateInput)).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })

  describe('deleteCategory', () => {
    it('should soft delete a category by setting is_active to false', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expensesService.deleteCategory('cat-1')

      expect(supabase.from).toHaveBeenCalledWith('expense_categories')
      expect(mockBuilder.update).toHaveBeenCalledWith({ is_active: false })
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'cat-1')
    })

    it('should throw error when delete fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Delete failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.deleteCategory('cat-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('seedDefaultCategories', () => {
    it('should call RPC function to seed default categories', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any)

      await expensesService.seedDefaultCategories('org-123')

      expect(supabase.rpc).toHaveBeenCalledWith('seed_default_expense_categories', {
        p_organization_id: 'org-123',
      })
    })

    it('should throw error when RPC fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      } as any)

      await expect(expensesService.seedDefaultCategories('org-123')).rejects.toEqual({
        message: 'RPC failed',
      })
    })
  })

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('getUsedCategories', () => {
    const orgId = 'org-123'
    const mockData = [
      { category: 'Utilities' },
      { category: 'Maintenance' },
      { category: 'Utilities' }, // duplicate
      { category: 'Supplies' },
    ]

    it('should return unique sorted categories', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getUsedCategories(orgId)

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.select).toHaveBeenCalledWith('category')
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', orgId)
      expect(mockBuilder.not).toHaveBeenCalledWith('category', 'is', null)

      // Should return unique categories, sorted alphabetically
      expect(result).toEqual(['Maintenance', 'Supplies', 'Utilities'])
    })

    it('should handle empty data', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getUsedCategories(orgId)

      expect(result).toEqual([])
    })

    it('should handle null data', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getUsedCategories(orgId)

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Query failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.getUsedCategories(orgId)).rejects.toEqual({
        message: 'Query failed',
      })
    })
  })

  describe('getUsedVendors', () => {
    const orgId = 'org-123'
    const mockData = [
      { vendor: 'Office Depot' },
      { vendor: 'ACME Corp' },
      { vendor: 'Office Depot' }, // duplicate
      { vendor: 'Home Depot' },
    ]

    it('should return unique sorted vendors', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getUsedVendors(orgId)

      expect(supabase.from).toHaveBeenCalledWith('expenses')
      expect(mockBuilder.select).toHaveBeenCalledWith('vendor')
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', orgId)
      expect(mockBuilder.not).toHaveBeenCalledWith('vendor', 'is', null)

      // Should return unique vendors, sorted alphabetically
      expect(result).toEqual(['ACME Corp', 'Home Depot', 'Office Depot'])
    })

    it('should handle empty data', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getUsedVendors(orgId)

      expect(result).toEqual([])
    })

    it('should handle null data', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await expensesService.getUsedVendors(orgId)

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Query failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(expensesService.getUsedVendors(orgId)).rejects.toEqual({
        message: 'Query failed',
      })
    })
  })
})
