import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Using placeholder values for development.')
}

// In development mode with service role key, bypass RLS for easier testing
// WARNING: NEVER use service role key in production!
export const isDevMode = import.meta.env.DEV
const shouldBypassRLS = isDevMode && supabaseServiceRoleKey

if (shouldBypassRLS) {
  console.warn('🚨 DEV MODE: Using service role key - RLS is BYPASSED for all queries')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  shouldBypassRLS ? supabaseServiceRoleKey : (supabaseAnonKey || 'placeholder-key'),
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Export for conditional logic in services
export const rlsBypassed = shouldBypassRLS

// Helper to check if Supabase is configured with real values (not placeholders)
export const isSupabaseConfigured = () => {
  const isRealUrl = supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    (supabaseUrl.includes('.supabase.co') || supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'))
  const isRealKey = supabaseAnonKey &&
    supabaseAnonKey !== 'placeholder-key' &&
    supabaseAnonKey.length > 20
  return Boolean(isRealUrl && isRealKey)
}
