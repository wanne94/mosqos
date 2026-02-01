import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/MosqOS/)
  })

  test('should have login link', async ({ page }) => {
    await page.goto('/')

    // Look for login link/button
    const loginLink = page.locator('a[href="/login"], button:has-text("Login"), a:has-text("Login")')
    await expect(loginLink.first()).toBeVisible()
  })
})

test.describe('Authentication', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login')

    // Check for email and password fields
    const emailField = page.locator('input[type="email"], input[name="email"]')
    const passwordField = page.locator('input[type="password"], input[name="password"]')

    await expect(emailField).toBeVisible()
    await expect(passwordField).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com')
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for error message (this may vary based on implementation)
    await expect(page.locator('text=/invalid|error|incorrect/i').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Multi-tenant Routing', () => {
  test('should handle organization slug routes', async ({ page }) => {
    // This test assumes you have a test organization set up
    // Adjust the slug as needed for your test environment
    await page.goto('/test-mosque/admin/dashboard')

    // Should either redirect to login or show dashboard (dev mode)
    const url = page.url()
    const isLoginOrDashboard = url.includes('login') || url.includes('dashboard')
    expect(isLoginOrDashboard).toBeTruthy()
  })
})
