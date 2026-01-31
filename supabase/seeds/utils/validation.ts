/**
 * Validation Utilities
 * Check data integrity after seeding
 */

import { getSupabase, getRecordCount } from './database.js';
import chalk from 'chalk';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate foreign key integrity
 */
export async function validateForeignKeys(): Promise<ValidationResult> {
  const client = getSupabase();
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(chalk.blue('\n🔍 Validating foreign key integrity...'));

  // Check organizations have valid country codes
  const { data: orgsWithoutCountry } = await client
    .from('organizations')
    .select('id, name')
    .is('country_code', null);

  if (orgsWithoutCountry && orgsWithoutCountry.length > 0) {
    errors.push(`${orgsWithoutCountry.length} organizations without country code`);
  }

  // Check members have valid organization_id
  const { data: membersWithoutOrg } = await client
    .from('members')
    .select('id')
    .is('organization_id', null);

  if (membersWithoutOrg && membersWithoutOrg.length > 0) {
    errors.push(`${membersWithoutOrg.length} members without organization`);
  }

  // Check donations have valid fund_id
  const { data: donationsWithoutFund } = await client
    .from('donations')
    .select('id')
    .is('fund_id', null);

  if (donationsWithoutFund && donationsWithoutFund.length > 0) {
    errors.push(`${donationsWithoutFund.length} donations without fund`);
  }

  const passed = errors.length === 0;

  if (passed) {
    console.log(chalk.green('✓ Foreign key integrity check passed'));
  } else {
    console.log(chalk.red('✗ Foreign key integrity check failed'));
    errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
  }

  return { passed, errors, warnings };
}

/**
 * Validate record counts
 */
export async function validateRecordCounts(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(chalk.blue('\n📊 Validating record counts...'));

  const counts = {
    countries: await getRecordCount('countries'),
    subscription_plans: await getRecordCount('subscription_plans'),
    organizations: await getRecordCount('organizations'),
    members: await getRecordCount('members'),
    households: await getRecordCount('households'),
    funds: await getRecordCount('funds'),
    donations: await getRecordCount('donations'),
  };

  console.log(chalk.gray('Record counts:'));
  Object.entries(counts).forEach(([table, count]) => {
    console.log(chalk.gray(`  ${table}: ${count}`));
  });

  if (counts.countries < 1) {
    errors.push('No countries found');
  }

  if (counts.organizations < 1) {
    errors.push('No organizations found');
  }

  if (counts.members < 1) {
    warnings.push('No members found');
  }

  const passed = errors.length === 0;

  if (passed) {
    console.log(chalk.green('✓ Record count validation passed'));
  } else {
    console.log(chalk.red('✗ Record count validation failed'));
  }

  return { passed, errors, warnings };
}

/**
 * Validate fund balances
 */
export async function validateFundBalances(): Promise<ValidationResult> {
  const client = getSupabase();
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(chalk.blue('\n💰 Validating fund balances...'));

  const { data: funds } = await client
    .from('funds')
    .select('id, name, current_amount');

  if (!funds) {
    warnings.push('No funds to validate');
    return { passed: true, errors, warnings };
  }

  for (const fund of funds) {
    const { data: donations } = await client
      .from('donations')
      .select('amount')
      .eq('fund_id', fund.id)
      .eq('payment_status', 'completed');

    const totalDonations = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const diff = Math.abs(totalDonations - (fund.current_amount || 0));

    if (diff > 0.01) { // Allow for floating point errors
      errors.push(
        `Fund "${fund.name}" balance mismatch: recorded $${fund.current_amount}, actual $${totalDonations}`
      );
    }
  }

  const passed = errors.length === 0;

  if (passed) {
    console.log(chalk.green('✓ Fund balance validation passed'));
  } else {
    console.log(chalk.red('✗ Fund balance validation failed'));
    errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
  }

  return { passed, errors, warnings };
}

/**
 * Run all validations
 */
export async function validateAll(): Promise<boolean> {
  console.log(chalk.bold.blue('\n🔍 Running validation suite...\n'));

  const results = await Promise.all([
    validateForeignKeys(),
    validateRecordCounts(),
    validateFundBalances(),
  ]);

  const allPassed = results.every(r => r.passed);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log(chalk.bold('\n📋 Validation Summary:'));
  console.log(chalk.gray(`  Total Errors: ${totalErrors}`));
  console.log(chalk.gray(`  Total Warnings: ${totalWarnings}`));

  if (allPassed) {
    console.log(chalk.bold.green('\n✅ All validations passed!\n'));
  } else {
    console.log(chalk.bold.red('\n❌ Some validations failed!\n'));
  }

  return allPassed;
}
