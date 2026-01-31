import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Using placeholder values for development.')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

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
