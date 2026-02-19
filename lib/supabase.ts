import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Do not throw at module load so that next build succeeds without env. Runtime calls will fail if env is missing in production.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
