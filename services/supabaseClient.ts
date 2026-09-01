import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

const isValidHttpUrl = (value: string | undefined): value is string => {
    if (!value) return false;
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

if (!isValidHttpUrl(rawUrl) || !supabaseAnonKey) {
    // Fail loudly (but not fatally — see fallback below) so misconfiguration
    // is obvious in the console instead of a silently blank app.
    // eslint-disable-next-line no-console
    console.error(
        'Missing or invalid VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.local.example to ' +
        '.env.local and fill in your Supabase project credentials (Project Settings -> API).'
    );
}

// createClient() throws synchronously on an invalid URL, which — since this
// module is imported before React ever mounts — would crash the entire app
// to a blank white screen with no ErrorBoundary able to catch it. Falling
// back to a syntactically-valid-but-unreachable URL lets the app boot;
// every real network call will then fail gracefully through the normal
// try/catch/error-state handling in services/db.ts and AuthContext instead.
export const supabase = createClient(
    isValidHttpUrl(rawUrl) ? rawUrl : 'https://placeholder.invalid',
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    }
);

export default supabase;
