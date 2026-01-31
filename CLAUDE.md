# CLAUDE.md - AI Assistant Guide for MosqOS

> **Project**: MosqOS - Multi-tenant Mosque Management SaaS Platform
> **Last Updated**: January 2026
> **Purpose**: Guide for AI assistants (Claude, etc.) working on this codebase

---

## 📋 Quick Reference

### Project Type
Multi-tenant SaaS application for mosque/community management with mobile support.

### Technology Stack

#### Frontend Core
- **Framework**: React 19 (latest)
- **Build Tool**: Vite 6
- **Language**: TypeScript 5.6 (strict mode)
- **Styling**: Tailwind CSS 4 (with @tailwindcss/vite plugin)
- **Icons**: Lucide React

#### State Management
- **Server State**: TanStack Query (React Query) v5 - for API data, caching, synchronization
- **Client State**: Zustand v5 - for UI state (sidebar, theme, language, offline queue)
- **Forms**: React Hook Form v7 + Zod v3 - form management with schema validation

#### Routing & Navigation
- **Router**: React Router DOM v7
- **Routing Pattern**: Slug-based multi-tenancy (`/:slug/admin/...`, `/:slug/portal/...`)

#### Backend & Data
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password, magic links)
- **File Storage**: Supabase Storage

#### Internationalization (i18n)
- **Library**: i18next v24 + react-i18next v15
- **Languages**: English (en), Arabic (ar - RTL), Turkish (tr)
- **Detection**: i18next-browser-languagedetector
- **Loading**: i18next-http-backend

#### Data Visualization
- **Charts**: Recharts v2
- **Tables**: TanStack Table v8

#### Date Handling
- **Gregorian**: date-fns v3
- **Hijri/Islamic**: moment-hijri v3

#### UI/UX
- **Component Library**: Custom components based on shadcn/ui patterns
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Notifications**: Sonner v1 (toast notifications)

#### Mobile
- **Framework**: Capacitor (iOS + Android native builds)
- **PWA**: Offline-first with service workers

#### Payments
- **Provider**: Stripe (subscriptions, one-time payments)

#### MCP Servers
- **Supabase Local MCP** - Direct database access through MCP protocol
  - Endpoint: http://127.0.0.1:54331/mcp
  - Mode: Read-only (recommended for safety)
  - Configuration: `.mcp.json` (gitignored)
  - Usage: `@supabase-local <query>` in Claude Code
  - Example: `@supabase-local List all tables`

---

## 🏗️ Architecture Overview

### Multi-Tenancy Model

```
Platform Admin (SaaS Owner)
    ↓
Organizations (Mosques/Communities)
    ↓
Organization Owners/Delegates
    ↓
Permission Groups (Active Directory-style)
    ↓
Members (Users)
```

### URL Structure

```
Public:
  / - Landing page
  /pricing - Pricing plans
  /login - Login
  /signup/invite/:token - Invitation signup
  /:slug/join - Public member registration

Platform Admin:
  /platform/dashboard
  /platform/organizations
  /platform/plans
  /platform/analytics

Organization Admin:
  /:slug/admin/dashboard
  /:slug/admin/members
  /:slug/admin/households
  /:slug/admin/donations
  /:slug/admin/education
  /:slug/admin/cases
  /:slug/admin/umrah
  /:slug/admin/qurbani
  /:slug/admin/services
  /:slug/admin/announcements
  /:slug/admin/permissions
  /:slug/admin/settings

Member Portal:
  /:slug/portal/dashboard
  /:slug/portal/profile
  /:slug/portal/donations
  /:slug/portal/family
  /:slug/portal/education
```

### Folder Structure

```
src/
├── app/                          # App entry and global providers
│   ├── App.tsx                   # Root component
│   ├── providers/                # Context providers
│   │   ├── index.tsx             # Combined providers wrapper
│   │   ├── AuthProvider.tsx
│   │   ├── OrganizationProvider.tsx
│   │   ├── PermissionProvider.tsx
│   │   ├── I18nProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── OfflineProvider.tsx
│   │   └── ToastProvider.tsx
│   └── router/                   # Routing configuration
│       ├── index.tsx
│       ├── routes.tsx
│       ├── guards/               # Route guards
│       └── layouts/              # Layout components
│
├── features/                     # Feature modules (domain-driven design)
│   ├── auth/                     # Authentication
│   ├── platform/                 # Platform admin features
│   ├── organizations/            # Organization management
│   ├── members/                  # Member/people management
│   ├── households/               # Household management
│   ├── donations/                # Financial donations
│   ├── education/                # Education/classes
│   ├── cases/                    # Service cases (with KPI tracking)
│   ├── umrah/                    # Umrah trip management
│   ├── qurbani/                  # Qurbani/sacrifice campaigns
│   ├── islamic-services/         # Nikah, Janazah, Shahada
│   ├── announcements/            # Announcements
│   ├── permissions/              # Permission groups (AD-style)
│   ├── billing/                  # Subscription billing
│   └── portal/                   # Member portal
│
├── shared/                       # Shared resources
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   ├── forms/                # Form components
│   │   ├── layout/               # Layout components
│   │   ├── data/                 # Data display components
│   │   └── feedback/             # Loading, error, empty states
│   ├── hooks/                    # Shared React hooks
│   ├── utils/                    # Utility functions
│   ├── constants/                # Constants
│   ├── types/                    # TypeScript types
│   └── lib/                      # Shared libraries
│
├── lib/                          # External service integrations
│   ├── supabase/                 # Supabase client & helpers
│   ├── i18n/                     # i18n configuration
│   ├── stripe/                   # Stripe integration
│   ├── stores/                   # Zustand stores
│   ├── offline/                  # Offline/PWA logic
│   └── mcp/                      # MCP server integrations
│
└── styles/                       # Global styles
    └── globals.css
```

