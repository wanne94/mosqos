/**
 * React Query hooks for Teachers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teachersService } from '../services/education.service'
import type { Teacher } from '../types/education.types'
import { toast } from 'sonner'

/**
 * Get all teachers for an organization
 */
export const useTeachers = (organizationId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['teachers', organizationId],
    queryFn: () => teachersService.getAll(organizationId!),
    enabled: !!organizationId && enabled,
  })
}

/**
 * Create a teacher
 */
export const useCreateTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: teachersService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['teachers', variables.organization_id],
      })
      toast.success('Učitelj uspješno dodan')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri dodavanju učitelja: ${error.message}`)
    },
  })
}

/**
 * Update a teacher
 */
export const useUpdateTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teacherId, updates }: { teacherId: string; updates: Partial<Teacher> }) =>
      teachersService.update(teacherId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['teachers', data.organization_id],
      })
      toast.success('Učitelj uspješno ažuriran')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri ažuriranju učitelja: ${error.message}`)
    },
  })
}

/**
 * Delete a teacher
 */
export const useDeleteTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teacherId, organizationId }: { teacherId: string; organizationId: string }) =>
      teachersService.delete(teacherId).then(() => organizationId),
    onSuccess: (organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ['teachers', organizationId],
      })
      toast.success('Učitelj uspješno obrisan')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri brisanju učitelja: ${error.message}`)
    },
  })
}
