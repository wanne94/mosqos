import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Calendar, Download, Filter, BarChart3 } from 'lucide-react'
import { useOrganization } from '../../../hooks/useOrganization'
import { useStudentAttendance, useStudentAttendanceSummary } from '../hooks/useAttendance'
import AttendanceStatusBadge from './AttendanceStatusBadge'
import type { AttendanceStatus } from '../types/education.types'

interface AttendanceHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  classId?: string
  className?: string
}

export default function AttendanceHistoryModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  classId,
  className,
}: AttendanceHistoryModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('')

  // Fetch attendance history
  const { data: attendance = [], isLoading } = useStudentAttendance(
    currentOrganizationId,
    memberId,
    classId
  )

  // Fetch summary
  const { data: summary } = useStudentAttendanceSummary(
    currentOrganizationId,
    memberId,
    classId
  )

  // Filter attendance records
  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      if (dateFrom && record.attendance_date < dateFrom) return false
      if (dateTo && record.attendance_date > dateTo) return false
      if (statusFilter && record.status !== statusFilter) return false
      return true
    })
  }, [attendance, dateFrom, dateTo, statusFilter])

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Status', 'Check In', 'Check Out', 'Notes']
    const rows = filteredAttendance.map((record) => [
      record.attendance_date,
      record.status,
      record.check_in_time || '',
      record.check_out_time || '',
      record.notes || '',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendance_${memberName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
  }

  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t('attendance.attendanceHistory') || 'Attendance History'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {memberName}
              {className && ` - ${className}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('attendance.summary') || 'Summary'}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.totalClasses}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('attendance.totalClasses') || 'Total Classes'}
                </p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.attended}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('attendance.present') || 'Present'}
                </p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.absent}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('attendance.absent') || 'Absent'}
                </p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {summary.late}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('attendance.late') || 'Late'}
                </p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className={`text-2xl font-bold ${
                  summary.attendanceRate >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : summary.attendanceRate >= 60
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {summary.attendanceRate}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('attendance.rate') || 'Rate'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('attendance.filters') || 'Filters'}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('attendance.from') || 'From'}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('attendance.to') || 'To'}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('attendance.status') || 'Status'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | '')}
                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">{t('attendance.allStatuses') || 'All Statuses'}</option>
                <option value="present">{t('attendance.present') || 'Present'}</option>
                <option value="absent">{t('attendance.absent') || 'Absent'}</option>
                <option value="late">{t('attendance.late') || 'Late'}</option>
                <option value="excused">{t('attendance.excused') || 'Excused'}</option>
                <option value="early_leave">{t('attendance.earlyLeave') || 'Early Leave'}</option>
              </select>
            </div>
            <div className="flex-1" />
            {(dateFrom || dateTo || statusFilter) && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {t('attendance.clearFilters') || 'Clear Filters'}
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Download size={14} />
              {t('attendance.export') || 'Export'}
            </button>
          </div>
        </div>

        {/* Attendance List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              {t('common.loading') || 'Loading...'}
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              {t('attendance.noRecordsFound') || 'No attendance records found'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(record.attendance_date)}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(record.check_in_time || record.check_out_time) && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {record.check_in_time && `In: ${record.check_in_time}`}
                        {record.check_in_time && record.check_out_time && ' | '}
                        {record.check_out_time && `Out: ${record.check_out_time}`}
                      </span>
                    )}
                    <AttendanceStatusBadge status={record.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
