// Donation Types for MosqOS

// ============================================================================
// ENUMS
// ============================================================================

export enum DonationType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  PLEDGE_PAYMENT = 'pledge_payment',
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum DonationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PledgeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum RecurringFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

export enum RecurringStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum FundType {
  GENERAL = 'general',
  ZAKAT = 'zakat',
  SADAQAH = 'sadaqah',
  BUILDING = 'building',
  EDUCATION = 'education',
  EMERGENCY = 'emergency',
  CHARITY = 'charity',
  SPECIAL = 'special',
}

export enum TransactionMatchStatus {
  UNMATCHED = 'unmatched',
  MATCHED = 'matched',
  IGNORED = 'ignored',
  MANUALLY_CREATED = 'manually_created',
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Fund {
  id: string
  organization_id: string
  name: string
  description: string | null
  fund_type: FundType
  goal_amount: number | null
  current_amount: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface Donation {
  id: string
  organization_id: string
  member_id: string | null
  fund_id: string | null
  pledge_id: string | null
  recurring_donation_id: string | null
  amount: number
  currency: string
  donation_type: DonationType
  payment_method: PaymentMethod
  status: DonationStatus
  donation_date: string
  reference_number: string | null
  check_number: string | null
  transaction_id: string | null
  bank_transaction_id: string | null
  notes: string | null
  is_anonymous: boolean
  is_tax_deductible: boolean
  receipt_sent: boolean
  receipt_sent_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  }
  fund?: {
    id: string
    name: string
    fund_type: FundType
  }
}

export interface RecurringDonation {
  id: string
  organization_id: string
  member_id: string
  fund_id: string | null
  amount: number
  currency: string
  frequency: RecurringFrequency
  payment_method: PaymentMethod
  status: RecurringStatus
  start_date: string
  end_date: string | null
  next_payment_date: string | null
  last_payment_date: string | null
  total_donated: number
  donation_count: number
  stripe_subscription_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  }
  fund?: {
    id: string
    name: string
  }
}

export interface Pledge {
  id: string
  organization_id: string
  member_id: string
  fund_id: string | null
  total_amount: number
  paid_amount: number
  currency: string
  status: PledgeStatus
  pledge_date: string
  due_date: string | null
  payment_schedule: PaymentScheduleItem[] | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  }
  fund?: {
    id: string
    name: string
  }
  payments?: Donation[]
}

export interface PaymentScheduleItem {
  due_date: string
  amount: number
  paid: boolean
  paid_date?: string
  donation_id?: string
}

export interface BankTransaction {
  id: string
  organization_id: string
  bank_account_id: string | null
  transaction_date: string
  description: string
  amount: number
  transaction_type: 'credit' | 'debit'
  reference: string | null
  match_status: TransactionMatchStatus
  matched_donation_id: string | null
  imported_at: string
  raw_data: Record<string, unknown> | null
  // Joined fields
  matched_donation?: Donation
}

export interface DonorProfile {
  member_id: string
  member: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  }
  total_donated: number
  donation_count: number
  first_donation_date: string | null
  last_donation_date: string | null
  average_donation: number
  largest_donation: number
  preferred_fund: string | null
  preferred_payment_method: PaymentMethod | null
  active_recurring_donations: number
  active_pledges: number
  pending_pledge_amount: number
  donations: Donation[]
  recurring_donations: RecurringDonation[]
  pledges: Pledge[]
}

// ============================================================================
// ZAKAT INTERFACES
// ============================================================================

export interface ZakatAssets {
  cash_on_hand: number
  bank_balances: number
  gold_value: number
  silver_value: number
  investments: number
  business_inventory: number
  receivables: number
  other_assets: number
}

export interface ZakatLiabilities {
  debts: number
  bills_due: number
  loans: number
  other_liabilities: number
}

export interface ZakatCalculation {
  assets: ZakatAssets
  liabilities: ZakatLiabilities
  total_assets: number
  total_liabilities: number
  net_zakatable: number
  nisab_gold: number
  nisab_silver: number
  zakat_due: number
  is_zakat_due: boolean
  calculation_date: string
}

// ============================================================================
// FILTER & INPUT TYPES
// ============================================================================

export interface DonationFilters {
  search?: string
  fund_id?: string
  member_id?: string
  donation_type?: DonationType
  payment_method?: PaymentMethod
  status?: DonationStatus
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  is_anonymous?: boolean
  is_tax_deductible?: boolean
}

