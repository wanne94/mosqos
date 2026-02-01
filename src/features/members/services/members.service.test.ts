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
  },
}))

import { membersService } from './members.service'
import { supabase } from '@/lib/supabase/client'

describe('membersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all members for an organization', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          organization_id: 'org-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        {
          id: 'member-2',
          organization_id: 'org-123',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockMembers, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await membersService.getAll('org-123')

      expect(supabase.from).toHaveBeenCalledWith('members')
      expect(result).toEqual(mockMembers)
    })

    it('should apply filters when provided', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await membersService.getAll('org-123', {
        membership_status: 'active',
        search: 'john',
      })

      expect(supabase.from).toHaveBeenCalledWith('members')
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Database error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(membersService.getAll('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('should fetch a single member by ID', async () => {
      const mockMember = {
        id: 'member-1',
        organization_id: 'org-123',
        first_name: 'John',
        last_name: 'Doe',
      }

      const mockQuery = createMockQueryBuilder({ data: mockMember, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await membersService.getById('member-1')

      expect(result).toEqual(mockMember)
    })

    it('should return null when member not found', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await membersService.getById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new member', async () => {
      const newMember = {
        organization_id: 'org-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      }

      const createdMember = {
        id: 'member-new',
        ...newMember,
        membership_type: 'individual',
        membership_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = createMockQueryBuilder({ data: createdMember, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await membersService.create(newMember)

      expect(result).toEqual(createdMember)
    })
  })

  describe('update', () => {
    it('should update an existing member', async () => {
      const updateData = {
        first_name: 'Johnny',
      }

      const updatedMember = {
        id: 'member-1',
        organization_id: 'org-123',
        first_name: 'Johnny',
        last_name: 'Doe',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedMember, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await membersService.update('member-1', updateData)

      expect(result).toEqual(updatedMember)
    })
  })

  describe('delete', () => {
    it('should delete a member', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(membersService.delete('member-1')).resolves.toBeUndefined()
    })
  })

  describe('getStats', () => {
    it('should return member statistics', async () => {
      const mockMembers = [
        { id: '1', membership_type: 'individual', membership_status: 'active', gender: 'male', joined_date: '2024-01-01' },
        { id: '2', membership_type: 'family', membership_status: 'active', gender: 'female', joined_date: '2024-01-15' },
        { id: '3', membership_type: 'individual', membership_status: 'inactive', gender: null, joined_date: '2023-12-01' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockMembers, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await membersService.getStats('org-123')

      expect(result).toHaveProperty('total', 3)
      expect(result).toHaveProperty('active', 2)
      expect(result).toHaveProperty('inactive', 1)
    })
  })
})
