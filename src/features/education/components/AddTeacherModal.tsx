import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#F43F5E', '#A855F7', '#EAB308', '#22C55E', '#0EA5E9',
  '#64748B', '#78716C', '#DC2626', '#059669', '#0284C7', '#7C3AED', '#C026D3', '#DB2777',
  '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#0891B2', '#0D9488', '#0369A1',
  '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#9333EA', '#A21CAF', '#BE185D', '#B91C1C',
  '#C2410C', '#B45309', '#854D0E', '#713F12', '#365314', '#14532D', '#164E63', '#155E75',
  '#0C4A6E', '#1E293B', '#0F172A',
]

interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

interface Member {
  id: number
  first_name: string
  last_name: string
  role: string | null
}

export default function AddTeacherModal({ isOpen, onClose, onSave }: AddTeacherModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0])
  const isDirty = selectedMemberId !== '' || selectedColor !== DEFAULT_COLORS[0]

  useEscapeKey(
    onClose,
    isDirty,
    t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?',
    isOpen
  )

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm(t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose, t])

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMembers()
      setSelectedMemberId('')
      setSelectedColor(DEFAULT_COLORS[0])
    }
  }, [isOpen])

  const fetchAvailableMembers = async () => {
    try {
      setFetching(true)

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('member_id')
        .eq('organization_id', currentOrganizationId)

      if (enrollmentsError) {
        console.warn('Error fetching enrollments:', enrollmentsError)
      }

      const enrolledMemberIds = (enrollments || []).map(e => e.member_id)

      const { data: existingTeachers, error: teachersError } = await supabase
        .from('teachers')
        .select('member_id')
        .eq('organization_id', currentOrganizationId)

      if (teachersError) {
        console.warn('Error fetching teachers:', teachersError)
      }

      const teacherMemberIds = (existingTeachers || []).map(t => t.member_id)

      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, membership_type')
        .eq('organization_id', currentOrganizationId)
        .order('first_name', { ascending: true })

      if (error) throw error

      const availableMembers = (data || []).filter(member =>
        !enrolledMemberIds.includes(member.id) && !teacherMemberIds.includes(member.id)
      )

      setMembers(availableMembers)
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMemberId) {
      alert(t('common.selectTeacher') || 'Please select a teacher')
      return
    }

    setLoading(true)

    try {
      const { data: enrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('member_id', parseInt(selectedMemberId))
        .eq('organization_id', currentOrganizationId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking enrollment:', checkError)
      }

      if (enrollment) {
        const selectedMember = members.find(m => m.id === parseInt(selectedMemberId))
        const memberName = selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : t('education.defaultStudent')
        alert(t('education.cannotAddEnrolledStudent') || `${memberName} is enrolled as a student and cannot be added as a teacher. Please remove their enrollment first.`)
        setLoading(false)
        return
      }

      const { data: existingTeacher, error: checkTeacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('member_id', parseInt(selectedMemberId))
        .eq('organization_id', currentOrganizationId)
        .maybeSingle()

      if (checkTeacherError) {
        console.error('Error checking existing teacher:', checkTeacherError)
      }

      if (existingTeacher) {
        const { error } = await supabase
          .from('teachers')
          .update({ teacher_color: selectedColor })
          .eq('id', existingTeacher.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('teachers')
          .insert({
            member_id: parseInt(selectedMemberId),
            teacher_color: selectedColor,
            organization_id: currentOrganizationId,
          })

        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error adding teacher:', error)
      alert(t('common.failedToAdd') || `Failed to add teacher: ${(error as any).message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('education.addTeacher') || 'New Teacher'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fetching ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">{t('common.loading') || 'Loading...'}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('common.selectTeacher') || 'Select Teacher from People'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">{t('common.selectTeacher') || 'Select a teacher'}</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('education.teacherColor') || 'Color Code'} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          selectedColor === color
                            ? 'border-slate-900 dark:border-slate-100 scale-110'
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-16 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.saving') || 'Saving...' : t('common.add') || 'Add'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
