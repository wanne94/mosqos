import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Household,
  HouseholdWithMembers,
  HouseholdFilters,
  CreateHouseholdInput,
  UpdateHouseholdInput,
} from '../types/households.types'

const TABLE_NAME = 'households'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

// Helper types for query results
interface HouseholdQueryRow {
  id: string
  organization_id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  head_of_household_id: string | null
  custom_fields: Record<string, unknown> | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  members?: Array<{
    id: string
    first_name: string
    last_name: string
    email: string | null
    membership_status: string
  }>
  head?: Array<{
    id: string
    first_name: string
    last_name: string
  }>
}

interface HouseholdStatsRow {
  id: string
  head_of_household_id: string | null
  members?: Array<{ count: number }>
}

interface CityRow {
  city: string | null
}

export const householdsService = {
  // Get all households for an organization
  async getAll(organizationId: string, filters?: HouseholdFilters): Promise<HouseholdWithMembers[]> {
    let query = db
      .from(TABLE_NAME)
      .select(`
        *,
        members:members(id, first_name, last_name, email, membership_status),
        head:members!households_head_of_household_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (filters?.search) {
      const search = `%${filters.search}%`
      query = query.or(`name.ilike.${search},address.ilike.${search},city.ilike.${search}`)
    }

    if (filters?.city) {
      query = query.eq('city', filters.city)
    }

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    if (filters?.country) {
      query = query.eq('country', filters.country)
    }

    if (filters?.has_head === true) {
      query = query.not('head_of_household_id', 'is', null)
    } else if (filters?.has_head === false) {
      query = query.is('head_of_household_id', null)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform the data to include member_count
    const rows = (data || []) as unknown as HouseholdQueryRow[]
    return rows.map((h) => ({
      ...h,
      member_count: h.members?.length || 0,
      head_of_household: h.head?.[0] || null,
    })) as unknown as HouseholdWithMembers[]
  },

  // Get single household by ID
  async getById(id: string): Promise<HouseholdWithMembers | null> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select(`
        *,
        members:members(id, first_name, last_name, email, phone, membership_status, gender, date_of_birth),
        head:members!households_head_of_household_id_fkey(id, first_name, last_name, email, phone)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    const row = data as unknown as HouseholdQueryRow & { head?: Array<{ id: string; first_name: string; last_name: string; email?: string; phone?: string }> }
    return {
      ...row,
      member_count: row.members?.length || 0,
      head_of_household: row.head?.[0] || null,
    } as unknown as HouseholdWithMembers
  },

  // Create a new household
  async create(input: CreateHouseholdInput): Promise<Household> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .insert([{
        ...input,
        custom_fields: input.custom_fields || {},
      }] as never)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Household
  },

  // Update an existing household
  async update(id: string, input: UpdateHouseholdInput): Promise<Household> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .update(input as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Household
  },

  // Delete a household
  async delete(id: string): Promise<void> {
    // First remove household_id from all members in this household
    await db
      .from('members')
      .update({ household_id: null })
      .eq('household_id', id)

    const { error } = await db
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add a member to a household
  async addMember(householdId: string, memberId: string): Promise<void> {
    const { error } = await db
      .from('members')
      .update({ household_id: householdId })
      .eq('id', memberId)

    if (error) throw error
  },

  // Remove a member from a household
  async removeMember(householdId: string, memberId: string): Promise<void> {
    const { error } = await db
      .from('members')
      .update({ household_id: null })
      .eq('id', memberId)
      .eq('household_id', householdId)

    if (error) throw error
  },

  // Set head of household
  async setHeadOfHousehold(householdId: string, memberId: string | null): Promise<Household> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .update({ head_of_household_id: memberId })
      .eq('id', householdId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Household
  },

  // Get household statistics
  async getStats(organizationId: string): Promise<{
    total: number
    with_head: number
    without_head: number
    average_members: number
  }> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select(`
        id,
        head_of_household_id,
        members:members(count)
      `)
      .eq('organization_id', organizationId)

    if (error) throw error

    const households = (data || []) as unknown as HouseholdStatsRow[]
    const total = households.length
    const withHead = households.filter((h) => h.head_of_household_id).length
    const totalMembers = households.reduce((sum: number, h) => {
      return sum + (h.members?.[0]?.count || 0)
    }, 0)

    return {
      total,
      with_head: withHead,
      without_head: total - withHead,
      average_members: total > 0 ? totalMembers / total : 0,
    }
  },

  // Search households
  async search(organizationId: string, query: string, limit = 20): Promise<Household[]> {
    const search = `%${query}%`
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('id, name, address, city')
      .eq('organization_id', organizationId)
      .or(`name.ilike.${search},address.ilike.${search}`)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) throw error
    return (data || []) as unknown as Household[]
  },

  // Get distinct cities
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
}
