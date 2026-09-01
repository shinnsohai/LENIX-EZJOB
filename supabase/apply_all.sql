-- ============================================================================
-- EZJOB: combined migration (0001-0005), generated for one-shot paste into
-- the Supabase SQL Editor. The source of truth is migrations/*.sql, applied
-- in order via the Supabase CLI (supabase db push) if you have it installed;
-- this file exists purely as a copy-paste convenience for the dashboard.
-- ============================================================================

-- ---- migrations/0001_schema.sql ----
-- EZJOB core schema
-- Replaces the Firestore collections described in instructions/03-firestore-schema.md
-- with real Postgres tables + foreign keys + constraints.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, id == auth.users.id
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  identifier  text not null,
  role        text not null check (role in ('WORKER', 'EMPLOYER', 'ADMIN')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- worker_profiles: the "Skill Passport"
-- ---------------------------------------------------------------------------
create table public.worker_profiles (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references public.profiles(id) on delete cascade,
  full_name              text not null,
  trade_or_skill         text not null default 'General',
  experience_years       integer not null default 0,
  cv_url                 text,
  summary                text,
  bio                    text,
  composite_score        integer,
  country_of_origin      text not null default 'Unknown',
  experience_in_country  integer not null default 0,
  photo_url              text,
  status                 text not null default 'Active' check (status in ('Active', 'Suspended')),
  physical_attributes    jsonb not null default '{}'::jsonb,
  media_links            jsonb not null default '{}'::jsonb,
  trade_specifics        jsonb not null default '{}'::jsonb,
  history                jsonb not null default '{}'::jsonb,
  is_verified            boolean not null default false,
  skills                 jsonb not null default '[]'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index worker_profiles_status_idx on public.worker_profiles (status);
create index worker_profiles_country_idx on public.worker_profiles (country_of_origin);

create table public.worker_projects (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.worker_profiles(id) on delete cascade,
  project_name  text not null,
  role          text not null,
  year_start    integer,
  year_end      integer,
  description   text,
  created_at    timestamptz not null default now()
);

create table public.worker_certifications (
  id             uuid primary key default gen_random_uuid(),
  worker_id      uuid not null references public.worker_profiles(id) on delete cascade,
  cert_name      text not null,
  expiry_date    date,
  document_url   text,
  created_at     timestamptz not null default now()
);

create table public.worker_references (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.worker_profiles(id) on delete cascade,
  name          text not null,
  contact       text,
  relationship  text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- employer_profiles
-- ---------------------------------------------------------------------------
create table public.employer_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.profiles(id) on delete cascade,
  company_name       text not null,
  description        text,
  website_url        text,
  phone              text,
  industry           text,
  location           text,
  company_size       text,
  year_founded       integer,
  company_logo_url   text,
  status             text not null default 'Active' check (status in ('Active', 'Suspended')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  employer_id      uuid not null references public.profiles(id) on delete cascade,
  employer_name    text not null,
  title            text not null,
  description      text not null default '',
  required_skills  text[] not null default '{}',
  status           text not null default 'Active' check (status in ('Active', 'On Hold', 'Closed')),
  location         text not null default '',
  country          text not null default '',
  salary_min       integer not null default 0,
  salary_max       integer not null default 0,
  currency         text default 'SGD',
  created_at       timestamptz not null default now(),
  constraint jobs_salary_range_ck check (salary_max >= salary_min)
);
create index jobs_status_idx on public.jobs (status);
create index jobs_employer_id_idx on public.jobs (employer_id);

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  worker_id       uuid not null references public.profiles(id) on delete cascade,
  employer_id     uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'Submitted'
                    check (status in ('Submitted', 'Viewed', 'Shortlisted', 'Rejected', 'Withdrawn')),
  job_title       text not null,
  employer_name   text not null,
  location        text not null default '',
  applied_at      timestamptz not null default now(),
  unique (job_id, worker_id)
);
create index applications_worker_id_idx on public.applications (worker_id);
create index applications_employer_id_idx on public.applications (employer_id);
create index applications_job_id_idx on public.applications (job_id);

-- ---------------------------------------------------------------------------
-- blog_posts
-- ---------------------------------------------------------------------------
create table public.blog_posts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  content        text not null default '',
  image_url      text,
  author         text not null default '',
  publish_date   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- site_content: one consistent jsonb blob per CMS-managed content key
-- (replaces the array-wrapped-vs-bare-object inconsistency in the old
--  Firestore siteContent collection)
-- ---------------------------------------------------------------------------
create table public.site_content (
  id          text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- ---- migrations/0002_functions_triggers.sql ----
-- Helper functions + triggers.
-- search_path is pinned to '' on every SECURITY DEFINER function per Supabase's
-- RLS best-practice guidance, with all references schema-qualified.

-- ---------------------------------------------------------------------------
-- is_admin(): used throughout RLS policies as the admin-override check.
-- Reads the profiles table (not JWT claims, which a user could otherwise
-- tamper with) for the currently authenticated user.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user(): populates public.profiles automatically whenever a new
-- row is inserted into auth.users. The role + identifier are supplied via
-- the signUp() call's `options.data` (raw_user_meta_data). Defaults to
-- WORKER / the user's email if not supplied, so this never fails signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, identifier, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'identifier', new.email, new.id::text),
    coalesce(new.raw_user_meta_data ->> 'role', 'WORKER')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- generic updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger worker_profiles_set_updated_at
  before update on public.worker_profiles
  for each row execute function public.set_updated_at();

create trigger employer_profiles_set_updated_at
  before update on public.employer_profiles
  for each row execute function public.set_updated_at();

create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

-- ---- migrations/0003_rls_policies.sql ----
-- Row Level Security. Enabled on every table — nothing in this app is
-- reachable without an explicit policy. This is what makes the old app's
-- "admin bypass via sessionStorage" and "delete doesn't persist" bugs
-- structurally impossible: there is no client code path that can violate
-- these policies, only the database enforces them.

alter table public.profiles                enable row level security;
alter table public.worker_profiles          enable row level security;
alter table public.worker_projects          enable row level security;
alter table public.worker_certifications    enable row level security;
alter table public.worker_references        enable row level security;
alter table public.employer_profiles        enable row level security;
alter table public.jobs                     enable row level security;
alter table public.applications             enable row level security;
alter table public.blog_posts               enable row level security;
alter table public.site_content             enable row level security;
alter table public.newsletter_subscribers   enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- Prevent a non-admin from granting themselves a different role via the
-- update policy above (RLS's WITH CHECK can't diff old vs new values, so
-- this is enforced with a trigger instead).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- No client-side insert policy: rows are created exclusively by the
-- handle_new_user() trigger (SECURITY DEFINER), which bypasses RLS.
-- No delete policy: profiles are removed via auth.users cascade only.

-- ---------------------------------------------------------------------------
-- worker_profiles (public read for search; owner or admin writes)
-- ---------------------------------------------------------------------------
create policy "worker_profiles_select_public"
  on public.worker_profiles for select
  using (true);

create policy "worker_profiles_insert_own"
  on public.worker_profiles for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'WORKER')
  );

create policy "worker_profiles_update_own_or_admin"
  on public.worker_profiles for update
  using (user_id = auth.uid() or public.is_admin());

create policy "worker_profiles_delete_admin_only"
  on public.worker_profiles for delete
  using (public.is_admin());

-- worker_projects / worker_certifications / worker_references share the same
-- shape: public read, writes gated by ownership of the parent worker_profile.
create policy "worker_projects_select_public"
  on public.worker_projects for select using (true);
create policy "worker_projects_write_owner_or_admin"
  on public.worker_projects for all
  using (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  );

create policy "worker_certifications_select_public"
  on public.worker_certifications for select using (true);
create policy "worker_certifications_write_owner_or_admin"
  on public.worker_certifications for all
  using (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  );

create policy "worker_references_select_public"
  on public.worker_references for select using (true);
create policy "worker_references_write_owner_or_admin"
  on public.worker_references for all
  using (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- employer_profiles (public read; owner or admin writes)
-- ---------------------------------------------------------------------------
create policy "employer_profiles_select_public"
  on public.employer_profiles for select
  using (true);

create policy "employer_profiles_insert_own"
  on public.employer_profiles for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'EMPLOYER')
  );

create policy "employer_profiles_update_own_or_admin"
  on public.employer_profiles for update
  using (user_id = auth.uid() or public.is_admin());

create policy "employer_profiles_delete_admin_only"
  on public.employer_profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- jobs (public read of Active jobs; owner sees/manages their own regardless
-- of status; admin sees/manages everything)
-- ---------------------------------------------------------------------------
create policy "jobs_select_active_or_owner_or_admin"
  on public.jobs for select
  using (status = 'Active' or employer_id = auth.uid() or public.is_admin());

create policy "jobs_insert_own"
  on public.jobs for insert
  with check (
    employer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'EMPLOYER')
  );

create policy "jobs_update_own_or_admin"
  on public.jobs for update
  using (employer_id = auth.uid() or public.is_admin());

create policy "jobs_delete_own_or_admin"
  on public.jobs for delete
  using (employer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- applications (visible to the applicant, the job's employer, or admin)
-- ---------------------------------------------------------------------------
create policy "applications_select_participant_or_admin"
  on public.applications for select
  using (worker_id = auth.uid() or employer_id = auth.uid() or public.is_admin());

create policy "applications_insert_own"
  on public.applications for insert
  with check (
    worker_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'WORKER')
  );

-- Status transitions are validated at the application layer (services/db.ts);
-- both participants may update shared fields (e.g. status) on their own
-- application/job.
create policy "applications_update_participant_or_admin"
  on public.applications for update
  using (worker_id = auth.uid() or employer_id = auth.uid() or public.is_admin());

create policy "applications_delete_admin_only"
  on public.applications for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- blog_posts / site_content (public read, admin-only writes)
-- ---------------------------------------------------------------------------
create policy "blog_posts_select_public"
  on public.blog_posts for select using (true);
create policy "blog_posts_write_admin_only"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "site_content_select_public"
  on public.site_content for select using (true);
create policy "site_content_write_admin_only"
  on public.site_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- newsletter_subscribers (anyone can subscribe; only admins can read/manage)
-- ---------------------------------------------------------------------------
create policy "newsletter_insert_anyone"
  on public.newsletter_subscribers for insert
  with check (true);

create policy "newsletter_select_admin_only"
  on public.newsletter_subscribers for select
  using (public.is_admin());

create policy "newsletter_delete_admin_only"
  on public.newsletter_subscribers for delete
  using (public.is_admin());

-- ---- migrations/0004_storage.sql ----
-- Storage buckets + object policies.
--
-- Owner-scoped buckets use the path convention "{auth.uid()}/{filename}" —
-- the standard Supabase storage-RLS pattern of gating on the first path
-- segment. All buckets are public-read (matching the original Firebase
-- Storage behaviour of a public download URL); writes are owner- or
-- admin-restricted. CVs/cert docs could be moved to private + signed URLs
-- later if stricter access control is needed.

insert into storage.buckets (id, name, public) values
  ('worker-photos',   'worker-photos',   true),
  ('worker-cvs',       'worker-cvs',      true),
  ('worker-cert-docs', 'worker-cert-docs', true),
  ('employer-logos',  'employer-logos',  true),
  ('blog-images',     'blog-images',     true),
  ('site-assets',     'site-assets',     true)
on conflict (id) do nothing;

-- Owner-scoped buckets: any authenticated user may read; only the owner
-- (first path segment == their uid) or an admin may write/delete.
do $$
declare
  b text;
begin
  foreach b in array array['worker-photos', 'worker-cvs', 'worker-cert-docs', 'employer-logos']
  loop
    execute format(
      'create policy "%1$s_select_public" on storage.objects for select using (bucket_id = %2$L);',
      b, b
    );
    execute format(
      'create policy "%1$s_write_owner_or_admin" on storage.objects for insert
         with check (bucket_id = %2$L and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));',
      b, b
    );
    execute format(
      'create policy "%1$s_update_owner_or_admin" on storage.objects for update
         using (bucket_id = %2$L and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));',
      b, b
    );
    execute format(
      'create policy "%1$s_delete_owner_or_admin" on storage.objects for delete
         using (bucket_id = %2$L and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));',
      b, b
    );
  end loop;
end $$;

-- Admin-managed buckets: public read, admin-only write.
do $$
declare
  b text;
begin
  foreach b in array array['blog-images', 'site-assets']
  loop
    execute format(
      'create policy "%1$s_select_public" on storage.objects for select using (bucket_id = %2$L);',
      b, b
    );
    execute format(
      'create policy "%1$s_write_admin_only" on storage.objects for all
         using (bucket_id = %2$L and public.is_admin())
         with check (bucket_id = %2$L and public.is_admin());',
      b, b
    );
  end loop;
end $$;

-- ---- migrations/0005_seed.sql ----
-- Seed data for public.site_content and public.blog_posts.
-- This replaces the old app's runtime "seed on first anonymous page load"
-- behaviour (SiteContentContext used to call saveSiteContent() from any
-- visitor's browser the first time a doc was missing) with a one-time,
-- reviewable migration. site_content.data holds the content value directly
-- (array or object) — no more Firestore's array-wrapper-vs-bare-object split.

insert into public.site_content (id, data) values
('quickLinks', $json$[
  {"id": "ql1", "text": "About Us", "url": "/about"},
  {"id": "ql2", "text": "Contact", "url": "/contact"},
  {"id": "ql3", "text": "Careers", "url": "/careers"},
  {"id": "ql4", "text": "Blog", "url": "/blog"}
]$json$::jsonb),

('legalPages', $json$
{
  "privacyPolicy": "Your privacy is important to us. It is EZJOB by LENIX's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate. We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.",
  "termsOfService": "By accessing the website at EZJOB by LENIX, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law."
}
$json$::jsonb),

('aboutPage', $json$
{
  "title": "About EZJOB by LENIX",
  "paragraph1": "EZJOB by LENIX was engineered with a clear mission: to accelerate and empower the skilled trades and technical workforce through state-of-the-art AI matching and verified digital credentialing.",
  "paragraph2": "We eliminate friction in industrial staffing by fusing precision matchmaking with structural integrity.",
  "paragraph3": "By combining the LENIX intelligence engine with verified Skill Passports, workers showcase authenticated certifications and real-world project portfolios, while employers fill critical roles with unmatched speed.",
  "paragraph4": "Whether you are a certified heavy equipment operator, an electrical specialist, or a tier-1 general contractor, EZJOB by LENIX is your enterprise partner for high-performance workforce solutions."
}
$json$::jsonb),

('contactPage', $json$
{
  "title": "Contact EZJOB by LENIX",
  "intro": "Have inquiries about enterprise matching, custom integrations, or skilled workforce verification? Connect directly with our team.",
  "email": "support@lenix.ai",
  "phone": "+65 6800 5800",
  "addressLine1": "LENIX Innovation Hub, 100 Marina Boulevard",
  "addressLine2": "Singapore 018983"
}
$json$::jsonb),

('careersPage', $json$
{
  "title": "Careers at LENIX",
  "intro": "Join our team building the next generation of AI-powered workforce intelligence and skilled trade infrastructure.",
  "openRolesTitle": "Current Opportunities",
  "openRolesText": "We are expanding our AI engineering and talent verification teams. Reach out with your portfolio to",
  "resumeEmail": "careers@lenix.ai"
}
$json$::jsonb),

('homepage', $json$
{
  "hero": {
    "headline": "Engineering the Future of Work. Instant AI-Powered Matching.",
    "subheadline": "EZJOB by LENIX matches elite industrial and technical talent with leading enterprises in real-time."
  },
  "testimonials": [
    {"id": "t1", "quote": "Matched and deployed 5 certified structural welders within 24 hours. The AI compatibility score was spot-on.", "author": "— Regional Project Director, Singapore"},
    {"id": "t2", "quote": "My verified Skill Passport got me hired on a tier-1 energy project with zero paperwork hassle.", "author": "— Senior Heavy Equipment Specialist, Malaysia"},
    {"id": "t3", "quote": "The integrity verification saved our site compliance team hundreds of vetting hours.", "author": "— VP of Talent Acquisition, Infrastructure Corp"}
  ],
  "faqs": [
    {"id": "f1", "q": "What is EZJOB by LENIX?", "a": "EZJOB by LENIX is an AI-driven recruitment and skill verification platform specifically engineered for the skilled trades, construction, electrical, and heavy industrial sectors."},
    {"id": "f2", "q": "How does the Digital Skill Passport work?", "a": "Workers build a verified digital passport featuring credentials, certifications, video demos, and track records. The system computes a profile integrity score that fast-tracks placement."},
    {"id": "f3", "q": "How does the AI Job Studio help employers?", "a": "Employers can type simple job parameters, and our Gemini-powered engine instantly crafts comprehensive, industry-tailored job requisitions and candidate match criteria."},
    {"id": "f4", "q": "Is the platform secure and compliant?", "a": "Yes. We utilize enterprise Supabase (Postgres) infrastructure with row-level security, strict data access policies, and verified identity workflows."}
  ]
}
$json$::jsonb),

('assets', $json$
{
  "logoUrl": "/assets/lenix-logo-light.png",
  "heroBackgroundUrl": ""
}
$json$::jsonb)

on conflict (id) do nothing;

insert into public.blog_posts (id, title, content, image_url, author, publish_date) values
(
  gen_random_uuid(),
  'Top 10 High-Velocity Construction & Engineering Jobs',
  'An in-depth look at the most in-demand roles in the industrial sector, from structural engineers to certified heavy machinery operators. We explore salary expectations and required certifications.',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
  'LENIX Intelligence Team',
  '2025-08-15T10:00:00Z'
),
(
  gen_random_uuid(),
  'How LENIX AI Engine Is Revolutionizing Skilled Trades Recruitment',
  'Discover how precision matching and verified skill passports connect top industrial talent with infrastructure projects in minutes rather than weeks.',
  'https://images.unsplash.com/photo-1678453140515-aa21c81c2dfd?q=80&w=2070&auto=format&fit=crop',
  'LENIX AI Labs',
  '2025-08-10T14:30:00Z'
),
(
  gen_random_uuid(),
  'Workforce Mobility & Skill Passport Standards',
  'A comprehensive guide to digital trade credentialing and cross-border project deployment across Singapore, Malaysia, and regional hubs.',
  'https://images.unsplash.com/photo-1560942485-b2a1a20628fd?q=80&w=1935&auto=format&fit=crop',
  'LENIX Standards Board',
  '2025-08-05T09:00:00Z'
)
on conflict do nothing;
