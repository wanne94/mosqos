import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { PlatformAdminGuard, OrganizationAdminGuard } from './guards'

// Layouts
const PublicLayout = lazy(() => import('./layouts/PublicLayout'))
const AuthLayout = lazy(() => import('./layouts/AuthLayout'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const PlatformLayout = lazy(() => import('./layouts/PlatformLayout'))
const PortalLayout = lazy(() => import('./layouts/PortalLayout'))

// Public Pages
const LandingPage = lazy(() => import('@/features/auth/pages/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'))

// Platform Pages
const PlatformDashboardPage = lazy(() => import('@/features/platform/pages/DashboardPage'))
const OrganizationsPage = lazy(() => import('@/features/platform/pages/OrganizationsPage'))
const PlansPage = lazy(() => import('@/features/platform/pages/PlansPage'))
const DiscountCodesPage = lazy(() => import('@/features/platform/pages/DiscountCodesPage'))
const AnalyticsPage = lazy(() => import('@/features/platform/pages/AnalyticsPage'))
const PlatformSettingsPage = lazy(() => import('@/features/platform/pages/SettingsPage'))

// Admin Pages
const PeoplePage = lazy(() => import('@/features/members/pages/PeoplePage'))
const DonorsPage = lazy(() => import('@/features/donations/pages/DonorsPage'))
const ExpensesPage = lazy(() => import('@/features/expenses/pages/ExpensesPage'))
const EducationPage = lazy(() => import('@/features/education/pages/EducationPage'))
const ClassEditPage = lazy(() => import('@/features/education/pages/ClassEditPage'))
const AdminCasesPage = lazy(() => import('@/features/cases/pages/CasesPage'))
const UmrahPage = lazy(() => import('@/features/umrah/pages/UmrahPage'))
const BillingPage = lazy(() => import('@/features/billing/pages/BillingPage'))
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

// Portal Pages
const PortalDashboardPage = lazy(() => import('@/features/portal/pages/DashboardPage'))
const ProfilePage = lazy(() => import('@/features/portal/pages/ProfilePage'))
const RecurringDonationsPage = lazy(() => import('@/features/portal/pages/RecurringDonationsPage'))
const PortalCasesPage = lazy(() => import('@/features/portal/pages/CasesPage'))

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
            <PlatformAdminGuard>
              <PlatformLayout />
            </PlatformAdminGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformDashboardPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="discount-codes" element={<DiscountCodesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<PlatformSettingsPage />} />
      </Route>

      {/* Organization Admin Routes */}
      <Route
        path="/:slug/admin"
        element={
          <ProtectedRoute>
            <OrganizationAdminGuard>
              <AdminLayout />
            </OrganizationAdminGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="people" replace />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="donors" element={<DonorsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="education" element={<EducationPage />} />
        <Route path="education/class/:id" element={<ClassEditPage />} />
        <Route path="cases" element={<AdminCasesPage />} />
        <Route path="umrah" element={<UmrahPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Placeholder routes for future pages */}
        <Route path="qurbani" element={<div className="p-6">Qurbani - Coming Soon</div>} />
        <Route path="services" element={<div className="p-6">Islamic Services - Coming Soon</div>} />
        <Route path="announcements" element={<div className="p-6">Announcements - Coming Soon</div>} />
      </Route>

      {/* Member Portal Routes */}
      <Route
        path="/:slug/portal"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PortalDashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="recurring-donations" element={<RecurringDonationsPage />} />
        <Route path="cases" element={<PortalCasesPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="min-h-screen flex items-center justify-center">404 - Not Found</div>} />
    </Routes>
  )
}
