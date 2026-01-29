import { Outlet, Link, useParams, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Users,
  DollarSign,
  GraduationCap,
  FileText,
  Plane,
  Scissors,
  Heart,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import { RoleDisplay, RoleDisplaySkeleton } from '@/shared/components/RoleDisplay'

const navItems = [
  { path: 'people', label: 'People', icon: Users },
  { path: 'donors', label: 'Donors', icon: DollarSign },
  { path: 'expenses', label: 'Expenses', icon: DollarSign },
  { path: 'education', label: 'Education', icon: GraduationCap },
  { path: 'cases', label: 'Cases', icon: FileText },
  { path: 'umrah', label: 'Umrah', icon: Plane },
  { path: 'qurbani', label: 'Qurbani', icon: Scissors },
  { path: 'services', label: 'Islamic Services', icon: Heart },
  { path: 'announcements', label: 'Announcements', icon: Bell },
  { path: 'billing', label: 'Billing', icon: DollarSign },
  { path: 'reports', label: 'Reports', icon: BarChart3 },
  { path: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { slug } = useParams()
  const location = useLocation()
  const { signOut, user } = useAuth()
  const { currentOrganization } = useOrganization()
  const { role, loading: roleLoading } = usePermissions()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname.includes(`/${slug}/admin/${path}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link to={`/${slug}/admin`} className="text-xl font-bold text-primary">
            {currentOrganization?.name || 'MosqOS'}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={`/${slug}/admin/${item.path}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md"
            >
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-20">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLoading ? <RoleDisplaySkeleton /> : <RoleDisplay role={role} />}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted rounded"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
