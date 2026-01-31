/**
 * Qurbani Campaign Factory
 * Creates Qurbani/Sacrifice campaign records for Eid al-Adha
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDate, addDays, subMonths, subYears } from '../../generators/temporal/date-ranges.js';
import { QURBANI_PATTERNS } from '../../config.js';

type QurbaniCampaign = Database['public']['Tables']['qurbani_campaigns']['Insert'];

const STATUSES = ['draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled'] as const;

const OVERSEAS_COUNTRIES = [
  'Pakistan',
  'Bangladesh',
  'India',
  'Somalia',
  'Yemen',
  'Syria',
  'Palestine',
  'Afghanistan',
  'Sudan',
  'Mali',
];

export class QurbaniCampaignFactory extends BaseFactory<QurbaniCampaign> {
  protected getTableName(): string {
    return 'qurbani_campaigns';
  }

  protected async getDefaults(): Promise<Partial<QurbaniCampaign>> {
    const status = this.determineStatus();

    // Generate year based on status
    const currentYear = new Date().getFullYear();
    let year: number;
    if (status === 'completed') {
      year = currentYear - Math.floor(Math.random() * 2) - 1; // Past 1-2 years
    } else if (status === 'draft' || status === 'open') {
      year = currentYear; // Current year
    } else {
      year = currentYear;
    }

    // Calculate Hijri year (approximate)
    const hijriYear = Math.floor(year - 622 + (year - 622) / 32.5) + 1;

    // Dates for Eid al-Adha (approximate: usually June-July)
    const dates = this.generateDates(year, status);

    // Pricing
    const pricing = this.generatePricing();

    // Capacity
    const capacity = this.generateCapacity();

    return {
      organization_id: '', // Must be set
      name: `Qurbani ${year}`,
      description: this.generateDescription(year),
      year,
      hijri_year: hijriYear,
      registration_start: formatDbDate(dates.registrationStart),
      registration_deadline: formatDbDate(dates.registrationDeadline),
      slaughter_start_date: formatDbDate(dates.slaughterStart),
      slaughter_end_date: formatDbDate(dates.slaughterEnd),
      distribution_start_date: formatDbDate(dates.distributionStart),
      distribution_end_date: formatDbDate(dates.distributionEnd),
      ...pricing,
      ...capacity,
      allows_local_pickup: true,
      allows_full_charity: true,
      allows_overseas: Math.random() < 0.7, // 70% allow overseas
      overseas_countries: this.generateOverseasCountries(),
      pickup_locations: this.generatePickupLocations(),
      status,
      coordinator_id: null,
      contact_email: 'qurbani@mosque.org',
      contact_phone: '(555) 123-4567',
      allow_guest_registration: true,
      require_full_payment: false,
      deposit_amount: 50,
      notes: null,
      terms_and_conditions: this.generateTerms(),
    };
  }

  private determineStatus(): typeof STATUSES[number] {
    const now = new Date();
    const month = now.getMonth();

    // Qurbani is typically in month 6-7 (June-July for Dhul Hijjah)
    if (month >= 3 && month <= 5) {
      // Registration period (March-May)
      return pickWeighted({ open: 80, draft: 20 }) as typeof STATUSES[number];
    } else if (month >= 6 && month <= 7) {
      // Slaughter/distribution period (June-July)
      return pickWeighted({ in_progress: 70, closed: 30 }) as typeof STATUSES[number];
    } else {
      // Off-season
      return pickWeighted({ completed: 80, cancelled: 5, draft: 15 }) as typeof STATUSES[number];
    }
  }

  private generateDates(year: number, status: string): {
    registrationStart: Date;
    registrationDeadline: Date;
    slaughterStart: Date;
    slaughterEnd: Date;
    distributionStart: Date;
    distributionEnd: Date;
  } {
    // Approximate Eid al-Adha dates (varies each year)
    // For simplicity, assuming mid-June
    const eidDate = new Date(year, 5, 15); // June 15

    return {
      registrationStart: addDays(eidDate, -90), // ~3 months before
      registrationDeadline: addDays(eidDate, -7), // 1 week before
      slaughterStart: eidDate, // 10th Dhul Hijjah
      slaughterEnd: addDays(eidDate, 3), // 13th Dhul Hijjah
      distributionStart: eidDate,
      distributionEnd: addDays(eidDate, 5),
    };
  }

  private generatePricing(): {
    sheep_price: number;
    cow_price: number;
    camel_price: number;
    currency: string;
  } {
    return {
      sheep_price: pickRandom([200, 225, 250, 275, 300]),
      cow_price: pickRandom([350, 400, 450, 500]), // Per 1/7 share
      camel_price: pickRandom([500, 550, 600, 650]), // Per 1/7 share
      currency: 'USD',
    };
  }

  private generateCapacity(): {
    sheep_capacity: number;
    cow_capacity: number;
    camel_capacity: number;
    sheep_available: number;
    cow_shares_available: number;
    camel_shares_available: number;
  } {
    const sheepCapacity = Math.floor(Math.random() * 50) + 30; // 30-80 sheep
    const cowCapacity = Math.floor(Math.random() * 10) + 5; // 5-15 cows
    const camelCapacity = Math.floor(Math.random() * 3) + 1; // 1-3 camels

    return {
      sheep_capacity: sheepCapacity,
      cow_capacity: cowCapacity,
      camel_capacity: camelCapacity,
      sheep_available: sheepCapacity,
      cow_shares_available: cowCapacity * 7,
      camel_shares_available: camelCapacity * 7,
    };
  }

  private generateOverseasCountries(): string[] {
    const count = Math.floor(Math.random() * 4) + 2; // 2-5 countries
    const shuffled = [...OVERSEAS_COUNTRIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private generatePickupLocations(): Array<{ name: string; address: string; notes: string }> {
    return [
      {
        name: 'Main Mosque',
        address: '123 Islamic Center Drive, Houston, TX 77001',
        notes: 'Pickup available from 8 AM - 6 PM on Eid days',
      },
      {
        name: 'Community Center',
        address: '456 Community Lane, Houston, TX 77002',
        notes: 'Parking available. Please bring ID.',
      },
    ];
  }

  private generateDescription(year: number): string {
    return `Join us for Qurbani ${year}! Fulfill your religious obligation by participating in our annual Qurbani program. We offer local distribution, full charity options, and overseas distribution to those in need.

All animals are sourced from certified halal farms and slaughtered according to Islamic guidelines under the supervision of qualified scholars.`;
  }

  private generateTerms(): string {
    return `1. All Qurbani orders must be placed before the registration deadline.
2. A minimum deposit of $50 is required to secure your order.
3. Full payment must be received before slaughter date.
4. Cancellations made 7+ days before Eid are eligible for 90% refund.
5. No refunds for cancellations within 7 days of Eid.
6. Meat distribution will be handled per your selection.`;
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withYear(year: number): this {
    return this.with({
      name: `Qurbani ${year}`,
      year,
    });
  }

  asOpen(): this {
    return this.with({ status: 'open' });
  }

  asCompleted(): this {
    return this.with({ status: 'completed' });
  }

  asInProgress(): this {
    return this.with({ status: 'in_progress' });
  }

  withOverseas(): this {
    return this.with({
      allows_overseas: true,
      overseas_countries: this.generateOverseasCountries(),
    });
  }

  withoutOverseas(): this {
    return this.with({
      allows_overseas: false,
      overseas_countries: [],
    });
  }
}
