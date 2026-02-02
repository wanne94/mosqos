# End-to-End Workflow Tests

E2E testovi koji pokrivaju kompleksne korisničke workflow-e kroz cijelu aplikaciju.

## Status

⚠️ **Template testovi kreirani** - Potrebno je implementirati sa Playwright ili Cypress.

## Test Suites

### 🔐 Platform Admin Workflow
**File**: `platform-admin-workflow.test.ts`

**Coverage**:
- ✅ Organization approval/rejection flow
- ✅ User management
- ✅ Analytics dashboard
- ✅ Cross-organization access

**Key Scenarios**: 27 test cases defined

### 🏢 Organization Admin Workflow
**File**: `organization-admin-workflow.test.ts`

**Coverage**:
- ✅ Member management (CRUD)
- ✅ Donation management (one-time, recurring, pledges)
- ✅ Education module (classrooms, classes, attendance, grades)
- ✅ Cases module (create, assign, track, close)
- ✅ Permission groups (create, assign members)
- ✅ Cross-tenant isolation verification

**Key Scenarios**: 38 test cases defined

### 👤 Member Portal Workflow
**File**: `member-portal-workflow.test.ts`

**Coverage**:
- ✅ Profile management
- ✅ Donation history & recurring management
- ✅ Service requests (cases)
- ✅ Security boundaries (no admin access, no cross-org access)

**Key Scenarios**: 15 test cases defined

## Implementation Guide

### Option 1: Playwright (Recommended)

```bash
npm install -D @playwright/test
npx playwright install
```

**Example test structure**:
```typescript
import { test, expect } from '@playwright/test'

test('platform admin can approve organization', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login')
  await page.fill('[name="email"]', 'admin@platform.com')
  await page.fill('[name="password"]', 'test123')
  await page.click('button[type="submit"]')

  // Navigate to organizations
  await page.goto('http://localhost:5173/platform/organizations')
  
  // Approve first pending org
  await page.click('button:has-text("Approve"):first')
  
  // Assert success
  await expect(page.locator('.toast-success')).toBeVisible()
})
```

### Option 2: Cypress

```bash
npm install -D cypress
npx cypress open
```

**Example test structure**:
```typescript
describe('Platform Admin Workflow', () => {
  it('can approve organization', () => {
    cy.visit('/login')
    cy.get('[name="email"]').type('admin@platform.com')
    cy.get('[name="password"]').type('test123')
    cy.get('button[type="submit"]').click()
    
    cy.visit('/platform/organizations')
    cy.contains('button', 'Approve').first().click()
    cy.contains('.toast-success', 'approved').should('be.visible')
  })
})
```

## Test Data Setup

### Database Seed Script

Create `tests/seed-test-data.ts`:

```typescript
import { supabase } from '@/lib/supabase/client'

export async function seedTestData() {
  // Create platform admin
  const { data: admin } = await supabase.auth.admin.createUser({
    email: 'admin@platform.com',
    password: 'test123',
  })

  await supabase.from('platform_admins').insert({
    user_id: admin.user.id,
  })

  // Create test organizations
  const { data: org1 } = await supabase.from('organizations').insert({
    name: 'Test Mosque 1',
    slug: 'test-mosque-1',
    status: 'pending',
  }).select().single()

  // Create org admin
  const { data: orgAdmin } = await supabase.auth.admin.createUser({
    email: 'admin@test-mosque-1.com',
    password: 'test123',
  })

  await supabase.from('organization_owners').insert({
    user_id: orgAdmin.user.id,
    organization_id: org1.id,
  })

  // Create member
  const { data: member } = await supabase.auth.admin.createUser({
    email: 'member@test-mosque-1.com',
    password: 'test123',
  })

  await supabase.from('members').insert({
    user_id: member.user.id,
    organization_id: org1.id,
    first_name: 'Test',
    last_name: 'Member',
  })

  // Seed donations, classes, cases, etc.
}
```

## Running E2E Tests

### Development Mode
```bash
# Start dev server
npm run dev

# Run Playwright tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test platform-admin-workflow
```

### CI/CD
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npx playwright install
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Environment Variables

Create `.env.test`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=test-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
TEST_PLATFORM_ADMIN_EMAIL=admin@platform.com
TEST_PLATFORM_ADMIN_PASSWORD=test123
TEST_ORG_ADMIN_EMAIL=admin@test-mosque-1.com
TEST_ORG_ADMIN_PASSWORD=test123
TEST_MEMBER_EMAIL=member@test-mosque-1.com
TEST_MEMBER_PASSWORD=test123
```

## Best Practices

1. **Use Page Objects** - Encapsulate page interactions
2. **Data Isolation** - Each test should create its own test data
3. **Cleanup** - Delete test data after each test
4. **Retry Logic** - Configure retries for flaky tests
5. **Parallel Execution** - Run tests in parallel when possible
6. **Screenshots/Videos** - Capture on failure for debugging

## Timeline

**Week 1**: Setup Playwright + basic login test
**Week 2**: Implement Platform Admin workflow tests
**Week 3**: Implement Organization Admin workflow tests
**Week 4**: Implement Member Portal workflow tests + CI/CD integration

---

**Total Test Scenarios**: 80+ comprehensive E2E tests covering all critical user journeys.
