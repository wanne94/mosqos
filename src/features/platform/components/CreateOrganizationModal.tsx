import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCountries, useAdminCreateOrganization } from '@/features/organizations/hooks/useOrganizations'
import { createOrganizationSchema, type CreateOrganizationFormData } from '@/features/organizations/types/organization.schemas'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrganizationModalProps) {
  const { data: countries = [], isLoading: countriesLoading } = useCountries()
  const createOrganization = useAdminCreateOrganization()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      country_id: '',
      contact_email: '',
      contact_phone: '',
      address_line1: '',
      city: '',
      state: '',
      postal_code: '',
      timezone: '',
    },
  })

  const onSubmit = async (data: CreateOrganizationFormData) => {
    try {
      await createOrganization.mutateAsync({
        name: data.name,
        country_id: data.country_id,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || undefined,
        address_line1: data.address_line1 || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        postal_code: data.postal_code || undefined,
        timezone: data.timezone || undefined,
        status: 'approved', // Admin-created orgs are auto-approved
      })

      toast.success('Organization created successfully!')
      reset()
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold">Create New Organization</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Organization Name *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Green Lane Masjid"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country_id" className="block text-sm font-medium mb-1">
              Country *
            </label>
            <select
              id="country_id"
              {...register('country_id')}
              className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={countriesLoading}
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.country_id && (
              <p className="text-sm text-red-500 mt-1">{errors.country_id.message}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium mb-1">
              Contact Email *
            </label>
            <input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="admin@mosque.org"
            />
            {errors.contact_email && (
              <p className="text-sm text-red-500 mt-1">{errors.contact_email.message}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label htmlFor="contact_phone" className="block text-sm font-medium mb-1">
              Contact Phone
            </label>
            <input
              id="contact_phone"
              type="tel"
              {...register('contact_phone')}
              className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address_line1" className="block text-sm font-medium mb-1">
              Address
            </label>
            <input
              id="address_line1"
              type="text"
              {...register('address_line1')}
              className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="123 Main Street"
            />
          </div>

          {/* City, State, Postal */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                {...register('city')}
                className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-1">
                State
              </label>
              <input
                id="state"
                type="text"
                {...register('state')}
                className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium mb-1">
                Postal Code
              </label>
              <input
                id="postal_code"
                type="text"
                {...register('postal_code')}
                className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              {...register('timezone')}
              className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Use country default</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Berlin">Berlin (CET)</option>
              <option value="Europe/Istanbul">Istanbul (TRT)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrganization.isPending}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {createOrganization.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
