import { createClient } from '@supabase/supabase-js';

console.log('[DEBUG] supabaseClient: Initializing Supabase client');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[DEBUG] supabaseClient: URL present:', !!supabaseUrl);
console.log('[DEBUG] supabaseClient: Anon key present:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[DEBUG] supabaseClient: Missing environment variables!');
  throw new Error('Missing Supabase environment variables');
}

console.log('[DEBUG] supabaseClient: Creating Supabase client');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('[DEBUG] supabaseClient: Client created successfully');
