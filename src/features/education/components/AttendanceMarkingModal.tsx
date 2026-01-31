import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Check, Users, Calendar, Search, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase/client'
import { useOrganization } from '../../../hooks/useOrganization'
import { attendanceService } from '../services/attendance.service'
import AttendanceStatusBadge from './AttendanceStatusBadge'
import type { AttendanceStatus, Enrollment } from '../types/education.types'

interface AttendanceMarkingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classId?: string
  className?: string
}

interface AttendanceRecord {
  memberId: string
  firstName: string
  lastName: string
  status: AttendanceStatus
  notes: string
}

const statusOptions: AttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'early_leave']

export default function AttendanceMarkingModal({
  isOpen,
  onClose,
  onSave,
  classId,
  className,
}: AttendanceMarkingModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const queryClient = useQueryClient()

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClassId, setSelectedClassId] = useState(classId || '')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  // Fetch classes for selection
  const { data: classes = [] } = useQuery({
    queryKey: ['scheduled-classes', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return []
      const { data, error } = await (supabase as any)
        .from('scheduled_classes')
        .select('id, name')
        .eq('organization_id', currentOrganizationId)
        .in('status', ['active', 'scheduled'])
        .order('name')

      if (error) throw error
      return data as { id: string; name: string }[]
    },
    enabled: !!currentOrganizationId && isOpen,
  })

  // Fetch enrollments for the selected class
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', currentOrganizationId, selectedClassId],
    queryFn: async () => {
      if (!currentOrganizationId || !selectedClassId) return []
      const { data, error } = await (supabase as any)
        .from('enrollments')
        .select(`
          id,
          member_id,
          organization_members:member_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('organization_id', currentOrganizationId)
        .eq('scheduled_class_id', selectedClassId)
        .in('status', ['active', 'pending'])
        .order('created_at')

      if (error) throw error
      return data as Array<{
        id: string
        member_id: string
        organization_members: {
          id: string
          first_name: string
          last_name: string
        }
      }>
    },
    enabled: !!currentOrganizationId && !!selectedClassId && isOpen,
  })

  // Fetch existing attendance for this date
  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['attendance', currentOrganizationId, selectedClassId, attendanceDate],
    queryFn: async () => {
      if (!currentOrganizationId || !selectedClassId || !attendanceDate) return []
      return attendanceService.getByClassAndDate(currentOrganizationId, selectedClassId, attendanceDate)
    },
    enabled: !!currentOrganizationId && !!selectedClassId && !!attendanceDate && isOpen,
  })

  // Initialize records when enrollments load
  useEffect(() => {
    if (enrollments.length > 0) {
      const newRecords = enrollments.map((enrollment) => {
        const existing = existingAttendance.find((a) => a.member_id === enrollment.member_id)
        return {
          memberId: enrollment.member_id,
          firstName: enrollment.organization_members?.first_name || '',
          lastName: enrollment.organization_members?.last_name || '',
          status: existing?.status || ('present' as AttendanceStatus),
          notes: existing?.notes || '',
        }
      })
      setRecords(newRecords)
    } else {
      setRecords([])
    }
  }, [enrollments, existingAttendance])

  // Reset when class changes
  useEffect(() => {
    if (classId) {
      setSelectedClassId(classId)
    }
  }, [classId])

  // Bulk save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrganizationId || !selectedClassId) {
        throw new Error('Missing required data')
      }

      return attendanceService.bulkUpsert(currentOrganizationId, {
        scheduled_class_id: selectedClassId,
        attendance_date: attendanceDate,
        records: records.map((r) => ({
          member_id: r.memberId,
          status: r.status,
          notes: r.notes || null,
        })),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      toast.success(t('attendance.savedSuccessfully') || 'Attendance saved successfully')
      onSave()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(t('attendance.failedToSave') || 'Failed to save attendance', {
        description: error.message,
      })
    },
  })

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.memberId === memberId ? { ...r, status } : r))
    )
    setIsDirty(true)
  }

  const handleNotesChange = (memberId: string, notes: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.memberId === memberId ? { ...r, notes } : r))
    )
    setIsDirty(true)
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })))
    setIsDirty(true)
  }

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm(t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  // Filter records by search
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records
    const query = searchQuery.toLowerCase()
    return records.filter(
      (r) =>
        r.firstName.toLowerCase().includes(query) ||
        r.lastName.toLowerCase().includes(query)
    )
  }, [records, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const total = records.length
    const present = records.filter((r) => r.status === 'present').length
    const absent = records.filter((r) => r.status === 'absent').length
    const late = records.filter((r) => r.status === 'late').length
    const excused = records.filter((r) => r.status === 'excused').length
    return { total, present, absent, late, excused }
  }, [records])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t('attendance.markAttendance') || 'Mark Attendance'}
            </h2>
            {className && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{className}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Controls */}
          <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Selector */}
              {!classId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('attendance.selectClass') || 'Select Class'} *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">{t('attendance.chooseClass') || 'Choose a class...'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar size={14} className="inline-block me-1" />
                  {t('attendance.date') || 'Date'} *
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('attendance.quickActions') || 'Quick Actions'}:
                </span>
                <button
                  type="button"
                  onClick={() => handleMarkAll('present')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <CheckCircle2 size={14} />
                  {t('attendance.markAllPresent') || 'All Present'}
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('absent')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <XCircle size={14} />
                  {t('attendance.markAllAbsent') || 'All Absent'}
                </button>
              </div>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder={t('attendance.searchStudents') || 'Search students...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 pe-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Stats Summary */}
            {records.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  <Users size={14} className="inline-block me-1" />
                  {stats.total} {t('attendance.students') || 'students'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {stats.present} {t('attendance.present') || 'present'}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  {stats.absent} {t('attendance.absent') || 'absent'}
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {stats.late} {t('attendance.late') || 'late'}
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {stats.excused} {t('attendance.excused') || 'excused'}
                </span>
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto p-4">
            {enrollmentsLoading ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                {t('common.loading') || 'Loading...'}
              </div>
            ) : !selectedClassId ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                {t('attendance.selectClassFirst') || 'Please select a class first'}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? t('attendance.noStudentsFound') || 'No students found'
                  : t('attendance.noEnrollments') || 'No students enrolled in this class'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <div
                    key={record.memberId}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                  >
                    {/* Student Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {record.firstName} {record.lastName}
                      </p>
                    </div>

                    {/* Status Selector */}
                    <div className="flex items-center gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(record.memberId, status)}
                          className={`transition-all ${
                            record.status === status
                              ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-800 rounded-full'
                              : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          <AttendanceStatusBadge
                            status={status}
                            size="sm"
                            showLabel={false}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Notes */}
                    <input
                      type="text"
                      placeholder={t('attendance.notes') || 'Notes...'}
                      value={record.notes}
                      onChange={(e) => handleNotesChange(record.memberId, e.target.value)}
                      className="w-32 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending || records.length === 0 || !selectedClassId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              {saveMutation.isPending
                ? t('common.saving') || 'Saving...'
                : t('attendance.saveAttendance') || 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
