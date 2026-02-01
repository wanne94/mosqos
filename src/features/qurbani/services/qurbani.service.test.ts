import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helper to create chainable mock query builder
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
    'gt',
    'neq',
    'order',
    'limit',
    'maybeSingle',
    'upsert',
  ]

  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

// Mock the supabase client before importing the service
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { qurbaniService } from './qurbani.service'
import { supabase } from '@/lib/supabase/client'
import type {
  QurbaniCampaign,
  QurbaniShare,
  CreateCampaignInput,
  UpdateCampaignInput,
  CreateShareInput,
  RecordPaymentInput,
} from '../types/qurbani.types'

describe('qurbaniService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // CAMPAIGNS TESTS
  // ===========================================================================

  describe('getCampaigns', () => {
    const orgId = 'org-123'

    it('should fetch all campaigns for an organization', async () => {
      const mockCampaigns: Partial<QurbaniCampaign>[] = [
        { id: 'camp-1', name: 'Eid 2024', year: 2024 },
        { id: 'camp-2', name: 'Eid 2023', year: 2023 },
      ]
      const mockQuery = createMockQueryBuilder({ data: mockCampaigns, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getCampaigns(orgId)

      expect(supabase.from).toHaveBeenCalledWith('qurbani_campaigns')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', orgId)
      expect(mockQuery.order).toHaveBeenCalledWith('year', { ascending: false })
      expect(result).toEqual(mockCampaigns)
    })

    it('should apply year filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getCampaigns(orgId, { year: 2024 })

      expect(mockQuery.eq).toHaveBeenCalledWith('year', 2024)
    })

    it('should apply single status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getCampaigns(orgId, { status: 'open' })

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'open')
    })

    it('should apply array status filter using in()', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getCampaigns(orgId, { status: ['open', 'closed'] })

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['open', 'closed'])
    })

    it('should apply search filter with ilike', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getCampaigns(orgId, { search: 'Eid' })

      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%Eid%')
    })

    it('should throw error on database failure', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Database error', code: '500' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(qurbaniService.getCampaigns(orgId)).rejects.toEqual({
        message: 'Database error',
        code: '500',
      })
    })
  })

  describe('getCampaign', () => {
    it('should fetch a single campaign by ID', async () => {
      const mockCampaign: Partial<QurbaniCampaign> = {
        id: 'camp-1',
        name: 'Eid 2024',
        year: 2024,
      }
      const mockQuery = createMockQueryBuilder({ data: mockCampaign, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getCampaign('camp-1')

      expect(supabase.from).toHaveBeenCalledWith('qurbani_campaigns')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'camp-1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockCampaign)
    })

    it('should return null when campaign not found (PGRST116)', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getCampaign('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: '500', message: 'Server error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(qurbaniService.getCampaign('camp-1')).rejects.toEqual({
        code: '500',
        message: 'Server error',
      })
    })
  })

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const orgId = 'org-123'
      const input: CreateCampaignInput = {
        name: 'Eid 2025',
        year: 2025,
        registration_deadline: '2025-06-01',
        slaughter_start_date: '2025-06-07',
        slaughter_end_date: '2025-06-09',
      }
      const mockCampaign: Partial<QurbaniCampaign> = { id: 'new-camp', ...input }
      const mockQuery = createMockQueryBuilder({ data: mockCampaign, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.createCampaign(orgId, input)

      expect(supabase.from).toHaveBeenCalledWith('qurbani_campaigns')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        organization_id: orgId,
        ...input,
      })
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockCampaign)
    })

    it('should throw error on creation failure', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Insert failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        qurbaniService.createCampaign('org-123', {
          name: 'Test',
          year: 2025,
          registration_deadline: '2025-06-01',
          slaughter_start_date: '2025-06-07',
          slaughter_end_date: '2025-06-09',
        })
      ).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  describe('updateCampaign', () => {
    it('should update a campaign', async () => {
      const input: UpdateCampaignInput = { name: 'Updated Name', status: 'closed' as any }
      const mockCampaign: Partial<QurbaniCampaign> = { id: 'camp-1', ...input }
      const mockQuery = createMockQueryBuilder({ data: mockCampaign, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.updateCampaign('camp-1', input)

      expect(supabase.from).toHaveBeenCalledWith('qurbani_campaigns')
      expect(mockQuery.update).toHaveBeenCalledWith(input)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'camp-1')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockCampaign)
    })
  })

  describe('deleteCampaign', () => {
    it('should delete a campaign', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.deleteCampaign('camp-1')

      expect(supabase.from).toHaveBeenCalledWith('qurbani_campaigns')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'camp-1')
    })

    it('should throw error on delete failure', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Delete failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(qurbaniService.deleteCampaign('camp-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  // ===========================================================================
  // SHARES TESTS
  // ===========================================================================

  describe('getShares', () => {
    const orgId = 'org-123'

    it('should fetch all shares for an organization with member relations', async () => {
      const mockShares: Partial<QurbaniShare>[] = [
        { id: 'share-1', animal_type: 'sheep' as any },
        { id: 'share-2', animal_type: 'cow' as any },
      ]
      const mockQuery = createMockQueryBuilder({ data: mockShares, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getShares(orgId)

      expect(supabase.from).toHaveBeenCalledWith('qurbani_shares')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', orgId)
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockShares)
    })

    it('should apply campaign_id filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { campaign_id: 'camp-1' })

      expect(mockQuery.eq).toHaveBeenCalledWith('campaign_id', 'camp-1')
    })

    it('should apply member_id filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { member_id: 'member-1' })

      expect(mockQuery.eq).toHaveBeenCalledWith('member_id', 'member-1')
    })

    it('should apply single animal_type filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { animal_type: 'sheep' as any })

      expect(mockQuery.eq).toHaveBeenCalledWith('animal_type', 'sheep')
    })

    it('should apply array animal_type filter using in()', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { animal_type: ['sheep', 'cow'] as any })

      expect(mockQuery.in).toHaveBeenCalledWith('animal_type', ['sheep', 'cow'])
    })

    it('should apply array status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { status: ['pending', 'confirmed'] as any })

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['pending', 'confirmed'])
    })

    it('should apply array payment_status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { payment_status: ['pending', 'partial'] as any })

      expect(mockQuery.in).toHaveBeenCalledWith('payment_status', ['pending', 'partial'])
    })

    it('should apply array processing_status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, {
        processing_status: ['registered', 'slaughtered'] as any,
      })

      expect(mockQuery.in).toHaveBeenCalledWith('processing_status', [
        'registered',
        'slaughtered',
      ])
    })

    it('should apply array distribution_type filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, {
        distribution_type: ['local_pickup', 'full_charity'] as any,
      })

      expect(mockQuery.in).toHaveBeenCalledWith('distribution_type', [
        'local_pickup',
        'full_charity',
      ])
    })

    it('should apply pickup_date filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { pickup_date: '2025-06-07' })

      expect(mockQuery.eq).toHaveBeenCalledWith('pickup_date', '2025-06-07')
    })

    it('should apply has_balance filter with gt()', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { has_balance: true })

      expect(mockQuery.gt).toHaveBeenCalledWith('balance_due', 0)
    })

    it('should apply search filter with or()', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.getShares(orgId, { search: 'Ahmed' })

      expect(mockQuery.or).toHaveBeenCalledWith(
        'guest_name.ilike.%Ahmed%,share_number.ilike.%Ahmed%'
      )
    })
  })

  describe('getShare', () => {
    it('should fetch a single share with relations', async () => {
      const mockShare: Partial<QurbaniShare> = {
        id: 'share-1',
        animal_type: 'sheep' as any,
        member: { id: 'mem-1', first_name: 'Ahmed', last_name: 'Ali', email: null, phone: null },
      }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getShare('share-1')

      expect(supabase.from).toHaveBeenCalledWith('qurbani_shares')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'share-1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockShare)
    })

    it('should return null when share not found (PGRST116)', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getShare('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('createShare', () => {
    const orgId = 'org-123'

    it('should create a share with payment_status pending when no amount_paid', async () => {
      const input: CreateShareInput = {
        campaign_id: 'camp-1',
        animal_type: 'sheep' as any,
        distribution_type: 'local_pickup' as any,
        unit_price: 300,
        total_amount: 300,
      }
      const mockShare = { id: 'new-share', ...input, payment_status: 'pending' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.createShare(orgId, input)

      expect(mockQuery.insert).toHaveBeenCalledWith({
        organization_id: orgId,
        ...input,
        payment_status: 'pending',
      })
      expect(result).toEqual(mockShare)
    })

    it('should create a share with payment_status partial when amount_paid < total_amount', async () => {
      const input: CreateShareInput = {
        campaign_id: 'camp-1',
        animal_type: 'sheep' as any,
        distribution_type: 'local_pickup' as any,
        unit_price: 300,
        total_amount: 300,
        amount_paid: 100,
      }
      const mockShare = { id: 'new-share', ...input, payment_status: 'partial' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.createShare(orgId, input)

      expect(mockQuery.insert).toHaveBeenCalledWith({
        organization_id: orgId,
        ...input,
        payment_status: 'partial',
      })
    })

    it('should create a share with payment_status paid when amount_paid >= total_amount', async () => {
      const input: CreateShareInput = {
        campaign_id: 'camp-1',
        animal_type: 'sheep' as any,
        distribution_type: 'local_pickup' as any,
        unit_price: 300,
        total_amount: 300,
        amount_paid: 300,
      }
      const mockShare = { id: 'new-share', ...input, payment_status: 'paid' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.createShare(orgId, input)

      expect(mockQuery.insert).toHaveBeenCalledWith({
        organization_id: orgId,
        ...input,
        payment_status: 'paid',
      })
    })
  })

  describe('updateShare', () => {
    it('should update a share', async () => {
      const input = { notes: 'Updated notes' }
      const mockShare = { id: 'share-1', ...input }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.updateShare('share-1', input)

      expect(supabase.from).toHaveBeenCalledWith('qurbani_shares')
      expect(mockQuery.update).toHaveBeenCalledWith(input)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'share-1')
      expect(result).toEqual(mockShare)
    })
  })

  describe('deleteShare', () => {
    it('should delete a share', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.deleteShare('share-1')

      expect(supabase.from).toHaveBeenCalledWith('qurbani_shares')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'share-1')
    })
  })

  describe('recordPayment', () => {
    const orgId = 'org-123'

    it('should record a payment and update amount_paid', async () => {
      const existingShare: Partial<QurbaniShare> = {
        id: 'share-1',
        amount_paid: 100,
        total_amount: 300,
      }
      const updatedShare: Partial<QurbaniShare> = {
        id: 'share-1',
        amount_paid: 200,
        payment_status: 'partial' as any,
      }

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // getShare call
          return createMockQueryBuilder({ data: existingShare, error: null })
        }
        // updateShare call
        return createMockQueryBuilder({ data: updatedShare, error: null })
      })

      const input: RecordPaymentInput = {
        share_id: 'share-1',
        amount: 100,
        payment_method: 'cash',
      }

      const result = await qurbaniService.recordPayment(orgId, input)

      expect(result).toEqual(updatedShare)
    })

    it('should transition to paid status when fully paid', async () => {
      const existingShare: Partial<QurbaniShare> = {
        id: 'share-1',
        amount_paid: 200,
        total_amount: 300,
      }
      const updatedShare: Partial<QurbaniShare> = {
        id: 'share-1',
        amount_paid: 300,
        payment_status: 'paid' as any,
      }

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createMockQueryBuilder({ data: existingShare, error: null })
        }
        return createMockQueryBuilder({ data: updatedShare, error: null })
      })

      const input: RecordPaymentInput = {
        share_id: 'share-1',
        amount: 100,
        payment_method: 'card',
        payment_reference: 'TXN-123',
      }

      const result = await qurbaniService.recordPayment(orgId, input)

      expect(result.payment_status).toBe('paid')
    })

    it('should throw error when share not found', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const input: RecordPaymentInput = {
        share_id: 'non-existent',
        amount: 100,
        payment_method: 'cash',
      }

      await expect(qurbaniService.recordPayment(orgId, input)).rejects.toThrow('Share not found')
    })
  })

  describe('updateProcessingStatus', () => {
    it('should set slaughtered_at timestamp when status is slaughtered', async () => {
      const mockShare = { id: 'share-1', processing_status: 'slaughtered' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const beforeTime = new Date().toISOString()
      await qurbaniService.updateProcessingStatus('share-1', 'slaughtered' as any)
      const afterTime = new Date().toISOString()

      expect(mockQuery.update).toHaveBeenCalled()
      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.processing_status).toBe('slaughtered')
      expect(updateCall.slaughtered_at).toBeDefined()
      expect(updateCall.slaughtered_at >= beforeTime).toBe(true)
      expect(updateCall.slaughtered_at <= afterTime).toBe(true)
    })

    it('should set distributed_at timestamp when status is distributed', async () => {
      const mockShare = { id: 'share-1', processing_status: 'distributed' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.updateProcessingStatus('share-1', 'distributed' as any)

      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.processing_status).toBe('distributed')
      expect(updateCall.distributed_at).toBeDefined()
    })

    it('should set distributed_at timestamp when status is completed', async () => {
      const mockShare = { id: 'share-1', processing_status: 'completed' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.updateProcessingStatus('share-1', 'completed' as any)

      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.processing_status).toBe('completed')
      expect(updateCall.distributed_at).toBeDefined()
    })

    it('should not set timestamp for registered status', async () => {
      const mockShare = { id: 'share-1', processing_status: 'registered' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.updateProcessingStatus('share-1', 'registered' as any)

      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.processing_status).toBe('registered')
      expect(updateCall.slaughtered_at).toBeUndefined()
      expect(updateCall.distributed_at).toBeUndefined()
    })
  })

  describe('cancelShare', () => {
    it('should set cancellation fields', async () => {
      const mockShare = { id: 'share-1', status: 'cancelled' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const beforeTime = new Date().toISOString()
      await qurbaniService.cancelShare('share-1', 'Customer requested', 50)
      const afterTime = new Date().toISOString()

      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.status).toBe('cancelled')
      expect(updateCall.cancellation_reason).toBe('Customer requested')
      expect(updateCall.refund_amount).toBe(50)
      expect(updateCall.cancelled_at).toBeDefined()
      expect(updateCall.cancelled_at >= beforeTime).toBe(true)
      expect(updateCall.cancelled_at <= afterTime).toBe(true)
    })

    it('should handle cancellation without refund amount', async () => {
      const mockShare = { id: 'share-1', status: 'cancelled' }
      const mockQuery = createMockQueryBuilder({ data: mockShare, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await qurbaniService.cancelShare('share-1', 'No payment made')

      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.refund_amount).toBeUndefined()
    })
  })

  // ===========================================================================
  // STATISTICS TESTS
  // ===========================================================================

  describe('getCampaignStats', () => {
    const orgId = 'org-123'
    const campaignId = 'camp-1'

    it('should aggregate statistics by all categories', async () => {
      const mockShares = [
        {
          animal_type: 'sheep',
          quantity: 2,
          total_amount: 600,
          amount_paid: 600,
          distribution_type: 'local_pickup',
          payment_status: 'paid',
          processing_status: 'completed',
          status: 'completed',
        },
        {
          animal_type: 'cow',
          quantity: 1,
          total_amount: 500,
          amount_paid: 250,
          distribution_type: 'full_charity',
          payment_status: 'partial',
          processing_status: 'slaughtered',
          status: 'confirmed',
        },
        {
          animal_type: 'sheep',
          quantity: 1,
          total_amount: 300,
          amount_paid: 0,
          distribution_type: 'overseas',
          payment_status: 'pending',
          processing_status: 'registered',
          status: 'pending',
        },
      ]
      const mockQuery = createMockQueryBuilder({ data: mockShares, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getCampaignStats(orgId, campaignId)

      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', orgId)
      expect(mockQuery.eq).toHaveBeenCalledWith('campaign_id', campaignId)
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'cancelled')
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'refunded')

      // Verify totals
      expect(result.total_shares).toBe(4) // 2 + 1 + 1
      expect(result.total_revenue).toBe(1400) // 600 + 500 + 300
      expect(result.total_collected).toBe(850) // 600 + 250 + 0
      expect(result.total_outstanding).toBe(550) // (600-600) + (500-250) + (300-0)

      // Verify by_animal_type
      expect(result.by_animal_type.sheep.count).toBe(3) // 2 + 1
      expect(result.by_animal_type.sheep.amount).toBe(900) // 600 + 300
      expect(result.by_animal_type.cow.count).toBe(1)
      expect(result.by_animal_type.cow.amount).toBe(500)
      expect(result.by_animal_type.camel.count).toBe(0)

      // Verify by_distribution_type
      expect(result.by_distribution_type.local_pickup).toBe(2)
      expect(result.by_distribution_type.full_charity).toBe(1)
      expect(result.by_distribution_type.overseas).toBe(1)
      expect(result.by_distribution_type.hybrid).toBe(0)

      // Verify by_payment_status
      expect(result.by_payment_status.paid).toBe(1)
      expect(result.by_payment_status.partial).toBe(1)
      expect(result.by_payment_status.pending).toBe(1)

      // Verify by_processing_status
      expect(result.by_processing_status.completed).toBe(1)
      expect(result.by_processing_status.slaughtered).toBe(1)
      expect(result.by_processing_status.registered).toBe(1)
    })

    it('should return zero stats when no shares exist', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await qurbaniService.getCampaignStats(orgId, campaignId)

      expect(result.total_shares).toBe(0)
      expect(result.total_revenue).toBe(0)
      expect(result.total_collected).toBe(0)
      expect(result.total_outstanding).toBe(0)
      expect(result.by_animal_type.sheep.count).toBe(0)
      expect(result.by_animal_type.cow.count).toBe(0)
      expect(result.by_animal_type.camel.count).toBe(0)
    })

    it('should throw error on database failure', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Query failed' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(qurbaniService.getCampaignStats(orgId, campaignId)).rejects.toEqual({
        message: 'Query failed',
      })
    })
  })
})
