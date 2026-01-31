/**
 * Demo Showcase Scenario
 * Creates 3 organizations (small, medium, large) with comprehensive data
 */

import chalk from 'chalk';
import ora from 'ora';
import chalk from 'chalk';
import ora from 'ora';
import { CountryFactory } from '../factories/core/CountryFactory.js';
import { SubscriptionPlanFactory } from '../factories/core/SubscriptionPlanFactory.js';
import { OrganizationFactory } from '../factories/core/OrganizationFactory.js';
import { HouseholdFactory } from '../factories/members/HouseholdFactory.js';
import { MemberFactory } from '../factories/members/MemberFactory.js';
import { FundFactory } from '../factories/donations/FundFactory.js';
import { DonationFactory } from '../factories/donations/DonationFactory.js';
import { CourseFactory } from '../factories/education/CourseFactory.js';
import { ORGANIZATION_SIZES } from '../config.js';
import { generateFamily } from '../generators/names/muslim-names.js';
import { getHistoricalStartDate, randomDateBetween } from '../generators/temporal/date-ranges.js';
import { isRamadan } from '../generators/islamic/hijri-dates.js';
import { applyRamadanMultiplier } from '../generators/financial/donation-patterns.js';
import { getSupabase } from '../utils/database.js';

interface SeededData {
  countries: any[];
  plans: any[];
  organizations: any[];
  members: any[];
  donations: any[];
}

export async function seedDemoShowcase(): Promise<SeededData> {
  console.log(chalk.bold.blue('\n🌟 Starting Demo Showcase Seeding...\n'));

  const result: SeededData = {
    countries: [],
    plans: [],
    organizations: [],
    members: [],
    donations: [],
  };

  // Level 1: Countries & Subscription Plans
  let spinner = ora('Checking countries...').start();
  try {
    const client = getSupabase();
    const { data: existingCountries } = await client.from('countries').select('*');

    if (existingCountries && existingCountries.length > 0) {
      result.countries = existingCountries;
      spinner.succeed(`Found ${result.countries.length} existing countries`);
    } else {
      result.countries = await CountryFactory.createAll();
      spinner.succeed(`Created ${result.countries.length} countries`);
    }
  } catch (error) {
    spinner.fail('Failed to check/create countries');
    throw error;
  }

  spinner = ora('Checking subscription plans...').start();
  try {
    const client = getSupabase();
    const { data: existingPlans } = await client.from('subscription_plans').select('*');

    if (existingPlans && existingPlans.length > 0) {
      result.plans = existingPlans;
      spinner.succeed(`Found ${result.plans.length} existing subscription plans`);
    } else {
      result.plans = await SubscriptionPlanFactory.createAll();
      spinner.succeed(`Created ${result.plans.length} subscription plans`);
    }
  } catch (error) {
    spinner.fail('Failed to check/create subscription plans');
    throw error;
  }

  // Level 2: Organizations
  spinner = ora('Creating organizations...').start();
  try {
    const usCountry = result.countries.find(c => c.code === 'US')!;
    const deCountry = result.countries.find(c => c.code === 'DE')!;

    const greenLane = await OrganizationFactory.createGreenLaneMasjid(usCountry.id);
    const icvRichmond = await OrganizationFactory.createICVRichmond(usCountry.id);
    const alNoor = await OrganizationFactory.createAlNoorMunich(deCountry.id);

    result.organizations = [greenLane, icvRichmond, alNoor];
    spinner.succeed(`Created ${result.organizations.length} organizations`);
  } catch (error) {
    spinner.fail('Failed to create organizations');
    throw error;
  }

  // Level 3: Seed each organization
  for (const org of result.organizations) {
    const size = org.slug === 'al-noor-munich' ? 'small' :
                 org.slug === 'green-lane-masjid' ? 'medium' : 'large';

    console.log(chalk.bold.yellow(`\n📍 Seeding ${org.name} (${size})...\n`));

    await seedOrganization(org, size, result);
  }

  console.log(chalk.bold.green('\n✅ Demo showcase seeding completed!\n'));

  return result;
}

