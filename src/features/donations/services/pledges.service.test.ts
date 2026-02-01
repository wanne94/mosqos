import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PledgeStatus, RecurringStatus, RecurringFrequency, PaymentMethod } from '../types/donations.types'
import type { Pledge, RecurringDonation } from '../types/donations.types'

function createMockQueryBuilder(finalResult: { data: any; error: any }) {
  const builder: any = {}
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'is',
    'not',
    'or',
    'gte',
    'lte',
    'like',
    'ilike',
    'order',
    'limit',
    'maybeSingle',
    'gt',
    'lt',
    'neq',
  ]

  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { pledgesService } from './pledges.service'
import { supabase } from '@/lib/supabase/client'

describe('pledgesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // PLEDGES - getAll
  // ============================================================================
  describe('getAll', () => {
    const mockPledges: Pledge[] = [
      {
        id: 'pledge-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        total_amount: 1000,
        paid_amount: 500,
        currency: 'USD',
        status: PledgeStatus.ACTIVE,
        pledge_date: '2024-01-01',
        due_date: '2024-06-01',
        payment_schedule: null,
        notes: 'Monthly pledge',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
        updated_by: null,
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        fund: { id: 'fund-1', name: 'General Fund' },
      },
      {
        id: 'pledge-2',
        organization_id: 'org-1',
        member_id: 'member-2',
        fund_id: 'fund-2',
        total_amount: 500,
        paid_amount: 500,
        currency: 'USD',
        status: PledgeStatus.COMPLETED,
        pledge_date: '2024-01-15',
        due_date: '2024-03-15',
        payment_schedule: null,
        notes: null,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-02-15T00:00:00Z',
        created_by: 'user-1',
        updated_by: 'user-1',
        member: { id: 'member-2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        fund: { id: 'fund-2', name: 'Building Fund' },
      },
    ]

    it('should fetch all pledges for an organization', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPledges, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getAll('org-1')

      expect(supabase.from).toHaveBeenCalledWith('pledges')
      expect(mockBuilder.select).toHaveBeenCalled()
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1')
      expect(mockBuilder.order).toHaveBeenCalledWith('pledge_date', { ascending: false })
      expect(result).toEqual(mockPledges)
    })

    it('should apply search filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPledges, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getAll('org-1', { search: 'monthly' })

      expect(mockBuilder.or).toHaveBeenCalledWith('notes.ilike.%monthly%')
    })

    it('should apply member_id filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPledges[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getAll('org-1', { member_id: 'member-1' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', 'member-1')
    })

    it('should apply fund_id filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPledges[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getAll('org-1', { fund_id: 'fund-1' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('fund_id', 'fund-1')
    })

    it('should apply status filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPledges[1]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getAll('org-1', { status: PledgeStatus.COMPLETED })

      expect(mockBuilder.eq).toHaveBeenCalledWith('status', PledgeStatus.COMPLETED)
    })

    it('should apply date_from filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPledges, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getAll('org-1', { date_from: '2024-01-01' })

      expect(mockBuilder.gte).toHaveBeenCalledWith('pledge_date', '2024-01-01')
    })

    it('should apply date_to filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPledges, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getAll('org-1', { date_to: '2024-12-31' })

      expect(mockBuilder.lte).toHaveBeenCalledWith('pledge_date', '2024-12-31')
    })

    it('should apply multiple filters together', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockPledges[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getAll('org-1', {
        member_id: 'member-1',
        status: PledgeStatus.ACTIVE,
        date_from: '2024-01-01',
        date_to: '2024-06-30',
      })

      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', PledgeStatus.ACTIVE)
      expect(mockBuilder.gte).toHaveBeenCalledWith('pledge_date', '2024-01-01')
      expect(mockBuilder.lte).toHaveBeenCalledWith('pledge_date', '2024-06-30')
    })

    it('should return empty array when no pledges found', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getAll('org-1')

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const dbError = { message: 'Database error', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.getAll('org-1')).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // PLEDGES - getById
  // ============================================================================
  describe('getById', () => {
    const mockPledge: Pledge = {
      id: 'pledge-1',
      organization_id: 'org-1',
      member_id: 'member-1',
      fund_id: 'fund-1',
      total_amount: 1000,
      paid_amount: 500,
      currency: 'USD',
      status: PledgeStatus.ACTIVE,
      pledge_date: '2024-01-01',
      due_date: '2024-06-01',
      payment_schedule: null,
      notes: 'Test pledge',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-1',
      updated_by: null,
      member: {
        id: 'member-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      fund: { id: 'fund-1', name: 'General Fund' },
      payments: [],
    }

    it('should fetch a single pledge by ID', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockPledge, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getById('pledge-1')

      expect(supabase.from).toHaveBeenCalledWith('pledges')
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'pledge-1')
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockPledge)
    })

    it('should return null when pledge not found', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getById('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const dbError = { code: 'PGRST001', message: 'Database error' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.getById('pledge-1')).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // PLEDGES - create
  // ============================================================================
  describe('create', () => {
    const mockCreatedPledge: Pledge = {
      id: 'pledge-new',
      organization_id: 'org-1',
      member_id: 'member-1',
      fund_id: 'fund-1',
      total_amount: 1000,
      paid_amount: 0,
      currency: 'USD',
      status: PledgeStatus.ACTIVE,
      pledge_date: '2024-01-01',
      due_date: '2024-06-01',
      payment_schedule: null,
      notes: 'New pledge',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-1',
      updated_by: null,
      member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      fund: { id: 'fund-1', name: 'General Fund' },
    }

    it('should create a new pledge with default values', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockCreatedPledge, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        member_id: 'member-1',
        fund_id: 'fund-1',
        total_amount: 1000,
        pledge_date: '2024-01-01',
        due_date: '2024-06-01',
        notes: 'New pledge',
      }

      const result = await pledgesService.create('org-1', input)

      expect(supabase.from).toHaveBeenCalledWith('pledges')
      expect(mockBuilder.insert).toHaveBeenCalledWith([
        {
          organization_id: 'org-1',
          ...input,
          paid_amount: 0,
          currency: 'USD',
          status: 'active',
        },
      ])
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedPledge)
    })

    it('should create a pledge with custom currency', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockCreatedPledge, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        member_id: 'member-1',
        total_amount: 1000,
        pledge_date: '2024-01-01',
        currency: 'EUR',
      }

      await pledgesService.create('org-1', input)

      expect(mockBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          currency: 'EUR',
        }),
      ])
    })

    it('should throw error when creation fails', async () => {
      const dbError = { message: 'Insert failed', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        member_id: 'member-1',
        total_amount: 1000,
        pledge_date: '2024-01-01',
      }

      await expect(pledgesService.create('org-1', input)).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // PLEDGES - update
  // ============================================================================
  describe('update', () => {
    const mockUpdatedPledge: Pledge = {
      id: 'pledge-1',
      organization_id: 'org-1',
      member_id: 'member-1',
      fund_id: 'fund-2',
      total_amount: 1500,
      paid_amount: 500,
      currency: 'USD',
      status: PledgeStatus.ACTIVE,
      pledge_date: '2024-01-01',
      due_date: '2024-12-01',
      payment_schedule: null,
      notes: 'Updated notes',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
      created_by: 'user-1',
      updated_by: 'user-1',
      member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      fund: { id: 'fund-2', name: 'Building Fund' },
    }

    it('should update an existing pledge', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockUpdatedPledge, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        fund_id: 'fund-2',
        total_amount: 1500,
        due_date: '2024-12-01',
        notes: 'Updated notes',
      }

      const result = await pledgesService.update('pledge-1', input)

      expect(supabase.from).toHaveBeenCalledWith('pledges')
      expect(mockBuilder.update).toHaveBeenCalledWith(input)
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'pledge-1')
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockUpdatedPledge)
    })

    it('should update pledge status', async () => {
      const completedPledge = { ...mockUpdatedPledge, status: PledgeStatus.COMPLETED }
      const mockBuilder = createMockQueryBuilder({ data: completedPledge, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.update('pledge-1', { status: PledgeStatus.COMPLETED })

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: PledgeStatus.COMPLETED })
    })

    it('should throw error when update fails', async () => {
      const dbError = { message: 'Update failed', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.update('pledge-1', { notes: 'Updated' })).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // PLEDGES - delete
  // ============================================================================
  describe('delete', () => {
    it('should delete a pledge', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      // For delete, we need to override .then to work synchronously
      mockBuilder.then = (resolve: any) => resolve({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.delete('pledge-1')

      expect(supabase.from).toHaveBeenCalledWith('pledges')
      expect(mockBuilder.delete).toHaveBeenCalled()
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'pledge-1')
    })

    it('should throw error when delete fails', async () => {
      const dbError = { message: 'Delete failed', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.delete('pledge-1')).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // PLEDGES - recordPayment
  // ============================================================================
  describe('recordPayment', () => {
    it('should record payment and keep status active when not fully paid', async () => {
      const existingPledge: Pledge = {
        id: 'pledge-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        total_amount: 1000,
        paid_amount: 200,
        currency: 'USD',
        status: PledgeStatus.ACTIVE,
        pledge_date: '2024-01-01',
        due_date: '2024-06-01',
        payment_schedule: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      }

      const updatedPledge = { ...existingPledge, paid_amount: 500, status: PledgeStatus.ACTIVE }

      // First call for getById
      const getByIdBuilder = createMockQueryBuilder({ data: existingPledge, error: null })
      // Second call for update
      const updateBuilder = createMockQueryBuilder({ data: updatedPledge, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        return callCount === 1 ? getByIdBuilder : updateBuilder
      })

      const result = await pledgesService.recordPayment('pledge-1', 300)

      expect(updateBuilder.update).toHaveBeenCalledWith({
        status: PledgeStatus.ACTIVE,
      })
      expect(result).toEqual(updatedPledge)
    })

    it('should record payment and set status to completed when fully paid', async () => {
      const existingPledge: Pledge = {
        id: 'pledge-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        total_amount: 1000,
        paid_amount: 700,
        currency: 'USD',
        status: PledgeStatus.ACTIVE,
        pledge_date: '2024-01-01',
        due_date: '2024-06-01',
        payment_schedule: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      }

      const completedPledge = { ...existingPledge, paid_amount: 1000, status: PledgeStatus.COMPLETED }

      const getByIdBuilder = createMockQueryBuilder({ data: existingPledge, error: null })
      const updateBuilder = createMockQueryBuilder({ data: completedPledge, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        return callCount === 1 ? getByIdBuilder : updateBuilder
      })

      const result = await pledgesService.recordPayment('pledge-1', 300)

      expect(updateBuilder.update).toHaveBeenCalledWith({
        status: PledgeStatus.COMPLETED,
      })
      expect(result).toEqual(completedPledge)
    })

    it('should set status to completed when overpaid', async () => {
      const existingPledge: Pledge = {
        id: 'pledge-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        total_amount: 1000,
        paid_amount: 900,
        currency: 'USD',
        status: PledgeStatus.ACTIVE,
        pledge_date: '2024-01-01',
        due_date: '2024-06-01',
        payment_schedule: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      }

      const completedPledge = { ...existingPledge, paid_amount: 1100, status: PledgeStatus.COMPLETED }

      const getByIdBuilder = createMockQueryBuilder({ data: existingPledge, error: null })
      const updateBuilder = createMockQueryBuilder({ data: completedPledge, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        return callCount === 1 ? getByIdBuilder : updateBuilder
      })

      const result = await pledgesService.recordPayment('pledge-1', 200)

      expect(updateBuilder.update).toHaveBeenCalledWith({
        status: PledgeStatus.COMPLETED,
      })
    })

    it('should throw error when pledge not found', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.recordPayment('nonexistent', 100)).rejects.toThrow('Pledge not found')
    })
  })

  // ============================================================================
  // PLEDGES - getByMember
  // ============================================================================
  describe('getByMember', () => {
    const mockMemberPledges: Pledge[] = [
      {
        id: 'pledge-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        total_amount: 1000,
        paid_amount: 500,
        currency: 'USD',
        status: PledgeStatus.ACTIVE,
        pledge_date: '2024-01-01',
        due_date: '2024-06-01',
        payment_schedule: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        fund: { id: 'fund-1', name: 'General Fund' },
      },
    ]

    it('should fetch pledges for a specific member', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockMemberPledges, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getByMember('member-1')

      expect(supabase.from).toHaveBeenCalledWith('pledges')
      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(mockBuilder.order).toHaveBeenCalledWith('pledge_date', { ascending: false })
      expect(result).toEqual(mockMemberPledges)
    })

    it('should return empty array when member has no pledges', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getByMember('member-no-pledges')

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const dbError = { message: 'Database error', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.getByMember('member-1')).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // PLEDGES - getOverdue
  // ============================================================================
  describe('getOverdue', () => {
    const mockOverduePledges: Pledge[] = [
      {
        id: 'pledge-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        total_amount: 1000,
        paid_amount: 200,
        currency: 'USD',
        status: PledgeStatus.ACTIVE,
        pledge_date: '2024-01-01',
        due_date: '2024-01-15',
        payment_schedule: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        member: {
          id: 'member-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        fund: { id: 'fund-1', name: 'General Fund' },
      },
    ]

    it('should fetch overdue pledges', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockOverduePledges, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getOverdue('org-1')

      expect(supabase.from).toHaveBeenCalledWith('pledges')
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1')
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'active')
      expect(mockBuilder.lt).toHaveBeenCalled() // lt('due_date', today)
      expect(mockBuilder.order).toHaveBeenCalledWith('due_date', { ascending: true })
      expect(result).toEqual(mockOverduePledges)
    })

    it('should return empty array when no overdue pledges', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getOverdue('org-1')

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const dbError = { message: 'Database error', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.getOverdue('org-1')).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - getRecurringDonations
  // ============================================================================
  describe('getRecurringDonations', () => {
    const mockRecurringDonations: RecurringDonation[] = [
      {
        id: 'recurring-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        amount: 100,
        currency: 'USD',
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        status: RecurringStatus.ACTIVE,
        start_date: '2024-01-01',
        end_date: null,
        next_payment_date: '2024-02-01',
        last_payment_date: '2024-01-01',
        total_donated: 100,
        donation_count: 1,
        stripe_subscription_id: 'sub_123',
        notes: 'Monthly contribution',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
        updated_by: null,
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        fund: { id: 'fund-1', name: 'General Fund' },
      },
      {
        id: 'recurring-2',
        organization_id: 'org-1',
        member_id: 'member-2',
        fund_id: 'fund-2',
        amount: 50,
        currency: 'USD',
        frequency: RecurringFrequency.WEEKLY,
        payment_method: PaymentMethod.BANK_TRANSFER,
        status: RecurringStatus.PAUSED,
        start_date: '2024-01-15',
        end_date: null,
        next_payment_date: null,
        last_payment_date: '2024-01-22',
        total_donated: 150,
        donation_count: 3,
        stripe_subscription_id: null,
        notes: null,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z',
        created_by: 'user-1',
        updated_by: 'user-1',
        member: { id: 'member-2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        fund: { id: 'fund-2', name: 'Building Fund' },
      },
    ]

    it('should fetch all recurring donations for an organization', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockRecurringDonations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getRecurringDonations('org-1')

      expect(supabase.from).toHaveBeenCalledWith('recurring_donations')
      expect(mockBuilder.select).toHaveBeenCalled()
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1')
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockRecurringDonations)
    })

    it('should apply search filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockRecurringDonations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getRecurringDonations('org-1', { search: 'contribution' })

      expect(mockBuilder.or).toHaveBeenCalledWith('notes.ilike.%contribution%')
    })

    it('should apply member_id filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockRecurringDonations[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getRecurringDonations('org-1', { member_id: 'member-1' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', 'member-1')
    })

    it('should apply fund_id filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockRecurringDonations[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getRecurringDonations('org-1', { fund_id: 'fund-1' })

      expect(mockBuilder.eq).toHaveBeenCalledWith('fund_id', 'fund-1')
    })

    it('should apply status filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockRecurringDonations[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getRecurringDonations('org-1', { status: RecurringStatus.ACTIVE })

      expect(mockBuilder.eq).toHaveBeenCalledWith('status', RecurringStatus.ACTIVE)
    })

    it('should apply frequency filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockRecurringDonations[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getRecurringDonations('org-1', { frequency: RecurringFrequency.MONTHLY })

      expect(mockBuilder.eq).toHaveBeenCalledWith('frequency', RecurringFrequency.MONTHLY)
    })

    it('should apply multiple filters together', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockRecurringDonations[0]], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await pledgesService.getRecurringDonations('org-1', {
        member_id: 'member-1',
        status: RecurringStatus.ACTIVE,
        frequency: RecurringFrequency.MONTHLY,
      })

      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', RecurringStatus.ACTIVE)
      expect(mockBuilder.eq).toHaveBeenCalledWith('frequency', RecurringFrequency.MONTHLY)
    })

    it('should return empty array when no recurring donations found', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getRecurringDonations('org-1')

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const dbError = { message: 'Database error', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.getRecurringDonations('org-1')).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - getRecurringById
  // ============================================================================
  describe('getRecurringById', () => {
    const mockRecurringDonation: RecurringDonation = {
      id: 'recurring-1',
      organization_id: 'org-1',
      member_id: 'member-1',
      fund_id: 'fund-1',
      amount: 100,
      currency: 'USD',
      frequency: RecurringFrequency.MONTHLY,
      payment_method: PaymentMethod.CARD,
      status: RecurringStatus.ACTIVE,
      start_date: '2024-01-01',
      end_date: null,
      next_payment_date: '2024-02-01',
      last_payment_date: '2024-01-01',
      total_donated: 100,
      donation_count: 1,
      stripe_subscription_id: 'sub_123',
      notes: 'Monthly contribution',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-1',
      updated_by: null,
      member: {
        id: 'member-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      fund: { id: 'fund-1', name: 'General Fund' },
    }

    it('should fetch a single recurring donation by ID', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockRecurringDonation, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getRecurringById('recurring-1')

      expect(supabase.from).toHaveBeenCalledWith('recurring_donations')
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'recurring-1')
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockRecurringDonation)
    })

    it('should return null when recurring donation not found', async () => {
      const mockBuilder = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getRecurringById('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const dbError = { code: 'PGRST001', message: 'Database error' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.getRecurringById('recurring-1')).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - createRecurring
  // ============================================================================
  describe('createRecurring', () => {
    const mockCreatedRecurring: RecurringDonation = {
      id: 'recurring-new',
      organization_id: 'org-1',
      member_id: 'member-1',
      fund_id: 'fund-1',
      amount: 100,
      currency: 'USD',
      frequency: RecurringFrequency.MONTHLY,
      payment_method: PaymentMethod.CARD,
      status: RecurringStatus.ACTIVE,
      start_date: '2024-01-01',
      end_date: null,
      next_payment_date: '2024-01-01',
      last_payment_date: null,
      total_donated: 0,
      donation_count: 0,
      stripe_subscription_id: null,
      notes: 'New recurring donation',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-1',
      updated_by: null,
      member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      fund: { id: 'fund-1', name: 'General Fund' },
    }

    it('should create a new recurring donation with default values', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockCreatedRecurring, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        member_id: 'member-1',
        fund_id: 'fund-1',
        amount: 100,
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        start_date: '2024-01-01',
        notes: 'New recurring donation',
      }

      const result = await pledgesService.createRecurring('org-1', input)

      expect(supabase.from).toHaveBeenCalledWith('recurring_donations')
      expect(mockBuilder.insert).toHaveBeenCalledWith([
        {
          organization_id: 'org-1',
          ...input,
          status: 'active',
          currency: 'USD',
          total_donated: 0,
          donation_count: 0,
          next_payment_date: '2024-01-01',
        },
      ])
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedRecurring)
    })

    it('should create a recurring donation with custom currency', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockCreatedRecurring, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        member_id: 'member-1',
        amount: 100,
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        start_date: '2024-01-01',
        currency: 'EUR',
      }

      await pledgesService.createRecurring('org-1', input)

      expect(mockBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          currency: 'EUR',
        }),
      ])
    })

    it('should throw error when creation fails', async () => {
      const dbError = { message: 'Insert failed', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        member_id: 'member-1',
        amount: 100,
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        start_date: '2024-01-01',
      }

      await expect(pledgesService.createRecurring('org-1', input)).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - updateRecurring
  // ============================================================================
  describe('updateRecurring', () => {
    const mockUpdatedRecurring: RecurringDonation = {
      id: 'recurring-1',
      organization_id: 'org-1',
      member_id: 'member-1',
      fund_id: 'fund-2',
      amount: 150,
      currency: 'USD',
      frequency: RecurringFrequency.WEEKLY,
      payment_method: PaymentMethod.CARD,
      status: RecurringStatus.ACTIVE,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      next_payment_date: '2024-02-01',
      last_payment_date: '2024-01-01',
      total_donated: 100,
      donation_count: 1,
      stripe_subscription_id: 'sub_123',
      notes: 'Updated notes',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
      created_by: 'user-1',
      updated_by: 'user-1',
      member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      fund: { id: 'fund-2', name: 'Building Fund' },
    }

    it('should update an existing recurring donation', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockUpdatedRecurring, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const input = {
        fund_id: 'fund-2',
        amount: 150,
        frequency: RecurringFrequency.WEEKLY,
        end_date: '2024-12-31',
        notes: 'Updated notes',
      }

      const result = await pledgesService.updateRecurring('recurring-1', input)

      expect(supabase.from).toHaveBeenCalledWith('recurring_donations')
      expect(mockBuilder.update).toHaveBeenCalledWith(input)
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'recurring-1')
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(mockUpdatedRecurring)
    })

    it('should throw error when update fails', async () => {
      const dbError = { message: 'Update failed', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.updateRecurring('recurring-1', { amount: 200 })).rejects.toEqual(dbError)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - cancelRecurring
  // ============================================================================
  describe('cancelRecurring', () => {
    it('should cancel a recurring donation', async () => {
      const cancelledRecurring: RecurringDonation = {
        id: 'recurring-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        amount: 100,
        currency: 'USD',
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        status: RecurringStatus.CANCELLED,
        start_date: '2024-01-01',
        end_date: null,
        next_payment_date: null,
        last_payment_date: '2024-01-01',
        total_donated: 100,
        donation_count: 1,
        stripe_subscription_id: 'sub_123',
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-02-01T00:00:00Z',
        created_by: 'user-1',
        updated_by: 'user-1',
      }

      const mockBuilder = createMockQueryBuilder({ data: cancelledRecurring, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.cancelRecurring('recurring-1')

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: RecurringStatus.CANCELLED })
      expect(result.status).toBe(RecurringStatus.CANCELLED)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - pauseRecurring
  // ============================================================================
  describe('pauseRecurring', () => {
    it('should pause a recurring donation', async () => {
      const pausedRecurring: RecurringDonation = {
        id: 'recurring-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        amount: 100,
        currency: 'USD',
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        status: RecurringStatus.PAUSED,
        start_date: '2024-01-01',
        end_date: null,
        next_payment_date: null,
        last_payment_date: '2024-01-01',
        total_donated: 100,
        donation_count: 1,
        stripe_subscription_id: 'sub_123',
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-02-01T00:00:00Z',
        created_by: 'user-1',
        updated_by: 'user-1',
      }

      const mockBuilder = createMockQueryBuilder({ data: pausedRecurring, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.pauseRecurring('recurring-1')

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: RecurringStatus.PAUSED })
      expect(result.status).toBe(RecurringStatus.PAUSED)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - resumeRecurring
  // ============================================================================
  describe('resumeRecurring', () => {
    it('should resume a recurring donation', async () => {
      const activeRecurring: RecurringDonation = {
        id: 'recurring-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        amount: 100,
        currency: 'USD',
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        status: RecurringStatus.ACTIVE,
        start_date: '2024-01-01',
        end_date: null,
        next_payment_date: '2024-02-01',
        last_payment_date: '2024-01-01',
        total_donated: 100,
        donation_count: 1,
        stripe_subscription_id: 'sub_123',
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-02-01T00:00:00Z',
        created_by: 'user-1',
        updated_by: 'user-1',
      }

      const mockBuilder = createMockQueryBuilder({ data: activeRecurring, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.resumeRecurring('recurring-1')

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: RecurringStatus.ACTIVE })
      expect(result.status).toBe(RecurringStatus.ACTIVE)
    })
  })

  // ============================================================================
  // RECURRING DONATIONS - getRecurringByMember
  // ============================================================================
  describe('getRecurringByMember', () => {
    const mockMemberRecurring: RecurringDonation[] = [
      {
        id: 'recurring-1',
        organization_id: 'org-1',
        member_id: 'member-1',
        fund_id: 'fund-1',
        amount: 100,
        currency: 'USD',
        frequency: RecurringFrequency.MONTHLY,
        payment_method: PaymentMethod.CARD,
        status: RecurringStatus.ACTIVE,
        start_date: '2024-01-01',
        end_date: null,
        next_payment_date: '2024-02-01',
        last_payment_date: '2024-01-01',
        total_donated: 100,
        donation_count: 1,
        stripe_subscription_id: 'sub_123',
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
        updated_by: null,
        fund: { id: 'fund-1', name: 'General Fund' },
      },
    ]

    it('should fetch recurring donations for a specific member', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockMemberRecurring, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getRecurringByMember('member-1')

      expect(supabase.from).toHaveBeenCalledWith('recurring_donations')
      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockMemberRecurring)
    })

    it('should return empty array when member has no recurring donations', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      const result = await pledgesService.getRecurringByMember('member-no-recurring')

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const dbError = { message: 'Database error', code: 'PGRST001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError })
      vi.mocked(supabase.from).mockReturnValue(mockBuilder)

      await expect(pledgesService.getRecurringByMember('member-1')).rejects.toEqual(dbError)
    })
  })
})
