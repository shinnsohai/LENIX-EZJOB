# EZJOB by LENIX

AI-assisted job board connecting skilled-trades workers with employers: a
worker "Skill Passport" (verified profile, projects, certifications,
references), employer job postings + applicant management, and an admin CMS.

**Stack:** React 19 + TypeScript + Vite, [Supabase](https://supabase.com)
(Postgres + Auth + Storage, Row Level Security throughout), Vercel
(static hosting + serverless functions for anything that must stay
server-side, e.g. the Gemini API key), deployed on Vercel.

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

3. **Apply the database schema.** Either:
   - Supabase CLI: `supabase link --project-ref <your-project-ref>` then `supabase db push` (applies `supabase/migrations/*.sql` in order), or
   - Dashboard: open the SQL Editor and paste/run `supabase/apply_all.sql` (a one-shot concatenation of the same migrations, for convenience).

4. **Copy env vars**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in from your Supabase project's **Settings → API**:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — safe to expose client-side; Postgres RLS is the actual access-control boundary.
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only, used by `api/admin/delete-user.ts`. Never prefix a secret with `VITE_` — Vite ships anything with that prefix straight into the client bundle.
   - `GEMINI_API_KEY` — from [aistudio.google.com](https://aistudio.google.com), server-only, used by `api/ai/generate-job-details.ts`.

5. **Run it**
   ```bash
   npm run dev       # Vite dev server (frontend only)
   npm run typecheck # tsc --noEmit
   npm run build      # production build
   ```
   To exercise the `/api/*` serverless functions locally too, use the Vercel CLI instead of plain `vite`: `vercel dev` (reads the same `.env.local`).

## Deploying to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel link              # first time: creates/links a Vercel project
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY
vercel --prod
```
`vercel.json` sets the Vite framework preset and a SPA rewrite (all
non-`/api` routes serve `index.html`, since this is a client-side-routed
React Router app).

## Project structure

- `pages/`, `components/`, `contexts/` — the React app.
- `services/db.ts` — the entire Postgres/Supabase data-access layer (auth stays in `contexts/AuthContext.tsx`).
- `services/geminiService.ts` — thin client for the AI endpoints below; no API key here.
- `api/` — Vercel serverless functions: `ai/generate-job-details.ts` (Gemini proxy), `admin/delete-user.ts` (privileged, service-role-key account deletion, re-verifies the caller is an admin server-side).
- `supabase/migrations/` — the database schema, RLS policies, storage buckets, and seed data, in apply order.
- `instructions/` — the original product/architecture notes this app was scaffolded from (Firebase-era; superseded by the above where they conflict).

## Security model

Every table has Row Level Security enabled — there is no client code path
that can read or write data it isn't entitled to; the database enforces it,
not the frontend. Admin status lives in `profiles.role`, checked via a
`SECURITY DEFINER` `is_admin()` helper, never via a client-settable flag.
