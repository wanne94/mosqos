import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, CheckCircle, XCircle, Loader2, Building2, X, Calendar, Mail, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { usePendingOrganizations, useApproveOrganization, useRejectOrganization } from '@/features/organizations/hooks/useOrganizations'
import { rejectOrganizationSchema, type RejectOrganizationFormData } from '@/features/organizations/types/organization.schemas'
import type { OrganizationWithRelations } from '@/features/organizations/types/organization.types'

// Country flags helper
const getCountryFlag = (code: string) => {
  const flags: Record<string, string> = {
    US: '🇺🇸', TR: '🇹🇷', DE: '🇩🇪', GB: '🇬🇧',
    CA: '🇨🇦', AU: '🇦🇺', FR: '🇫🇷', NL: '🇳🇱'
  }
  return flags[code] || '🏳️'
}

interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  organization: OrganizationWithRelations | null
  onSubmit: (data: RejectOrganizationFormData) => void
  isPending: boolean
}

function RejectModal({ isOpen, onClose, organization, onSubmit, isPending }: RejectModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RejectOrganizationFormData>({
    resolver: zodResolver(rejectOrganizationSchema),
  })

  const handleFormSubmit = (data: RejectOrganizationFormData) => {
    onSubmit(data)
    reset()
  }

  if (!isOpen || !organization) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-red-600">Reject Application</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="font-medium">{organization.name}</p>
            <p className="text-sm text-muted-foreground">{organization.contact_email}</p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">
              Rejection Reason *
            </label>
            <textarea
              id="reason"
              {...register('reason')}
              rows={4}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Please provide a reason for rejecting this application..."
            />
            {errors.reason && (
              <p className="text-sm text-red-500 mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface PendingOrganizationsListProps {
  limit?: number
  showTitle?: boolean
}

export default function PendingOrganizationsList({ limit, showTitle = true }: PendingOrganizationsListProps) {
  const { data: pendingOrgs = [], isLoading } = usePendingOrganizations()
  const approveOrg = useApproveOrganization()
  const rejectOrg = useRejectOrganization()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithRelations | null>(null)

  const displayedOrgs = limit ? pendingOrgs.slice(0, limit) : pendingOrgs

  const handleApprove = async (org: OrganizationWithRelations) => {
    try {
      await approveOrg.mutateAsync(org.id)
      toast.success(`"${org.name}" has been approved!`)
    } catch (error) {
      console.error('Error approving organization:', error)
      toast.error('Failed to approve organization')
    }
  }

  const handleRejectClick = (org: OrganizationWithRelations) => {
    setSelectedOrg(org)
    setRejectModalOpen(true)
  }

  const handleRejectSubmit = async (data: RejectOrganizationFormData) => {
    if (!selectedOrg) return

    try {
      await rejectOrg.mutateAsync({
        organizationId: selectedOrg.id,
        reason: data.reason,
      })
      toast.success(`Application for "${selectedOrg.name}" has been rejected`)
      setRejectModalOpen(false)
      setSelectedOrg(null)
    } catch (error) {
      console.error('Error rejecting organization:', error)
      toast.error('Failed to reject organization')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl border bg-card">
        {showTitle && <h2 className="text-lg font-semibold mb-4">Pending Applications</h2>}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (pendingOrgs.length === 0) {
    return (
      <div className="p-6 rounded-xl border bg-card">
        {showTitle && <h2 className="text-lg font-semibold mb-4">Pending Applications</h2>}
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No pending applications</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 rounded-xl border bg-card">
        {showTitle && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Applications</h2>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              {pendingOrgs.length} pending
            </span>
          </div>
        )}

        <div className="space-y-3">
          {displayedOrgs.map((org) => (
            <div
              key={org.id}
              className="p-4 rounded-lg border bg-background hover:border-primary/50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Org Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {org.countries && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          {getCountryFlag(org.countries.code)} {org.countries.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {org.contact_email && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        {org.contact_email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRejectClick(org)}
                    disabled={rejectOrg.isPending}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(org)}
                    disabled={approveOrg.isPending}
                    className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-50"
                    title="Approve"
                  >
                    {approveOrg.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {limit && pendingOrgs.length > limit && (
          <div className="mt-4 pt-4 border-t text-center">
            <button className="text-sm text-primary hover:underline">
              View all {pendingOrgs.length} pending applications
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false)
          setSelectedOrg(null)
        }}
        organization={selectedOrg}
        onSubmit={handleRejectSubmit}
        isPending={rejectOrg.isPending}
      />
    </>
  )
}