### Feature Module Structure

Each feature follows this pattern:
```
feature-name/
├── components/       # Feature-specific components
├── hooks/           # Feature-specific hooks
├── services/        # API calls and business logic
├── types/           # Feature-specific TypeScript types
├── pages/           # Page components
└── index.ts         # Public exports
```

---

## 🔑 Key Concepts

### 1. Multi-Tenancy
- Each organization has a unique slug (e.g., `/green-lane-masjid/admin/...`)
- Organization context is provided via `OrganizationProvider`
- All data queries are scoped to the current organization via RLS (Row Level Security)

### 2. Permission System (AD-Style)
- Permission groups are combinable (user can be in multiple groups)
- Permission hierarchy:
  1. Platform Admin - Full access to ALL organizations
  2. Organization Owner - Full access to OWN organization
  3. Organization Delegate - Co-admin with full access
  4. Permission Groups - Granular permissions:
     - Administrators
     - Finance Team
     - Education Team
     - Case Workers
     - Umrah Coordinators
     - Qurbani Coordinators
     - Viewers (read-only)

### 3. Internationalization
- Three languages: English (en), Arabic (ar - RTL), Turkish (tr)
- Translation files in `public/locales/{lang}/{module}.json`
- RTL support built-in for Arabic
- Use `useTranslation()` hook from react-i18next

### 4. Date Handling
- Dual calendar system: Gregorian + Hijri (Islamic calendar)
- Use `date-fns` for Gregorian dates
- Use `moment-hijri` for Hijri dates
- Display both dates in UI where appropriate

### 5. Offline Support
- PWA with service workers
- Offline queue for mutations (managed via Zustand)
- Automatic sync when online

### 6. State Management Strategy

**Server State (TanStack Query)**:
```typescript
// All API data, auto-cached and synchronized
const { data, isLoading } = useQuery({
  queryKey: ['members', organizationId],
  queryFn: () => membersService.getAll(organizationId)
})
```

**Client State (Zustand)**:
```typescript
// UI state only
interface UIStore {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  ramadanMode: boolean
  hijriPrimary: boolean
  language: 'en' | 'ar' | 'tr'
}
```

**Context (React Context)**:
- AuthContext - Current user
- OrganizationContext - Current organization
- PermissionContext - User permissions
- ThemeContext - Theme settings
- ToastContext - Toast notifications

---

## 🎨 Styling Guidelines

### Tailwind CSS 4
- Using new Tailwind CSS v4 with Vite plugin
- Utility-first approach
- Custom design tokens in `src/styles/globals.css`

### Component Patterns
```typescript
// Use class-variance-authority for variants
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-input bg-background',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      }
    }
  }
)
```

### RTL Support
- Arabic language automatically switches to RTL
- Use logical properties: `ms-4` (margin-inline-start) instead of `ml-4`
- Test all UI components in both LTR and RTL modes

---

## 🛠️ Development Guidelines

### TypeScript
- Strict mode enabled
- No `any` types - use `unknown` or proper types
- Define interfaces for all API responses
- Use Zod schemas for validation and type inference

### Form Handling
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

### API Calls
```typescript
// Use Supabase client from lib/supabase/client.ts
import { supabase } from '@/lib/supabase/client'

// Always scope queries to organization
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('organization_id', organizationId)
```

### Data Fetching Pattern
```typescript
// services/members.service.ts
export const membersService = {
  getAll: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) throw error
    return data
  }
}

// hooks/useMembers.ts
import { useQuery } from '@tanstack/react-query'

export const useMembers = (organizationId: string) => {
  return useQuery({
    queryKey: ['members', organizationId],
    queryFn: () => membersService.getAll(organizationId),
    enabled: !!organizationId
  })
}

// component
const { data: members, isLoading } = useMembers(organization.id)
```

