import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helper to create chainable mock query builder
function createMockQueryBuilder(finalResult: { data: any; error: any }) {
  const builder: any = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'is', 'not', 'or', 'gte', 'lte', 'like', 'order', 'limit', 'maybeSingle']

  methods.forEach(method => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)

  // Make chainable methods resolve at the end
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

// Mock the supabase client before importing the service
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { donationsService } from './donations.service'
import { supabase } from '@/lib/supabase/client'

describe('donationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all donations for an organization', async () => {
      const mockDonations = [
        {
          id: 'donation-1',
          organization_id: 'org-123',
          member_id: 'member-1',
          amount: 100,
          currency: 'USD',
          donation_type: 'one_time',
          payment_method: 'card',
          status: 'completed',
          donation_date: '2024-01-15',
          is_anonymous: false,
          is_tax_deductible: true,
          member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
          fund: { id: 'fund-1', name: 'General Fund', fund_type: 'general' },
        },
        {
          id: 'donation-2',
          organization_id: 'org-123',
          member_id: 'member-2',
          amount: 250,
          currency: 'USD',
          donation_type: 'zakat',
          payment_method: 'check',
          status: 'completed',
          donation_date: '2024-01-20',
          is_anonymous: true,
          is_tax_deductible: true,
          member: { id: 'member-2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
          fund: { id: 'fund-2', name: 'Zakat Fund', fund_type: 'zakat' },
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockDonations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getAll('org-123')

      expect(supabase.from).toHaveBeenCalledWith('donations')
      expect(result).toEqual(mockDonations)
    })

    it('should apply filters when provided', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await donationsService.getAll('org-123', {
        fund_id: 'fund-1',
        donation_type: 'zakat',
        status: 'completed',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        amount_min: 50,
        amount_max: 500,
      })

      expect(supabase.from).toHaveBeenCalledWith('donations')
      expect(mockQuery.eq).toHaveBeenCalled()
    })

    it('should apply search filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await donationsService.getAll('org-123', { search: 'REF123' })

      expect(mockQuery.or).toHaveBeenCalled()
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(donationsService.getAll('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('should fetch a single donation by ID', async () => {
      const mockDonation = {
        id: 'donation-1',
        organization_id: 'org-123',
        amount: 100,
        currency: 'USD',
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' },
        fund: { id: 'fund-1', name: 'General Fund', fund_type: 'general' },
      }

      const mockQuery = createMockQueryBuilder({ data: mockDonation, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getById('donation-1')

      expect(result).toEqual(mockDonation)
    })

    it('should return null when donation not found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'OTHER_ERROR', message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(donationsService.getById('donation-1')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Database error',
      })
    })
  })

  describe('create', () => {
    it('should create a new donation', async () => {
      const newDonation = {
        member_id: 'member-1',
        fund_id: 'fund-1',
        amount: 150,
        donation_type: 'one_time' as const,
        payment_method: 'card' as const,
        donation_date: '2024-02-01',
      }

      const createdDonation = {
        id: 'donation-new',
        organization_id: 'org-123',
        ...newDonation,
        currency: 'USD',
        status: 'completed',
        is_anonymous: false,
        is_tax_deductible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        fund: { id: 'fund-1', name: 'General Fund', fund_type: 'general' },
      }

      // Mock for create and updateFundAmount
      const createMockQuery = createMockQueryBuilder({ data: createdDonation, error: null })
      const updateFundMockQuery = createMockQueryBuilder({ data: [{ amount: 100 }], error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return createMockQuery
        return updateFundMockQuery
      })

      const result = await donationsService.create('org-123', newDonation)

      expect(result).toEqual(createdDonation)
    })

    it('should throw error when creation fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        donationsService.create('org-123', {
          amount: 100,
          donation_type: 'one_time',
          payment_method: 'card',
          donation_date: '2024-01-01',
        })
      ).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  describe('update', () => {
    it('should update an existing donation', async () => {
      const updateData = { amount: 200 }

      const existingDonation = {
        id: 'donation-1',
        fund_id: 'fund-1',
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' },
        fund: { id: 'fund-1', name: 'General Fund', fund_type: 'general' },
      }

      const updatedDonation = {
        ...existingDonation,
        amount: 200,
      }

      const getByIdMock = createMockQueryBuilder({ data: existingDonation, error: null })
      const updateMock = createMockQueryBuilder({ data: updatedDonation, error: null })
      // Mock for updateFundAmount - needs to return array
      const updateFundMock = createMockQueryBuilder({ data: [{ amount: 100 }], error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getByIdMock
        if (callCount === 2) return updateMock
        return updateFundMock
      })

      const result = await donationsService.update('donation-1', updateData)

      expect(result).toEqual(updatedDonation)
    })
  })

  describe('delete', () => {
    it('should delete a donation', async () => {
      const existingDonation = {
        id: 'donation-1',
        fund_id: 'fund-1',
      }

      const getByIdMock = createMockQueryBuilder({ data: existingDonation, error: null })
      const deleteMock = createMockQueryBuilder({ data: null, error: null })
      const updateFundMock = createMockQueryBuilder({ data: [], error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getByIdMock
        if (callCount === 2) return deleteMock
        return updateFundMock
      })

      await expect(donationsService.delete('donation-1')).resolves.toBeUndefined()
    })
  })

  describe('getByMember', () => {
    it('should fetch donations by member ID', async () => {
      const mockDonations = [
        { id: 'donation-1', member_id: 'member-1', amount: 100 },
        { id: 'donation-2', member_id: 'member-1', amount: 200 },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockDonations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getByMember('member-1')

      expect(result).toEqual(mockDonations)
      expect(supabase.from).toHaveBeenCalledWith('donations')
    })
  })

  describe('getSummary', () => {
    it('should return donation summary statistics', async () => {
      const mockDonations = [
        { id: '1', amount: 100, donation_type: 'one_time', payment_method: 'card', fund_id: 'fund-1', fund: { id: 'fund-1', name: 'General' } },
        { id: '2', amount: 200, donation_type: 'zakat', payment_method: 'card', fund_id: 'fund-2', fund: { id: 'fund-2', name: 'Zakat' } },
        { id: '3', amount: 150, donation_type: 'one_time', payment_method: 'check', fund_id: 'fund-1', fund: { id: 'fund-1', name: 'General' } },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockDonations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getSummary('org-123', { from: '2024-01-01', to: '2024-12-31' })

      expect(result.total_amount).toBe(450)
      expect(result.donation_count).toBe(3)
      expect(result.average_donation).toBe(150)
      expect(result.by_fund).toHaveLength(2)
      expect(result.by_payment_method).toHaveLength(2)
      expect(result.by_type).toHaveLength(2)
    })

    it('should return empty summary when no donations', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getSummary('org-123')

      expect(result.total_amount).toBe(0)
      expect(result.donation_count).toBe(0)
      expect(result.average_donation).toBe(0)
    })
  })

  describe('sendReceipt', () => {
    it('should mark donation as receipt sent', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(donationsService.sendReceipt('donation-1')).resolves.toBeUndefined()
      expect(mockQuery.update).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // FUNDS TESTS
  // ============================================================================

  describe('getFunds', () => {
    it('should fetch all funds for an organization', async () => {
      const mockFunds = [
        { id: 'fund-1', organization_id: 'org-123', name: 'General Fund', fund_type: 'general', is_active: true },
        { id: 'fund-2', organization_id: 'org-123', name: 'Zakat Fund', fund_type: 'zakat', is_active: true },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockFunds, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getFunds('org-123')

      expect(supabase.from).toHaveBeenCalledWith('funds')
      expect(result).toEqual(mockFunds)
    })

    it('should apply fund filters', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await donationsService.getFunds('org-123', {
        search: 'zakat',
        fund_type: 'zakat',
        is_active: true,
        has_goal: true,
      })

      expect(mockQuery.or).toHaveBeenCalled()
    })
  })

  describe('getFundById', () => {
    it('should fetch a single fund by ID', async () => {
      const mockFund = {
        id: 'fund-1',
        name: 'General Fund',
        fund_type: 'general',
      }

      const mockQuery = createMockQueryBuilder({ data: mockFund, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getFundById('fund-1')

      expect(result).toEqual(mockFund)
    })

    it('should return null when fund not found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.getFundById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('createFund', () => {
    it('should create a new fund', async () => {
      const newFund = {
        name: 'New Fund',
        fund_type: 'general' as const,
        description: 'A new fund',
        goal_amount: 10000,
      }

      const createdFund = {
        id: 'fund-new',
        organization_id: 'org-123',
        ...newFund,
        current_amount: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      }

      const mockQuery = createMockQueryBuilder({ data: createdFund, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.createFund('org-123', newFund)

      expect(result).toEqual(createdFund)
    })
  })

  describe('updateFund', () => {
    it('should update an existing fund', async () => {
      const updateData = { name: 'Updated Fund Name' }

      const updatedFund = {
        id: 'fund-1',
        name: 'Updated Fund Name',
        fund_type: 'general',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedFund, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await donationsService.updateFund('fund-1', updateData)

      expect(result).toEqual(updatedFund)
    })
  })

  describe('deleteFund', () => {
    it('should delete a fund', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(donationsService.deleteFund('fund-1')).resolves.toBeUndefined()
    })
  })
})
