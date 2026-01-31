/**
 * Fund Factory
 * Creates donation fund records
 */

import { BaseFactory } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';

type Fund = Database['public']['Tables']['funds']['Insert'];

export class FundFactory extends BaseFactory<Fund> {
  protected getTableName(): string {
    return 'funds';
  }

  protected async getDefaults(): Promise<Partial<Fund>> {
    return {
      organization_id: '', // Must be set
      name: 'General Fund',
      description: 'General mosque operating expenses',
      fund_type: 'general',
      goal_amount: null,
      current_amount: 0,
      is_active: true,
    };
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  withDescription(description: string): this {
    return this.with({ description });
  }

  withGoal(amount: number): this {
    return this.with({ goal_amount: amount });
  }

  withFundType(fundType: 'general' | 'zakat' | 'sadaqah' | 'building' | 'education' | 'emergency' | 'charity' | 'special'): this {
    return this.with({ fund_type: fundType });
  }

  static async createGeneralFund(organizationId: string): Promise<Fund> {
    return new FundFactory()
      .withOrganization(organizationId)
      .with({
        name: 'General Fund',
        description: 'General mosque operating expenses and utilities',
        fund_type: 'general',
      })
      .create();
  }

  static async createZakatFund(organizationId: string): Promise<Fund> {
    return new FundFactory()
      .withOrganization(organizationId)
      .with({
        name: 'Zakat Fund',
        description: 'Zakat donations for those in need',
        fund_type: 'zakat',
      })
      .create();
  }

  static async createBuildingFund(organizationId: string): Promise<Fund> {
    return new FundFactory()
      .withOrganization(organizationId)
      .with({
        name: 'Building Fund',
        description: 'Mosque expansion and renovation projects',
        fund_type: 'building',
        goal_amount: 500000,
      })
      .create();
  }

  static async createEducationFund(organizationId: string): Promise<Fund> {
    return new FundFactory()
      .withOrganization(organizationId)
      .with({
        name: 'Education Fund',
        description: 'Islamic education programs and scholarships',
        fund_type: 'education',
      })
      .create();
  }

  static async createSadaqahFund(organizationId: string): Promise<Fund> {
    return new FundFactory()
      .withOrganization(organizationId)
      .with({
        name: 'Sadaqah Jariyah',
        description: 'Ongoing charity projects',
        fund_type: 'sadaqah',
      })
      .create();
  }
}
