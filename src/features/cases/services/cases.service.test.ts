import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helper to create chainable mock query builder
function createMockQueryBuilder(finalResult: { data: any; error: any }) {
  const builder: any = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'is', 'not', 'or', 'gte', 'lte', 'like', 'order', 'limit', 'maybeSingle']

  methods.forEach(method => {
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
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      }),
    },
  },
}))

import { casesService } from './cases.service'
import { supabase } from '@/lib/supabase/client'

describe('casesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all cases for an organization', async () => {
      const mockCases = [
        {
          id: 'case-1',
          organization_id: 'org-123',
          case_number: 'CASE-2024-0001',
          title: 'Financial Assistance',
          description: 'Help with rent',
          status: 'open',
          priority: 'high',
          member_id: 'member-1',
          member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' },
          fund: { id: 'fund-1', name: 'General Fund' },
          assigned_user: null,
        },
        {
          id: 'case-2',
          organization_id: 'org-123',
          case_number: 'CASE-2024-0002',
          title: 'Medical Support',
          description: 'Medical bills assistance',
          status: 'in_progress',
          priority: 'medium',
          member_id: 'member-2',
          member: { id: 'member-2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', phone: '+1234567891' },
          fund: null,
          assigned_user: { id: 'user-1', email: 'worker@example.com' },
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockCases, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getAll('org-123')

      expect(supabase.from).toHaveBeenCalledWith('service_cases')
      expect(result).toEqual(mockCases)
    })

    it('should apply multiple filters', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await casesService.getAll('org-123', {
        search: 'financial',
        case_type: 'financial_assistance',
        category: 'rent',
        status: ['open', 'in_progress'],
        priority: ['high', 'critical'],
        member_id: 'member-1',
        assigned_to: 'user-1',
        fund_id: 'fund-1',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        requires_followup: true,
        is_confidential: false,
        has_amount: true,
      })

      expect(mockQuery.or).toHaveBeenCalled()
      expect(mockQuery.in).toHaveBeenCalled()
    })

    it('should handle single status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await casesService.getAll('org-123', { status: 'open' })

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['open'])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(casesService.getAll('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('should fetch a single case by ID', async () => {
      const mockCase = {
        id: 'case-1',
        case_number: 'CASE-2024-0001',
        title: 'Financial Assistance',
        status: 'open',
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' },
        fund: { id: 'fund-1', name: 'General Fund' },
      }

      const mockQuery = createMockQueryBuilder({ data: mockCase, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getById('case-1')

      expect(result).toEqual(mockCase)
    })

    it('should return null when case not found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new case with generated case number', async () => {
      const newCase = {
        title: 'New Case',
        description: 'Case description',
        member_id: 'member-1',
        case_type: 'financial_assistance',
        priority: 'high' as const,
      }

      // Mock for generateCaseNumber
      const caseNumberMock = createMockQueryBuilder({ data: [], error: null })

      // Mock for create
      const createdCase = {
        id: 'case-new',
        organization_id: 'org-123',
        case_number: 'CASE-2024-0001',
        ...newCase,
        status: 'open',
        disbursed_amount: 0,
        notes_thread: [],
        is_confidential: false,
        requires_followup: false,
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' },
        fund: null,
      }

      const createMock = createMockQueryBuilder({ data: createdCase, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return caseNumberMock
        return createMock
      })

      const result = await casesService.create('org-123', newCase)

      expect(result.case_number).toBe('CASE-2024-0001')
      expect(result.status).toBe('open')
    })

    it('should increment case number if existing cases', async () => {
      const year = new Date().getFullYear()

      // Mock for generateCaseNumber with existing case
      const caseNumberMock = createMockQueryBuilder({
        data: [{ case_number: `CASE-${year}-0005` }],
        error: null,
      })

      // Mock for create
      const createMock = createMockQueryBuilder({
        data: { id: 'case-new', case_number: `CASE-${year}-0006` },
        error: null,
      })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return caseNumberMock
        return createMock
      })

      const result = await casesService.create('org-123', {
        title: 'New Case',
        description: 'Description',
      })

      expect(result.case_number).toBe(`CASE-${year}-0006`)
    })
  })

  describe('update', () => {
    it('should update an existing case', async () => {
      const updateData = { title: 'Updated Title', status: 'in_progress' as const }

      const updatedCase = {
        id: 'case-1',
        title: 'Updated Title',
        status: 'in_progress',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedCase, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.update('case-1', updateData)

      expect(result).toEqual(updatedCase)
    })

    it('should set resolved_date when status is resolved', async () => {
      const mockQuery = createMockQueryBuilder({
        data: { id: 'case-1', status: 'resolved', resolved_date: expect.any(String) },
        error: null,
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await casesService.update('case-1', { status: 'resolved' })

      expect(mockQuery.update).toHaveBeenCalled()
    })

    it('should set closed_at when status is closed', async () => {
      const mockQuery = createMockQueryBuilder({
        data: { id: 'case-1', status: 'closed', closed_at: expect.any(String) },
        error: null,
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await casesService.update('case-1', { status: 'closed' })

      expect(mockQuery.update).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete a case', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(casesService.delete('case-1')).resolves.toBeUndefined()
    })
  })

  describe('assign', () => {
    it('should assign a case to a user', async () => {
      const assignedCase = {
        id: 'case-1',
        assigned_to: 'user-1',
        assigned_at: expect.any(String),
        status: 'in_progress',
      }

      const mockQuery = createMockQueryBuilder({ data: assignedCase, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.assign('case-1', 'user-1')

      expect(result.assigned_to).toBe('user-1')
      expect(result.status).toBe('in_progress')
    })

    it('should unassign a case when userId is null', async () => {
      const unassignedCase = {
        id: 'case-1',
        assigned_to: null,
        assigned_at: null,
        status: 'open',
      }

      const mockQuery = createMockQueryBuilder({ data: unassignedCase, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.assign('case-1', null)

      expect(result.assigned_to).toBeNull()
      expect(result.status).toBe('open')
    })
  })

  describe('updateStatus', () => {
    it('should update case status', async () => {
      const mockQuery = createMockQueryBuilder({
        data: { id: 'case-1', status: 'resolved' },
        error: null,
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.updateStatus('case-1', 'resolved')

      expect(result.status).toBe('resolved')
    })
  })

  describe('addNote', () => {
    it('should add a note to a case', async () => {
      // Mock getById
      const existingCase = {
        id: 'case-1',
        notes_thread: [],
      }

      const getByIdMock = createMockQueryBuilder({ data: existingCase, error: null })

      // Mock update
      const updatedCase = {
        id: 'case-1',
        notes_thread: [
          {
            id: expect.any(String),
            author_id: 'user-123',
            author_name: 'test@example.com',
            content: 'This is a note',
            created_at: expect.any(String),
            is_internal: false,
          },
        ],
      }

      const updateMock = createMockQueryBuilder({ data: updatedCase, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getByIdMock
        return updateMock
      })

      const result = await casesService.addNote({
        case_id: 'case-1',
        content: 'This is a note',
        is_internal: false,
      })

      expect(result.notes_thread).toHaveLength(1)
    })

    it('should throw error when case not found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        casesService.addNote({
          case_id: 'non-existent',
          content: 'Note',
        })
      ).rejects.toThrow('Case not found')
    })
  })

  describe('getStats', () => {
    it('should return case statistics', async () => {
      const mockCases = [
        { id: '1', status: 'open', priority: 'high', case_type: 'financial', category: 'rent', requested_amount: 1000, approved_amount: 800, disbursed_amount: 500, created_at: '2024-01-01', resolved_date: '2024-01-10' },
        { id: '2', status: 'in_progress', priority: 'medium', case_type: 'financial', category: 'medical', requested_amount: 500, approved_amount: 500, disbursed_amount: 0, created_at: '2024-01-05', resolved_date: null },
        { id: '3', status: 'resolved', priority: 'low', case_type: 'counseling', category: null, requested_amount: null, approved_amount: null, disbursed_amount: null, created_at: '2024-01-02', resolved_date: '2024-01-08' },
        { id: '4', status: 'closed', priority: 'high', case_type: 'financial', category: 'rent', requested_amount: 2000, approved_amount: 1500, disbursed_amount: 1500, created_at: '2024-01-03', resolved_date: '2024-01-15' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockCases, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getStats('org-123')

      expect(result.total_cases).toBe(4)
      expect(result.open_cases).toBe(1)
      expect(result.in_progress_cases).toBe(1)
      expect(result.resolved_cases).toBe(1)
      expect(result.closed_cases).toBe(1)
      expect(result.total_requested).toBe(3500)
      expect(result.total_approved).toBe(2800)
      expect(result.total_disbursed).toBe(2000)
      expect(result.by_type).toEqual({ financial: 3, counseling: 1 })
      expect(result.by_category).toEqual({ rent: 2, medical: 1 })
    })

    it('should calculate average resolution days', async () => {
      const mockCases = [
        { id: '1', status: 'resolved', priority: 'high', created_at: '2024-01-01', resolved_date: '2024-01-11' }, // 10 days
        { id: '2', status: 'resolved', priority: 'medium', created_at: '2024-01-01', resolved_date: '2024-01-06' }, // 5 days
      ]

      const mockQuery = createMockQueryBuilder({ data: mockCases, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getStats('org-123')

      expect(result.average_resolution_days).toBe(7.5) // (10 + 5) / 2
    })
  })

  describe('getByMember', () => {
    it('should fetch cases by member ID', async () => {
      const mockCases = [
        { id: 'case-1', member_id: 'member-1', title: 'Case 1' },
        { id: 'case-2', member_id: 'member-1', title: 'Case 2' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockCases, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getByMember('member-1')

      expect(result).toEqual(mockCases)
    })
  })

  describe('getMyAssigned', () => {
    it('should fetch cases assigned to user', async () => {
      const mockCases = [
        { id: 'case-1', assigned_to: 'user-1', status: 'in_progress' },
      ]

      // Need double order mock
      const mockQuery = createMockQueryBuilder({ data: mockCases, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getMyAssigned('user-1')

      expect(result).toEqual(mockCases)
    })
  })

  describe('getRequiringFollowup', () => {
    it('should fetch cases requiring followup', async () => {
      const mockCases = [
        { id: 'case-1', requires_followup: true, followup_date: '2024-01-01', status: 'open' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockCases, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getRequiringFollowup('org-123')

      expect(result).toEqual(mockCases)
    })
  })

  describe('getCaseTypes', () => {
    it('should return distinct case types', async () => {
      const mockData = [
        { case_type: 'financial_assistance' },
        { case_type: 'counseling' },
        { case_type: 'financial_assistance' }, // duplicate
        { case_type: 'medical' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockData, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getCaseTypes('org-123')

      expect(result).toHaveLength(3)
      expect(result).toContain('financial_assistance')
      expect(result).toContain('counseling')
      expect(result).toContain('medical')
    })
  })

  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      const mockData = [
        { category: 'rent' },
        { category: 'medical' },
        { category: 'rent' },
        { category: 'utilities' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockData, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.getCategories('org-123')

      expect(result).toHaveLength(3)
      expect(result).toEqual(['medical', 'rent', 'utilities']) // sorted
    })
  })

  describe('generateCaseNumber', () => {
    it('should generate case number with correct format', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.generateCaseNumber('org-123')

      const year = new Date().getFullYear()
      expect(result).toBe(`CASE-${year}-0001`)
    })

    it('should increment from existing case number', async () => {
      const year = new Date().getFullYear()
      const mockQuery = createMockQueryBuilder({
        data: [{ case_number: `CASE-${year}-0042` }],
        error: null,
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await casesService.generateCaseNumber('org-123')

      expect(result).toBe(`CASE-${year}-0043`)
    })
  })
})
