import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useUserOrganization } from '@/features/organizations/hooks/useOrganizations'

export default function PendingApprovalPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading, signOut } = useAuth()

  // Poll for organization status
  const { data: organization, isLoading: orgLoading } = useUserOrganization(user?.id)

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!authLoading && !user) {
      navigate('/login')
      return
    }

    // If organization is approved, redirect to admin
    if (organization?.status === 'approved') {
      navigate(`/${organization.slug}/admin`)
    }
  }, [user, authLoading, organization, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Status-specific content
  const getStatusContent = () => {
    if (!organization) {
      return {
        icon: Clock,
        iconColor: 'text-yellow-500',
        title: 'No Organization Found',
        description: 'It seems you are not associated with any organization yet.',
        showWaiting: false,
      }
    }

    switch (organization.status) {
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          title: 'Application Under Review',
          description: `Your application for "${organization.name}" is currently being reviewed by our team. This usually takes 1-2 business days.`,
          showWaiting: true,
        }
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          title: 'Application Not Approved',
          description: organization.rejection_reason || 'Unfortunately, your application was not approved.',
          showWaiting: false,
        }
      case 'approved':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          title: 'Application Approved!',
          description: `Congratulations! "${organization.name}" has been approved. Redirecting...`,
          showWaiting: false,
        }
      default:
        return {
          icon: Clock,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          title: 'Unknown Status',
          description: 'Please contact support for assistance.',
          showWaiting: false,
        }
    }
  }

  const content = getStatusContent()
  const Icon = content.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className={`rounded-2xl p-8 text-center ${content.bgColor || 'bg-card'} border`}>
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${content.bgColor}`}>
            <Icon className={`w-10 h-10 ${content.iconColor}`} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3">{content.title}</h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {content.description}
          </p>

          {/* Organization info */}
          {organization && (
            <div className="bg-background rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Organization</p>
              <p className="font-semibold">{organization.name}</p>
              {organization.countries && (
                <p className="text-sm text-muted-foreground mt-1">
                  {organization.countries.name}
                </p>
              )}
            </div>
          )}

          {/* Waiting indicator */}
          {content.showWaiting && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking for updates automatically...</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {organization?.status === 'rejected' && (
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
              >
                Submit New Application
              </button>
            )}

            <a
              href="mailto:support@mosqos.com"
              className="block w-full py-2 px-4 border rounded-lg font-medium hover:bg-muted transition text-center"
            >
              Contact Support
            </a>

            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 text-muted-foreground hover:text-foreground transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{' '}
          <a href="mailto:support@mosqos.com" className="text-primary hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  )
}
