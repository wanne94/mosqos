# Routing Setup Documentation

## Overview

The Mosque SaaS application uses React Router v6 with lazy loading for optimal performance. The routing structure supports three main sections:
1. **Platform Admin** - Super admin managing the entire platform
2. **Organization Admin** - Admin managing a specific mosque/organization
3. **Member Portal** - Regular members accessing their own data

---

## Route Structure

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | LandingPage | Public landing page |
| `/login` | LoginPage | User login |
| `/signup` | SignupPage | User registration |

### Platform Admin Routes (`/platform`)

All platform routes require authentication and platform admin role.

| Path | Component | Description |
|------|-----------|-------------|
| `/platform` | PlatformDashboardPage | Platform overview and metrics |
| `/platform/organizations` | OrganizationsPage | Manage all organizations |
| `/platform/plans` | PlansPage | Manage subscription plans |
| `/platform/discount-codes` | DiscountCodesPage | Manage platform discount codes |
| `/platform/analytics` | AnalyticsPage | Platform-wide analytics |

### Organization Admin Routes (`/:slug/admin`)

All admin routes require authentication and organization admin role. Routes are scoped to the organization slug.

| Path | Component | Description |
|------|-----------|-------------|
| `/:slug/admin` | Redirect to people | - |
| `/:slug/admin/people` | PeoplePage | Member directory and communication |
| `/:slug/admin/donors` | DonorsPage | Donation management |
| `/:slug/admin/expenses` | ExpensesPage | Expense tracking |
| `/:slug/admin/education` | EducationPage | Education dashboard |
| `/:slug/admin/education/class/:id` | ClassEditPage | Edit specific class |
| `/:slug/admin/cases` | AdminCasesPage | Case management |
| `/:slug/admin/umrah` | UmrahPage | Umrah trip management |
| `/:slug/admin/billing` | BillingPage | Organization billing |
| `/:slug/admin/reports` | ReportsPage | Financial reports |
| `/:slug/admin/settings` | SettingsPage | Organization settings |

**Future Pages (Placeholders):**
- `/:slug/admin/qurbani` - Coming Soon
- `/:slug/admin/services` - Coming Soon
- `/:slug/admin/announcements` - Coming Soon

### Member Portal Routes (`/:slug/portal`)

All portal routes require authentication. Routes are scoped to the organization slug and filtered by the current user.

| Path | Component | Description |
|------|-----------|-------------|
| `/:slug/portal` | PortalDashboardPage | Member dashboard |
| `/:slug/portal/profile` | ProfilePage | Member profile with tabs |
| `/:slug/portal/recurring-donations` | RecurringDonationsPage | Manage recurring donations |
| `/:slug/portal/cases` | PortalCasesPage | Member's own cases |

---

## Layouts

### AdminLayout
- **Location:** `/src/app/router/layouts/AdminLayout.tsx`
- **Features:**
  - Responsive sidebar with navigation
  - Organization name in header
  - User menu with logout
  - Mobile hamburger menu
  - Active route highlighting

### PlatformLayout
- **Location:** `/src/app/router/layouts/PlatformLayout.tsx`
- **Features:**
  - Dark sidebar for platform admin
  - Platform navigation
  - User menu
  - Mobile responsive

### PortalLayout
- **Location:** `/src/app/router/layouts/PortalLayout.tsx`
- **Features:**
  - Member-friendly navigation
  - Organization branding
  - User menu
  - Mobile responsive

### AuthLayout
- **Location:** `/src/app/router/layouts/AuthLayout.tsx`
- **Features:**
  - Centered layout for login/signup
  - Minimal design

### PublicLayout
- **Location:** `/src/app/router/layouts/PublicLayout.tsx`
- **Features:**
  - Public header/footer
  - Marketing layout

---

## Protected Routes

### ProtectedRoute Component
Wraps authenticated routes and redirects to `/login` if not authenticated.

```tsx
<ProtectedRoute>
  <AdminLayout />
</ProtectedRoute>
```

