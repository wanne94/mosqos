import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  PaymentStatus,
  ProcessingStatus,
} from '../types/qurbani.types'
import type {
  QurbaniCampaign,
  QurbaniShare,
  CreateCampaignInput,
  UpdateCampaignInput,
  CreateShareInput,
  UpdateShareInput,
  RecordPaymentInput,
  CampaignFilters,
  ShareFilters,
  CampaignStats,
  AnimalType,
  DistributionType,
} from '../types/qurbani.types'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

// Helper type for share stats query
interface ShareStatsRow {
  animal_type: string
  quantity: number
  total_amount: number
  amount_paid: number
  distribution_type: string
  payment_status: string
  processing_status: string
  status: string
}

/**
 * Qurbani service for campaign and share management
 */
export const qurbaniService = {
  // =========================================================================
  // CAMPAIGNS
  // =========================================================================

  /**
   * Get all campaigns with optional filters
   */
  async getCampaigns(
    organizationId: string,
    filters?: CampaignFilters
  ): Promise<QurbaniCampaign[]> {
    let query = db
      .from('qurbani_campaigns')
      .select('*')
      .eq('organization_id', organizationId)

    if (filters?.year) {
      query = query.eq('year', filters.year)
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query.order('year', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as QurbaniCampaign[]
  },

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string): Promise<QurbaniCampaign | null> {
    const { data, error } = await db
      .from('qurbani_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as QurbaniCampaign
  },

  /**
   * Create a new campaign
   */
  async createCampaign(
    organizationId: string,
    input: CreateCampaignInput
  ): Promise<QurbaniCampaign> {
    const { data, error } = await db
      .from('qurbani_campaigns')
      .insert({
        organization_id: organizationId,
        ...input,
      } as never)
      .select()
      .single()

    if (error) throw error
    return data as unknown as QurbaniCampaign
  },

  /**
   * Update a campaign
   */
  async updateCampaign(
    campaignId: string,
    input: UpdateCampaignInput
  ): Promise<QurbaniCampaign> {
    const { data, error } = await db
      .from('qurbani_campaigns')
      .update(input as never)
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as QurbaniCampaign
  },

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    const { error } = await db
      .from('qurbani_campaigns')
      .delete()
      .eq('id', campaignId)

    if (error) throw error
  },

  // =========================================================================
  // SHARES
  // =========================================================================

  /**
   * Get all shares with optional filters
   */
  async getShares(
    organizationId: string,
    filters?: ShareFilters
  ): Promise<QurbaniShare[]> {
    let query = db
      .from('qurbani_shares')
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name,
          contact_email,
          contact_phone
        )
      `)
      .eq('organization_id', organizationId)

    if (filters?.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id)
    }

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }

    if (filters?.animal_type) {
      if (Array.isArray(filters.animal_type)) {
        query = query.in('animal_type', filters.animal_type)
      } else {
        query = query.eq('animal_type', filters.animal_type)
      }
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters?.payment_status) {
      if (Array.isArray(filters.payment_status)) {
        query = query.in('payment_status', filters.payment_status)
      } else {
        query = query.eq('payment_status', filters.payment_status)
      }
    }

    if (filters?.processing_status) {
      if (Array.isArray(filters.processing_status)) {
        query = query.in('processing_status', filters.processing_status)
      } else {
        query = query.eq('processing_status', filters.processing_status)
      }
    }

    if (filters?.distribution_type) {
      if (Array.isArray(filters.distribution_type)) {
        query = query.in('distribution_type', filters.distribution_type)
      } else {
        query = query.eq('distribution_type', filters.distribution_type)
      }
    }

    if (filters?.pickup_date) {
      query = query.eq('pickup_date', filters.pickup_date)
    }

    if (filters?.has_balance) {
      query = query.gt('balance_due', 0)
    }

    if (filters?.search) {
      query = query.or(`guest_name.ilike.%${filters.search}%,share_number.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as QurbaniShare[]
  },

  /**
   * Get a single share by ID
   */
  async getShare(shareId: string): Promise<QurbaniShare | null> {
    const { data, error } = await db
      .from('qurbani_shares')
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name,
          contact_email,
          contact_phone
        ),
        campaign:campaign_id (*)
      `)
      .eq('id', shareId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as QurbaniShare
  },

  /**
   * Create a new share
   */
  async createShare(
    organizationId: string,
    input: CreateShareInput
  ): Promise<QurbaniShare> {
    const paymentStatus: PaymentStatus = input.amount_paid && input.amount_paid >= input.total_amount
      ? PaymentStatus.PAID
      : input.amount_paid && input.amount_paid > 0
      ? PaymentStatus.PARTIAL
      : PaymentStatus.PENDING

    const { data, error } = await db
      .from('qurbani_shares')
      .insert({
        organization_id: organizationId,
        ...input,
        payment_status: paymentStatus,
      } as never)
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name,
          contact_email,
          contact_phone
        )
      `)
      .single()

    if (error) throw error
    return data as unknown as QurbaniShare
  },

  /**
   * Update a share
   */
  async updateShare(
    shareId: string,
    input: UpdateShareInput
  ): Promise<QurbaniShare> {
    const { data, error } = await db
      .from('qurbani_shares')
      .update(input as never)
      .eq('id', shareId)
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name,
          contact_email,
          contact_phone
        )
      `)
      .single()

    if (error) throw error
    return data as unknown as QurbaniShare
  },

  /**
   * Delete a share
   */
  async deleteShare(shareId: string): Promise<void> {
    const { error } = await db
      .from('qurbani_shares')
      .delete()
      .eq('id', shareId)

    if (error) throw error
  },

  /**
   * Record a payment for a share
   */
  async recordPayment(
    _organizationId: string,
    input: RecordPaymentInput
  ): Promise<QurbaniShare> {
    // First get the current share
    const share = await this.getShare(input.share_id)
    if (!share) throw new Error('Share not found')

    const newAmountPaid = share.amount_paid + input.amount
    const newPaymentStatus: PaymentStatus =
      newAmountPaid >= share.total_amount ? PaymentStatus.PAID : PaymentStatus.PARTIAL

    return this.updateShare(input.share_id, {
      amount_paid: newAmountPaid,
      payment_status: newPaymentStatus,
      payment_method: input.payment_method,
      payment_reference: input.payment_reference || null,
      payment_date: input.payment_date || new Date().toISOString().split('T')[0],
    })
  },

  /**
   * Update processing status of a share
   */
  async updateProcessingStatus(
    shareId: string,
    processingStatus: ProcessingStatus
  ): Promise<QurbaniShare> {
    // Use Record type to allow additional fields not in UpdateShareInput
    const updates: Record<string, unknown> = { processing_status: processingStatus }

    if (processingStatus === ProcessingStatus.SLAUGHTERED) {
      updates.slaughtered_at = new Date().toISOString()
    } else if (processingStatus === ProcessingStatus.DISTRIBUTED || processingStatus === ProcessingStatus.COMPLETED) {
      updates.distributed_at = new Date().toISOString()
    }

    return this.updateShare(shareId, updates as UpdateShareInput)
  },

  /**
   * Cancel a share
   */
  async cancelShare(
    shareId: string,
    reason: string,
    refundAmount?: number
  ): Promise<QurbaniShare> {
    return this.updateShare(shareId, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      refund_amount: refundAmount,
    } as UpdateShareInput)
  },

  // =========================================================================
  // STATISTICS
  // =========================================================================

  /**
   * Get campaign statistics
   */
  async getCampaignStats(
    organizationId: string,
    campaignId: string
  ): Promise<CampaignStats> {
    const { data: shares, error } = await db
      .from('qurbani_shares')
      .select('animal_type, quantity, total_amount, amount_paid, distribution_type, payment_status, processing_status, status')
      .eq('organization_id', organizationId)
      .eq('campaign_id', campaignId)
      .neq('status', 'cancelled')
      .neq('status', 'refunded')

    if (error) throw error

    const stats: CampaignStats = {
      total_shares: 0,
      total_revenue: 0,
      total_collected: 0,
      total_outstanding: 0,
      by_animal_type: {
        sheep: { count: 0, amount: 0 },
        cow: { count: 0, amount: 0 },
        camel: { count: 0, amount: 0 },
      },
      by_distribution_type: {
        local_pickup: 0,
        full_charity: 0,
        overseas: 0,
        hybrid: 0,
      },
      by_payment_status: {
        pending: 0,
        deposit_paid: 0,
        partial: 0,
        paid: 0,
        refunded: 0,
      },
      by_processing_status: {
        registered: 0,
        slaughtered: 0,
        processed: 0,
        ready_for_pickup: 0,
        distributed: 0,
        completed: 0,
      },
    }

    const typedShares = (shares || []) as ShareStatsRow[]
    for (const share of typedShares) {
      stats.total_shares += share.quantity
      stats.total_revenue += share.total_amount
      stats.total_collected += share.amount_paid
      stats.total_outstanding += share.total_amount - share.amount_paid

      // By animal type
      if (share.animal_type in stats.by_animal_type) {
        stats.by_animal_type[share.animal_type as AnimalType].count += share.quantity
        stats.by_animal_type[share.animal_type as AnimalType].amount += share.total_amount
      }

      // By distribution type
      if (share.distribution_type in stats.by_distribution_type) {
        stats.by_distribution_type[share.distribution_type as DistributionType] += share.quantity
      }

      // By payment status
      if (share.payment_status in stats.by_payment_status) {
        stats.by_payment_status[share.payment_status as PaymentStatus]++
      }

      // By processing status
      if (share.processing_status in stats.by_processing_status) {
        stats.by_processing_status[share.processing_status as ProcessingStatus]++
      }
    }

    return stats
  },
}
