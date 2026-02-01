import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ServiceCase,
  CaseNote,
  CaseFilters,
  CreateCaseInput,
  UpdateCaseInput,
  AddCaseNoteInput,
  CaseStatistics,
  CasePriority,
} from '../types/cases.types'
import { CaseStatus } from '../types/cases.types'

const TABLE_NAME = 'service_cases'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

// Helper types for query results
interface CaseStatsRow {
  id: string
  status: string
  priority: string
  case_type: string | null
  category: string | null
  requested_amount: number | null
  approved_amount: number | null
  disbursed_amount: number | null
  created_at: string
  resolved_date: string | null
}

interface CaseTypeRow {
  case_type: string | null
}

interface CategoryRow {
  category: string | null
}

interface CaseNumberRow {
  case_number: string | null
}

export const casesService = {
  // Get all cases for an organization
  async getAll(organizationId: string, filters?: CaseFilters): Promise<ServiceCase[]> {
    let query = db
      .from(TABLE_NAME)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.search) {
      const search = `%${filters.search}%`
      query = query.or(`title.ilike.${search},description.ilike.${search},case_number.ilike.${search}`)
    }

    if (filters?.case_type) {
      query = query.eq('case_type', filters.case_type)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      query = query.in('status', statuses)
    }

    if (filters?.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
      query = query.in('priority', priorities)
    }

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters?.fund_id) {
      query = query.eq('fund_id', filters.fund_id)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters?.requires_followup !== undefined) {
      query = query.eq('requires_followup', filters.requires_followup)
    }

    if (filters?.is_confidential !== undefined) {
      query = query.eq('is_confidential', filters.is_confidential)
    }

    if (filters?.has_amount === true) {
      query = query.not('requested_amount', 'is', null)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as unknown as ServiceCase[]
  },

  // Get single case by ID
  async getById(id: string): Promise<ServiceCase | null> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as ServiceCase
  },

  // Create a new case
  async create(organizationId: string, input: CreateCaseInput): Promise<ServiceCase> {
    const caseNumber = await this.generateCaseNumber(organizationId)

    const { data, error } = await db
      .from(TABLE_NAME)
      .insert([{
        organization_id: organizationId,
        case_number: caseNumber,
        ...input,
        status: 'open',
        priority: input.priority || 'medium',
        disbursed_amount: 0,
        notes_thread: [],
        is_confidential: input.is_confidential || false,
        requires_followup: input.requires_followup || false,
      }] as never)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data as unknown as ServiceCase
  },

  // Update a case
  async update(id: string, input: UpdateCaseInput): Promise<ServiceCase> {
    const updateData: UpdateCaseInput & { resolved_date?: string; closed_at?: string } = { ...input }

    // Set resolved_date when status changes to resolved
    if (input.status === CaseStatus.RESOLVED || input.status === CaseStatus.CLOSED) {
      updateData.resolved_date = updateData.resolved_date || new Date().toISOString()
    }

    // Set closed_at when status changes to closed
    if (input.status === CaseStatus.CLOSED) {
      updateData.closed_at = new Date().toISOString()
    }

    const { data, error } = await db
      .from(TABLE_NAME)
      .update(updateData as never)
      .eq('id', id)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data as unknown as ServiceCase
  },

  // Delete a case
  async delete(id: string): Promise<void> {
    const { error } = await db
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Assign case to user
  async assign(caseId: string, userId: string | null): Promise<ServiceCase> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .update({
        assigned_to: userId,
        assigned_at: userId ? new Date().toISOString() : null,
        status: userId ? 'in_progress' : 'open',
      })
      .eq('id', caseId)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data as unknown as ServiceCase
  },

  // Update case status
  async updateStatus(caseId: string, status: CaseStatus): Promise<ServiceCase> {
    return this.update(caseId, { status })
  },

  // Add note to case
  async addNote(input: AddCaseNoteInput): Promise<ServiceCase> {
    // Get current case
    const existingCase = await this.getById(input.case_id)
    if (!existingCase) throw new Error('Case not found')

    // Get current user for author info
    const { data: { user } } = await supabase.auth.getUser()

    const newNote: CaseNote = {
      id: crypto.randomUUID(),
      author_id: user?.id || '',
      author_name: user?.email || 'Unknown',
      content: input.content,
      created_at: new Date().toISOString(),
      is_internal: input.is_internal || false,
    }

    const updatedNotes = [...(existingCase.notes_thread || []), newNote]

    const { data, error } = await db
      .from(TABLE_NAME)
      .update({ notes_thread: updatedNotes } as never)
      .eq('id', input.case_id)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .single()

    if (error) throw error
    return data as unknown as ServiceCase
  },

  // Get case statistics
  async getStats(organizationId: string): Promise<CaseStatistics> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('id, status, priority, case_type, category, requested_amount, approved_amount, disbursed_amount, created_at, resolved_date')
      .eq('organization_id', organizationId)

    if (error) throw error

    const cases = (data || []) as CaseStatsRow[]

    // Count by status
    const statusCounts: Record<string, number> = {}
    const priorityCounts: Record<string, number> = {}
    const typeCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}

    let totalRequested = 0
    let totalApproved = 0
    let totalDisbursed = 0
    const resolvedDays: number[] = []

    for (const c of cases) {
      // Status counts
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1

      // Priority counts
      priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1

      // Type counts
      if (c.case_type) {
        typeCounts[c.case_type] = (typeCounts[c.case_type] || 0) + 1
      }

      // Category counts
      if (c.category) {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1
      }

      // Amounts
      totalRequested += c.requested_amount || 0
      totalApproved += c.approved_amount || 0
      totalDisbursed += c.disbursed_amount || 0

      // Resolution time
      if (c.resolved_date && c.created_at) {
        const createdDate = new Date(c.created_at)
        const resolvedDate = new Date(c.resolved_date)
        const days = Math.ceil((resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        resolvedDays.push(days)
      }
    }

    const averageResolution = resolvedDays.length > 0
      ? resolvedDays.reduce((a, b) => a + b, 0) / resolvedDays.length
      : 0

    return {
      total_cases: cases.length,
      open_cases: statusCounts['open'] || 0,
      in_progress_cases: statusCounts['in_progress'] || 0,
      resolved_cases: statusCounts['resolved'] || 0,
      closed_cases: statusCounts['closed'] || 0,
      by_type: typeCounts,
      by_category: categoryCounts,
      by_priority: priorityCounts as Record<CasePriority, number>,
      total_requested: totalRequested,
      total_approved: totalApproved,
      total_disbursed: totalDisbursed,
      average_resolution_days: Math.round(averageResolution * 10) / 10,
    }
  },

  // Get cases by member
  async getByMember(memberId: string): Promise<ServiceCase[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select(`
        *,
        fund:funds(id, name)
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as ServiceCase[]
  },

  // Get my assigned cases
  async getMyAssigned(userId: string): Promise<ServiceCase[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone),
        fund:funds(id, name)
      `)
      .eq('assigned_to', userId)
      .in('status', ['open', 'in_progress', 'pending'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as ServiceCase[]
  },

  // Get cases requiring followup
  async getRequiringFollowup(organizationId: string): Promise<ServiceCase[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await db
      .from(TABLE_NAME)
      .select(`
        *,
        member:members(id, first_name, last_name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .eq('requires_followup', true)
      .lte('followup_date', today)
      .in('status', ['open', 'in_progress', 'pending'])
      .order('followup_date', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as ServiceCase[]
  },

  // Get distinct case types
  async getCaseTypes(organizationId: string): Promise<string[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('case_type')
      .eq('organization_id', organizationId)
      .not('case_type', 'is', null)

    if (error) throw error

    const rows = (data || []) as CaseTypeRow[]
    const types = [...new Set(rows.map((d) => d.case_type).filter((t): t is string => Boolean(t)))]
    return types.sort()
  },

  // Get distinct categories
  async getCategories(organizationId: string): Promise<string[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null)

    if (error) throw error

    const rows = (data || []) as CategoryRow[]
    const categories = [...new Set(rows.map((d) => d.category).filter((c): c is string => Boolean(c)))]
    return categories.sort()
  },

  // Generate case number
  async generateCaseNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `CASE-${year}-`

    const { data, error } = await db
      .from(TABLE_NAME)
      .select('case_number')
      .eq('organization_id', organizationId)
      .like('case_number', `${prefix}%`)
      .order('case_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    const rows = (data || []) as CaseNumberRow[]
    if (rows.length > 0 && rows[0].case_number) {
      const lastNumber = parseInt(rows[0].case_number.replace(prefix, ''), 10)
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`
  },
}