async function seedOrganization(
  org: any,
  size: 'small' | 'medium' | 'large',
  result: SeededData
): Promise<void> {
  const config = ORGANIZATION_SIZES[size];
  // Determine culture based on organization slug
  const culture = org.slug.includes('munich') ? 'german' : 'western';
  const countryCode = org.slug.includes('munich') ? 'DE' : 'US';

  // Create funds
  let spinner = ora('Creating funds...').start();
  const funds = await Promise.all([
    FundFactory.createGeneralFund(org.id),
    FundFactory.createZakatFund(org.id),
    FundFactory.createBuildingFund(org.id),
    FundFactory.createEducationFund(org.id),
    FundFactory.createSadaqahFund(org.id),
  ]);
  spinner.succeed(`Created ${funds.length} funds`);

  // Create households and members
  spinner = ora(`Creating ${config.households} households...`).start();
  const households = [];
  const members = [];

  for (let i = 0; i < config.households; i++) {
    const familySize = Math.floor(Math.random() * 4) + 2; // 2-5 members
    const family = generateFamily(familySize, culture);

    const household = await new HouseholdFactory()
      .withOrganization(org.id)
      .withName(`${family.familyName} Family`)
      .withCountry(countryCode)
      .create();

    households.push(household);

    // Create family members
    for (const familyMember of family.members) {
      const age = familyMember.firstName === family.members[0].firstName ?
        Math.floor(Math.random() * 30) + 35 : // Parent 35-64
        familyMember.firstName === family.members[1].firstName ?
        Math.floor(Math.random() * 30) + 30 : // Parent 30-59
        Math.floor(Math.random() * 18) + 1; // Child 1-18

      const member = await new MemberFactory()
        .withOrganization(org.id)
        .withHousehold(household.id)
        .withName(familyMember.firstName, family.familyName)
        .withGender(familyMember.gender)
        .withAge(age)
        .withMembershipType('family')
        .create();

      members.push(member);
    }

    if ((i + 1) % 10 === 0) {
      spinner.text = `Creating households... (${i + 1}/${config.households})`;
    }
  }

  spinner.succeed(`Created ${households.length} households with ${members.length} members`);

  // Create single members
  if (config.singles > 0) {
    spinner = ora(`Creating ${config.singles} individual members...`).start();

    for (let i = 0; i < config.singles; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const age = Math.floor(Math.random() * 47) + 19; // 19-65

      const member = await new MemberFactory()
        .withOrganization(org.id)
        .withGender(gender)
        .withAge(age)
        .withMembershipType('individual')
        .create();

      members.push(member);
    }

    spinner.succeed(`Created ${config.singles} individual members`);
  }

  result.members.push(...members);

  // Create historical donations
  spinner = ora('Creating donations...').start();
  const startDate = getHistoricalStartDate();
  const endDate = new Date();
  const monthlyDonations = config.donationsPerMonth;
  const totalMonths = 24; // 2 years

  let donationCount = 0;

  for (let month = 0; month < totalMonths; month++) {
    const monthStart = new Date(startDate);
    monthStart.setMonth(monthStart.getMonth() + month);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    let donationsThisMonth = monthlyDonations;

    // Apply Ramadan multiplier
    if (isRamadan(monthStart)) {
      donationsThisMonth = applyRamadanMultiplier(monthlyDonations);
    }

    for (let i = 0; i < donationsThisMonth; i++) {
      const randomDate = randomDateBetween(monthStart, monthEnd);
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const randomFund = funds[Math.floor(Math.random() * funds.length)];

      // 30% anonymous donations
      const isAnonymous = Math.random() < 0.3;

      await new DonationFactory()
        .withOrganization(org.id)
        .withFund(randomFund.id)
        .withMember(isAnonymous ? null : randomMember.id)
        .withDate(randomDate)
        .create();

      donationCount++;
    }

    if ((month + 1) % 6 === 0) {
      spinner.text = `Creating donations... (${donationCount} so far)`;
    }
  }

  spinner.succeed(`Created ${donationCount} donations`);
  result.donations.push(...Array(donationCount));

  // Update fund balances
  spinner = ora('Updating fund balances...').start();
  const client = getSupabase();

  for (const fund of funds) {
    const { data: donations } = await client
      .from('donations')
      .select('amount')
      .eq('fund_id', fund.id)
      .eq('status', 'completed');

    const total = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;

    await client
      .from('funds')
      .update({ current_amount: total })
      .eq('id', fund.id);
  }

  spinner.succeed('Updated fund balances');

  // Create courses
  spinner = ora(`Creating ${config.courses} courses...`).start();

  for (let i = 0; i < config.courses; i++) {
    await new CourseFactory()
      .withOrganization(org.id)
      .create();
  }

  spinner.succeed(`Created ${config.courses} courses`);
}
