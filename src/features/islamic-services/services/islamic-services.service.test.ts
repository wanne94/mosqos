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

// Mock the supabase client before importing the service
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

import { islamicServicesService } from './islamic-services.service'
import { supabase } from '@/lib/supabase/client'

describe('islamicServicesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =====================
  // Service Types Tests
  // =====================

  describe('getServiceTypes', () => {
    it('should fetch all service types for an organization', async () => {
      const mockTypes = [
        {
          id: 'type-1',
          organization_id: 'org-123',
          name: 'Nikah',
          slug: 'nikah',
          name_ar: 'نكاح',
          name_tr: 'Nikah',
          default_fee: 200,
          is_active: true,
          sort_order: 1,
        },
        {
          id: 'type-2',
          organization_id: 'org-123',
          name: 'Janazah',
          slug: 'janazah',
          name_ar: 'جنازة',
          name_tr: 'Cenaze',
          default_fee: 0,
          is_active: true,
          sort_order: 2,
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockTypes, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getServiceTypes('org-123')

      expect(supabase.from).toHaveBeenCalledWith('islamic_service_types')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.order).toHaveBeenCalledWith('sort_order', { ascending: true })
      expect(result).toEqual(mockTypes)
    })

    it('should filter for active types only when activeOnly is true', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getServiceTypes('org-123', true)

      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should return empty array when no types found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getServiceTypes('org-123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.getServiceTypes('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getServiceType', () => {
    it('should fetch a single service type by ID', async () => {
      const mockType = {
        id: 'type-1',
        organization_id: 'org-123',
        name: 'Nikah',
        slug: 'nikah',
        default_fee: 200,
      }

      const mockQuery = createMockQueryBuilder({ data: mockType, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getServiceType('type-1')

      expect(supabase.from).toHaveBeenCalledWith('islamic_service_types')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'type-1')
      expect(result).toEqual(mockType)
    })

    it('should return null when service type not found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getServiceType('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Some error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.getServiceType('type-1')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Some error',
      })
    })
  })

  describe('createServiceType', () => {
    it('should create a new service type', async () => {
      const input = {
        organization_id: 'org-123',
        name: 'Aqeeqah',
        slug: 'aqeeqah',
        name_ar: 'عقيقة',
        name_tr: 'Akika',
        default_fee: 100,
        requires_witnesses: false,
        witness_count: 0,
        requires_appointment: true,
        is_active: true,
        sort_order: 4,
      }

      const createdType = { id: 'type-new', ...input }

      const mockQuery = createMockQueryBuilder({ data: createdType, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.createServiceType(input)

      expect(supabase.from).toHaveBeenCalledWith('islamic_service_types')
      expect(mockQuery.insert).toHaveBeenCalledWith([input])
      expect(mockQuery.select).toHaveBeenCalled()
      expect(result).toEqual(createdType)
    })

    it('should throw error when creation fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Creation failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        islamicServicesService.createServiceType({
          organization_id: 'org-123',
          name: 'Test',
          slug: 'test',
        })
      ).rejects.toEqual({ message: 'Creation failed' })
    })
  })

  describe('updateServiceType', () => {
    it('should update an existing service type', async () => {
      const updateData = { name: 'Updated Nikah', default_fee: 250 }
      const updatedType = { id: 'type-1', ...updateData }

      const mockQuery = createMockQueryBuilder({ data: updatedType, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.updateServiceType('type-1', updateData)

      expect(supabase.from).toHaveBeenCalledWith('islamic_service_types')
      expect(mockQuery.update).toHaveBeenCalledWith(updateData)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'type-1')
      expect(result).toEqual(updatedType)
    })

    it('should throw error when update fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        islamicServicesService.updateServiceType('type-1', { name: 'Updated' })
      ).rejects.toEqual({ message: 'Update failed' })
    })
  })

  describe('deleteServiceType', () => {
    it('should delete a service type', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.deleteServiceType('type-1')).resolves.toBeUndefined()

      expect(supabase.from).toHaveBeenCalledWith('islamic_service_types')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'type-1')
    })

    it('should throw error when deletion fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.deleteServiceType('type-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('seedDefaultTypes', () => {
    it('should seed default service types for new organization', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.seedDefaultTypes('org-123')).resolves.toBeUndefined()

      expect(supabase.from).toHaveBeenCalledWith('islamic_service_types')
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ organization_id: 'org-123', name: 'Nikah', slug: 'nikah' }),
          expect.objectContaining({ organization_id: 'org-123', name: 'Janazah', slug: 'janazah' }),
          expect.objectContaining({ organization_id: 'org-123', name: 'Shahada', slug: 'shahada' }),
        ])
      )
    })

    it('should ignore duplicate key errors (23505)', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: '23505' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.seedDefaultTypes('org-123')).resolves.toBeUndefined()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.seedDefaultTypes('org-123')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Database error',
      })
    })
  })

  // =====================
  // Services Tests
  // =====================

  describe('getAll', () => {
    it('should fetch all services for an organization', async () => {
      const mockServices = [
        {
          id: 'service-1',
          organization_id: 'org-123',
          case_number: 'NIK-2024-0001',
          status: 'scheduled',
          service_type: { id: 'type-1', name: 'Nikah', slug: 'nikah' },
          officiant: { id: 'member-1', first_name: 'Imam', last_name: 'Ahmad' },
        },
        {
          id: 'service-2',
          organization_id: 'org-123',
          case_number: 'JAN-2024-0001',
          status: 'completed',
          service_type: { id: 'type-2', name: 'Janazah', slug: 'janazah' },
          officiant: null,
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockServices, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getAll('org-123')

      expect(supabase.from).toHaveBeenCalledWith('islamic_services')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockServices)
    })

    it('should apply status filter when not "all"', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getAll('org-123', { status: 'scheduled' })

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'scheduled')
    })

    it('should not apply status filter when "all"', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getAll('org-123', { status: 'all' })

      // eq should be called for organization_id but not for status
      expect(mockQuery.eq).toHaveBeenCalledTimes(1)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
    })

    it('should apply service_type_id filter when not "all"', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getAll('org-123', { service_type_id: 'type-1' })

      expect(mockQuery.eq).toHaveBeenCalledWith('service_type_id', 'type-1')
    })

    it('should apply search filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getAll('org-123', { search: 'john' })

      expect(mockQuery.or).toHaveBeenCalledWith(
        'case_number.ilike.%john%,requestor_name.ilike.%john%'
      )
    })

    it('should apply date range filters', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getAll('org-123', {
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('scheduled_date', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('scheduled_date', '2024-12-31')
    })

    it('should apply all filters together', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getAll('org-123', {
        status: 'scheduled',
        service_type_id: 'type-1',
        search: 'john',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'scheduled')
      expect(mockQuery.eq).toHaveBeenCalledWith('service_type_id', 'type-1')
      expect(mockQuery.or).toHaveBeenCalled()
      expect(mockQuery.gte).toHaveBeenCalled()
      expect(mockQuery.lte).toHaveBeenCalled()
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.getAll('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('should fetch a single service by ID with relations', async () => {
      const mockService = {
        id: 'service-1',
        organization_id: 'org-123',
        case_number: 'NIK-2024-0001',
        status: 'scheduled',
        fee_amount: 200,
        fee_paid: 100,
        service_type: {
          id: 'type-1',
          name: 'Nikah',
          slug: 'nikah',
          requires_witnesses: true,
          witness_count: 2,
        },
        officiant: { id: 'member-1', first_name: 'Imam', last_name: 'Ahmad' },
      }

      const mockQuery = createMockQueryBuilder({ data: mockService, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getById('service-1')

      expect(supabase.from).toHaveBeenCalledWith('islamic_services')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'service-1')
      expect(result).toEqual(mockService)
    })

    it('should return null when service not found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Some error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.getById('service-1')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Some error',
      })
    })
  })

  describe('create', () => {
    it('should create a new service with generated case number', async () => {
      const input = {
        organization_id: 'org-123',
        service_type_id: 'type-1',
        scheduled_date: '2024-06-15',
        scheduled_time: '14:00',
        location: 'Main Hall',
        requestor_name: 'John Doe',
        requestor_phone: '+1234567890',
      }

      const mockServiceType = {
        id: 'type-1',
        slug: 'nikah',
        default_fee: 200,
      }

      // Mock getServiceType
      const getTypeMock = createMockQueryBuilder({ data: mockServiceType, error: null })

      // Mock RPC for case number generation
      vi.mocked(supabase.rpc).mockResolvedValue({ data: 'NIK-2024-0001', error: null })

      // Mock insert
      const createdService = {
        id: 'service-new',
        ...input,
        case_number: 'NIK-2024-0001',
        fee_amount: 200,
        witnesses: [],
        service_data: {},
        status: 'requested',
        service_type: { id: 'type-1', name: 'Nikah', slug: 'nikah' },
        officiant: null,
      }
      const insertMock = createMockQueryBuilder({ data: createdService, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTypeMock
        return insertMock
      })

      const result = await islamicServicesService.create(input)

      expect(supabase.rpc).toHaveBeenCalledWith('generate_service_case_number', {
        org_id: 'org-123',
        service_slug: 'nikah',
      })
      expect(result.case_number).toBe('NIK-2024-0001')
      expect(result.fee_amount).toBe(200)
    })

    it('should use provided fee_amount instead of default', async () => {
      const input = {
        organization_id: 'org-123',
        service_type_id: 'type-1',
        fee_amount: 300,
      }

      const mockServiceType = { id: 'type-1', slug: 'nikah', default_fee: 200 }
      const getTypeMock = createMockQueryBuilder({ data: mockServiceType, error: null })
      vi.mocked(supabase.rpc).mockResolvedValue({ data: 'NIK-2024-0001', error: null })

      const createdService = { id: 'service-new', ...input, case_number: 'NIK-2024-0001' }
      const insertMock = createMockQueryBuilder({ data: createdService, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTypeMock
        return insertMock
      })

      const result = await islamicServicesService.create(input)

      expect(result.fee_amount).toBe(300)
    })

    it('should throw error when service type is invalid', async () => {
      const getTypeMock = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(getTypeMock)

      await expect(
        islamicServicesService.create({
          organization_id: 'org-123',
          service_type_id: 'invalid-type',
        })
      ).rejects.toThrow('Invalid service type')
    })

    it('should throw error when case number generation fails', async () => {
      const mockServiceType = { id: 'type-1', slug: 'nikah', default_fee: 200 }
      const getTypeMock = createMockQueryBuilder({ data: mockServiceType, error: null })
      vi.mocked(supabase.from).mockReturnValue(getTypeMock)
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      })

      await expect(
        islamicServicesService.create({
          organization_id: 'org-123',
          service_type_id: 'type-1',
        })
      ).rejects.toEqual({ message: 'RPC failed' })
    })
  })

  describe('update', () => {
    it('should update an existing service', async () => {
      const updateData = {
        id: 'service-1',
        location: 'New Location',
        notes: 'Updated notes',
      }

      const updatedService = {
        id: 'service-1',
        location: 'New Location',
        notes: 'Updated notes',
        status: 'scheduled',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedService, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.update(updateData)

      expect(supabase.from).toHaveBeenCalledWith('islamic_services')
      expect(mockQuery.update).toHaveBeenCalledWith({
        location: 'New Location',
        notes: 'Updated notes',
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'service-1')
      expect(result).toEqual(updatedService)
    })

    it('should set completed_at when status is completed', async () => {
      const mockQuery = createMockQueryBuilder({
        data: { id: 'service-1', status: 'completed', completed_at: expect.any(String) },
        error: null,
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.update({ id: 'service-1', status: 'completed' })

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String),
        })
      )
    })

    it('should throw error when update fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        islamicServicesService.update({ id: 'service-1', notes: 'Updated' })
      ).rejects.toEqual({ message: 'Update failed' })
    })
  })

  describe('updateStatus', () => {
    it('should update service status', async () => {
      const mockQuery = createMockQueryBuilder({
        data: { id: 'service-1', status: 'in_progress' },
        error: null,
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.updateStatus('service-1', 'in_progress')

      expect(result.status).toBe('in_progress')
    })
  })

  describe('recordPayment', () => {
    it('should record payment and update fee_status to partial', async () => {
      const existingService = {
        id: 'service-1',
        fee_amount: 200,
        fee_paid: 0,
      }

      // Mock getById
      const getByIdMock = createMockQueryBuilder({ data: existingService, error: null })

      // Mock update
      const updatedService = {
        id: 'service-1',
        fee_amount: 200,
        fee_paid: 100,
        fee_status: 'partial',
      }
      const updateMock = createMockQueryBuilder({ data: updatedService, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getByIdMock
        return updateMock
      })

      const result = await islamicServicesService.recordPayment('service-1', 100)

      expect(result.fee_paid).toBe(100)
      expect(result.fee_status).toBe('partial')
    })

    it('should update fee_status to paid when fully paid', async () => {
      const existingService = {
        id: 'service-1',
        fee_amount: 200,
        fee_paid: 100,
      }

      const getByIdMock = createMockQueryBuilder({ data: existingService, error: null })

      const updatedService = {
        id: 'service-1',
        fee_amount: 200,
        fee_paid: 200,
        fee_status: 'paid',
      }
      const updateMock = createMockQueryBuilder({ data: updatedService, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getByIdMock
        return updateMock
      })

      const result = await islamicServicesService.recordPayment('service-1', 100)

      expect(result.fee_paid).toBe(200)
      expect(result.fee_status).toBe('paid')
    })

    it('should update fee_status to paid when overpaid', async () => {
      const existingService = {
        id: 'service-1',
        fee_amount: 200,
        fee_paid: 150,
      }

      const getByIdMock = createMockQueryBuilder({ data: existingService, error: null })

      const updatedService = {
        id: 'service-1',
        fee_amount: 200,
        fee_paid: 250,
        fee_status: 'paid',
      }
      const updateMock = createMockQueryBuilder({ data: updatedService, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getByIdMock
        return updateMock
      })

      const result = await islamicServicesService.recordPayment('service-1', 100)

      expect(result.fee_status).toBe('paid')
    })

    it('should throw error when service not found', async () => {
      const getByIdMock = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(getByIdMock)

      await expect(islamicServicesService.recordPayment('non-existent', 100)).rejects.toThrow(
        'Service not found'
      )
    })
  })

  describe('issueCertificate', () => {
    it('should issue certificate with generated certificate number', async () => {
      const existingService = {
        id: 'service-1',
        case_number: 'NIK-2024-0001',
      }

      // Mock getById
      const getByIdMock = createMockQueryBuilder({ data: existingService, error: null })

      // Mock update
      const updatedService = {
        id: 'service-1',
        case_number: 'NIK-2024-0001',
        certificate_number: 'CERT-NIK-2024-0001',
        certificate_url: 'https://storage.example.com/cert.pdf',
        certificate_issued_at: expect.any(String),
      }
      const updateMock = createMockQueryBuilder({ data: updatedService, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getByIdMock
        return updateMock
      })

      const result = await islamicServicesService.issueCertificate(
        'service-1',
        'https://storage.example.com/cert.pdf'
      )

      expect(result.certificate_number).toBe('CERT-NIK-2024-0001')
      expect(result.certificate_url).toBe('https://storage.example.com/cert.pdf')
    })

    it('should throw error when service not found', async () => {
      const getByIdMock = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(getByIdMock)

      await expect(
        islamicServicesService.issueCertificate('non-existent', 'https://example.com/cert.pdf')
      ).rejects.toThrow('Service not found')
    })
  })

  describe('delete', () => {
    it('should delete a service', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.delete('service-1')).resolves.toBeUndefined()

      expect(supabase.from).toHaveBeenCalledWith('islamic_services')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'service-1')
    })

    it('should throw error when deletion fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.delete('service-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('getStats', () => {
    it('should return service statistics', async () => {
      const mockServices = [
        { id: '1', status: 'requested', service_type_id: 'type-1', fee_amount: 200, fee_paid: 0 },
        { id: '2', status: 'scheduled', service_type_id: 'type-1', fee_amount: 200, fee_paid: 100 },
        { id: '3', status: 'in_progress', service_type_id: 'type-2', fee_amount: 0, fee_paid: 0 },
        { id: '4', status: 'completed', service_type_id: 'type-1', fee_amount: 200, fee_paid: 200 },
        { id: '5', status: 'completed', service_type_id: 'type-2', fee_amount: 0, fee_paid: 0 },
        { id: '6', status: 'cancelled', service_type_id: 'type-3', fee_amount: 100, fee_paid: 0 },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockServices, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getStats('org-123')

      expect(result.total).toBe(6)
      expect(result.requested).toBe(1)
      expect(result.scheduled).toBe(1)
      expect(result.in_progress).toBe(1)
      expect(result.completed).toBe(2)
      expect(result.cancelled).toBe(1)
      expect(result.by_type).toEqual({
        'type-1': 3,
        'type-2': 2,
        'type-3': 1,
      })
      expect(result.total_fees).toBe(700)
      expect(result.fees_collected).toBe(300)
    })

    it('should handle empty services', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getStats('org-123')

      expect(result.total).toBe(0)
      expect(result.requested).toBe(0)
      expect(result.scheduled).toBe(0)
      expect(result.in_progress).toBe(0)
      expect(result.completed).toBe(0)
      expect(result.cancelled).toBe(0)
      expect(result.by_type).toEqual({})
      expect(result.total_fees).toBe(0)
      expect(result.fees_collected).toBe(0)
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.getStats('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getUpcoming', () => {
    it('should fetch upcoming scheduled services', async () => {
      const mockServices = [
        {
          id: 'service-1',
          status: 'scheduled',
          scheduled_date: '2024-06-15',
          scheduled_time: '10:00',
          service_type: { id: 'type-1', name: 'Nikah', slug: 'nikah' },
        },
        {
          id: 'service-2',
          status: 'in_progress',
          scheduled_date: '2024-06-16',
          scheduled_time: '14:00',
          service_type: { id: 'type-2', name: 'Janazah', slug: 'janazah' },
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockServices, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await islamicServicesService.getUpcoming('org-123')

      expect(supabase.from).toHaveBeenCalledWith('islamic_services')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.in).toHaveBeenCalledWith('status', ['scheduled', 'in_progress'])
      expect(mockQuery.gte).toHaveBeenCalledWith('scheduled_date', expect.any(String))
      expect(mockQuery.order).toHaveBeenCalledWith('scheduled_date', { ascending: true })
      expect(mockQuery.order).toHaveBeenCalledWith('scheduled_time', { ascending: true })
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockServices)
    })

    it('should apply custom limit', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await islamicServicesService.getUpcoming('org-123', 5)

      expect(mockQuery.limit).toHaveBeenCalledWith(5)
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(islamicServicesService.getUpcoming('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })
})
