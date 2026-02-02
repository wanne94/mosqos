-- ============================================================================
-- MOSQOS - MIGRATION 00057: SEED TEST DATA
-- Description: Add test data for development
-- ============================================================================

-- Get admin user ID (admin@mosqos.com)
DO $$
DECLARE
    admin_user_id UUID;
    test_org_id UUID;
    test_member_id UUID;
BEGIN
    -- Find admin user
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@mosqos.com'
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found with email admin@mosqos.com';
        RETURN;
    END IF;

    RAISE NOTICE 'Found admin user: %', admin_user_id;

    -- Ensure admin is in platform_admins table
    INSERT INTO public.platform_admins (user_id, created_at)
    VALUES (admin_user_id, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Admin added to platform_admins';

    -- Create a test organization if none exists
    INSERT INTO public.organizations (
        name,
        slug,
        country_id,
        contact_email,
        status,
        is_active,
        approved_at
    )
    SELECT
        'Test Mosque',
        'test-mosque',
        (SELECT id FROM public.countries WHERE code = 'US' LIMIT 1),
        'test@mosque.com',
        'approved',
        true,
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.organizations WHERE slug = 'test-mosque'
    )
    RETURNING id INTO test_org_id;

    IF test_org_id IS NULL THEN
        SELECT id INTO test_org_id
        FROM public.organizations
        WHERE slug = 'test-mosque'
        LIMIT 1;
    END IF;

    RAISE NOTICE 'Test organization: %', test_org_id;

    -- Add admin as organization owner
    IF test_org_id IS NOT NULL THEN
        INSERT INTO public.organization_owners (organization_id, user_id)
        VALUES (test_org_id, admin_user_id)
        ON CONFLICT (organization_id, user_id) DO NOTHING;

        RAISE NOTICE 'Admin added as organization owner';

        -- Create a test member linked to admin
        INSERT INTO public.members (
            organization_id,
            user_id,
            first_name,
            last_name,
            email,
            role,
            is_active,
            membership_status
        )
        SELECT
            test_org_id,
            admin_user_id,
            'Admin',
            'User',
            'admin@mosqos.com',
            'member',
            true,
            'active'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.members
            WHERE organization_id = test_org_id AND user_id = admin_user_id
        )
        RETURNING id INTO test_member_id;

        RAISE NOTICE 'Test member created: %', test_member_id;

        -- Create a test imam
        INSERT INTO public.members (
            organization_id,
            first_name,
            last_name,
            email,
            role,
            is_active,
            membership_status
        )
        SELECT
            test_org_id,
            'Muhammad',
            'Ali',
            'imam@test.com',
            'imam',
            true,
            'active'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.members
            WHERE organization_id = test_org_id AND email = 'imam@test.com'
        );

        RAISE NOTICE 'Test imam created';

        -- Create some test members without user_id
        INSERT INTO public.members (
            organization_id,
            first_name,
            last_name,
            email,
            role,
            is_active,
            membership_status
        )
        SELECT
            test_org_id,
            'Ahmed',
            'Hassan',
            'ahmed@test.com',
            'member',
            true,
            'active'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.members
            WHERE organization_id = test_org_id AND email = 'ahmed@test.com'
        );

        INSERT INTO public.members (
            organization_id,
            first_name,
            last_name,
            email,
            role,
            is_active,
            membership_status
        )
        SELECT
            test_org_id,
            'Fatima',
            'Rahman',
            'fatima@test.com',
            'volunteer',
            true,
            'active'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.members
            WHERE organization_id = test_org_id AND email = 'fatima@test.com'
        );

        RAISE NOTICE 'Test members created';
    END IF;

END $$;

-- ============================================================================
-- END OF MIGRATION 00057
-- ============================================================================
