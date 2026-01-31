/**
 * Main Seeding Entry Point
 * Orchestrates the entire seeding process
 */

import { config } from 'dotenv';
import { initializeSupabase, cleanDatabase } from './utils/database.js';
import { seedDemoShowcase } from './scenarios/demo-showcase.js';
import { validateAll } from './utils/validation.js';

// Load environment variables
config();

/**
 * Main seeding function
 */
export async function seed(options: {
  clean?: boolean;
  validate?: boolean;
  scenario?: 'demo' | 'small' | 'medium' | 'large';
} = {}) {
  const {
    clean = true,
    validate = true,
    scenario = 'demo',
  } = options;

  try {
    // Initialize Supabase client
    initializeSupabase();

    // Clean database if requested
    if (clean) {
      console.log('🧹 Cleaning database...');
      await cleanDatabase();
    }

    // Seed based on scenario
    console.log(`🌱 Seeding ${scenario} scenario...`);

    switch (scenario) {
      case 'demo':
        await seedDemoShowcase();
        break;
      case 'small':
        throw new Error('Small scenario not yet implemented');
      case 'medium':
        throw new Error('Medium scenario not yet implemented');
      case 'large':
        throw new Error('Large scenario not yet implemented');
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    // Validate if requested
    if (validate) {
      console.log('🔍 Validating data...');
      await validateAll();
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Export factories for programmatic use
 */
export { CountryFactory } from './factories/core/CountryFactory.js';
export { SubscriptionPlanFactory } from './factories/core/SubscriptionPlanFactory.js';
export { OrganizationFactory } from './factories/core/OrganizationFactory.js';
export { HouseholdFactory } from './factories/members/HouseholdFactory.js';
export { MemberFactory } from './factories/members/MemberFactory.js';
export { FundFactory } from './factories/donations/FundFactory.js';
export { DonationFactory } from './factories/donations/DonationFactory.js';
export { CourseFactory } from './factories/education/CourseFactory.js';

/**
 * Export utilities
 */
export { initializeSupabase, cleanDatabase, getSupabase } from './utils/database.js';
export { validateAll } from './utils/validation.js';

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
