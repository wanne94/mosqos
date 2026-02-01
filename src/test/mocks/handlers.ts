import { http, HttpResponse } from 'msw'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'

// Mock data
const mockMembers = [
  {
    id: 'member-1',
    organization_id: 'org-123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    membership_type: 'individual',
    membership_status: 'active',
    joined_date: '2024-01-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'member-2',
    organization_id: 'org-123',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    membership_type: 'family',
    membership_status: 'active',
    joined_date: '2024-02-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockHouseholds = [
  {
    id: 'household-1',
    organization_id: 'org-123',
    name: 'Doe Family',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62701',
    country: 'USA',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    members: mockMembers.filter((m) => m.last_name === 'Doe'),
    member_count: 1,
  },
]

const mockDonations = [
  {
    id: 'donation-1',
    organization_id: 'org-123',
    member_id: 'member-1',
    amount: 100,
    currency: 'USD',
    donation_type: 'one_time',
    payment_method: 'card',
    status: 'completed',
    donation_date: '2024-01-15',
    is_anonymous: false,
    is_tax_deductible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockFunds = [
  {
    id: 'fund-1',
    organization_id: 'org-123',
    name: 'General Fund',
    description: 'General purpose donations',
    fund_type: 'general',
    goal_amount: 10000,
    current_amount: 5000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fund-2',
    organization_id: 'org-123',
    name: 'Zakat Fund',
    description: 'Zakat donations',
    fund_type: 'zakat',
    goal_amount: null,
    current_amount: 15000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockCases = [
  {
    id: 'case-1',
    organization_id: 'org-123',
    case_number: 'CASE-2024-0001',
    title: 'Financial Assistance Request',
    description: 'Request for help with rent',
    status: 'open',
    priority: 'high',
    member_id: 'member-1',
    notes_thread: [],
    is_confidential: false,
    requires_followup: true,
    followup_date: '2024-02-01',
    disbursed_amount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockTrips = [
  {
    id: 'trip-1',
    organization_id: 'org-123',
    name: 'Ramadan Umrah 2024',
    trip_type: 'umrah',
    start_date: '2024-03-15',
    end_date: '2024-03-25',
    status: 'open',
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
  },
]

// MSW handlers
export const handlers = [
  // Members
  http.get(`${SUPABASE_URL}/rest/v1/members`, () => {
    return HttpResponse.json(mockMembers)
  }),

  http.get(`${SUPABASE_URL}/rest/v1/members/:id`, ({ params }) => {
    const member = mockMembers.find((m) => m.id === params.id)
    return member
      ? HttpResponse.json(member)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  http.post(`${SUPABASE_URL}/rest/v1/members`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const newMember = {
      id: 'member-' + Math.random().toString(36).substring(7),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json([newMember], { status: 201 })
  }),

  // Households
  http.get(`${SUPABASE_URL}/rest/v1/households`, () => {
    return HttpResponse.json(mockHouseholds)
  }),

  http.get(`${SUPABASE_URL}/rest/v1/households/:id`, ({ params }) => {
    const household = mockHouseholds.find((h) => h.id === params.id)
    return household
      ? HttpResponse.json(household)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  // Donations
  http.get(`${SUPABASE_URL}/rest/v1/donations`, () => {
    return HttpResponse.json(mockDonations)
  }),

  http.post(`${SUPABASE_URL}/rest/v1/donations`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const newDonation = {
      id: 'donation-' + Math.random().toString(36).substring(7),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json([newDonation], { status: 201 })
  }),

  // Funds
  http.get(`${SUPABASE_URL}/rest/v1/funds`, () => {
    return HttpResponse.json(mockFunds)
  }),

  // Cases
  http.get(`${SUPABASE_URL}/rest/v1/service_cases`, () => {
    return HttpResponse.json(mockCases)
  }),

  http.post(`${SUPABASE_URL}/rest/v1/service_cases`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const newCase = {
      id: 'case-' + Math.random().toString(36).substring(7),
      case_number: 'CASE-2024-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json([newCase], { status: 201 })
  }),

  // Trips
  http.get(`${SUPABASE_URL}/rest/v1/umrah_trips`, () => {
    return HttpResponse.json(mockTrips)
  }),

  http.get(`${SUPABASE_URL}/rest/v1/umrah_trips/:id`, ({ params }) => {
    const trip = mockTrips.find((t) => t.id === params.id)
    return trip
      ? HttpResponse.json(trip)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  // Registrations
  http.get(`${SUPABASE_URL}/rest/v1/umrah_registrations`, () => {
    return HttpResponse.json([])
  }),

  // Auth
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
    })
  }),

  // Announcements
  http.get(`${SUPABASE_URL}/rest/v1/announcements`, () => {
    return HttpResponse.json([])
  }),

  // Pledges
  http.get(`${SUPABASE_URL}/rest/v1/pledges`, () => {
    return HttpResponse.json([])
  }),

  // Recurring donations
  http.get(`${SUPABASE_URL}/rest/v1/recurring_donations`, () => {
    return HttpResponse.json([])
  }),
]
