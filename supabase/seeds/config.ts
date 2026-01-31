/**
 * Seeding Configuration
 * Central configuration for all seeding scenarios
 */

export const ORGANIZATION_SIZES = {
  small: {
    members: 50,
    households: 12,
    singles: 8,
    funds: 5,
    donationsPerMonth: 30,
    courses: 3,
    enrollments: 20,
    casesPerMonth: 5,
    qurbaniShares: 25,
    umrahTripsPerYear: 1,
  },
  medium: {
    members: 350,
    households: 85,
    singles: 50,
    funds: 5,
    donationsPerMonth: 300,
    courses: 12,
    enrollments: 150,
    casesPerMonth: 25,
    qurbaniShares: 120,
    umrahTripsPerYear: 2,
  },
  large: {
    members: 1000,
    households: 180,
    singles: 90,
    funds: 10,
    donationsPerMonth: 800,
    courses: 30,
    enrollments: 400,
    casesPerMonth: 60,
    qurbaniShares: 300,
    umrahTripsPerYear: 5,
  },
} as const;

export const DONATION_PATTERNS = {
  // Pareto distribution (80/20 rule)
  amountDistribution: [
    { range: [5, 50], weight: 60 },
    { range: [50, 500], weight: 30 },
    { range: [500, 5000], weight: 9 },
    { range: [5000, 10000], weight: 1 },
  ],
  // Ramadan multiplier
  ramadanMultiplier: 3,
  // Friday multiplier
  fridayMultiplier: 1.3,
  // Recurring donation percentage
  recurringPercentage: 20,
  // Fund distribution
  fundDistribution: {
    general: 50,
    zakat: 25,
    building: 15,
    education: 10,
  },
  // Payment methods
  paymentMethods: {
    card: 60,
    cash: 25,
    bank_transfer: 15,
  },
} as const;

export const EDUCATION_PATTERNS = {
  courseTypes: {
    quran: 40,
    arabic: 25,
    islamic_studies: 20,
    fiqh: 15,
  },
  schedules: {
    weekend_morning: 60,
    weeknight: 30,
    sunday_afternoon: 10,
  },
  attendanceRates: {
    excellent: { rate: 0.95, weight: 40 },
    good: { rate: 0.80, weight: 35 },
    average: { rate: 0.60, weight: 20 },
    poor: { rate: 0.40, weight: 5 },
  },
  ageGroups: {
    kids: { range: [6, 12], weight: 45 },
    youth: { range: [13, 18], weight: 30 },
    adults: { range: [19, 65], weight: 25 },
  },
} as const;

export const UMRAH_PATTERNS = {
  timing: {
    ramadan: { months: [8, 9], price: 3500 },
    winter: { months: [11, 12, 1, 2], price: 2800 },
    dhul_hijjah: { months: [11, 12], price: 4200 },
  },
  groupSize: { min: 15, max: 40 },
  paymentTypes: {
    full_upfront: 30,
    deposit_balance: 55,
    installments: 15,
  },
  roomTypes: {
    double: 55,
    triple: 25,
    quad: 15,
    single: 5,
  },
} as const;

export const QURBANI_PATTERNS = {
  animals: {
    sheep: 60,
    cow_share: 35,
    camel_share: 5,
  },
  distribution: {
    local_pickup: 45,
    full_charity: 35,
    overseas: 15,
    hybrid: 5,
  },
  // Most register in first 2 weeks of Dhul Hijjah
  registrationPattern: {
    week1: 50,
    week2: 30,
    week3: 15,
    week4: 5,
  },
} as const;

export const CASE_PATTERNS = {
  types: {
    financial_assistance: 35,
    counseling: 25,
    new_muslim_support: 15,
    family_mediation: 10,
    legal_assistance: 10,
    other: 5,
  },
  priorities: {
    low: 25,
    medium: 50,
    high: 20,
    urgent: 5,
  },
  resolutionTime: {
    fast: { days: 7, weight: 25 },
    normal: { days: 30, weight: 50 },
    slow: { days: 90, weight: 20 },
    very_slow: { days: 180, weight: 5 },
  },
} as const;

export const MEMBER_PATTERNS = {
  ageDistribution: {
    children: { range: [0, 12], weight: 25 },
    youth: { range: [13, 18], weight: 15 },
    young_adults: { range: [19, 35], weight: 25 },
    middle_age: { range: [36, 55], weight: 25 },
    seniors: { range: [56, 85], weight: 10 },
  },
  genderRatio: {
    male: 48,
    female: 52,
  },
  membershipTypes: {
    family: 60,
    individual: 30,
    student: 10,
  },
} as const;

export const TEMPORAL_CONFIG = {
  historicalYears: 2,
  futureMonths: 3,
  // Islamic calendar special months
  ramadanMonth: 9,
  dhulHijjahMonth: 12,
} as const;

export const MULTI_LANGUAGE = {
  languages: ['en', 'ar', 'tr'] as const,
  rtlLanguages: ['ar'] as const,
} as const;

export const PLATFORM_CONFIG = {
  countries: [
    { code: 'US', name: 'United States', currency: 'USD', language: 'en' },
    { code: 'TR', name: 'Turkey', currency: 'TRY', language: 'tr' },
    { code: 'DE', name: 'Germany', currency: 'EUR', language: 'en' },
  ],
  subscriptionPlans: [
    { name: 'Free', price: 0, max_members: 50 },
    { name: 'Basic', price: 49, max_members: 200 },
    { name: 'Pro', price: 99, max_members: 500 },
    { name: 'Enterprise', price: 199, max_members: null },
  ],
  sampleOrganizations: [
    {
      name: 'Green Lane Masjid',
      slug: 'green-lane-masjid',
      country: 'US',
      size: 'medium' as const,
      city: 'Houston',
      state: 'TX',
    },
    {
      name: 'ICV Richmond',
      slug: 'icv-richmond',
      country: 'US',
      size: 'large' as const,
      city: 'Richmond',
      state: 'VA',
    },
    {
      name: 'Al-Noor Munich',
      slug: 'al-noor-munich',
      country: 'DE',
      size: 'small' as const,
      city: 'Munich',
      state: 'Bavaria',
    },
  ],
} as const;
