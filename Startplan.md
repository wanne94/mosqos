# MosqOS - Implementation Plan (Clean Rebuild)

## Executive Summary

Multi-tenant mosque management SaaS platform built with:
- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Mobile**: Capacitor (iOS + Android)
- **i18n**: English, Arabic (RTL), Turkish

---

## 1. Folder Structure

```
mosqos/
├── src/
│   ├── app/                          # App entry and providers
│   │   ├── App.tsx
│   │   ├── providers/
│   │   │   ├── index.tsx             # Combined providers wrapper
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── OrganizationProvider.tsx
│   │   │   ├── PermissionProvider.tsx
│   │   │   ├── I18nProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── OfflineProvider.tsx
│   │   │   └── ToastProvider.tsx
│   │   └── router/
│   │       ├── index.tsx
│   │       ├── routes.tsx
│   │       ├── guards/
│   │       │   ├── AuthGuard.tsx
│   │       │   ├── PermissionGuard.tsx
│   │       │   ├── FeatureGuard.tsx
│   │       │   └── OrganizationGuard.tsx
│   │       └── layouts/
│   │           ├── PublicLayout.tsx
│   │           ├── AuthLayout.tsx
│   │           ├── PlatformLayout.tsx
│   │           ├── AdminLayout.tsx
│   │           └── MemberLayout.tsx
│   │
│   ├── features/                     # Feature modules (domain-driven)
│   │   ├── auth/
│   │   ├── platform/                 # Platform admin
│   │   ├── organizations/
│   │   ├── members/                  # People/Members
│   │   ├── donations/                # Finance
│   │   ├── education/
│   │   ├── cases/                    # Service Cases
│   │   ├── umrah/
│   │   ├── qurbani/
│   │   ├── islamic-services/         # Nikah, Janazah, Shahada
│   │   ├── announcements/
│   │   ├── permissions/              # AD-style groups
│   │   ├── billing/
│   │   └── portal/                   # Member portal
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Input, Select, Modal, Card
│   │   │   ├── forms/                # FormField, DatePicker, HijriDatePicker
│   │   │   ├── layout/               # PageHeader, Sidebar, Header
│   │   │   ├── data/                 # DataTable, Pagination, SearchInput
│   │   │   └── feedback/             # LoadingState, EmptyState, ErrorState
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── i18n/
│   │   ├── stripe/
│   │   ├── stores/                   # Zustand stores
│   │   └── offline/
│   │
│   └── styles/
│       ├── globals.css
│       └── themes/
│
├── public/
│   ├── locales/{en,ar,tr}/
│   └── icons/
│
├── supabase/
│   ├── migrations/
│   └── functions/
│
├── android/
├── ios/
└── capacitor.config.ts
```

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State (Server) | TanStack Query (React Query) |
| State (Client) | Zustand |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| i18n | i18next |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe |
| Mobile | Capacitor |
| Icons | Lucide React |
| Charts | Recharts |
| Tables | TanStack Table |
| Date (Hijri) | @umalqura/core |

---

## 3. Multi-Tenancy Model

```
Platform Admin
    ↓
Organizations (Mosques)
    ↓
Organization Owners / Delegates
    ↓
Permission Groups (AD-style)
    ↓
Members
```

### Permission Hierarchy

1. **Platform Admin** - Full access to ALL organizations
2. **Organization Owner** - Full access to OWN organization
3. **Organization Delegate** - Co-admin, full access
4. **Permission Groups** - Granular, combinable permissions:
   - Administrators
   - Finance Team
   - Education Team
   - Case Workers
   - Umrah Coordinators
   - Qurbani Coordinators
   - Viewers (read-only)

---

## 4. Database Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `countries` | Country configs (US, TR, DE) |
| `organizations` | Mosques/communities |
| `platform_admins` | SaaS owners |
| `subscription_plans` | Pricing tiers |
| `organization_subscriptions` | Active subscriptions |

### Permission Tables (AD-Style)

