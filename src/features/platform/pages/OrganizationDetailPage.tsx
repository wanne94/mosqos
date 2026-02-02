import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Calendar,
  Edit, Trash2, CheckCircle, XCircle, Power, Loader2, Users, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useOrganization,
  useOrganizationStats,
  useApproveOrganization,
  useRejectOrganization,
  useDeleteOrganization,
  useDeactivateOrganization,
  useReactivateOrganization
} from '@/features/organizations/hooks/useOrganizations'
import EditOrganizationModal from '../components/EditOrganizationModal'

// Country flags helper
const getCountryFlag = (code: string) => {
  const flags: Record<string, string> = {
    US: '🇺🇸', TR: '🇹🇷', DE: '🇩🇪', GB: '🇬🇧',
    CA: '🇨🇦', AU: '🇦🇺', FR: '🇫🇷', NL: '🇳🇱'
  }
  return flags[code] || '🏳️'
}

// Status badge colors
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// Subscription status colors
const subscriptionColors = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  past_due: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  canceled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  paused: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: organization, isLoading, error } = useOrganization(id || '')
  const { data: stats } = useOrganizationStats(id || '')

  const approveOrg = useApproveOrganization()
  const rejectOrg = useRejectOrganization()
  const deleteOrg = useDeleteOrganization()
  const deactivateOrg = useDeactivateOrganization()
  const reactivateOrg = useReactivateOrganization()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const handleApprove = async () => {
    if (!organization) return
    try {
      await approveOrg.mutateAsync(organization.id)
      toast.success('Organization approved!')
    } catch (error) {
      toast.error('Failed to approve organization')
    }
  }

  const handleReject = async () => {
    if (!organization) return
    const reason = prompt('Please enter the rejection reason:')
    if (!reason) return

    try {
      await rejectOrg.mutateAsync({ organizationId: organization.id, reason })
      toast.success('Organization rejected')
    } catch (error) {
      toast.error('Failed to reject organization')
    }
  }

  const handleDelete = async () => {
    if (!organization) return
    try {
      await deleteOrg.mutateAsync(organization.id)
      toast.success('Organization deleted')
      navigate('/platform/organizations')
    } catch (error) {
      toast.error('Failed to delete organization')
    }
  }

  const handleToggleActive = async () => {
    if (!organization) return
    try {
      if (organization.is_active) {
        await deactivateOrg.mutateAsync(organization.id)
        toast.success('Organization deactivated')
      } else {
        await reactivateOrg.mutateAsync(organization.id)
        toast.success('Organization reactivated')
      }
    } catch (error) {
      toast.error('Failed to update organization status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The organization you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link to="/platform/organizations" className="text-primary hover:underline">
          Back to Organizations
        </Link>
      </div>
    )
  }

  const subscription = organization.organization_subscriptions?.[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/platform/organizations')}
          className="p-2 rounded-lg hover:bg-muted transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            {organization.countries && (
              <span className="text-2xl" title={organization.countries.name}>
                {getCountryFlag(organization.countries.code)}
              </span>
            )}
            {organization.status && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[organization.status]}`}>
                {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
              </span>
            )}
            {!organization.is_active && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Inactive
              </span>
            )}
          </div>
          <p className="text-muted-foreground">/{organization.slug}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {organization.status === 'pending' && (
            <>
              <button
                onClick={handleReject}
                disabled={rejectOrg.isPending}
                className="px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={approveOrg.isPending}
                className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2"
              >
                {approveOrg.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve
              </button>
            </>
          )}

          <button
            onClick={handleToggleActive}
            disabled={deactivateOrg.isPending || reactivateOrg.isPending}
            className="px-3 py-2 rounded-lg border hover:bg-muted transition flex items-center gap-2"
          >
            <Power className="w-4 h-4" />
            {organization.is_active ? 'Deactivate' : 'Reactivate'}
          </button>

          <button
            onClick={() => setEditModalOpen(true)}
            className="px-3 py-2 rounded-lg border hover:bg-muted transition flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="text-2xl font-bold">{stats?.memberCount ?? '...'}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Households</p>
          <p className="text-2xl font-bold">{stats?.householdCount ?? '...'}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Total Donations</p>
          <p className="text-2xl font-bold">
            ${((stats?.totalDonations ?? 0) / 100).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Active Classes</p>
          <p className="text-2xl font-bold">{stats?.activeClasses ?? '...'}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Open Cases</p>
          <p className="text-2xl font-bold">{stats?.openCases ?? '...'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organization Details
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {organization.contact_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${organization.contact_email}`} className="text-primary hover:underline">
                        {organization.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {organization.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${organization.contact_phone}`} className="hover:underline">
                        {organization.contact_phone}
                      </a>
                    </div>
                  </div>
                )}

                {organization.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {organization.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {(organization.address_line1 || organization.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p>
                        {organization.address_line1 && <span>{organization.address_line1}<br /></span>}
                        {organization.address_line2 && <span>{organization.address_line2}<br /></span>}
                        {[organization.city, organization.state, organization.postal_code].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p>{new Date(organization.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {organization.status === 'rejected' && organization.rejection_reason && (
            <div className="p-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900">
              <h2 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-400">
                Rejection Reason
              </h2>
              <p className="text-red-600 dark:text-red-300">{organization.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Info */}
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </h2>

            {subscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">
                    {subscription.subscription_plans?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    subscriptionColors[subscription.status as keyof typeof subscriptionColors] || subscriptionColors.paused
                  }`}>
                    {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="capitalize">{subscription.billing_cycle}</span>
                </div>
                {subscription.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next Billing</span>
                    <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No active subscription</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Quick Links
            </h2>
            <div className="space-y-2">
              <Link
                to={`/${organization.slug}/admin`}
                className="block p-3 rounded-lg hover:bg-muted transition text-sm"
              >
                View Admin Dashboard
              </Link>
              <Link
                to={`/platform/users?organization_id=${organization.id}`}
                className="block p-3 rounded-lg hover:bg-muted transition text-sm"
              >
                View Organization Users
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditOrganizationModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        organization={organization}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Organization</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{organization.name}</strong>? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteOrg.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleteOrg.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
