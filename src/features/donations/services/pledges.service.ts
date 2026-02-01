import { supabase } from '@/lib/supabase/client'
import {
  PledgeStatus,
  RecurringStatus,
} from '../types/donations.types'
import type {
  Pledge,
  RecurringDonation,
  PledgeFilters,
  RecurringDonationFilters,
  CreatePledgeInput,
  UpdatePledgeInput,
  CreateRecurringDonationInput,
  UpdateRecurringDonationInput,
} from '../types/donations.types'

const PLEDGES_TABLE = 'pledges'
const RECURRING_TABLE = 'recurring_donations'

export const pledgesService = {
  // ============================================================================
  // PLEDGES
  // ============================================================================

  // Get all pledges
  async getAll(organizationId: string, filters?: PledgeFilters): Promise<Pledge[]> {
    let query = (supabase as any)
      .from(PLEDGES_TABLE)
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('pledge_date', { ascending: false })

    if (filters?.search) {
      query = query.or(`notes.ilike.%${filters.search}%`)
    }

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }

    if (filters?.fund_id) {
      query = query.eq('fund_id', filters.fund_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.date_from) {
      query = query.gte('pledge_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('pledge_date', filters.date_to)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get single pledge
  async getById(id: string): Promise<Pledge | null> {
    const { data, error } = await (supabase as any)
      .from(PLEDGES_TABLE)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name),
        payments:donations(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Create pledge
  async create(organizationId: string, input: CreatePledgeInput): Promise<Pledge> {
    const { data, error } = await (supabase as any)
      .from(PLEDGES_TABLE)
      .insert([{
        organization_id: organizationId,
        ...input,
        paid_amount: 0,
        currency: input.currency || 'USD',
        status: 'active',
      }])
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Update pledge
  async update(id: string, input: UpdatePledgeInput): Promise<Pledge> {
    const { data, error } = await (supabase as any)
      .from(PLEDGES_TABLE)
      .update(input)
      .eq('id', id)
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Delete pledge
  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from(PLEDGES_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Record pledge payment
  async recordPayment(pledgeId: string, amount: number): Promise<Pledge> {
    const pledge = await this.getById(pledgeId)
    if (!pledge) throw new Error('Pledge not found')

    const newPaidAmount = pledge.paid_amount + amount
    const newStatus = newPaidAmount >= pledge.total_amount ? PledgeStatus.COMPLETED : PledgeStatus.ACTIVE

    return this.update(pledgeId, {
      status: newStatus,
    })
  },

  // Get pledges by member
  async getByMember(memberId: string): Promise<Pledge[]> {
    const { data, error } = await (supabase as any)
      .from(PLEDGES_TABLE)
      .select(`
        *,
        fund:funds(id, name)
      `)
      .eq('member_id', memberId)
      .order('pledge_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get overdue pledges
  async getOverdue(organizationId: string): Promise<Pledge[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await (supabase as any)
      .from(PLEDGES_TABLE)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  // ============================================================================
  // RECURRING DONATIONS
  // ============================================================================

  // Get all recurring donations
  async getRecurringDonations(organizationId: string, filters?: RecurringDonationFilters): Promise<RecurringDonation[]> {
    let query = (supabase as any)
      .from(RECURRING_TABLE)
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`notes.ilike.%${filters.search}%`)
    }

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }

    if (filters?.fund_id) {
      query = query.eq('fund_id', filters.fund_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.frequency) {
      query = query.eq('frequency', filters.frequency)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get single recurring donation
  async getRecurringById(id: string): Promise<RecurringDonation | null> {
    const { data, error } = await (supabase as any)
      .from(RECURRING_TABLE)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Create recurring donation
  async createRecurring(organizationId: string, input: CreateRecurringDonationInput): Promise<RecurringDonation> {
    const { data, error } = await (supabase as any)
      .from(RECURRING_TABLE)
      .insert([{
        organization_id: organizationId,
        ...input,
        status: 'active',
        currency: input.currency || 'USD',
        total_donated: 0,
        donation_count: 0,
        next_payment_date: input.start_date,
      }])
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Update recurring donation
  async updateRecurring(id: string, input: UpdateRecurringDonationInput): Promise<RecurringDonation> {
    const { data, error } = await (supabase as any)
      .from(RECURRING_TABLE)
      .update(input)
      .eq('id', id)
      .select(`
        *,
        member:members(id, first_name, last_name, email),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Cancel recurring donation
  async cancelRecurring(id: string): Promise<RecurringDonation> {
    return this.updateRecurring(id, { status: RecurringStatus.CANCELLED })
  },

  // Pause recurring donation
  async pauseRecurring(id: string): Promise<RecurringDonation> {
    return this.updateRecurring(id, { status: RecurringStatus.PAUSED })
  },

  // Resume recurring donation
  async resumeRecurring(id: string): Promise<RecurringDonation> {
    return this.updateRecurring(id, { status: RecurringStatus.ACTIVE })
  },

  // Get recurring donations by member
  async getRecurringByMember(memberId: string): Promise<RecurringDonation[]> {
    const { data, error } = await (supabase as any)
      .from(RECURRING_TABLE)
      .select(`
        *,
        fund:funds(id, name)
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
}
