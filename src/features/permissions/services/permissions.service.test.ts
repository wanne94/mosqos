import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

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

  methods.forEach(method => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

import { permissionsService } from './permissions.service'
import { supabase } from '@/lib/supabase/client'

describe('permissionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // PERMISSIONS (Global)
  // ============================================================================

  describe('getAllPermissions', () => {
    it('should return all permissions ordered by module and sort_order', async () => {
      const mockPermissions = [
        { id: 'p1', code: 'members:view', name: 'View Members', module: 'members', sort_order: 1 },
        { id: 'p2', code: 'members:create', name: 'Create Members', module: 'members', sort_order: 2 },
        { id: 'p3', code: 'donations:view', name: 'View Donations', module: 'donations', sort_order: 1 },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockPermissions, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getAllPermissions()

      expect(supabase.from).toHaveBeenCalledWith('permissions')
      expect(mockBuilder.select).toHaveBeenCalledWith('*')
      expect(mockBuilder.order).toHaveBeenCalledWith('module')
      expect(mockBuilder.order).toHaveBeenCalledWith('sort_order')
      expect(result).toEqual(mockPermissions)
    })

    it('should return empty array when no permissions exist', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getAllPermissions()

      expect(result).toEqual([])
    })

    it('should throw error when database fails', async () => {
      const mockError = { message: 'Database error', code: 'DB001' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.getAllPermissions()).rejects.toEqual(mockError)
    })
  })

  describe('getPermissionsByModule', () => {
    it('should return permissions grouped by module', async () => {
      const mockPermissions = [
        { id: 'p1', code: 'members:view', name: 'View Members', module: 'members', sort_order: 1 },
        { id: 'p2', code: 'members:create', name: 'Create Members', module: 'members', sort_order: 2 },
        { id: 'p3', code: 'donations:view', name: 'View Donations', module: 'donations', sort_order: 1 },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockPermissions, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getPermissionsByModule()

      expect(result).toEqual({
        members: [mockPermissions[0], mockPermissions[1]],
        donations: [mockPermissions[2]],
      })
    })

    it('should return empty object when no permissions exist', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getPermissionsByModule()

      expect(result).toEqual({})
    })
  })

  // ============================================================================
  // PERMISSION GROUPS
  // ============================================================================

  describe('getGroups', () => {
    const organizationId = 'org-123'

    it('should return groups with permission and member counts', async () => {
      const mockGroups = [
        {
          id: 'g1',
          organization_id: organizationId,
          name: 'Administrators',
          description: 'Full access',
          is_system: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          permission_group_permissions: [{ count: 10 }],
          permission_group_members: [{ count: 5 }],
        },
        {
          id: 'g2',
          organization_id: organizationId,
          name: 'Viewers',
          description: 'Read only',
          is_system: false,
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
          permission_group_permissions: [{ count: 3 }],
          permission_group_members: [{ count: 2 }],
        },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockGroups, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getGroups(organizationId)

      expect(supabase.from).toHaveBeenCalledWith('permission_groups')
      expect(mockBuilder.eq).toHaveBeenCalledWith('organization_id', organizationId)
      expect(result).toEqual([
        {
          id: 'g1',
          organization_id: organizationId,
          name: 'Administrators',
          description: 'Full access',
          is_system: true,
          permission_count: 10,
          member_count: 5,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'g2',
          organization_id: organizationId,
          name: 'Viewers',
          description: 'Read only',
          is_system: false,
          permission_count: 3,
          member_count: 2,
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
        },
      ])
    })

    it('should handle missing count data', async () => {
      const mockGroups = [
        {
          id: 'g1',
          organization_id: organizationId,
          name: 'Empty Group',
          description: null,
          is_system: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          permission_group_permissions: null,
          permission_group_members: [],
        },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockGroups, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getGroups(organizationId)

      expect(result[0].permission_count).toBe(0)
      expect(result[0].member_count).toBe(0)
    })

    it('should throw error when database fails', async () => {
      const mockError = { message: 'Database error' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.getGroups(organizationId)).rejects.toEqual(mockError)
    })
  })

  describe('getGroupById', () => {
    const groupId = 'group-123'

    it('should return group with permissions', async () => {
      const mockGroup = {
        id: groupId,
        organization_id: 'org-123',
        name: 'Finance Team',
        description: 'Finance access',
        is_system: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        created_by: 'user-1',
        updated_by: 'user-2',
        permission_group_permissions: [
          { permission_id: 'p1', permissions: { id: 'p1', code: 'donations:view', name: 'View Donations' } },
          { permission_id: 'p2', permissions: { id: 'p2', code: 'donations:create', name: 'Create Donations' } },
        ],
      }

      const mockBuilder = createMockQueryBuilder({ data: mockGroup, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getGroupById(groupId)

      expect(supabase.from).toHaveBeenCalledWith('permission_groups')
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', groupId)
      expect(mockBuilder.single).toHaveBeenCalled()
      expect(result).toEqual({
        id: groupId,
        organization_id: 'org-123',
        name: 'Finance Team',
        description: 'Finance access',
        is_system: false,
        permissions: [
          { id: 'p1', code: 'donations:view', name: 'View Donations' },
          { id: 'p2', code: 'donations:create', name: 'Create Donations' },
        ],
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        created_by: 'user-1',
        updated_by: 'user-2',
      })
    })

    it('should return null when group not found (PGRST116)', async () => {
      const mockError = { code: 'PGRST116', message: 'Row not found' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      mockBuilder.single = vi.fn().mockResolvedValue({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getGroupById(groupId)

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockError = { code: 'OTHER', message: 'Database error' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      mockBuilder.single = vi.fn().mockResolvedValue({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.getGroupById(groupId)).rejects.toEqual(mockError)
    })

    it('should filter out null permissions', async () => {
      const mockGroup = {
        id: groupId,
        organization_id: 'org-123',
        name: 'Test Group',
        description: null,
        is_system: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        created_by: null,
        updated_by: null,
        permission_group_permissions: [
          { permission_id: 'p1', permissions: { id: 'p1', code: 'members:view' } },
          { permission_id: 'p2', permissions: null },
        ],
      }

      const mockBuilder = createMockQueryBuilder({ data: mockGroup, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getGroupById(groupId)

      expect(result?.permissions).toHaveLength(1)
      expect(result?.permissions[0].id).toBe('p1')
    })
  })

  describe('createGroup', () => {
    const mockInput = {
      organization_id: 'org-123',
      name: 'Custom Group',
      description: 'A custom group',
      permission_ids: ['p1', 'p2'],
    }

    it('should create group and add permissions', async () => {
      const createdGroup = {
        id: 'new-group-id',
        organization_id: mockInput.organization_id,
        name: mockInput.name,
        description: mockInput.description,
        is_system: false,
      }

      const fullGroup = {
        ...createdGroup,
        permissions: [
          { id: 'p1', code: 'members:view' },
          { id: 'p2', code: 'members:create' },
        ],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        created_by: null,
        updated_by: null,
      }

      // Mock for createGroup insert
      const insertBuilder = createMockQueryBuilder({ data: createdGroup, error: null })
      // Mock for permission assignments insert
      const permInsertBuilder = createMockQueryBuilder({ data: null, error: null })
      // Mock for getGroupById
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          ...createdGroup,
          permission_group_permissions: [
            { permission_id: 'p1', permissions: { id: 'p1', code: 'members:view' } },
            { permission_id: 'p2', permissions: { id: 'p2', code: 'members:create' } },
          ],
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation((table: string) => {
        callCount++
        if (table === 'permission_groups') {
          return callCount === 1 ? insertBuilder : getGroupBuilder
        }
        return permInsertBuilder
      })

      const result = await permissionsService.createGroup(mockInput)

      expect(supabase.from).toHaveBeenCalledWith('permission_groups')
      expect(insertBuilder.insert).toHaveBeenCalledWith([
        {
          organization_id: mockInput.organization_id,
          name: mockInput.name,
          description: mockInput.description,
          is_system: false,
        },
      ])
      expect(supabase.from).toHaveBeenCalledWith('permission_group_permissions')
      expect(permInsertBuilder.insert).toHaveBeenCalledWith([
        { permission_group_id: 'new-group-id', permission_id: 'p1' },
        { permission_group_id: 'new-group-id', permission_id: 'p2' },
      ])
      expect(result.id).toBe('new-group-id')
      expect(result.permissions).toHaveLength(2)
    })

    it('should create group without permissions when permission_ids is empty', async () => {
      const inputWithoutPermissions = {
        ...mockInput,
        permission_ids: [],
      }

      const createdGroup = {
        id: 'new-group-id',
        organization_id: inputWithoutPermissions.organization_id,
        name: inputWithoutPermissions.name,
        description: inputWithoutPermissions.description,
        is_system: false,
      }

      const insertBuilder = createMockQueryBuilder({ data: createdGroup, error: null })
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          ...createdGroup,
          permission_group_permissions: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation((table: string) => {
        callCount++
        if (table === 'permission_groups') {
          return callCount === 1 ? insertBuilder : getGroupBuilder
        }
        throw new Error('Should not be called for permission_group_permissions')
      })

      const result = await permissionsService.createGroup(inputWithoutPermissions)

      expect(result.id).toBe('new-group-id')
      expect(result.permissions).toHaveLength(0)
    })

    it('should throw error when group creation fails', async () => {
      const mockError = { message: 'Insert failed' }
      const insertBuilder = createMockQueryBuilder({ data: null, error: null })
      insertBuilder.single = vi.fn().mockResolvedValue({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(insertBuilder)

      await expect(permissionsService.createGroup(mockInput)).rejects.toEqual(mockError)
    })

    it('should throw error when permission assignment fails', async () => {
      const createdGroup = { id: 'new-group-id' }
      const insertBuilder = createMockQueryBuilder({ data: createdGroup, error: null })
      const permError = { message: 'Permission insert failed' }
      const permInsertBuilder = createMockQueryBuilder({ data: null, error: permError })

      ;(supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'permission_groups') return insertBuilder
        return permInsertBuilder
      })

      await expect(permissionsService.createGroup(mockInput)).rejects.toEqual(permError)
    })
  })

  describe('updateGroup', () => {
    const groupId = 'group-123'

    it('should update group name and description', async () => {
      const input = { name: 'Updated Name', description: 'Updated description' }

      const updateBuilder = createMockQueryBuilder({ data: null, error: null })
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          id: groupId,
          name: input.name,
          description: input.description,
          permission_group_permissions: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? updateBuilder : getGroupBuilder
      })

      const result = await permissionsService.updateGroup(groupId, input)

      expect(updateBuilder.update).toHaveBeenCalledWith({
        name: input.name,
        description: input.description,
      })
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', groupId)
      expect(result.name).toBe(input.name)
    })

    it('should update permissions when provided', async () => {
      const input = { permission_ids: ['p1', 'p2'] }

      const deleteBuilder = createMockQueryBuilder({ data: null, error: null })
      const insertBuilder = createMockQueryBuilder({ data: null, error: null })
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          id: groupId,
          name: 'Group',
          permission_group_permissions: [
            { permission_id: 'p1', permissions: { id: 'p1' } },
            { permission_id: 'p2', permissions: { id: 'p2' } },
          ],
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation((table: string) => {
        callCount++
        if (table === 'permission_group_permissions') {
          return callCount === 1 ? deleteBuilder : insertBuilder
        }
        return getGroupBuilder
      })

      const result = await permissionsService.updateGroup(groupId, input)

      expect(deleteBuilder.delete).toHaveBeenCalled()
      expect(deleteBuilder.eq).toHaveBeenCalledWith('permission_group_id', groupId)
      expect(insertBuilder.insert).toHaveBeenCalledWith([
        { permission_group_id: groupId, permission_id: 'p1' },
        { permission_group_id: groupId, permission_id: 'p2' },
      ])
      expect(result.permissions).toHaveLength(2)
    })

    it('should handle empty permission_ids array', async () => {
      const input = { permission_ids: [] }

      const deleteBuilder = createMockQueryBuilder({ data: null, error: null })
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          id: groupId,
          name: 'Group',
          permission_group_permissions: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      ;(supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'permission_group_permissions') return deleteBuilder
        return getGroupBuilder
      })

      const result = await permissionsService.updateGroup(groupId, input)

      expect(deleteBuilder.delete).toHaveBeenCalled()
      expect(result.permissions).toHaveLength(0)
    })

    it('should throw error when update fails', async () => {
      const input = { name: 'Updated' }
      const mockError = { message: 'Update failed' }
      const updateBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(updateBuilder)

      await expect(permissionsService.updateGroup(groupId, input)).rejects.toEqual(mockError)
    })

    it('should throw error when permission delete fails', async () => {
      const input = { permission_ids: ['p1'] }
      const deleteError = { message: 'Delete failed' }
      const deleteBuilder = createMockQueryBuilder({ data: null, error: deleteError })
      ;(supabase.from as Mock).mockReturnValue(deleteBuilder)

      await expect(permissionsService.updateGroup(groupId, input)).rejects.toEqual(deleteError)
    })
  })

  describe('deleteGroup', () => {
    const groupId = 'group-123'

    it('should delete non-system group', async () => {
      // Mock getGroupById returning a non-system group
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          id: groupId,
          is_system: false,
          permission_group_permissions: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      const deleteBuilder = createMockQueryBuilder({ data: null, error: null })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? getGroupBuilder : deleteBuilder
      })

      await permissionsService.deleteGroup(groupId)

      expect(deleteBuilder.delete).toHaveBeenCalled()
      expect(deleteBuilder.eq).toHaveBeenCalledWith('id', groupId)
    })

    it('should throw error when trying to delete system group', async () => {
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          id: groupId,
          is_system: true,
          permission_group_permissions: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      ;(supabase.from as Mock).mockReturnValue(getGroupBuilder)

      await expect(permissionsService.deleteGroup(groupId)).rejects.toThrow(
        'Cannot delete system permission groups'
      )
    })

    it('should throw error when delete fails', async () => {
      const getGroupBuilder = createMockQueryBuilder({ data: null, error: null })
      getGroupBuilder.single = vi.fn().mockResolvedValue({
        data: {
          id: groupId,
          is_system: false,
          permission_group_permissions: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          created_by: null,
          updated_by: null,
        },
        error: null,
      })

      const deleteError = { message: 'Delete failed' }
      const deleteBuilder = createMockQueryBuilder({ data: null, error: deleteError })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? getGroupBuilder : deleteBuilder
      })

      await expect(permissionsService.deleteGroup(groupId)).rejects.toEqual(deleteError)
    })
  })

  describe('setGroupPermissions', () => {
    const groupId = 'group-123'

    it('should replace all permissions for a group', async () => {
      const permissionIds = ['p1', 'p2', 'p3']

      const deleteBuilder = createMockQueryBuilder({ data: null, error: null })
      const insertBuilder = createMockQueryBuilder({ data: null, error: null })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? deleteBuilder : insertBuilder
      })

      await permissionsService.setGroupPermissions(groupId, permissionIds)

      expect(deleteBuilder.delete).toHaveBeenCalled()
      expect(deleteBuilder.eq).toHaveBeenCalledWith('permission_group_id', groupId)
      expect(insertBuilder.insert).toHaveBeenCalledWith([
        { permission_group_id: groupId, permission_id: 'p1' },
        { permission_group_id: groupId, permission_id: 'p2' },
        { permission_group_id: groupId, permission_id: 'p3' },
      ])
    })

    it('should only delete when permissionIds is empty', async () => {
      const deleteBuilder = createMockQueryBuilder({ data: null, error: null })
      ;(supabase.from as Mock).mockReturnValue(deleteBuilder)

      await permissionsService.setGroupPermissions(groupId, [])

      expect(deleteBuilder.delete).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledTimes(1)
    })

    it('should throw error when delete fails', async () => {
      const deleteError = { message: 'Delete failed' }
      const deleteBuilder = createMockQueryBuilder({ data: null, error: deleteError })
      ;(supabase.from as Mock).mockReturnValue(deleteBuilder)

      await expect(permissionsService.setGroupPermissions(groupId, ['p1'])).rejects.toEqual(
        deleteError
      )
    })

    it('should throw error when insert fails', async () => {
      const deleteBuilder = createMockQueryBuilder({ data: null, error: null })
      const insertError = { message: 'Insert failed' }
      const insertBuilder = createMockQueryBuilder({ data: null, error: insertError })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? deleteBuilder : insertBuilder
      })

      await expect(permissionsService.setGroupPermissions(groupId, ['p1'])).rejects.toEqual(
        insertError
      )
    })
  })

  // ============================================================================
  // GROUP MEMBERS
  // ============================================================================

  describe('getGroupMembers', () => {
    const groupId = 'group-123'

    it('should return members of a group', async () => {
      const mockMembers = [
        {
          id: 'gm1',
          member_id: 'm1',
          permission_group_id: groupId,
          assigned_at: '2024-01-01',
          assigned_by: 'admin1',
          member: {
            id: 'm1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            photo_url: null,
          },
        },
        {
          id: 'gm2',
          member_id: 'm2',
          permission_group_id: groupId,
          assigned_at: '2024-01-02',
          assigned_by: null,
          member: {
            id: 'm2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            photo_url: 'https://example.com/photo.jpg',
          },
        },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockMembers, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getGroupMembers(groupId)

      expect(supabase.from).toHaveBeenCalledWith('permission_group_members')
      expect(mockBuilder.eq).toHaveBeenCalledWith('permission_group_id', groupId)
      expect(result).toEqual([
        {
          id: 'gm1',
          member_id: 'm1',
          group_id: groupId,
          assigned_at: '2024-01-01',
          assigned_by: 'admin1',
          member: mockMembers[0].member,
        },
        {
          id: 'gm2',
          member_id: 'm2',
          group_id: groupId,
          assigned_at: '2024-01-02',
          assigned_by: null,
          member: mockMembers[1].member,
        },
      ])
    })

    it('should return empty array when no members', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getGroupMembers(groupId)

      expect(result).toEqual([])
    })

    it('should throw error when database fails', async () => {
      const mockError = { message: 'Database error' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.getGroupMembers(groupId)).rejects.toEqual(mockError)
    })
  })

  describe('addMemberToGroup', () => {
    const groupId = 'group-123'
    const memberId = 'member-456'

    it('should add member to group and return assignment', async () => {
      const mockResult = {
        id: 'assignment-1',
        member_id: memberId,
        permission_group_id: groupId,
        assigned_at: '2024-01-01',
        assigned_by: 'admin-1',
        member: {
          id: memberId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          photo_url: null,
        },
      }

      const mockBuilder = createMockQueryBuilder({ data: mockResult, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.addMemberToGroup(groupId, memberId)

      expect(supabase.from).toHaveBeenCalledWith('permission_group_members')
      expect(mockBuilder.insert).toHaveBeenCalledWith([
        { permission_group_id: groupId, member_id: memberId },
      ])
      expect(result).toEqual({
        id: 'assignment-1',
        member_id: memberId,
        group_id: groupId,
        assigned_at: '2024-01-01',
        assigned_by: 'admin-1',
        member: mockResult.member,
      })
    })

    it('should throw error when insert fails', async () => {
      const mockError = { message: 'Insert failed' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      mockBuilder.single = vi.fn().mockResolvedValue({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.addMemberToGroup(groupId, memberId)).rejects.toEqual(
        mockError
      )
    })
  })

  describe('removeMemberFromGroup', () => {
    const groupId = 'group-123'
    const memberId = 'member-456'

    it('should remove member from group', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await permissionsService.removeMemberFromGroup(groupId, memberId)

      expect(supabase.from).toHaveBeenCalledWith('permission_group_members')
      expect(mockBuilder.delete).toHaveBeenCalled()
      expect(mockBuilder.eq).toHaveBeenCalledWith('permission_group_id', groupId)
      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', memberId)
    })

    it('should throw error when delete fails', async () => {
      const mockError = { message: 'Delete failed' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.removeMemberFromGroup(groupId, memberId)).rejects.toEqual(
        mockError
      )
    })
  })

  describe('getMemberGroups', () => {
    const memberId = 'member-123'

    it('should return groups the member belongs to', async () => {
      const mockData = [
        {
          permission_groups: {
            id: 'g1',
            organization_id: 'org-1',
            name: 'Administrators',
            description: 'Full access',
            is_system: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
        {
          permission_groups: {
            id: 'g2',
            organization_id: 'org-1',
            name: 'Finance',
            description: 'Finance access',
            is_system: false,
            created_at: '2024-01-02',
            updated_at: '2024-01-02',
          },
        },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getMemberGroups(memberId)

      expect(supabase.from).toHaveBeenCalledWith('permission_group_members')
      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', memberId)
      expect(result).toEqual([
        {
          id: 'g1',
          organization_id: 'org-1',
          name: 'Administrators',
          description: 'Full access',
          is_system: true,
          permission_count: 0,
          member_count: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'g2',
          organization_id: 'org-1',
          name: 'Finance',
          description: 'Finance access',
          is_system: false,
          permission_count: 0,
          member_count: 0,
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
        },
      ])
    })

    it('should filter out null groups', async () => {
      const mockData = [
        { permission_groups: { id: 'g1', name: 'Valid' } },
        { permission_groups: null },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getMemberGroups(memberId)

      expect(result).toHaveLength(1)
    })

    it('should throw error when database fails', async () => {
      const mockError = { message: 'Database error' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.getMemberGroups(memberId)).rejects.toEqual(mockError)
    })
  })

  describe('getMembersNotInGroup', () => {
    const organizationId = 'org-123'
    const groupId = 'group-456'

    it('should return members not in the group', async () => {
      const existingMembers = [{ member_id: 'm1' }, { member_id: 'm2' }]

      const allMembers = [
        { id: 'm3', first_name: 'New', last_name: 'Member', email: 'new@example.com', photo_url: null },
        { id: 'm4', first_name: 'Another', last_name: 'User', email: 'another@example.com', photo_url: null },
      ]

      const groupMembersBuilder = createMockQueryBuilder({ data: existingMembers, error: null })
      const membersBuilder = createMockQueryBuilder({ data: allMembers, error: null })

      let callCount = 0
      ;(supabase.from as Mock).mockImplementation((table: string) => {
        callCount++
        if (table === 'permission_group_members') return groupMembersBuilder
        return membersBuilder
      })

      const result = await permissionsService.getMembersNotInGroup(organizationId, groupId)

      expect(supabase.from).toHaveBeenCalledWith('permission_group_members')
      expect(groupMembersBuilder.eq).toHaveBeenCalledWith('permission_group_id', groupId)
      expect(supabase.from).toHaveBeenCalledWith('members')
      expect(membersBuilder.eq).toHaveBeenCalledWith('organization_id', organizationId)
      expect(membersBuilder.not).toHaveBeenCalledWith('id', 'in', '(m1,m2)')
      expect(result).toEqual(allMembers)
    })

    it('should not filter when no existing members', async () => {
      const groupMembersBuilder = createMockQueryBuilder({ data: [], error: null })
      const allMembers = [{ id: 'm1', first_name: 'John', last_name: 'Doe' }]
      const membersBuilder = createMockQueryBuilder({ data: allMembers, error: null })

      ;(supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'permission_group_members') return groupMembersBuilder
        return membersBuilder
      })

      const result = await permissionsService.getMembersNotInGroup(organizationId, groupId)

      expect(membersBuilder.not).not.toHaveBeenCalled()
      expect(result).toEqual(allMembers)
    })

    it('should throw error when group members query fails', async () => {
      const mockError = { message: 'Query failed' }
      const groupMembersBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(groupMembersBuilder)

      await expect(permissionsService.getMembersNotInGroup(organizationId, groupId)).rejects.toEqual(
        mockError
      )
    })

    it('should throw error when members query fails', async () => {
      const groupMembersBuilder = createMockQueryBuilder({ data: [], error: null })
      const mockError = { message: 'Members query failed' }
      const membersBuilder = createMockQueryBuilder({ data: null, error: mockError })

      ;(supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'permission_group_members') return groupMembersBuilder
        return membersBuilder
      })

      await expect(permissionsService.getMembersNotInGroup(organizationId, groupId)).rejects.toEqual(
        mockError
      )
    })
  })

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('getMemberPermissionCodes', () => {
    const memberId = 'member-123'

    it('should return all unique permission codes for a member', async () => {
      const mockData = [
        {
          permission_groups: {
            permission_group_permissions: [
              { permissions: { code: 'members:view' } },
              { permissions: { code: 'members:create' } },
            ],
          },
        },
        {
          permission_groups: {
            permission_group_permissions: [
              { permissions: { code: 'donations:view' } },
              { permissions: { code: 'members:view' } }, // duplicate
            ],
          },
        },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getMemberPermissionCodes(memberId)

      expect(supabase.from).toHaveBeenCalledWith('permission_group_members')
      expect(mockBuilder.eq).toHaveBeenCalledWith('member_id', memberId)
      expect(result).toEqual(['members:view', 'members:create', 'donations:view'])
      // Verify duplicates are removed
      expect(result.filter(c => c === 'members:view')).toHaveLength(1)
    })

    it('should return empty array when member has no groups', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getMemberPermissionCodes(memberId)

      expect(result).toEqual([])
    })

    it('should handle null permission codes gracefully', async () => {
      const mockData = [
        {
          permission_groups: {
            permission_group_permissions: [
              { permissions: { code: 'members:view' } },
              { permissions: null },
              { permissions: { code: null } },
            ],
          },
        },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getMemberPermissionCodes(memberId)

      expect(result).toEqual(['members:view'])
    })

    it('should handle null permission_group_permissions gracefully', async () => {
      const mockData = [
        {
          permission_groups: {
            permission_group_permissions: null,
          },
        },
      ]

      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      const result = await permissionsService.getMemberPermissionCodes(memberId)

      expect(result).toEqual([])
    })

    it('should throw error when database fails', async () => {
      const mockError = { message: 'Database error' }
      const mockBuilder = createMockQueryBuilder({ data: null, error: mockError })
      ;(supabase.from as Mock).mockReturnValue(mockBuilder)

      await expect(permissionsService.getMemberPermissionCodes(memberId)).rejects.toEqual(mockError)
    })
  })

  describe('seedDefaultGroups', () => {
    const organizationId = 'org-123'

    it('should call RPC to seed default groups', async () => {
      ;(supabase.rpc as Mock).mockResolvedValue({ data: null, error: null })

      await permissionsService.seedDefaultGroups(organizationId)

      expect(supabase.rpc).toHaveBeenCalledWith('seed_default_permission_groups', {
        p_organization_id: organizationId,
      })
    })

    it('should throw error when RPC fails', async () => {
      const mockError = { message: 'RPC failed' }
      ;(supabase.rpc as Mock).mockResolvedValue({ data: null, error: mockError })

      await expect(permissionsService.seedDefaultGroups(organizationId)).rejects.toEqual(mockError)
    })
  })
})