### Mutations Pattern
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useCreateMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: membersService.create,
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ['members', variables.organization_id]
      })
    }
  })
}
```

---

## 📦 Database Schema

### Core Tables
- `countries` - Country configurations
- `organizations` - Mosques/communities
- `platform_admins` - SaaS owners
- `subscription_plans` - Pricing tiers
- `organization_subscriptions` - Active subscriptions

### Permission Tables
- `permissions` - Permission definitions
- `permission_groups` - Groups per organization
- `permission_group_permissions` - Group-permission mapping
- `organization_owners` - Highest level access
- `organization_delegates` - Co-admins
- `organization_members` - Regular users
- `member_group_assignments` - Member-group mapping

### Feature Tables
- **Members**: `households`, `members`
- **Donations**: `funds`, `donations`, `recurring_donations`, `pledges`, `bank_statement_imports`
- **Education**: `classrooms`, `classes`, `teachers`, `enrollments`, `attendance`, `evaluations`
- **Cases**: `case_categories`, `service_cases`, `case_activity_log`
- **Umrah**: `umrah_trips`, `pilgrims`, `pilgrim_payments`
- **Qurbani**: `qurbani_campaigns`, `qurbani_shares`, `qurbani_slots`
- **Islamic Services**: `islamic_service_types`, `islamic_services`
- **Announcements**: `announcements`
- **Audit**: `audit_log`

---

## 🚀 Common Tasks

### Run Development Server
```bash
npm run dev
# Server runs on http://localhost:5173
```

### Build for Production
```bash
npm run build
# Output in dist/
```

### Type Checking
```bash
npm run build  # TypeScript compilation included
```

### Linting
```bash
npm run lint
```

### Environment Variables
Create `.env` file (see `.env.example`):
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=MosqOS
```

### Database Migrations
```bash
# Apply migrations (via Supabase CLI or dashboard)
# Migrations located in: supabase/migrations/
```

---

## 🎯 Key Features by Module

### Donations Module
- One-time donations
- Recurring donations (Stripe subscriptions)
- Pledges with payment tracking
- Zakat vs Sadaqah distinction
- Fund management with goals
- Bank statement import for reconciliation
- Financial reports (PDF/Excel export)

### Education Module
- Classroom management
- Class scheduling
- Teacher assignments
- Student enrollments
- Attendance tracking
- Grade management
- Tuition payments

### Cases Module (KPI Tracking)
- Case creation with categories
- Assignment workflow
- `handled_by` tracking for KPIs
- Response time / Resolution time metrics
- Activity timeline
- Notes thread

### Umrah Module
- Trip management
- Pilgrim registration
- Visa tracking
- Payment tracking
- Room assignments

### Qurbani Module
- Annual campaign management
- Share registration
- Distribution scheduling
- Pickup slot management

### Islamic Services
- Nikah certificates
- Janazah management
- Shahada/Revert certificates
- PDF certificate generation

---

## 🔐 Security Considerations

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Queries automatically scoped to user's organization
- Platform admins have access to all data

### Authentication
- Supabase Auth handles sessions
- JWT tokens stored in localStorage
- Use `AuthProvider` to access current user

### API Security
- All mutations require authentication
- Organization ownership verified server-side
- Permission checks via `PermissionProvider`

---

## 📱 Mobile Development

### Capacitor Setup
- iOS and Android builds via Capacitor
- Native plugins for: Camera, File System, Push Notifications
- Sync configuration in `capacitor.config.ts`

### Offline-First Architecture
- Service workers cache API responses
- Offline mutations queued in Zustand store
- Auto-sync when connection restored

---

## 🌍 Multi-Country Support

Supports: US, Turkey, Germany

**Country-Specific Features**:
- Currency formatting
- Tax regulations
- Local holidays
- Language preferences

---

## 📊 Implementation Status

Based on `Startplan.md`:

**Phase 1**: Foundation ✅
- Project setup
- Tailwind CSS 4 + RTL
- Supabase setup
- Authentication
- i18n (en, ar, tr)

**Phase 2-9**: Various modules (refer to `Startplan.md` for detailed phases)

---

## 💡 Tips for AI Assistants

### When Writing Code
1. **Always use TypeScript** - No JavaScript files
2. **Follow existing patterns** - Check similar features for consistency
3. **Use path aliases** - Import with `@/` prefix (configured in vite.config.ts)
4. **Component naming** - PascalCase for components, camelCase for utilities
5. **File naming** - kebab-case for files, PascalCase for component files

### When Creating New Features
1. Follow feature module structure
2. Create service layer first (API calls)
3. Create hooks layer (React Query wrappers)
4. Create components
5. Add to router
6. Add translations to i18n files

