/**
 * Donation Factory
 * Creates one-time donation records
 */

import { BaseFactory, pickRandom } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { generateDonationAmount, getDonationType, getPaymentMethod } from '../../generators/financial/donation-patterns.js';
import { formatDbDate, formatDbDateTime } from '../../generators/temporal/date-ranges.js';

type Donation = Database['public']['Tables']['donations']['Insert'];

export class DonationFactory extends BaseFactory<Donation> {
  protected getTableName(): string {
    return 'donations';
  }

  protected async getDefaults(): Promise<Partial<Donation>> {
    const amount = generateDonationAmount();
    const donationType = getDonationType();
    const paymentMethod = getPaymentMethod();

    return {
      organization_id: '', // Must be set
      fund_id: '', // Must be set
      member_id: null,
      amount,
      payment_method: paymentMethod,
      status: 'completed',
      donation_type: 'one_time',
      donation_date: formatDbDate(new Date()),
      notes: null,
    };
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withFund(fundId: string): this {
    return this.with({ fund_id: fundId });
  }

  withMember(memberId: string): this {
    return this.with({ member_id: memberId });
  }

  withAmount(amount: number): this {
    return this.with({ amount });
  }

  withDate(date: Date): this {
    return this.with({ donation_date: formatDbDate(date) });
  }

  withPaymentMethod(method: 'card' | 'cash' | 'bank_transfer'): this {
    return this.with({ payment_method: method });
  }

  asZakat(): this {
    return this.with({ donation_type: 'zakat' });
  }

  asSadaqah(): this {
    return this.with({ donation_type: 'sadaqah' });
  }

  asAnonymous(): this {
    return this.with({ member_id: null });
  }
}
