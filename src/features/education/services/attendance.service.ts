import { supabase } from '@/lib/supabase/client'
import type {
  Attendance,
  CreateAttendanceInput,
  BulkAttendanceInput,
  AttendanceFilters,
  AttendanceStatus,
} from '../types/education.types'

/**
 * Attendance service for the Education module
 * Handles CRUD operations for class attendance records
 */
export const attendanceService = {
  /**
   * Get attendance records with optional filters
   */
  async getAll(organizationId: string, filters?: AttendanceFilters): Promise<Attendance[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('attendance')
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)

    if (filters?.scheduled_class_id) {
      query = query.eq('scheduled_class_id', filters.scheduled_class_id)
    }

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters?.date_from) {
      query = query.gte('attendance_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('attendance_date', filters.date_to)
    }

    const { data, error } = await query.order('attendance_date', { ascending: false })

    if (error) throw error
    return (data || []) as Attendance[]
  },

  /**
   * Get attendance for a specific class on a specific date
   */
  async getByClassAndDate(
    organizationId: string,
    classId: string,
    date: string
  ): Promise<Attendance[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('attendance')
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('scheduled_class_id', classId)
      .eq('attendance_date', date)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as Attendance[]
  },

  /**
   * Get attendance history for a specific student
   */
  async getByMember(
    organizationId: string,
    memberId: string,
    classId?: string
  ): Promise<Attendance[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('attendance')
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('member_id', memberId)

    if (classId) {
      query = query.eq('scheduled_class_id', classId)
    }

    const { data, error } = await query.order('attendance_date', { ascending: false })

    if (error) throw error
    return (data || []) as Attendance[]
  },

  /**
   * Create a single attendance record
   */
  async create(organizationId: string, input: CreateAttendanceInput): Promise<Attendance> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('attendance')
      .insert({
        organization_id: organizationId,
        ...input,
      })
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (error) throw error
    return data as Attendance
  },

  /**
   * Create or update attendance in bulk for a class session
   */
  async bulkUpsert(organizationId: string, input: BulkAttendanceInput): Promise<Attendance[]> {
    const records = input.records.map((record) => ({
      organization_id: organizationId,
      scheduled_class_id: input.scheduled_class_id,
      attendance_date: input.attendance_date,
      member_id: record.member_id,
      status: record.status,
      notes: record.notes || null,
    }))

    // Upsert attendance records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('attendance')
      .upsert(records, {
        onConflict: 'organization_id,scheduled_class_id,member_id,attendance_date',
        ignoreDuplicates: false,
      })
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        )
      `)

    if (error) throw error
    return (data || []) as Attendance[]
  },

  /**
   * Update a single attendance record
   */
  async update(
    id: string,
    status: AttendanceStatus,
    notes?: string | null
  ): Promise<Attendance> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('attendance')
      .update({
        status,
        notes,
      })
      .eq('id', id)
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (error) throw error
    return data as Attendance
  },

  /**
   * Delete an attendance record
   */
  async delete(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('attendance')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Get attendance summary statistics for a class
   */
  async getClassSummary(
    organizationId: string,
    classId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalSessions: number
    totalRecords: number
    byStatus: Record<AttendanceStatus, number>
    attendanceRate: number
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('attendance')
      .select('status, attendance_date')
      .eq('organization_id', organizationId)
      .eq('scheduled_class_id', classId)

    if (dateFrom) {
      query = query.gte('attendance_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('attendance_date', dateTo)
    }

    const { data, error } = await query

    if (error) throw error

    const records = (data || []) as { status: AttendanceStatus; attendance_date: string }[]
    const uniqueDates = new Set(records.map((r) => r.attendance_date))

    const byStatus = records.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1
        return acc
      },
      {} as Record<AttendanceStatus, number>
    )

    const totalRecords = records.length
    const presentCount = (byStatus.present || 0) + (byStatus.late || 0)
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

    return {
      totalSessions: uniqueDates.size,
      totalRecords,
      byStatus,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    }
  },

  /**
   * Get attendance summary for a specific student
   */
  async getStudentSummary(
    organizationId: string,
    memberId: string,
    classId?: string
  ): Promise<{
    totalClasses: number
    attended: number
    absent: number
    late: number
    excused: number
    attendanceRate: number
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('attendance')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('member_id', memberId)

    if (classId) {
      query = query.eq('scheduled_class_id', classId)
    }

    const { data, error } = await query

    if (error) throw error

    const records = (data || []) as { status: AttendanceStatus }[]
    const totalClasses = records.length
    const attended = records.filter((r) => r.status === 'present').length
    const absent = records.filter((r) => r.status === 'absent').length
    const late = records.filter((r) => r.status === 'late').length
    const excused = records.filter((r) => r.status === 'excused').length

    const attendanceRate =
      totalClasses > 0 ? ((attended + late) / totalClasses) * 100 : 0

    return {
      totalClasses,
      attended,
      absent,
      late,
      excused,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    }
  },
}
