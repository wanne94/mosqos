# MosqOS Seeding System

Comprehensive data seeding system for populating the MosqOS platform with realistic test data.

## Features

- ✅ Multi-tenant organizations (small, medium, large)
- ✅ Realistic Muslim names and cultural data
- ✅ Pareto distribution for donations ($10-$10,000)
- ✅ Ramadan & Friday donation spikes
- ✅ Historical data (2 years back)
- ✅ Multi-language support (en, ar, tr)
- ✅ Hijri calendar integration
- ✅ Data validation suite
- ✅ CLI interface with interactive mode

## Quick Start

### 1. Install Dependencies

```bash
cd supabase/seeds
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and set your Supabase credentials:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Seeding

**Interactive Mode (Recommended):**
```bash
npm run seed:interactive
```

**Pre-defined Scenarios:**
```bash
# Demo showcase (3 organizations)
npm run seed:demo

# Single organization scenarios (coming soon)
npm run seed:small
npm run seed:medium
npm run seed:large
```

**Maintenance:**
```bash
# Clean all seeded data
npm run seed:clean

# Reset (clean + reseed demo)
npm run seed:reset

# Validate data integrity
npm run seed:validate
```

## CLI Commands

### Interactive Mode
```bash
npm run seed:interactive
```

Launches an interactive wizard that guides you through:
- Choosing a scenario
- Cleaning existing data
- Running validation

### Demo Scenario
```bash
npm run seed:demo [options]
```

Creates 3 organizations:
- **Al-Noor Munich** (Small): 50 members, 5 funds, 3 courses
- **Green Lane Masjid** (Medium): 350 members, 5 funds, 12 courses
- **ICV Richmond** (Large): 1000 members, 10 funds, 30 courses

Options:
- `--skip-clean`: Don't clean database before seeding
- `--skip-validation`: Don't validate after seeding

### Clean Database
```bash
npm run seed:clean
```

Removes all seeded data (prompts for confirmation).

Use `--force` to skip confirmation:
```bash
npm run seed:clean --force
```

### Reset Database
```bash
npm run seed:reset
```

Cleans database and reseeds demo scenario (equivalent to `clean` + `demo`).

### Validate Data
```bash
npm run seed:validate
```

Runs validation checks on existing data:
- Foreign key integrity
- Record counts
- Fund balance accuracy

## What Gets Seeded

### Demo Scenario

**Foundation (Shared Across All Orgs):**
- 3 countries (US, Turkey, Germany)
- 4 subscription plans (Free, Basic, Pro, Enterprise)

**Per Organization:**

| Feature | Small | Medium | Large |
|---------|-------|--------|-------|
| Members | 50 | 350 | 1,000 |
| Households | 12 | 85 | 180 |
| Single Members | 8 | 50 | 90 |
| Funds | 5 | 5 | 10 |
| Donations/Month | 30 | 300 | 800 |
| Courses | 3 | 12 | 30 |
| Historical Data | 24 months | 24 months | 24 months |

**Donation Patterns:**
- Pareto distribution: 60% small ($5-50), 30% medium ($50-500), 9% large ($500-5000), 1% major ($5000+)
- Ramadan spike: 3x normal volume
- Friday bonus: 1.3x normal volume
- Payment methods: 60% card, 25% cash, 15% bank transfer

**Member Demographics:**
- Realistic age distribution (children, youth, adults, seniors)
- Family households with 2-5 members
- Culturally authentic names (Arabic, Turkish, German)
- Individual members (students, young professionals)

**Education:**
- Course types: Quran (40%), Arabic (25%), Islamic Studies (20%), Fiqh (15%)
- Difficulty levels: Beginner, Intermediate, Advanced

## Architecture

### Directory Structure

```
supabase/seeds/
├── cli.ts                  # CLI interface
├── index.ts                # Main entry point
├── config.ts               # Configuration constants
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── README.md               # This file
│
├── factories/              # Data factories
│   ├── base/
│   │   └── BaseFactory.ts  # Abstract factory
│   ├── core/
│   │   ├── CountryFactory.ts
│   │   ├── SubscriptionPlanFactory.ts
│   │   └── OrganizationFactory.ts
│   ├── members/
│   │   ├── HouseholdFactory.ts
│   │   └── MemberFactory.ts
│   ├── donations/
│   │   ├── FundFactory.ts
│   │   └── DonationFactory.ts
│   └── education/
│       └── CourseFactory.ts
│
├── generators/             # Data generators
│   ├── names/
│   │   └── muslim-names.ts
│   ├── addresses/
│   │   ├── us-addresses.ts
│   │   ├── turkey-addresses.ts
│   │   └── germany-addresses.ts
│   ├── islamic/
│   │   └── hijri-dates.ts
│   ├── financial/
│   │   └── donation-patterns.ts
│   └── temporal/
│       └── date-ranges.ts
│
├── scenarios/              # Seeding scenarios
│   └── demo-showcase.ts
│
└── utils/                  # Utilities
    ├── database.ts         # Supabase client
    └── validation.ts       # Validation suite
