-- ============================================
-- CREATE PLATFORM ADMIN USER
-- ============================================
-- This script creates a test platform admin user for development
-- ============================================

-- 1. Create auth user
-- Note: You'll need to run this through Supabase Studio or manually
-- because anon key doesn't have permission to create users

-- For local development, you can manually create a user through:
-- Supabase Studio > Authentication > Users > "Add User"
--
-- Email: admin@mosqos.com
-- Password: Admin123!
--
-- Then get the user_id from the auth.users table and use it below

-- 2. Add user to platform_admins table
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from auth.users
INSERT INTO public.platform_admins (id, user_id, is_super_admin, created_at)
VALUES
    (gen_random_uuid(), 'YOUR_USER_ID_HERE', true, NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- ALTERNATIVE: Query to check existing users
-- ============================================
-- Run this to see if you have any auth users:
-- SELECT id, email, created_at FROM auth.users;