### PublicOnlyRoute Component
Redirects authenticated users away from login/signup to `/platform`.

```tsx
<PublicOnlyRoute>
  <LoginPage />
</PublicOnlyRoute>
```

---

## Navigation Items

### Admin Navigation
```tsx
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
```

### Platform Navigation
```tsx
const navItems = [
  { path: '/platform', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/platform/organizations', label: 'Organizations', icon: Building2 },
  { path: '/platform/plans', label: 'Plans', icon: CreditCard },
  { path: '/platform/discount-codes', label: 'Discount Codes', icon: Tag },
  { path: '/platform/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/platform/settings', label: 'Settings', icon: Settings },
]
```

### Portal Navigation
```tsx
const navItems = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'profile', label: 'My Profile', icon: User },
  { path: 'recurring-donations', label: 'My Donations', icon: Heart },
  { path: 'cases', label: 'My Cases', icon: FileText },
]
```

---

## Lazy Loading

All page components are lazy loaded for optimal performance:

```tsx
const PeoplePage = lazy(() => import('@/features/members/pages/PeoplePage'))
```

This means pages are only loaded when the user navigates to them, reducing initial bundle size.

---

## Adding New Routes

### 1. Create the Page Component
```tsx
// src/features/your-feature/pages/YourPage.tsx
export default function YourPage() {
  return <div>Your Page</div>
}
```

### 2. Add Lazy Import to routes.tsx
```tsx
const YourPage = lazy(() => import('@/features/your-feature/pages/YourPage'))
```

### 3. Add Route Definition
```tsx
<Route path="your-route" element={<YourPage />} />
```

### 4. Add to Navigation (if needed)
Update the appropriate layout file to add the nav item.

---

## URL Structure Examples

### Platform Admin
```
https://app.mosqos.com/platform
https://app.mosqos.com/platform/organizations
https://app.mosqos.com/platform/plans
```

### Organization Admin
```
https://app.mosqos.com/my-mosque/admin/people
https://app.mosqos.com/my-mosque/admin/education
https://app.mosqos.com/my-mosque/admin/education/class/123
```

### Member Portal
```
https://app.mosqos.com/my-mosque/portal
https://app.mosqos.com/my-mosque/portal/profile
https://app.mosqos.com/my-mosque/portal/recurring-donations
```

---

## Route Guards

Routes are protected at multiple levels:

1. **ProtectedRoute Component**: Checks authentication
2. **Layout Level**: Each layout can implement additional role checks
3. **Page Level**: Individual pages can implement permission checks
4. **API Level**: Backend enforces authorization (Row Level Security)

---

## Testing Routes

### Manual Testing
```bash
npm run dev

# Visit routes:
http://localhost:5173/
http://localhost:5173/login
http://localhost:5173/platform
http://localhost:5173/my-org/admin/people
http://localhost:5173/my-org/portal
```

### Common Issues

**404 Errors:**
- Check that the route path matches exactly
- Ensure lazy import path is correct
- Verify the component exports default

**Redirect Loops:**
- Check ProtectedRoute logic
- Verify authentication state
- Check PublicOnlyRoute redirects

**Layout Not Showing:**
- Ensure `<Outlet />` is in the layout component
- Check that routes are nested correctly

---

## Performance Optimization

1. **Lazy Loading**: All pages are lazy loaded
2. **Suspense Boundaries**: App.tsx has a Suspense wrapper with loading fallback
3. **Code Splitting**: Each route creates a separate bundle chunk
4. **TanStack Query**: Data is cached and shared across routes

---

## Next Steps

1. **Authentication**: Implement proper role-based access control
2. **Permissions**: Add granular permissions per feature
3. **Breadcrumbs**: Add breadcrumb navigation
4. **Error Boundaries**: Add error boundaries for each route
5. **Loading States**: Improve loading indicators
6. **Analytics**: Track page views and navigation
7. **SEO**: Add meta tags and titles per route
