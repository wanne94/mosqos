import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n-test'

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface WrapperProps {
  children: ReactNode
}

// All providers wrapper for testing
const AllTheProviders = ({ children }: WrapperProps) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>{children}</BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  )
}

// Custom render method that includes all providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }
export { createTestQueryClient }

// Test utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Mock organization for tests
export const mockOrganization = {
  id: 'org-123',
  name: 'Test Mosque',
  slug: 'test-mosque',
  country_id: 'country-123',
  currency: 'USD',
  timezone: 'America/New_York',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock user for tests
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
}

// Mock member for tests
export const mockMember = {
  id: 'member-123',
  organization_id: 'org-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  membership_type: 'individual' as const,
  membership_status: 'active' as const,
  joined_date: '2024-01-01',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock household for tests
export const mockHousehold = {
  id: 'household-123',
  organization_id: 'org-123',
  name: 'Doe Family',
  address: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  postal_code: '62701',
  country: 'USA',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock donation for tests
export const mockDonation = {
  id: 'donation-123',
  organization_id: 'org-123',
  member_id: 'member-123',
  amount: 100,
  currency: 'USD',
  donation_type: 'one_time' as const,
  payment_method: 'card' as const,
  status: 'completed' as const,
  donation_date: '2024-01-15',
  is_anonymous: false,
  is_tax_deductible: true,
  receipt_sent: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock fund for tests
export const mockFund = {
  id: 'fund-123',
  organization_id: 'org-123',
  name: 'General Fund',
  description: 'General purpose donations',
  fund_type: 'general' as const,
  goal_amount: 10000,
  current_amount: 5000,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock service case for tests
export const mockCase = {
  id: 'case-123',
  organization_id: 'org-123',
  case_number: 'CASE-2024-0001',
  title: 'Test Case',
  description: 'Test case description',
  status: 'open' as const,
  priority: 'medium' as const,
  notes_thread: [],
  is_confidential: false,
  requires_followup: false,
  disbursed_amount: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock Umrah trip for tests
export const mockTrip = {
  id: 'trip-123',
  organization_id: 'org-123',
  name: 'Ramadan Umrah 2024',
  trip_type: 'umrah' as const,
  start_date: '2024-03-15',
  end_date: '2024-03-25',
  status: 'open' as const,
  price: 3500,
  currency: 'USD',
  capacity: 50,
  available_spots: 45,
  waitlist_capacity: 10,
  highlights: [],
  inclusions: [],
  exclusions: [],
  gallery: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
