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
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Course,
  Enrollment,
  Teacher,
  Classroom,
  Attendance,
  Evaluation,
} from '../types/education.types'

// Type assertion for tables with columns not in generated types
const db = supabase as SupabaseClient<any>

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
    const { data, error } = await supabase
      .from('courses')
      .insert(course as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Course
  },

  /**
   * Update a course
   */
  update: async (courseId: string, updates: Partial<Course>): Promise<Course> => {
    const { data, error } = await supabase
      .from('courses')
      .update(updates as any)
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
    const { data, error } = await supabase
      .from('enrollments')
      .insert(enrollment)
      .select()
      .single()

    if (error) throw error
    return data as Enrollment
  },

  /**
   * Update an enrollment
   */
  update: async (enrollmentId: string, updates: Partial<Enrollment>): Promise<Enrollment> => {
    const { data, error } = await supabase
      .from('enrollments')
      .update(updates)
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
    const { data, error } = await db
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
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacher as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Teacher
  },

  /**
   * Update a teacher
   */
  update: async (teacherId: string, updates: Partial<Teacher>): Promise<Teacher> => {
    const { data, error } = await supabase
      .from('teachers')
      .update(updates as any)
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
  create: async (classroom: Omit<Classroom, 'id' | 'created_at' | 'updated_at'>): Promise<Classroom> => {
    const { data, error } = await supabase
      .from('classrooms')
      .insert(classroom as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Classroom
  },

  /**
   * Update a classroom
   */
  update: async (classroomId: string, updates: Partial<Classroom>): Promise<Classroom> => {
    const { data, error } = await supabase
      .from('classrooms')
      .update(updates as any)
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
      .order('date', { ascending: false })

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
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []) as Attendance[]
  },

  /**
   * Mark attendance
   */
  mark: async (attendance: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>): Promise<Attendance> => {
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendance)
      .select()
      .single()

    if (error) throw error
    return data as Attendance
  },

  /**
   * Update attendance
   */
  update: async (attendanceId: string, updates: Partial<Attendance>): Promise<Attendance> => {
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
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
    const { data, error } = await supabase
      .from('evaluations')
      .insert(evaluation as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Evaluation
  },

  /**
   * Update an evaluation
   */
  update: async (evaluationId: string, updates: Partial<Evaluation>): Promise<Evaluation> => {
    const { data, error } = await supabase
      .from('evaluations')
      .update(updates as any)
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
