import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy } from 'react'
import { useAuth } from '../providers/AuthProvider'

// Layouts
const PublicLayout = lazy(() => import('./layouts/PublicLayout'))
const AuthLayout = lazy(() => import('./layouts/AuthLayout'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const PlatformLayout = lazy(() => import('./layouts/PlatformLayout'))

// Public Pages
const LandingPage = lazy(() => import('@/features/auth/pages/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'))

// Admin Pages
const DashboardPage = lazy(() => import('@/features/platform/pages/DashboardPage'))
const MembersPage = lazy(() => import('@/features/members/pages/MembersPage'))

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route Component (redirects authenticated users)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/platform" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />
      </Route>

      {/* Platform Admin Routes */}
      <Route
        path="/platform"
        element={
          <ProtectedRoute>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="organizations" element={<div>Organizations</div>} />
        <Route path="plans" element={<div>Plans</div>} />
        <Route path="analytics" element={<div>Analytics</div>} />
      </Route>

      {/* Organization Admin Routes */}
      <Route
        path="/:slug/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/:id" element={<div>Member Detail</div>} />
        <Route path="households" element={<div>Households</div>} />
        <Route path="donations" element={<div>Donations</div>} />
        <Route path="funds" element={<div>Funds</div>} />
        <Route path="pledges" element={<div>Pledges</div>} />
        <Route path="education" element={<div>Education</div>} />
        <Route path="cases" element={<div>Cases</div>} />
        <Route path="umrah" element={<div>Umrah</div>} />
        <Route path="qurbani" element={<div>Qurbani</div>} />
        <Route path="services" element={<div>Islamic Services</div>} />
        <Route path="announcements" element={<div>Announcements</div>} />
        <Route path="permissions" element={<div>Permissions</div>} />
        <Route path="settings" element={<div>Settings</div>} />
      </Route>

      {/* Member Portal Routes */}
      <Route
        path="/:slug/portal"
        element={
          <ProtectedRoute>
            <div>Portal Layout</div>
          </ProtectedRoute>
        }
      >
        <Route index element={<div>Portal Dashboard</div>} />
        <Route path="profile" element={<div>My Profile</div>} />
        <Route path="donations" element={<div>My Donations</div>} />
        <Route path="family" element={<div>My Family</div>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="min-h-screen flex items-center justify-center">404 - Not Found</div>} />
    </Routes>
  )
}
