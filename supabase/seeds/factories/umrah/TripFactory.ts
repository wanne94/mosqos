/**
 * Trip Factory
 * Creates Umrah/Hajj trip records
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDate, addMonths, subMonths, addDays } from '../../generators/temporal/date-ranges.js';
import { UMRAH_PATTERNS } from '../../config.js';

type Trip = Database['public']['Tables']['trips']['Insert'];

const TRIP_TYPES = ['umrah', 'hajj', 'ziyarat', 'educational', 'other'] as const;
const STATUSES = ['draft', 'open', 'closed', 'full', 'in_progress', 'completed', 'cancelled'] as const;

const TRIP_NAMES = {
  umrah: [
    'Ramadan Umrah 2026',
    'Winter Umrah Package',
    'Spring Break Umrah',
    'Summer Umrah Trip',
    'Family Umrah Package',
    'Premium Umrah Experience',
    'Budget Umrah Trip',
  ],
  hajj: [
    'Hajj 2026',
    'Premium Hajj Package',
    'Standard Hajj Package',
    'Family Hajj Trip',
  ],
  ziyarat: [
    'Holy Sites Tour',
    'Historical Islamic Tour',
    'Turkey Ziyarat Trip',
    'Jordan & Palestine Tour',
  ],
  educational: [
    'Islamic Heritage Tour',
    'Youth Educational Trip',
    'Scholars Tour',
  ],
};

const HOTELS_MAKKAH = [
  'Hilton Makkah Convention Hotel',
  'Pullman ZamZam Makkah',
  'Swissotel Makkah',
  'Marriott Makkah',
  'Fairmont Makkah Clock Tower',
  'Conrad Makkah',
  'Makkah Towers',
  'Dar Al Tawhid Intercontinental',
];

const HOTELS_MADINAH = [
  'Oberoi Madinah',
  'Anwar Al Madinah Movenpick',
  'Pullman Madinah',
  'Crowne Plaza Madinah',
  'Millennium Al Aqeeq Madinah',
  'Dar Al Taqwa Hotel',
  'Shaza Al Madina',
];

export class TripFactory extends BaseFactory<Trip> {
  protected getTableName(): string {
    return 'trips';
  }

  protected async getDefaults(): Promise<Partial<Trip>> {
    const tripType = pickWeighted({
      umrah: 70,
      hajj: 15,
      ziyarat: 10,
      educational: 5,
    }) as typeof TRIP_TYPES[number];

    const status = this.determineStatus();

    // Generate dates based on status and trip type
    const dates = this.generateTripDates(tripType, status);

    // Pricing based on type and timing
    const pricing = this.generatePricing(tripType, dates.startDate);

    // Capacity
    const capacity = this.generateCapacity(tripType);

    // Name based on type
    const names = TRIP_NAMES[tripType] || [`${tripType.charAt(0).toUpperCase() + tripType.slice(1)} Trip`];
    const name = pickRandom(names);

    return {
      organization_id: '', // Must be set
      name,
      description: this.generateDescription(tripType),
      code: this.generateTripCode(tripType, dates.startDate),
      trip_type: tripType,
      start_date: formatDbDate(dates.startDate),
      end_date: formatDbDate(dates.endDate),
      registration_deadline: formatDbDate(dates.registrationDeadline),
      destination: tripType === 'umrah' || tripType === 'hajj' ? 'Makkah & Madinah, Saudi Arabia' : null,
      itinerary: this.generateItinerary(tripType),
      highlights: this.generateHighlights(tripType),
      hotel_makkah: tripType === 'umrah' || tripType === 'hajj' ? pickRandom(HOTELS_MAKKAH) : null,
      hotel_madinah: tripType === 'umrah' || tripType === 'hajj' ? pickRandom(HOTELS_MADINAH) : null,
      accommodation_details: null,
      ...pricing,
      inclusions: this.generateInclusions(tripType),
      exclusions: this.generateExclusions(),
      capacity: capacity.total,
      available_spots: capacity.available,
      waitlist_capacity: 10,
      status,
      requirements: this.generateRequirements(tripType),
      visa_requirements: tripType === 'umrah' || tripType === 'hajj' ? 'Valid passport with 6+ months validity. Umrah visa will be arranged.' : null,
      health_requirements: 'COVID-19 vaccination may be required. Meningitis vaccination required for Hajj/Umrah.',
      group_leader_id: null,
      contact_email: 'trips@mosque.org',
      contact_phone: '(555) 123-4567',
      image_url: null,
      gallery: [],
      notes: null,
    };
  }

  private determineStatus(): typeof STATUSES[number] {
    return pickWeighted({
      draft: 5,
      open: 30,
      closed: 15,
      full: 10,
      in_progress: 5,
      completed: 30,
      cancelled: 5,
    }) as typeof STATUSES[number];
  }

  private generateTripDates(tripType: string, status: string): {
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
  } {
    let startDate: Date;
    const now = new Date();

    if (status === 'completed') {
      // Past trip
      startDate = subMonths(now, Math.floor(Math.random() * 12) + 2);
    } else if (status === 'in_progress') {
      // Currently happening
      startDate = subMonths(now, 0.5);
    } else if (status === 'draft' || status === 'open') {
      // Future trip
      startDate = addMonths(now, Math.floor(Math.random() * 8) + 1);
    } else {
      // Mix
      startDate = addMonths(now, Math.floor(Math.random() * 6) - 3);
    }

    // Duration based on type
    let durationDays: number;
    switch (tripType) {
      case 'hajj':
        durationDays = 21; // ~3 weeks for Hajj
        break;
      case 'umrah':
        durationDays = Math.floor(Math.random() * 7) + 10; // 10-17 days
        break;
      case 'ziyarat':
        durationDays = Math.floor(Math.random() * 5) + 7; // 7-12 days
        break;
      default:
        durationDays = Math.floor(Math.random() * 4) + 5; // 5-9 days
    }

    const endDate = addDays(startDate, durationDays);
    const registrationDeadline = addDays(startDate, -30); // 30 days before

    return { startDate, endDate, registrationDeadline };
  }

  private generatePricing(tripType: string, startDate: Date): {
    price: number;
    early_bird_price: number | null;
    early_bird_deadline: string | null;
    deposit_amount: number;
    currency: string;
  } {
    let basePrice: number;

    // Use patterns from config for Umrah pricing
    const month = startDate.getMonth();
    if (tripType === 'umrah') {
      if (month >= 2 && month <= 4) { // Ramadan-ish
        basePrice = UMRAH_PATTERNS.timing.ramadan.price;
      } else if (month >= 10 || month <= 1) { // Winter
        basePrice = UMRAH_PATTERNS.timing.winter.price;
      } else {
        basePrice = UMRAH_PATTERNS.timing.dhul_hijjah.price;
      }
    } else if (tripType === 'hajj') {
      basePrice = 6500 + Math.floor(Math.random() * 2000);
    } else {
      basePrice = 1500 + Math.floor(Math.random() * 1500);
    }

    // Round to nearest 50
    basePrice = Math.round(basePrice / 50) * 50;

    const hasEarlyBird = Math.random() < 0.6;
    const earlyBirdPrice = hasEarlyBird ? Math.round(basePrice * 0.9 / 50) * 50 : null;
    const earlyBirdDeadline = hasEarlyBird ? formatDbDate(addDays(startDate, -60)) : null;

    const depositAmount = Math.round(basePrice * 0.25 / 50) * 50; // 25% deposit

    return {
      price: basePrice,
      early_bird_price: earlyBirdPrice,
      early_bird_deadline: earlyBirdDeadline,
      deposit_amount: depositAmount,
      currency: 'USD',
    };
  }

  private generateCapacity(tripType: string): { total: number; available: number } {
    const { min, max } = UMRAH_PATTERNS.groupSize;
    const total = Math.floor(Math.random() * (max - min + 1)) + min;

    // Available spots vary by status (will be set properly based on registrations)
    const registrationRate = Math.random();
    const available = Math.max(0, Math.floor(total * (1 - registrationRate)));

    return { total, available };
  }

  private generateTripCode(tripType: string, startDate: Date): string {
    const typeCode = tripType.substring(0, 3).toUpperCase();
    const year = startDate.getFullYear();
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const seq = Math.floor(Math.random() * 99) + 1;
    return `${typeCode}-${year}-${month}-${seq.toString().padStart(2, '0')}`;
  }

  private generateDescription(tripType: string): string {
    const descriptions: Record<string, string> = {
      umrah: 'Join us for a spiritually enriching Umrah journey to the holy cities of Makkah and Madinah. This package includes round-trip airfare, accommodation, guided tours, and all logistics.',
      hajj: 'Fulfill your obligation of Hajj with our comprehensive package. Includes all accommodations, transportation between holy sites, guidance from experienced scholars, and full-board meals.',
      ziyarat: 'Explore significant Islamic historical sites and strengthen your faith through this educational journey.',
      educational: 'An educational trip focused on Islamic history and heritage, suitable for youth and families.',
    };

    return descriptions[tripType] || 'Join us for this unique travel experience.';
  }

  private generateItinerary(tripType: string): string {
    if (tripType === 'umrah') {
      return `Day 1: Departure from USA
Day 2: Arrival in Jeddah, transfer to Makkah
Day 3-7: Stay in Makkah, perform Umrah, daily prayers at Masjid Al-Haram
Day 8: Transfer to Madinah
Day 9-12: Stay in Madinah, visit Masjid An-Nabawi and historical sites
Day 13: Departure from Madinah
Day 14: Arrival back in USA`;
    }
    return 'Detailed itinerary will be provided upon registration.';
  }

  private generateHighlights(tripType: string): string[] {
    const highlights: Record<string, string[]> = {
      umrah: [
        'Perform Umrah at Masjid Al-Haram',
        'Visit Masjid An-Nabawi',
        'Ziyarat to historical sites',
        'Experienced guide throughout',
        'Group prayers and Islamic lectures',
        '5-star hotel accommodations',
      ],
      hajj: [
        'Complete Hajj rituals with guidance',
        'Stay in Mina, Arafat, and Muzdalifah',
        'Expert scholars accompanying',
        'All-inclusive meals',
        'Air-conditioned tents',
      ],
    };

    return highlights[tripType] || ['Guided tours', 'Group activities', 'Educational sessions'];
  }

  private generateInclusions(tripType: string): string[] {
    const baseInclusions = [
      'Round-trip airfare',
      'Hotel accommodations',
      'Airport transfers',
      'Ground transportation',
      'Experienced guide',
      'Travel insurance',
    ];

    if (tripType === 'umrah' || tripType === 'hajj') {
      return [
        ...baseInclusions,
        'Visa processing',
        'Ihram clothing',
        'Ziyarat tours',
        'Daily lectures',
      ];
    }

    return baseInclusions;
  }

  private generateExclusions(): string[] {
    return [
      'Personal expenses',
      'Tips and gratuities',
      'Additional meals not mentioned',
      'Phone and communication expenses',
      'Medical expenses',
    ];
  }

  private generateRequirements(tripType: string): string {
    if (tripType === 'umrah' || tripType === 'hajj') {
      return `- Valid passport with at least 6 months validity
- Completed vaccination requirements
- Women under 45 must be accompanied by Mahram
- Physical ability to complete religious rituals`;
    }
    return 'Valid passport required';
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  asUmrah(): this {
    return this.with({ trip_type: 'umrah' });
  }

  asHajj(): this {
    return this.with({ trip_type: 'hajj' });
  }

  asOpen(): this {
    const startDate = addMonths(new Date(), 3);
    return this.with({
      status: 'open',
      start_date: formatDbDate(startDate),
      end_date: formatDbDate(addDays(startDate, 14)),
    });
  }

  asCompleted(): this {
    const startDate = subMonths(new Date(), 3);
    return this.with({
      status: 'completed',
      start_date: formatDbDate(startDate),
      end_date: formatDbDate(addDays(startDate, 14)),
    });
  }

  withCapacity(capacity: number): this {
    return this.with({ capacity, available_spots: capacity });
  }
}
