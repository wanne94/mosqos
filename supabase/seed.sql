-- ============================================
-- MOSQUE SAAS - SEED DATA
-- ============================================
-- Purpose: Populate database with realistic test data
-- ============================================

BEGIN;

-- ============================================
-- 1. COUNTRIES
-- ============================================
INSERT INTO public.countries (id, code, name, name_native, currency_code, currency_symbol, timezone, locale, date_format, hijri_enabled, prayer_calculation_method, is_active)
VALUES
    (gen_random_uuid(), 'BA', 'Bosnia and Herzegovina', 'Bosna i Hercegovina', 'BAM', 'KM', 'Europe/Sarajevo', 'bs-BA', 'DD.MM.YYYY', true, 'MWL', true),
    (gen_random_uuid(), 'TR', 'Turkey', 'Türkiye', 'TRY', '₺', 'Europe/Istanbul', 'tr-TR', 'DD.MM.YYYY', true, 'Turkey', true),
    (gen_random_uuid(), 'US', 'United States', 'United States', 'USD', '$', 'America/New_York', 'en-US', 'MM/DD/YYYY', true, 'ISNA', true),
    (gen_random_uuid(), 'DE', 'Germany', 'Deutschland', 'EUR', '€', 'Europe/Berlin', 'de-DE', 'DD.MM.YYYY', true, 'MWL', true),
    (gen_random_uuid(), 'GB', 'United Kingdom', 'United Kingdom', 'GBP', '£', 'Europe/London', 'en-GB', 'DD/MM/YYYY', true, 'MWL', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    timezone = EXCLUDED.timezone,
    locale = EXCLUDED.locale,
    date_format = EXCLUDED.date_format;

-- ============================================
-- 2. SUBSCRIPTION PLANS (already seeded in migration)
-- ============================================
-- Plans are created in migration 00005

-- ============================================
-- 3. TEST ORGANIZATIONS
-- ============================================
INSERT INTO public.organizations (id, name, slug, country_id, contact_email, contact_phone, address_line1, city, postal_code, website, settings, is_active)
SELECT
    gen_random_uuid(),
    'Begova Džamija',
    'begova-dzamija',
    (SELECT id FROM public.countries WHERE code = 'BA' LIMIT 1),
    'info@begova.ba',
    '+387 33 123 456',
    'Sarači 25',
    'Sarajevo',
    '71000',
    'https://begova.ba',
    '{"defaultLanguage": "bs", "hijriPrimary": true, "enabledModules": ["members", "donations", "education"]}'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'begova-dzamija');

INSERT INTO public.organizations (id, name, slug, country_id, contact_email, contact_phone, address_line1, city, postal_code, website, settings, is_active)
SELECT
    gen_random_uuid(),
    'Green Lane Masjid',
    'green-lane-masjid',
    (SELECT id FROM public.countries WHERE code = 'GB' LIMIT 1),
    'info@greenlanemasjid.org',
    '+44 121 773 0033',
    '739-751 Green Lane',
    'Birmingham',
    'B9 5BU',
    'https://greenlanemasjid.org',
    '{"defaultLanguage": "en", "hijriPrimary": false, "enabledModules": ["members", "donations", "education", "umrah"]}'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'green-lane-masjid');

INSERT INTO public.organizations (id, name, slug, country_id, contact_email, contact_phone, address_line1, city, postal_code, website, settings, is_active)
SELECT
    gen_random_uuid(),
    'Istanbul Islamic Center',
    'istanbul-islamic-center',
    (SELECT id FROM public.countries WHERE code = 'TR' LIMIT 1),
    'info@istanbulcenter.tr',
    '+90 212 555 1234',
    'Sultanahmet Mahallesi',
    'Istanbul',
    '34122',
    'https://istanbulcenter.tr',
    '{"defaultLanguage": "tr", "hijriPrimary": true, "enabledModules": ["members", "donations", "education"]}'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'istanbul-islamic-center');

-- ============================================
-- 4. ORGANIZATION SUBSCRIPTIONS
-- ============================================
INSERT INTO public.organization_subscriptions (
    id, organization_id, plan_id, status,
    current_period_start, current_period_end,
    billing_cycle, trial_start, trial_ends_at
)
SELECT
    gen_random_uuid(),
    o.id,
    (SELECT id FROM public.subscription_plans WHERE slug = 'basic' LIMIT 1),
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    'monthly',
    NULL,
    NULL
FROM public.organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_subscriptions
    WHERE organization_id = o.id
);

