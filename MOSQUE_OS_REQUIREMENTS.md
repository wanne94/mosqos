# Mosque-OS Requirements Specification v2.0

> Complete blueprint for the mosque management SaaS platform - CLEAN REBUILD
> This document is the single source of truth for all features and architecture.

---

## Table of Contents

1. [Core Architecture](#1-core-architecture)
2. [User Hierarchy & Roles](#2-user-hierarchy--roles)
3. [Permission System (AD-Style Groups)](#3-permission-system-ad-style-groups)
4. [Modules & Features](#4-modules--features)
5. [Workflow Patterns](#5-workflow-patterns)
6. [Performance Tracking (Staff KPIs)](#6-performance-tracking-staff-kpis)
7. [Country Configuration](#7-country-configuration)
8. [Database Schema](#8-database-schema)
9. [Technical Stack](#9-technical-stack)
10. [Future Features (Roadmap)](#10-future-features-roadmap)

---

## 1. Core Architecture

### Platform Hierarchy

```
Platform (SaaS Layer)
│
├── Platform Admins (manage the entire platform)
│   └── Approve/reject organization requests
│   └── Transfer ownership if owner leaves
│   └── Archive/delete organizations
│   └── Health dashboard (monitor org activity)
│
└── Organizations (mosques/centers - created via approval only)
      │
      ├── Owner (1 per org - account holder, billing)
      │
      └── People (everyone in the community)
            │
            ├── Has Login? → Can access Member Portal
            │
            └── Group Memberships → Permissions
```

### Key Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Controlled Growth** | Organizations are created by platform admin approval only |
| 2 | **People-First** | Everyone is a "Person" first. Login is optional. |
| 3 | **One Owner Per Org** | Owner is special - controls billing, cannot be removed (only transferred by platform admin) |
| 4 | **Groups Control Access** | AD-style groups with configurable permissions |
| 5 | **Workflow Everything** | All major actions follow staged workflows |
| 6 | **Track Everything** | Every action has `handled_by` for KPI tracking |
| 7 | **Audit Everything** | All changes logged for accountability |
| 8 | **Multi-Org Membership** | Members can belong to multiple orgs (same email) |
| 9 | **Zakat Compliance** | Strict separation of Zakat-eligible funds |

---

## 2. User Hierarchy & Roles

### Platform Level

| Role | Description | Access |
|------|-------------|--------|
| **Platform Admin (You)** | Owns the SaaS platform | All orgs, approvals, settings, ownership transfers, health dashboard |
| **Visitor** | Public user | Landing page, org request form |

### Organization Level

| Role | Description | Access |
|------|-------------|--------|
| **Owner** | Account holder (1 per org) | Everything + billing + settings |
| **Person** | Community member | Based on group membership |
| **Person (no login)** | Profile only (children, etc.) | No portal access |

### Account Types

```
┌─────────────────────────────────────────────────────────────────┐
│                         PEOPLE                                   │
├─────────────────────────────────────────────────────────────────┤
│  Type              │  Has Login?  │  Access                     │
├─────────────────────────────────────────────────────────────────┤
│  Child             │  No          │  Profile only               │
│  Student           │  No          │  Profile + enrollments      │
│  Adult Member      │  Yes         │  Member Portal              │
│  Teacher           │  Yes         │  Portal + Education         │
│  Admin Staff       │  Yes         │  Admin Panel (via groups)   │
│  Owner             │  Yes         │  Full Admin + Billing       │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Organization Membership

```
Ahmad (one auth account: ahmad@email.com)
│
├── Brooklyn Mosque
│   └── Role: Owner
│   └── Groups: (implicit full access)
│
├── Queens Islamic Center
│   └── Role: Member
│   └── Groups: [Finance Team, Members]
│
└── Manhattan Masjid
    └── Role: Member
    └── Groups: [Teachers, Members]

[Organization Switcher Dropdown in Header]
```

**How it works:**
- Same email = one auth account
- When invited to new org → auto-links to existing account
- Dropdown to switch active organization
- Owner of Org A can be Member of Org B

---

## 3. Permission System (AD-Style Groups)

### How It Works

1. **Owner** creates **Groups** (e.g., "Finance Team", "Teachers")
2. Each **Group** has **Permissions** (e.g., canViewDonations, canEditMembers)
3. **People** are assigned to **Groups**
4. Person's effective permissions = union of all their group permissions

### Default Groups (Every Org Starts With)

| Group | Description | Default Permissions |
|-------|-------------|---------------------|
| **Administrators** | Full admin access | All except billing |
| **Teachers** | Education staff | Education module (view/edit) |
| **Finance Team** | Money handlers | Donations, expenses, funds, reports |
| **Case Workers** | Social services | Cases module (view/edit) |
| **Members** | Basic portal access | Member portal, view own data |
| **Students** | Enrolled students | View own education data |

**Owner can:**
- Create custom groups
- Rename default groups
- Configure permissions per group
- Delete groups (except cannot remove self from Owner)

### Permission Categories

```
PEOPLE
├── people.view
├── people.create
├── people.edit
├── people.delete
├── people.merge
├── people.manage_groups

EDUCATION
├── education.view
├── education.create
├── education.edit
├── education.delete
├── education.manage_enrollments
├── education.record_attendance
├── education.record_grades

DONATIONS
├── donations.view
├── donations.create
├── donations.edit
├── donations.delete
├── donations.view_reports
├── donations.import_bank

PLEDGES
├── pledges.view
├── pledges.create
├── pledges.edit
├── pledges.delete

EXPENSES
├── expenses.view
├── expenses.create
├── expenses.edit
├── expenses.delete
├── expenses.import_bank

CASES
├── cases.view
├── cases.create
├── cases.edit
├── cases.review
├── cases.approve

UMRAH
├── umrah.view
├── umrah.create
├── umrah.edit
├── umrah.manage_visas

QURBANI
├── qurbani.view
├── qurbani.create
├── qurbani.edit
├── qurbani.manage_distribution

EVENTS
├── events.view
├── events.create
├── events.edit
├── events.delete

SERVICES (Janazah, Nikah, Revert)
├── services.view
├── services.create
├── services.edit
├── services.delete

FUNDS
├── funds.view
├── funds.create
├── funds.edit
├── funds.manage_transfers

REPORTS
├── reports.view_financial
├── reports.view_education
├── reports.view_cases
├── reports.view_kpis
├── reports.view_audit_log
├── reports.export
├── reports.generate_tax_receipts

COMMUNICATIONS
├── communications.send_email
├── communications.send_sms
├── communications.manage_templates

SETTINGS
├── settings.view
├── settings.edit
├── settings.manage_groups
├── settings.export_data
```

---

## 4. Modules & Features

### 4.1 Platform Admin Module

**Organization Requests**
```
Visitor clicks "Request Organization" on landing page
    ↓
Fills form: org name, contact info, reason
    ↓
Platform Admin reviews request
    ↓
Approved → Owner invitation email sent
Rejected → Rejection email with reason
```

**Platform Admin Features:**
- Dashboard with platform metrics
- **Health Dashboard** - see which orgs are active, struggling, churn risk
- Organization list (all orgs)
- Approve/reject org requests
- View org details
- **Transfer organization ownership** (if owner leaves)
- **Archive/delete organization** (with data export first)
- Manage subscriptions
- Manage plans and pricing
- Manage discount codes
- Platform settings
- View platform-wide audit log
- **Error tracking dashboard** (Sentry integration)
- **Database backup status**

---

### 4.2 Organization Management

**Features:**
- Organization profile (name, logo, description)
- Organization settings
- **Fiscal year setting** (January start or custom month)
- **Tax ID field** (optional - EIN, Vergi No, etc. based on country)
- Billing & subscription (Owner only)
- Group management (create, edit, delete groups)
- Permission configuration per group
- **Data export** (export all org data as ZIP)
- **Setup wizard** (guided onboarding for new orgs)

**Setup Wizard Steps:**
1. Organization profile (name, logo, contact)
2. Select country (loads country-specific settings)
3. Create first fund (e.g., "General Fund")
4. Invite first team member
5. Quick tour of features
6. Done → Dashboard

**Welcome Email Sequence:**
- Day 1: Welcome email with getting started guide
- Day 3: Tips email with key features
- Day 7: Check-in email asking if they need help

---

### 4.3 People Management

**Core Concept:** Everyone is a PERSON first. Login is optional.

**Features:**
- People directory with search/filter
- Create person (with or without login)
- Edit person profile
- Assign to groups
- Household/family grouping
- Bulk import via Excel
- Profile card view
- Archive/restore person
- **Merge duplicate people** (combine two records into one)
- Communication history

**Person Profile Fields:**
```
Basic Info
├── First name, Last name (required)
├── Date of birth
├── Gender
├── Photo

Contact
├── Email (optional - required for login)
├── Phone
├── Address (street, city, state, zip, country)

Emergency Contact
├── Name
├── Phone
├── Relationship

Metadata
├── Has login account (boolean)
├── Groups (many)
├── Household (optional)
├── Notes
├── Created date
├── Status (active/archived)
```

**Merge Duplicate People:**
```
Select Person A + Person B
    ↓
Preview merged data (choose which fields to keep)
    ↓
Confirm merge
    ↓
All records (donations, enrollments, cases) transfer to merged person
Person B archived with note "Merged into Person A"
```

**Workflow: Person Status**
```
Active ↔ Archived
```

---

### 4.4 Education Module

**Features:**
- Course management
- Classroom management
- Teacher assignment
- Schedule management (weekly grid)
- Student enrollment
- **Student attendance tracking**
- **Teacher attendance tracking**
- Grade tracking (per student per class)
- Student notes
- Tuition billing

**Attendance:**
- Per class date, mark each student: Present / Absent / Excused
- Per class date, mark teacher: Present / Absent / Substitute (link substitute teacher)
- Teacher attendance feeds into KPI reports

**Workflow: Enrollment**
```
Pending → Active → Completed
               ↘ Withdrawn
```

**Workflow: Tuition Payment**
```
Billed → Paid
      ↘ Overdue → Paid
```

---

### 4.5 Donations Module

**Features:**
- Record one-time donations
- Recurring donations (Stripe/iyzico based on country)
- **Zakat vs Sadaqah distinction** (see below)
- **Pledges** (promised donations - see 4.6)
- Fund assignment
- Donor history
- Invoice generation (PDF)
- **Tax receipts / Year-end statements** (PDF)
- **Bank statement import** (CSV)
- Track `handled_by` for KPIs

**Zakat vs Sadaqah:**
```
When donating:
┌─────────────────────────────────────┐
│ Is this Zakat?                      │
│ ○ No (Sadaqah - voluntary)          │
│ ● Yes (Zakat - obligatory)          │
│                                     │
│ Select Fund:                        │
│ [Only Zakat-eligible funds shown]   │
│ ├── Zakat Fund                      │
│ └── Student Aid Fund                │
└─────────────────────────────────────┘

Fund settings:
├── "General Fund" → Zakat Eligible: ❌
├── "Building Fund" → Zakat Eligible: ❌
├── "Zakat Fund" → Zakat Eligible: ✅
└── "Student Aid" → Zakat Eligible: ✅
```

**Tax Receipts:**
- Generate per donation (single receipt)
- Generate year-end statement (all donations for fiscal year)
- Includes: Org info, donor info, donation details
- Tax ID shown if org has entered it (optional)
- PDF download

**Bank Statement Import:**
```
Step 1: Upload CSV from bank
    ↓
Step 2: System parses transactions (date, description, amount, in/out)
    ↓
Step 3: User categorizes each row:
    - IN (money received) → Donation → Select fund, pick person from directory
    - OUT (money spent) → Expense → Select fund, select category
    - Skip (internal transfers, etc.)
    ↓
Step 4: System suggests based on previous patterns (user confirms)
    ↓
Step 5: Confirm & Import → Creates donation/expense records
    ↓
Statement saved for audit trail
```

**Workflow: Donation**
```
Pending → Confirmed → [Funds Updated]
       ↘ Cancelled
```

---

### 4.6 Pledges Module

**What is a Pledge?**
A promise to donate that hasn't been fulfilled yet. Common: "I pledge $100/month for the building fund."

**Features:**
- Create pledge (person, amount, frequency, fund, start date, end date)
- Track pledge fulfillment (how much of pledge has been donated)
- Pledge reminders (optional email/SMS)
- Pledge status: Active, Fulfilled, Cancelled, Overdue
- Link donations to pledges

**Pledge Fields:**
- Person
- Amount (per period)
- Frequency: One-time, Weekly, Monthly, Yearly
- Fund
- Start date
- End date (optional - ongoing if blank)
- Notes

**Workflow: Pledge**
```
Active → Fulfilled (when total donated >= total pledged)
      ↘ Cancelled
      ↘ Overdue (if expected donations not received)
```

---

### 4.7 Expenses Module

**Features:**
- Record expenses
- Category assignment
- Fund deduction
- **Bank statement import** (CSV - same as donations)
- Receipt upload (image/PDF)
- Track `handled_by` for KPIs

**Workflow: Expense**
```
Power user logs expense → Approved (immediate)
```

---

### 4.8 Cases Module (ServiceNow-style)

**Features:**
- Create cases for community members
- Case categories: Food, Housing, Medical, Financial, Education, Legal, Employment, Other
- Priority levels: Low, Normal, High, Emergency
- Case assignment
- Threaded notes
- File attachments
- Case history
- Track `handled_by` for KPIs

**Workflow: Case**
```
Created → In Review → Approved → Closed
                   ↘ Rejected → Closed
```

**Rules:**
- **Approved** = funds affected (if money spent)
- **No backward movement** after Approved/Rejected
- Corrections handled via platform support ticket

---

### 4.9 Umrah Module

**Features:**
- Create trips (name, dates, cost per person)
- Pilgrim registration
- Visa status tracking
- Payment tracking
- Track `handled_by` for KPIs

**Workflow: Umrah Registration**
```
Registered → Visa Pending → Visa Approved → Trip Completed
                        ↘ Visa Rejected → Closed
```

---

### 4.10 Qurbani Module

**Features:**
- Create Qurbani campaigns (year/event)
- Register participants
- Payment tracking (person + amount)
- Distribution tracking
- Track `handled_by` for KPIs

**Workflow: Qurbani Registration**
```
Registered → Paid → Distributed → Completed
         ↘ Cancelled
```

---

### 4.11 Events & Calendar Module

**Features:**
- Create events (Jummah, Eid, community gatherings, classes, meetings)
- Event types: Prayer, Class, Meeting, Community, Fundraiser, Iftar, Taraweeh, Other
- Recurring events (weekly Jummah, daily prayers, etc.)
- **Islamic (Hijri) calendar** - show both Gregorian and Hijri dates
- Event details: Title, description, date/time, location, capacity
- RSVP tracking (optional)
- Event reminders (email/SMS)
- Calendar view (month/week/day)
- Public events (visible on public page) vs. Private events (members only)

**Hijri Calendar:**
- All events show both dates: "Friday, March 15, 2026 (15 Ramadan 1447)"
- Islamic holidays auto-highlighted
- Ramadan, Eid al-Fitr, Eid al-Adha, Dhul Hijjah marked

---

### 4.12 Ramadan Mode

**Special features activated during Ramadan:**

| Feature | Description |
|---------|-------------|
| **Iftar Signups** | Track who's bringing food, how many attending |
| **Taraweeh Schedule** | Which imam/qari, what juz being recited |
| **Zakat Calculator** | Help members calculate their Zakat |
| **Donation Reminders** | Increased prompts for Sadaqah/Zakat |
| **Ramadan Dashboard** | Special dashboard with Ramadan-specific metrics |
| **Last 10 Nights** | Special tracking for Laylatul Qadr programs |

**Activation:**
- Auto-activates based on Hijri calendar
- Or manual toggle in settings

---

### 4.13 Islamic Services Module

#### Janazah (Funeral) Services

**Features:**
- Track funeral requests
- Deceased information
- Family contact
- Logistics: Ghusl location, prayer time, burial location
- Assign volunteers/staff
- Status tracking

**Workflow:**
```
Requested → Scheduled → Completed
```

#### Nikah (Marriage) Services

**Features:**
- Track marriage requests
- Bride & groom information
- Required documents checklist
- Officiant assignment
- Ceremony date/location
- Marriage certificate generation

**Workflow:**
```
Requested → Documents Pending → Scheduled → Completed
```

#### New Muslim / Revert Support

**Features:**
- Track shahada declarations
- Date, witnesses, certificate
- Assign mentor
- Follow-up program (check-ins at 1 week, 1 month, 3 months, 6 months)
- Resource sharing (books, classes)
- Progress notes

**Workflow:**
```
Shahada Declared → Mentor Assigned → In Program → Completed
```

---

### 4.14 Funds Module

**Features:**
- Create/manage funds (General, Zakat, Education, Qurbani, Building, etc.)
- **Zakat-eligible flag** on each fund
- Fund balances (auto-calculated)
- Fund transfers
- Fund reports

**Balance Calculation:**
```
Fund Balance = Sum(Donations to fund)
             - Sum(Expenses from fund)
             - Sum(Case disbursements from fund)
```

---

### 4.15 Reports & Analytics

**Financial Reports:**
- Income vs Expenses (by period, respects fiscal year setting)
- Fund balances
- Donation summary (with Zakat vs Sadaqah breakdown)
- Expense summary
- Pledge fulfillment report
- **Tax receipt generation** (individual or batch)
- **Year-end donor statements**

**Education Reports:**
- Enrollment statistics
- Student attendance reports
- **Teacher attendance reports**
- Tuition collection status

**Case Reports:**
- Cases by status
- Cases by category
- Resolution times

**Islamic Services Reports:**
- Janazah services performed
- Nikah services performed
- New Muslim support stats

**Staff KPI Reports:** (see Section 6)

**Audit Log Reports:**
- All actions by date range
- Actions by user
- Actions by type

---

### 4.16 Audit Log

**What's Logged:**
Every significant action is recorded with:
- Who (person_id)
- What (action type)
- When (timestamp)
- Details (what changed)
- IP address

**Action Types:**
- Authentication: login, logout, password_reset
- People: created, updated, archived, merged, group_changed
- Donations: created, updated, deleted, imported
- Expenses: created, updated, deleted, imported
- Cases: created, status_changed, assigned, note_added
- Education: enrollment_created, attendance_recorded, grade_entered
- Settings: updated, group_created, permission_changed
- Organization: settings_updated, data_exported

**Access:**
- Owner can view org audit log
- Platform admin can view all audit logs

---

### 4.17 Member Portal

**Features:**
- Personal dashboard
- View/edit own profile
- View own donations (with Zakat/Sadaqah labels)
- View own pledges
- View own enrollments
- View children's education (if parent)
- Submit cases
- View case status
- View upcoming events (with Hijri dates)
- Make donations (Stripe/iyzico)
- **Organization switcher** (if multi-org member)
- **Zakat calculator**

---

### 4.18 Communication Module

**Email:**
- Send emails to individuals
- Send emails to groups
- Send bulk emails
- Email templates
- Email history

**SMS:**
- Send SMS to individuals
- Send SMS to groups
- Send bulk SMS
- SMS templates
- SMS history
- Provider: Twilio (US, Germany) / Netgsm (Turkey)

**Features:**
- Track delivery status
- Schedule send (send later)
- Communication history per person

---

### 4.19 Notifications System

**In-App Notifications:**
- Bell icon with unread count
- Notification list (mark as read)
- Click to navigate to relevant item

**Email Notifications (configurable per user):**
- Case status updates
- Payment reminders (tuition, pledges)
- Event reminders
- New announcements

**SMS Notifications (configurable per user):**
- Urgent case updates
- Event reminders (day before)
- Ramadan reminders

**Notification Triggers:**
- Case assigned to you
- Case status changed
- Tuition payment due
- Pledge reminder
- Event reminder (24h before)
- New announcement posted

---

### 4.20 Announcements Module

**Features:**
- Create announcements (title, body, date)
- Pin important announcements
- Target: All members, specific groups, or specific people
- Show on member portal dashboard
- Optional email/SMS notification

---

### 4.21 Feedback System

**Features:**
- "Send Feedback" button in footer (always visible)
- Simple form: Type (bug, feature request, question), message
- Goes to platform admin
- Optional screenshot attachment
- Track feedback status: New, Reviewed, Implemented, Closed

---

### 4.22 In-App Help

**Features:**
- **Help tooltips** on first visit to each page
- "?" icon next to complex features
- Tooltips explain what things do
- "Don't show again" option
- Help center link

---

### 4.23 Billing & Subscriptions

**Platform Billing (Orgs pay you):**
- Always via Stripe (USD)
- Subscription plans
- Trial management
- Invoice history
- Feature gating by plan

**Donation Collection (Members pay org):**
- Country-specific provider (see Section 7)
- US/Germany: Stripe
- Turkey: iyzico

---

### 4.24 Internationalization

**Supported Languages:**
- English (default)
- Turkish

**Localization:**
- Date formats per locale
- Currency formats per country
- Number formats per locale
- Islamic (Hijri) date display

---

## 5. Workflow Patterns

All major entities follow staged workflows. **No backward movement** after terminal states.

| Entity | Workflow | Terminal States |
|--------|----------|-----------------|
| Org Request | Submitted → Under Review → Approved/Rejected | Approved, Rejected |
| Organization | Active → Archived | Archived |
| Person | Active ↔ Archived | (reversible) |
| Enrollment | Pending → Active → Completed/Withdrawn | Completed, Withdrawn |
| Donation | Pending → Confirmed/Cancelled | Confirmed, Cancelled |
| Pledge | Active → Fulfilled/Cancelled/Overdue | Fulfilled, Cancelled |
| Expense | Created → Approved (immediate) | Approved |
| Case | Created → In Review → Approved/Rejected → Closed | Closed |
| Umrah Reg | Registered → Visa Pending → Approved/Rejected → Completed | Completed, Closed |
| Qurbani | Registered → Paid → Distributed → Completed | Completed, Cancelled |
| Tuition | Billed → Paid/Overdue | Paid |
| Event | Draft → Published → Completed/Cancelled | Completed, Cancelled |
| Janazah | Requested → Scheduled → Completed | Completed |
| Nikah | Requested → Documents Pending → Scheduled → Completed | Completed |
| Revert Support | Declared → Mentor Assigned → In Program → Completed | Completed |

---

## 6. Performance Tracking (Staff KPIs)

Every trackable action has a `handled_by` field linking to the person who performed it.

### Tracked Actions

| Action | Field | Table |
|--------|-------|-------|
| Donation recorded | `handled_by` | donations |
| Expense logged | `handled_by` | expenses |
| Case created | `created_by` | cases |
| Case managed | `assigned_to` | cases |
| Umrah registration | `handled_by` | umrah_registrations |
| Qurbani registration | `handled_by` | qurbani_registrations |
| Student attendance recorded | `recorded_by` | student_attendance |
| Teacher attendance recorded | `recorded_by` | teacher_attendance |
| Grade entered | `entered_by` | grades |
| Enrollment created | `created_by` | enrollments |
| Event created | `created_by` | events |
| Janazah handled | `handled_by` | janazah_services |
| Nikah handled | `handled_by` | nikah_services |
| Revert mentored | `mentor_id` | revert_support |

### Year-End KPI Report Example

```
Ahmad's Performance (2026)
├── Donations facilitated: $45,000 (123 transactions)
├── Zakat collected: $12,000
├── Expenses processed: $8,000 (45 transactions)
├── Umrah pilgrims registered: 34
├── Qurbani shares handled: 89
├── Cases resolved: 27
├── Classes taught: 156 sessions
├── Teacher attendance: 98% (152/156)
├── Student attendance records: 2,340
├── Janazah services: 5
├── Nikah services: 12
├── Reverts mentored: 3
└── Overall contribution score: 92/100
```

---

## 7. Country Configuration

### Supported Countries (v1)

| Config | United States | Turkey | Germany |
|--------|---------------|--------|---------|
| **Currency** | USD | TRY | EUR |
| **Platform Billing** | Stripe | Stripe | Stripe |
| **Donation Provider** | Stripe | iyzico | Stripe |
| **SMS Provider** | Twilio | Netgsm | Twilio |
| **Tax ID Label** | EIN (optional) | Vergi No (optional) | Steuernummer (optional) |
| **Data Privacy** | Standard | KVKK | GDPR |

### How It Works

```
Org Setup Wizard → Select Country: Turkey
    ↓
System auto-configures:
├── Donation payments via iyzico (TRY)
├── SMS via Netgsm
├── Tax ID field labeled "Vergi No" (optional)
├── KVKK compliance notices
```

**Platform Admin can add more countries** from platform settings without code changes.

---

## 8. Database Schema

### Core Tables

```sql
-- Platform
platform_admins (user_id, created_at)
organization_requests (id, name, contact_email, contact_phone, reason, status, reviewed_by, reviewed_at, created_at)
platform_feedback (id, user_id, type, message, screenshot_url, status, created_at)

-- Organizations
organizations (id, name, slug, type, country, email, phone, address, city, state, zip, logo_url, tax_id, fiscal_year_start_month, status, created_at, archived_at)
organization_settings (organization_id, settings_jsonb, ramadan_mode_enabled)

-- Countries
countries (id, code, name, currency, donation_provider, sms_provider, tax_id_label, data_privacy_type, is_active)

-- Auth & People
people (id, organization_id, user_id, first_name, last_name, email, phone, date_of_birth, gender, photo_url, address, city, state, zip, country, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, has_login, is_owner, status, merged_into_id, created_at)
people_organizations (id, person_id, organization_id, is_owner, created_at)
households (id, organization_id, name, address, city, state, zip, country, primary_contact_id)
people_households (person_id, household_id)

-- Groups & Permissions (AD-style)
groups (id, organization_id, name, description, is_default, created_at)
group_permissions (id, group_id, permission_key)
people_groups (person_id, group_id, assigned_at, assigned_by)

-- Audit Log
audit_logs (id, organization_id, person_id, action_type, entity_type, entity_id, details_jsonb, ip_address, created_at)
```

### Feature Tables

```sql
-- Education
courses (id, organization_id, name, description, created_at)
classrooms (id, organization_id, name, capacity, location, description, created_at)
scheduled_classes (id, classroom_id, course_id, teacher_id, start_date, end_date, schedule_jsonb, created_at)
enrollments (id, scheduled_class_id, person_id, status, monthly_fee, enrolled_at, created_by)
student_attendance (id, enrollment_id, class_date, status, notes, recorded_by, created_at)
teacher_attendance (id, scheduled_class_id, class_date, teacher_id, status, substitute_id, notes, recorded_by, created_at)
grades (id, enrollment_id, grade_type, score, notes, entered_by, created_at)
student_notes (id, enrollment_id, notes, created_by, created_at)
tuition_payments (id, enrollment_id, month, amount_due, amount_paid, payment_date, created_at)

-- Financial
funds (id, organization_id, name, description, is_zakat_eligible, created_at)
donations (id, organization_id, person_id, fund_id, pledge_id, amount, is_zakat, donation_date, payment_method, payment_provider_id, notes, status, handled_by, imported_from_statement_id, created_at)
pledges (id, organization_id, person_id, fund_id, amount, frequency, start_date, end_date, status, notes, created_at)
recurring_donations (id, organization_id, person_id, fund_id, amount, frequency, provider_subscription_id, active, created_at)
expenses (id, organization_id, fund_id, amount, expense_date, category, description, receipt_url, handled_by, imported_from_statement_id, created_at)
bank_statement_imports (id, organization_id, file_name, file_url, imported_at, imported_by)

-- Cases
cases (id, organization_id, person_id, case_date, case_type, priority, status, description, fund_id, disbursement_amount, assigned_to, created_by, created_at, updated_at)
case_notes (id, case_id, note, created_by, created_at)
case_attachments (id, case_id, file_url, file_name, file_type, file_size, uploaded_by, created_at)

-- Umrah
umrah_trips (id, organization_id, name, start_date, end_date, cost_per_person, description, status, created_at)
umrah_registrations (id, trip_id, person_id, passport_info_jsonb, visa_status, payment_status, amount_paid, handled_by, created_at)

-- Qurbani
qurbani_campaigns (id, organization_id, name, year, start_date, end_date, description, status, created_at)
qurbani_registrations (id, campaign_id, person_id, amount_paid, distribution_status, handled_by, notes, created_at)

-- Events & Calendar
events (id, organization_id, title, description, event_type, start_datetime, end_datetime, hijri_date, location, capacity, is_recurring, recurrence_rule, is_public, rsvp_enabled, status, created_by, created_at)
event_rsvps (id, event_id, person_id, status, created_at)

-- Ramadan
iftar_signups (id, organization_id, event_id, person_id, guests_count, bringing_food, food_description, created_at)
taraweeh_schedule (id, organization_id, date, imam_id, qari_id, juz_number, notes, created_at)

-- Islamic Services
janazah_services (id, organization_id, deceased_name, deceased_info_jsonb, family_contact_id, ghusl_location, prayer_datetime, burial_location, status, handled_by, notes, created_at)
nikah_services (id, organization_id, bride_id, groom_id, documents_jsonb, officiant_id, ceremony_datetime, ceremony_location, status, handled_by, notes, created_at)
revert_support (id, organization_id, person_id, shahada_date, witnesses, mentor_id, status, follow_up_dates_jsonb, notes, created_at)

-- Communication
communication_templates (id, organization_id, name, type, subject, body, created_at)
communication_logs (id, organization_id, recipient_id, type, subject, body, status, scheduled_at, sent_at, created_at)
announcements (id, organization_id, title, body, is_pinned, target_type, target_ids, created_by, created_at)
notifications (id, person_id, type, title, body, entity_type, entity_id, is_read, created_at)

-- Billing
subscription_plans (id, name, member_limit, storage_limit_gb, features_jsonb, created_at)
plan_pricing (id, plan_id, country_id, monthly_price, yearly_price)
organization_subscriptions (id, organization_id, plan_id, status, stripe_subscription_id, trial_ends_at, current_period_end, created_at)
discount_codes (id, code, discount_type, discount_value, usage_limit, times_used, expires_at, active, created_at)

-- Tax Documents
tax_receipts (id, organization_id, person_id, fiscal_year, type, donations_jsonb, total_amount, zakat_amount, sadaqah_amount, generated_at, file_url)

-- Help System
help_tooltips_dismissed (id, person_id, tooltip_key, dismissed_at)
```

---

## 9. Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 |
| State | React Context + Custom Hooks |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe, iyzico |
| SMS | Twilio, Netgsm |
| Charts | Recharts |
| Export | XLSX, jsPDF |
| i18n | i18next |
| Hijri Calendar | moment-hijri or hijri-js |
| Error Tracking | Sentry |
| Hosting | Vercel |
| Database Backups | Supabase automated + manual exports |

### Project Structure (Clean Architecture)

```
src/
├── services/           # All Supabase calls (one file per domain)
│   ├── auth.js
│   ├── organizations.js
│   ├── people.js
│   ├── education.js
│   ├── donations.js
│   ├── pledges.js
│   ├── expenses.js
│   ├── cases.js
│   ├── umrah.js
│   ├── qurbani.js
│   ├── events.js
│   ├── islamicServices.js
│   ├── funds.js
│   ├── audit.js
│   ├── notifications.js
│   ├── communications.js
│   └── feedback.js
│
├── hooks/              # Reusable React hooks
│   ├── useAuth.js
│   ├── useOrganization.js
│   ├── usePermissions.js
│   ├── usePeople.js
│   ├── useHijriDate.js
│   ├── useAuditLog.js
│   └── ...
│
├── components/
│   ├── common/         # Buttons, inputs, modals, tables, tooltips
│   ├── layouts/        # AdminLayout, MemberLayout, PublicLayout, PlatformLayout
│   └── features/       # Feature-specific components (by module)
│       ├── people/
│       ├── education/
│       ├── donations/
│       ├── events/
│       ├── islamicServices/
│       └── ...
│
├── pages/              # One file per route, thin (use components)
│   ├── public/
│   ├── admin/
│   ├── member/
│   └── platform/
│
├── contexts/           # Only 2-3 global contexts
│   ├── AuthContext.jsx
│   ├── OrganizationContext.jsx
│   └── NotificationContext.jsx
│
├── utils/              # Pure helper functions
│   ├── formatting.js
│   ├── validation.js
│   ├── hijriCalendar.js
│   ├── zakatCalculator.js
│   ├── export.js
│   └── bankStatementParser.js
│
├── constants/          # App constants
│   ├── permissions.js
│   ├── statuses.js
│   ├── categories.js
│   └── countries.js
│
└── i18n/               # Translations
    ├── en.json
    └── tr.json
```

---

## 10. Future Features (Roadmap)

### v1.1 - Nice to Have (Consider Soon)

| Feature | Description |
|---------|-------------|
| **Waiting List** | For popular classes - student can't enroll, goes on waiting list |
| **Certificates** | Completion certificates for courses (PDF generation) |
| **Document Storage** | Upload important docs per person (ID, passport copies, etc.) |
| **Room/Space Booking** | Reserve rooms for events, meetings |
| **Refunds** | Handle donation refunds, expense corrections |
| **Scheduled Messages** | "Send this email next Friday at 10am" |

### v2.0 - Future Enhancements

| Feature | Description |
|---------|-------------|
| **2FA / MFA** | Extra security for admins |
| **Volunteers Management** | Track volunteer hours, assignments |
| **Assets / Inventory** | Track prayer mats, Qurans, equipment |
| **Prayer Times Integration** | Auto-display prayer times from API |
| **Mobile App** | Native iOS/Android (same backend) |
| **API Access** | For enterprise orgs to integrate |
| **Custom Report Builder** | Drag-and-drop report creation |
| **Dashboard Customization** | Widgets, layout customization |
| **Scheduled Report Emails** | "Send me finance summary every Monday" |
| **Arabic Language** | Full Arabic translation + RTL |

---

## Summary

This is a **complete rebuild** from scratch with:

**Core:**
1. Controlled org creation (platform admin approval)
2. People-first data model (everyone is a person, login optional)
3. AD-style groups (flexible, configurable permissions)
4. Workflow everything (staged statuses, no backward after terminal)
5. KPI tracking (handled_by on all actions)
6. Audit log (who did what, when)
7. Multi-org membership (same email, org switcher)

**Financial:**
8. Bank statement import (CSV → categorize → create records)
9. Pledges (promised donations tracking)
10. Zakat vs Sadaqah distinction (fund-level, Quran-compliant)
11. Tax receipts (individual + year-end statements)

**Islamic:**
12. Hijri calendar (show both dates everywhere)
13. Ramadan mode (iftar, taraweeh, Zakat calculator)
14. Janazah services (funeral coordination)
15. Nikah services (marriage coordination)
16. New Muslim/Revert support (shahada, mentorship, follow-up)

**Operations:**
17. Events/Calendar (with Hijri dates)
18. Teacher + student attendance (both tracked)
19. Email + SMS sending (country-specific providers)
20. Setup wizard (guided onboarding)
21. Welcome email sequence (Day 1, 3, 7)

**Platform:**
22. Health dashboard (monitor org activity, churn risk)
23. Error tracking (Sentry)
24. Database backups (automated)
25. Feedback system (in-app)
26. In-app help tooltips

**Technical:**
27. Country configuration (US, Turkey, Germany)
28. Clean architecture (services, hooks, components)
29. English + Turkish languages

---

*Document Version: 2.0*
*Created: 2026-01-26*
*Status: Ready for Implementation*
