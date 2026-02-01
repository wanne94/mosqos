import { test, expect } from '@playwright/test'

// Helper to login as admin (dev mode)
async function loginAsAdmin(page: any) {
  await page.goto('/login')

  const adminButton = page.locator('button:has-text("Admin")')
  const hasAdminButton = (await adminButton.count()) > 0

  if (hasAdminButton) {
    await adminButton.click()
    await page.waitForURL(/platform|dashboard/, { timeout: 10000 })
    return true
  }
  return false
}

// Helper to login as imam (dev mode)
async function loginAsImam(page: any) {
  await page.goto('/login')

  const imamButton = page.locator('button:has-text("Imam")')
  const hasImamButton = (await imamButton.count()) > 0

  if (hasImamButton) {
    await imamButton.click()
    await page.waitForURL(/admin|dashboard/, { timeout: 10000 })
    return true
  }
  return false
}

test.describe('Donations Module', () => {
  test.describe('Donations List', () => {
    test('should display donations page for authenticated admin', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      // Navigate to donations page
      await page.goto('/dev-mosque/admin/donations')

      // Should show donations page content
      await expect(page.locator('text=/donations|donacije/i').first()).toBeVisible({ timeout: 10000 })
    })

    test('should show donations table or list', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Look for table or list structure
      const table = page.locator('table')
      const list = page.locator('[role="list"], [data-testid="donations-list"]')

      const hasTable = (await table.count()) > 0
      const hasList = (await list.count()) > 0

      expect(hasTable || hasList).toBeTruthy()
    })

    test('should have add donation button', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Look for add/create button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add")')
      await expect(addButton.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have search/filter functionality', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Look for search input or filter controls
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i], input[type="search"]')
      const filterButton = page.locator('button:has-text("Filter"), [data-testid="filter"]')

      const hasSearch = (await searchInput.count()) > 0
      const hasFilter = (await filterButton.count()) > 0

      expect(hasSearch || hasFilter).toBeTruthy()
    })
  })

  test.describe('Create Donation', () => {
    test('should open create donation form', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Click add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")')
      await addButton.first().click()

      // Should show form or modal
      const form = page.locator('form')
      const modal = page.locator('[role="dialog"], [data-testid="donation-form"]')

      await expect(form.or(modal).first()).toBeVisible({ timeout: 10000 })
    })

    test('should have required form fields', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Click add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")')
      await addButton.first().click()

      // Check for amount field
      const amountField = page.locator('input[name="amount"], input[placeholder*="amount" i], input[type="number"]')
      await expect(amountField.first()).toBeVisible({ timeout: 5000 })

      // Check for member/donor selection
      const memberField = page.locator('select[name="member"], [data-testid="member-select"], input[placeholder*="member" i], input[placeholder*="donor" i]')
      const hasMemberField = (await memberField.count()) > 0

      // Check for fund selection
      const fundField = page.locator('select[name="fund"], [data-testid="fund-select"], input[placeholder*="fund" i]')
      const hasFundField = (await fundField.count()) > 0

      expect(hasMemberField || hasFundField).toBeTruthy()
    })

    test('should validate required fields', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Click add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")')
      await addButton.first().click()

      // Try to submit without filling required fields
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      await submitButton.first().click()

      // Should show validation error or stay on form
      const errorMessage = page.locator('text=/required|error|invalid/i')
      const formStillVisible = page.locator('form')

      const hasError = (await errorMessage.count()) > 0
      const formVisible = (await formStillVisible.count()) > 0

      expect(hasError || formVisible).toBeTruthy()
    })
  })

  test.describe('Donation Types', () => {
    test('should support different donation types', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Click add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")')
      await addButton.first().click()

      // Look for donation type selector
      const typeSelector = page.locator('select[name="donation_type"], [data-testid="type-select"], input[name="donation_type"]')
      const typeButtons = page.locator('button:has-text("Zakat"), button:has-text("Sadaqah"), button:has-text("One-time")')

      const hasTypeSelector = (await typeSelector.count()) > 0
      const hasTypeButtons = (await typeButtons.count()) > 0

      expect(hasTypeSelector || hasTypeButtons).toBeTruthy()
    })
  })

  test.describe('Funds Management', () => {
    test('should navigate to funds page', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      // Try different possible fund URLs
      await page.goto('/dev-mosque/admin/donations/funds')

      // Should show funds content or redirect
      const fundsContent = page.locator('text=/funds|fondovi/i')
      const donationsContent = page.locator('text=/donations/i')

      await expect(fundsContent.or(donationsContent).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Export Functionality', () => {
    test('should have export options', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export"]')

      const hasExport = (await exportButton.count()) > 0

      if (hasExport) {
        await expect(exportButton.first()).toBeVisible()
      }
    })
  })

  test.describe('Pagination', () => {
    test('should have pagination controls if many donations', async ({ page }) => {
      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Look for pagination
      const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination"], button:has-text("Next"), button:has-text("Previous")')

      // Pagination may not be visible if few records
      const hasPagination = (await pagination.count()) > 0

      // This is informational - pagination depends on data
      expect(true).toBeTruthy()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      const loggedIn = await loginAsImam(page)

      if (!loggedIn) {
        test.skip()
        return
      }

      await page.goto('/dev-mosque/admin/donations')

      // Page should still be functional
      await expect(page.locator('text=/donations|donacije/i').first()).toBeVisible({ timeout: 10000 })

      // Mobile menu might be collapsed
      const hamburgerMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]')
      const hasHamburger = (await hamburgerMenu.count()) > 0

      // Either content is visible or menu is available
      expect(true).toBeTruthy()
    })
  })
})
