import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormDirty } from '@/hooks/useFormDirty'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useOrganization } from '@/hooks/useOrganization'
import type { Database } from '@/shared/types/database.types'

type TripRegistrationInsert = Database['public']['Tables']['trip_registrations']['Insert']

interface RegisterPilgrimModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

interface FormData {
  member_id: string
  trip_id: string
}

interface Member {
  id: string
  first_name: string
  last_name: string
}

interface Trip {
  id: string
  name: string
}

const initialFormData: FormData = {
  member_id: '',
  trip_id: '',
}

export default function RegisterPilgrimModal({ isOpen, onClose, onSave }: RegisterPilgrimModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const isDirty = useFormDirty(formData, initialFormData)

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
      fetchMembers()
      fetchTrips()
      setFormData(initialFormData)
    }
  }, [isOpen])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('organization_id', currentOrganizationId)
        .order('first_name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('start_date', { ascending: false })

      if (error) throw error
      setTrips(data || [])
    } catch (error) {
      console.error('Error fetching trips:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('Form submitted with data:', formData)
    setLoading(true)

    try {
      if (!formData.member_id || !formData.trip_id) {
        alert(t('common.selectTrip') + ' ' + t('common.selectMember'))
        setLoading(false)
        return
      }

      const memberId = formData.member_id
      const tripId = formData.trip_id

      const { data: existingRegistration, error: checkError } = await supabase
        .from('trip_registrations')
        .select('*')
        .eq('organization_id', currentOrganizationId as string)
        .eq('member_id', memberId)
        .eq('trip_id', tripId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing registration:', checkError)
        alert(t('common.errorCheckingRegistration'))
        setLoading(false)
        return
      }

      if (existingRegistration) {
        const selectedMember = members.find((m) => m.id === memberId)
        const memberName = selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : t('common.thisPerson')
        alert(t('common.alreadyRegisteredForTrip', { name: memberName }))
        setLoading(false)
        return
      }

      console.log('Inserting registration:', { memberId, tripId })

      const registrationData: TripRegistrationInsert = {
        organization_id: currentOrganizationId as string,
        member_id: memberId,
        trip_id: tripId,
      }

      console.log('Registration data:', registrationData)

      const { data, error } = await supabase
        .from('trip_registrations')
        .insert([registrationData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        console.error('Full error object:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Registration successful! Data:', data)

      onClose()

      if (onSave) {
        console.log('Calling onSave callback')
        setTimeout(() => {
          onSave()
        }, 200)
      } else {
        alert(t('common.pilgrimRegisteredSuccess'))
      }
    } catch (error) {
      console.error('Error registering pilgrim:', error)

      let errorMessage = 'Failed to register pilgrim.'

      if (error && typeof error === 'object' && 'code' in error) {
        const err = error as { code: string; message?: string }
        if (err.code === '23505') {
          errorMessage = 'This pilgrim is already registered for this trip.'
        } else if (err.code === '23503') {
          errorMessage = 'Invalid member or trip selected. Please check that both exist in the database.'
        } else if (err.code === '42P01') {
          errorMessage = 'The trip_registrations table does not exist. Please run the migration SQL first.'
        } else if (err.code === '42501') {
          errorMessage = 'Permission denied. Please check Row Level Security policies.'
        } else if (err.message) {
          errorMessage = `Error: ${err.message}`
        }
      }

      alert(errorMessage)
      console.error('Registration failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('umrah.registerPilgrim')}</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('common.selectTrip')} *
            </label>
            <select
              name="trip_id"
              value={formData.trip_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">{t('common.selectTrip')}</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id.toString()}>
                  {trip.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('common.selectMember')} *
            </label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">{t('common.selectMember')}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id.toString()}>
                  {member.first_name} {member.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('umrah.registerPilgrim')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
