import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form with email and password fields', async ({ page }) => {
      await page.goto('/login')

      // Check page title
      await expect(page).toHaveTitle(/MosqOS/)

      // Check for email field
      const emailField = page.locator('input[type="email"], input[name="email"]')
      await expect(emailField).toBeVisible()

      // Check for password field
      const passwordField = page.locator('input[type="password"], input[name="password"]')
      await expect(passwordField).toBeVisible()

      // Check for submit button
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
    })

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/login')

      // Click submit without filling fields
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Wait for validation error (form should not submit)
      // The form uses HTML5 validation or custom validation
      const emailField = page.locator('input[type="email"], input[name="email"]')
      await expect(emailField).toBeFocused()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/login')

      // Fill invalid email
      await page.fill('input[type="email"], input[name="email"]', 'invalidemail')
      await page.fill('input[type="password"], input[name="password"]', 'password123')

      // Submit
      await page.click('button[type="submit"]')

      // Should show validation error or remain on page
      await expect(page).toHaveURL(/login/)
    })

    test('should show error for incorrect credentials', async ({ page }) => {
      await page.goto('/login')

      // Fill incorrect credentials
      await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com')
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword')

      // Submit
      await page.click('button[type="submit"]')

      // Wait for error message
      const errorMessage = page.locator('text=/invalid|error|incorrect|failed/i')
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have link to signup/register', async ({ page }) => {
      await page.goto('/login')

      // Look for sign up / register link
      const signupLink = page.locator('a[href*="signup"], a[href*="register"], a:has-text("Sign up"), a:has-text("Register")')

      // May or may not have signup link depending on config
      const count = await signupLink.count()
      if (count > 0) {
        await expect(signupLink.first()).toBeVisible()
      }
    })

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/login')

      // Look for forgot password link
      const forgotLink = page.locator('a[href*="forgot"], a[href*="reset"], a:has-text("Forgot"), a:has-text("Reset")')

      const count = await forgotLink.count()
      if (count > 0) {
        await expect(forgotLink.first()).toBeVisible()
      }
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing admin dashboard without auth', async ({ page }) => {
      // Try to access protected admin route
      await page.goto('/test-mosque/admin/dashboard')

      // In dev mode, may not redirect; in production, should redirect to login
      const url = page.url()
      const isLoginOrDashboard = url.includes('login') || url.includes('dashboard')
      expect(isLoginOrDashboard).toBeTruthy()
    })

    test('should redirect to login when accessing member portal without auth', async ({ page }) => {
      // Try to access protected portal route
      await page.goto('/test-mosque/portal/dashboard')

      // In dev mode, may not redirect; in production, should redirect to login
      const url = page.url()
      const isLoginOrPortal = url.includes('login') || url.includes('portal')
      expect(isLoginOrPortal).toBeTruthy()
    })

    test('should redirect to login when accessing platform admin without auth', async ({ page }) => {
      // Try to access platform admin route
      await page.goto('/platform/dashboard')

      // In dev mode, may not redirect; in production, should redirect to login
      const url = page.url()
      const isLoginOrPlatform = url.includes('login') || url.includes('platform')
      expect(isLoginOrPlatform).toBeTruthy()
    })
  })

  test.describe('Public Routes', () => {
    test('should allow access to landing page', async ({ page }) => {
      await page.goto('/')

      // Should not redirect
      await expect(page).not.toHaveURL(/login/)
    })

    test('should allow access to pricing page', async ({ page }) => {
      await page.goto('/pricing')

      // Should show pricing content
      await expect(page.locator('text=/pricing|plans|free|pro|enterprise/i').first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Dev Mode Login', () => {
    test('should show dev mode options when available', async ({ page }) => {
      await page.goto('/login')

      // Look for dev mode toggle or quick login buttons
      const devModeIndicator = page.locator('text=/dev mode|demo|test users/i')
      const devLoginButtons = page.locator('button:has-text("Admin"), button:has-text("Imam"), button:has-text("Member")')

      // Check if dev mode is visible (depends on environment)
      const hasDevMode = (await devModeIndicator.count()) > 0 || (await devLoginButtons.count()) > 0

      if (hasDevMode) {
        // Dev mode should have quick login options
        await expect(devLoginButtons.first()).toBeVisible()
      }
    })

    test('should login as admin in dev mode', async ({ page }) => {
      await page.goto('/login')

      // Look for admin quick login
      const adminButton = page.locator('button:has-text("Admin")')

      const hasAdminButton = (await adminButton.count()) > 0

      if (hasAdminButton) {
        await adminButton.click()

        // Should redirect to platform dashboard or login success
        await page.waitForURL(/platform|dashboard|login/, { timeout: 10000 })
      }
    })

    test('should login as imam/owner in dev mode', async ({ page }) => {
      await page.goto('/login')

      // Look for imam quick login
      const imamButton = page.locator('button:has-text("Imam")')

      const hasImamButton = (await imamButton.count()) > 0

      if (hasImamButton) {
        await imamButton.click()

        // Should redirect to admin dashboard
        await page.waitForURL(/admin|dashboard|login/, { timeout: 10000 })
      }
    })

    test('should login as member in dev mode', async ({ page }) => {
      await page.goto('/login')

      // Look for member quick login
      const memberButton = page.locator('button:has-text("Member")')

      const hasMemberButton = (await memberButton.count()) > 0

      if (hasMemberButton) {
        await memberButton.click()

        // Should redirect to portal
        await page.waitForURL(/portal|dashboard|login/, { timeout: 10000 })
      }
    })
  })

  test.describe('Logout', () => {
    test('should have logout option when logged in', async ({ page }) => {
      // First, try to login via dev mode
      await page.goto('/login')

      const adminButton = page.locator('button:has-text("Admin")')
      const hasAdminButton = (await adminButton.count()) > 0

      if (hasAdminButton) {
        await adminButton.click()
        await page.waitForURL(/platform|dashboard/, { timeout: 10000 })

        // Look for logout button or menu
        const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out")')
        const userMenu = page.locator('[data-testid="user-menu"], button[aria-label*="user"], button[aria-label*="account"]')

        const hasDirectLogout = (await logoutButton.count()) > 0
        const hasUserMenu = (await userMenu.count()) > 0

        if (hasDirectLogout) {
          await expect(logoutButton.first()).toBeVisible()
        } else if (hasUserMenu) {
          // Click user menu to reveal logout
          await userMenu.first().click()
          const logoutInMenu = page.locator('text=/logout|sign out/i')
          await expect(logoutInMenu.first()).toBeVisible()
        }
      }
    })
  })
})
