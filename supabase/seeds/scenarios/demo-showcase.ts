/**
 * Demo Showcase Scenario
 * Creates 3 organizations (small, medium, large) with comprehensive data
 */

import chalk from 'chalk';
import ora from 'ora';

// Core factories
import { CountryFactory } from '../factories/core/CountryFactory.js';
import { SubscriptionPlanFactory } from '../factories/core/SubscriptionPlanFactory.js';
import { OrganizationFactory } from '../factories/core/OrganizationFactory.js';

// Member factories
import { HouseholdFactory } from '../factories/members/HouseholdFactory.js';
import { MemberFactory } from '../factories/members/MemberFactory.js';

// Donation factories
import { FundFactory } from '../factories/donations/FundFactory.js';
import { DonationFactory } from '../factories/donations/DonationFactory.js';
import { RecurringDonationFactory } from '../factories/donations/RecurringDonationFactory.js';
import { PledgeFactory } from '../factories/donations/PledgeFactory.js';

// Education factories
import { CourseFactory } from '../factories/education/CourseFactory.js';
import { ClassroomFactory } from '../factories/education/ClassroomFactory.js';
import { TeacherFactory } from '../factories/education/TeacherFactory.js';
import { ScheduledClassFactory } from '../factories/education/ScheduledClassFactory.js';
import { EnrollmentFactory } from '../factories/education/EnrollmentFactory.js';
import { AttendanceFactory } from '../factories/education/AttendanceFactory.js';

// Cases factory
import { ServiceCaseFactory } from '../factories/cases/ServiceCaseFactory.js';

// Umrah factories
import { TripFactory } from '../factories/umrah/TripFactory.js';
import { TripRegistrationFactory } from '../factories/umrah/TripRegistrationFactory.js';

// Qurbani factories
import { QurbaniCampaignFactory } from '../factories/qurbani/QurbaniCampaignFactory.js';
import { QurbaniShareFactory } from '../factories/qurbani/QurbaniShareFactory.js';

// Islamic services factories
import { IslamicServiceTypeFactory } from '../factories/islamic-services/IslamicServiceTypeFactory.js';
import { IslamicServiceFactory } from '../factories/islamic-services/IslamicServiceFactory.js';

// Announcement factory
import { AnnouncementFactory } from '../factories/announcements/AnnouncementFactory.js';

// Config and generators
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
  recurringDonations: any[];
  pledges: any[];
  classrooms: any[];
  teachers: any[];
  scheduledClasses: any[];
  enrollments: any[];
  attendance: any[];
  cases: any[];
  trips: any[];
  tripRegistrations: any[];
  qurbaniCampaigns: any[];
  qurbaniShares: any[];
  serviceTypes: any[];
  islamicServices: any[];
  announcements: any[];
}

