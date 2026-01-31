# Quick Start Guide - MosqOS Seeding System

This guide will help you seed your database with test data in 5 minutes.

## Step 1: Install Dependencies ⚡

```bash
cd supabase/seeds
npm install
```

This installs:
- `@faker-js/faker` - Fake data generation
- `@supabase/supabase-js` - Supabase client
- `chalk` - Colored terminal output
- `commander` - CLI framework
- `date-fns` - Date manipulation
- `moment-hijri` - Islamic calendar
- `inquirer` - Interactive prompts
- `ora` - Spinners for progress
- `tsx` - TypeScript execution

## Step 2: Configure Supabase Connection 🔌

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
# For local development (default Supabase local setup)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Seeding configuration
SEED_HISTORICAL_YEARS=2
SEED_VERBOSE=true
```

**Where to find credentials:**

### Local Development (Supabase CLI)
```bash
# Start Supabase locally
npx supabase start

# Get service role key (look for "service_role key")
npx supabase status
```

### Hosted Supabase
1. Go to your project on https://supabase.com
2. Navigate to Settings → API
3. Copy "service_role" key (⚠️ Keep this secret!)

## Step 3: Run Your First Seed 🌱

**Option A: Interactive Mode (Recommended)**

```bash
npm run seed:interactive
```

This will ask you:
- Which scenario to seed (demo, small, medium, large)
- Whether to clean existing data first
- Whether to validate after seeding

**Option B: Direct Demo Seeding**

```bash
npm run seed:demo
```

This will:
1. Clean the database
2. Create 3 countries (US, Turkey, Germany)
3. Create 4 subscription plans
4. Create 3 organizations:
   - **Al-Noor Munich** (Small - 50 members)
   - **Green Lane Masjid** (Medium - 350 members)
   - **ICV Richmond** (Large - 1000 members)
5. Populate with:
   - Households and members
   - Funds and donations (24 months historical)
   - Courses
6. Validate data integrity

**Expected output:**

```
🌟 Starting Demo Showcase Seeding...

✔ Created 3 countries
✔ Created 4 subscription plans
✔ Created 3 organizations

📍 Seeding Al-Noor Munich (small)...

✔ Created 5 funds
✔ Created 12 households with 38 members
✔ Created 8 individual members
✔ Created 720 donations
✔ Updated fund balances
✔ Created 3 courses

... (repeats for each organization)

🔍 Running validation suite...

✔ Foreign key integrity check passed
✔ Record count validation passed
✔ Fund balance validation passed

✅ All validations passed!

✅ Demo showcase seeding completed!
```

## Step 4: Verify Data 🔍

**Check database directly:**

```bash
# If using Supabase local
npx supabase db dump --data-only | head -n 50

# Or connect with your SQL client
```

**Run validation:**

```bash
npm run seed:validate
```

**Expected data counts:**

| Table | Small Org | Medium Org | Large Org | Total |
|-------|-----------|------------|-----------|-------|
| Countries | - | - | - | 3 |
| Subscription Plans | - | - | - | 4 |
| Organizations | 1 | 1 | 1 | 3 |
| Members | 50 | 350 | 1000 | 1400 |
| Households | 12 | 85 | 180 | 277 |
| Funds | 5 | 5 | 10 | 20 |
| Donations | 720 | 7200 | 19200 | 27120 |
| Courses | 3 | 12 | 30 | 45 |

## Step 5: Explore Seeded Data 🔎

**Login credentials** (if you have auth setup):

Platform Admins (auto-created if you extend the seeding):
- Email: `admin@mosqos.com`
- Password: (set in your auth system)

**Sample organization slugs:**
- `al-noor-munich`
- `green-lane-masjid`
- `icv-richmond`

**URLs to test:**
```
http://localhost:5173/al-noor-munich/admin/dashboard
http://localhost:5173/green-lane-masjid/admin/members
http://localhost:5173/icv-richmond/admin/donations
```

## Common Commands 📜

```bash
# Interactive seeding
npm run seed:interactive

# Seed demo (3 organizations)
npm run seed:demo

# Clean all seeded data
npm run seed:clean

# Reset (clean + reseed)
npm run seed:reset

# Validate data integrity
npm run seed:validate

# Individual scenarios (not yet implemented)
npm run seed:small
npm run seed:medium
npm run seed:large
```

## Troubleshooting 🔧

### Error: "SUPABASE_SERVICE_ROLE_KEY is required"

**Solution:** Make sure `.env` file exists with proper credentials.

```bash
# Check if .env exists
ls -la .env

# If not, copy from example
cp .env.example .env

# Edit and add your key
nano .env
```

### Error: "relation does not exist"

**Solution:** Migrations not applied. Reset database:

```bash
# For local Supabase
npx supabase db reset

# For hosted Supabase
# Run migrations from Supabase dashboard
```

### Error: "foreign key constraint violation"

**Solution:** Seeding order is wrong. This shouldn't happen with the provided scenarios, but if you're creating custom scenarios, ensure dependencies are created first:

Order: Countries → Plans → Organizations → Households → Members → Funds → Donations

### Slow Performance

**Seeding 1000+ members takes time:**

- Small org (50 members): ~30 seconds
- Medium org (350 members): ~2 minutes
- Large org (1000 members): ~5 minutes

**Speed tips:**
- Use `--skip-validation` to save time during development
- Seed only what you need for testing
- Consider smaller custom scenarios

### Fund Balance Mismatch

**Solution:** Run validation to identify:

```bash
npm run seed:validate
```

The validation will show which funds have mismatched balances and correct values.

## Next Steps 🚀

1. **Explore the seeded data** in your application UI
2. **Test features** with realistic data
3. **Customize scenarios** by editing `scenarios/demo-showcase.ts`
4. **Add more factories** for modules you need (see IMPLEMENTATION_STATUS.md)
5. **Contribute** improvements back to the seeding system

## Tips 💡

- **Development workflow:** Use `npm run seed:reset` frequently to refresh data
- **Production:** NEVER run seeding against production database!
- **Custom data:** Extend factories in `factories/` for your needs
- **Validation:** Always run `npm run seed:validate` after custom scenarios
- **Clean often:** Old seed data can cause confusion - reset when in doubt

## Support 🆘

**Check these files for help:**
- `README.md` - Full documentation
- `IMPLEMENTATION_STATUS.md` - What's implemented
- `config.ts` - Configuration options
- `scenarios/demo-showcase.ts` - Example scenario code

**Common questions:**

**Q: Can I seed just one organization?**
A: Not yet with CLI, but you can create custom scenarios. See `scenarios/demo-showcase.ts` for examples.

**Q: How do I add my own data patterns?**
A: Edit `config.ts` and factory files in `factories/`.

**Q: Can I import real data?**
A: Not built-in yet, but you can create custom factories that read from CSV/JSON.

**Q: How do I reset without losing everything?**
A: `npm run seed:clean` only removes seeded data, not your own data (though it's safest to backup first).

---

**You're ready to go! Happy seeding! 🌱**

Run: `npm run seed:interactive`
