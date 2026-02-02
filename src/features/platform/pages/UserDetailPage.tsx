import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Building2, Shield, Calendar,
  DollarSign, FileText, Loader2
} from 'lucide-react'
import { useUserDetail } from '../hooks/useUsers'
import type { UserRole } from '../types/user.types'

// Role badge colors
const roleColors: Record<UserRole, string> = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delegate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  imam: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const roleLabels: Record<UserRole, string> = {
  owner: 'Organization Owner',
  delegate: 'Delegate Admin',
  member: 'Member',
  imam: 'Imam',
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: user, isLoading, error } = useUserDetail(id || '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The user you're looking for doesn't exist or you don't have access.
        </p>
        <Link to="/platform/users" className="text-primary hover:underline">
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/platform/users')}
          className="p-2 rounded-lg hover:bg-muted transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {/* Avatar - Initials only */}
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-xl">
                {(user.user_metadata.full_name as string || user.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user.user_metadata.full_name as string || user.email}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organizations */}
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organizations
            </h2>

            {user.organizations.length > 0 ? (
              <div className="space-y-3">
                {user.organizations.map((org) => (
                  <Link
                    key={org.organization_id}
                    to={`/platform/organizations/${org.organization_id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{org.organization_name}</h3>
                        <p className="text-sm text-muted-foreground">/{org.organization_slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${roleColors[org.role]}`}>
                        {roleLabels[org.role]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Joined {new Date(org.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Not a member of any organization</p>
              </div>
            )}
          </div>

          {/* Member Profile (if exists) */}
          {user.member_profile && (
            <div className="p-6 rounded-xl border bg-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Member Profile
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {user.member_profile.first_name} {user.member_profile.last_name}
                  </p>
                </div>
                {user.member_profile.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.member_profile.phone}</p>
                  </div>
                )}
                {user.member_profile.date_of_birth && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {new Date(user.member_profile.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Info
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                  {user.email_confirmed_at ? (
                    <span className="text-xs text-green-600">Verified</span>
                  ) : (
                    <span className="text-xs text-yellow-600">Not verified</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Account Created</p>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {user.last_sign_in_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Sign In</p>
                    <p className="font-medium">
                      {new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          {user.activity_stats && (
            <div className="p-6 rounded-xl border bg-card">
              <h2 className="text-lg font-semibold mb-4">Activity</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total Donations</span>
                  </div>
                  <span className="font-semibold">{user.activity_stats.total_donations}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cases Submitted</span>
                  </div>
                  <span className="font-semibold">{user.activity_stats.total_cases}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