| Table | Description |
|-------|-------------|
| `permissions` | Permission definitions |
| `permission_groups` | Groups per organization |
| `permission_group_permissions` | Group-permission mapping |
| `organization_owners` | Highest level access |
| `organization_delegates` | Co-admins |
| `organization_members` | Regular users |
| `member_group_assignments` | Member-group mapping |

### Module Tables

| Module | Tables |
|--------|--------|
| **Members** | `households`, `members` |
| **Donations** | `funds`, `donations`, `recurring_donations`, `pledges`, `bank_statement_imports` |
| **Education** | `classrooms`, `classes`, `teachers`, `enrollments`, `attendance`, `evaluations` |
| **Cases** | `case_categories`, `service_cases`, `case_activity_log` |
| **Umrah** | `umrah_trips`, `pilgrims`, `pilgrim_payments` |
| **Qurbani** | `qurbani_campaigns`, `qurbani_shares`, `qurbani_slots` |
| **Islamic Services** | `islamic_service_types`, `islamic_services` |
| **Announcements** | `announcements` |
| **Audit** | `audit_log` |

---

## 5. URL Routing Structure

### Public Routes
```
/                           # Landing
/pricing                    # Pricing
/login                      # Login
/signup/invite/:token       # Invite signup
/:slug/join                 # Public member registration
```

### Platform Admin Routes
```
/platform                   # Dashboard
/platform/organizations     # All organizations
/platform/plans             # Subscription plans
/platform/analytics         # Platform analytics
```

### Organization Admin Routes
```
/:slug/admin/dashboard      # Dashboard
/:slug/admin/members        # Members
/:slug/admin/households     # Households
/:slug/admin/donations      # Donations
/:slug/admin/funds          # Funds
/:slug/admin/pledges        # Pledges
/:slug/admin/reconciliation # Bank reconciliation
/:slug/admin/education      # Education
/:slug/admin/cases          # Cases
/:slug/admin/umrah          # Umrah
/:slug/admin/qurbani        # Qurbani
/:slug/admin/services       # Islamic services
/:slug/admin/announcements  # Announcements
/:slug/admin/permissions    # Permission groups
/:slug/admin/settings       # Settings
```

### Member Portal Routes
```
/:slug/portal               # Dashboard
/:slug/portal/profile       # My profile
/:slug/portal/donations     # My donations
/:slug/portal/family        # My family
/:slug/portal/education     # My classes
```

---

## 6. Key Features

### 6.1 Donations Module
- One-time donations
- Recurring donations (Stripe subscriptions)
- Pledges with payment tracking
- Zakat vs Sadaqah distinction
- Fund management with goals
- Bank statement import for reconciliation
- Financial reports (PDF/Excel export)

### 6.2 Education Module
- Classroom management
- Class scheduling
- Teacher assignments
- Student enrollments
- Attendance tracking
- Grade management
- Tuition payments

### 6.3 Cases Module (KPI Tracking)
- Case creation with categories
- Assignment workflow
- `handled_by` tracking for KPIs
- Response time / Resolution time metrics
- Activity timeline
- Notes thread

### 6.4 Umrah Module
- Trip management
- Pilgrim registration
- Visa tracking
- Payment tracking
- Room assignments

### 6.5 Qurbani Module
- Annual campaign management
- Share registration
- Distribution scheduling
- Pickup slot management

### 6.6 Islamic Services
- Nikah certificates
- Janazah management
- Shahada/Revert certificates
- PDF certificate generation

### 6.7 Special Features
- **Hijri Calendar**: Dual calendar display everywhere
- **Ramadan Mode**: Special theme/features during Ramadan
- **RTL Support**: Full Arabic support
- **Offline Mode**: PWA with sync queue
- **Multi-Country**: US, Turkey, Germany (currency, regulations)

---

## 7. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup (Vite + React 19 + TypeScript)
- [ ] Tailwind CSS 4 + RTL support
- [ ] Supabase project setup
- [ ] Core multi-tenancy tables
- [ ] Authentication flow
- [ ] Organization context + slug routing
- [ ] i18n setup (en, ar, tr)
- [ ] Base UI components

