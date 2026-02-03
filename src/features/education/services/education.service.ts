/**
 * Education Service
 *
 * Handles all database operations for the Education module:
 * - Courses (Classes)
 * - Enrollments
 * - Teachers
 * - Classrooms
 * - Attendance
 * - Evaluations
 */

import { supabase } from '@/lib/supabase/client'
import type { Database, Json } from '@/lib/supabase/database.types'
import type {
  Course,
  Enrollment,
  Teacher,
  Classroom,
  Attendance,
  Evaluation,
} from '../types/education.types'

// Database Insert and Update types from Supabase generated types
type CoursesInsert = Database['public']['Tables']['courses']['Insert']
type CoursesUpdate = Database['public']['Tables']['courses']['Update']

type ClassroomsInsert = Database['public']['Tables']['classrooms']['Insert']
type ClassroomsUpdate = Database['public']['Tables']['classrooms']['Update']

type TeachersInsert = Database['public']['Tables']['teachers']['Insert']
type TeachersUpdate = Database['public']['Tables']['teachers']['Update']

type EnrollmentsInsert = Database['public']['Tables']['enrollments']['Insert']
type EnrollmentsUpdate = Database['public']['Tables']['enrollments']['Update']

type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']
type AttendanceUpdate = Database['public']['Tables']['attendance']['Update']

type EvaluationsInsert = Database['public']['Tables']['evaluations']['Insert']
type EvaluationsUpdate = Database['public']['Tables']['evaluations']['Update']

// ============================================
// COURSES (CLASSES)
// ============================================

export const coursesService = {
  /**
   * Get all courses for an organization
   */
  getAll: async (organizationId: string): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as Course[]
  },

  /**
   * Get a single course by ID
   */
  getById: async (courseId: string): Promise<Course> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error) throw error
    return data as unknown as Course
  },

  /**
   * Create a new course
   */
  create: async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> => {
    const insertData: CoursesInsert = {
      organization_id: course.organization_id,
      name: course.name,
      description: course.description,
      code: course.code,
      level: course.level,
      subject: course.subject,
      category: course.category,
      duration_weeks: course.duration_weeks,
      duration_hours: course.duration_hours,
      tuition_fee: course.tuition_fee,
      currency: course.currency,
      min_students: course.min_students,
      max_students: course.max_students,
      prerequisites: course.prerequisites,
      syllabus: course.syllabus,
      materials: course.materials as unknown as Json,
      is_active: course.is_active,
      is_featured: course.is_featured,
      image_url: course.image_url,
      created_by: course.created_by,
      updated_by: course.updated_by,
    }

    const { data, error } = await supabase
      .from('courses')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Course
  },

  /**
   * Update a course
   */
  update: async (courseId: string, updates: Partial<Course>): Promise<Course> => {
    const updateData: CoursesUpdate = {
      name: updates.name,
      description: updates.description,
      code: updates.code,
      level: updates.level,
      subject: updates.subject,
      category: updates.category,
      duration_weeks: updates.duration_weeks,
      duration_hours: updates.duration_hours,
      tuition_fee: updates.tuition_fee,
      currency: updates.currency,
      min_students: updates.min_students,
      max_students: updates.max_students,
      prerequisites: updates.prerequisites,
      syllabus: updates.syllabus,
      materials: updates.materials as Json | undefined,
      is_active: updates.is_active,
      is_featured: updates.is_featured,
      image_url: updates.image_url,
      updated_by: updates.updated_by,
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Course
  },

  /**
   * Delete a course
   */
  delete: async (courseId: string): Promise<void> => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) throw error
  },
}

// ============================================
// ENROLLMENTS
// ============================================

export interface EnrollmentWithDetails {
  id: string
  member_id: string
  scheduled_class_id: string
  organization_id: string
  status?: string | null
  created_at?: string
  member?: {
    id: string
    first_name: string
    last_name: string
  } | null
  scheduled_class?: {
    id: string
    name: string
  } | null
}

