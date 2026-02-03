/**
 * Tax Receipts Service
 * Handles year-end tax receipt generation and donor summaries
 */

import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Donation, FundType } from '../types/donations.types'

// Type assertion for tables with columns not in generated types
const db = supabase as SupabaseClient<any>

export interface DonorYearSummary {
  donorId: string
  donorName: string
  donorEmail: string | null
  donorPhone: string | null
  donorAddress: string | null
  totalAmount: number
  donationCount: number
  zakatAmount: number
  sadaqahAmount: number
  taxDeductibleAmount: number
  donations: DonorDonation[]
}

export interface DonorDonation {
  id: string
  date: Date
  amount: number
  fund: string | null
  fundType: FundType | null
  receiptNumber: string | null
  isZakat: boolean
  isTaxDeductible: boolean
}

export interface YearEndFilters {
  year: number
  minAmount?: number
  includeNonTaxDeductible?: boolean
}

export const taxReceiptsService = {
  /**
   * Get donation summary for a specific donor for a specific year
   */
  async getDonorYearSummary(
    organizationId: string,
    donorId: string,
    year: number
  ): Promise<DonorYearSummary | null> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // Get member info
    const { data: member, error: memberError } = await db
      .from('members')
      .select('id, first_name, last_name, email, phone, address_line1, address_line2, city, state, postal_code')
      .eq('id', donorId)
      .single()

    if (memberError || !member) {
      return null
    }

    // Get donations for this member in the specified year
    const { data: donations, error: donationsError } = await db
      .from('donations')
      .select(`
        id,
        donation_date,
        amount,
        is_tax_deductible,
        reference_number,
        fund:funds(id, name, fund_type)
      `)
      .eq('organization_id', organizationId)
      .eq('member_id', donorId)
      .eq('status', 'completed')
      .gte('donation_date', startDate)
      .lte('donation_date', endDate)
      .order('donation_date', { ascending: true })

    if (donationsError) {
      throw donationsError
    }

    if (!donations || donations.length === 0) {
      return null
    }

    // Format address
    const addressParts = [
      member.address_line1,
      member.address_line2,
      member.city,
      member.state,
      member.postal_code,
    ].filter(Boolean)
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : null

    // Calculate totals
    let totalAmount = 0
    let zakatAmount = 0
    let sadaqahAmount = 0
    let taxDeductibleAmount = 0

    const formattedDonations: DonorDonation[] = donations.map((d: any) => {
      const isZakat = d.fund?.fund_type === 'zakat'
      const amount = d.amount || 0

      totalAmount += amount
      if (isZakat) {
        zakatAmount += amount
      } else {
        sadaqahAmount += amount
      }
      if (d.is_tax_deductible) {
        taxDeductibleAmount += amount
      }

      // Generate receipt number if not exists
      const receiptNumber = d.reference_number ||
        `REC-${new Date(d.donation_date).toISOString().split('T')[0].replace(/-/g, '')}-${d.id.substring(0, 8).toUpperCase()}`

      return {
        id: d.id,
        date: new Date(d.donation_date),
        amount,
        fund: d.fund?.name || null,
        fundType: d.fund?.fund_type || null,
        receiptNumber,
        isZakat,
        isTaxDeductible: d.is_tax_deductible,
      }
    })

    return {
      donorId: member.id,
      donorName: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown Donor',
      donorEmail: member.email,
      donorPhone: member.phone,
      donorAddress: formattedAddress,
      totalAmount,
      donationCount: donations.length,
      zakatAmount,
      sadaqahAmount,
      taxDeductibleAmount,
      donations: formattedDonations,
    }
  },

  /**
   * Get all donors with donations for a specific year
   */
  async getAllDonorsForYear(
    organizationId: string,
    filters: YearEndFilters
  ): Promise<DonorYearSummary[]> {
    const { year, minAmount = 0, includeNonTaxDeductible = true } = filters
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // Get all donations for the year with member info
    let query = db
      .from('donations')
      .select(`
        id,
        member_id,
        donation_date,
        amount,
        is_tax_deductible,
        reference_number,
        member:members(id, first_name, last_name, email, phone, address_line1, address_line2, city, state, postal_code),
        fund:funds(id, name, fund_type)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .not('member_id', 'is', null)
      .gte('donation_date', startDate)
      .lte('donation_date', endDate)
      .order('donation_date', { ascending: true })

    if (!includeNonTaxDeductible) {
      query = query.eq('is_tax_deductible', true)
    }

    const { data: donations, error } = await query

    if (error) {
      throw error
    }

    if (!donations || donations.length === 0) {
      return []
    }

    // Group donations by member
    const donorMap = new Map<string, DonorYearSummary>()

    for (const d of donations as any[]) {
      if (!d.member_id || !d.member) continue

      const member = d.member
      const memberId = d.member_id

      if (!donorMap.has(memberId)) {
        // Format address
        const addressParts = [
          member.address_line1,
          member.address_line2,
          member.city,
          member.state,
          member.postal_code,
        ].filter(Boolean)
        const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : null

        donorMap.set(memberId, {
          donorId: memberId,
          donorName: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown Donor',
          donorEmail: member.email,
          donorPhone: member.phone,
          donorAddress: formattedAddress,
          totalAmount: 0,
          donationCount: 0,
          zakatAmount: 0,
          sadaqahAmount: 0,
          taxDeductibleAmount: 0,
          donations: [],
        })
      }

      const donor = donorMap.get(memberId)!
      const isZakat = d.fund?.fund_type === 'zakat'
      const amount = d.amount || 0

      donor.totalAmount += amount
      donor.donationCount += 1
      if (isZakat) {
        donor.zakatAmount += amount
      } else {
        donor.sadaqahAmount += amount
      }
      if (d.is_tax_deductible) {
        donor.taxDeductibleAmount += amount
      }

      // Generate receipt number if not exists
      const receiptNumber = d.reference_number ||
        `REC-${new Date(d.donation_date).toISOString().split('T')[0].replace(/-/g, '')}-${d.id.substring(0, 8).toUpperCase()}`

      donor.donations.push({
        id: d.id,
        date: new Date(d.donation_date),
        amount,
        fund: d.fund?.name || null,
        fundType: d.fund?.fund_type || null,
        receiptNumber,
        isZakat,
        isTaxDeductible: d.is_tax_deductible,
      })
    }

    // Convert to array and filter by minimum amount
    const donors = Array.from(donorMap.values())
      .filter(donor => donor.totalAmount >= minAmount)
      .sort((a, b) => b.totalAmount - a.totalAmount)

    return donors
  },

  /**
   * Mark donations as having receipt sent
   */
  async markReceiptsSent(donationIds: string[]): Promise<void> {
    if (donationIds.length === 0) return

    const { error } = await db
      .from('donations')
      .update({
        receipt_sent: true,
        receipt_sent_at: new Date().toISOString(),
      })
      .in('id', donationIds)

    if (error) {
      throw error
    }
  },

  /**
   * Get available years with donations for an organization
   */
  async getAvailableYears(organizationId: string): Promise<number[]> {
    const { data, error } = await db
      .from('donations')
      .select('donation_date')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .not('member_id', 'is', null)
      .order('donation_date', { ascending: false })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return [new Date().getFullYear()]
    }

    // Extract unique years
    const years = new Set<number>()
    for (const d of data as any[]) {
      if (d.donation_date) {
        years.add(new Date(d.donation_date).getFullYear())
      }
    }

    return Array.from(years).sort((a, b) => b - a)
  },

  /**
   * Get statistics for year-end statements
   */
  async getYearEndStats(organizationId: string, year: number): Promise<{
    totalDonors: number
    totalAmount: number
    totalDonations: number
    taxDeductibleAmount: number
    zakatAmount: number
    sadaqahAmount: number
    averageDonation: number
    sentCount: number
    pendingCount: number
  }> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data: donations, error } = await db
      .from('donations')
      .select('id, member_id, amount, is_tax_deductible, receipt_sent, fund:funds(fund_type)')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .not('member_id', 'is', null)
      .gte('donation_date', startDate)
      .lte('donation_date', endDate)

    if (error) {
      throw error
    }

    if (!donations || donations.length === 0) {
      return {
        totalDonors: 0,
        totalAmount: 0,
        totalDonations: 0,
        taxDeductibleAmount: 0,
        zakatAmount: 0,
        sadaqahAmount: 0,
        averageDonation: 0,
        sentCount: 0,
        pendingCount: 0,
      }
    }

    const uniqueDonors = new Set<string>()
    let totalAmount = 0
    let taxDeductibleAmount = 0
    let zakatAmount = 0
    let sadaqahAmount = 0
    let sentCount = 0

    for (const d of donations as any[]) {
      uniqueDonors.add(d.member_id)
      const amount = d.amount || 0
      totalAmount += amount

      if (d.is_tax_deductible) {
        taxDeductibleAmount += amount
      }

      const isZakat = d.fund?.fund_type === 'zakat'
      if (isZakat) {
        zakatAmount += amount
      } else {
        sadaqahAmount += amount
      }

      if (d.receipt_sent) {
        sentCount++
      }
    }

    return {
      totalDonors: uniqueDonors.size,
      totalAmount,
      totalDonations: donations.length,
      taxDeductibleAmount,
      zakatAmount,
      sadaqahAmount,
      averageDonation: donations.length > 0 ? totalAmount / donations.length : 0,
      sentCount,
      pendingCount: donations.length - sentCount,
    }
  },
}
