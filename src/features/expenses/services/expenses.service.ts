import { supabase } from '@/lib/supabase/client'
import type {
  Expense,
  ExpenseWithRelations,
  ExpenseCategory,
  ExpenseFilters,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  ExpenseSummary,
  ExpenseStatus,
} from '../types/expenses.types'

const EXPENSES_TABLE = 'expenses'
const EXPENSE_CATEGORIES_TABLE = 'expense_categories'

export const expensesService = {
  // ============================================================================
  // EXPENSES
  // ============================================================================

  /**
   * Get all expenses for an organization with optional filters
   */
  async getAll(organizationId: string, filters?: ExpenseFilters): Promise<ExpenseWithRelations[]> {
    let query = supabase
      .from(EXPENSES_TABLE)
      .select(`
        *,
        funds:fund_id(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('expense_date', { ascending: false })

    // Apply filters
    if (filters?.fundId) {
      query = query.eq('fund_id', filters.fundId)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod)
    }

    if (filters?.startDate) {
      query = query.gte('expense_date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('expense_date', filters.endDate)
    }

    if (filters?.minAmount !== undefined) {
      query = query.gte('amount', filters.minAmount)
    }

    if (filters?.maxAmount !== undefined) {
      query = query.lte('amount', filters.maxAmount)
    }

    if (filters?.vendor) {
      query = query.ilike('vendor', `%${filters.vendor}%`)
    }

    if (filters?.searchTerm) {
      const search = `%${filters.searchTerm}%`
      query = query.or(`description.ilike.${search},vendor.ilike.${search},category.ilike.${search},reference_number.ilike.${search}`)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as ExpenseWithRelations[]
  },

  /**
   * Get a single expense by ID
   */
  async getById(id: string): Promise<ExpenseWithRelations | null> {
    const { data, error } = await supabase
      .from(EXPENSES_TABLE)
      .select(`
        *,
        funds:fund_id(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data as ExpenseWithRelations
  },

  /**
   * Create a new expense
   */
  async create(organizationId: string, input: CreateExpenseInput): Promise<Expense> {
    const { data, error } = await supabase
      .from(EXPENSES_TABLE)
      .insert([{
        organization_id: organizationId,
        fund_id: input.fund_id || null,
        amount: input.amount,
        currency: input.currency || 'USD',
        expense_date: input.expense_date || new Date().toISOString().split('T')[0],
        category: input.category || null,
        description: input.description || null,
        vendor: input.vendor || null,
        vendor_contact: input.vendor_contact || null,
        payment_method: input.payment_method || null,
        check_number: input.check_number || null,
        reference_number: input.reference_number || null,
        receipt_url: input.receipt_url || null,
        receipt_date: input.receipt_date || null,
        status: input.status || 'pending',
        notes: input.notes || null,
        service_case_id: input.service_case_id || null,
      }])
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  /**
   * Update an expense
   */
  async update(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const { data, error } = await supabase
      .from(EXPENSES_TABLE)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  /**
   * Delete an expense
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(EXPENSES_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Approve or reject an expense
   */
  async approve(id: string, approved: boolean, notes?: string): Promise<Expense> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const updateData: Partial<Expense> = {
      status: approved ? 'approved' : 'rejected',
      approved_at: new Date().toISOString(),
      approved_by: user?.id || null,
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from(EXPENSES_TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  /**
   * Mark expense as paid
   */
  async markAsPaid(id: string): Promise<Expense> {
    const { data, error } = await supabase
      .from(EXPENSES_TABLE)
      .update({ status: 'paid' as ExpenseStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  /**
   * Get expense summary/statistics
   */
  async getSummary(
    organizationId: string,
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<ExpenseSummary> {
    let query = supabase
      .from(EXPENSES_TABLE)
      .select(`
        id,
        amount,
        category,
        status,
        expense_date,
        fund_id,
        funds:fund_id(id, name)
      `)
      .eq('organization_id', organizationId)

    if (dateRange?.startDate) {
      query = query.gte('expense_date', dateRange.startDate)
    }

    if (dateRange?.endDate) {
      query = query.lte('expense_date', dateRange.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const expenses = (data || []) as any[]

    // Calculate totals
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const count = expenses.length

    // Group by category
    const byCategoryMap: Record<string, { category: string; amount: number; count: number }> = {}
    for (const e of expenses) {
      const cat = e.category || 'Uncategorized'
      if (!byCategoryMap[cat]) {
        byCategoryMap[cat] = { category: cat, amount: 0, count: 0 }
      }
      byCategoryMap[cat].amount += e.amount || 0
      byCategoryMap[cat].count += 1
    }

    // Group by status
    const byStatusMap: Record<string, { status: ExpenseStatus; amount: number; count: number }> = {}
    for (const e of expenses) {
      if (!byStatusMap[e.status]) {
        byStatusMap[e.status] = { status: e.status, amount: 0, count: 0 }
      }
      byStatusMap[e.status].amount += e.amount || 0
      byStatusMap[e.status].count += 1
    }

    // Group by month
    const byMonthMap: Record<string, { month: string; amount: number; count: number }> = {}
    for (const e of expenses) {
      const month = e.expense_date?.substring(0, 7) || 'Unknown'
      if (!byMonthMap[month]) {
        byMonthMap[month] = { month, amount: 0, count: 0 }
      }
      byMonthMap[month].amount += e.amount || 0
      byMonthMap[month].count += 1
    }

    // Group by fund
    const byFundMap: Record<string, { fundId: string; fundName: string; amount: number; count: number }> = {}
    for (const e of expenses) {
      if (e.fund_id) {
        if (!byFundMap[e.fund_id]) {
          byFundMap[e.fund_id] = {
            fundId: e.fund_id,
            fundName: e.funds?.name || 'Unknown',
            amount: 0,
            count: 0,
          }
        }
        byFundMap[e.fund_id].amount += e.amount || 0
        byFundMap[e.fund_id].count += 1
      }
    }

    return {
      totalAmount,
      count,
      byCategory: Object.values(byCategoryMap).sort((a, b) => b.amount - a.amount),
      byStatus: Object.values(byStatusMap),
      byMonth: Object.values(byMonthMap).sort((a, b) => a.month.localeCompare(b.month)),
      byFund: Object.values(byFundMap).sort((a, b) => b.amount - a.amount),
    }
  },

  // ============================================================================
  // EXPENSE CATEGORIES
  // ============================================================================

  /**
   * Get all expense categories for an organization
   */
  async getCategories(organizationId: string, activeOnly = true): Promise<ExpenseCategory[]> {
    let query = supabase
      .from(EXPENSE_CATEGORIES_TABLE)
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order')
      .order('name')

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as ExpenseCategory[]
  },

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<ExpenseCategory | null> {
    const { data, error } = await supabase
      .from(EXPENSE_CATEGORIES_TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data as ExpenseCategory
  },

  /**
   * Create a new expense category
   */
  async createCategory(organizationId: string, input: CreateExpenseCategoryInput): Promise<ExpenseCategory> {
    const { data, error } = await supabase
      .from(EXPENSE_CATEGORIES_TABLE)
      .insert([{
        organization_id: organizationId,
        name: input.name,
        description: input.description || null,
        parent_id: input.parent_id || null,
        color: input.color || null,
        icon: input.icon || null,
        sort_order: input.sort_order || 0,
        is_active: true,
      }])
      .select()
      .single()

    if (error) throw error
    return data as ExpenseCategory
  },

  /**
   * Update an expense category
   */
  async updateCategory(id: string, input: UpdateExpenseCategoryInput): Promise<ExpenseCategory> {
    const { data, error } = await supabase
      .from(EXPENSE_CATEGORIES_TABLE)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ExpenseCategory
  },

  /**
   * Delete an expense category (soft delete by setting is_active = false)
   */
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from(EXPENSE_CATEGORIES_TABLE)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Seed default categories for a new organization
   * This calls the database function
   */
  async seedDefaultCategories(organizationId: string): Promise<void> {
    const { error } = await supabase.rpc('seed_default_expense_categories', {
      p_organization_id: organizationId,
    })

    if (error) throw error
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get distinct categories used in expenses (for filter dropdowns)
   */
  async getUsedCategories(organizationId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(EXPENSES_TABLE)
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null)

    if (error) throw error

    // Get unique categories with proper type filtering
    const categories = [...new Set(
      (data || [])
        .map(e => e.category)
        .filter((c): c is string => c !== null && c !== undefined)
    )]
    return categories.sort()
  },

  /**
   * Get distinct vendors used in expenses (for autocomplete)
   */
  async getUsedVendors(organizationId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(EXPENSES_TABLE)
      .select('vendor')
      .eq('organization_id', organizationId)
      .not('vendor', 'is', null)

    if (error) throw error

    // Get unique vendors with proper type filtering
    const vendors = [...new Set(
      (data || [])
        .map(e => e.vendor)
        .filter((v): v is string => v !== null && v !== undefined)
    )]
    return vendors.sort()
  },
}
