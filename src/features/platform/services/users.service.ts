/**
 * Users Service for Platform Admin
 *
 * API calls for user management in platform admin
 */

import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  UserWithOrganizations,
  UserDetail,
  UserFilters,
  ImamInfo,
  ImamFilters,
  UserRole
} from '../types/user.types'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

export const usersService = {
  /**
   * Get all users with their organization memberships
   */
  async getAll(filters?: UserFilters): Promise<UserWithOrganizations[]> {
    // Get owners
    const { data: owners, error: ownersError } = await db
      .from('organization_owners')
      .select(`
        user_id,
        created_at,
        organizations (id, name, slug)
      `)

    if (ownersError) throw ownersError

    // Get delegates
    const { data: delegates, error: delegatesError } = await db
      .from('organization_delegates')
      .select(`
        user_id,
        created_at,
        organizations (id, name, slug)
      `)

    if (delegatesError) throw delegatesError

    // Get members with user_id (linked accounts)
    const { data: members, error: membersError } = await db
      .from('members')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        created_at,
        organization_id,
        organizations (id, name, slug)
      `)
      .not('user_id', 'is', null)

    if (membersError) throw membersError

    // Build user map
    const userMap = new Map<string, UserWithOrganizations>()

    // Process owners
    for (const owner of owners || []) {
      if (!owner.user_id) continue

      if (!userMap.has(owner.user_id)) {
        userMap.set(owner.user_id, {
          id: owner.user_id,
          email: '',
          created_at: owner.created_at,
          last_sign_in_at: null,
          email_confirmed_at: null,
          user_metadata: {},
          organizations: [],
          is_active: true,
        })
      }

      const user = userMap.get(owner.user_id)!
      const org = owner.organizations as unknown as { id: string; name: string; slug: string } | null
      if (org) {
        user.organizations.push({
          organization_id: org.id,
          organization_name: org.name,
          organization_slug: org.slug,
          role: 'owner',
          joined_at: owner.created_at,
        })
      }
    }

    // Process delegates
    for (const delegate of delegates || []) {
      if (!delegate.user_id) continue

      if (!userMap.has(delegate.user_id)) {
        userMap.set(delegate.user_id, {
          id: delegate.user_id,
          email: '',
          created_at: delegate.created_at,
          last_sign_in_at: null,
          email_confirmed_at: null,
          user_metadata: {},
          organizations: [],
          is_active: true,
        })
      }

      const user = userMap.get(delegate.user_id)!
      const org = delegate.organizations as unknown as { id: string; name: string; slug: string } | null
      if (org) {
        user.organizations.push({
          organization_id: org.id,
          organization_name: org.name,
          organization_slug: org.slug,
          role: 'delegate',
          joined_at: delegate.created_at,
        })
      }
    }

    // Process members
    for (const member of members || []) {
      if (!member.user_id) continue

      if (!userMap.has(member.user_id)) {
        userMap.set(member.user_id, {
          id: member.user_id,
          email: member.email || '',
          created_at: member.created_at,
          last_sign_in_at: null,
          email_confirmed_at: null,
          user_metadata: {
            full_name: `${member.first_name} ${member.last_name}`.trim(),
          },
          organizations: [],
          is_active: true,
        })
      }

      const user = userMap.get(member.user_id)!
      const org = member.organizations as unknown as { id: string; name: string; slug: string } | null
      if (org) {
        // Check if already has a higher role in this org
        const existingRole = user.organizations.find(o => o.organization_id === org.id)
        if (!existingRole) {
          user.organizations.push({
            organization_id: org.id,
            organization_name: org.name,
            organization_slug: org.slug,
            role: 'member',
            joined_at: member.created_at,
          })
        }
      }

      // Update email if not set
      if (!user.email && member.email) {
        user.email = member.email
      }
    }

    let result = Array.from(userMap.values())

    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(u =>
        u.email.toLowerCase().includes(search) ||
        (u.user_metadata.full_name as string || '').toLowerCase().includes(search)
      )
    }

    if (filters?.organization_id) {
      result = result.filter(u =>
        u.organizations.some(o => o.organization_id === filters.organization_id)
      )
    }

    if (filters?.role) {
      result = result.filter(u =>
        u.organizations.some(o => o.role === filters.role)
      )
    }

    // Sort by created_at descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return result
  },

  /**
   * Get user detail by ID
   */
  async getById(userId: string): Promise<UserDetail | null> {
    // Get base user info
    const users = await usersService.getAll({ search: '' })
    const user = users.find(u => u.id === userId)

    if (!user) return null

    // Get member profile if exists
    const { data: memberData, error: memberError } = await db
      .from('members')
      .select('id, first_name, last_name, phone, date_of_birth')
      .eq('user_id', userId)
      .maybeSingle()

    if (memberError) throw memberError

    // Get activity stats
    let totalDonations = 0
    let totalCases = 0

    if (memberData) {
      // Get donations count
      const { count: donationsCount } = await db
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberData.id)

      totalDonations = donationsCount || 0

      // Get cases count
      const { count: casesCount } = await db
        .from('service_cases')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberData.id)

      totalCases = casesCount || 0
    }

    return {
      ...user,
      member_profile: memberData,
      activity_stats: {
        total_donations: totalDonations,
        total_cases: totalCases,
        last_activity: null,
      },
    }
  },

  /**
   * Change user's role in an organization
   */
  async changeRole(userId: string, organizationId: string, newRole: UserRole): Promise<void> {
    // Remove from current role tables
    await db
      .from('organization_owners')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    await db
      .from('organization_delegates')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    // Add to new role table
    if (newRole === 'owner') {
      const { error } = await db
        .from('organization_owners')
        .insert({ user_id: userId, organization_id: organizationId })

      if (error) throw error
    } else if (newRole === 'delegate') {
      const { error } = await db
        .from('organization_delegates')
        .insert({ user_id: userId, organization_id: organizationId })

      if (error) throw error
    }
    // Member role is managed through members table
  },

  /**
   * Remove user from an organization
   */
  async removeFromOrganization(userId: string, organizationId: string): Promise<void> {
    // Remove from all role tables
    await db
      .from('organization_owners')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    await db
      .from('organization_delegates')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    // Unlink member if exists
    await db
      .from('members')
      .update({ user_id: null })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
  },

  /**
   * Get all imams across organizations
   */
  async getImams(filters?: ImamFilters): Promise<ImamInfo[]> {
    let query = db
      .from('members')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        organization_id,
        created_at,
        is_active,
        organizations (id, name, slug)
      `)
      .eq('role', 'imam')
      .order('created_at', { ascending: false })

    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query

    if (error) throw error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result = (data || []).map((member: any) => {
      const org = member.organizations as { id: string; name: string; slug: string } | null
      return {
        id: member.id,
        user_id: member.user_id,
        member_id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone,
        organization_id: member.organization_id,
        organization_name: org?.name || '',
        organization_slug: org?.slug || '',
        joined_at: member.created_at,
        is_active: member.is_active,
      } as ImamInfo
    })

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(imam =>
        `${imam.first_name} ${imam.last_name}`.toLowerCase().includes(search) ||
        (imam.email || '').toLowerCase().includes(search)
      )
    }

    return result
  },
}
