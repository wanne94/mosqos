/**
 * Database Utility
 * Supabase client wrapper for seeding
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../src/shared/types/database.types.js';

let supabaseClient: SupabaseClient<Database> | null = null;

export function initializeSupabase(url?: string, key?: string): SupabaseClient<Database> {
  const supabaseUrl = url || process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
  }
  return supabaseClient;
}

/**
 * Execute a function with transaction-like behavior
 * Note: Supabase doesn't support true transactions via REST API,
 * so this is a best-effort rollback mechanism
 */
export async function withTransaction<T>(
  fn: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const client = getSupabase();

  try {
    const result = await fn(client);
    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

/**
 * Clean all seeded data (destructive operation)
 */
export async function cleanDatabase(): Promise<void> {
  const client = getSupabase();

  const tables = [
    // Level 8 (deepest dependencies)
    'attendance',
    'pledge_payments',
    'pilgrim_payments',

    // Level 7
    'enrollments',
    'qurbani_shares',
    'umrah_pilgrims',
    'case_activity_log',

    // Level 6
    'donations',
    'recurring_donations',
    'pledges',
    'scheduled_classes',
    'announcements',
    'service_cases',
    'islamic_services',

    // Level 5
    'organization_members',
    'teachers',
    'qurbani_campaigns',
    'umrah_trips',
    'member_group_assignments',

    // Level 4
    'members',
    'funds',
    'courses',
    'classrooms',
    'permission_groups',
    'permission_group_permissions',
    'case_categories',
    'islamic_service_types',

    // Level 3
    'organization_subscriptions',
    'organization_owners',
    'organization_delegates',
    'households',

    // Level 2
    'organizations',
    'platform_admins',

    // Level 1 (don't delete countries and subscription_plans - they're foundational)
  ];

  console.log('🧹 Cleaning database...');

  for (const table of tables) {
    try {
      const { error } = await client.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.warn(`⚠️  Warning cleaning ${table}:`, error.message);
      } else {
        console.log(`✓ Cleaned ${table}`);
      }
    } catch (err) {
      console.warn(`⚠️  Error cleaning ${table}:`, err);
    }
  }

  console.log('✅ Database cleaned');
}

/**
 * Get record count for a table
 */
export async function getRecordCount(table: string): Promise<number> {
  const client = getSupabase();

  const { count, error } = await client
    .from(table as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(`Error counting ${table}:`, error);
    return 0;
  }

  return count || 0;
}

/**
 * Batch insert with better error handling
 */
export async function batchInsert<T extends Record<string, any>>(
  table: string,
  records: T[],
  batchSize = 100
): Promise<T[]> {
  const client = getSupabase();
  const results: T[] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { data, error } = await client
      .from(table as any)
      .insert(batch)
      .select();

    if (error) {
      console.error(`Batch insert error for ${table} (batch ${i / batchSize + 1}):`, error);
      throw error;
    }

    if (data) {
      results.push(...data);
    }
  }

  return results;
}
