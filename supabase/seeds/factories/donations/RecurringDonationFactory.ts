/**
 * Recurring Donation Factory
 * Creates recurring donation subscriptions
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { generateDonationAmount } from '../../generators/financial/donation-patterns.js';
import { formatDbDate, addMonths, addWeeks, addYears } from '../../generators/temporal/date-ranges.js';
import { subMonths, subYears } from 'date-fns';

type RecurringDonation = Database['public']['Tables']['recurring_donations']['Insert'];

const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'] as const;
const STATUSES = ['active', 'paused', 'cancelled', 'completed'] as const;
const PAYMENT_METHODS = ['card', 'bank_transfer'] as const;

export class RecurringDonationFactory extends BaseFactory<RecurringDonation> {
  protected getTableName(): string {
    return 'recurring_donations';
  }

  protected async getDefaults(): Promise<Partial<RecurringDonation>> {
    const frequency = pickWeighted({
      monthly: 65,
      quarterly: 15,
      annually: 10,
      weekly: 5,
      biweekly: 5,
    }) as typeof FREQUENCIES[number];

    // Start date 6-24 months ago
    const monthsAgo = Math.floor(Math.random() * 18) + 6;
    const startDate = subMonths(new Date(), monthsAgo);

    // Calculate next payment based on frequency
    const nextPaymentDate = this.calculateNextPaymentDate(startDate, frequency);

    // Most recurring donations are still active
    const status = pickWeighted({
      active: 70,
      paused: 10,
      cancelled: 15,
      completed: 5,
    }) as typeof STATUSES[number];

    // Amount tends to be lower for recurring (more sustainable)
    const amount = this.generateRecurringAmount();

    // Estimate total collected based on duration and frequency
    const donationCount = this.estimateDonationCount(startDate, frequency, status);
    const totalCollected = amount * donationCount;

    return {
      organization_id: '', // Must be set
      member_id: '', // Must be set
      fund_id: null,
      amount,
      currency: 'USD',
      frequency,
      start_date: formatDbDate(startDate),
      end_date: status === 'completed' ? formatDbDate(new Date()) : null,
      next_payment_date: status === 'active' ? formatDbDate(nextPaymentDate) : null,
      last_payment_date: status !== 'active' ? formatDbDate(subMonths(new Date(), 1)) : formatDbDate(new Date()),
      status,
      payment_method: pickRandom(PAYMENT_METHODS),
      stripe_subscription_id: status === 'active' ? `sub_${this.generateRandomId()}` : null,
      stripe_customer_id: `cus_${this.generateRandomId()}`,
      total_collected: totalCollected,
      donation_count: donationCount,
      notes: null,
    };
  }

  private generateRecurringAmount(): number {
    // Recurring donations tend to be smaller, more sustainable amounts
    const weights = [
      { range: [10, 25], weight: 30 },
      { range: [25, 50], weight: 35 },
      { range: [50, 100], weight: 20 },
      { range: [100, 250], weight: 10 },
      { range: [250, 500], weight: 5 },
    ];

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { range, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        const [min, max] = range;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }

    return 25; // Fallback
  }

  private calculateNextPaymentDate(startDate: Date, frequency: string): Date {
    const now = new Date();
    let nextDate = new Date(startDate);

    while (nextDate <= now) {
      switch (frequency) {
        case 'weekly':
          nextDate = addWeeks(nextDate, 1);
          break;
        case 'biweekly':
          nextDate = addWeeks(nextDate, 2);
          break;
        case 'monthly':
          nextDate = addMonths(nextDate, 1);
          break;
        case 'quarterly':
          nextDate = addMonths(nextDate, 3);
          break;
        case 'annually':
          nextDate = addYears(nextDate, 1);
          break;
      }
    }

    return nextDate;
  }

  private estimateDonationCount(startDate: Date, frequency: string, status: string): number {
    const now = new Date();
    const endDate = status === 'completed' ? subMonths(now, Math.floor(Math.random() * 3)) : now;
    const monthsDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    let paymentsPerMonth: number;
    switch (frequency) {
      case 'weekly':
        paymentsPerMonth = 4;
        break;
      case 'biweekly':
        paymentsPerMonth = 2;
        break;
      case 'monthly':
        paymentsPerMonth = 1;
        break;
      case 'quarterly':
        paymentsPerMonth = 0.33;
        break;
      case 'annually':
        paymentsPerMonth = 0.083;
        break;
      default:
        paymentsPerMonth = 1;
    }

    return Math.max(1, Math.floor(monthsDiff * paymentsPerMonth));
  }

  private generateRandomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withMember(memberId: string): this {
    return this.with({ member_id: memberId });
  }

  withFund(fundId: string): this {
    return this.with({ fund_id: fundId });
  }

  withAmount(amount: number): this {
    return this.with({ amount });
  }

  withFrequency(frequency: typeof FREQUENCIES[number]): this {
    return this.with({ frequency });
  }

  asMonthly(): this {
    return this.withFrequency('monthly');
  }

  asQuarterly(): this {
    return this.withFrequency('quarterly');
  }

  asAnnual(): this {
    return this.withFrequency('annually');
  }

  asActive(): this {
    return this.with({ status: 'active' });
  }

  asPaused(): this {
    return this.with({ status: 'paused' });
  }

  asCancelled(): this {
    return this.with({ status: 'cancelled' });
  }

  withStartDate(date: Date): this {
    return this.with({ start_date: formatDbDate(date) });
  }
}
