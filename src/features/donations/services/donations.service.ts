import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Donation,
  Fund,
  DonationFilters,
  FundFilters,
  CreateDonationInput,
  UpdateDonationInput,
  CreateFundInput,
  UpdateFundInput,
  DonationSummary,
  DonationType,
  PaymentMethod,
} from '../types/donations.types'

// Type assertion for tables with columns not in generated types
const db = supabase as SupabaseClient<any>

const DONATIONS_TABLE = 'donations'
const FUNDS_TABLE = 'funds'

export const donationsService = {
  // ============================================================================
  // DONATIONS
  // ============================================================================

  // Get all donations for an organization
  async getAll(organizationId: string, filters?: DonationFilters): Promise<Donation[]> {
    let query = db
      .from(DONATIONS_TABLE)
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name, fund_type)
      `)
      .eq('organization_id', organizationId)
      .order('donation_date', { ascending: false })

    if (filters?.search) {
      const search = `%${filters.search}%`
      query = query.or(`reference_number.ilike.${search},check_number.ilike.${search},notes.ilike.${search}`)
    }

    if (filters?.fund_id) {
      query = query.eq('fund_id', filters.fund_id)
    }

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }

    if (filters?.donation_type) {
      query = query.eq('donation_type', filters.donation_type)
    }

    if (filters?.payment_method) {
      query = query.eq('payment_method', filters.payment_method)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.date_from) {
      query = query.gte('donation_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('donation_date', filters.date_to)
    }

    if (filters?.amount_min !== undefined) {
      query = query.gte('amount', filters.amount_min)
    }

    if (filters?.amount_max !== undefined) {
      query = query.lte('amount', filters.amount_max)
    }

    if (filters?.is_anonymous !== undefined) {
      query = query.eq('is_anonymous', filters.is_anonymous)
    }

    if (filters?.is_tax_deductible !== undefined) {
      query = query.eq('is_tax_deductible', filters.is_tax_deductible)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get single donation by ID
  async getById(id: string): Promise<Donation | null> {
    const { data, error } = await db
      .from(DONATIONS_TABLE)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name, fund_type)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Create a new donation
  async create(organizationId: string, input: CreateDonationInput): Promise<Donation> {
    const { data, error } = await db
      .from(DONATIONS_TABLE)
      .insert([{
        organization_id: organizationId,
        ...input,
        status: 'completed',
        currency: input.currency || 'USD',
        is_anonymous: input.is_anonymous || false,
        is_tax_deductible: input.is_tax_deductible !== false,
      }])
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name, fund_type)
      `)
      .single()

    if (error) throw error

    // Update fund current_amount if fund_id provided
    if (input.fund_id) {
      await this.updateFundAmount(input.fund_id)
    }

    return data
  },

  // Update a donation
  async update(id: string, input: UpdateDonationInput): Promise<Donation> {
    // Get old donation to check if fund changed
    const oldDonation = await this.getById(id)
    const oldFundId = oldDonation?.fund_id

    const { data, error } = await db
      .from(DONATIONS_TABLE)
      .update(input)
      .eq('id', id)
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name, fund_type)
      `)
      .single()

    if (error) throw error

    // Update fund amounts if needed
    if (oldFundId && oldFundId !== input.fund_id) {
      await this.updateFundAmount(oldFundId)
    }
    if (input.fund_id) {
      await this.updateFundAmount(input.fund_id)
    }

    return data
  },

  // Delete a donation
  async delete(id: string): Promise<void> {
    const donation = await this.getById(id)

    const { error } = await db
      .from(DONATIONS_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error

    // Update fund amount if needed
    if (donation?.fund_id) {
      await this.updateFundAmount(donation.fund_id)
    }
  },

  // Get donations by member
  async getByMember(memberId: string): Promise<Donation[]> {
    const { data, error } = await db
      .from(DONATIONS_TABLE)
      .select(`
        *,
        fund:funds(id, name, fund_type)
      `)
      .eq('member_id', memberId)
      .order('donation_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get donation summary
  async getSummary(organizationId: string, dateRange?: { from?: string; to?: string }): Promise<DonationSummary> {
    let query = db
      .from(DONATIONS_TABLE)
      .select(`
        id, amount, donation_type, payment_method, fund_id,
        fund:funds(id, name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'completed')

    if (dateRange?.from) {
      query = query.gte('donation_date', dateRange.from)
    }
    if (dateRange?.to) {
      query = query.lte('donation_date', dateRange.to)
    }

    const { data, error } = await query

    if (error) throw error

    interface DonationSummaryRow {
      id: string
      amount: number
      donation_type: DonationType
      payment_method: PaymentMethod
      fund_id: string | null
      fund?: { id: string; name: string } | null
    }

    const donations = (data || []) as unknown as DonationSummaryRow[]
    const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0)
    const count = donations.length

    // Group by fund
    const byFundMap: Record<string, { fund_id: string; fund_name: string; amount: number; count: number }> = {}
    for (const d of donations) {
      if (d.fund_id) {
        if (!byFundMap[d.fund_id]) {
          byFundMap[d.fund_id] = {
            fund_id: d.fund_id,
            fund_name: d.fund?.name || 'Unknown',
            amount: 0,
            count: 0,
          }
        }
        byFundMap[d.fund_id].amount += d.amount || 0
        byFundMap[d.fund_id].count += 1
      }
    }

    // Group by payment method
    const byPaymentMethodMap: Record<string, { payment_method: PaymentMethod; amount: number; count: number }> = {}
    for (const d of donations) {
      if (!byPaymentMethodMap[d.payment_method]) {
        byPaymentMethodMap[d.payment_method] = {
          payment_method: d.payment_method,
          amount: 0,
          count: 0,
        }
      }
      byPaymentMethodMap[d.payment_method].amount += d.amount || 0
      byPaymentMethodMap[d.payment_method].count += 1
    }

    // Group by type
    const byTypeMap: Record<string, { donation_type: DonationType; amount: number; count: number }> = {}
    for (const d of donations) {
      if (!byTypeMap[d.donation_type]) {
        byTypeMap[d.donation_type] = {
          donation_type: d.donation_type,
          amount: 0,
          count: 0,
        }
      }
      byTypeMap[d.donation_type].amount += d.amount || 0
      byTypeMap[d.donation_type].count += 1
    }

    return {
      total_amount: totalAmount,
      donation_count: count,
      average_donation: count > 0 ? totalAmount / count : 0,
      by_fund: Object.values(byFundMap),
      by_payment_method: Object.values(byPaymentMethodMap),
      by_type: Object.values(byTypeMap),
    }
  },

  // Send donation receipt (placeholder)
  async sendReceipt(donationId: string): Promise<void> {
    const { error } = await db
      .from(DONATIONS_TABLE)
      .update({
        receipt_sent: true,
        receipt_sent_at: new Date().toISOString(),
      })
      .eq('id', donationId)

    if (error) throw error
    // TODO: Integrate with email service to actually send receipt
  },

  // ============================================================================
  // FUNDS
  // ============================================================================

  // Get all funds
  async getFunds(organizationId: string, filters?: FundFilters): Promise<Fund[]> {
    let query = db
      .from(FUNDS_TABLE)
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (filters?.search) {
      const search = `%${filters.search}%`
      query = query.or(`name.ilike.${search},description.ilike.${search}`)
    }

    if (filters?.fund_type) {
      query = query.eq('fund_type', filters.fund_type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.has_goal === true) {
      query = query.not('goal_amount', 'is', null)
    } else if (filters?.has_goal === false) {
      query = query.is('goal_amount', null)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get single fund
  async getFundById(id: string): Promise<Fund | null> {
    const { data, error } = await db
      .from(FUNDS_TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Create fund
  async createFund(organizationId: string, input: CreateFundInput): Promise<Fund> {
    const { data, error } = await db
      .from(FUNDS_TABLE)
      .insert([{
        organization_id: organizationId,
        ...input,
        current_amount: 0,
        is_active: input.is_active !== false,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update fund
  async updateFund(id: string, input: UpdateFundInput): Promise<Fund> {
    const { data, error } = await db
      .from(FUNDS_TABLE)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete fund
  async deleteFund(id: string): Promise<void> {
    const { error } = await db
      .from(FUNDS_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Update fund current amount (internal)
  async updateFundAmount(fundId: string): Promise<void> {
    const { data, error } = await db
      .from(DONATIONS_TABLE)
      .select('amount')
      .eq('fund_id', fundId)
      .eq('status', 'completed')

    if (error) throw error

    interface AmountRow {
      amount: number
    }

    const total = ((data || []) as AmountRow[]).reduce((sum, d) => sum + (d.amount || 0), 0)

    await db
      .from(FUNDS_TABLE)
      .update({ current_amount: total })
      .eq('id', fundId)
  },
}