### When Planning Implementation
- **Parallel Agent Execution** - Always plan for multiple agents to work in parallel on independent tasks
- Structure implementation plans so that independent components (services, hooks, components, types) can be developed simultaneously by different agents
- Identify dependencies early to maximize parallelization opportunities
- Example: When implementing a new feature, plan for agents to work in parallel on:
  - Database migrations and types
  - Service layer (API calls)
  - React hooks
  - UI components
  - i18n translations

### When Debugging
1. Check Supabase logs for database errors
2. Check React Query DevTools for cache issues
3. Check browser console for client errors
4. Verify RLS policies if data not showing

### Common Pitfalls
- ❌ Don't use `any` type
- ❌ Don't bypass RLS (always include organization_id)
- ❌ Don't fetch data in components (use hooks)
- ❌ Don't forget to handle loading/error states
- ❌ Don't hardcode strings (use i18n)
- ✅ Do use Zod for validation
- ✅ Do use TanStack Query for server state
- ✅ Do use Zustand for UI state only
- ✅ Do test RTL layout for Arabic
- ✅ Do consider Hijri dates for Islamic events

---

## 🤖 Available Custom Agents

Custom agents are defined in `~/.claude/agents/` (global) and provide specialized assistance for specific tasks.

### Agent List

| Agent | Model | Purpose | When to Use |
|-------|-------|---------|-------------|
| `supabase-expert` | Sonnet | RLS policies, Supabase queries, types, database patterns | Database questions, RLS audits, type issues |
| `react-query-specialist` | Sonnet | TanStack Query hooks, caching, mutations, optimistic updates | Data fetching, caching issues, mutation setup |
| `i18n-translator` | Haiku | Translations (en/ar/tr), RTL support, translation keys | New features needing translations, RTL fixes |
| `test-runner` | Haiku | Running tests, analyzing failures, coverage reports | After writing code, CI failures |
| `code-reviewer` | Sonnet | Code review, TypeScript quality, best practices | Before merging, code audits |
| `security-audit` | Sonnet | OWASP vulnerabilities, RLS audit, input validation | Security reviews, new features |
| `migration-writer` | Sonnet | SQL migrations, schema changes, RLS policies | New tables, schema changes |
| `component-builder` | Sonnet | React components, shadcn/ui patterns, Tailwind CSS | Building new UI components |
| `feature-scaffolder` | Sonnet | Scaffolding complete feature modules | Starting new features |

### How to Use Agents

**Using Task tool with subagent_type:**
```
Use the code-reviewer agent to review src/features/members/
Use the security-audit agent to check the donations module
Use the i18n-translator agent to add Arabic translations for education module
```

**Proactive Usage:**
- `code-reviewer` and `security-audit` should be used proactively after significant changes
- `test-runner` should run after writing code
- `migration-writer` before creating database changes
- `feature-scaffolder` when starting a new feature module

### Agent Capabilities

**supabase-expert**:
- Reviews RLS policies for multi-tenant security
- Optimizes Supabase queries
- Generates TypeScript types from schema
- Uses MCP Supabase tools for direct database access

**react-query-specialist**:
- Creates service + hook patterns
- Sets up proper cache invalidation
- Implements optimistic updates
- Configures offline support

**i18n-translator**:
- Creates translation files for en, ar, tr
- Ensures RTL support for Arabic
- Maintains consistent Islamic terminology
- Organizes translation keys by feature

**security-audit**:
- Checks OWASP Top 10 vulnerabilities
- Audits RLS policies for all tables
- Reviews authentication flows
- Scans for XSS, SQL injection risks

**migration-writer**:
- Creates safe PostgreSQL migrations
- Adds RLS policies to new tables
- Sets up proper indexes
- Includes rollback strategies

**component-builder**:
- Builds components following shadcn/ui patterns
- Uses CVA for variants
- Ensures RTL compatibility
- Adds proper TypeScript interfaces

**feature-scaffolder**:
- Generates complete feature module structure
- Creates types, services, hooks, components, pages
- Sets up index.ts exports
- Includes translation file templates

---

## 📚 Additional Resources

- **Startplan.md** - Detailed implementation plan with phases
- **Supabase Docs** - https://supabase.com/docs
- **React Query Docs** - https://tanstack.com/query/latest
- **Tailwind CSS v4 Docs** - https://tailwindcss.com/docs
- **Zustand Docs** - https://github.com/pmndrs/zustand
- **React Router v7** - https://reactrouter.com

---

## 🤝 Contributing Guidelines

When making changes:
1. Follow TypeScript strict mode
2. Add proper type definitions
3. Write descriptive commit messages
4. Test in both LTR and RTL modes
5. Ensure offline functionality works
6. Update translations if adding new strings

---

**Last Updated**: January 2026
**Project Version**: 0.1.0
**Tech Stack**: React 19 + Vite + TypeScript + Tailwind CSS 4 + Supabase
