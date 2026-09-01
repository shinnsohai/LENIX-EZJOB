import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No secrets are injected here. Supabase's URL/anon key are read via
// Vite's built-in `VITE_`-prefixed env var handling (import.meta.env),
// which is safe to ship client-side — Postgres Row Level Security is the
// actual access-control boundary, not secrecy of the anon key. The Gemini
// API key and the Supabase service-role key are server-only and are never
// referenced from client code or this config (see api/*.ts).
export default defineConfig({
    server: {
        port: Number(process.env.PORT) || 3000,
        host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
