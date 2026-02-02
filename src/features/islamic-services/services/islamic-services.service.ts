import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  IslamicService,
  IslamicServiceType,
  IslamicServiceInput,
  IslamicServiceUpdateInput,
  IslamicServiceTypeInput,
  IslamicServiceFilters,
  IslamicServiceStats,
  ServiceStatus,
} from '../types/islamic-services.types'

// Type assertion for tables with columns not in generated types
const db = supabase as SupabaseClient<any>

const SERVICES_TABLE = 'islamic_services'
const TYPES_TABLE = 'islamic_service_types'

export const islamicServicesService = {
  // =====================
  // Service Types
  // =====================

  async getServiceTypes(organizationId: string, activeOnly = false): Promise<IslamicServiceType[]> {
    let query = db
      .from(TYPES_TABLE)
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getServiceType(id: string): Promise<IslamicServiceType | null> {
    const { data, error } = await db
      .from(TYPES_TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async createServiceType(input: IslamicServiceTypeInput): Promise<IslamicServiceType> {
    const { data, error } = await db
      .from(TYPES_TABLE)
      .insert([input])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateServiceType(id: string, input: Partial<IslamicServiceTypeInput>): Promise<IslamicServiceType> {
    const { data, error } = await db
      .from(TYPES_TABLE)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteServiceType(id: string): Promise<void> {
    const { error } = await db
      .from(TYPES_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Seed default service types for new organization
  async seedDefaultTypes(organizationId: string): Promise<void> {
    const defaultTypes = [
      {
        organization_id: organizationId,
        name: 'Nikah',
        slug: 'nikah',
        name_ar: 'نكاح',
        name_tr: 'Nikah',
        description: 'Islamic marriage ceremony',
        default_fee: 200,
        requires_witnesses: true,
        witness_count: 2,
        requires_appointment: true,
        is_active: true,
        sort_order: 1,
      },
      {
        organization_id: organizationId,
        name: 'Janazah',
        slug: 'janazah',
        name_ar: 'جنازة',
        name_tr: 'Cenaze',
        description: 'Funeral prayer and burial services',
        default_fee: 0,
        requires_witnesses: false,
        witness_count: 0,
        requires_appointment: false,
        is_active: true,
        sort_order: 2,
      },
      {
        organization_id: organizationId,
        name: 'Shahada',
        slug: 'shahada',
        name_ar: 'شهادة',
        name_tr: 'Şehadet',
        description: 'Declaration of faith for new Muslims',
        default_fee: 0,
        requires_witnesses: true,
        witness_count: 2,
        requires_appointment: true,
        is_active: true,
        sort_order: 3,
      },
    ]

    const { error } = await db
      .from(TYPES_TABLE)
      .insert(defaultTypes)

    if (error && error.code !== '23505') throw error // Ignore duplicate key errors
  },

  // =====================
  // Services
  // =====================

  async getAll(organizationId: string, filters?: IslamicServiceFilters): Promise<IslamicService[]> {
    let query = db
      .from(SERVICES_TABLE)
      .select(`
        *,
        service_type:service_type_id(id, name, slug, name_ar, name_tr),
        officiant:officiant_id(id, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.service_type_id && filters.service_type_id !== 'all') {
      query = query.eq('service_type_id', filters.service_type_id)
    }

    if (filters?.search) {
      query = query.or(`case_number.ilike.%${filters.search}%,requestor_name.ilike.%${filters.search}%`)
    }

    if (filters?.date_from) {
      query = query.gte('scheduled_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('scheduled_date', filters.date_to)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<IslamicService | null> {
    const { data, error } = await db
      .from(SERVICES_TABLE)
      .select(`
        *,
        service_type:service_type_id(id, name, slug, name_ar, name_tr, requires_witnesses, witness_count),
        officiant:officiant_id(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async create(input: IslamicServiceInput): Promise<IslamicService> {
    // Get service type to determine slug for case number
    const serviceType = await this.getServiceType(input.service_type_id)
    if (!serviceType) throw new Error('Invalid service type')

    // Generate case number
    const { data: caseData, error: caseError } = await db
      .rpc('generate_service_case_number', {
        org_id: input.organization_id,
        service_slug: serviceType.slug,
      })

    if (caseError) throw caseError

    const { data, error } = await db
      .from(SERVICES_TABLE)
      .insert([{
        ...input,
        case_number: caseData,
        fee_amount: input.fee_amount ?? serviceType.default_fee,
        witnesses: input.witnesses || [],
        service_data: input.service_data || {},
      }])
      .select(`
        *,
        service_type:service_type_id(id, name, slug, name_ar, name_tr),
        officiant:officiant_id(id, first_name, last_name)
      `)
      .single()

    if (error) throw error
    return data
  },

  async update(input: IslamicServiceUpdateInput): Promise<IslamicService> {
    const { id, ...updateData } = input

    // If completing, set completed_at
    if (updateData.status === 'completed') {
      (updateData as any).completed_at = new Date().toISOString()
    }

    const { data, error } = await db
      .from(SERVICES_TABLE)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        service_type:service_type_id(id, name, slug, name_ar, name_tr),
        officiant:officiant_id(id, first_name, last_name)
      `)
      .single()

    if (error) throw error
    return data
  },

  async updateStatus(id: string, status: ServiceStatus): Promise<IslamicService> {
    return this.update({ id, status })
  },

  async recordPayment(id: string, amount: number): Promise<IslamicService> {
    // Get current service
    const service = await this.getById(id)
    if (!service) throw new Error('Service not found')

    const newPaid = service.fee_paid + amount
    let feeStatus: 'pending' | 'partial' | 'paid' = 'pending'

    if (newPaid >= service.fee_amount) {
      feeStatus = 'paid'
    } else if (newPaid > 0) {
      feeStatus = 'partial'
    }

    return this.update({
      id,
      fee_paid: newPaid,
      fee_status: feeStatus,
    })
  },

  async issueCertificate(id: string, certificateUrl: string): Promise<IslamicService> {
    const service = await this.getById(id)
    if (!service) throw new Error('Service not found')

    // Generate certificate number
    const certNumber = `CERT-${service.case_number}`

    return this.update({
      id,
      certificate_number: certNumber,
      certificate_url: certificateUrl,
      certificate_issued_at: new Date().toISOString(),
    } as IslamicServiceUpdateInput)
  },

  async delete(id: string): Promise<void> {
    const { error } = await db
      .from(SERVICES_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getStats(organizationId: string): Promise<IslamicServiceStats> {
    const { data, error } = await db
      .from(SERVICES_TABLE)
      .select('id, status, service_type_id, fee_amount, fee_paid')
      .eq('organization_id', organizationId)

    if (error) throw error

    interface ServiceStatsRow {
      id: string
      status: ServiceStatus
      service_type_id: string
      fee_amount: number | null
      fee_paid: number | null
    }

    const services = (data || []) as ServiceStatsRow[]

    const byType: Record<string, number> = {}
    services.forEach((s) => {
      byType[s.service_type_id] = (byType[s.service_type_id] || 0) + 1
    })

    return {
      total: services.length,
      requested: services.filter((s) => s.status === 'requested').length,
      scheduled: services.filter((s) => s.status === 'scheduled').length,
      in_progress: services.filter((s) => s.status === 'in_progress').length,
      completed: services.filter((s) => s.status === 'completed').length,
      cancelled: services.filter((s) => s.status === 'cancelled').length,
      by_type: byType,
      total_fees: services.reduce((sum, s) => sum + (s.fee_amount || 0), 0),
      fees_collected: services.reduce((sum, s) => sum + (s.fee_paid || 0), 0),
    }
  },

  // Get upcoming scheduled services
  async getUpcoming(organizationId: string, limit = 10): Promise<IslamicService[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await db
      .from(SERVICES_TABLE)
      .select(`
        *,
        service_type:service_type_id(id, name, slug, name_ar, name_tr)
      `)
      .eq('organization_id', organizationId)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  },
}