-- ============================================
-- 5. TEST HOUSEHOLDS
-- ============================================
-- Create 5 households per organization
DO $$
DECLARE
    org_record RECORD;
    household_id UUID;
    i INTEGER;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations LOOP
        FOR i IN 1..5 LOOP
            household_id := gen_random_uuid();

            INSERT INTO public.households (
                id, organization_id, name, address, city, zip_code,
                phone, email, notes
            ) VALUES (
                household_id,
                org_record.id,
                CASE i
                    WHEN 1 THEN 'Ahmed Family'
                    WHEN 2 THEN 'Hassan Family'
                    WHEN 3 THEN 'Yusuf Family'
                    WHEN 4 THEN 'Ibrahim Family'
                    ELSE 'Omar Family'
                END,
                i || ' Main Street',
                'Test City',
                '12345',
                '+1234567890' || i,
                'family' || i || '@test.com',
                'Test household ' || i
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 6. TEST MEMBERS
-- ============================================
-- Create 10 members per organization
DO $$
DECLARE
    org_record RECORD;
    member_id UUID;
    i INTEGER;
    first_names TEXT[] := ARRAY['Ahmed', 'Fatima', 'Hassan', 'Aisha', 'Yusuf', 'Maryam', 'Ibrahim', 'Zainab', 'Omar', 'Khadija'];
    last_names TEXT[] := ARRAY['Abdullah', 'Rahman', 'Ali', 'Hussein', 'Khan'];
BEGIN
    FOR org_record IN SELECT id FROM public.organizations LOOP
        FOR i IN 1..10 LOOP
            member_id := gen_random_uuid();

            INSERT INTO public.members (
                id, organization_id,
                first_name, last_name, email, phone,
                gender, date_of_birth,
                membership_type, membership_status
            ) VALUES (
                member_id,
                org_record.id,
                first_names[((i - 1) % 10) + 1],
                last_names[((i - 1) % 5) + 1],
                'member' || i || '@test.com',
                '+1234567' || LPAD(i::TEXT, 4, '0'),
                CASE (i % 2) WHEN 0 THEN 'male' ELSE 'female' END,
                CURRENT_DATE - INTERVAL '30 years' + (i * INTERVAL '2 years'),
                CASE (i % 4)
                    WHEN 0 THEN 'individual'
                    WHEN 1 THEN 'student'
                    WHEN 2 THEN 'senior'
                    ELSE 'family'
                END,
                'active'
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 7. DONATION FUNDS
-- ============================================
-- Create default funds for each organization
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations LOOP
        -- General Fund
        INSERT INTO public.funds (
            id, organization_id, name, description, fund_type,
            goal_amount, is_active
        ) VALUES (
            gen_random_uuid(),
            org_record.id,
            'General Fund',
            'Unrestricted donations for general mosque operations',
            'general',
            50000,
            true
        );

        -- Zakat Fund
        INSERT INTO public.funds (
            id, organization_id, name, description, fund_type,
            goal_amount, is_active
        ) VALUES (
            gen_random_uuid(),
            org_record.id,
            'Zakat Fund',
            'Zakat donations for those in need',
            'zakat',
            30000,
            true
        );

        -- Building Fund
        INSERT INTO public.funds (
            id, organization_id, name, description, fund_type,
            goal_amount, is_active
        ) VALUES (
            gen_random_uuid(),
            org_record.id,
            'Building Fund',
            'Fundraising for mosque expansion',
            'building',
            200000,
            true
        );

        -- Education Fund
        INSERT INTO public.funds (
            id, organization_id, name, description, fund_type,
            goal_amount, is_active
        ) VALUES (
            gen_random_uuid(),
            org_record.id,
            'Education Fund',
            'Supporting Islamic education programs',
            'education',
            20000,
            true
        );
    END LOOP;
END $$;

-- ============================================
-- 8. DONATIONS
-- ============================================
-- Create 30 donations per organization
DO $$
DECLARE
    org_record RECORD;
    fund_record RECORD;
    member_record RECORD;
    i INTEGER;
    donation_amount DECIMAL;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations LOOP
        i := 0;

        FOR member_record IN
            SELECT id FROM public.members
            WHERE organization_id = org_record.id
            LIMIT 10
        LOOP
            -- Each member makes 3 donations
            FOR j IN 1..3 LOOP
                i := i + 1;

                -- Random fund
                SELECT id INTO fund_record
                FROM public.funds
                WHERE organization_id = org_record.id
                ORDER BY RANDOM()
                LIMIT 1;

                -- Random amount between 20 and 500
                donation_amount := (20 + (RANDOM() * 480))::DECIMAL(10,2);

                INSERT INTO public.donations (
                    id, organization_id, member_id, fund_id,
                    amount, currency, payment_method, status,
                    donation_date, transaction_id, notes
                ) VALUES (
                    gen_random_uuid(),
                    org_record.id,
                    member_record.id,
                    fund_record.id,
                    donation_amount,
                    'USD',
                    CASE (i % 4)
                        WHEN 0 THEN 'cash'
                        WHEN 1 THEN 'check'
                        WHEN 2 THEN 'card'
                        ELSE 'bank_transfer'
                    END,
                    'completed',
                    CURRENT_DATE - ((RANDOM() * 180)::INTEGER * INTERVAL '1 day'),
                    'TXN-' || LPAD(i::TEXT, 8, '0'),
                    CASE WHEN RANDOM() > 0.7 THEN 'Thank you for your generous donation!' ELSE NULL END
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 9. EDUCATION MODULE
-- ============================================
-- Create courses, classrooms, and teachers
DO $$
DECLARE
    org_record RECORD;
    course_id UUID;
    classroom_id UUID;
    teacher_id UUID;
    class_id UUID;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations LOOP
        -- Create 2 courses
        INSERT INTO public.courses (id, organization_id, name, description, level, is_active)
        VALUES
            (gen_random_uuid(), org_record.id, 'Quran Studies', 'Tajweed and memorization', 'beginner', true),
            (gen_random_uuid(), org_record.id, 'Arabic Language', 'Basic Arabic language course', 'intermediate', true);

        -- Create 3 classrooms
        INSERT INTO public.classrooms (id, organization_id, name, capacity, is_active)
        VALUES
            (gen_random_uuid(), org_record.id, 'Room A', 20, true),
            (gen_random_uuid(), org_record.id, 'Room B', 25, true),
            (gen_random_uuid(), org_record.id, 'Room C', 15, true);

        -- Create 3 teachers from existing members
        INSERT INTO public.teachers (
            id, organization_id, member_id,
            first_name, last_name, bio, is_active
        )
        SELECT
            gen_random_uuid(),
            m.organization_id,
            m.id,
            m.first_name,
            m.last_name,
            'Experienced Islamic educator',
            true
        FROM public.members m
        WHERE m.organization_id = org_record.id
        LIMIT 3;
    END LOOP;
END $$;

COMMIT;
