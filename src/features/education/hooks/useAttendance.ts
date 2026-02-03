import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceService } from '../services/attendance.service'
import type {
  Attendance,
  CreateAttendanceInput,
  BulkAttendanceInput,
  AttendanceFilters,
  AttendanceStatus,
} from '../types/education.types'

interface UseAttendanceOptions {
  organizationId?: string
  filters?: AttendanceFilters
}

/**
 * Hook to fetch attendance records with optional filters
 */
export function useAttendance(options: UseAttendanceOptions = {}) {
  const { organizationId, filters } = options
  const queryClient = useQueryClient()

  const queryKey = ['attendance', organizationId, filters]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return []
      return attendanceService.getAll(organizationId, filters)
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  })

  // Create mutation
  const createAttendance = useMutation({
    mutationFn: async (input: CreateAttendanceInput) => {
      if (!organizationId) throw new Error('Organization ID required')
      return attendanceService.create(organizationId, input)
    },
    onSuccess: () => {
      // Precizna invalidacija - samo za ovu organizaciju
      queryClient.invalidateQueries({ queryKey: ['attendance', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'student', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments', organizationId] })
    },
  })

  // Bulk upsert mutation
  const bulkUpsertAttendance = useMutation({
    mutationFn: async (input: BulkAttendanceInput) => {
      if (!organizationId) throw new Error('Organization ID required')
      return attendanceService.bulkUpsert(organizationId, input)
    },
    onSuccess: () => {
      // Precizna invalidacija - samo za ovu organizaciju
      queryClient.invalidateQueries({ queryKey: ['attendance', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'student', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments', organizationId] })
    },
  })

  // Update mutation
  const updateAttendance = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string
      status: AttendanceStatus
      notes?: string | null
    }) => {
      return attendanceService.update(id, status, notes)
    },
    onSuccess: () => {
      // Precizna invalidacija - samo za ovu organizaciju
      queryClient.invalidateQueries({ queryKey: ['attendance', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'student', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments', organizationId] })
    },
  })

  // Delete mutation
  const deleteAttendance = useMutation({
    mutationFn: async (id: string) => {
      return attendanceService.delete(id)
    },
    onSuccess: () => {
      // Precizna invalidacija - samo za ovu organizaciju
      queryClient.invalidateQueries({ queryKey: ['attendance', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'student', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments', organizationId] })
    },
  })

  return {
    attendance: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
    refetch: query.refetch,
    createAttendance: createAttendance.mutateAsync,
    bulkUpsertAttendance: bulkUpsertAttendance.mutateAsync,
    updateAttendance: updateAttendance.mutateAsync,
    deleteAttendance: deleteAttendance.mutateAsync,
    isCreating: createAttendance.isPending,
    isBulkUpserting: bulkUpsertAttendance.isPending,
    isUpdating: updateAttendance.isPending,
    isDeleting: deleteAttendance.isPending,
  }
}

/**
 * Hook to fetch attendance for a specific class and date
 */
export function useClassAttendance(
  organizationId: string | null,
  classId: string | null,
  date: string | null
) {
  return useQuery({
    queryKey: ['attendance', 'class', organizationId, classId, date],
    queryFn: async () => {
      if (!organizationId || !classId || !date) return []
      return attendanceService.getByClassAndDate(organizationId, classId, date)
    },
    enabled: !!organizationId && !!classId && !!date,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch attendance history for a specific student
 */
export function useStudentAttendance(
  organizationId: string | null,
  memberId: string | null,
  classId?: string
) {
  return useQuery({
    queryKey: ['attendance', 'student', organizationId, memberId, classId],
    queryFn: async () => {
      if (!organizationId || !memberId) return []
      return attendanceService.getByMember(organizationId, memberId, classId)
    },
    enabled: !!organizationId && !!memberId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get attendance summary for a class
 */
export function useClassAttendanceSummary(
  organizationId: string | null,
  classId: string | null,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: ['attendance', 'summary', 'class', organizationId, classId, dateFrom, dateTo],
    queryFn: async () => {
      if (!organizationId || !classId) {
        return {
          totalSessions: 0,
          totalRecords: 0,
          byStatus: {} as Record<AttendanceStatus, number>,
          attendanceRate: 0,
        }
      }
      return attendanceService.getClassSummary(organizationId, classId, dateFrom, dateTo)
    },
    enabled: !!organizationId && !!classId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get attendance summary for a student
 */
export function useStudentAttendanceSummary(
  organizationId: string | null,
  memberId: string | null,
  classId?: string
) {
  return useQuery({
    queryKey: ['attendance', 'summary', 'student', organizationId, memberId, classId],
    queryFn: async () => {
      if (!organizationId || !memberId) {
        return {
          totalClasses: 0,
          attended: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
        }
      }
      return attendanceService.getStudentSummary(organizationId, memberId, classId)
    },
    enabled: !!organizationId && !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