export interface FundFilters {
  search?: string
  fund_type?: FundType
  is_active?: boolean
  has_goal?: boolean
}

export interface PledgeFilters {
  search?: string
  member_id?: string
  fund_id?: string
  status?: PledgeStatus
  date_from?: string
  date_to?: string
}

export interface RecurringDonationFilters {
  search?: string
  member_id?: string
  fund_id?: string
  status?: RecurringStatus
  frequency?: RecurringFrequency
}

export interface BankTransactionFilters {
  date_from?: string
  date_to?: string
  match_status?: TransactionMatchStatus
  transaction_type?: 'credit' | 'debit'
  amount_min?: number
  amount_max?: number
}

export interface CreateDonationInput {
  member_id?: string | null
  fund_id?: string | null
  pledge_id?: string | null
  recurring_donation_id?: string | null
  amount: number
  currency?: string
  donation_type: DonationType
  payment_method: PaymentMethod
  donation_date: string
  reference_number?: string
  check_number?: string
  transaction_id?: string
  notes?: string
  is_anonymous?: boolean
  is_tax_deductible?: boolean
}

export interface UpdateDonationInput {
  member_id?: string | null
  fund_id?: string | null
  amount?: number
  donation_type?: DonationType
  payment_method?: PaymentMethod
  status?: DonationStatus
  donation_date?: string
  reference_number?: string | null
  check_number?: string | null
  notes?: string | null
  is_anonymous?: boolean
  is_tax_deductible?: boolean
}

export interface CreateFundInput {
  name: string
  description?: string
  fund_type: FundType
  goal_amount?: number | null
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
}

export interface UpdateFundInput {
  name?: string
  description?: string | null
  fund_type?: FundType
  goal_amount?: number | null
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
}

export interface CreatePledgeInput {
  member_id: string
  fund_id?: string | null
  total_amount: number
  currency?: string
  pledge_date: string
  due_date?: string | null
  payment_schedule?: PaymentScheduleItem[] | null
  notes?: string
}

export interface UpdatePledgeInput {
  fund_id?: string | null
  total_amount?: number
  status?: PledgeStatus
  due_date?: string | null
  payment_schedule?: PaymentScheduleItem[] | null
  notes?: string | null
}

export interface CreateRecurringDonationInput {
  member_id: string
  fund_id?: string | null
  amount: number
  currency?: string
  frequency: RecurringFrequency
  payment_method: PaymentMethod
  start_date: string
  end_date?: string | null
  notes?: string
}

export interface UpdateRecurringDonationInput {
  fund_id?: string | null
  amount?: number
  frequency?: RecurringFrequency
  status?: RecurringStatus
  end_date?: string | null
  notes?: string | null
}

export interface BankStatementImportInput {
  bank_account_id?: string
  file_format: 'csv' | 'ofx' | 'qif'
  file_content: string
  date_format?: string
}

export interface MatchDonationInput {
  bank_transaction_id: string
  donation_id: string
}

export interface CreateDonationFromTransactionInput {
  bank_transaction_id: string
  member_id?: string | null
  fund_id?: string | null
  donation_type?: DonationType
  is_anonymous?: boolean
  is_tax_deductible?: boolean
  notes?: string
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface DonationSummary {
  total_amount: number
  donation_count: number
  average_donation: number
  by_fund: {
    fund_id: string
    fund_name: string
    amount: number
    count: number
  }[]
  by_payment_method: {
    payment_method: PaymentMethod
    amount: number
    count: number
  }[]
  by_type: {
    donation_type: DonationType
    amount: number
    count: number
  }[]
}

export interface DonationTrend {
  period: string
  amount: number
  count: number
}

export interface FundReport {
  fund_id: string
  fund_name: string
  fund_type: FundType
  goal_amount: number | null
  current_amount: number
  progress_percentage: number
  donation_count: number
  donor_count: number
  average_donation: number
  largest_donation: number
  trend: DonationTrend[]
}

export interface DonorReport {
  total_donors: number
  new_donors: number
  returning_donors: number
  lapsed_donors: number
  top_donors: {
    member_id: string
    member_name: string
    total_amount: number
    donation_count: number
  }[]
  donor_retention_rate: number
}

export interface FinancialReport {
  period_start: string
  period_end: string
  summary: DonationSummary
  trends: DonationTrend[]
  fund_reports: FundReport[]
  donor_report: DonorReport
  year_over_year_growth: number
  month_over_month_growth: number
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
