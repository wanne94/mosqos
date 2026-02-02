/**
 * React Query hooks for Classrooms
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classroomsService } from '../services/education.service'
import type { Classroom } from '../types/education.types'
import { toast } from 'sonner'

/**
 * Get all classrooms for an organization
 */
export const useClassrooms = (organizationId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['classrooms', organizationId],
    queryFn: () => classroomsService.getAll(organizationId!),
    enabled: !!organizationId && enabled,
  })
}

/**
 * Get a single classroom by ID
 */
export const useClassroom = (classroomId: string | undefined) => {
  return useQuery({
    queryKey: ['classrooms', classroomId],
    queryFn: () => classroomsService.getById(classroomId!),
    enabled: !!classroomId,
  })
}

/**
 * Create a classroom
 */
export const useCreateClassroom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: classroomsService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['classrooms', variables.organization_id],
      })
      toast.success('Učionica uspješno kreirana')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri kreiranju učionice: ${error.message}`)
    },
  })
}

/**
 * Update a classroom
 */
export const useUpdateClassroom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classroomId, updates }: { classroomId: string; updates: Partial<Classroom> }) =>
      classroomsService.update(classroomId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['classrooms', data.organization_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['classrooms', data.id],
      })
      toast.success('Učionica uspješno ažurirana')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri ažuriranju učionice: ${error.message}`)
    },
  })
}

/**
 * Delete a classroom
 */
export const useDeleteClassroom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classroomId, organizationId }: { classroomId: string; organizationId: string }) =>
      classroomsService.delete(classroomId).then(() => organizationId),
    onSuccess: (organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ['classrooms', organizationId],
      })
      toast.success('Učionica uspješno obrisana')
    },
    onError: (error: Error) => {
      toast.error(`Greška pri brisanju učionice: ${error.message}`)
    },
  })
}
