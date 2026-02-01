import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BookOpen, Award, Users } from 'lucide-react'
import { translateSchedule } from '../utils/scheduleTranslations'
import { useOrganization } from '../../../hooks/useOrganization'

// Type assertion for tables with columns not in generated types
const db = supabase as SupabaseClient<any>

interface EvaluationWithEnrollment {
  id: string
  enrollment_id: string
  score: number | null
  evaluation_date: string
}

interface EducationTabProps {
  memberId: string
  memberRole: string
  householdId?: string | null
}

interface ScheduledClassInfo {
  id?: string
  name?: string
  day_of_week?: string | null
}

interface EnrollmentWithEvaluation {
  id: string
  scheduled_class_id: string
  member_id: string
  scheduled_class?: ScheduledClassInfo
  studentName?: string
  latestEvaluation?: {
    score: number
    evaluation_date?: string
  } | null
}

export default function EducationTab({ memberId, memberRole, householdId }: EducationTabProps) {
  const { currentOrganizationId } = useOrganization()
  const [educationData, setEducationData] = useState<EnrollmentWithEvaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (memberId) {
      fetchEducationData()
    }
  }, [memberId, memberRole, householdId])

  const fetchEducationData = async () => {
    try {
      setLoading(true)
      let studentIds: Array<{ id: string; name: string | null }> = []

      // Determine which students to fetch data for
      const roleLower = memberRole?.toLowerCase() || ''
      const isParent = roleLower.includes('parent') || roleLower.includes('head of household') || roleLower === 'head'

      if (isParent) {
        // If parent, find all children in the same household
        if (householdId) {
          const { data: householdMembers, error: membersError } = await supabase
            .from('members')
            .select('id, first_name, last_name, membership_type')
            .eq('household_id', householdId)
            .eq('organization_id', currentOrganizationId)

          if (membersError) {
            console.error('Error fetching household members:', membersError)
          } else {
            // Filter for children/students (case-insensitive check)
            // Exclude the parent themselves and only include children/students
            const children = (householdMembers || []).filter(
              (member: { id: string; first_name: string; last_name: string; membership_type: string | null }) =>
                member.id !== memberId && // Exclude the parent
                member.membership_type &&
                (member.membership_type.toLowerCase() === 'student' ||
                  member.membership_type.toLowerCase() === 'individual')
            )
            studentIds = children.map((child: { id: string; first_name: string; last_name: string }) => ({
              id: child.id,
              name: `${child.first_name} ${child.last_name}`,
            }))
          }
        }
      } else {
        // If student, just use the member themselves
        studentIds = [{ id: memberId, name: null }]
      }

      // If no students found, set empty and return
      if (studentIds.length === 0) {
        setEducationData([])
        setLoading(false)
        return
      }

      // FIX N+1 QUERY: Fetch all enrollments in a single query
      const studentIdList = studentIds.map((s) => s.id)
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .in('member_id', studentIdList)
        .eq('organization_id', currentOrganizationId)

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
        setEducationData([])
        setLoading(false)
        return
      }

      // If no enrollments, return early
      if (!enrollments || enrollments.length === 0) {
        setEducationData([])
        setLoading(false)
        return
      }

      // FIX N+1 QUERY: Fetch all evaluations in a single query
      const enrollmentIds = enrollments.map((e) => e.id)
      const { data: allEvaluations, error: evalError } = await db
        .from('evaluations')
        .select('*')
        .in('enrollment_id', enrollmentIds)
        .eq('organization_id', currentOrganizationId)
        .order('evaluation_date', { ascending: false })

      if (evalError && evalError.code !== 'PGRST116' && evalError.code !== '42P01') {
        console.error('Error fetching evaluations:', evalError)
      }

      // Group evaluations by enrollment_id (get only the latest for each enrollment)
      const latestEvaluationsByEnrollment: Record<string, EvaluationWithEnrollment> = {}
      if (allEvaluations) {
        for (const evaluation of allEvaluations as EvaluationWithEnrollment[]) {
          if (!latestEvaluationsByEnrollment[evaluation.enrollment_id]) {
            latestEvaluationsByEnrollment[evaluation.enrollment_id] = evaluation
          }
        }
      }

      // Create student name lookup
      const studentNameLookup: Record<string, string | null> = {}
      studentIds.forEach((student) => {
        studentNameLookup[student.id] = student.name
      })

      // Combine enrollments with their evaluations
      const educationDataWithEvaluations = enrollments.map((enrollment) => ({
        ...enrollment,
        studentName: studentNameLookup[enrollment.member_id] ?? undefined,
        latestEvaluation: latestEvaluationsByEnrollment[enrollment.id] || null,
      }))

      setEducationData(educationDataWithEvaluations as unknown as EnrollmentWithEvaluation[])
    } catch (error) {
      console.error('Error fetching education data:', error)
      setEducationData([])
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
    if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
    if (score >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-600 dark:text-gray-400">Loading education data...</div>
      </div>
    )
  }

  if (educationData.length === 0) {
    return (
      <div className="p-8 text-center">
        <BookOpen className="mx-auto text-slate-400 dark:text-gray-500 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">No Education Data</h3>
        <p className="text-slate-600 dark:text-gray-400">
          {(memberRole?.toLowerCase() || '').includes('parent') ||
          (memberRole?.toLowerCase() || '').includes('head of household') ||
          (memberRole?.toLowerCase() || '') === 'head'
            ? 'No enrolled classes found for children in this household.'
            : 'No enrolled classes found for this student.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-gray-100 mb-2">Education</h2>
        <p className="text-slate-600 dark:text-gray-400">
          {(memberRole?.toLowerCase() || '').includes('parent') ||
          (memberRole?.toLowerCase() || '').includes('head of household') ||
          (memberRole?.toLowerCase() || '') === 'head'
            ? 'Classes and grades for children in this household'
            : 'Enrolled classes and grades'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {educationData.map((item) => (
          <div
            key={`${item.id}-${item.scheduled_class_id}`}
            className="glass-card bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="text-emerald-600 dark:text-emerald-400" size={20} />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
                    {item.scheduled_class?.name || 'Unknown Class'}
                  </h3>
                </div>
                {item.studentName && (
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                    <Users size={14} className="inline mr-1" />
                    {item.studentName}
                  </p>
                )}
                {item.scheduled_class?.day_of_week && (
                  <p className="text-xs text-slate-500 dark:text-gray-500">
                    {translateSchedule(item.scheduled_class.day_of_week)}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
              {item.latestEvaluation ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Latest Grade:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(
                        item.latestEvaluation.score
                      )}`}
                    >
                      {item.latestEvaluation.score}
                    </span>
                  </div>
                  {item.latestEvaluation.evaluation_date && (
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                      {new Date(item.latestEvaluation.evaluation_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 dark:text-gray-500">
                  <Award size={16} />
                  <span className="text-sm">No grades yet</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
