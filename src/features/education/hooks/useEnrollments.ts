/**
 * React Query hooks for Enrollments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enrollmentsService } from '../services/education.service'
import type { Enrollment } from '../types/education.types'
import { toast } from 'sonner'

/**
 * Get all enrollments for an organization
 */
export const useEnrollments = (organizationId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['enrollments', organizationId],
    queryFn: () => enrollmentsService.getAll(organizationId!),
    enabled: !!organizationId && enabled,
  })
}

/**
 * Get enrollments for a specific class
 */
export const useEnrollmentsByClass = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['enrollments', 'class', classId],
    queryFn: () => enrollmentsService.getByClassId(classId!),
    enabled: !!classId,
  })
}

/**
 * Get enrollments for a specific member
 */
export const useEnrollmentsByMember = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['enrollments', 'member', memberId],
    queryFn: () => enrollmentsService.getByMemberId(memberId!),
    enabled: !!memberId,
  })
}

/**
 * Enroll a student
 */
export const useEnrollStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enrollmentsService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollments', variables.organization_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['enrollments', 'class', variables.scheduled_class_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['enrollments', 'member', variables.member_id],
      })
      toast.success('Student uspješno upisan')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri upisu studenta: ${error.message}`)
    },
  })
}

/**
 * Update an enrollment
 */
export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ enrollmentId, updates }: { enrollmentId: string; updates: Partial<Enrollment> }) =>
      enrollmentsService.update(enrollmentId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollments', data.organization_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['enrollments', 'class', data.scheduled_class_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['enrollments', 'member', data.member_id],
      })
      toast.success('Upis uspješno ažuriran')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri ažuriranju upisa: ${error.message}`)
    },
  })
}

/**
 * Delete an enrollment
 */
export const useDeleteEnrollment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ enrollmentId, organizationId }: { enrollmentId: string; organizationId: string }) =>
      enrollmentsService.delete(enrollmentId).then(() => organizationId),
    onSuccess: (organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollments', organizationId],
      })
      toast.success('Upis uspješno obrisan')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri brisanju upisa: ${error.message}`)
    },
  })
}
