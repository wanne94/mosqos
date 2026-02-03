/**
 * Zakat Calculator Service
 * Handles Zakat calculations and history
 */

import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ZakatAssets,
  ZakatLiabilities,
  ZakatCalculationResult,
  ZakatCalculationHistory,
  NisabValues,
} from '../types'

const db = supabase as SupabaseClient<any>

// Nisab thresholds (in grams)
const NISAB_GOLD_GRAMS = 87.48 // 7.5 tola = 87.48 grams
const NISAB_SILVER_GRAMS = 612.36 // 52.5 tola = 612.36 grams

// Default gold/silver prices (USD per gram) - should be updated regularly
const DEFAULT_GOLD_PRICE = 65.0 // ~$65/gram
const DEFAULT_SILVER_PRICE = 0.80 // ~$0.80/gram

// Zakat rate
const ZAKAT_RATE = 0.025 // 2.5%

export const zakatService = {
  /**
   * Get current Nisab values
   * In production, this should fetch live gold/silver prices
   */
  async getNisabValues(currency: string = 'USD'): Promise<NisabValues> {
    // TODO: Integrate with a live metals API
    const goldPrice = DEFAULT_GOLD_PRICE
    const silverPrice = DEFAULT_SILVER_PRICE

    return {
      gold_per_gram_usd: goldPrice,
      silver_per_gram_usd: silverPrice,
      nisab_gold_grams: NISAB_GOLD_GRAMS,
      nisab_silver_grams: NISAB_SILVER_GRAMS,
      nisab_gold_usd: goldPrice * NISAB_GOLD_GRAMS,
      nisab_silver_usd: silverPrice * NISAB_SILVER_GRAMS,
      updated_at: new Date().toISOString(),
    }
  },

  /**
   * Calculate Zakat based on assets and liabilities
   */
  calculateZakat(
    assets: ZakatAssets,
    liabilities: ZakatLiabilities,
    nisabThreshold: number
  ): ZakatCalculationResult {
    // Calculate total assets
    const totalAssets =
      (assets.cash_on_hand || 0) +
      (assets.bank_balances || 0) +
      (assets.gold_value || 0) +
      (assets.silver_value || 0) +
      (assets.investments || 0) +
      (assets.business_inventory || 0) +
      (assets.receivables || 0) +
      (assets.other_assets || 0)

    // Calculate total liabilities
    const totalLiabilities =
      (liabilities.debts || 0) +
      (liabilities.bills_due || 0) +
      (liabilities.loans || 0) +
      (liabilities.other_liabilities || 0)

    // Net zakatable wealth
    const netZakatable = totalAssets - totalLiabilities

    // Check if above Nisab
    const isZakatDue = netZakatable >= nisabThreshold

    // Calculate Zakat amount (2.5% of net zakatable wealth)
    const zakatAmount = isZakatDue ? netZakatable * ZAKAT_RATE : 0

    return {
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_zakatable: netZakatable,
      nisab_threshold: nisabThreshold,
      is_zakat_due: isZakatDue,
      zakat_amount: Math.round(zakatAmount * 100) / 100, // Round to 2 decimal places
    }
  },

  /**
   * Save Zakat calculation to history
   */
  async saveCalculation(
    organizationId: string,
    personId: string | null,
    assets: ZakatAssets,
    liabilities: ZakatLiabilities,
    result: ZakatCalculationResult,
    currency: string = 'USD'
  ): Promise<ZakatCalculationHistory> {
    const { data, error } = await db
      .from('zakat_calculations')
      .insert([{
        organization_id: organizationId,
        person_id: personId,
        calculation_date: new Date().toISOString().split('T')[0],
        nisab_value: result.nisab_threshold,
        total_assets: assets,
        total_liabilities: liabilities,
        zakat_amount: result.zakat_amount,
        currency,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get calculation history for an organization
   */
  async getCalculationHistory(
    organizationId: string,
    limit = 20
  ): Promise<ZakatCalculationHistory[]> {
    const { data, error } = await db
      .from('zakat_calculations')
      .select(`
        *,
        person:members(id, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('calculation_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching zakat history:', error)
      return []
    }

    return data || []
  },

  /**
   * Get calculation history for a specific person
   */
  async getPersonCalculations(personId: string): Promise<ZakatCalculationHistory[]> {
    const { data, error } = await db
      .from('zakat_calculations')
      .select('*')
      .eq('person_id', personId)
      .order('calculation_date', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching person zakat history:', error)
      return []
    }

    return data || []
  },

  /**
   * Get Zakat collection stats for an organization
   */
  async getZakatStats(organizationId: string, year?: number): Promise<{
    totalCollected: number
    totalDisbursed: number
    recipientCount: number
  }> {
    const currentYear = year || new Date().getFullYear()
    const startDate = `${currentYear}-01-01`
    const endDate = `${currentYear}-12-31`

    // Get Zakat fund donations
    const { data: donations, error: donationsError } = await db
      .from('donations')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('donation_date', startDate)
      .lte('donation_date', endDate)
      .eq('status', 'completed')
      .in('fund_id', (
        await db
          .from('funds')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('fund_type', 'zakat')
      ).data?.map((f: any) => f.id) || [])

    if (donationsError) {
      console.error('Error fetching zakat donations:', donationsError)
    }

    // Get disbursements from cases with Zakat fund
    const { data: disbursements, error: disbursementsError } = await db
      .from('service_cases')
      .select('disbursed_amount')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('status', ['resolved', 'closed'])
      .in('fund_id', (
        await db
          .from('funds')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('fund_type', 'zakat')
      ).data?.map((f: any) => f.id) || [])

    if (disbursementsError) {
      console.error('Error fetching zakat disbursements:', disbursementsError)
    }

    const totalCollected = (donations || []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
    const totalDisbursed = (disbursements || []).reduce((sum: number, d: any) => sum + (d.disbursed_amount || 0), 0)
    const recipientCount = (disbursements || []).length

    return {
      totalCollected,
      totalDisbursed,
      recipientCount,
    }
  },
}
