import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
    // Fail loudly at startup rather than letting every call silently 401 later.
    // eslint-disable-next-line no-console
    console.error(
        'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local ' +
        'and fill in your Supabase project credentials (Project Settings -> API).'
    );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

export default supabase;
