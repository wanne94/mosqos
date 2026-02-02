import { supabase } from '@/lib/supabase/client'

// Use 'any' cast for tables not yet in database types (migration not run)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any
import type {
  Permission,
  PermissionGroup,
  PermissionGroupSummary,
  GroupMember,
  CreatePermissionGroupInput,
  UpdatePermissionGroupInput,
} from '../types/permissions.types'

const PERMISSIONS_TABLE = 'permissions'
const PERMISSION_GROUPS_TABLE = 'permission_groups'
const PERMISSION_GROUP_PERMISSIONS_TABLE = 'permission_group_permissions'
const PERMISSION_GROUP_MEMBERS_TABLE = 'permission_group_members'
const MEMBERS_TABLE = 'members'

export const permissionsService = {
  // ============================================================================
  // PERMISSIONS (Global)
  // ============================================================================

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await db
      .from(PERMISSIONS_TABLE)
      .select('*')
      .order('module')
      .order('sort_order')

    if (error) throw error
    return (data || []) as Permission[]
  },

  /**
   * Get permissions grouped by module
   */
  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions()
    const grouped: Record<string, Permission[]> = {}

    for (const permission of permissions) {
      if (!grouped[permission.module]) {
        grouped[permission.module] = []
      }
      grouped[permission.module].push(permission)
    }

    return grouped
  },

  // ============================================================================
  // PERMISSION GROUPS
  // ============================================================================

  /**
   * Get all permission groups for an organization with counts
   */
  async getGroups(organizationId: string): Promise<PermissionGroupSummary[]> {
    const { data, error } = await db
      .from(PERMISSION_GROUPS_TABLE)
      .select(`
        id,
        organization_id,
        name,
        description,
        is_system,
        created_at,
        updated_at,
        permission_group_permissions(count),
        permission_group_members(count)
      `)
      .eq('organization_id', organizationId)
      .order('is_system', { ascending: false })
      .order('name')

    if (error) throw error

    return (data || []).map((group: any) => ({
      id: group.id,
      organization_id: group.organization_id,
      name: group.name,
      description: group.description,
      is_system: group.is_system,
      permission_count: group.permission_group_permissions?.[0]?.count || 0,
      member_count: group.permission_group_members?.[0]?.count || 0,
      created_at: group.created_at,
      updated_at: group.updated_at,
    }))
  },

  /**
   * Get a single permission group with its permissions
   */
  async getGroupById(id: string): Promise<PermissionGroup | null> {
    const { data, error } = await db
      .from(PERMISSION_GROUPS_TABLE)
      .select(`
        *,
        permission_group_permissions(
          permission_id,
          permissions(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    const group = data as any
    return {
      id: group.id,
      organization_id: group.organization_id,
      name: group.name,
      description: group.description,
      is_system: group.is_system,
      permissions: (group.permission_group_permissions || [])
        .map((pgp: any) => pgp.permissions)
        .filter(Boolean),
      created_at: group.created_at,
      updated_at: group.updated_at,
      created_by: group.created_by,
      updated_by: group.updated_by,
    }
  },

  /**
   * Create a new permission group
   */
  async createGroup(input: CreatePermissionGroupInput): Promise<PermissionGroup> {
    // Create the group
    const { data: group, error: groupError } = await db
      .from(PERMISSION_GROUPS_TABLE)
      .insert([{
        organization_id: input.organization_id,
        name: input.name,
        description: input.description || null,
        is_system: false,
      }])
      .select()
      .single()

    if (groupError) throw groupError

    // Add permissions to the group
    if (input.permission_ids.length > 0) {
      const permissionAssignments = input.permission_ids.map(permissionId => ({
        permission_group_id: group.id,
        permission_id: permissionId,
      }))

      const { error: permError } = await db
        .from(PERMISSION_GROUP_PERMISSIONS_TABLE)
        .insert(permissionAssignments)

      if (permError) throw permError
    }

    // Return the complete group
    return (await this.getGroupById(group.id))!
  },

  /**
   * Update a permission group
   */
  async updateGroup(id: string, input: UpdatePermissionGroupInput): Promise<PermissionGroup> {
    // Update group details if provided
    if (input.name !== undefined || input.description !== undefined) {
      const updateData: Record<string, unknown> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description

      const { error: groupError } = await db
        .from(PERMISSION_GROUPS_TABLE)
        .update(updateData)
        .eq('id', id)

      if (groupError) throw groupError
    }

    // Update permissions if provided
    if (input.permission_ids !== undefined) {
      // Remove existing permissions
      const { error: deleteError } = await db
        .from(PERMISSION_GROUP_PERMISSIONS_TABLE)
        .delete()
        .eq('permission_group_id', id)

      if (deleteError) throw deleteError

      // Add new permissions
      if (input.permission_ids.length > 0) {
        const permissionAssignments = input.permission_ids.map(permissionId => ({
          permission_group_id: id,
          permission_id: permissionId,
        }))

        const { error: insertError } = await db
          .from(PERMISSION_GROUP_PERMISSIONS_TABLE)
          .insert(permissionAssignments)

        if (insertError) throw insertError
      }
    }

    // Return the updated group
    return (await this.getGroupById(id))!
  },

  /**
   * Delete a permission group
   */
  async deleteGroup(id: string): Promise<void> {
    // Check if it's a system group
    const group = await this.getGroupById(id)
    if (group?.is_system) {
      throw new Error('Cannot delete system permission groups')
    }

    const { error } = await db
      .from(PERMISSION_GROUPS_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Set permissions for a group (replace all)
   */
  async setGroupPermissions(groupId: string, permissionIds: string[]): Promise<void> {
    // Remove existing permissions
    const { error: deleteError } = await db
      .from(PERMISSION_GROUP_PERMISSIONS_TABLE)
      .delete()
      .eq('permission_group_id', groupId)

    if (deleteError) throw deleteError

    // Add new permissions
    if (permissionIds.length > 0) {
      const permissionAssignments = permissionIds.map(permissionId => ({
        permission_group_id: groupId,
        permission_id: permissionId,
      }))

      const { error: insertError } = await db
        .from(PERMISSION_GROUP_PERMISSIONS_TABLE)
        .insert(permissionAssignments)

      if (insertError) throw insertError
    }
  },

  // ============================================================================
  // GROUP MEMBERS
  // ============================================================================

  /**
   * Get members of a permission group
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await db
      .from(PERMISSION_GROUP_MEMBERS_TABLE)
      .select(`
        id,
        member_id,
        permission_group_id,
        assigned_at,
        assigned_by,
        member:members(
          id,
          first_name,
          last_name,
          email,
        )
      `)
      .eq('permission_group_id', groupId)
      .order('assigned_at', { ascending: false })

    if (error) throw error

    return (data || []).map((gm: any) => ({
      id: gm.id,
      member_id: gm.member_id,
      group_id: gm.permission_group_id,
      assigned_at: gm.assigned_at,
      assigned_by: gm.assigned_by,
      member: gm.member,
    }))
  },

  /**
   * Add a member to a permission group
   */
  async addMemberToGroup(groupId: string, memberId: string): Promise<GroupMember> {
    const { data, error } = await db
      .from(PERMISSION_GROUP_MEMBERS_TABLE)
      .insert([{
        permission_group_id: groupId,
        member_id: memberId,
      }])
      .select(`
        id,
        member_id,
        permission_group_id,
        assigned_at,
        assigned_by,
        member:members(
          id,
          first_name,
          last_name,
          email,
        )
      `)
      .single()

    if (error) throw error

    return {
      id: data.id,
      member_id: data.member_id,
      group_id: data.permission_group_id,
      assigned_at: data.assigned_at,
      assigned_by: data.assigned_by,
      member: (data as any).member,
    }
  },

  /**
   * Remove a member from a permission group
   */
  async removeMemberFromGroup(groupId: string, memberId: string): Promise<void> {
    const { error } = await db
      .from(PERMISSION_GROUP_MEMBERS_TABLE)
      .delete()
      .eq('permission_group_id', groupId)
      .eq('member_id', memberId)

    if (error) throw error
  },

  /**
   * Get all groups a member belongs to
   */
  async getMemberGroups(memberId: string): Promise<PermissionGroupSummary[]> {
    const { data, error } = await db
      .from(PERMISSION_GROUP_MEMBERS_TABLE)
      .select(`
        permission_groups(
          id,
          organization_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        )
      `)
      .eq('member_id', memberId)

    if (error) throw error

    return (data || [])
      .map((gm: any) => gm.permission_groups)
      .filter(Boolean)
      .map((group: any) => ({
        id: group.id,
        organization_id: group.organization_id,
        name: group.name,
        description: group.description,
        is_system: group.is_system,
        permission_count: 0, // Would need additional query
        member_count: 0, // Would need additional query
        created_at: group.created_at,
        updated_at: group.updated_at,
      }))
  },

  /**
   * Get members not in a specific group (for adding)
   */
  async getMembersNotInGroup(organizationId: string, groupId: string): Promise<any[]> {
    // Get member IDs already in the group
    const { data: groupMembers, error: gmError } = await db
      .from(PERMISSION_GROUP_MEMBERS_TABLE)
      .select('member_id')
      .eq('permission_group_id', groupId)

    if (gmError) throw gmError

    const existingMemberIds = (groupMembers || []).map((gm: { member_id: string }) => gm.member_id)

    // Get all organization members not in the group
    let query = db
      .from(MEMBERS_TABLE)
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .order('first_name')

    if (existingMemberIds.length > 0) {
      query = query.not('id', 'in', `(${existingMemberIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get all permission codes for a member
   */
  async getMemberPermissionCodes(memberId: string): Promise<string[]> {
    const { data, error } = await db
      .from(PERMISSION_GROUP_MEMBERS_TABLE)
      .select(`
        permission_groups!inner(
          permission_group_permissions(
            permissions(code)
          )
        )
      `)
      .eq('member_id', memberId)

    if (error) throw error

    const codes: string[] = []
    for (const gm of data || []) {
      const group = (gm as any).permission_groups
      if (group?.permission_group_permissions) {
        for (const pgp of group.permission_group_permissions) {
          if (pgp.permissions?.code) {
            codes.push(pgp.permissions.code)
          }
        }
      }
    }

    // Remove duplicates
    return [...new Set(codes)]
  },

  /**
   * Seed default permission groups for a new organization
   * This calls the database function
   */
  async seedDefaultGroups(organizationId: string): Promise<void> {
    const { error } = await db.rpc('seed_default_permission_groups', {
      p_organization_id: organizationId,
    })

    if (error) throw error
  },
}
