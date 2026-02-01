import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helper to create chainable mock query builder
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
    'gt',
    'neq',
    'order',
    'limit',
    'maybeSingle',
    'upsert',
  ]

  methods.forEach((method) => {
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

import { attendanceService } from './attendance.service'
import { supabase } from '@/lib/supabase/client'
import { AttendanceStatus } from '../types/education.types'

describe('attendanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // CRUD TESTS
  // ============================================================================

  describe('getAll', () => {
    const mockAttendanceRecords = [
      {
        id: 'att-1',
        organization_id: 'org-123',
        scheduled_class_id: 'class-1',
        member_id: 'member-1',
        attendance_date: '2024-01-15',
        status: 'present',
        notes: null,
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
      },
      {
        id: 'att-2',
        organization_id: 'org-123',
        scheduled_class_id: 'class-1',
        member_id: 'member-2',
        attendance_date: '2024-01-15',
        status: 'absent',
        notes: 'Sick',
        member: { id: 'member-2', first_name: 'Jane', last_name: 'Smith' },
      },
    ]

    it('should fetch all attendance records for an organization', async () => {
      const mockQuery = createMockQueryBuilder({ data: mockAttendanceRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getAll('org-123')

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.order).toHaveBeenCalledWith('attendance_date', { ascending: false })
      expect(result).toEqual(mockAttendanceRecords)
    })

    it('should apply scheduled_class_id filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getAll('org-123', { scheduled_class_id: 'class-1' })

      expect(mockQuery.eq).toHaveBeenCalledWith('scheduled_class_id', 'class-1')
    })

    it('should apply member_id filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getAll('org-123', { member_id: 'member-1' })

      expect(mockQuery.eq).toHaveBeenCalledWith('member_id', 'member-1')
    })

    it('should apply single status filter using eq', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getAll('org-123', { status: AttendanceStatus.PRESENT })

      expect(mockQuery.eq).toHaveBeenCalledWith('status', AttendanceStatus.PRESENT)
    })

    it('should apply status array filter using in', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getAll('org-123', {
        status: [AttendanceStatus.PRESENT, AttendanceStatus.LATE],
      })

      expect(mockQuery.in).toHaveBeenCalledWith('status', [
        AttendanceStatus.PRESENT,
        AttendanceStatus.LATE,
      ])
    })

    it('should apply date_from filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getAll('org-123', { date_from: '2024-01-01' })

      expect(mockQuery.gte).toHaveBeenCalledWith('attendance_date', '2024-01-01')
    })

    it('should apply date_to filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getAll('org-123', { date_to: '2024-12-31' })

      expect(mockQuery.lte).toHaveBeenCalledWith('attendance_date', '2024-12-31')
    })

    it('should apply multiple filters together', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getAll('org-123', {
        scheduled_class_id: 'class-1',
        member_id: 'member-1',
        status: AttendanceStatus.PRESENT,
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('scheduled_class_id', 'class-1')
      expect(mockQuery.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', AttendanceStatus.PRESENT)
      expect(mockQuery.gte).toHaveBeenCalledWith('attendance_date', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('attendance_date', '2024-12-31')
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(attendanceService.getAll('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getByClassAndDate', () => {
    it('should fetch attendance for a specific class on a specific date', async () => {
      const mockAttendance = [
        {
          id: 'att-1',
          organization_id: 'org-123',
          scheduled_class_id: 'class-1',
          member_id: 'member-1',
          attendance_date: '2024-01-15',
          status: 'present',
          member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockAttendance, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getByClassAndDate('org-123', 'class-1', '2024-01-15')

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('scheduled_class_id', 'class-1')
      expect(mockQuery.eq).toHaveBeenCalledWith('attendance_date', '2024-01-15')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
      expect(result).toEqual(mockAttendance)
    })

    it('should return empty array when no records found', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getByClassAndDate('org-123', 'class-1', '2024-01-15')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        attendanceService.getByClassAndDate('org-123', 'class-1', '2024-01-15')
      ).rejects.toEqual({ message: 'Query failed' })
    })
  })

  describe('getByMember', () => {
    it('should fetch attendance history for a specific student', async () => {
      const mockAttendance = [
        {
          id: 'att-1',
          member_id: 'member-1',
          attendance_date: '2024-01-15',
          status: 'present',
          member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
        },
        {
          id: 'att-2',
          member_id: 'member-1',
          attendance_date: '2024-01-14',
          status: 'late',
          member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockAttendance, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getByMember('org-123', 'member-1')

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(mockQuery.order).toHaveBeenCalledWith('attendance_date', { ascending: false })
      expect(result).toEqual(mockAttendance)
    })

    it('should apply optional class filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getByMember('org-123', 'member-1', 'class-1')

      expect(mockQuery.eq).toHaveBeenCalledWith('scheduled_class_id', 'class-1')
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(attendanceService.getByMember('org-123', 'member-1')).rejects.toEqual({
        message: 'Query failed',
      })
    })
  })

  describe('create', () => {
    it('should create a single attendance record', async () => {
      const input = {
        scheduled_class_id: 'class-1',
        member_id: 'member-1',
        attendance_date: '2024-01-15',
        status: AttendanceStatus.PRESENT,
        notes: 'On time',
      }

      const createdAttendance = {
        id: 'att-new',
        organization_id: 'org-123',
        ...input,
        check_in_time: null,
        check_out_time: null,
        late_minutes: 0,
        created_at: '2024-01-15T09:00:00Z',
        created_by: null,
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
      }

      const mockQuery = createMockQueryBuilder({ data: createdAttendance, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.create('org-123', input)

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        organization_id: 'org-123',
        ...input,
      })
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(createdAttendance)
    })

    it('should throw error when creation fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        attendanceService.create('org-123', {
          scheduled_class_id: 'class-1',
          member_id: 'member-1',
          attendance_date: '2024-01-15',
        })
      ).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  describe('bulkUpsert', () => {
    it('should create or update multiple attendance records', async () => {
      const input = {
        scheduled_class_id: 'class-1',
        attendance_date: '2024-01-15',
        records: [
          { member_id: 'member-1', status: AttendanceStatus.PRESENT, notes: null },
          { member_id: 'member-2', status: AttendanceStatus.ABSENT, notes: 'Sick' },
          { member_id: 'member-3', status: AttendanceStatus.LATE, notes: '10 min late' },
        ],
      }

      const upsertedRecords = [
        {
          id: 'att-1',
          organization_id: 'org-123',
          scheduled_class_id: 'class-1',
          attendance_date: '2024-01-15',
          member_id: 'member-1',
          status: 'present',
          notes: null,
          member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
        },
        {
          id: 'att-2',
          organization_id: 'org-123',
          scheduled_class_id: 'class-1',
          attendance_date: '2024-01-15',
          member_id: 'member-2',
          status: 'absent',
          notes: 'Sick',
          member: { id: 'member-2', first_name: 'Jane', last_name: 'Smith' },
        },
        {
          id: 'att-3',
          organization_id: 'org-123',
          scheduled_class_id: 'class-1',
          attendance_date: '2024-01-15',
          member_id: 'member-3',
          status: 'late',
          notes: '10 min late',
          member: { id: 'member-3', first_name: 'Bob', last_name: 'Johnson' },
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: upsertedRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.bulkUpsert('org-123', input)

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.upsert).toHaveBeenCalledWith(
        [
          {
            organization_id: 'org-123',
            scheduled_class_id: 'class-1',
            attendance_date: '2024-01-15',
            member_id: 'member-1',
            status: AttendanceStatus.PRESENT,
            notes: null,
          },
          {
            organization_id: 'org-123',
            scheduled_class_id: 'class-1',
            attendance_date: '2024-01-15',
            member_id: 'member-2',
            status: AttendanceStatus.ABSENT,
            notes: 'Sick',
          },
          {
            organization_id: 'org-123',
            scheduled_class_id: 'class-1',
            attendance_date: '2024-01-15',
            member_id: 'member-3',
            status: AttendanceStatus.LATE,
            notes: '10 min late',
          },
        ],
        {
          onConflict: 'organization_id,scheduled_class_id,member_id,attendance_date',
          ignoreDuplicates: false,
        }
      )
      expect(result).toEqual(upsertedRecords)
    })

    it('should handle notes field with undefined value', async () => {
      const input = {
        scheduled_class_id: 'class-1',
        attendance_date: '2024-01-15',
        records: [{ member_id: 'member-1', status: AttendanceStatus.PRESENT }],
      }

      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.bulkUpsert('org-123', input)

      expect(mockQuery.upsert).toHaveBeenCalledWith(
        [
          {
            organization_id: 'org-123',
            scheduled_class_id: 'class-1',
            attendance_date: '2024-01-15',
            member_id: 'member-1',
            status: AttendanceStatus.PRESENT,
            notes: null,
          },
        ],
        expect.any(Object)
      )
    })

    it('should throw error when bulk upsert fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Upsert failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        attendanceService.bulkUpsert('org-123', {
          scheduled_class_id: 'class-1',
          attendance_date: '2024-01-15',
          records: [{ member_id: 'member-1', status: AttendanceStatus.PRESENT }],
        })
      ).rejects.toEqual({ message: 'Upsert failed' })
    })
  })

  describe('update', () => {
    it('should update status and notes', async () => {
      const updatedAttendance = {
        id: 'att-1',
        organization_id: 'org-123',
        scheduled_class_id: 'class-1',
        member_id: 'member-1',
        attendance_date: '2024-01-15',
        status: 'excused',
        notes: 'Doctor appointment',
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
      }

      const mockQuery = createMockQueryBuilder({ data: updatedAttendance, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.update(
        'att-1',
        AttendanceStatus.EXCUSED,
        'Doctor appointment'
      )

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: AttendanceStatus.EXCUSED,
        notes: 'Doctor appointment',
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'att-1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(updatedAttendance)
    })

    it('should update with null notes', async () => {
      const updatedAttendance = {
        id: 'att-1',
        status: 'present',
        notes: null,
        member: { id: 'member-1', first_name: 'John', last_name: 'Doe' },
      }

      const mockQuery = createMockQueryBuilder({ data: updatedAttendance, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.update('att-1', AttendanceStatus.PRESENT, null)

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: AttendanceStatus.PRESENT,
        notes: null,
      })
    })

    it('should throw error when update fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(attendanceService.update('att-1', AttendanceStatus.PRESENT)).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })

  describe('delete', () => {
    it('should delete an attendance record', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(attendanceService.delete('att-1')).resolves.toBeUndefined()

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'att-1')
    })

    it('should throw error when delete fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(attendanceService.delete('att-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  describe('getClassSummary', () => {
    it('should calculate summary statistics for a class', async () => {
      const mockRecords = [
        { status: 'present', attendance_date: '2024-01-15' },
        { status: 'present', attendance_date: '2024-01-15' },
        { status: 'absent', attendance_date: '2024-01-15' },
        { status: 'late', attendance_date: '2024-01-15' },
        { status: 'present', attendance_date: '2024-01-16' },
        { status: 'excused', attendance_date: '2024-01-16' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getClassSummary('org-123', 'class-1')

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.select).toHaveBeenCalledWith('status, attendance_date')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('scheduled_class_id', 'class-1')

      expect(result.totalSessions).toBe(2) // 2 unique dates
      expect(result.totalRecords).toBe(6)
      expect(result.byStatus).toEqual({
        present: 3,
        absent: 1,
        late: 1,
        excused: 1,
      })
      // Attendance rate = (present + late) / total * 100 = (3 + 1) / 6 * 100 = 66.7%
      expect(result.attendanceRate).toBe(66.7)
    })

    it('should apply date filters', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getClassSummary('org-123', 'class-1', '2024-01-01', '2024-12-31')

      expect(mockQuery.gte).toHaveBeenCalledWith('attendance_date', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('attendance_date', '2024-12-31')
    })

    it('should handle empty records', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getClassSummary('org-123', 'class-1')

      expect(result.totalSessions).toBe(0)
      expect(result.totalRecords).toBe(0)
      expect(result.byStatus).toEqual({})
      expect(result.attendanceRate).toBe(0)
    })

    it('should handle all present records (100% attendance)', async () => {
      const mockRecords = [
        { status: 'present', attendance_date: '2024-01-15' },
        { status: 'present', attendance_date: '2024-01-15' },
        { status: 'present', attendance_date: '2024-01-16' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getClassSummary('org-123', 'class-1')

      expect(result.attendanceRate).toBe(100)
    })

    it('should include late as attended in attendance rate', async () => {
      const mockRecords = [
        { status: 'late', attendance_date: '2024-01-15' },
        { status: 'late', attendance_date: '2024-01-15' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getClassSummary('org-123', 'class-1')

      expect(result.attendanceRate).toBe(100) // All late = 100% attended
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(attendanceService.getClassSummary('org-123', 'class-1')).rejects.toEqual({
        message: 'Query failed',
      })
    })
  })

  describe('getStudentSummary', () => {
    it('should calculate summary statistics for a student', async () => {
      const mockRecords = [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'late' },
        { status: 'excused' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getStudentSummary('org-123', 'member-1')

      expect(supabase.from).toHaveBeenCalledWith('attendance')
      expect(mockQuery.select).toHaveBeenCalledWith('status')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('member_id', 'member-1')

      expect(result.totalClasses).toBe(5)
      expect(result.attended).toBe(2)
      expect(result.absent).toBe(1)
      expect(result.late).toBe(1)
      expect(result.excused).toBe(1)
      // Attendance rate = (attended + late) / total * 100 = (2 + 1) / 5 * 100 = 60%
      expect(result.attendanceRate).toBe(60)
    })

    it('should apply optional class filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await attendanceService.getStudentSummary('org-123', 'member-1', 'class-1')

      expect(mockQuery.eq).toHaveBeenCalledWith('scheduled_class_id', 'class-1')
    })

    it('should handle empty records', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getStudentSummary('org-123', 'member-1')

      expect(result.totalClasses).toBe(0)
      expect(result.attended).toBe(0)
      expect(result.absent).toBe(0)
      expect(result.late).toBe(0)
      expect(result.excused).toBe(0)
      expect(result.attendanceRate).toBe(0)
    })

    it('should handle perfect attendance', async () => {
      const mockRecords = [{ status: 'present' }, { status: 'present' }, { status: 'present' }]

      const mockQuery = createMockQueryBuilder({ data: mockRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getStudentSummary('org-123', 'member-1')

      expect(result.attended).toBe(3)
      expect(result.attendanceRate).toBe(100)
    })

    it('should handle all absences', async () => {
      const mockRecords = [{ status: 'absent' }, { status: 'absent' }]

      const mockQuery = createMockQueryBuilder({ data: mockRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getStudentSummary('org-123', 'member-1')

      expect(result.absent).toBe(2)
      expect(result.attendanceRate).toBe(0)
    })

    it('should round attendance rate to one decimal place', async () => {
      // 2 present + 1 late out of 9 = 33.333...%
      const mockRecords = [
        { status: 'present' },
        { status: 'present' },
        { status: 'late' },
        { status: 'absent' },
        { status: 'absent' },
        { status: 'absent' },
        { status: 'absent' },
        { status: 'absent' },
        { status: 'absent' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRecords, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await attendanceService.getStudentSummary('org-123', 'member-1')

      expect(result.attendanceRate).toBe(33.3)
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(attendanceService.getStudentSummary('org-123', 'member-1')).rejects.toEqual({
        message: 'Query failed',
      })
    })
  })
})
