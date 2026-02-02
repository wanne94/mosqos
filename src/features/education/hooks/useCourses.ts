/**
 * React Query hooks for Courses (Classes)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coursesService } from '../services/education.service'
import type { Course } from '../types/education.types'
import { toast } from 'sonner'

/**
 * Get all courses for an organization
 */
export const useCourses = (organizationId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['courses', organizationId],
    queryFn: () => coursesService.getAll(organizationId!),
    enabled: !!organizationId && enabled,
  })
}

/**
 * Get a single course by ID
 */
export const useCourse = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => coursesService.getById(courseId!),
    enabled: !!courseId,
  })
}

/**
 * Create a new course
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: coursesService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['courses', variables.organization_id],
      })
      toast.success('Kurs uspješno kreiran')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri kreiranju kursa: ${error.message}`)
    },
  })
}

/**
 * Update a course
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, updates }: { courseId: string; updates: Partial<Course> }) =>
      coursesService.update(courseId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['courses', data.organization_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['courses', data.id],
      })
      toast.success('Kurs uspješno ažuriran')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri ažuriranju kursa: ${error.message}`)
    },
  })
}

/**
 * Delete a course
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, organizationId }: { courseId: string; organizationId: string }) =>
      coursesService.delete(courseId).then(() => organizationId),
    onSuccess: (organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ['courses', organizationId],
      })
      toast.success('Kurs uspješno obrisan')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri brisanju kursa: ${error.message}`)
    },
  })
}
