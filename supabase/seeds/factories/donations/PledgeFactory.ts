/**
 * Pledge Factory
 * Creates donation pledges with payment schedules
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDate, addMonths } from '../../generators/temporal/date-ranges.js';
import { subMonths, addDays } from 'date-fns';

type Pledge = Database['public']['Tables']['pledges']['Insert'];

const STATUSES = ['active', 'completed', 'cancelled', 'overdue'] as const;

interface PaymentScheduleItem {
  due_date: string;
  amount: number;
  paid: boolean;
  paid_date?: string;
  donation_id?: string;
}

export class PledgeFactory extends BaseFactory<Pledge> {
  protected getTableName(): string {
    return 'pledges';
  }

  protected async getDefaults(): Promise<Partial<Pledge>> {
    // Pledge amounts tend to be larger than regular donations
    const totalAmount = this.generatePledgeAmount();

    // Pledge date 3-18 months ago
    const monthsAgo = Math.floor(Math.random() * 15) + 3;
    const pledgeDate = subMonths(new Date(), monthsAgo);

    // Due date 3-24 months from pledge
    const dueMonths = Math.floor(Math.random() * 21) + 3;
    const dueDate = addMonths(pledgeDate, dueMonths);

    // Status based on due date and time
    const status = this.determineStatus(dueDate);

    // Calculate paid amount based on status
    const { paidAmount, paymentSchedule } = this.generatePaymentSchedule(
      totalAmount,
      pledgeDate,
      dueDate,
      status
    );

    return {
      organization_id: '', // Must be set
      member_id: '', // Must be set
      fund_id: null,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      currency: 'USD',
      status,
      pledge_date: formatDbDate(pledgeDate),
      due_date: formatDbDate(dueDate),
      payment_schedule: paymentSchedule,
      notes: null,
    };
  }

  private generatePledgeAmount(): number {
    // Pledges tend to be larger amounts
    const weights = [
      { range: [100, 500], weight: 30 },
      { range: [500, 1000], weight: 30 },
      { range: [1000, 2500], weight: 20 },
      { range: [2500, 5000], weight: 12 },
      { range: [5000, 10000], weight: 6 },
      { range: [10000, 25000], weight: 2 },
    ];

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { range, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        const [min, max] = range;
        // Round to nice numbers
        const amount = Math.floor(Math.random() * (max - min + 1)) + min;
        return Math.round(amount / 50) * 50; // Round to nearest 50
      }
    }

    return 500; // Fallback
  }

  private determineStatus(dueDate: Date): typeof STATUSES[number] {
    const now = new Date();
    const isPastDue = dueDate < now;

    if (isPastDue) {
      // Past due pledges
      return pickWeighted({
        completed: 60,
        overdue: 25,
        cancelled: 15,
      }) as typeof STATUSES[number];
    } else {
      // Active pledges
      return pickWeighted({
        active: 85,
        cancelled: 10,
        completed: 5,
      }) as typeof STATUSES[number];
    }
  }

  private generatePaymentSchedule(
    totalAmount: number,
    pledgeDate: Date,
    dueDate: Date,
    status: string
  ): { paidAmount: number; paymentSchedule: PaymentScheduleItem[] } {
    // Determine number of payments (3-12)
    const numPayments = Math.floor(Math.random() * 10) + 3;
    const paymentAmount = Math.round((totalAmount / numPayments) * 100) / 100;
    const now = new Date();

    const schedule: PaymentScheduleItem[] = [];
    let paidAmount = 0;

    for (let i = 0; i < numPayments; i++) {
      const paymentDueDate = addMonths(pledgeDate, Math.floor(((i + 1) * (dueDate.getTime() - pledgeDate.getTime())) / numPayments / (1000 * 60 * 60 * 24 * 30)));
      const isLastPayment = i === numPayments - 1;
      const actualAmount = isLastPayment
        ? Math.round((totalAmount - paymentAmount * (numPayments - 1)) * 100) / 100
        : paymentAmount;

      // Determine if this payment was made
      let isPaid = false;
      let paidDate: string | undefined;

      if (status === 'completed') {
        isPaid = true;
        paidDate = formatDbDate(addDays(paymentDueDate, Math.floor(Math.random() * 7) - 2)); // Pay within a few days of due
      } else if (status === 'cancelled') {
        // Only some payments made before cancellation
        isPaid = Math.random() < 0.3;
        if (isPaid) {
          paidDate = formatDbDate(addDays(paymentDueDate, Math.floor(Math.random() * 7)));
        }
      } else if (status === 'overdue') {
        // Some payments made, but not recent ones
        isPaid = paymentDueDate < subMonths(now, 3);
        if (isPaid) {
          paidDate = formatDbDate(addDays(paymentDueDate, Math.floor(Math.random() * 14)));
        }
      } else {
        // Active - payments made up to current date
        isPaid = paymentDueDate < now && Math.random() < 0.9;
        if (isPaid) {
          paidDate = formatDbDate(addDays(paymentDueDate, Math.floor(Math.random() * 7)));
        }
      }

      if (isPaid) {
        paidAmount += actualAmount;
      }

      schedule.push({
        due_date: formatDbDate(paymentDueDate),
        amount: actualAmount,
        paid: isPaid,
        ...(paidDate && { paid_date: paidDate }),
      });
    }

    return {
      paidAmount: Math.round(paidAmount * 100) / 100,
      paymentSchedule: schedule,
    };
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

  withAmount(totalAmount: number): this {
    return this.with({ total_amount: totalAmount });
  }

  withDueDate(dueDate: Date): this {
    return this.with({ due_date: formatDbDate(dueDate) });
  }

  asActive(): this {
    return this.with({ status: 'active' });
  }

  asCompleted(): this {
    return this.with({ status: 'completed' });
  }

  asOverdue(): this {
    return this.with({ status: 'overdue' });
  }

  asCancelled(): this {
    return this.with({ status: 'cancelled' });
  }

  forBuilding(): this {
    return this.with({
      notes: 'Building fund pledge',
    });
  }

  forCapitalCampaign(): this {
    return this.with({
      notes: 'Capital campaign pledge',
      total_amount: this.generatePledgeAmount() * 2, // Larger for capital campaign
    });
  }
}