```

### Factory Pattern

All factories extend `BaseFactory<T>` and support fluent interface:

```typescript
const member = await new MemberFactory()
  .withOrganization(orgId)
  .withHousehold(householdId)
  .asMale()
  .withAge(35)
  .create();
```

Common methods:
- `.with(attrs)` - Set custom attributes
- `.create()` - Build and save record
- `.make()` - Build without saving
- `.createMany(count)` - Create multiple records

### Generators

Generators provide realistic data:

**Names:**
- `generateMaleName(culture)` - Muslim male names
- `generateFemaleName(culture)` - Muslim female names
- `generateFamilyName(culture)` - Culturally appropriate last names
- `generateFamily(size, culture)` - Complete family unit

**Addresses:**
- `generateUSAddress()` - US addresses with realistic cities
- `generateTurkeyAddress()` - Turkish addresses
- `generateGermanyAddress()` - German addresses

**Financial:**
- `generateDonationAmount()` - Pareto-distributed amounts
- `generateRecurringAmount()` - Monthly subscription amounts
- `getDonationType()` - Zakat vs Sadaqah
- `getPaymentMethod()` - Card, cash, or bank transfer

**Temporal:**
- `getHistoricalStartDate()` - 2 years ago
- `randomDateBetween(start, end)` - Random date in range
- `generateMonthlyDates(start, end)` - Monthly intervals

**Islamic:**
- `isRamadan(date)` - Check if date is in Ramadan
- `isDhulHijjah(date)` - Check if date is in Dhul Hijjah
- `getRamadanDates(year)` - Ramadan start/end dates
- `getDhulHijjahDates(year)` - Dhul Hijjah dates
- `getFridays(start, end)` - All Fridays in range

## Validation

The validation suite checks:

1. **Foreign Key Integrity**
   - All organizations have valid country codes
   - All members belong to existing organizations
   - All donations reference valid funds

2. **Record Counts**
   - Minimum expected records exist
   - Tables are not empty

3. **Business Logic**
   - Fund balances match donation totals
   - No future dates for completed items
   - Attendance records only for enrolled students

Run validation:
```bash
npm run seed:validate
```

## Extending

### Adding New Factories

1. Create factory in `factories/<module>/`:

```typescript
import { BaseFactory } from '../base/BaseFactory.js';

export class MyFactory extends BaseFactory<MyType> {
  protected getTableName(): string {
    return 'my_table';
  }

  protected async getDefaults(): Promise<Partial<MyType>> {
    return {
      // Default values
    };
  }

  // Custom methods
  withCustomField(value: any): this {
    return this.with({ custom_field: value });
  }
}
```

2. Export from `index.ts`
3. Use in scenarios

### Adding New Scenarios

Create file in `scenarios/<name>.ts`:

```typescript
export async function seedMyScenario(): Promise<void> {
  // 1. Create foundation data
  const countries = await CountryFactory.createAll();

  // 2. Create organizations
  const org = await OrganizationFactory.create();

  // 3. Seed organization-specific data
  // ...
}
```

Add CLI command in `cli.ts`.

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is required"
Make sure `.env` file exists with proper credentials.

### "Error creating <table>"
Check Supabase migrations are applied. Run:
```bash
npx supabase db reset
```

### "Foreign key violation"
Ensure seeding order respects dependencies. Check `scenarios/demo-showcase.ts` for proper order.

### "Fund balance mismatch"
Run `npm run seed:validate` to identify issues. May need to manually update fund balances.

## Tips

- **First time:** Use `npm run seed:interactive` for guided experience
- **Development:** Use `npm run seed:reset` to quickly reset data
- **Production:** Never run against production database!
- **Performance:** Large scenarios (1000+ members) may take 2-3 minutes
- **Validation:** Always run validation after seeding to catch issues early

## License

MIT - Part of MosqOS platform