export const enrollmentsService = {
  /**
   * Get all enrollments for an organization
   */
  getAll: async (organizationId: string): Promise<EnrollmentWithDetails[]> => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        ),
        scheduled_class:scheduled_class_id (
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as EnrollmentWithDetails[]
  },

  /**
   * Get enrollments for a specific class
   */
  getByClassId: async (classId: string): Promise<EnrollmentWithDetails[]> => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        member:member_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('scheduled_class_id', classId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as EnrollmentWithDetails[]
  },

  /**
   * Get enrollments for a specific member
   */
  getByMemberId: async (memberId: string): Promise<EnrollmentWithDetails[]> => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        scheduled_class:scheduled_class_id (
          id,
          name
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as EnrollmentWithDetails[]
  },

  /**
   * Enroll a student
   */
  create: async (enrollment: Omit<Enrollment, 'id' | 'created_at'>): Promise<Enrollment> => {
    const insertData: EnrollmentsInsert = {
      organization_id: enrollment.organization_id,
      scheduled_class_id: enrollment.scheduled_class_id,
      member_id: enrollment.member_id,
      enrollment_date: enrollment.enrollment_date,
      status: enrollment.status,
      grade: enrollment.grade,
      grade_points: enrollment.grade_points,
      completion_percentage: enrollment.completion_percentage,
      total_classes: enrollment.total_classes,
      attended_classes: enrollment.attended_classes,
      attendance_percentage: enrollment.attendance_percentage,
      tuition_paid: enrollment.tuition_paid,
      tuition_balance: enrollment.tuition_balance,
      scholarship_amount: enrollment.scholarship_amount,
      scholarship_notes: enrollment.scholarship_notes,
      withdrawal_date: enrollment.withdrawal_date,
      withdrawal_reason: enrollment.withdrawal_reason,
      notes: enrollment.notes,
      created_by: enrollment.created_by,
      updated_by: enrollment.updated_by,
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as Enrollment
  },

  /**
   * Update an enrollment
   */
  update: async (enrollmentId: string, updates: Partial<Enrollment>): Promise<Enrollment> => {
    const updateData: EnrollmentsUpdate = {
      status: updates.status,
      grade: updates.grade,
      grade_points: updates.grade_points,
      completion_percentage: updates.completion_percentage,
      total_classes: updates.total_classes,
      attended_classes: updates.attended_classes,
      attendance_percentage: updates.attendance_percentage,
      tuition_paid: updates.tuition_paid,
      tuition_balance: updates.tuition_balance,
      scholarship_amount: updates.scholarship_amount,
      scholarship_notes: updates.scholarship_notes,
      withdrawal_date: updates.withdrawal_date,
      withdrawal_reason: updates.withdrawal_reason,
      notes: updates.notes,
      updated_by: updates.updated_by,
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollmentId)
      .select()
      .single()

    if (error) throw error
    return data as Enrollment
  },

  /**
   * Delete an enrollment
   */
  delete: async (enrollmentId: string): Promise<void> => {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId)

    if (error) throw error
  },
}

// ============================================
// TEACHERS
// ============================================

export interface TeacherWithMember {
  id: string
  first_name: string
  last_name: string
  role: string
  teacher_color: string | null
  email: string
  phone: string
  teacher_id: string
}

