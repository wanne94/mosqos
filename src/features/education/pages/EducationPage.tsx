import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, BookOpen, GraduationCap, Building2 } from 'lucide-react'
import { useOrganization } from '../../../hooks/useOrganization'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase/client'
import {
  AddClassModal,
  EditClassModal,
  DeleteClassModal,
  EnrollStudentModal,
  EditEnrollmentModal,
  DeleteEnrollmentModal,
  StudentNotesModal,
  StudentPaymentHistoryModal,
  OutstandingPaymentsModal,
  AddTeacherModal,
  EditTeacherModal,
  CreateClassroomModal,
  EditClassroomModal,
} from '../components'
import type {
  Course,
  Enrollment,
  Teacher,
  Classroom,
} from '../types/education.types'

interface EnrollmentWithPayment extends Enrollment {
  organization_members?: {
    id: string
    first_name: string
    last_name: string
  }
}

type TabType = 'enrollments' | 'classrooms' | 'teachers' | 'courses'

export default function EducationPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { currentOrganizationId } = useOrganization()
  const queryClient = useQueryClient()

  // State
  const [activeTab, setActiveTab] = useState<TabType>('enrollments')
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set())
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set())

  // Modal states
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false)
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false)
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isEditEnrollmentModalOpen, setIsEditEnrollmentModalOpen] = useState(false)
  const [isDeleteEnrollmentModalOpen, setIsDeleteEnrollmentModalOpen] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null)
  const [isStudentNotesModalOpen, setIsStudentNotesModalOpen] = useState(false)
  const [selectedEnrollmentForNotes, setSelectedEnrollmentForNotes] = useState<EnrollmentWithPayment | null>(null)
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false)
  const [selectedEnrollmentForHistory, setSelectedEnrollmentForHistory] = useState<any>(null)
  const [isOutstandingPaymentsModalOpen, setIsOutstandingPaymentsModalOpen] = useState(false)
  const [outstandingPaymentsModalType, setOutstandingPaymentsModalType] = useState<'outstanding' | 'collected' | null>(null)
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false)
  const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  const [isCreateClassroomModalOpen, setIsCreateClassroomModalOpen] = useState(false)
  const [isEditClassroomModalOpen, setIsEditClassroomModalOpen] = useState(false)
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null)

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return []
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Course[]
    },
    enabled: !!currentOrganizationId && activeTab === 'courses',
  })

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return []
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          organization_members:member_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('organization_id', currentOrganizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as EnrollmentWithPayment[]
    },
    enabled: !!currentOrganizationId && activeTab === 'enrollments',
  })

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return []
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          teacher_color,
          created_at,
          updated_at,
          organization_members:member_id (
            id,
            first_name,
            last_name,
            role,
            contact_email,
            contact_phone
          )
        `)
        .eq('organization_id', currentOrganizationId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || [])
        .map((teacher: any) => ({
          id: teacher.organization_members?.id || teacher.id,
          first_name: teacher.organization_members?.first_name || '',
          last_name: teacher.organization_members?.last_name || '',
          role: teacher.organization_members?.role || '',
          teacher_color: teacher.teacher_color,
          email: teacher.organization_members?.contact_email || '',
          phone: teacher.organization_members?.contact_phone || '',
          teacher_id: teacher.id,
        }))
        .filter((teacher: any) => teacher.first_name && teacher.last_name) as Teacher[]
    },
    enabled: !!currentOrganizationId && activeTab === 'teachers',
  })

  // Fetch classrooms
  const { data: classrooms = [], isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return []
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Classroom[]
    },
    enabled: !!currentOrganizationId && activeTab === 'classrooms',
  })

  // Delete mutations
  const deleteTeachersMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const { error } = await supabase.from('teachers').delete().in('member_id', memberIds)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      toast.success(t('education.teachersRemoved'))
      setSelectedTeachers(new Set())
    },
    onError: (error: Error) => {
      toast.error(t('education.failedToRemove'), { description: error.message })
    },
  })

  const deleteCoursesMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      const { error } = await supabase.from('courses').delete().in('id', courseIds)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast.success(t('education.coursesRemoved'))
      setSelectedCourses(new Set())
    },
    onError: (error: Error) => {
      toast.error(t('education.failedToRemove'), { description: error.message })
    },
  })

  const deleteClassroomsMutation = useMutation({
    mutationFn: async (classroomIds: string[]) => {
      const { error } = await supabase.from('classrooms').delete().in('id', classroomIds)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      toast.success(t('classroom.classroomsRemoved'))
      setSelectedClassrooms(new Set())
    },
    onError: (error: Error) => {
      toast.error(t('classroom.failedToRemove'), { description: error.message })
    },
  })

  const loading = coursesLoading || enrollmentsLoading || teachersLoading || classroomsLoading

  const refetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] })
    queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    queryClient.invalidateQueries({ queryKey: ['teachers'] })
    queryClient.invalidateQueries({ queryKey: ['classrooms'] })
  }

  return (
    <div className="p-8 animate-page-enter dark:bg-slate-900">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('education.title')}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">{t('education.subtitle')}</p>
          </div>
          {activeTab === 'classrooms' && (
            <button
              onClick={() => setIsCreateClassroomModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus size={18} />
              {t('classroom.createClassroom') || 'Create Classroom'}
            </button>
          )}
          {activeTab === 'enrollments' && (
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus size={18} />
              {t('education.enrollStudent')}
            </button>
          )}
          {activeTab === 'teachers' && (
            <button
              onClick={() => setIsAddTeacherModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus size={18} />
              {t('education.addTeacher') || 'Add Teacher'}
            </button>
          )}
          {activeTab === 'courses' && (
            <button
              onClick={() => setIsAddClassModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus size={18} />
              {t('education.addCourse') || 'Add Course'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg mb-6 shadow-sm">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'enrollments'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users size={18} />
                {t('education.enrollments')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'classrooms'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Building2 size={18} />
                {t('classroom.classrooms') || 'Classrooms'}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'teachers'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <GraduationCap size={18} />
                {t('education.teachers') || 'Teachers'}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BookOpen size={18} />
                {t('education.courses') || 'Courses'}
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content - Simplified for now */}
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
            <div className="text-slate-600 dark:text-slate-400">{t('common.loading')}</div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <p className="p-8 text-slate-600 dark:text-slate-400">
              {activeTab === 'enrollments' && `${enrollments.length} enrollments`}
              {activeTab === 'courses' && `${courses.length} courses`}
              {activeTab === 'teachers' && `${teachers.length} teachers`}
              {activeTab === 'classrooms' && `${classrooms.length} classrooms`}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddClassModal isOpen={isAddClassModalOpen} onClose={() => setIsAddClassModalOpen(false)} onSave={refetchData} />
      <EditClassModal
        isOpen={isEditClassModalOpen}
        onClose={() => {
          setIsEditClassModalOpen(false)
          setSelectedClassId(null)
        }}
        onSave={refetchData}
        classId={selectedClassId || ''}
      />
      <DeleteClassModal
        isOpen={isDeleteClassModalOpen}
        onClose={() => {
          setIsDeleteClassModalOpen(false)
          setSelectedClassId(null)
        }}
        onConfirm={async () => {
          if (selectedClassId) {
            await supabase.from('courses').delete().eq('id', selectedClassId)
            refetchData()
            setIsDeleteClassModalOpen(false)
            setSelectedClassId(null)
          }
        }}
        className={courses.find((c) => c.id === selectedClassId)?.name || ''}
      />
      <EnrollStudentModal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} onSave={refetchData} />
      <EditEnrollmentModal
        isOpen={isEditEnrollmentModalOpen}
        onClose={() => {
          setIsEditEnrollmentModalOpen(false)
          setSelectedEnrollmentId(null)
        }}
        onSave={refetchData}
        enrollmentId={selectedEnrollmentId || ''}
      />
      <DeleteEnrollmentModal
        isOpen={isDeleteEnrollmentModalOpen}
        onClose={() => {
          setIsDeleteEnrollmentModalOpen(false)
          setSelectedEnrollmentId(null)
        }}
        onConfirm={async () => {
          if (selectedEnrollmentId) {
            await supabase.from('enrollments').delete().eq('id', selectedEnrollmentId)
            refetchData()
            setIsDeleteEnrollmentModalOpen(false)
            setSelectedEnrollmentId(null)
          }
        }}
        studentName="Student"
        className="Enrollment"
      />
      <StudentNotesModal
        isOpen={isStudentNotesModalOpen}
        onClose={() => {
          setIsStudentNotesModalOpen(false)
          setSelectedEnrollmentForNotes(null)
        }}
        enrollment={selectedEnrollmentForNotes as any}
        memberId={selectedEnrollmentForNotes?.member_id || ''}
        classId={null}
        studentName="Student"
        className="Enrollment"
      />
      <StudentPaymentHistoryModal
        isOpen={isPaymentHistoryModalOpen}
        onClose={() => {
          setIsPaymentHistoryModalOpen(false)
          setSelectedEnrollmentForHistory(null)
        }}
        enrollmentId={selectedEnrollmentForHistory?.enrollmentId}
        memberId={selectedEnrollmentForHistory?.memberId}
        classId={undefined}
        studentName={selectedEnrollmentForHistory?.studentName}
        className={t('education.enrollment') || 'Enrollment'}
      />
      <OutstandingPaymentsModal
        isOpen={isOutstandingPaymentsModalOpen}
        onClose={() => {
          setIsOutstandingPaymentsModalOpen(false)
          setOutstandingPaymentsModalType(null)
        }}
        type={outstandingPaymentsModalType || 'outstanding'}
      />
      <AddTeacherModal isOpen={isAddTeacherModalOpen} onClose={() => setIsAddTeacherModalOpen(false)} onSave={refetchData} />
      <EditTeacherModal
        isOpen={isEditTeacherModalOpen}
        onClose={() => {
          setIsEditTeacherModalOpen(false)
          setSelectedTeacherId(null)
          setSelectedTeacher(null)
        }}
        onSave={refetchData}
        teacherId={selectedTeacher?.teacher_id}
        teacher={selectedTeacher}
      />
      <CreateClassroomModal isOpen={isCreateClassroomModalOpen} onClose={() => setIsCreateClassroomModalOpen(false)} onSave={refetchData} />
      <EditClassroomModal
        isOpen={isEditClassroomModalOpen}
        onClose={() => {
          setIsEditClassroomModalOpen(false)
          setSelectedClassroomId(null)
        }}
        onSave={refetchData}
        classroomId={selectedClassroomId || ''}
      />
    </div>
  )
}
