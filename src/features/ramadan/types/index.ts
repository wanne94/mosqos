/**
 * Ramadan Module Types
 */

export interface RamadanSettings {
  id: string
  organization_id: string
  hijri_year: number
  start_date: string | null
  end_date: string | null
  suhoor_time: string | null
  iftar_time: string | null
  is_active: boolean
  taraweeh_time: string | null
  taraweeh_rakats: number
  created_at: string
  updated_at: string
}

export interface CreateRamadanSettingsInput {
  hijri_year: number
  start_date?: string
  end_date?: string
  suhoor_time?: string
  iftar_time?: string
  is_active?: boolean
  taraweeh_time?: string
  taraweeh_rakats?: number
}

export interface UpdateRamadanSettingsInput {
  start_date?: string
  end_date?: string
  suhoor_time?: string
  iftar_time?: string
  is_active?: boolean
  taraweeh_time?: string
  taraweeh_rakats?: number
}

// Zakat Types
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

export interface ZakatCalculationResult {
  total_assets: number
  total_liabilities: number
  net_zakatable: number
  nisab_threshold: number
  is_zakat_due: boolean
  zakat_amount: number
}

export interface ZakatCalculationHistory {
  id: string
  organization_id: string
  person_id: string | null
  calculation_date: string
  nisab_value: number
  total_assets: ZakatAssets
  total_liabilities: ZakatLiabilities
  zakat_amount: number
  currency: string
  created_at: string
  person?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface NisabValues {
  gold_per_gram_usd: number
  silver_per_gram_usd: number
  nisab_gold_grams: number
  nisab_silver_grams: number
  nisab_gold_usd: number
  nisab_silver_usd: number
  updated_at: string
}

// Schedule Types
export interface IftarEvent {
  id: string
  title: string
  date: string
  time: string
  location?: string
  capacity?: number
  rsvp_count: number
}

export interface TaraweehSchedule {
  id: string
  date: string
  imam_name?: string
  juz_number: number
  start_time: string
  notes?: string
}

// Dashboard Types
export interface RamadanDashboardData {
  settings: RamadanSettings | null
  daysRemaining: number
  currentDay: number
  totalDays: number
  upcomingIftars: IftarEvent[]
  todaySchedule: {
    suhoor: string | null
    iftar: string | null
    taraweeh: string | null
  }
  zakatCollected: number
  zakatGoal: number
}