**Deliverable**: Working auth + basic admin layout

### Phase 2: Core Modules (Weeks 3-5)
- [ ] Members module (CRUD, import, analytics)
- [ ] Households module
- [ ] Announcements module
- [ ] Permission groups (AD-style)

**Deliverable**: Complete people management + permissions

### Phase 3: Donations (Weeks 6-8)
- [ ] One-time donations
- [ ] Recurring donations (Stripe)
- [ ] Pledges
- [ ] Funds management
- [ ] Bank statement import
- [ ] Financial reports

**Deliverable**: Complete financial management

### Phase 4: Education (Weeks 9-11)
- [ ] Classrooms & Classes
- [ ] Enrollments
- [ ] Attendance tracking
- [ ] Grades/Evaluations

**Deliverable**: Complete education module

### Phase 5: Cases & Services (Weeks 12-14)
- [ ] Cases module with KPI
- [ ] Islamic services (Nikah, Janazah, Shahada)
- [ ] Certificate generation

**Deliverable**: Case management + certificates

### Phase 6: Umrah & Qurbani (Weeks 15-17)
- [ ] Umrah trip management
- [ ] Pilgrim registration
- [ ] Qurbani campaigns
- [ ] Distribution slots

**Deliverable**: Umrah + Qurbani modules

### Phase 7: Platform Admin (Weeks 18-19)
- [ ] Platform dashboard
- [ ] Organization management
- [ ] Billing system

**Deliverable**: SaaS infrastructure

### Phase 8: Mobile & Offline (Weeks 20-21)
- [ ] Capacitor setup (iOS/Android)
- [ ] Offline support
- [ ] Push notifications

**Deliverable**: Mobile apps

### Phase 9: Polish & Launch (Weeks 22-24)
- [ ] Testing (Unit, Integration, E2E)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] CI/CD + Deployment

**Deliverable**: Production-ready system

---

## 8. State Management Strategy

### Server State (TanStack Query)
- All API data
- Caching + synchronization
- Optimistic updates

### Client State (Zustand)
```typescript
// UI Store
- sidebarCollapsed
- theme (light/dark/system)
- ramadanMode
- hijriPrimary
- language

// Offline Store
- isOnline
- pendingActions[]
- sync queue
```

### Context (React Context)
- AuthContext
- OrganizationContext
- PermissionContext
- ThemeContext
- ToastContext

---

## 9. i18n Structure

```
public/locales/
├── en/
│   ├── common.json      # Shared strings
│   ├── auth.json        # Auth module
│   ├── members.json     # Members module
│   ├── donations.json   # Donations module
│   ├── education.json   # Education module
│   ├── cases.json       # Cases module
│   ├── umrah.json       # Umrah module
│   ├── qurbani.json     # Qurbani module
│   └── services.json    # Islamic services
├── ar/                  # Arabic (RTL)
└── tr/                  # Turkish
```

---

## 10. Critical Files to Create First

1. `src/lib/supabase/client.ts` - Supabase client
2. `src/app/providers/AuthProvider.tsx` - Auth context
3. `src/app/providers/OrganizationProvider.tsx` - Org context
4. `src/features/permissions/hooks/usePermissions.ts` - Permission hook
5. `src/lib/i18n/config.ts` - i18n setup
6. `src/app/router/routes.tsx` - Route definitions
7. `src/shared/components/ui/` - Base components

---

## 11. Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=

# App
VITE_APP_URL=
VITE_APP_NAME=MosqOS
```

---

## 12. Next Steps

1. **Initialize Vite project** with React 19 + TypeScript
2. **Install dependencies**
3. **Setup Tailwind CSS 4**
4. **Create Supabase project** and run migrations
5. **Implement auth flow**
6. **Build first module** (Members)

---

*Generated: January 2026*
*Stack: React 19 + Vite + Tailwind CSS 4 + Supabase*
