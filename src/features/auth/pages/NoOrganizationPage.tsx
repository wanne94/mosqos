import { Link, useNavigate } from 'react-router-dom'
import { Building2, Mail, Plus, ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'

export default function NoOrganizationPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full">
        <div className="rounded-2xl p-8 text-center bg-card border">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="w-10 h-10 text-muted-foreground" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3">No Organization Found</h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8">
            You're not currently associated with any organization. Choose an option below to get started.
          </p>

          {/* Options */}
          <div className="space-y-4">
            {/* Create Organization */}
            <Link
              to="/signup"
              className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition group text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition">
                  Register a New Mosque
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create a new organization and become its administrator
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
            </Link>

            {/* Wait for Invitation */}
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30 text-left">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  Waiting for an Invitation?
                </h3>
                <p className="text-sm text-muted-foreground">
                  If you've been invited to join an organization, check your email for the invitation link
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Having trouble? Our support team is here to help.
            </p>
            <a
              href="mailto:support@mosqos.com"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>

        {/* User info and sign out */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Signed in as <span className="font-medium">{user?.email}</span>
          </p>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
