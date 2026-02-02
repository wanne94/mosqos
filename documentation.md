# MosqOS Documentation - AI Agent Quick Reference

> **Purpose**: Brza referenca za AI agente - sve na jednom mjestu bez pretraživanja koda
> **Last Updated**: February 2026

---

## Table of Contents
1. [Feature Modules Overview](#feature-modules-overview)
2. [Hooks Reference](#hooks-reference)
3. [Services Reference](#services-reference)
4. [Query Keys](#query-keys)
5. [Types & Enums](#types--enums)
6. [Shared Components](#shared-components)
7. [Shared Hooks](#shared-hooks)
8. [Utilities](#utilities)
9. [Providers & Context](#providers--context)
10. [Common Patterns](#common-patterns)

---

## Feature Modules Overview

| Module | Location | Hooks File | Service File | Types File |
|--------|----------|------------|--------------|------------|
| **Members** | `src/features/members/` | `useMembers.ts` | `members.service.ts` | `members.types.ts` |
| **Households** | `src/features/households/` | `useHouseholds.ts` | `households.service.ts` | `households.types.ts` |
| **Donations** | `src/features/donations/` | `useDonations.ts`, `useFunds.ts`, `usePledges.ts` | `donations.service.ts`, `pledges.service.ts` | `donations.types.ts` |
| **Education** | `src/features/education/` | `useAttendance.ts` | `attendance.service.ts` | `education.types.ts` |
| **Cases** | `src/features/cases/` | `useCases.ts` | `cases.service.ts` | `cases.types.ts` |
| **Permissions** | `src/features/permissions/` | `usePermissions.ts`, `usePermissionGroups.ts` | `permissions.service.ts` | `permissions.types.ts` |
| **Umrah** | `src/features/umrah/` | `useUmrah.ts` | `umrah.service.ts` | `umrah.types.ts` |
| **Qurbani** | `src/features/qurbani/` | `useCampaigns.ts`, `useShares.ts` | `qurbani.service.ts` | `qurbani.types.ts` |
| **Islamic Services** | `src/features/islamic-services/` | `useIslamicServices.ts` | `islamic-services.service.ts` | `islamic-services.types.ts` |
| **Announcements** | `src/features/announcements/` | `useAnnouncements.ts` | `announcements.service.ts` | `announcements.types.ts` |
| **Expenses** | `src/features/expenses/` | `useExpenses.ts` | `expenses.service.ts` | `expenses.types.ts` |
| **Billing** | `src/features/billing/` | `useSubscription.ts`, `useFeatureGate.ts` | - | `billing.types.ts` |
| **Platform** | `src/features/platform/` | `usePlatformStats.ts` | `platform.service.ts` | - |

---

## Hooks Reference

### Members Module
```typescript
// All members with filtering
useMembers({ organizationId?, filters? })
// Returns: { data, isLoading, createMember, updateMember, deleteMember, ... }

// Single member
useMember(id?)
// Returns: { data, isLoading }

// Search function (not React Query)
useMemberSearch(organizationId?)
// Returns: (query: string) => Promise<Member[]>

// Members in household
useHouseholdMembers(householdId?)
// Returns: { data, isLoading }
```

### Households Module
```typescript
useHouseholds({ organizationId?, filters? })
useHousehold(id?)
useHouseholdSearch(organizationId?)
// Mutations: create, update, delete, addMember, removeMember, setHeadOfHousehold
```

### Donations Module
```typescript
// Donations
useDonations({ organizationId?, filters? })
useDonation(id?)
useMemberDonations(memberId?)
// Mutations: create, update, delete, sendReceipt

// Funds
useFunds({ organizationId?, includeInactive? })
useFund(id?)
useFundBalances(organizationId?)
// Mutations: createFund, updateFund, deleteFund

// Pledges
usePledges({ organizationId?, filters? })
usePledge(id?)
useMemberPledges(memberId?)
// Mutations: create, update, delete, recordPayment

// Recurring Donations
useRecurringDonations({ organizationId?, filters? })
useRecurringDonation(id?)
useMemberRecurringDonations(memberId?)
// Mutations: create, update, cancel, pause, resume
```

### Education Module
```typescript
useAttendance({ organizationId?, filters? })
useClassAttendance(organizationId, classId, date)
useStudentAttendance(organizationId, memberId, classId?)
useClassAttendanceSummary(organizationId, classId, dateFrom?, dateTo?)
useStudentAttendanceSummary(organizationId, memberId, classId?)
// Mutations: create, bulkUpsert, update, delete
```

### Cases Module
```typescript
useCases({ organizationId?, filters? })
useCase(id?)
useMemberCases(memberId?)
useMyAssignedCases(userId?)
// Mutations: create, update, delete, assign, updateStatus, addNote
```

### Permissions Module
```typescript
// User permissions (role-based access)
usePermissions()
// Returns: { role, memberId, permissions, isAdmin, isPlatformAdmin, hasPermission(code) }

// Permission code check
useHasPermission(code)
// Returns: boolean

// Permission groups management
usePermissionGroups({ organizationId? })
usePermissionGroup(id?)
// Mutations: create, update, delete, setPermissions

// Group members
useGroupMembers({ groupId?, organizationId? })
useMemberGroups(memberId?)
useMemberPermissionCodes(memberId?)
// Mutations: addMember, removeMember

// All permissions
useAllPermissions()
usePermissionsByModule()
```

### Umrah Module
```typescript
// Trips
useTrips({ organizationId?, filters? })
useTrip(id?)
// Mutations: create, update, delete, updateStatus

// Registrations
useRegistrations({ tripId?, organizationId?, filters? })
useRegistration(id?)
useMemberRegistrations(memberId?)
useAllRegistrations(organizationId?, filters?)
// Mutations: create, update, updateVisaStatus, recordPayment, cancel
```

### Qurbani Module
```typescript
// Campaigns
useCampaigns({ organizationId?, filters? })
useCampaign(campaignId)
useCampaignStats(organizationId, campaignId)
// Mutations: create, update, delete

// Shares
useShares({ organizationId?, filters? })
useShare(shareId)
// Mutations: create, update, delete, recordPayment, updateProcessingStatus, cancelShare
```

### Islamic Services Module
```typescript
useIslamicServices({ organizationId?, filters? })
useIslamicService(id?)
useServiceTypes(organizationId?, activeOnly?)
// Mutations: create, update, updateStatus, recordPayment, delete, seedDefaultTypes
```

### Announcements Module
```typescript
useAnnouncements({ organizationId?, filters? })
useAnnouncement(id?)
usePublishedAnnouncements(organizationId?)
// Mutations: create, update, publish, archive, delete, togglePin
```

### Expenses Module
```typescript
useExpenses({ organizationId?, filters? })
useExpense(id?)
useExpenseSummary(organizationId?, dateRange?)
useExpenseCategories({ organizationId?, activeOnly? })
useExpenseCategory(id?)
useUsedExpenseCategories(organizationId?)
useUsedVendors(organizationId?)
// Mutations: create, update, delete, approve, markAsPaid
```

### Billing Module
```typescript
useSubscription({ organizationId?, enableRealtime? })
// Returns: { subscription, plan, isTrialing, daysRemaining, limits, features, usage }

useHasFeature(featureName, organizationId?)
useCheckLimit(limitType, currentValue, organizationId?)
useFeatureGate(featureName, organizationId?)
useModuleAccess(moduleName, organizationId?)
useMultipleFeatures(features[], organizationId?)
```

### Platform Module
```typescript
usePlatformStats()
useRecentOrganizations(limit?)
useAllOrganizations()
```

---

## Services Reference

### membersService
```typescript
import { membersService } from '@/features/members/services'

membersService.getAll(organizationId, filters?)
membersService.getById(id)
membersService.create(input)
membersService.update(id, input)
membersService.delete(id)
membersService.search(organizationId, query, limit)
membersService.getByHousehold(householdId)
membersService.getStats(organizationId)
membersService.getCities(organizationId)
membersService.getStates(organizationId)
membersService.bulkUpdate(ids, input)
membersService.assignToHousehold(memberId, householdId)
membersService.updateStatus(memberId, status)
```

### householdsService
```typescript
import { householdsService } from '@/features/households/services'

householdsService.getAll(organizationId, filters?)
householdsService.getById(id)
householdsService.create(input)
householdsService.update(id, input)
householdsService.delete(id)
householdsService.addMember(householdId, memberId)
householdsService.removeMember(householdId, memberId)
householdsService.setHeadOfHousehold(householdId, memberId)
householdsService.getStats(organizationId)
householdsService.search(organizationId, query, limit)
householdsService.getCities(organizationId)
```

### donationsService
```typescript
import { donationsService } from '@/features/donations/services'

// Donations
donationsService.getAll(organizationId, filters?)
donationsService.getById(id)
donationsService.create(organizationId, input)
donationsService.update(id, input)
donationsService.delete(id)
donationsService.getByMember(memberId)
donationsService.getSummary(organizationId, dateRange?)
donationsService.sendReceipt(donationId)

// Funds
donationsService.getFunds(organizationId, filters?)
donationsService.getFundById(id)
donationsService.createFund(organizationId, input)
donationsService.updateFund(id, input)
donationsService.deleteFund(id)
```

### pledgesService
```typescript
import { pledgesService } from '@/features/donations/services'

// Pledges
pledgesService.getAll(organizationId, filters?)
pledgesService.getById(id)
pledgesService.create(organizationId, input)
pledgesService.update(id, input)
pledgesService.delete(id)
pledgesService.recordPayment(pledgeId, amount)
pledgesService.getByMember(memberId)
pledgesService.getOverdue(organizationId)

// Recurring Donations
pledgesService.getRecurringDonations(organizationId, filters?)
pledgesService.getRecurringById(id)
pledgesService.createRecurring(organizationId, input)
pledgesService.updateRecurring(id, input)
pledgesService.cancelRecurring(id)
pledgesService.pauseRecurring(id)
pledgesService.resumeRecurring(id)
pledgesService.getRecurringByMember(memberId)
```

### attendanceService
```typescript
import { attendanceService } from '@/features/education/services'

attendanceService.getAll(organizationId, filters?)
attendanceService.getByClassAndDate(organizationId, classId, date)
attendanceService.getByMember(organizationId, memberId, classId?)
attendanceService.create(organizationId, input)
attendanceService.bulkUpsert(organizationId, input)
attendanceService.update(id, status, notes?)
attendanceService.delete(id)
attendanceService.getClassSummary(organizationId, classId, dateFrom?, dateTo?)
attendanceService.getStudentSummary(organizationId, memberId, classId?)
```

### casesService
```typescript
import { casesService } from '@/features/cases/services'

casesService.getAll(organizationId, filters?)
casesService.getById(id)
casesService.create(organizationId, input)
casesService.update(id, input)
casesService.delete(id)
casesService.assign(caseId, userId)
casesService.updateStatus(caseId, status)
casesService.addNote(input)
casesService.getStats(organizationId)
casesService.getByMember(memberId)
casesService.getMyAssigned(userId)
casesService.getRequiringFollowup(organizationId)
casesService.getCaseTypes(organizationId)
casesService.getCategories(organizationId)
casesService.generateCaseNumber(organizationId)
```

### permissionsService
```typescript
import { permissionsService } from '@/features/permissions/services'

// Permissions
permissionsService.getAllPermissions()
permissionsService.getPermissionsByModule()

// Permission Groups
permissionsService.getGroups(organizationId)
permissionsService.getGroupById(id)
permissionsService.createGroup(input)
permissionsService.updateGroup(id, input)
permissionsService.deleteGroup(id)
permissionsService.setGroupPermissions(groupId, permissionIds)

// Group Members
permissionsService.getGroupMembers(groupId)
permissionsService.addMemberToGroup(groupId, memberId)
permissionsService.removeMemberFromGroup(groupId, memberId)
permissionsService.getMemberGroups(memberId)
permissionsService.getMembersNotInGroup(organizationId, groupId)

// Utility
permissionsService.getMemberPermissionCodes(memberId)
permissionsService.seedDefaultGroups(organizationId)
```

### umrahService
```typescript
import { umrahService } from '@/features/umrah/services'

// Trips
umrahService.getTrips(organizationId, filters?)
umrahService.getTripById(id)
umrahService.createTrip(organizationId, input)
umrahService.updateTrip(id, input)
umrahService.deleteTrip(id)
umrahService.updateTripStatus(id, status)
umrahService.getUpcomingTrips(organizationId)
umrahService.getTripsInProgress(organizationId)

// Registrations
umrahService.getRegistrations(tripId, filters?)
umrahService.getAllRegistrations(organizationId, filters?)
umrahService.getRegistrationById(id)
umrahService.createRegistration(organizationId, input)
umrahService.updateRegistration(id, input)
umrahService.updateVisaStatus(input)
umrahService.recordPayment(input)
umrahService.cancelRegistration(input)
umrahService.getRegistrationsByMember(memberId)
umrahService.generateRegistrationNumber(tripId)

// Statistics
umrahService.getStatistics(organizationId)
```

### qurbaniService
```typescript
import { qurbaniService } from '@/features/qurbani/services'

// Campaigns
qurbaniService.getCampaigns(organizationId, filters?)
qurbaniService.getCampaign(campaignId)
qurbaniService.createCampaign(organizationId, input)
qurbaniService.updateCampaign(campaignId, input)
qurbaniService.deleteCampaign(campaignId)

// Shares
qurbaniService.getShares(organizationId, filters?)
qurbaniService.getShare(shareId)
qurbaniService.createShare(organizationId, input)
qurbaniService.updateShare(shareId, input)
qurbaniService.deleteShare(shareId)
qurbaniService.recordPayment(organizationId, input)
qurbaniService.updateProcessingStatus(shareId, status)
qurbaniService.cancelShare(shareId, reason, refundAmount?)

// Statistics
qurbaniService.getCampaignStats(organizationId, campaignId)
```

### islamicServicesService
```typescript
import { islamicServicesService } from '@/features/islamic-services/services'

// Service Types
islamicServicesService.getServiceTypes(organizationId, activeOnly?)
islamicServicesService.getServiceType(id)
islamicServicesService.createServiceType(input)
islamicServicesService.updateServiceType(id, input)
islamicServicesService.deleteServiceType(id)
islamicServicesService.seedDefaultTypes(organizationId)

// Services
islamicServicesService.getAll(organizationId, filters?)
islamicServicesService.getById(id)
islamicServicesService.create(input)
islamicServicesService.update(input)
islamicServicesService.updateStatus(id, status)
islamicServicesService.recordPayment(id, amount)
islamicServicesService.issueCertificate(id, certificateUrl)
islamicServicesService.delete(id)
islamicServicesService.getStats(organizationId)
islamicServicesService.getUpcoming(organizationId, limit?)
```

### announcementsService
```typescript
import { announcementsService } from '@/features/announcements/services'

announcementsService.getAll(organizationId, filters?)
announcementsService.getPublished(organizationId)
announcementsService.getById(id)
announcementsService.create(input)
announcementsService.update(input)
announcementsService.publish(id)
announcementsService.archive(id)
announcementsService.delete(id)
announcementsService.togglePin(id, isPinned)
announcementsService.getStats(organizationId)
announcementsService.getCategories(organizationId)
```

### expensesService
```typescript
import { expensesService } from '@/features/expenses/services'

// Expenses
expensesService.getAll(organizationId, filters?)
expensesService.getById(id)
expensesService.create(organizationId, input)
expensesService.update(id, input)
expensesService.delete(id)
expensesService.approve(id, approved, notes?)
expensesService.markAsPaid(id)
expensesService.getSummary(organizationId, dateRange?)
expensesService.getUsedCategories(organizationId)
expensesService.getUsedVendors(organizationId)

// Expense Categories
expensesService.getCategories(organizationId, activeOnly?)
expensesService.getCategoryById(id)
expensesService.createCategory(organizationId, input)
expensesService.updateCategory(id, input)
expensesService.deleteCategory(id)
expensesService.seedDefaultCategories(organizationId)
```

### platformService
```typescript
import { platformService } from '@/features/platform/services'

platformService.getStats()
platformService.getRecentOrganizations(limit?)
platformService.getAllOrganizations()
```

---

## Query Keys

### Pattern Reference
```typescript
// Simple queries
['resource']
['resource', id]

// Filtered queries (most common)
['resource', organizationId, filters]

// Detail queries
['resource', 'detail', id]

// Nested resources
['resource', 'subresource', id]

// Stats/Summaries
['resource', 'stats', organizationId]
['resource', 'summary', organizationId]
```

### Complete Query Keys by Module

#### Members
```typescript
['members', organizationId, filters]
['members', 'detail', id]
['members', 'stats', organizationId]
['members', 'cities', organizationId]
['members', 'states', organizationId]
['members', 'household', householdId]
```

#### Households
```typescript
['households', organizationId, filters]
['households', 'detail', id]
['households', 'stats', organizationId]
['households', 'cities', organizationId]
```

#### Donations
```typescript
['donations', organizationId, filters]
['donations', 'detail', id]
['donations', 'summary', organizationId, ...]
['donations', 'member', memberId]
['funds', organizationId, filters]
['funds', 'detail', id]
['fund', fundId]
['fund-balances', organizationId]
['pledges', organizationId, filters]
['pledges', 'detail', id]
['pledges', 'overdue', organizationId]
['pledges', 'member', memberId]
['recurring-donations', organizationId, filters]
['recurring-donations', 'detail', id]
['recurring-donations', 'member', memberId]
```

#### Education
```typescript
['attendance', organizationId, filters]
['attendance', 'class', organizationId, classId, date]
['attendance', 'student', organizationId, memberId, classId]
['attendance', 'summary', 'class', organizationId, classId, dateFrom, dateTo]
['attendance', 'summary', 'student', organizationId, memberId, classId]
```

#### Cases
```typescript
['cases', organizationId, filters]
['cases', 'detail', id]
['cases', 'stats', organizationId]
['cases', 'types', organizationId]
['cases', 'categories', organizationId]
['cases', 'followup', organizationId]
['cases', 'member', memberId]
['cases', 'my-assigned', userId]
```

#### Permissions
```typescript
['permissions', 'all']
['permissions', 'by-module']
['permissions', 'member-codes', memberId]
['permission-groups', organizationId]
['permission-groups', 'detail', id]
['permission-group-members', groupId]
['permission-group-members', 'available', organizationId, groupId]
['permission-group-members', 'member', memberId]
['user-permissions']
```

#### Umrah
```typescript
['umrah-trips', organizationId, filters]
['umrah-trips', 'detail', id]
['umrah-trips', 'stats', organizationId]
['umrah-trips', 'upcoming', organizationId]
['umrah-trips', 'in-progress', organizationId]
['umrah-registrations', tripId, filters]
['umrah-registrations', 'detail', id]
['umrah-registrations', 'member', memberId]
['umrah-registrations', 'all', organizationId, filters]
```

#### Qurbani
```typescript
['qurbani-campaigns', organizationId, filters]
['qurbani-campaign', campaignId]
['qurbani-campaign-stats', organizationId, campaignId]
['qurbani-shares', organizationId, filters]
['qurbani-share', shareId]
```

#### Islamic Services
```typescript
['islamic-services', organizationId, filters]
['islamic-services', 'detail', id]
['islamic-services', 'stats', organizationId]
['islamic-services', 'upcoming', organizationId]
['islamic-service-types', organizationId, activeOnly]
```

#### Announcements
```typescript
['announcements', organizationId, filters]
['announcements', 'detail', id]
['announcements', 'stats', organizationId]
['announcements', 'categories', organizationId]
['announcements', 'published', organizationId]
```

#### Expenses
```typescript
['expenses', organizationId, filters]
['expenses', 'detail', id]
['expenses', 'summary', organizationId, dateRange]
['expenses', 'used-categories', organizationId]
['expenses', 'used-vendors', organizationId]
['expense-categories', organizationId, activeOnly]
['expense-categories', 'detail', id]
```

#### Billing
```typescript
['subscription', organizationId]
```

#### Platform
```typescript
['platform', 'stats']
['platform', 'organizations', 'recent', limit]
['platform', 'organizations', 'all']
```

---

## Types & Enums

### Members
```typescript
// src/features/members/types/members.types.ts
type MembershipType = 'individual' | 'family' | 'student' | 'senior' | 'lifetime' | 'honorary'
type MembershipStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'deceased'
type Gender = 'male' | 'female' | 'other'
type ExportFormat = 'csv' | 'xlsx' | 'pdf'

interface Member { id, organization_id, household_id?, first_name, last_name, email?, phone?, ... }
interface MemberFilters { status?, membershipType?, city?, state?, householdId?, search? }
```

### Donations
```typescript
// src/features/donations/types/donations.types.ts
enum DonationType { ONE_TIME, RECURRING, PLEDGE_PAYMENT }
enum PaymentMethod { CASH, CHECK, CARD, BANK_TRANSFER, ONLINE, OTHER }
enum DonationStatus { PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED }
enum PledgeStatus { ACTIVE, COMPLETED, CANCELLED, OVERDUE }
enum RecurringFrequency { WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, ANNUALLY }
enum RecurringStatus { ACTIVE, PAUSED, CANCELLED, COMPLETED }
enum FundType { GENERAL, ZAKAT, SADAQAH, BUILDING, EDUCATION, EMERGENCY, CHARITY, SPECIAL }

interface Donation { id, organization_id, member_id?, fund_id?, amount, type, status, ... }
interface Fund { id, organization_id, name, description?, type, goal_amount?, current_amount, ... }
interface Pledge { id, organization_id, member_id, fund_id?, total_amount, paid_amount, status, ... }
```

### Education
```typescript
// src/features/education/types/education.types.ts
enum CourseLevel { BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS }
enum ClassStatus { DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED }
enum EnrollmentStatus { PENDING, ACTIVE, COMPLETED, WITHDRAWN, SUSPENDED, WAITLISTED }
enum AttendanceStatus { PRESENT, ABSENT, LATE, EXCUSED, EARLY_LEAVE }
enum EvaluationType { QUIZ, TEST, EXAM, ASSIGNMENT, PROJECT, PRESENTATION, ORAL, PARTICIPATION, OTHER }
enum TuitionPaymentStatus { PENDING, PAID, PARTIAL, OVERDUE, WAIVED, CANCELLED }

interface Attendance { id, organization_id, class_id, member_id, date, status, notes?, ... }
```

### Cases
```typescript
// src/features/cases/types/cases.types.ts
enum CaseStatus { OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED, CANCELLED }
enum CasePriority { LOW, MEDIUM, HIGH, URGENT }

interface ServiceCase { id, organization_id, case_number, member_id?, title, description, status, priority, handled_by?, ... }
interface CaseNote { id, case_id, user_id, content, created_at }
```

### Permissions
```typescript
// src/features/permissions/types/permissions.types.ts
enum PermissionModule { MEMBERS, HOUSEHOLDS, DONATIONS, FUNDS, PLEDGES, EDUCATION, CASES, UMRAH, QURBANI, SERVICES, ANNOUNCEMENTS, REPORTS, SETTINGS, PERMISSIONS }

// 50+ permission codes
const PERMISSION_CODES = {
  MEMBERS_VIEW: 'members:view',
  MEMBERS_CREATE: 'members:create',
  MEMBERS_EDIT: 'members:edit',
  MEMBERS_DELETE: 'members:delete',
  // ... (see full list in types file)
}

interface PermissionGroup { id, organization_id, name, description?, is_system, permissions }
interface UserPermissions { role, memberId?, permissions, isAdmin, isPlatformAdmin }
```

### Umrah
```typescript
// src/features/umrah/types/umrah.types.ts
enum TripType { UMRAH, HAJJ, ZIYARAT, EDUCATIONAL, OTHER }
enum TripStatus { DRAFT, OPEN, CLOSED, FULL, IN_PROGRESS, COMPLETED, CANCELLED }
enum RegistrationStatus { PENDING, CONFIRMED, WAITLISTED, CANCELLED, COMPLETED, NO_SHOW }
enum PaymentStatus { PENDING, DEPOSIT_PAID, PARTIAL, PAID, REFUNDED }
enum VisaStatus { NOT_STARTED, DOCUMENTS_SUBMITTED, PROCESSING, APPROVED, REJECTED, ISSUED }
enum RoomType { SINGLE, DOUBLE, TRIPLE, QUAD, FAMILY }

interface Trip { id, organization_id, name, type, status, departure_date, return_date, price, ... }
interface TripRegistration { id, trip_id, member_id, registration_number, status, payment_status, visa_status, ... }
```

### Qurbani
```typescript
// src/features/qurbani/types/qurbani.types.ts
enum CampaignStatus { DRAFT, OPEN, CLOSED, IN_PROGRESS, COMPLETED, CANCELLED }
enum AnimalType { SHEEP, COW, CAMEL }
enum IntentionType { SELF, FAMILY, DECEASED, OTHER }
enum DistributionType { LOCAL_PICKUP, FULL_CHARITY, OVERSEAS, HYBRID }
enum ShareStatus { PENDING, CONFIRMED, CANCELLED, COMPLETED, REFUNDED }
enum PaymentStatus { PENDING, DEPOSIT_PAID, PARTIAL, PAID, REFUNDED }
enum ProcessingStatus { REGISTERED, SLAUGHTERED, PROCESSED, READY_FOR_PICKUP, DISTRIBUTED, COMPLETED }

interface QurbaniCampaign { id, organization_id, name, year, status, start_date, end_date, ... }
interface QurbaniShare { id, campaign_id, member_id, animal_type, share_count, intention_type, status, ... }
```

### Islamic Services
```typescript
// src/features/islamic-services/types/islamic-services.types.ts
type ServiceStatus = 'requested' | 'pending_documents' | 'documents_received' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
type FeeStatus = 'pending' | 'partial' | 'paid' | 'waived'
type ServiceTypeSlug = 'nikah' | 'janazah' | 'shahada' | 'aqeeqah' | 'counseling' | 'other'

interface IslamicServiceType { id, organization_id, slug, name, description?, default_fee?, is_active, ... }
interface IslamicService { id, organization_id, type_id, member_id?, status, fee_status, ... }
```

### Announcements
```typescript
// src/features/announcements/types/announcements.types.ts
type AnnouncementPriority = 'normal' | 'important' | 'urgent'
type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived'
type TargetAudience = 'all' | 'members' | 'specific_groups'

interface Announcement { id, organization_id, title, content, priority, status, publish_at?, ... }
```

### Expenses
```typescript
// src/features/expenses/types/expenses.types.ts
type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled'
type ExpensePaymentMethod = 'cash' | 'check' | 'card' | 'bank_transfer' | 'online' | 'other'

interface Expense { id, organization_id, category_id?, description, amount, status, vendor?, ... }
interface ExpenseCategory { id, organization_id, name, description?, is_active }
```

### Billing
```typescript
// src/features/billing/types/billing.types.ts
enum SubscriptionStatus { TRIALING, ACTIVE, PAST_DUE, CANCELED, UNPAID, INCOMPLETE, PAUSED }
enum BillingCycle { MONTHLY, YEARLY }

interface SubscriptionPlan { id, name, slug, features, max_members, max_storage_gb, ... }
interface OrganizationSubscription { id, organization_id, plan_id, status, current_period_start, current_period_end, ... }
```

---

## Shared Components

### Location: `src/shared/components/`

```typescript
// Import
import { LoadingSpinner, InlineSpinner, ConfirmModal, ConfirmDeleteModal, OrganizationSelector, RoleDisplay } from '@/shared/components'
```

#### LoadingSpinner
```tsx
<LoadingSpinner message="Loading..." size="md" fullScreen={false} />
<InlineSpinner size="sm" />
// sizes: 'sm' | 'md' | 'lg'
```

#### ConfirmModal
```tsx
<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
  confirmText="Confirm"
  cancelText="Cancel"
  isLoading={isLoading}
/>
```

#### ConfirmDeleteModal
```tsx
<ConfirmDeleteModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  itemName="John Doe"  // Shows in bold
  message="This action cannot be undone."
  isLoading={isDeleting}
/>
```

#### OrganizationSelector
```tsx
// Dropdown for switching organizations (shows in sidebar/header)
<OrganizationSelector className="w-full" />
// Only renders if user has multiple organizations or is platform admin
```

#### RoleDisplay
```tsx
<RoleDisplay role="owner" variant="badge" />
<RoleDisplay role="delegate" variant="text" />
<RoleDisplaySkeleton />  // Loading state
// variants: 'text' | 'badge'
```

---

## Shared Hooks

### Location: `src/shared/hooks/`

```typescript
import { useDebounce, useMediaQuery, useClickOutside, ... } from '@/shared/hooks'
```

### Debounce
```typescript
// Debounce value
const debouncedSearch = useDebounce(searchTerm, 500)

// Debounce callback
const debouncedFetch = useDebouncedCallback((query) => fetchData(query), 300)
```

### Media Query
```typescript
const isMobile = useMediaQuery('(max-width: 768px)')
const { sm, md, lg, xl, isMobile, isTablet, isDesktop } = useBreakpoints()
const colorScheme = usePreferredColorScheme() // 'dark' | 'light'
const reducedMotion = usePrefersReducedMotion()
```

### Click Outside
```typescript
const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false))
return <div ref={ref}>...</div>

// Multiple refs
useClickOutsideMultiple<HTMLDivElement>([ref1, ref2], () => setIsOpen(false))
```

### Escape Key
```typescript
useEscapeKey(() => setIsOpen(false), { enabled: isOpen })

// With confirmation
useEscapeKey(handleClose, { requireConfirmation: true, confirmMessage: 'Discard changes?' })

// Multiple keyboard shortcuts
useKeyboardShortcuts({
  'ctrl+s': (e) => { e.preventDefault(); save() },
  'escape': () => close(),
})
```

### Form Dirty
```typescript
const isDirty = useFormDirty(formData, initialData)

const { isDirty, resetDirty, markClean } = useFormDirtyWithReset(formData, initialData)
```

### Local Storage
```typescript
const [value, setValue, removeValue] = useLocalStorage<Theme>('theme', 'light')
// Includes cross-tab sync
```

### Clipboard
```typescript
const { copy, copied, error, reset } = useClipboard({ timeout: 2000 })
await copy('text to copy')
if (copied) { /* show success */ }
```

### Pagination
```typescript
const {
  page, pageSize, total, totalPages,
  setPage, setPageSize, setTotal,
  nextPage, prevPage, firstPage, lastPage,
  canNextPage, canPrevPage,
  startIndex, endIndex, pageRange
} = usePagination({ initialPage: 1, initialPageSize: 10 })

// Helper for API params
const params = getPaginationParams(pagination) // { skip, take, page, limit }
```

### URL State
```typescript
// Multiple URL params
const [filters, setFilters] = useUrlState({ status: 'all', page: 1 })
setFilters({ status: 'active' }) // Updates URL

// Single URL param
const [page, setPage] = useUrlParam('page', 1)
```

### Offline
```typescript
const { online, since, downlink, effectiveType } = useOffline()
const isOnline = useOnlineStatus() // Simple boolean
const isSlow = useSlowConnection()
```

---

## Utilities

### Class Merging
```typescript
import { cn } from '@/shared/utils'

cn('base-class', isActive && 'active-class', className)
// Uses clsx + tailwind-merge
```

### Error Handling
```typescript
import { handleError, withErrorHandling } from '@/shared/utils'

// In catch block
try { ... } catch (error) { handleError(error) }

// Wrapper
const safeFunction = withErrorHandling(async () => { ... })
```

### Export Functions
```typescript
import { exportToExcel, exportToCSV } from '@/shared/utils'

exportToExcel(data, 'filename.xlsx', { sheetName: 'Sheet1' })
exportToCSV(data, 'filename.csv')
```

### Document Generation
```typescript
import { generateInvoice, generateReceipt, generateReport } from '@/shared/utils'

await generateInvoice(invoiceData)
await generateReceipt(donationData)
await generateReport(reportData)
```

---

## Providers & Context

### AuthProvider
```typescript
// src/app/providers/AuthProvider.tsx
import { useAuth } from '@/app/providers/AuthProvider'

const { user, session, isLoading, signIn, signOut, signUp } = useAuth()
```

### OrganizationProvider
```typescript
// src/app/providers/OrganizationProvider.tsx
import { useOrganization } from '@/hooks/useOrganization'

const { currentOrganizationId, organizationName, loading, refresh } = useOrganization()
```

### PermissionProvider
```typescript
// src/features/permissions/hooks/usePermissions.ts
import { usePermissions } from '@/features/permissions/hooks'

const { role, memberId, permissions, isAdmin, isPlatformAdmin, hasPermission } = usePermissions()

// Check permission
if (hasPermission('members:edit')) { ... }
```

### ThemeProvider
```typescript
// src/app/providers/ThemeProvider.tsx
import { useTheme } from '@/app/providers/ThemeProvider'

const { theme, setTheme, resolvedTheme } = useTheme()
// theme: 'light' | 'dark' | 'system'
```

---

## Common Patterns

### Creating a New Feature Hook
```typescript
// src/features/{feature}/hooks/use{Feature}.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { featureService } from '../services'

export const useFeature = ({ organizationId, filters }: { organizationId?: string; filters?: Filters }) => {
  const queryClient = useQueryClient()
  const orgId = organizationId || useOrganization().currentOrganizationId

  const query = useQuery({
    queryKey: ['feature', orgId, filters],
    queryFn: () => featureService.getAll(orgId!, filters),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateInput) => featureService.create(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature', orgId] })
    },
  })

  return {
    ...query,
    items: query.data ?? [],
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
```

### Creating a New Service
```typescript
// src/features/{feature}/services/{feature}.service.ts
import { supabase } from '@/lib/supabase/client'

export const featureService = {
  getAll: async (organizationId: string, filters?: Filters) => {
    let query = supabase
      .from('feature_table')
      .select('*')
      .eq('organization_id', organizationId)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  create: async (organizationId: string, input: CreateInput) => {
    const { data, error } = await supabase
      .from('feature_table')
      .insert({ ...input, organization_id: organizationId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ... other methods
}
```

### Using Permissions in Components
```typescript
import { usePermissions } from '@/features/permissions/hooks'

const MyComponent = () => {
  const { hasPermission, isAdmin } = usePermissions()

  if (!hasPermission('feature:view')) {
    return <AccessDenied />
  }

  return (
    <div>
      {hasPermission('feature:create') && <CreateButton />}
      {hasPermission('feature:edit') && <EditButton />}
      {(hasPermission('feature:delete') || isAdmin) && <DeleteButton />}
    </div>
  )
}
```

### Form with Zod Validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  amount: z.number().min(0, 'Amount must be positive'),
})

type FormData = z.infer<typeof schema>

const MyForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', amount: 0 },
  })

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... */}
    </form>
  )
}
```

### Invalidating Related Queries
```typescript
const queryClient = useQueryClient()

// After mutation success
onSuccess: (data, variables) => {
  // Invalidate list
  queryClient.invalidateQueries({ queryKey: ['members', orgId] })

  // Invalidate detail
  queryClient.invalidateQueries({ queryKey: ['members', 'detail', variables.id] })

  // Invalidate related (e.g., household members)
  if (variables.householdId) {
    queryClient.invalidateQueries({ queryKey: ['members', 'household', variables.householdId] })
  }

  // Invalidate stats
  queryClient.invalidateQueries({ queryKey: ['members', 'stats', orgId] })
}
```

---

## Quick Import Cheatsheet

```typescript
// Hooks from features
import { useMembers, useMember } from '@/features/members/hooks'
import { useDonations, useFunds, usePledges } from '@/features/donations/hooks'
import { usePermissions, usePermissionGroups } from '@/features/permissions/hooks'

// Services
import { membersService } from '@/features/members/services'
import { donationsService, pledgesService } from '@/features/donations/services'

// Types
import type { Member, MemberFilters } from '@/features/members/types'
import { DonationType, PaymentMethod, DonationStatus } from '@/features/donations/types'

// Shared
import { cn, handleError } from '@/shared/utils'
import { useDebounce, useMediaQuery, usePagination } from '@/shared/hooks'
import { LoadingSpinner, ConfirmModal } from '@/shared/components'

// Providers/Context
import { useAuth } from '@/app/providers/AuthProvider'
import { useOrganization } from '@/hooks/useOrganization'

// Supabase
import { supabase } from '@/lib/supabase/client'

// React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
```

---

**Last Updated**: February 2026
**Version**: 1.0.0
