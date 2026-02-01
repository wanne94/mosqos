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

import { householdsService } from './households.service'
import { supabase } from '@/lib/supabase/client'

describe('householdsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all households for an organization', async () => {
      const mockHouseholds = [
        {
          id: 'household-1',
          organization_id: 'org-123',
          name: 'Doe Family',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          country: 'USA',
          head_of_household_id: 'member-1',
          members: [
            { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', membership_status: 'active' },
            { id: 'member-2', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', membership_status: 'active' },
          ],
          head: [{ id: 'member-1', first_name: 'John', last_name: 'Doe' }],
        },
        {
          id: 'household-2',
          organization_id: 'org-123',
          name: 'Smith Family',
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          country: 'USA',
          head_of_household_id: null,
          members: [],
          head: [],
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockHouseholds, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.getAll('org-123')

      expect(supabase.from).toHaveBeenCalledWith('households')
      expect(result).toHaveLength(2)
      expect(result[0].member_count).toBe(2)
      expect(result[0].head_of_household).toEqual({ id: 'member-1', first_name: 'John', last_name: 'Doe' })
      expect(result[1].member_count).toBe(0)
      expect(result[1].head_of_household).toBeNull()
    })

    it('should apply filters when provided', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await householdsService.getAll('org-123', {
        search: 'doe',
        city: 'Springfield',
        state: 'IL',
        country: 'USA',
        has_head: true,
      })

      expect(mockQuery.or).toHaveBeenCalled()
    })

    it('should filter by has_head = false', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await householdsService.getAll('org-123', { has_head: false })

      expect(mockQuery.is).toHaveBeenCalledWith('head_of_household_id', null)
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(householdsService.getAll('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('should fetch a single household by ID', async () => {
      const mockHousehold = {
        id: 'household-1',
        organization_id: 'org-123',
        name: 'Doe Family',
        address: '123 Main St',
        members: [
          { id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890', membership_status: 'active', gender: 'male', date_of_birth: '1980-01-01' },
        ],
        head: [{ id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' }],
      }

      const mockQuery = createMockQueryBuilder({ data: mockHousehold, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.getById('household-1')

      expect(result).not.toBeNull()
      expect(result?.member_count).toBe(1)
      expect(result?.head_of_household).toEqual({ id: 'member-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' })
    })

    it('should return null when household not found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.getById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'OTHER_ERROR', message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(householdsService.getById('household-1')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Database error',
      })
    })
  })

  describe('create', () => {
    it('should create a new household', async () => {
      const newHousehold = {
        organization_id: 'org-123',
        name: 'New Family',
        address: '789 Elm St',
        city: 'Springfield',
        state: 'IL',
        country: 'USA',
      }

      const createdHousehold = {
        id: 'household-new',
        ...newHousehold,
        custom_fields: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = createMockQueryBuilder({ data: createdHousehold, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.create(newHousehold)

      expect(result).toEqual(createdHousehold)
    })

    it('should create household with custom fields', async () => {
      const newHousehold = {
        organization_id: 'org-123',
        name: 'New Family',
        custom_fields: { notes: 'Special family' },
      }

      const createdHousehold = {
        id: 'household-new',
        ...newHousehold,
        created_at: new Date().toISOString(),
      }

      const mockQuery = createMockQueryBuilder({ data: createdHousehold, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.create(newHousehold)

      expect(result.custom_fields).toEqual({ notes: 'Special family' })
    })

    it('should throw error when creation fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        householdsService.create({
          organization_id: 'org-123',
          name: 'New Family',
        })
      ).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  describe('update', () => {
    it('should update an existing household', async () => {
      const updateData = { name: 'Updated Family Name' }

      const updatedHousehold = {
        id: 'household-1',
        organization_id: 'org-123',
        name: 'Updated Family Name',
        address: '123 Main St',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedHousehold, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.update('household-1', updateData)

      expect(result).toEqual(updatedHousehold)
    })
  })

  describe('delete', () => {
    it('should delete a household and clear member references', async () => {
      const clearMembersMock = createMockQueryBuilder({ data: null, error: null })
      const deleteMock = createMockQueryBuilder({ data: null, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return clearMembersMock
        return deleteMock
      })

      await expect(householdsService.delete('household-1')).resolves.toBeUndefined()
    })
  })

  describe('addMember', () => {
    it('should add a member to a household', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(householdsService.addMember('household-1', 'member-1')).resolves.toBeUndefined()
      expect(supabase.from).toHaveBeenCalledWith('members')
    })

    it('should throw error when adding member fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(householdsService.addMember('household-1', 'member-1')).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })

  describe('removeMember', () => {
    it('should remove a member from a household', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(householdsService.removeMember('household-1', 'member-1')).resolves.toBeUndefined()
      expect(supabase.from).toHaveBeenCalledWith('members')
    })
  })

  describe('setHeadOfHousehold', () => {
    it('should set head of household', async () => {
      const updatedHousehold = {
        id: 'household-1',
        head_of_household_id: 'member-1',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedHousehold, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.setHeadOfHousehold('household-1', 'member-1')

      expect(result.head_of_household_id).toBe('member-1')
    })

    it('should clear head of household when null', async () => {
      const updatedHousehold = {
        id: 'household-1',
        head_of_household_id: null,
      }

      const mockQuery = createMockQueryBuilder({ data: updatedHousehold, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.setHeadOfHousehold('household-1', null)

      expect(result.head_of_household_id).toBeNull()
    })
  })

  describe('getStats', () => {
    it('should return household statistics', async () => {
      const mockHouseholds = [
        { id: 'household-1', head_of_household_id: 'member-1', members: [{ count: 3 }] },
        { id: 'household-2', head_of_household_id: null, members: [{ count: 2 }] },
        { id: 'household-3', head_of_household_id: 'member-3', members: [{ count: 4 }] },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockHouseholds, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.getStats('org-123')

      expect(result.total).toBe(3)
      expect(result.with_head).toBe(2)
      expect(result.without_head).toBe(1)
      expect(result.average_members).toBe(3) // (3 + 2 + 4) / 3 = 3
    })

    it('should return zero stats when no households', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.getStats('org-123')

      expect(result.total).toBe(0)
      expect(result.with_head).toBe(0)
      expect(result.without_head).toBe(0)
      expect(result.average_members).toBe(0)
    })
  })

  describe('search', () => {
    it('should search households by query', async () => {
      const mockResults = [
        { id: 'household-1', name: 'Doe Family', address: '123 Main St', city: 'Springfield' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockResults, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.search('org-123', 'doe')

      expect(result).toEqual(mockResults)
      expect(mockQuery.limit).toHaveBeenCalledWith(20)
    })

    it('should respect custom limit', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await householdsService.search('org-123', 'doe', 10)

      expect(mockQuery.limit).toHaveBeenCalledWith(10)
    })
  })

  describe('getCities', () => {
    it('should return distinct cities', async () => {
      const mockData = [
        { city: 'Springfield' },
        { city: 'Chicago' },
        { city: 'Springfield' }, // duplicate
        { city: 'Aurora' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockData, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.getCities('org-123')

      expect(result).toHaveLength(3)
      expect(result).toContain('Springfield')
      expect(result).toContain('Chicago')
      expect(result).toContain('Aurora')
      // Should be sorted
      expect(result).toEqual(['Aurora', 'Chicago', 'Springfield'])
    })

    it('should filter out null cities', async () => {
      const mockData = [
        { city: 'Springfield' },
        { city: null },
        { city: '' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockData, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await householdsService.getCities('org-123')

      expect(result).toEqual(['Springfield'])
    })
  })
})
