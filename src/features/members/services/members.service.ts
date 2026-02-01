import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Member,
  MemberStats,
  MemberFilters,
  CreateMemberInput,
  UpdateMemberInput,
  MembershipType,
  Gender,
} from '../types/members.types'

const TABLE_NAME = 'members'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

// Helper types for query results
interface MemberStatsRow {
  id: string
  membership_type: string
  membership_status: string
  gender: string | null
  joined_date: string
}

interface CityRow {
  city: string | null
}

interface StateRow {
  state: string | null
}

export const membersService = {
  // Get all members for an organization
  async getAll(organizationId: string, filters?: MemberFilters): Promise<Member[]> {
    let query = db
      .from(TABLE_NAME)
      .select(`
        *,
        household:households(id, name, address, city)
      `)
      .eq('organization_id', organizationId)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    if (filters?.search) {
      const search = `%${filters.search}%`
      query = query.or(`first_name.ilike.${search},last_name.ilike.${search},email.ilike.${search},phone.ilike.${search}`)
    }

    if (filters?.membership_type) {
      const types = Array.isArray(filters.membership_type)
        ? filters.membership_type
        : [filters.membership_type]
      query = query.in('membership_type', types)
    }

    if (filters?.membership_status) {
      const statuses = Array.isArray(filters.membership_status)
        ? filters.membership_status
        : [filters.membership_status]
      query = query.in('membership_status', statuses)
    }

    if (filters?.gender) {
      const genders = Array.isArray(filters.gender) ? filters.gender : [filters.gender]
      query = query.in('gender', genders)
    }

    if (filters?.household_id !== undefined) {
      if (filters.household_id === null) {
        query = query.is('household_id', null)
      } else {
        query = query.eq('household_id', filters.household_id)
      }
    }

    if (filters?.joined_date_from) {
      query = query.gte('joined_date', filters.joined_date_from)
    }

    if (filters?.joined_date_to) {
      query = query.lte('joined_date', filters.joined_date_to)
    }

    if (filters?.city) {
      query = query.eq('city', filters.city)
    }

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    if (filters?.has_email === true) {
      query = query.not('email', 'is', null)
    } else if (filters?.has_email === false) {
      query = query.is('email', null)
    }

    if (filters?.has_phone === true) {
      query = query.not('phone', 'is', null)
    } else if (filters?.has_phone === false) {
      query = query.is('phone', null)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as unknown as Member[]
  },

  // Get single member by ID
  async getById(id: string): Promise<Member | null> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select(`
        *,
        household:households(id, name, address, city, state, zip_code, country)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as Member
  },

  // Create a new member
  async create(input: CreateMemberInput): Promise<Member> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .insert([{
        ...input,
        custom_fields: input.custom_fields || {},
        membership_type: input.membership_type || 'individual',
        membership_status: input.membership_status || 'active',
        joined_date: input.joined_date || new Date().toISOString().split('T')[0],
        self_registered: input.self_registered || false,
      }] as never)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Member
  },

  // Update an existing member
  async update(id: string, input: UpdateMemberInput): Promise<Member> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .update(input as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Member
  },

  // Delete a member
  async delete(id: string): Promise<void> {
    const { error } = await db
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search members
  async search(organizationId: string, query: string, limit = 20): Promise<Member[]> {
    const search = `%${query}%`
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('id, first_name, last_name, email, phone, membership_status')
      .eq('organization_id', organizationId)
      .or(`first_name.ilike.${search},last_name.ilike.${search},email.ilike.${search},phone.ilike.${search}`)
      .order('last_name', { ascending: true })
      .limit(limit)

    if (error) throw error
    return (data || []) as unknown as Member[]
  },

  // Get members by household
  async getByHousehold(householdId: string): Promise<Member[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('*')
      .eq('household_id', householdId)
      .order('last_name', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as Member[]
  },

  // Get member statistics
  async getStats(organizationId: string): Promise<MemberStats> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('id, membership_type, membership_status, gender, joined_date')
      .eq('organization_id', organizationId)

    if (error) throw error

    const members = (data || []) as MemberStatsRow[]
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const byType: Record<string, number> = {}
    const byGender: Record<string, number> = { unknown: 0 }
    let active = 0
    let inactive = 0
    let pending = 0
    let newThisMonth = 0

    for (const member of members) {
      // Count by membership type
      byType[member.membership_type] = (byType[member.membership_type] || 0) + 1

      // Count by gender
      if (member.gender) {
        byGender[member.gender] = (byGender[member.gender] || 0) + 1
      } else {
        byGender['unknown'] = (byGender['unknown'] || 0) + 1
      }

      // Count by status
      if (member.membership_status === 'active') active++
      else if (member.membership_status === 'inactive') inactive++
      else if (member.membership_status === 'pending') pending++

      // Count new this month
      if (member.joined_date && member.joined_date >= startOfMonth) {
        newThisMonth++
      }
    }

    return {
      total: members.length,
      active,
      inactive,
      pending,
      newThisMonth,
      byMembershipType: byType as Record<MembershipType, number>,
      byGender: byGender as Record<Gender | 'unknown', number>,
    }
  },

  // Get distinct cities for filter dropdowns
  async getCities(organizationId: string): Promise<string[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('city')
      .eq('organization_id', organizationId)
      .not('city', 'is', null)

    if (error) throw error

    const rows = (data || []) as CityRow[]
    const cities = [...new Set(rows.map((d) => d.city).filter((c): c is string => Boolean(c)))]
    return cities.sort()
  },

  // Get distinct states for filter dropdowns
  async getStates(organizationId: string): Promise<string[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('state')
      .eq('organization_id', organizationId)
      .not('state', 'is', null)

    if (error) throw error

    const rows = (data || []) as StateRow[]
    const states = [...new Set(rows.map((d) => d.state).filter((s): s is string => Boolean(s)))]
    return states.sort()
  },

  // Bulk update members (e.g., assign to household)
  async bulkUpdate(ids: string[], input: Partial<UpdateMemberInput>): Promise<void> {
    const { error } = await db
      .from(TABLE_NAME)
      .update(input as never)
      .in('id', ids)

    if (error) throw error
  },

  // Assign member to household
  async assignToHousehold(memberId: string, householdId: string | null): Promise<Member> {
    return this.update(memberId, { household_id: householdId })
  },

  // Update member status
  async updateStatus(memberId: string, status: Member['membership_status']): Promise<Member> {
    return this.update(memberId, { membership_status: status })
  },
}
