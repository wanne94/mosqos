/**
 * Subscription Plan Factory
 * Creates subscription tier records
 */

import { BaseFactory } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Insert'];

export class SubscriptionPlanFactory extends BaseFactory<SubscriptionPlan> {
  protected getTableName(): string {
    return 'subscription_plans';
  }

  protected async getDefaults(): Promise<Partial<SubscriptionPlan>> {
    return {
      name: 'Basic',
      slug: 'basic',
      description: 'Perfect for small communities',
      monthly_price: 49,
      annual_price: 490,
      max_members: 200,
      max_storage_gb: 10,
      features: {
        members: true,
        donations: true,
        education: false,
        cases: false,
        umrah: false,
        qurbani: false,
        reports: 'basic',
      },
      is_active: true,
      trial_days: 14,
    };
  }

  static async createFree(): Promise<SubscriptionPlan> {
    return new SubscriptionPlanFactory()
      .with({
        name: 'Free',
        slug: 'free',
        description: 'Get started with basic features',
        monthly_price: 0,
        annual_price: 0,
        max_members: 50,
        max_storage_gb: 1,
        features: {
          members: true,
          donations: true,
          education: false,
          cases: false,
          umrah: false,
          qurbani: false,
          reports: 'none',
        },
        is_active: true,
        trial_days: 0,
      })
      .create();
  }

  static async createBasic(): Promise<SubscriptionPlan> {
    return new SubscriptionPlanFactory()
      .with({
        name: 'Basic',
        slug: 'basic',
        description: 'Perfect for small communities',
        monthly_price: 49,
        annual_price: 490,
        max_members: 200,
        max_storage_gb: 10,
        features: {
          members: true,
          donations: true,
          education: true,
          cases: false,
          umrah: false,
          qurbani: false,
          reports: 'basic',
        },
        is_active: true,
        trial_days: 14,
      })
      .create();
  }

  static async createPro(): Promise<SubscriptionPlan> {
    return new SubscriptionPlanFactory()
      .with({
        name: 'Pro',
        slug: 'pro',
        description: 'Advanced features for growing communities',
        monthly_price: 99,
        annual_price: 990,
        max_members: 500,
        max_storage_gb: 50,
        features: {
          members: true,
          donations: true,
          education: true,
          cases: true,
          umrah: true,
          qurbani: true,
          reports: 'advanced',
        },
        is_active: true,
        trial_days: 14,
      })
      .create();
  }

  static async createEnterprise(): Promise<SubscriptionPlan> {
    return new SubscriptionPlanFactory()
      .with({
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Unlimited features for large organizations',
        monthly_price: 199,
        annual_price: 1990,
        max_members: null,
        max_storage_gb: 500,
        features: {
          members: true,
          donations: true,
          education: true,
          cases: true,
          umrah: true,
          qurbani: true,
          reports: 'premium',
          api_access: true,
          priority_support: true,
        },
        is_active: true,
        trial_days: 30,
      })
      .create();
  }

  static async createAll(): Promise<SubscriptionPlan[]> {
    const plans = await Promise.all([
      SubscriptionPlanFactory.createFree(),
      SubscriptionPlanFactory.createBasic(),
      SubscriptionPlanFactory.createPro(),
      SubscriptionPlanFactory.createEnterprise(),
    ]);

    return plans;
  }
}
