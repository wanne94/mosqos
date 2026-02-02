import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCountries, useUpdateOrganization } from '@/features/organizations/hooks/useOrganizations'
import { updateOrganizationSchema, type UpdateOrganizationFormData } from '@/features/organizations/types/organization.schemas'
import type { Organization } from '@/features/organizations/types/organization.types'

interface EditOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  organization: Organization | null
  onSuccess?: () => void
}

export default function EditOrganizationModal({
  isOpen,
  onClose,
  organization,
  onSuccess,
}: EditOrganizationModalProps) {
  const { data: countries = [], isLoading: countriesLoading } = useCountries()
  const updateOrganization = useUpdateOrganization()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateOrganizationFormData>({
    resolver: zodResolver(updateOrganizationSchema),
  })

  // Reset form when organization changes
  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name,
        slug: organization.slug,
        country_id: organization.country_id,
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website: organization.website || '',
        address_line1: organization.address_line1 || '',
        address_line2: organization.address_line2 || '',
        city: organization.city || '',
        state: organization.state || '',
        postal_code: organization.postal_code || '',
        primary_color: organization.primary_color || '#10B981',
        is_active: organization.is_active,
      })
    }
  }, [organization, reset])

  const onSubmit = async (data: UpdateOrganizationFormData) => {
    if (!organization) return

    try {
      await updateOrganization.mutateAsync({
        id: organization.id,
        data: {
          ...data,
          // Convert empty strings to null for optional fields
          website: data.website || null,
          contact_phone: data.contact_phone || null,
          address_line1: data.address_line1 || null,
          address_line2: data.address_line2 || null,
          city: data.city || null,
          state: data.state || null,
          postal_code: data.postal_code || null,
          },
      })

      toast.success('Organization updated successfully!')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.error('Failed to update organization')
    }
  }

  if (!isOpen || !organization) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-xl font-semibold">Edit Organization</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Organization Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-slate-400 mr-2">mosqos.com/</span>
                  <input
                    id="slug"
                    type="text"
                    {...register('slug')}
                    className="flex-1 px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country_id" className="block text-sm font-medium mb-1">
                  Country
                </label>
                <select
                  id="country_id"
                  {...register('country_id')}
                  className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={countriesLoading}
                >
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Organization is active</span>
              </label>
            </div>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact_email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    id="contact_email"
                    type="email"
                    {...register('contact_email')}
                    className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="contact_phone" className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    id="contact_phone"
                    type="tel"
                    {...register('contact_phone')}
                    className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium mb-1">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  {...register('website')}
                  className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://..."
                />
                {errors.website && (
                  <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Address
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="address_line1" className="block text-sm font-medium mb-1">
                  Street Address
                </label>
                <input
                  id="address_line1"
                  type="text"
                  {...register('address_line1')}
                  className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <input
                  id="address_line2"
                  type="text"
                  {...register('address_line2')}
                  className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Apt, Suite, etc."
                />
              </div>
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
            </div>
          </div>

          {/* Branding Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Branding
            </h3>
            <div>
              <label htmlFor="primary_color" className="block text-sm font-medium mb-1">
                Brand Color
              </label>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="color"
                  {...register('primary_color')}
                  className="w-12 h-10 border border-slate-700 rounded cursor-pointer"
                />
                <input
                  id="primary_color"
                  type="text"
                  {...register('primary_color')}
                  className="flex-1 px-3 py-2 border border-slate-700 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
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
              disabled={updateOrganization.isPending}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {updateOrganization.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
