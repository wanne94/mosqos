import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  PaymentStatus,
  RegistrationStatus,
} from '../types/umrah.types'
import type {
  Trip,
  TripRegistration,
  TripFilters,
  RegistrationFilters,
  CreateTripInput,
  UpdateTripInput,
  CreateRegistrationInput,
  UpdateRegistrationInput,
  UpdateVisaStatusInput,
  RecordPaymentInput,
  CancelRegistrationInput,
  TripStatistics,
  TripStatus,
} from '../types/umrah.types'

const TRIPS_TABLE = 'umrah_trips'
const REGISTRATIONS_TABLE = 'umrah_registrations'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

// Helper types for query results
interface TripStatsRow {
  id: string
  status: string
  start_date: string
  end_date: string
}

interface RegistrationStatsRow {
  id: string
  status: string
  total_amount: number | null
  amount_paid: number | null
  balance_due: number | null
}

interface RegistrationNumberRow {
  registration_number: string | null
}

export const umrahService = {
  // ============================================================================
  // TRIPS
  // ============================================================================

  // Get all trips
  async getTrips(organizationId: string, filters?: TripFilters): Promise<Trip[]> {
    let query = db
      .from(TRIPS_TABLE)
      .select(`
        *,
        group_leader:members!umrah_trips_group_leader_id_fkey(id, first_name, last_name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false })

    if (filters?.search) {
      const search = `%${filters.search}%`
      query = query.or(`name.ilike.${search},code.ilike.${search},destination.ilike.${search}`)
    }

    if (filters?.trip_type) {
      const types = Array.isArray(filters.trip_type) ? filters.trip_type : [filters.trip_type]
      query = query.in('trip_type', types)
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      query = query.in('status', statuses)
    }

    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from)
    }

    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to)
    }

    if (filters?.destination) {
      query = query.ilike('destination', `%${filters.destination}%`)
    }

    if (filters?.has_availability === true) {
      query = query.gt('available_spots', 0)
    }

    if (filters?.price_min !== undefined) {
      query = query.gte('price', filters.price_min)
    }

    if (filters?.price_max !== undefined) {
      query = query.lte('price', filters.price_max)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as unknown as Trip[]
  },

  // Get single trip
  async getTripById(id: string): Promise<Trip | null> {
    const { data, error } = await db
      .from(TRIPS_TABLE)
      .select(`
        *,
        group_leader:members!umrah_trips_group_leader_id_fkey(id, first_name, last_name, email, phone)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as Trip
  },

  // Create trip
  async createTrip(organizationId: string, input: CreateTripInput): Promise<Trip> {
    const { data, error } = await db
      .from(TRIPS_TABLE)
      .insert([{
        organization_id: organizationId,
        ...input,
        trip_type: input.trip_type || 'umrah',
        status: input.status || 'draft',
        currency: input.currency || 'USD',
        highlights: input.highlights || [],
        inclusions: input.inclusions || [],
        exclusions: input.exclusions || [],
        gallery: input.gallery || [],
        waitlist_capacity: input.waitlist_capacity || 10,
        available_spots: input.capacity,
      }] as never)
      .select(`
        *,
        group_leader:members!umrah_trips_group_leader_id_fkey(id, first_name, last_name, email, phone)
      `)
      .single()

    if (error) throw error
    return data as unknown as Trip
  },

  // Update trip
  async updateTrip(id: string, input: UpdateTripInput): Promise<Trip> {
    const { data, error } = await db
      .from(TRIPS_TABLE)
      .update(input as never)
      .eq('id', id)
      .select(`
        *,
        group_leader:members!umrah_trips_group_leader_id_fkey(id, first_name, last_name, email, phone)
      `)
      .single()

    if (error) throw error
    return data as unknown as Trip
  },

  // Delete trip
  async deleteTrip(id: string): Promise<void> {
    const { error } = await db
      .from(TRIPS_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Update trip status
  async updateTripStatus(id: string, status: TripStatus): Promise<Trip> {
    return this.updateTrip(id, { status })
  },

  // ============================================================================
  // REGISTRATIONS
  // ============================================================================

  // Get registrations for a trip
  async getRegistrations(tripId: string, filters?: RegistrationFilters): Promise<TripRegistration[]> {
    let query = db
      .from(REGISTRATIONS_TABLE)
      .select(`
        *,
        trip:umrah_trips(id, name, code, start_date, end_date),
        member:members(id, first_name, last_name, email, phone, date_of_birth, gender, address, city, zip_code)
      `)
      .eq('trip_id', tripId)
      .order('registration_date', { ascending: false })

    if (filters?.search) {
      const search = `%${filters.search}%`
      query = query.or(`registration_number.ilike.${search},passport_number.ilike.${search}`)
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      query = query.in('status', statuses)
    }

    if (filters?.payment_status) {
      const paymentStatuses = Array.isArray(filters.payment_status) ? filters.payment_status : [filters.payment_status]
      query = query.in('payment_status', paymentStatuses)
    }

    if (filters?.visa_status) {
      const visaStatuses = Array.isArray(filters.visa_status) ? filters.visa_status : [filters.visa_status]
      query = query.in('visa_status', visaStatuses)
    }

    if (filters?.room_type) {
      query = query.eq('room_type', filters.room_type)
    }

    if (filters?.has_balance === true) {
      query = query.gt('balance_due', 0)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as unknown as TripRegistration[]
  },

  // Get all registrations for organization
  async getAllRegistrations(organizationId: string, filters?: RegistrationFilters): Promise<TripRegistration[]> {
    let query = db
      .from(REGISTRATIONS_TABLE)
      .select(`
        *,
        trip:umrah_trips(id, name, code, start_date, end_date),
        member:members(id, first_name, last_name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .order('registration_date', { ascending: false })

    if (filters?.trip_id) {
      query = query.eq('trip_id', filters.trip_id)
    }

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      query = query.in('status', statuses)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as unknown as TripRegistration[]
  },

  // Get single registration
  async getRegistrationById(id: string): Promise<TripRegistration | null> {
    const { data, error } = await db
      .from(REGISTRATIONS_TABLE)
      .select(`
        *,
        trip:umrah_trips(*),
        member:members(id, first_name, last_name, email, phone, date_of_birth, gender, address, city, zip_code)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as TripRegistration
  },

  // Create registration
  async createRegistration(organizationId: string, input: CreateRegistrationInput): Promise<TripRegistration> {
    // Generate registration number
    const regNumber = await this.generateRegistrationNumber(input.trip_id)

    // Get trip to determine price
    const trip = await this.getTripById(input.trip_id)
    const totalAmount = input.total_amount ?? trip?.price ?? 0

    const { data, error } = await db
      .from(REGISTRATIONS_TABLE)
      .insert([{
        organization_id: organizationId,
        ...input,
        registration_number: regNumber,
        registration_date: input.registration_date || new Date().toISOString(),
        status: input.status || 'pending',
        payment_status: 'pending',
        total_amount: totalAmount,
        deposit_paid: 0,
        amount_paid: 0,
        balance_due: totalAmount,
        currency: trip?.currency || 'USD',
        visa_status: 'not_started',
        room_sharing_with: input.room_sharing_with || [],
        flight_details: {},
      }] as never)
      .select(`
        *,
        trip:umrah_trips(id, name, code, start_date, end_date),
        member:members(id, first_name, last_name, email, phone)
      `)
      .single()

    if (error) throw error

    // Update trip available spots
    if (trip && trip.available_spots !== null) {
      // Use direct db update since available_spots is a database field but not in UpdateTripInput
      await db
        .from(TRIPS_TABLE)
        .update({ available_spots: Math.max(0, trip.available_spots - 1) })
        .eq('id', input.trip_id)
    }

    return data as unknown as TripRegistration
  },

  // Update registration
  async updateRegistration(id: string, input: UpdateRegistrationInput): Promise<TripRegistration> {
    const { data, error } = await db
      .from(REGISTRATIONS_TABLE)
      .update(input as never)
      .eq('id', id)
      .select(`
        *,
        trip:umrah_trips(id, name, code, start_date, end_date),
        member:members(id, first_name, last_name, email, phone)
      `)
      .single()

    if (error) throw error
    return data as unknown as TripRegistration
  },

  // Update visa status
  async updateVisaStatus(input: UpdateVisaStatusInput): Promise<TripRegistration> {
    const { registration_id, ...visaData } = input
    // Visa fields are database fields but not in UpdateRegistrationInput, cast to bypass
    return this.updateRegistration(registration_id, visaData as unknown as UpdateRegistrationInput)
  },

  // Record payment
  async recordPayment(input: RecordPaymentInput): Promise<TripRegistration> {
    const registration = await this.getRegistrationById(input.registration_id)
    if (!registration) throw new Error('Registration not found')

    const newAmountPaid = registration.amount_paid + input.amount
    const newBalance = Math.max(0, (registration.total_amount || 0) - newAmountPaid)
    const depositAmount = registration.trip?.deposit_amount || 0

    // Determine payment status
    let paymentStatus: PaymentStatus = PaymentStatus.PARTIAL
    if (newBalance === 0) {
      paymentStatus = PaymentStatus.PAID
    } else if (newAmountPaid >= depositAmount && registration.deposit_paid === 0) {
      paymentStatus = PaymentStatus.DEPOSIT_PAID
    }

    // Also update registration status if payment confirms it
    let status = registration.status
    // When status is pending and we receive a payment, confirm the registration
    if (registration.status === RegistrationStatus.PENDING) {
      status = RegistrationStatus.CONFIRMED
    }

    return this.updateRegistration(input.registration_id, {
      payment_status: paymentStatus,
      status,
    })
  },

  // Cancel registration
  async cancelRegistration(input: CancelRegistrationInput): Promise<TripRegistration> {
    const registration = await this.getRegistrationById(input.registration_id)
    if (!registration) throw new Error('Registration not found')

    const { data, error } = await db
      .from(REGISTRATIONS_TABLE)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: input.cancellation_reason,
        refund_amount: input.refund_amount ?? null,
        refund_date: input.refund_amount ? new Date().toISOString() : null,
      } as never)
      .eq('id', input.registration_id)
      .select(`
        *,
        trip:umrah_trips(id, name, code, start_date, end_date),
        member:members(id, first_name, last_name, email, phone)
      `)
      .single()

    if (error) throw error

    // Update trip available spots
    const trip = await this.getTripById(registration.trip_id)
    if (trip && trip.available_spots !== null && trip.capacity !== null) {
      // Use direct db update since available_spots is a database field but not in UpdateTripInput
      await db
        .from(TRIPS_TABLE)
        .update({ available_spots: Math.min(trip.capacity, trip.available_spots + 1) })
        .eq('id', registration.trip_id)
    }

    return data as unknown as TripRegistration
  },

  // Get registrations by member
  async getRegistrationsByMember(memberId: string): Promise<TripRegistration[]> {
    const { data, error } = await db
      .from(REGISTRATIONS_TABLE)
      .select(`
        *,
        trip:umrah_trips(id, name, code, start_date, end_date, status)
      `)
      .eq('member_id', memberId)
      .order('registration_date', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as TripRegistration[]
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  // Get trip statistics
  async getStatistics(organizationId: string): Promise<TripStatistics> {
    const now = new Date().toISOString()

    // Get all trips
    const { data: trips, error: tripsError } = await db
      .from(TRIPS_TABLE)
      .select('id, status, start_date, end_date')
      .eq('organization_id', organizationId)

    if (tripsError) throw tripsError

    // Get all registrations
    const { data: registrations, error: regsError } = await db
      .from(REGISTRATIONS_TABLE)
      .select('id, status, total_amount, amount_paid, balance_due')
      .eq('organization_id', organizationId)

    if (regsError) throw regsError

    const tripsList = (trips || []) as TripStatsRow[]
    const regsList = (registrations || []) as RegistrationStatsRow[]

    // Count trips
    const activeTrips = tripsList.filter((t) => ['open', 'closed', 'full'].includes(t.status)).length
    const upcomingTrips = tripsList.filter((t) => t.start_date > now && t.status !== 'cancelled').length
    const completedTrips = tripsList.filter((t) => t.status === 'completed').length

    // Count registrations
    const confirmedRegs = regsList.filter((r) => r.status === 'confirmed').length
    const totalRevenue = regsList.reduce((sum: number, r) => sum + (r.total_amount || 0), 0)
    const collectedRevenue = regsList.reduce((sum: number, r) => sum + (r.amount_paid || 0), 0)
    const pendingRevenue = regsList.reduce((sum: number, r) => sum + (r.balance_due || 0), 0)

    return {
      total_trips: tripsList.length,
      active_trips: activeTrips,
      upcoming_trips: upcomingTrips,
      completed_trips: completedTrips,
      total_registrations: regsList.length,
      confirmed_registrations: confirmedRegs,
      total_revenue: totalRevenue,
      collected_revenue: collectedRevenue,
      pending_revenue: pendingRevenue,
    }
  },

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Generate registration number
  async generateRegistrationNumber(tripId: string): Promise<string> {
    const trip = await this.getTripById(tripId)
    const prefix = trip?.code || 'REG'
    const year = new Date().getFullYear().toString().slice(-2)

    const { data, error } = await db
      .from(REGISTRATIONS_TABLE)
      .select('registration_number')
      .eq('trip_id', tripId)
      .like('registration_number', `${prefix}-${year}-%`)
      .order('registration_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    const rows = (data || []) as RegistrationNumberRow[]
    if (rows.length > 0 && rows[0].registration_number) {
      const lastPart = rows[0].registration_number.split('-').pop()
      const lastNumber = parseInt(lastPart || '', 10)
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`
  },

  // Get upcoming trips (open for registration)
  async getUpcomingTrips(organizationId: string): Promise<Trip[]> {
    const now = new Date().toISOString()

    const { data, error } = await db
      .from(TRIPS_TABLE)
      .select(`
        *,
        group_leader:members!umrah_trips_group_leader_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .gt('start_date', now)
      .in('status', ['open', 'full'])
      .order('start_date', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as Trip[]
  },

  // Get trips in progress
  async getTripsInProgress(organizationId: string): Promise<Trip[]> {
    const { data, error } = await db
      .from(TRIPS_TABLE)
      .select(`
        *,
        group_leader:members!umrah_trips_group_leader_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'in_progress')
      .order('start_date', { ascending: true })

    if (error) throw error
    return (data || []) as unknown as Trip[]
  },
}