export async function seedDemoShowcase(): Promise<SeededData> {
  console.log(chalk.bold.blue('\n🌟 Starting Demo Showcase Seeding...\n'));

  const result: SeededData = {
    countries: [],
    plans: [],
    organizations: [],
    members: [],
    donations: [],
    recurringDonations: [],
    pledges: [],
    classrooms: [],
    teachers: [],
    scheduledClasses: [],
    enrollments: [],
    attendance: [],
    cases: [],
    trips: [],
    tripRegistrations: [],
    qurbaniCampaigns: [],
    qurbaniShares: [],
    serviceTypes: [],
    islamicServices: [],
    announcements: [],
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

  // Create recurring donations (20% of adult members)
  spinner = ora('Creating recurring donations...').start();
  const adultMembers = members.filter(m => {
    const age = m.date_of_birth ?
      Math.floor((Date.now() - new Date(m.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;
    return age >= 18;
  });
  const recurringDonorCount = Math.floor(adultMembers.length * 0.2);
  const recurringDonations: any[] = [];

  for (let i = 0; i < recurringDonorCount; i++) {
    const member = adultMembers[i % adultMembers.length];
    const fund = funds[Math.floor(Math.random() * funds.length)];

    const recurring = await new RecurringDonationFactory()
      .withOrganization(org.id)
      .withMember(member.id)
      .withFund(fund.id)
      .asActive()
      .create();

    recurringDonations.push(recurring);
  }
  spinner.succeed(`Created ${recurringDonations.length} recurring donations`);
  result.recurringDonations.push(...recurringDonations);

  // Create pledges (5-10% of members for building fund)
  spinner = ora('Creating pledges...').start();
  const buildingFund = funds.find(f => f.name === 'Building Fund') || funds[0];
  const pledgeCount = Math.floor(adultMembers.length * (0.05 + Math.random() * 0.05));
  const pledges: any[] = [];

  for (let i = 0; i < pledgeCount; i++) {
    const member = adultMembers[i % adultMembers.length];

    const pledge = await new PledgeFactory()
      .withOrganization(org.id)
      .withMember(member.id)
      .withFund(buildingFund.id)
      .forBuilding()
      .create();

    pledges.push(pledge);
  }
  spinner.succeed(`Created ${pledges.length} pledges`);
  result.pledges.push(...pledges);

  // Create courses
  spinner = ora(`Creating ${config.courses} courses...`).start();
  const courses: any[] = [];

  for (let i = 0; i < config.courses; i++) {
    const course = await new CourseFactory()
      .withOrganization(org.id)
      .create();
    courses.push(course);
  }
  spinner.succeed(`Created ${courses.length} courses`);

  // Create classrooms
  spinner = ora('Creating classrooms...').start();
  const classroomCount = Math.max(3, Math.floor(config.courses / 3));
  const classrooms: any[] = [];

  // Create main hall and dedicated rooms
  const mainHall = await new ClassroomFactory()
    .withOrganization(org.id)
    .asMainHall()
    .create();
  classrooms.push(mainHall);

  const youthRoom = await new ClassroomFactory()
    .withOrganization(org.id)
    .asYouthRoom()
    .create();
  classrooms.push(youthRoom);

  const virtualRoom = await new ClassroomFactory()
    .withOrganization(org.id)
    .asVirtual()
    .create();
  classrooms.push(virtualRoom);

  for (let i = 3; i < classroomCount; i++) {
    const classroom = await new ClassroomFactory()
      .withOrganization(org.id)
      .asPhysical()
      .create();
    classrooms.push(classroom);
  }
  spinner.succeed(`Created ${classrooms.length} classrooms`);
  result.classrooms.push(...classrooms);

  // Create teachers
  spinner = ora('Creating teachers...').start();
  const teacherCount = Math.max(2, Math.floor(config.courses / 2));
  const teachers: any[] = [];

  // Mix of volunteers and paid teachers
  for (let i = 0; i < teacherCount; i++) {
    let teacher;
    if (i < 2) {
      // First two are paid Quran teachers
      teacher = await new TeacherFactory()
        .withOrganization(org.id)
        .asQuranTeacher()
        .asPaid()
        .create();
    } else if (Math.random() < 0.7) {
      // 70% volunteers
      teacher = await new TeacherFactory()
        .withOrganization(org.id)
        .asVolunteer()
        .create();
    } else {
      // 30% paid
      teacher = await new TeacherFactory()
        .withOrganization(org.id)
        .asPaid()
        .create();
    }
    teachers.push(teacher);
  }
  spinner.succeed(`Created ${teachers.length} teachers`);
  result.teachers.push(...teachers);

  // Create scheduled classes
  spinner = ora('Creating scheduled classes...').start();
  const scheduledClasses: any[] = [];

  for (const course of courses) {
    const teacher = teachers[Math.floor(Math.random() * teachers.length)];
    const classroom = classrooms[Math.floor(Math.random() * classrooms.length)];

    // Most courses have an active class
    const scheduledClass = await new ScheduledClassFactory()
      .withOrganization(org.id)
      .withCourse(course.id)
      .withTeacher(teacher.id)
      .withClassroom(classroom.id)
      .onWeekend()
      .asActive()
      .create();

    scheduledClasses.push(scheduledClass);
  }
  spinner.succeed(`Created ${scheduledClasses.length} scheduled classes`);
  result.scheduledClasses.push(...scheduledClasses);

  // Create enrollments
  spinner = ora('Creating enrollments...').start();
  const enrollments: any[] = [];
  const childMembers = members.filter(m => {
    const age = m.date_of_birth ?
      Math.floor((Date.now() - new Date(m.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;
    return age >= 5 && age <= 18;
  });
  const adultStudents = adultMembers.slice(0, Math.floor(adultMembers.length * 0.1)); // 10% of adults take classes

  const students = [...childMembers, ...adultStudents];
  const enrollmentsPerClass = Math.floor(students.length / scheduledClasses.length);

  for (let i = 0; i < scheduledClasses.length; i++) {
    const scheduledClass = scheduledClasses[i];
    const classStudents = students.slice(
      i * enrollmentsPerClass,
      Math.min((i + 1) * enrollmentsPerClass, students.length)
    );

    for (const student of classStudents) {
      const enrollment = await new EnrollmentFactory()
        .withOrganization(org.id)
        .withScheduledClass(scheduledClass.id)
        .withMember(student.id)
        .asActive()
        .create();

      enrollments.push(enrollment);
    }
  }
  spinner.succeed(`Created ${enrollments.length} enrollments`);
  result.enrollments.push(...enrollments);

  // Create attendance records for past 2 months
  spinner = ora('Creating attendance records...').start();
  let attendanceCount = 0;

  for (const enrollment of enrollments.slice(0, Math.min(enrollments.length, 50))) {
    const attendanceRecords = await AttendanceFactory.createAttendanceHistory(
      org.id,
      enrollment.scheduled_class_id,
      enrollment.member_id,
      8 // 8 weeks of history
    );
    attendanceCount += attendanceRecords.length;
  }
  spinner.succeed(`Created ${attendanceCount} attendance records`);

  // Create service cases
  spinner = ora('Creating service cases...').start();
  const casesPerMonth = size === 'large' ? 60 : size === 'medium' ? 25 : 5;
  const caseCount = casesPerMonth * 3; // 3 months of cases
  const cases: any[] = [];

  for (let i = 0; i < caseCount; i++) {
    const randomMember = adultMembers[Math.floor(Math.random() * adultMembers.length)];

    let serviceCase;
    const caseType = Math.random();

    if (caseType < 0.35) {
      serviceCase = await new ServiceCaseFactory()
        .withOrganization(org.id)
        .withRequestor(randomMember.id)
        .asFinancialAssistance()
        .create();
    } else if (caseType < 0.60) {
      serviceCase = await new ServiceCaseFactory()
        .withOrganization(org.id)
        .withRequestor(randomMember.id)
        .asCounseling()
        .create();
    } else if (caseType < 0.75) {
      serviceCase = await new ServiceCaseFactory()
        .withOrganization(org.id)
        .withRequestor(randomMember.id)
        .asNewMuslimSupport()
        .create();
    } else {
      serviceCase = await new ServiceCaseFactory()
        .withOrganization(org.id)
        .withRequestor(randomMember.id)
        .create();
    }

    cases.push(serviceCase);
  }
  spinner.succeed(`Created ${cases.length} service cases`);
  result.cases.push(...cases);

  // Create Umrah trips
  spinner = ora('Creating Umrah trips...').start();
  const tripCount = size === 'large' ? 6 : size === 'medium' ? 3 : 1;
  const trips: any[] = [];
  const tripRegistrations: any[] = [];

  for (let i = 0; i < tripCount; i++) {
    let trip;
    if (i === 0) {
      // Current year open trip
      trip = await new TripFactory()
        .withOrganization(org.id)
        .asUmrah()
        .asOpen()
        .create();
    } else if (i === tripCount - 1) {
      // Hajj trip (only for larger orgs)
      trip = await new TripFactory()
        .withOrganization(org.id)
        .asHajj()
        .asCompleted()
        .create();
    } else {
      // Completed past trips
      trip = await new TripFactory()
        .withOrganization(org.id)
        .asUmrah()
        .asCompleted()
        .create();
    }
    trips.push(trip);

    // Create registrations for each trip
    const registrationsPerTrip = Math.floor(15 + Math.random() * 25);

    for (let j = 0; j < registrationsPerTrip; j++) {
      const pilgrim = adultMembers[Math.floor(Math.random() * adultMembers.length)];

      let registration;
      if (trip.status === 'completed') {
        registration = await new TripRegistrationFactory()
          .withOrganization(org.id)
          .withTrip(trip.id)
          .withMember(pilgrim.id)
          .asCompleted()
          .create();
      } else {
        registration = await new TripRegistrationFactory()
          .withOrganization(org.id)
          .withTrip(trip.id)
          .withMember(pilgrim.id)
          .asConfirmed()
          .create();
      }
      tripRegistrations.push(registration);
    }
  }
  spinner.succeed(`Created ${trips.length} trips with ${tripRegistrations.length} registrations`);
  result.trips.push(...trips);
  result.tripRegistrations.push(...tripRegistrations);

  // Create Qurbani campaigns
  spinner = ora('Creating Qurbani campaigns...').start();
  const qurbaniCampaigns: any[] = [];
  const qurbaniShares: any[] = [];

  // Current year campaign (open)
  const currentCampaign = await new QurbaniCampaignFactory()
    .withOrganization(org.id)
    .withYear(new Date().getFullYear())
    .asOpen()
    .create();
  qurbaniCampaigns.push(currentCampaign);

  // Past year campaign (completed)
  const pastCampaign = await new QurbaniCampaignFactory()
    .withOrganization(org.id)
    .withYear(new Date().getFullYear() - 1)
    .asCompleted()
    .create();
  qurbaniCampaigns.push(pastCampaign);

  // Create shares for each campaign
  for (const campaign of qurbaniCampaigns) {
    const sharesCount = size === 'large' ? 300 : size === 'medium' ? 120 : 25;
    const actualShares = campaign.status === 'completed' ? sharesCount : Math.floor(sharesCount * 0.6);

    for (let i = 0; i < actualShares; i++) {
      const member = members[Math.floor(Math.random() * members.length)];
      const isGuest = Math.random() < 0.3;

      let share;
      if (Math.random() < 0.6) {
        share = await new QurbaniShareFactory()
          .withOrganization(org.id)
          .withCampaign(campaign.id)
          .asSheep()
          .create();
      } else {
        share = await new QurbaniShareFactory()
          .withOrganization(org.id)
          .withCampaign(campaign.id)
          .asCowShare(Math.floor(Math.random() * 3) + 1)
          .create();
      }

      if (!isGuest) {
        share = await client
          .from('qurbani_shares')
          .update({ member_id: member.id })
          .eq('id', share.id)
          .select()
          .single()
          .then(r => r.data);
      }

      if (campaign.status === 'completed') {
        share = await client
          .from('qurbani_shares')
          .update({
            status: 'completed',
            payment_status: 'paid',
            processing_status: 'completed',
          })
          .eq('id', share.id)
          .select()
          .single()
          .then(r => r.data);
      }

      qurbaniShares.push(share);
    }
  }
  spinner.succeed(`Created ${qurbaniCampaigns.length} campaigns with ${qurbaniShares.length} shares`);
  result.qurbaniCampaigns.push(...qurbaniCampaigns);
  result.qurbaniShares.push(...qurbaniShares);

  // Create Islamic service types
  spinner = ora('Creating Islamic service types...').start();
  const serviceTypes = await IslamicServiceTypeFactory.createAllTypes(org.id);
  spinner.succeed(`Created ${serviceTypes.length} service types`);
  result.serviceTypes.push(...serviceTypes);

  // Create Islamic services
  spinner = ora('Creating Islamic services...').start();
  const islamicServices: any[] = [];
  const servicesCount = size === 'large' ? 50 : size === 'medium' ? 20 : 5;

  const nikahType = serviceTypes.find(t => t.slug === 'nikah');
  const janazahType = serviceTypes.find(t => t.slug === 'janazah');
  const shahadaType = serviceTypes.find(t => t.slug === 'shahada');
  const aqiqahType = serviceTypes.find(t => t.slug === 'aqiqah');

  for (let i = 0; i < servicesCount; i++) {
    const member = adultMembers[Math.floor(Math.random() * adultMembers.length)];

    let service;
    const serviceType = Math.random();

    if (serviceType < 0.4 && nikahType) {
      service = await new IslamicServiceFactory()
        .withOrganization(org.id)
        .withServiceType(nikahType.id)
        .withRequestor(member.id)
        .asNikah()
        .asCompleted()
        .create();
    } else if (serviceType < 0.6 && janazahType) {
      service = await new IslamicServiceFactory()
        .withOrganization(org.id)
        .withServiceType(janazahType.id)
        .withRequestor(member.id)
        .asJanazah()
        .asCompleted()
        .create();
    } else if (serviceType < 0.75 && shahadaType) {
      service = await new IslamicServiceFactory()
        .withOrganization(org.id)
        .withServiceType(shahadaType.id)
        .withRequestor(member.id)
        .asShahada()
        .asCompleted()
        .create();
    } else if (aqiqahType) {
      service = await new IslamicServiceFactory()
        .withOrganization(org.id)
        .withServiceType(aqiqahType.id)
        .withRequestor(member.id)
        .asAqiqah()
        .asCompleted()
        .create();
    }

    if (service) {
      islamicServices.push(service);
    }
  }
  spinner.succeed(`Created ${islamicServices.length} Islamic services`);
  result.islamicServices.push(...islamicServices);

  // Create announcements
  spinner = ora('Creating announcements...').start();
  const announcements: any[] = [];
  const announcementCount = size === 'large' ? 20 : size === 'medium' ? 12 : 5;

  for (let i = 0; i < announcementCount; i++) {
    let announcement;

    if (i < 3) {
      // First 3 are published and pinned
      announcement = await new AnnouncementFactory()
        .withOrganization(org.id)
        .asPublished()
        .asPinned()
        .create();
    } else if (i < announcementCount - 2) {
      // Most are just published
      announcement = await new AnnouncementFactory()
        .withOrganization(org.id)
        .asPublished()
        .create();
    } else {
      // Last 2 are scheduled
      announcement = await new AnnouncementFactory()
        .withOrganization(org.id)
        .asScheduled()
        .create();
    }

    announcements.push(announcement);
  }
  spinner.succeed(`Created ${announcements.length} announcements`);
  result.announcements.push(...announcements);

  console.log(chalk.green(`  ✓ ${org.name} seeding complete`));
}
