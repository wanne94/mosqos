/**
 * Expenses module types
 */

/**
 * Expense status values
 */
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled'

/**
 * Payment method values
 */
export type ExpensePaymentMethod = 'cash' | 'check' | 'card' | 'bank_transfer' | 'online' | 'other'

/**
 * Expense record from database
 */
export interface Expense {
  id: string
  organization_id: string
  fund_id: string | null
  amount: number
  currency: string
  expense_date: string
  category: string | null
  description: string | null
  vendor: string | null
  vendor_contact: string | null
  payment_method: ExpensePaymentMethod | null
  check_number: string | null
  reference_number: string | null
  receipt_url: string | null
  receipt_date: string | null
  status: ExpenseStatus
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  service_case_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

/**
 * Expense with related data
 */
export interface ExpenseWithRelations extends Expense {
  funds?: {
    id: string
    name: string
  } | null
  expense_categories?: {
    id: string
    name: string
    color: string | null
  } | null
  approved_by_user?: {
    email: string
  } | null
}

/**
 * Expense category record
 */
export interface ExpenseCategory {
  id: string
  organization_id: string
  name: string
  description: string | null
  parent_id: string | null
  color: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Expense filters for querying
 */
export interface ExpenseFilters {
  fundId?: string
  category?: string
  categoryId?: string
  status?: ExpenseStatus
  paymentMethod?: ExpensePaymentMethod
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  vendor?: string
  searchTerm?: string
}

/**
 * Input for creating a new expense
 */
export interface CreateExpenseInput {
  fund_id?: string | null
  amount: number
  currency?: string
  expense_date?: string
  category?: string | null
  description?: string | null
  vendor?: string | null
  vendor_contact?: string | null
  payment_method?: ExpensePaymentMethod | null
  check_number?: string | null
  reference_number?: string | null
  receipt_url?: string | null
  receipt_date?: string | null
  status?: ExpenseStatus
  notes?: string | null
  service_case_id?: string | null
}

/**
 * Input for updating an expense
 */
export interface UpdateExpenseInput {
  fund_id?: string | null
  amount?: number
  currency?: string
  expense_date?: string
  category?: string | null
  description?: string | null
  vendor?: string | null
  vendor_contact?: string | null
  payment_method?: ExpensePaymentMethod | null
  check_number?: string | null
  reference_number?: string | null
  receipt_url?: string | null
  receipt_date?: string | null
  status?: ExpenseStatus
  notes?: string | null
  service_case_id?: string | null
}

/**
 * Input for creating a new expense category
 */
export interface CreateExpenseCategoryInput {
  name: string
  description?: string | null
  parent_id?: string | null
  color?: string | null
  icon?: string | null
  sort_order?: number
}

/**
 * Input for updating an expense category
 */
export interface UpdateExpenseCategoryInput {
  name?: string
  description?: string | null
  parent_id?: string | null
  color?: string | null
  icon?: string | null
  sort_order?: number
  is_active?: boolean
}

/**
 * Expense summary statistics
 */
export interface ExpenseSummary {
  totalAmount: number
  count: number
  byCategory: {
    category: string
    amount: number
    count: number
  }[]
  byStatus: {
    status: ExpenseStatus
    amount: number
    count: number
  }[]
  byMonth: {
    month: string
    amount: number
    count: number
  }[]
  byFund: {
    fundId: string
    fundName: string
    amount: number
    count: number
  }[]
}

/**
 * Expense approval input
 */
export interface ApproveExpenseInput {
  expenseId: string
  approved: boolean
  notes?: string
}
