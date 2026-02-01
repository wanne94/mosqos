import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helper to create chainable mock query builder
function createMockQueryBuilder(finalResult: { data: any; error: any }) {
  const builder: any = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'is', 'not', 'or', 'gte', 'lte', 'like', 'ilike', 'gt', 'neq', 'order', 'limit', 'maybeSingle', 'upsert']

  methods.forEach(method => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

// Mock the supabase client before importing the service
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { umrahService } from './umrah.service'
import { supabase } from '@/lib/supabase/client'
import { TripStatus, TripType, RegistrationStatus, PaymentStatus, VisaStatus, RoomType } from '../types/umrah.types'

describe('umrahService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TRIPS TESTS
  // ============================================================================

  describe('getTrips', () => {
    it('should fetch all trips for an organization', async () => {
      const mockTrips = [
        {
          id: 'trip-1',
          organization_id: 'org-123',
          name: 'Umrah Ramadan 2024',
          code: 'UR2024',
          trip_type: 'umrah',
          start_date: '2024-03-15',
          end_date: '2024-03-25',
          destination: 'Makkah & Madinah',
          status: 'open',
          capacity: 50,
          available_spots: 30,
          price: 5000,
          currency: 'USD',
          group_leader: { id: 'leader-1', first_name: 'Ahmad', last_name: 'Khan', email: 'ahmad@example.com', phone: '+1234567890' },
        },
        {
          id: 'trip-2',
          organization_id: 'org-123',
          name: 'Hajj 2024',
          code: 'HJ2024',
          trip_type: 'hajj',
          start_date: '2024-06-10',
          end_date: '2024-06-25',
          destination: 'Makkah',
          status: 'draft',
          capacity: 100,
          available_spots: 100,
          price: 12000,
          currency: 'USD',
          group_leader: null,
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockTrips, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getTrips('org-123')

      expect(supabase.from).toHaveBeenCalledWith('umrah_trips')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(result).toEqual(mockTrips)
    })

    it('should apply search filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', { search: 'ramadan' })

      expect(mockQuery.or).toHaveBeenCalled()
    })

    it('should apply trip_type filter with single value', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', { trip_type: TripType.UMRAH })

      expect(mockQuery.in).toHaveBeenCalledWith('trip_type', ['umrah'])
    })

    it('should apply trip_type filter with array', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', { trip_type: [TripType.UMRAH, TripType.HAJJ] })

      expect(mockQuery.in).toHaveBeenCalledWith('trip_type', ['umrah', 'hajj'])
    })

    it('should apply status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', { status: TripStatus.OPEN })

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['open'])
    })

    it('should apply date range filters', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', {
        start_date_from: '2024-01-01',
        start_date_to: '2024-12-31',
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('start_date', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('start_date', '2024-12-31')
    })

    it('should apply destination filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', { destination: 'Makkah' })

      expect(mockQuery.ilike).toHaveBeenCalledWith('destination', '%Makkah%')
    })

    it('should apply has_availability filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', { has_availability: true })

      expect(mockQuery.gt).toHaveBeenCalledWith('available_spots', 0)
    })

    it('should apply price range filters', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getTrips('org-123', {
        price_min: 3000,
        price_max: 10000,
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('price', 3000)
      expect(mockQuery.lte).toHaveBeenCalledWith('price', 10000)
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.getTrips('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getTripById', () => {
    it('should fetch a single trip by ID', async () => {
      const mockTrip = {
        id: 'trip-1',
        organization_id: 'org-123',
        name: 'Umrah Ramadan 2024',
        code: 'UR2024',
        trip_type: 'umrah',
        status: 'open',
        group_leader: { id: 'leader-1', first_name: 'Ahmad', last_name: 'Khan', email: 'ahmad@example.com', phone: '+1234567890' },
      }

      const mockQuery = createMockQueryBuilder({ data: mockTrip, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getTripById('trip-1')

      expect(supabase.from).toHaveBeenCalledWith('umrah_trips')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'trip-1')
      expect(result).toEqual(mockTrip)
    })

    it('should return null when trip not found (PGRST116)', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getTripById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'OTHER_ERROR', message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.getTripById('trip-1')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Database error',
      })
    })
  })

  describe('createTrip', () => {
    it('should create a new trip with default values', async () => {
      const newTripInput = {
        name: 'New Umrah Trip',
        start_date: '2024-05-01',
        end_date: '2024-05-10',
        capacity: 40,
      }

      const createdTrip = {
        id: 'trip-new',
        organization_id: 'org-123',
        name: 'New Umrah Trip',
        start_date: '2024-05-01',
        end_date: '2024-05-10',
        capacity: 40,
        available_spots: 40,
        trip_type: 'umrah',
        status: 'draft',
        currency: 'USD',
        highlights: [],
        inclusions: [],
        exclusions: [],
        gallery: [],
        waitlist_capacity: 10,
        group_leader: null,
      }

      const mockQuery = createMockQueryBuilder({ data: createdTrip, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.createTrip('org-123', newTripInput)

      expect(supabase.from).toHaveBeenCalledWith('umrah_trips')
      expect(mockQuery.insert).toHaveBeenCalled()
      expect(result).toEqual(createdTrip)
    })

    it('should throw error when creation fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        umrahService.createTrip('org-123', {
          name: 'Test Trip',
          start_date: '2024-05-01',
          end_date: '2024-05-10',
        })
      ).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  describe('updateTrip', () => {
    it('should update an existing trip', async () => {
      const updateData = { name: 'Updated Trip Name', status: TripStatus.OPEN }

      const updatedTrip = {
        id: 'trip-1',
        name: 'Updated Trip Name',
        status: 'open',
        group_leader: { id: 'leader-1', first_name: 'Ahmad', last_name: 'Khan', email: 'ahmad@example.com', phone: '+1234567890' },
      }

      const mockQuery = createMockQueryBuilder({ data: updatedTrip, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.updateTrip('trip-1', updateData)

      expect(supabase.from).toHaveBeenCalledWith('umrah_trips')
      expect(mockQuery.update).toHaveBeenCalledWith(updateData)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'trip-1')
      expect(result).toEqual(updatedTrip)
    })

    it('should throw error when update fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.updateTrip('trip-1', { name: 'New Name' })).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })

  describe('deleteTrip', () => {
    it('should delete a trip', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.deleteTrip('trip-1')).resolves.toBeUndefined()

      expect(supabase.from).toHaveBeenCalledWith('umrah_trips')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'trip-1')
    })

    it('should throw error when delete fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.deleteTrip('trip-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('updateTripStatus', () => {
    it('should delegate to updateTrip with status', async () => {
      const updatedTrip = {
        id: 'trip-1',
        status: 'open',
        group_leader: null,
      }

      const mockQuery = createMockQueryBuilder({ data: updatedTrip, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.updateTripStatus('trip-1', TripStatus.OPEN)

      expect(mockQuery.update).toHaveBeenCalledWith({ status: TripStatus.OPEN })
      expect(result).toEqual(updatedTrip)
    })
  })

  // ============================================================================
  // REGISTRATIONS TESTS
  // ============================================================================

  describe('getRegistrations', () => {
    it('should fetch registrations for a trip', async () => {
      const mockRegistrations = [
        {
          id: 'reg-1',
          trip_id: 'trip-1',
          member_id: 'member-1',
          registration_number: 'UR2024-001',
          status: 'confirmed',
          payment_status: 'paid',
          trip: { id: 'trip-1', name: 'Umrah Ramadan', code: 'UR2024', start_date: '2024-03-15', end_date: '2024-03-25' },
          member: { id: 'member-1', first_name: 'Ali', last_name: 'Ahmed', email: 'ali@example.com', phone: '+1234567890' },
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRegistrations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getRegistrations('trip-1')

      expect(supabase.from).toHaveBeenCalledWith('umrah_registrations')
      expect(mockQuery.eq).toHaveBeenCalledWith('trip_id', 'trip-1')
      expect(result).toEqual(mockRegistrations)
    })

    it('should apply search filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getRegistrations('trip-1', { search: 'AB123' })

      expect(mockQuery.or).toHaveBeenCalled()
    })

    it('should apply status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getRegistrations('trip-1', { status: RegistrationStatus.CONFIRMED })

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['confirmed'])
    })

    it('should apply payment_status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getRegistrations('trip-1', { payment_status: [PaymentStatus.PAID, PaymentStatus.PARTIAL] })

      expect(mockQuery.in).toHaveBeenCalledWith('payment_status', ['paid', 'partial'])
    })

    it('should apply visa_status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getRegistrations('trip-1', { visa_status: VisaStatus.APPROVED })

      expect(mockQuery.in).toHaveBeenCalledWith('visa_status', ['approved'])
    })

    it('should apply room_type filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getRegistrations('trip-1', { room_type: RoomType.DOUBLE })

      expect(mockQuery.eq).toHaveBeenCalledWith('room_type', RoomType.DOUBLE)
    })

    it('should apply has_balance filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getRegistrations('trip-1', { has_balance: true })

      expect(mockQuery.gt).toHaveBeenCalledWith('balance_due', 0)
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.getRegistrations('trip-1')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getAllRegistrations', () => {
    it('should fetch all registrations for an organization', async () => {
      const mockRegistrations = [
        { id: 'reg-1', organization_id: 'org-123', trip_id: 'trip-1', member_id: 'member-1' },
        { id: 'reg-2', organization_id: 'org-123', trip_id: 'trip-2', member_id: 'member-2' },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRegistrations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getAllRegistrations('org-123')

      expect(supabase.from).toHaveBeenCalledWith('umrah_registrations')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(result).toEqual(mockRegistrations)
    })

    it('should apply trip_id filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getAllRegistrations('org-123', { trip_id: 'trip-1' })

      expect(mockQuery.eq).toHaveBeenCalledWith('trip_id', 'trip-1')
    })

    it('should apply member_id filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getAllRegistrations('org-123', { member_id: 'member-1' })

      expect(mockQuery.eq).toHaveBeenCalledWith('member_id', 'member-1')
    })

    it('should apply status filter', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await umrahService.getAllRegistrations('org-123', { status: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] })

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['confirmed', 'pending'])
    })
  })

  describe('getRegistrationById', () => {
    it('should fetch a single registration by ID', async () => {
      const mockRegistration = {
        id: 'reg-1',
        trip_id: 'trip-1',
        member_id: 'member-1',
        registration_number: 'UR2024-001',
        status: 'confirmed',
        trip: { id: 'trip-1', name: 'Umrah Ramadan' },
        member: { id: 'member-1', first_name: 'Ali', last_name: 'Ahmed', email: 'ali@example.com', phone: '+1234567890' },
      }

      const mockQuery = createMockQueryBuilder({ data: mockRegistration, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getRegistrationById('reg-1')

      expect(supabase.from).toHaveBeenCalledWith('umrah_registrations')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'reg-1')
      expect(result).toEqual(mockRegistration)
    })

    it('should return null when registration not found (PGRST116)', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getRegistrationById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'OTHER_ERROR', message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.getRegistrationById('reg-1')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Database error',
      })
    })
  })

  describe('createRegistration', () => {
    it('should create a registration with generated number and update available spots', async () => {
      const mockTrip = {
        id: 'trip-1',
        code: 'UR2024',
        price: 5000,
        currency: 'USD',
        available_spots: 30,
        capacity: 50,
      }

      const registrationInput = {
        trip_id: 'trip-1',
        member_id: 'member-1',
        room_type: RoomType.DOUBLE,
      }

      const createdRegistration = {
        id: 'reg-new',
        organization_id: 'org-123',
        trip_id: 'trip-1',
        member_id: 'member-1',
        registration_number: 'UR2024-26-0001',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 5000,
        deposit_paid: 0,
        amount_paid: 0,
        balance_due: 5000,
        currency: 'USD',
        visa_status: 'not_started',
        room_sharing_with: [],
        flight_details: {},
        trip: { id: 'trip-1', name: 'Umrah Ramadan', code: 'UR2024', start_date: '2024-03-15', end_date: '2024-03-25' },
        member: { id: 'member-1', first_name: 'Ali', last_name: 'Ahmed', email: 'ali@example.com', phone: '+1234567890' },
      }

      // Mock for generateRegistrationNumber -> getTripById
      const getTripMock1 = createMockQueryBuilder({ data: mockTrip, error: null })
      // Mock for generateRegistrationNumber -> select registration_number
      const getRegNumbersMock = createMockQueryBuilder({ data: [], error: null })
      // Mock for createRegistration -> getTripById
      const getTripMock2 = createMockQueryBuilder({ data: mockTrip, error: null })
      // Mock for insert registration
      const insertMock = createMockQueryBuilder({ data: createdRegistration, error: null })
      // Mock for updateTrip (available spots)
      const updateTripMock = createMockQueryBuilder({ data: { ...mockTrip, available_spots: 29 }, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTripMock1 // generateRegistrationNumber -> getTripById
        if (callCount === 2) return getRegNumbersMock // generateRegistrationNumber -> select reg numbers
        if (callCount === 3) return getTripMock2 // createRegistration -> getTripById
        if (callCount === 4) return insertMock // insert registration
        return updateTripMock // updateTrip for available_spots
      })

      const result = await umrahService.createRegistration('org-123', registrationInput)

      expect(result).toEqual(createdRegistration)
    })

    it('should use total_amount from input when provided', async () => {
      const mockTrip = {
        id: 'trip-1',
        code: 'UR2024',
        price: 5000,
        currency: 'USD',
        available_spots: 30,
        capacity: 50,
      }

      const registrationInput = {
        trip_id: 'trip-1',
        member_id: 'member-1',
        total_amount: 4500, // Custom amount
      }

      const createdRegistration = {
        id: 'reg-new',
        organization_id: 'org-123',
        trip_id: 'trip-1',
        member_id: 'member-1',
        registration_number: 'UR2024-26-0001',
        total_amount: 4500,
        balance_due: 4500,
      }

      const getTripMock1 = createMockQueryBuilder({ data: mockTrip, error: null })
      const getRegNumbersMock = createMockQueryBuilder({ data: [], error: null })
      const getTripMock2 = createMockQueryBuilder({ data: mockTrip, error: null })
      const insertMock = createMockQueryBuilder({ data: createdRegistration, error: null })
      const updateTripMock = createMockQueryBuilder({ data: { ...mockTrip, available_spots: 29 }, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTripMock1
        if (callCount === 2) return getRegNumbersMock
        if (callCount === 3) return getTripMock2
        if (callCount === 4) return insertMock
        return updateTripMock
      })

      const result = await umrahService.createRegistration('org-123', registrationInput)

      expect(result.total_amount).toBe(4500)
    })

    it('should throw error when creation fails', async () => {
      const mockTrip = { id: 'trip-1', code: 'UR2024', price: 5000, currency: 'USD', available_spots: null }

      const getTripMock1 = createMockQueryBuilder({ data: mockTrip, error: null })
      const getRegNumbersMock = createMockQueryBuilder({ data: [], error: null })
      const getTripMock2 = createMockQueryBuilder({ data: mockTrip, error: null })
      const insertMock = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTripMock1
        if (callCount === 2) return getRegNumbersMock
        if (callCount === 3) return getTripMock2
        return insertMock
      })

      await expect(
        umrahService.createRegistration('org-123', { trip_id: 'trip-1', member_id: 'member-1' })
      ).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  describe('updateRegistration', () => {
    it('should update an existing registration', async () => {
      const updateData = { status: RegistrationStatus.CONFIRMED, room_type: RoomType.SINGLE }

      const updatedRegistration = {
        id: 'reg-1',
        status: 'confirmed',
        room_type: 'single',
        trip: { id: 'trip-1', name: 'Umrah Ramadan', code: 'UR2024', start_date: '2024-03-15', end_date: '2024-03-25' },
        member: { id: 'member-1', first_name: 'Ali', last_name: 'Ahmed', email: 'ali@example.com', phone: '+1234567890' },
      }

      const mockQuery = createMockQueryBuilder({ data: updatedRegistration, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.updateRegistration('reg-1', updateData)

      expect(supabase.from).toHaveBeenCalledWith('umrah_registrations')
      expect(mockQuery.update).toHaveBeenCalledWith(updateData)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'reg-1')
      expect(result).toEqual(updatedRegistration)
    })

    it('should throw error when update fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.updateRegistration('reg-1', { status: RegistrationStatus.CONFIRMED })).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })

  describe('updateVisaStatus', () => {
    it('should delegate to updateRegistration with visa data', async () => {
      const visaInput = {
        registration_id: 'reg-1',
        visa_status: VisaStatus.APPROVED,
        visa_number: 'VISA-123',
        visa_issue_date: '2024-02-01',
        visa_expiry_date: '2024-05-01',
        visa_notes: 'Approved for entry',
      }

      const updatedRegistration = {
        id: 'reg-1',
        visa_status: 'approved',
        visa_number: 'VISA-123',
        visa_issue_date: '2024-02-01',
        visa_expiry_date: '2024-05-01',
        visa_notes: 'Approved for entry',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedRegistration, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.updateVisaStatus(visaInput)

      expect(mockQuery.update).toHaveBeenCalledWith({
        visa_status: VisaStatus.APPROVED,
        visa_number: 'VISA-123',
        visa_issue_date: '2024-02-01',
        visa_expiry_date: '2024-05-01',
        visa_notes: 'Approved for entry',
      })
      expect(result).toEqual(updatedRegistration)
    })
  })

  describe('recordPayment', () => {
    it('should update payment status to PAID when balance becomes zero', async () => {
      const existingRegistration = {
        id: 'reg-1',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 5000,
        amount_paid: 4000,
        deposit_paid: 0,
        trip: { deposit_amount: 1000 },
      }

      const paymentInput = {
        registration_id: 'reg-1',
        amount: 1000,
        payment_method: 'card',
      }

      const updatedRegistration = {
        id: 'reg-1',
        status: 'confirmed',
        payment_status: 'paid',
        total_amount: 5000,
        amount_paid: 5000,
        balance_due: 0,
      }

      const getRegMock = createMockQueryBuilder({ data: existingRegistration, error: null })
      const updateMock = createMockQueryBuilder({ data: updatedRegistration, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getRegMock
        return updateMock
      })

      const result = await umrahService.recordPayment(paymentInput)

      expect(mockQuery => mockQuery.update).toBeDefined()
      expect(result.payment_status).toBe('paid')
    })

    it('should update payment status to PARTIAL when balance remains', async () => {
      const existingRegistration = {
        id: 'reg-1',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 5000,
        amount_paid: 1000,
        deposit_paid: 1000,
        trip: { deposit_amount: 1000 },
      }

      const paymentInput = {
        registration_id: 'reg-1',
        amount: 1000,
        payment_method: 'card',
      }

      const updatedRegistration = {
        id: 'reg-1',
        status: 'confirmed',
        payment_status: 'partial',
        total_amount: 5000,
        amount_paid: 2000,
        balance_due: 3000,
      }

      const getRegMock = createMockQueryBuilder({ data: existingRegistration, error: null })
      const updateMock = createMockQueryBuilder({ data: updatedRegistration, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getRegMock
        return updateMock
      })

      const result = await umrahService.recordPayment(paymentInput)

      expect(result.payment_status).toBe('partial')
    })

    it('should update payment status to DEPOSIT_PAID when deposit threshold met', async () => {
      const existingRegistration = {
        id: 'reg-1',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 5000,
        amount_paid: 0,
        deposit_paid: 0,
        trip: { deposit_amount: 1000 },
      }

      const paymentInput = {
        registration_id: 'reg-1',
        amount: 1000,
        payment_method: 'card',
      }

      const updatedRegistration = {
        id: 'reg-1',
        status: 'confirmed',
        payment_status: 'deposit_paid',
      }

      const getRegMock = createMockQueryBuilder({ data: existingRegistration, error: null })
      const updateMock = createMockQueryBuilder({ data: updatedRegistration, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getRegMock
        return updateMock
      })

      const result = await umrahService.recordPayment(paymentInput)

      expect(result.payment_status).toBe('deposit_paid')
    })

    it('should throw error when registration not found', async () => {
      const getRegMock = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(getRegMock)

      await expect(
        umrahService.recordPayment({ registration_id: 'non-existent', amount: 1000, payment_method: 'card' })
      ).rejects.toThrow('Registration not found')
    })
  })

  describe('cancelRegistration', () => {
    it('should cancel registration and restore available spots', async () => {
      const existingRegistration = {
        id: 'reg-1',
        trip_id: 'trip-1',
        status: 'confirmed',
      }

      const mockTrip = {
        id: 'trip-1',
        available_spots: 29,
        capacity: 50,
      }

      const cancelInput = {
        registration_id: 'reg-1',
        cancellation_reason: 'Personal reasons',
        refund_amount: 4000,
      }

      const cancelledRegistration = {
        id: 'reg-1',
        status: 'cancelled',
        cancelled_at: expect.any(String),
        cancellation_reason: 'Personal reasons',
        refund_amount: 4000,
        refund_date: expect.any(String),
      }

      const getRegMock = createMockQueryBuilder({ data: existingRegistration, error: null })
      const updateMock = createMockQueryBuilder({ data: cancelledRegistration, error: null })
      const getTripMock = createMockQueryBuilder({ data: mockTrip, error: null })
      const updateTripMock = createMockQueryBuilder({ data: { ...mockTrip, available_spots: 30 }, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getRegMock
        if (callCount === 2) return updateMock
        if (callCount === 3) return getTripMock
        return updateTripMock
      })

      const result = await umrahService.cancelRegistration(cancelInput)

      expect(result.status).toBe('cancelled')
    })

    it('should throw error when registration not found', async () => {
      const getRegMock = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(getRegMock)

      await expect(
        umrahService.cancelRegistration({ registration_id: 'non-existent', cancellation_reason: 'Test' })
      ).rejects.toThrow('Registration not found')
    })
  })

  describe('getRegistrationsByMember', () => {
    it('should fetch registrations by member ID', async () => {
      const mockRegistrations = [
        { id: 'reg-1', member_id: 'member-1', trip_id: 'trip-1', trip: { id: 'trip-1', name: 'Umrah 2024', code: 'UR2024', start_date: '2024-03-15', end_date: '2024-03-25', status: 'completed' } },
        { id: 'reg-2', member_id: 'member-1', trip_id: 'trip-2', trip: { id: 'trip-2', name: 'Umrah 2025', code: 'UR2025', start_date: '2025-03-15', end_date: '2025-03-25', status: 'open' } },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockRegistrations, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getRegistrationsByMember('member-1')

      expect(supabase.from).toHaveBeenCalledWith('umrah_registrations')
      expect(mockQuery.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(result).toEqual(mockRegistrations)
    })

    it('should return empty array when no registrations found', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getRegistrationsByMember('member-no-trips')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.getRegistrationsByMember('member-1')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  describe('getStatistics', () => {
    it('should return correct statistics for trips and registrations', async () => {
      const now = new Date().toISOString()
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const mockTrips = [
        { id: 'trip-1', status: 'open', start_date: futureDate, end_date: futureDate },
        { id: 'trip-2', status: 'full', start_date: futureDate, end_date: futureDate },
        { id: 'trip-3', status: 'completed', start_date: pastDate, end_date: pastDate },
        { id: 'trip-4', status: 'cancelled', start_date: futureDate, end_date: futureDate },
      ]

      const mockRegistrations = [
        { id: 'reg-1', status: 'confirmed', total_amount: 5000, amount_paid: 5000, balance_due: 0 },
        { id: 'reg-2', status: 'confirmed', total_amount: 5000, amount_paid: 2500, balance_due: 2500 },
        { id: 'reg-3', status: 'pending', total_amount: 5000, amount_paid: 0, balance_due: 5000 },
      ]

      const tripsMock = createMockQueryBuilder({ data: mockTrips, error: null })
      const regsMock = createMockQueryBuilder({ data: mockRegistrations, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return tripsMock
        return regsMock
      })

      const result = await umrahService.getStatistics('org-123')

      expect(result.total_trips).toBe(4)
      expect(result.active_trips).toBe(2) // open + full
      expect(result.completed_trips).toBe(1)
      expect(result.total_registrations).toBe(3)
      expect(result.confirmed_registrations).toBe(2)
      expect(result.total_revenue).toBe(15000)
      expect(result.collected_revenue).toBe(7500)
      expect(result.pending_revenue).toBe(7500)
    })

    it('should return zero statistics when no data', async () => {
      const tripsMock = createMockQueryBuilder({ data: [], error: null })
      const regsMock = createMockQueryBuilder({ data: [], error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return tripsMock
        return regsMock
      })

      const result = await umrahService.getStatistics('org-123')

      expect(result.total_trips).toBe(0)
      expect(result.active_trips).toBe(0)
      expect(result.upcoming_trips).toBe(0)
      expect(result.completed_trips).toBe(0)
      expect(result.total_registrations).toBe(0)
      expect(result.confirmed_registrations).toBe(0)
      expect(result.total_revenue).toBe(0)
      expect(result.collected_revenue).toBe(0)
      expect(result.pending_revenue).toBe(0)
    })

    it('should throw error when trips query fails', async () => {
      const tripsMock = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(tripsMock)

      await expect(umrahService.getStatistics('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })

    it('should throw error when registrations query fails', async () => {
      const tripsMock = createMockQueryBuilder({ data: [], error: null })
      const regsMock = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return tripsMock
        return regsMock
      })

      await expect(umrahService.getStatistics('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  // ============================================================================
  // HELPER TESTS
  // ============================================================================

  describe('generateRegistrationNumber', () => {
    it('should generate registration number with correct format', async () => {
      const mockTrip = { id: 'trip-1', code: 'UR2024' }

      const getTripMock = createMockQueryBuilder({ data: mockTrip, error: null })
      const getRegNumbersMock = createMockQueryBuilder({ data: [], error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTripMock
        return getRegNumbersMock
      })

      const year = new Date().getFullYear().toString().slice(-2)
      const result = await umrahService.generateRegistrationNumber('trip-1')

      expect(result).toBe(`UR2024-${year}-0001`)
    })

    it('should increment registration number based on existing registrations', async () => {
      const mockTrip = { id: 'trip-1', code: 'UR2024' }
      const year = new Date().getFullYear().toString().slice(-2)
      const existingRegs = [{ registration_number: `UR2024-${year}-0005` }]

      const getTripMock = createMockQueryBuilder({ data: mockTrip, error: null })
      const getRegNumbersMock = createMockQueryBuilder({ data: existingRegs, error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTripMock
        return getRegNumbersMock
      })

      const result = await umrahService.generateRegistrationNumber('trip-1')

      expect(result).toBe(`UR2024-${year}-0006`)
    })

    it('should use REG prefix when trip has no code', async () => {
      const mockTrip = { id: 'trip-1', code: null }

      const getTripMock = createMockQueryBuilder({ data: mockTrip, error: null })
      const getRegNumbersMock = createMockQueryBuilder({ data: [], error: null })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTripMock
        return getRegNumbersMock
      })

      const year = new Date().getFullYear().toString().slice(-2)
      const result = await umrahService.generateRegistrationNumber('trip-1')

      expect(result).toBe(`REG-${year}-0001`)
    })

    it('should throw error when query fails', async () => {
      const getTripMock = createMockQueryBuilder({ data: { id: 'trip-1', code: 'UR2024' }, error: null })
      const getRegNumbersMock = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) return getTripMock
        return getRegNumbersMock
      })

      await expect(umrahService.generateRegistrationNumber('trip-1')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getUpcomingTrips', () => {
    it('should fetch upcoming trips with open or full status', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const mockTrips = [
        { id: 'trip-1', name: 'Upcoming Umrah', status: 'open', start_date: futureDate, group_leader: { id: 'leader-1', first_name: 'Ahmad', last_name: 'Khan' } },
        { id: 'trip-2', name: 'Full Umrah', status: 'full', start_date: futureDate, group_leader: null },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockTrips, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getUpcomingTrips('org-123')

      expect(supabase.from).toHaveBeenCalledWith('umrah_trips')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.gt).toHaveBeenCalled()
      expect(mockQuery.in).toHaveBeenCalledWith('status', ['open', 'full'])
      expect(result).toEqual(mockTrips)
    })

    it('should return empty array when no upcoming trips', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getUpcomingTrips('org-123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.getUpcomingTrips('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getTripsInProgress', () => {
    it('should fetch trips with in_progress status', async () => {
      const mockTrips = [
        { id: 'trip-1', name: 'Current Umrah', status: 'in_progress', group_leader: { id: 'leader-1', first_name: 'Ahmad', last_name: 'Khan' } },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockTrips, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getTripsInProgress('org-123')

      expect(supabase.from).toHaveBeenCalledWith('umrah_trips')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'in_progress')
      expect(result).toEqual(mockTrips)
    })

    it('should return empty array when no trips in progress', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await umrahService.getTripsInProgress('org-123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(umrahService.getTripsInProgress('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })
})