export const teachersService = {
  /**
   * Get all teachers for an organization
   */
  getAll: async (organizationId: string): Promise<TeacherWithMember[]> => {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        teacher_color,
        created_at,
        updated_at,
        member:member_id (
          id,
          first_name,
          last_name,
          membership_type,
          contact_email,
          contact_phone
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    type TeacherQueryResult = {
      id: string
      teacher_color: string | null
      created_at: string
      updated_at: string
      member: {
        id: string
        first_name: string
        last_name: string
        membership_type: string | null
        contact_email: string | null
        contact_phone: string | null
      } | null
    }

    return ((data || []) as unknown as TeacherQueryResult[])
      .map((teacher: TeacherQueryResult) => ({
        id: teacher.member?.id || teacher.id,
        first_name: teacher.member?.first_name || '',
        last_name: teacher.member?.last_name || '',
        role: teacher.member?.membership_type || '',
        teacher_color: teacher.teacher_color,
        email: teacher.member?.contact_email || '',
        phone: teacher.member?.contact_phone || '',
        teacher_id: teacher.id,
      }))
      .filter((teacher) => teacher.first_name && teacher.last_name)
  },

  /**
   * Create a teacher
   */
  create: async (teacher: { member_id: string; organization_id: string; teacher_color?: string }): Promise<Teacher> => {
    const insertData: TeachersInsert = {
      member_id: teacher.member_id,
      organization_id: teacher.organization_id,
      first_name: '',
      last_name: '',
    }

    const { data, error } = await supabase
      .from('teachers')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Teacher
  },

  /**
   * Update a teacher
   */
  update: async (teacherId: string, updates: Partial<Teacher>): Promise<Teacher> => {
    const updateData: TeachersUpdate = {
      member_id: updates.member_id,
      first_name: updates.first_name,
      last_name: updates.last_name,
      email: updates.email,
      phone: updates.phone,
      specialization: updates.specialization,
      qualifications: updates.qualifications,
      certifications: updates.certifications as Json | undefined,
      bio: updates.bio,
      availability: updates.availability as Json | undefined,
      max_hours_per_week: updates.max_hours_per_week,
      hourly_rate: updates.hourly_rate,
      compensation_type: updates.compensation_type,
      currency: updates.currency,
      is_active: updates.is_active,
      hire_date: updates.hire_date,
      end_date: updates.end_date,
      updated_by: updates.updated_by,
    }

    const { data, error } = await supabase
      .from('teachers')
      .update(updateData)
      .eq('id', teacherId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Teacher
  },

  /**
   * Delete a teacher
   */
  delete: async (teacherId: string): Promise<void> => {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', teacherId)

    if (error) throw error
  },
}

// ============================================
// CLASSROOMS
// ============================================

/**
 * Input type for creating a classroom - only requires essential fields
 */
export interface CreateClassroomInput {
  organization_id: string
  name: string
  capacity?: number | null
  location?: string | null
}

export const classroomsService = {
  /**
   * Get all classrooms for an organization
   */
  getAll: async (organizationId: string): Promise<Classroom[]> => {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as Classroom[]
  },

  /**
   * Get a single classroom by ID
   */
  getById: async (classroomId: string): Promise<Classroom> => {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', classroomId)
      .single()

    if (error) throw error
    return data as unknown as Classroom
  },

  /**
   * Create a classroom
   */
  create: async (classroom: CreateClassroomInput): Promise<Classroom> => {
    const insertData: ClassroomsInsert = {
      organization_id: classroom.organization_id,
      name: classroom.name,
      capacity: classroom.capacity,
    }

    const { data, error } = await supabase
      .from('classrooms')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Classroom
  },

  /**
   * Update a classroom
   */
  update: async (classroomId: string, updates: Partial<Classroom>): Promise<Classroom> => {
    const updateData: ClassroomsUpdate = {
      name: updates.name,
      code: updates.code,
      location: updates.location,
      address: updates.address,
      capacity: updates.capacity,
      facilities: updates.facilities,
      equipment: updates.equipment as Json | undefined,
      is_virtual: updates.is_virtual,
      virtual_link: updates.virtual_link,
      availability: updates.availability as Json | undefined,
      is_active: updates.is_active,
      image_url: updates.image_url,
      updated_by: updates.updated_by,
    }

    const { data, error } = await supabase
      .from('classrooms')
      .update(updateData)
      .eq('id', classroomId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Classroom
  },

  /**
   * Delete a classroom
   */
  delete: async (classroomId: string): Promise<void> => {
    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', classroomId)

    if (error) throw error
  },
}

// ============================================
// ATTENDANCE
// ============================================

export const attendanceService = {
  /**
   * Get attendance records for a class
   */
  getByClassId: async (classId: string): Promise<Attendance[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('scheduled_class_id', classId)
      .order('attendance_date', { ascending: false })

    if (error) throw error
    return (data || []) as Attendance[]
  },

  /**
   * Get attendance records for a member
   */
  getByMemberId: async (memberId: string): Promise<Attendance[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberId)
      .order('attendance_date', { ascending: false })

    if (error) throw error
    return (data || []) as Attendance[]
  },

  /**
   * Mark attendance
   */
  mark: async (attendance: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance> => {
    const insertData: AttendanceInsert = {
      organization_id: attendance.organization_id,
      scheduled_class_id: attendance.scheduled_class_id,
      member_id: attendance.member_id,
      attendance_date: attendance.attendance_date,
      status: attendance.status,
      check_in_time: attendance.check_in_time,
      check_out_time: attendance.check_out_time,
      late_minutes: attendance.late_minutes,
      notes: attendance.notes,
      created_by: attendance.created_by,
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as Attendance
  },

  /**
   * Update attendance
   */
  update: async (attendanceId: string, updates: Partial<Attendance>): Promise<Attendance> => {
    const updateData: AttendanceUpdate = {
      attendance_date: updates.attendance_date,
      status: updates.status,
      check_in_time: updates.check_in_time,
      check_out_time: updates.check_out_time,
      late_minutes: updates.late_minutes,
      notes: updates.notes,
    }

    const { data, error } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', attendanceId)
      .select()
      .single()

    if (error) throw error
    return data as Attendance
  },

  /**
   * Delete attendance record
   */
  delete: async (attendanceId: string): Promise<void> => {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', attendanceId)

    if (error) throw error
  },
}

// ============================================
// EVALUATIONS
// ============================================

export const evaluationsService = {
  /**
   * Get evaluations for a class
   */
  getByClassId: async (classId: string): Promise<Evaluation[]> => {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('scheduled_class_id', classId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as Evaluation[]
  },

  /**
   * Get evaluations for a member
   */
  getByMemberId: async (memberId: string): Promise<Evaluation[]> => {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as Evaluation[]
  },

  /**
   * Create an evaluation
   */
  create: async (evaluation: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>): Promise<Evaluation> => {
    const insertData: EvaluationsInsert = {
      organization_id: evaluation.organization_id,
      scheduled_class_id: evaluation.scheduled_class_id,
      member_id: evaluation.member_id,
      evaluation_date: evaluation.evaluation_date,
      evaluation_type: evaluation.evaluation_type,
      title: evaluation.title,
      description: evaluation.description,
      score: evaluation.score,
      max_score: evaluation.max_score,
      percentage: evaluation.percentage,
      grade: evaluation.grade,
      weight: evaluation.weight,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      areas_for_improvement: evaluation.areas_for_improvement,
      rubric_scores: evaluation.rubric_scores as unknown as Json,
      is_visible_to_student: evaluation.is_visible_to_student,
      created_by: evaluation.created_by,
      updated_by: evaluation.updated_by,
    }

    const { data, error } = await supabase
      .from('evaluations')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Evaluation
  },

  /**
   * Update an evaluation
   */
  update: async (evaluationId: string, updates: Partial<Evaluation>): Promise<Evaluation> => {
    const updateData: EvaluationsUpdate = {
      evaluation_date: updates.evaluation_date,
      evaluation_type: updates.evaluation_type,
      title: updates.title,
      description: updates.description,
      score: updates.score,
      max_score: updates.max_score,
      percentage: updates.percentage,
      grade: updates.grade,
      weight: updates.weight,
      feedback: updates.feedback,
      strengths: updates.strengths,
      areas_for_improvement: updates.areas_for_improvement,
      rubric_scores: updates.rubric_scores as Json | undefined,
      is_visible_to_student: updates.is_visible_to_student,
      updated_by: updates.updated_by,
    }

    const { data, error } = await supabase
      .from('evaluations')
      .update(updateData)
      .eq('id', evaluationId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Evaluation
  },

  /**
   * Delete an evaluation
   */
  delete: async (evaluationId: string): Promise<void> => {
    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', evaluationId)

    if (error) throw error
  },
}
