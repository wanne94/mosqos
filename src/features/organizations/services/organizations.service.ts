/**
 * Organizations Service
 *
 * API calls and business logic for organization management
 */

import { supabase, isDevMode } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Organization,
  OrganizationWithRelations,
  CreateOrganizationInput,
  AdminCreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationStats,
  OrganizationFilters,
  Country
} from '../types/organization.types'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

export const organizationsService = {
  /**
   * Generate a URL-friendly slug from organization name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
  },

  /**
   * Check if a slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    let query = db
      .from('organizations')
      .select('id')
      .eq('slug', slug)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    return data === null
  },

  /**
   * Generate a unique slug
   */
  async generateUniqueSlug(name: string): Promise<string> {
    let baseSlug = organizationsService.generateSlug(name)
    let slug = baseSlug
    let counter = 1

    while (!(await organizationsService.isSlugAvailable(slug))) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  },

  /**
   * Get all active countries
   */
  async getCountries(): Promise<Country[]> {
    const { data, error } = await db
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data as Country[]
  },

  /**
   * Create a new organization (self-service signup)
   */
  async create(input: CreateOrganizationInput): Promise<Organization> {
    const slug = await organizationsService.generateUniqueSlug(input.name)

    const { data, error } = await db
      .from('organizations')
      .insert({
        name: input.name,
        slug,
        country_id: input.country_id,
        contact_email: input.contact_email,
        status: input.status || 'pending',
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  /**
   * Create a new organization (admin)
   */
  async adminCreate(input: AdminCreateOrganizationInput): Promise<Organization> {
    const slug = await organizationsService.generateUniqueSlug(input.name)

    // Get current user ID (optional in dev mode with RLS bypass)
    const { data: { user } } = await supabase.auth.getUser()

    // In dev mode with RLS bypassed, created_by is optional
    // In production, user must be authenticated
    if (!user && !isDevMode) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await db
      .from('organizations')
      .insert({
        name: input.name,
        slug,
        country_id: input.country_id,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone || null,
        address_line1: input.address_line1 || null,
        city: input.city || null,
        state: input.state || null,
        postal_code: input.postal_code || null,
        timezone: input.timezone || null,
        status: input.status || 'approved',
        is_active: true,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  /**
   * Add a user as organization owner
   */
  async addOwner(organizationId: string, userId: string): Promise<void> {
    const { error } = await db
      .from('organization_owners')
      .insert({
        organization_id: organizationId,
        user_id: userId,
      })

    if (error) throw error
  },

  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<OrganizationWithRelations | null> {
    const { data, error } = await db
      .from('organizations')
      .select(`
        *,
        countries (id, code, name, currency_code, currency_symbol, timezone),
        organization_subscriptions (
          id, status, billing_cycle, plan_id,
          current_period_start, current_period_end, trial_ends_at,
          subscription_plans (id, name, slug, tier)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data as OrganizationWithRelations
  },

  /**
   * Get organization by slug
   */
  async getBySlug(slug: string): Promise<OrganizationWithRelations | null> {
    const { data, error } = await db
      .from('organizations')
      .select(`
        *,
        countries (id, code, name, currency_code, currency_symbol, timezone),
        organization_subscriptions (
          id, status, billing_cycle, plan_id,
          current_period_start, current_period_end, trial_ends_at,
          subscription_plans (id, name, slug, tier)
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data as OrganizationWithRelations
  },

  /**
   * Get all organizations with optional filters
   */
  async getAll(filters?: OrganizationFilters): Promise<OrganizationWithRelations[]> {
    let query = db
      .from('organizations')
      .select(`
        *,
        countries (id, code, name),
        organization_subscriptions (
          id, status, plan_id,
          subscription_plans (id, name, slug)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`)
    }

    if (filters?.country_id) {
      query = query.eq('country_id', filters.country_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query

    if (error) throw error

    // Filter by plan if specified
    let result = (data || []) as OrganizationWithRelations[]

    if (filters?.plan_slug) {
      result = result.filter(org =>
        org.organization_subscriptions?.[0]?.subscription_plans?.slug === filters.plan_slug
      )
    }

    return result
  },

  /**
   * Get pending organizations (for admin approval)
   */
  async getPending(): Promise<OrganizationWithRelations[]> {
    const { data, error } = await db
      .from('organizations')
      .select(`
        *,
        countries (id, code, name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as OrganizationWithRelations[]
  },

  /**
   * Get pending organizations count
   */
  async getPendingCount(): Promise<number> {
    const { count, error } = await db
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) throw error
    return count || 0
  },

  /**
   * Approve a pending organization
   */
  async approve(organizationId: string): Promise<Organization> {
    const { data, error } = await db
      .from('organizations')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  /**
   * Reject a pending organization
   */
  async reject(organizationId: string, reason: string): Promise<Organization> {
    const { data, error } = await db
      .from('organizations')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  /**
   * Update an organization
   */
  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...input,
      updated_at: new Date().toISOString(),
    }

    // Remove settings if undefined (it has special handling)
    if (input.settings === undefined) {
      delete updateData.settings
    }

    const { data, error } = await db
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error

    // In dev mode, if RLS blocks the update (0 rows), fetch the org anyway
    if (!data || data.length === 0) {
      if (isDevMode) {
        console.warn('[DEV MODE] Update blocked by RLS - fetching current data instead')
        const { data: currentOrg } = await db
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single()

        if (currentOrg) {
          return currentOrg as Organization
        }
      }
      throw new Error('Organization not found or access denied')
    }

    return data[0] as Organization
  },

  /**
   * Delete an organization
   */
  async delete(id: string): Promise<void> {
    const { error } = await db
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Deactivate an organization
   */
  async deactivate(id: string): Promise<Organization> {
    return organizationsService.update(id, { is_active: false })
  },

  /**
   * Reactivate an organization
   */
  async reactivate(id: string): Promise<Organization> {
    return organizationsService.update(id, { is_active: true })
  },

  /**
   * Get user's organization (for portal access)
   */
  async getUserOrganization(userId: string): Promise<OrganizationWithRelations | null> {
    // Check if user is an organization owner
    const { data: ownerData, error: ownerError } = await db
      .from('organization_owners')
      .select(`
        organization_id,
        organizations (
          *,
          countries (id, code, name)
        )
      `)
      .eq('user_id', userId)
      .maybeSingle()

    if (ownerError) throw ownerError

    if (ownerData?.organizations) {
      return ownerData.organizations as unknown as OrganizationWithRelations
    }

    // Check if user is an organization delegate
    const { data: delegateData, error: delegateError } = await db
      .from('organization_delegates')
      .select(`
        organization_id,
        organizations (
          *,
          countries (id, code, name)
        )
      `)
      .eq('user_id', userId)
      .maybeSingle()

    if (delegateError) throw delegateError

    if (delegateData?.organizations) {
      return delegateData.organizations as unknown as OrganizationWithRelations
    }

    return null
  },

  /**
   * Get organization statistics
   */
  async getStats(organizationId: string): Promise<OrganizationStats> {
    // Get member count
    const { count: memberCount, error: memberError } = await db
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (memberError) throw memberError

    // Get household count
    const { count: householdCount, error: householdError } = await db
      .from('households')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (householdError) throw householdError

    // Get total donations
    const { data: donationsData, error: donationsError } = await db
      .from('donations')
      .select('amount')
      .eq('organization_id', organizationId)

    if (donationsError) throw donationsError

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalDonations = (donationsData || []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0)

    // Get active classes count
    const { count: activeClasses, error: classesError } = await db
      .from('scheduled_classes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (classesError) throw classesError

    // Get open cases count
    const { count: openCases, error: casesError } = await db
      .from('service_cases')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['open', 'in_progress'])

    if (casesError) throw casesError

    return {
      memberCount: memberCount || 0,
      householdCount: householdCount || 0,
      totalDonations,
      activeClasses: activeClasses || 0,
      openCases: openCases || 0,
    }
  },

  /**
   * Get organization members (admins/owners)
   */
  async getAdmins(organizationId: string) {
    // Get owners
    const { data: owners, error: ownersError } = await db
      .from('organization_owners')
      .select('user_id, created_at')
      .eq('organization_id', organizationId)

    if (ownersError) throw ownersError

    // Get delegates
    const { data: delegates, error: delegatesError } = await db
      .from('organization_delegates')
      .select('user_id, created_at')
      .eq('organization_id', organizationId)

    if (delegatesError) throw delegatesError

    return {
      owners: owners || [],
      delegates: delegates || [],
    }
  },
}
